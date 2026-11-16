import assert from 'assert';
import fs from 'fs';
import ws from 'ws';
(globalThis as any).WebSocket = ws;

import { EmailNotificationService, MockStorageService } from '../src/lib/supabase';

// Safely resolve key from environment or local gitignored .env
const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const match = envContent.match(/RESEND_API_KEY=([^\s\r\n]+)/);
const REAL_KEY = process.env.RESEND_API_KEY || match?.[1] || '';

async function testResendIntegration() {
  console.log('--- Testing Resend Configuration & Multi-Provider Switcher ---');

  // 1. Initial State
  const initialConfig = MockStorageService.getSystemConfig();
  console.log('1. Initial Email Provider:', initialConfig.email_provider || 'default');

  // 2. Save Resend Configuration with resolved key
  EmailNotificationService.saveResendConfig(REAL_KEY, 'KAPLA Operations <no-reply@kapla.io.vn>');
  const updatedConfig = MockStorageService.getSystemConfig();
  assert.strictEqual(updatedConfig.email_provider, 'resend', 'Provider should be set to resend');
  assert.strictEqual(updatedConfig.resend_sender, 'KAPLA Operations <no-reply@kapla.io.vn>', 'Sender address must match');
  console.log('  ✅ [PASS] Resend Config saved successfully');

  // 3. Verify getSenderEmail reflects Resend when configured
  const activeSender = EmailNotificationService.getSenderEmail();
  assert.strictEqual(activeSender, 'KAPLA Operations <no-reply@kapla.io.vn>', 'Active sender should be custom domain');
  console.log('  ✅ [PASS] Active sender reflects Resend domain sender:', activeSender);

  // 4. Test API Endpoint with real Resend API Key (Domain kapla.io.vn verified!)
  console.log('4. Testing API /api/send-email with verified Resend key...');
  const response = await fetch('http://localhost:3000/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: ['kapladashboard@gmail.com'],
      subject: '[Test Resend Live] Verification alert via no-reply@kapla.io.vn',
      title: 'Resend Live Verification',
      text: 'Automated test dispatch validating live domain authenticated transmission.',
      provider: 'resend',
      resendApiKey: REAL_KEY,
      resendSender: 'KAPLA Operations <no-reply@kapla.io.vn>',
    }),
  });

  assert.strictEqual(response.status, 200, 'HTTP Status should be 200');
  const result = await response.json();
  assert.strictEqual(result.success, true, 'Delivery result must be success true');
  assert.strictEqual(result.provider, 'resend', 'Engine should be real resend');
  console.log('  ✅ [PASS] API response success:', result.success, 'Engine used:', result.provider, 'Message ID:', result.messageId);

  console.log('  ✅ [PASS] All Resend Transactional Email checks passed 100%!');
}

testResendIntegration().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
