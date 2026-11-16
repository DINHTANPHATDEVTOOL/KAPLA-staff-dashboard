import assert from 'assert';
import ws from 'ws';
(globalThis as any).WebSocket = ws;

import { EmailNotificationService, MockStorageService } from '../src/lib/supabase';

async function testResendIntegration() {
  console.log('--- Testing Resend Configuration & Multi-Provider Switcher ---');

  // 1. Initial State
  const initialConfig = MockStorageService.getSystemConfig();
  console.log('1. Initial Email Provider:', initialConfig.email_provider || 'default');

  // 2. Save Resend Configuration
  EmailNotificationService.saveResendConfig('re_mock_test_key_12345', 'KAPLA Operations <no-reply@kapla.io.vn>');
  const updatedConfig = MockStorageService.getSystemConfig();
  assert.strictEqual(updatedConfig.email_provider, 'resend', 'Provider should be set to resend');
  assert.strictEqual(updatedConfig.resend_api_key, 're_mock_test_key_12345', 'API key must match');
  assert.strictEqual(updatedConfig.resend_sender, 'KAPLA Operations <no-reply@kapla.io.vn>', 'Sender address must match');
  console.log('  ✅ [PASS] Resend Config saved successfully');

  // 3. Verify getSenderEmail reflects Resend when configured
  const activeSender = EmailNotificationService.getSenderEmail();
  assert.strictEqual(activeSender, 'KAPLA Operations <no-reply@kapla.io.vn>', 'Active sender should be custom domain');
  console.log('  ✅ [PASS] Active sender reflects Resend domain sender:', activeSender);

  // 4. Test API Endpoint Fallback with non-existent Resend key (should gracefully fallback to Google SMTP)
  console.log('4. Testing API /api/send-email with mock Resend key (expecting graceful fallback to Google SMTP)...');
  const response = await fetch('http://localhost:3000/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: ['staff@kapla.edu.vn'],
      subject: '[Test Resend Fallback] Verification alert',
      title: 'Resend Verification',
      text: 'Testing graceful fallback behavior',
      provider: 'resend',
      resendApiKey: 're_test_dummy_key',
      resendSender: 'KAPLA Operations <no-reply@kapla.io.vn>',
    }),
  });

  assert.strictEqual(response.status, 200, 'HTTP Status should be 200 via fallback');
  const result = await response.json();
  assert.strictEqual(result.success, true, 'Delivery result must be success true');
  console.log('  ✅ [PASS] API response success:', result.success, 'Engine used:', result.provider || 'fallback');

  // 5. Revert back to test-friendly default if needed or keep clean
  EmailNotificationService.saveResendConfig('', 'KAPLA Operations <no-reply@kapla.io.vn>');
  console.log('  ✅ [PASS] All Resend Transactional Email checks passed 100%!');
}

testResendIntegration().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
