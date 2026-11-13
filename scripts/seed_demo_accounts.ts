// ==============================================================================
// KAPLA — Seed Demo Accounts for Interactive Testing
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as any).WebSocket = WebSocket;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001';
const BRANCH_BT_ID = 'a0000000-0000-0000-0000-000000000002';

const DEMO_ACCOUNTS = [
  {
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Quản trị viên Hệ Thống',
    systemRole: 'system_admin' as const,
    branchId: BRANCH_PH_ID,
    role: 'CM' as const,
    title: '👑 Quản trị hệ thống (Toàn quyền)',
  },
  {
    email: 'cm.phamhung@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Hoàng Minh Tuấn (CM Phạm Hùng)',
    systemRole: 'staff' as const,
    branchId: BRANCH_PH_ID,
    role: 'CM' as const,
    title: 'Giám đốc cơ sở KAPLA Phạm Hùng',
  },
  {
    email: 'cm.binhtan@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Lê Hoàng Long (CM Bình Tân)',
    systemRole: 'staff' as const,
    branchId: BRANCH_BT_ID,
    role: 'CM' as const,
    title: 'Giám đốc cơ sở KAPLA Bình Tân',
  },
  {
    email: 'hrt.mai@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Võ Tuyết Mai (HRT Phạm Hùng)',
    systemRole: 'staff' as const,
    branchId: BRANCH_PH_ID,
    role: 'HRT' as const,
    title: 'Nhân viên HRT phụ trách lớp A1',
  },
  {
    email: 'hrt.linh@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Trần Gia Linh (HRT Riêng)',
    systemRole: 'staff' as const,
    branchId: BRANCH_PH_ID,
    role: 'HRT' as const,
    title: 'Nhân viên HRT phụ trách riêng học viên An',
  },
  {
    email: 'teacher.ph@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Nguyễn Văn Hùng (Teacher PH)',
    systemRole: 'staff' as const,
    branchId: BRANCH_PH_ID,
    role: 'Main Teacher' as const,
    title: 'Giáo viên chính chi nhánh Phạm Hùng',
  },
];

async function seedDemoAccounts() {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('--- KHỞI TẠO TÀI KHOẢN DEMO THỰC TẾ ---');

  for (const acc of DEMO_ACCOUNTS) {
    // 1. Kiểm tra tài khoản đã có chưa
    const { data: userList } = await admin.auth.admin.listUsers();
    let user = (userList?.users || []).find((u) => u.email === acc.email);

    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, preferred_branch_id: acc.branchId },
      });
      if (error) {
        console.error(`Lỗi tạo user ${acc.email}:`, error);
        continue;
      }
      user = created.user;
    } else {
      await admin.auth.admin.updateUserById(user.id, {
        password: acc.password,
        email_confirm: true,
      });
    }

    if (!user) continue;

    // 2. Cập nhật profile
    await admin
      .from('profiles')
      .update({
        status: 'active',
        full_name: acc.fullName,
        system_role: acc.systemRole,
        preferred_branch_id: acc.branchId,
        rejection_reason: null,
      })
      .eq('id', user.id);

    // 3. Cập nhật / chèn membership
    const { data: mems } = await admin
      .from('branch_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('branch_id', acc.branchId);

    if (!mems || mems.length === 0) {
      await admin.from('branch_memberships').insert({
        user_id: user.id,
        branch_id: acc.branchId,
        role: acc.role,
        is_primary: true,
        status: 'active',
      });
    } else {
      await admin
        .from('branch_memberships')
        .update({
          role: acc.role,
          status: 'active',
          is_primary: true,
        })
        .eq('id', mems[0].id);
    }

    console.log(`  [OK] ${acc.title}: ${acc.email} | Mật khẩu: ${acc.password}`);
  }

  console.log('\n--- HOÀN TẤT KHỞI TẠO TÀI KHOẢN DEMO ---\n');
}

seedDemoAccounts().catch(console.error);
