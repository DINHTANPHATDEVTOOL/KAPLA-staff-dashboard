import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/lib/supabase.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace branch
content = content.replace(`name: 'KAPLA Phạm Hùng'`, `name: 'KAPLA Pham Hung Campus'`);
content = content.replace(
  `address: 'Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM'`,
  `address: 'Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, Ho Chi Minh City'`
);
content = content.replace(`branch_name: 'KAPLA Phạm Hùng'`, `branch_name: 'KAPLA Pham Hung Campus'`);

// Replace period: 'Kỳ 1 - Giữa kỳ'
content = content.replace(/period: 'Kỳ 1 - Giữa kỳ'/g, `period: 'Semester 1 - Midterm'`);

// Replace parent names in feedback
content = content.replace(`parent_name: 'Nguyễn Văn Minh (Bố)'`, `parent_name: 'Nguyen Van Minh (Father)'`);
content = content.replace(`parent_name: 'Trần Thị Hà (Mẹ)'`, `parent_name: 'Tran Thi Ha (Mother)'`);
content = content.replace(`parent_name: 'Đặng Quốc Tuấn (Bố)'`, `parent_name: 'Dang Quoc Tuan (Father)'`);
content = content.replace(`parent_name: 'Lê Văn Sang (Bố)'`, `parent_name: 'Le Van Sang (Father)'`);

// Clean comments and console strings
content = content.replace(/\[KAPLA Production\] Kết nối cơ sở dữ liệu Supabase Cloud:/g, '[KAPLA Production] Connected to Supabase Cloud:');
content = content.replace(/\[KAPLA Demo Preview\] Chưa cấu hình Supabase Cloud hoặc URL cục bộ không hỗ trợ trên HTTPS\. Hệ thống kích hoạt chế độ Demo Standalone với đầy đủ 8 vai trò và học viên thực tế\./g, '[KAPLA Demo Preview] Supabase Cloud not configured. System activated Demo Standalone mode with full 8 roles and realistic student data.');
content = content.replace(/\/\/ Initial Seed Data with Single Branch \(KAPLA Phạm Hùng Only\)/g, '// Initial Seed Data with Single Branch (KAPLA Pham Hung Campus Only)');
content = content.replace(/\/\/ Giao riêng HRT Vy/g, '// Designated HRT Vy');
content = content.replace(/\/\/ Sắp hết hạn 5 ngày/g, '// Due in 5 days');
content = content.replace(/\/\/ Sắp hết hạn/g, '// Due soon');
content = content.replace(/\/\/ Đã quá hạn/g, '// Overdue');
content = content.replace(/\/\/ Mặc định theo lớp -> Minh/g, '// Class default -> Minh');
content = content.replace(/\/\/ Mặc định theo lớp -> Trâm/g, '// Class default -> Tram');
content = content.replace(/\/\/ Mặc định theo lớp -> Vy/g, '// Class default -> Vy');
content = content.replace(/\/\/ Giao riêng HRT Trâm/g, '// Designated HRT Tram');
content = content.replace(/\/\/ HRT Trâm/g, '// HRT Tram');
content = content.replace(/\/\/ CM Phương Nhi/g, '// CM Phuong Nhi');
content = content.replace(/profilesRaw\.includes\('Lê Nguyễn'\)/g, `profilesRaw.includes('Le Nguyen')`);
content = content.replace(/studentsRaw\.includes\('Thử Nghiệm'\)/g, `studentsRaw.includes('Test Student')`);

content = content.replace(
  `if (studentIdx === -1) throw new Error('Không tìm thấy học viên.');`,
  `if (studentIdx === -1) throw new Error('Student not found.');`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy phiếu can thiệp.');`,
  `if (idx === -1) throw new Error('Intervention ticket not found.');`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('src/lib/supabase.ts cleaned completely!');
