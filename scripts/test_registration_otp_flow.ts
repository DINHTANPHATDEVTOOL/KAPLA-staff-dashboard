import { RegistrationOtpService } from '../src/lib/otpService';
import { MockStorageService } from '../src/lib/supabase';

async function main() {
  console.log('🚀 Testing Real Staff Registration with Email OTP Verification...');

  const testUser = {
    fullName: 'Robert Christopher',
    email: 'robert.christopher@kapla.edu.vn',
    phone: '0912 345 678',
    password: 'Password@2026',
    preferredBranchId: 'a0000000-0000-0000-0000-000000000001',
  };

  // 1. Generate & Send OTP
  console.log(`\nStep 1: Generating and sending OTP to ${testUser.email}...`);
  const sendRes = await RegistrationOtpService.generateAndSendOtp(testUser);
  if (!sendRes.success) {
    throw new Error(`Failed to send OTP: ${sendRes.error}`);
  }
  console.log(`✅ OTP generated successfully! Preview OTP: ${sendRes.otpPreview}`);

  // 2. Verify pending registration stored
  const pending = RegistrationOtpService.getPending();
  if (!pending || pending.email !== testUser.email.toLowerCase()) {
    throw new Error('Pending registration not stored in session storage.');
  }
  console.log(`✅ Pending registration verified: ${pending.fullName} (${pending.email}), OTP: ${pending.otp}`);

  // 3. Test Invalid OTP
  console.log('\nStep 2: Testing incorrect OTP verification...');
  const invalidRes = RegistrationOtpService.verifyOtp('000000');
  if (invalidRes.success) {
    throw new Error('Verification should have failed with incorrect OTP!');
  }
  console.log(`✅ Incorrect OTP properly rejected: "${invalidRes.error}"`);

  // 4. Test Correct OTP
  console.log('\nStep 3: Testing correct OTP verification...');
  const validRes = RegistrationOtpService.verifyOtp(pending.otp);
  if (!validRes.success || !validRes.payload) {
    throw new Error(`Verification failed with valid OTP: ${validRes.error}`);
  }
  console.log(`✅ OTP verification passed for ${validRes.payload.fullName}!`);

  // 5. Test Account Creation in MockStorage
  console.log('\nStep 4: Registering profile in database...');
  const profiles = MockStorageService.getProfiles();
  const newProfile = {
    id: `u-test-${Date.now()}`,
    email: validRes.payload.email,
    full_name: validRes.payload.fullName,
    phone: validRes.payload.phone,
    preferred_branch_id: validRes.payload.preferredBranchId,
    system_role: 'staff' as const,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
  };
  profiles.push(newProfile);
  MockStorageService.saveProfiles(profiles);

  const reloaded = MockStorageService.getProfiles();
  const created = reloaded.find((p) => p.email === testUser.email.toLowerCase());
  if (!created || created.status !== 'pending') {
    throw new Error('Registered user not found in database.');
  }
  console.log(`✅ User registered in system with pending status: ${created.full_name} (${created.email})`);

  console.log('\n🎉 ALL REGISTRATION OTP FLOW CHECKS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
