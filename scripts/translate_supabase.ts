import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/lib/supabase.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace branch
content = content.replace(
  `name: 'KAPLA Phạm Hùng',\n    address: 'Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM',`,
  `name: 'KAPLA Pham Hung Campus',\n    address: 'Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, Ho Chi Minh City',`
);

// Replace profiles
content = content.replace(`full_name: 'Phương Nhi',`, `full_name: 'Phuong Nhi',`);
content = content.replace(`full_name: 'Trâm',`, `full_name: 'Tram',`);
content = content.replace(`full_name: 'Vy',`, `full_name: 'Vy',`);
content = content.replace(`full_name: 'Minh',`, `full_name: 'Minh',`);

// Replace class schedules and default_hrt_name
content = content.replace(`schedule: 'Thứ 2 & 4 (17:30 - 19:00)',`, `schedule: 'Mon & Wed (17:30 - 19:00)',`);
content = content.replace(`schedule: 'Thứ 3 & 5 (17:30 - 19:00)',`, `schedule: 'Tue & Thu (17:30 - 19:00)',`);
content = content.replace(`default_hrt_name: 'Trâm',`, `default_hrt_name: 'Tram',`);
content = content.replace(`schedule: 'Thứ 7 & CN (09:00 - 10:30)',`, `schedule: 'Sat & Sun (09:00 - 10:30)',`);
content = content.replace(`schedule: 'Thứ 7 & CN (14:30 - 16:00)',`, `schedule: 'Sat & Sun (14:30 - 16:00)',`);
content = content.replace(`schedule: 'Thứ 3 & 6 (18:00 - 19:30)',`, `schedule: 'Tue & Fri (18:00 - 19:30)',`);

// Replace audit logs
content = content.replace(
  `details: { message: 'Khởi tạo hệ thống quản trị học vụ KAPLA Phạm Hùng' },`,
  `details: { message: 'Initialized KAPLA Pham Hung academic administration system' },`
);
content = content.replace(
  `branch_name: 'KAPLA Phạm Hùng',`,
  `branch_name: 'KAPLA Pham Hung Campus',`
);

// Replace default students
content = content.replace(`full_name: 'Nguyễn Bình An',`, `full_name: 'Nguyen Binh An',`);
content = content.replace(`parent_name: 'Nguyễn Văn Minh (Bố)',`, `parent_name: 'Nguyen Van Minh (Father)',`);
content = content.replace(
  `notes: 'Học viên có năng khiếu giao tiếp, tự tin nói chuyện với GV bản ngữ, đang được kèm bổ trợ viết câu.',`,
  `notes: 'Talented communicator, confident conversing with native teachers, currently receiving sentence writing tutoring.',`
);

content = content.replace(`full_name: 'Trần Thái Bình',`, `full_name: 'Tran Thai Binh',`);
content = content.replace(`parent_name: 'Trần Thị Hà (Mẹ)',`, `parent_name: 'Tran Thi Ha (Mother)',`);
content = content.replace(
  `notes: 'Phụ huynh quan tâm tiến độ chuẩn Oxford, HRT Minh đã liên hệ tư vấn gói 6 tháng Starters 2.',`,
  `notes: 'Parents interested in Oxford standard progress; HRT Minh has reached out regarding the 6-month Starters 2 package.',`
);

content = content.replace(`full_name: 'Lê Quốc Cường',`, `full_name: 'Le Quoc Cuong',`);
content = content.replace(`parent_name: 'Lê Văn Sang (Bố)',`, `parent_name: 'Le Van Sang (Father)',`);
content = content.replace(
  `notes: 'Học lực xuất sắc, phát âm chuẩn Oxford, chuẩn bị thi Cambridge Movers.',`,
  `notes: 'Outstanding academic performance, authentic Oxford pronunciation, preparing for Cambridge Movers examination.',`
);

content = content.replace(`full_name: 'Đặng Bảo Nam',`, `full_name: 'Dang Bao Nam',`);
content = content.replace(`parent_name: 'Đặng Quốc Tuấn (Bố)',`, `parent_name: 'Dang Quoc Tuan (Father)',`);
content = content.replace(
  `notes: 'Học phí quá hạn, HRT Minh đã liên hệ nhắc phụ huynh xếp lịch đóng phí.',`,
  `notes: 'Tuition overdue; HRT Minh has contacted parents to arrange fee payment.',`
);

content = content.replace(`full_name: 'Phạm Minh Khôi',`, `full_name: 'Pham Minh Khoi',`);
content = content.replace(`parent_name: 'Phạm Hải Đăng (Bố)',`, `parent_name: 'Pham Hai Dang (Father)',`);
content = content.replace(
  `notes: 'Cấp độ Flyers, gia đình có nguyện vọng thi lấy chứng chỉ quốc tế 15 khiên.',`,
  `notes: 'Flyers level; family aims for a perfect 15-shield Cambridge international certification.',`
);

content = content.replace(`full_name: 'Hoàng Mai Chi',`, `full_name: 'Hoang Mai Chi',`);
content = content.replace(`parent_name: 'Hoàng Kim Loan (Mẹ)',`, `parent_name: 'Hoang Kim Loan (Mother)',`);
content = content.replace(
  `notes: 'Rất tích cực phát biểu, hoàn thành bài tập về nhà đầy đủ.',`,
  `notes: 'Highly participatory in class, consistently completes all homework assignments.',`
);

content = content.replace(`full_name: 'Vũ Hải Yến',`, `full_name: 'Vu Hai Yen',`);
content = content.replace(`parent_name: 'Vũ Quốc Bảo (Bố)',`, `parent_name: 'Vu Quoc Bao (Father)',`);
content = content.replace(
  `notes: 'Tiếp thu bài nhanh, đam mê học lập trình Robotics STEAM.',`,
  `notes: 'Fast learner, passionate about STEAM Robotics and coding.',`
);

content = content.replace(`full_name: 'Đỗ Tuấn Kiệt',`, `full_name: 'Do Tuan Kiet',`);
content = content.replace(`parent_name: 'Đỗ Trọng Hiếu (Bố)',`, `parent_name: 'Do Trong Hieu (Father)',`);
content = content.replace(
  `notes: 'Kỹ năng Đọc cần cải thiện, HRT Trâm đang theo dõi sát sao.',`,
  `notes: 'Reading skills need improvement; HRT Tram is closely monitoring.',`
);

content = content.replace(`full_name: 'Nguyễn Tuấn Khải',`, `full_name: 'Nguyen Tuan Khai',`);
content = content.replace(`parent_name: 'Nguyễn Văn Hùng (Bố)',`, `parent_name: 'Nguyen Van Hung (Father)',`);
content = content.replace(
  `notes: 'Học lực tốt, kỹ năng nói tự nhiên, chuẩn bị thi Cambridge Flyers.',`,
  `notes: 'Strong academic performance, natural speaking skills, preparing for Cambridge Flyers.',`
);

// Replace care tasks
content = content.replace(
  `title: 'Gọi điện báo cáo tiến độ tuần 4 & bài viết cho PH em Nguyễn Bình An',`,
  `title: 'Call parents of student Nguyen Binh An to report week 4 progress & writing sample',`
);
content = content.replace(
  `notes: 'Trao đổi kết quả bài kiểm tra mini-check viết câu và buổi học bổ trợ cùng Head Teacher Jamie.',`,
  `notes: 'Discuss mini-check sentence writing test results and supplementary tutoring session with Head Teacher Jamie.',`
);
content = content.replace(
  `title: 'Nhắc tái tục học phí sắp hết hạn cho em Trần Thái Bình',`,
  `title: 'Remind parents of student Tran Thai Binh about upcoming tuition expiration',`
);
content = content.replace(
  `notes: 'Hạn học phí còn 7 ngày, gửi brochure lộ trình khóa Starters 2 chuẩn Oxford.',`,
  `notes: '7 days remaining on tuition; sent Oxford-standard Starters 2 course roadmap brochure.',`
);
content = content.replace(
  `title: 'Xử lý học phí quá hạn em Đặng Bảo Nam',`,
  `title: 'Follow up on overdue tuition for student Dang Bao Nam',`
);
content = content.replace(
  `notes: 'Đã quá hạn 3 ngày, gọi điện xác nhận lại lịch chuyển khoản của mẹ bé.',`,
  `notes: 'Overdue by 3 days; called to confirm the bank transfer schedule with the student mother.',`
);
content = content.replace(
  `title: 'Gửi video clip thuyết trình trên lớp cho PH em Lê Quốc Cường',`,
  `title: 'Send in-class presentation video clip to parents of student Le Quoc Cuong',`
);
content = content.replace(
  `notes: 'Clip bé thuyết trình mini chủ đề My Favorite Sport với Head Teacher Jamie.',`,
  `notes: 'Clip of the student giving a mini presentation on My Favorite Sport with Head Teacher Jamie.',`
);

// Replace assessments
content = content.replace(
  `strengths: 'Phát âm tự nhiên chuẩn Oxford, phản xạ nói nhanh, tương tác hào hứng với giáo viên bản ngữ.',`,
  `strengths: 'Authentic Oxford pronunciation, quick verbal reflexes, enthusiastic interaction with native English teachers.',`
);
content = content.replace(
  `weaknesses: 'Ngữ pháp viết câu đơn còn nhầm thì hiện tại đơn và chia động từ ngôi thứ 3 số ít.',`,
  `weaknesses: 'Simple sentence grammar writing still confuses present simple and 3rd person singular verb conjugation.',`
);
content = content.replace(
  `progress_notes: 'Cần can thiệp bổ trợ kỹ năng Viết để củng cố trước kỳ thi Starters.',`,
  `progress_notes: 'Needs supplementary writing intervention before upcoming Cambridge Starters exam.'`
);

content = content.replace(
  `strengths: 'Nắm từ vựng tốt, tích cực trong các hoạt động trò chơi ngôn ngữ.',`,
  `strengths: 'Strong vocabulary acquisition, highly energetic in language game activities.',`
);
content = content.replace(
  `weaknesses: 'Thỉnh thoảng mất tập trung ở 15 phút cuối buổi học.',`,
  `weaknesses: 'Occasional loss of focus in the final 15 minutes of the session.'`
);

content = content.replace(
  `strengths: 'Khả năng nói lưu loát, dùng được các câu ghép cơ bản, ngữ điệu tự nhiên.',`,
  `strengths: 'Fluent speech delivery, uses basic compound sentences, natural intonation.',`
);
content = content.replace(
  `weaknesses: 'Cần đọc thêm truyện tiếng Anh nhiều trang để tăng tốc độ đọc.',`,
  `weaknesses: 'Should read more multi-page English storybooks to improve reading speed.'`
);

content = content.replace(
  `strengths: 'Nghe tốt bài hội thoại dài, từ vựng phong phú.',`,
  `strengths: 'Excellent listening comprehension on lengthy dialogues, rich topical vocabulary.'`
);
content = content.replace(
  `weaknesses: 'Kỹ năng Skimming và Scanning bài đọc dài còn hạn chế, hay bị bẫy từ đồng nghĩa.',`,
  `weaknesses: 'Skimming and scanning skills on long passages need refinement; easily distracted by synonym traps.'`
);

// Replace interventions
content = content.replace(
  `issue_description: 'Kỹ năng Viết đạt 2.5/5 khiên, gặp khó khăn chia động từ hiện tại đơn và trật tự từ.',`,
  `issue_description: 'Writing competency scored 2.5/5 shields, encountering difficulty with simple present tense verb conjugation and word order.',`
);
content = content.replace(
  `root_cause: 'Chưa nắm vững quy tắc thêm s/es và câu hỏi Do/Does trong câu nghi vấn.',`,
  `root_cause: 'Has not yet mastered s/es ending rules and Do/Does auxiliary verbs in interrogative sentences.',`
);
content = content.replace(
  `action_plan: 'Kèm bổ trợ ngữ pháp 1-1 30 phút mỗi thứ 4, giao 4 phiếu bài tập viết Oxford.',`,
  `action_plan: '1-on-1 grammar tutoring for 30 minutes every Wednesday, assigned 4 Oxford writing worksheets.',`
);
content = content.replace(
  `reassessment_result: 'Học viên đã hoàn thành 4 phiếu bài tập, bài mini-test đạt 3.8/5 khiên.',`,
  `reassessment_result: 'Student completed 4 worksheets; mini-test score improved to 3.8/5 shields.',`
);
content = content.replace(
  `verification_notes: 'Head Teacher Jamie đã duyệt: Học viên An đạt tiến bộ rõ rệt, kết thúc can thiệp.',`,
  `verification_notes: 'Head Teacher Jamie approved: Student An demonstrated noticeable progress, intervention concluded successfully.',`
);

content = content.replace(
  `issue_description: 'Nói ngập ngừng, ngại giao tiếp khi trả lời câu hỏi mở của giáo viên bản ngữ.',`,
  `issue_description: 'Hesitant speech, shy when answering open-ended questions from native teachers.',`
);
content = content.replace(
  `root_cause: 'Vốn từ vựng chủ đề School & Hobbies còn hạn chế, sợ phát âm sai.',`,
  `root_cause: 'Limited vocabulary on School & Hobbies topics, fearful of mispronouncing.',`
);
content = content.replace(
  `action_plan: 'Luyện phát âm qua flashcard Oxford và ghép cặp thực hành hội thoại đầu giờ.',`,
  `action_plan: 'Pronunciation drills with Oxford flashcards and paired conversation practice at session start.',`
);

content = content.replace(
  `issue_description: 'Đọc hiểu đoạn văn dài Flyers còn chậm, dễ mất kiên nhẫn khi gặp từ mới.',`,
  `issue_description: 'Slow reading comprehension on longer Flyers passages, tends to lose patience with unfamiliar words.',`
);
content = content.replace(
  `root_cause: 'Chưa có kỹ năng Skimming và Scanning bắt từ khóa chính trong bài thi Cambridge.',`,
  `root_cause: 'Lacks skimming and scanning skills to identify keywords in Cambridge exams.',`
);
content = content.replace(
  `action_plan: 'Hướng dẫn kỹ thuật gạch chân từ khóa và đọc lướt tìm ý chính.',`,
  `action_plan: 'Instructed in keyword underlining techniques and rapid skimming for main ideas.',`
);
content = content.replace(
  `reassessment_result: 'Đã hoàn thành 5 bài đọc luyện Flyers, độ chính xác tăng từ 50% lên 75%.',`,
  `reassessment_result: 'Completed 5 Flyers reading practice drills; accuracy increased from 50% to 75%.',`
);

// Replace feedbacks (including adding grouped feedback for Pham Minh Khoi matching Image 3)
content = content.replace(
  `content: 'Phụ huynh hỏi về lộ trình ôn thi chứng chỉ Cambridge Starters và nhờ thầy cô kèm thêm phần Viết câu.',`,
  `content: 'Parents inquired about the Cambridge Starters preparation roadmap and requested supplementary tutoring for sentence writing.',`
);
content = content.replace(
  `resolution_notes: 'HRT Vy đã gọi tư vấn chi tiết lộ trình và xếp lịch học bổ trợ ngữ pháp thứ Tư hàng tuần.',`,
  `resolution_notes: 'HRT Vy called to consult in detail on the academic roadmap and scheduled Wednesday grammar tutoring.',`
);

content = content.replace(
  `content: 'Phụ huynh khen bé dạo này về nhà tự giác nghe bài hát tiếng Anh và nói chuyện tự tin hơn hẳn.',`,
  `content: 'Mother shared positive feedback that the student proactively listens to English songs at home and speaks with greater confidence.',`
);
content = content.replace(
  `resolution_notes: 'Đã gửi lời cảm ơn mẹ và gửi kèm video clip bé thuyết trình mini trên lớp.',`,
  `resolution_notes: 'Sent appreciation message to mother along with the video clip of the student mini in-class presentation.',`
);

content = content.replace(
  `content: 'Gia đình muốn tìm hiểu đăng ký câu lạc bộ Robotics sáng tạo và hoạt động ngoại khóa cuối tuần.',`,
  `content: 'Family would like to explore enrolling in the Creative Robotics Club and weekend extracurricular activities.',`
);
content = content.replace(
  `resolution_notes: 'CM Phương Nhi đã tư vấn lịch trải nghiệm CLB Robotics thứ 7 tuần này.',`,
  `resolution_notes: 'CM Phuong Nhi consulted on Saturday Robotics Club trial schedule.',`
);

content = content.replace(
  `content: 'Phụ huynh cần bảng điểm tổng hợp giữa kỳ để đối chiếu tiến độ học tiếng Anh ở trường tiểu học.',`,
  `content: 'Parents requested midterm comprehensive report card to cross-reference academic progress at primary school.',`
);

// Replace supplementary sessions
content = content.replace(
  `title: 'Bổ trợ kỹ năng Viết & Cấu trúc câu đơn (Starters)',`,
  `title: 'Supplementary Writing & Simple Sentence Structure (Starters)',`
);
content = content.replace(`room: 'Phòng Oxford 201',`, `room: 'Oxford Room 201',`);
content = content.replace(
  `topic: 'Quy tắc chia động từ ngôi thứ 3 số ít và viết mô tả tranh theo chuẩn Cambridge',`,
  `topic: 'Third-person singular verb conjugation rules and Cambridge picture description writing',`
);
content = content.replace(
  `target_objective: 'Học viên nhận diện đúng chủ ngữ và viết câu đúng ít nhất 80% phiếu bài tập',`,
  `target_objective: 'Students correctly identify subjects and write accurate sentences on at least 80% of worksheets',`
);
content = content.replace(
  `teacher_feedback: 'Học sinh chú ý lắng nghe, làm đúng 4/5 câu viết mẫu.',`,
  `teacher_feedback: 'Student paid close attention, completed 4/5 sample writing sentences accurately.',`
);
content = content.replace(
  `teacher_feedback: 'Đã nhớ cấu trúc câu cơ bản, cần rèn luyện thêm chính tả.',`,
  `teacher_feedback: 'Memorized basic sentence structures, needs further spelling practice.',`
);

content = content.replace(
  `title: 'Luyện phản xạ Nói & Phát âm âm đuôi chuẩn Oxford (Movers)',`,
  `title: 'Speaking Reflexes & Oxford Standard Ending Sounds (Movers)',`
);
content = content.replace(`room: 'Phòng Cambridge 302',`, `room: 'Cambridge Room 302',`);
content = content.replace(
  `topic: 'Mô tả sự khác biệt giữa hai bức tranh và kể lại câu chuyện 4 tranh',`,
  `topic: 'Describing differences between two pictures and retelling a 4-picture story',`
);
content = content.replace(
  `target_objective: 'Nói câu hoàn chỉnh có thì Quá khứ đơn, phát âm rõ âm đuôi /s/, /z/, /ed/',`,
  `target_objective: 'Speak in complete sentences using past simple tense, articulate ending sounds /s/, /z/, /ed/',`
);
content = content.replace(
  `notes: 'Buổi học diễn ra hào hứng, các bạn tương tác nhóm sôi nổi.',`,
  `notes: 'Enthusiastic session, lively group interaction.',`
);
content = content.replace(
  `teacher_feedback: 'Phát âm chuẩn, kể chuyện mạch lạc và giàu cảm xúc.',`,
  `teacher_feedback: 'Standard pronunciation, coherent and expressive storytelling.',`
);
content = content.replace(
  `teacher_feedback: 'Tự tin phát biểu, tương tác tốt cùng bạn ghép đôi.',`,
  `teacher_feedback: 'Confident speaker, interacted well with partner.',`
);

// Replace renewals
content = content.replace(
  `notes: 'Phụ huynh rất quan tâm khóa Starters nâng cao, hẹn thứ Bảy lên trung tâm chốt gói 6 tháng.',`,
  `notes: 'Parents highly interested in advanced Starters course; appointment on Saturday at center to finalize 6-month package.',`
);
content = content.replace(
  `tuition_package: 'Gói Starters Pro (6 tháng - 24 tuần)',`,
  `tuition_package: 'Starters Pro Package (6 months - 24 weeks)',`
);

content = content.replace(
  `notes: 'Học phí quá hạn 3 ngày. Mẹ bé báo tuần này bận công tác, chuyển khoản gia hạn vào thứ Sáu.',`,
  `notes: 'Tuition overdue by 3 days. Mother reported busy on business trip this week, will transfer renewal fee on Friday.',`
);
content = content.replace(
  `tuition_package: 'Gói Starters Foundation (1 năm)',`,
  `tuition_package: 'Starters Foundation Package (1 year)',`
);

content = content.replace(
  `notes: 'Gia đình hài lòng tiến độ, chuẩn bị gửi thư ngỏ lộ trình Flyers Intensive.',`,
  `notes: 'Family pleased with progress, preparing invitation letter for Flyers Intensive roadmap.',`
);
content = content.replace(
  `tuition_package: 'Gói Flyers Intensive (6 tháng)',`,
  `tuition_package: 'Flyers Intensive Package (6 months)',`
);

content = content.replace(
  `notes: 'Học phí còn an toàn > 45 ngày.',`,
  `notes: 'Tuition safely remaining > 45 days.',`
);

content = content.replace(
  `notes: 'Gia đình đã tái tục gói 1 năm Movers Success.',`,
  `notes: 'Family renewed 1-year Movers Success package.',`
);
content = content.replace(
  `tuition_package: 'Gói Movers Success (1 năm)',`,
  `tuition_package: 'Movers Success Package (1 year)',`
);

content = content.replace(
  `notes: 'KAPLA Phạm Hùng: Sắp hết hạn 5 ngày, HRT Trâm đã gọi nhắc phụ huynh.',`,
  `notes: 'KAPLA Pham Hung: Expiry in 5 days, HRT Tram called to remind parents.',`
);
content = content.replace(
  `tuition_package: 'Gói Flyers Standard (6 tháng)',`,
  `tuition_package: 'Flyers Standard Package (6 months)',`
);

// Invalidate data version to force clean reload in demo browsers
content = content.replace(
  `const CURRENT_DATA_VERSION = 'v2026_kapla_authentic_dataset_v3';`,
  `const CURRENT_DATA_VERSION = 'v2026_kapla_authentic_dataset_v4_english';`
);

// Replace fallback strings
content = content.replace(/Chưa phân công/g, 'Unassigned');
content = content.replace(/Chưa gán/g, 'Unassigned');
content = content.replace(/\(HRT riêng\)/g, '(Dedicated HRT)');
content = content.replace(/\(Theo lớp\)/g, '(Class Default)');
content = content.replace(/'Quản trị viên Hệ thống'/g, "'System Administrator'");
content = content.replace(/'Giám đốc cơ sở \(CM\)'/g, "'Center Manager (CM)'");
content = content.replace(/'Giáo viên'/g, "'Teacher'");
content = content.replace(/'Chi nhánh'/g, "'Campus'");

// Replace errors
content = content.replace(
  `throw new Error('Chính sách bảo mật KAPLA: Chế độ Mock bị từ chối vì hệ thống đang kết nối Supabase Cloud chính thức.');`,
  `throw new Error('KAPLA Security Policy: Mock mode rejected because official Supabase Cloud is connected.');`
);
content = content.replace(
  `if (targetIdx === -1) throw new Error('Không tìm thấy tài khoản.');`,
  `if (targetIdx === -1) throw new Error('Account not found.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Nhân viên không thể tự thay đổi trạng thái tài khoản.');`,
  `throw new Error('Permission denied: Staff cannot modify own account status.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Nhân viên không thể tự thay đổi quyền hạn hệ thống.');`,
  `throw new Error('Permission denied: Staff cannot modify own system privileges.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Nhân viên không thể sửa lý do phê duyệt.');`,
  `throw new Error('Permission denied: Staff cannot edit approval notes.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Không thể sửa định danh ID.');`,
  `throw new Error('Permission denied: Cannot edit identifier ID.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Không thể sửa email tài khoản.');`,
  `throw new Error('Permission denied: Cannot edit account email.');`
);
content = content.replace(
  `throw new Error('Người thực hiện không hợp lệ hoặc tài khoản chưa kích hoạt.');`,
  `throw new Error('Invalid actor or account not activated.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc CM chi nhánh này mới có quyền cấp vai trò.');`,
  `throw new Error('Permission denied: Only System Admin or Center Manager can assign roles.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Không thể tự cấp hoặc sửa đổi vai trò của chính mình.');`,
  `throw new Error('Permission denied: Cannot assign or modify your own role.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Chỉ Quản trị hệ thống mới có quyền bổ nhiệm Giám đốc cơ sở (CM).');`,
  `throw new Error('Permission denied: Only System Admin can appoint Center Manager (CM).');`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy học viên.');`,
  `if (idx === -1) throw new Error('Student not found.');`
);
content = content.replace(
  `throw new Error('Email nhân sự này đã tồn tại trong hệ thống.');`,
  `throw new Error('This staff email already exists in the system.');`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy tài khoản nhân sự.');`,
  `if (idx === -1) throw new Error('Staff account not found.');`
);
content = content.replace(
  `if (!target) throw new Error('Không tìm thấy tài khoản nhân sự để xóa.');`,
  `if (!target) throw new Error('Staff account to delete not found.');`
);
content = content.replace(
  `if (studentIdx === -1) throw new Error('Không tìm thấy học viên.');`,
  `if (studentIdx === -1) throw new Error('Student not found.');`
);
content = content.replace(
  `if (!targetClass) throw new Error('Không tìm thấy lớp học đích.');`,
  `if (!targetClass) throw new Error('Target class not found.');`
);
content = content.replace(
  `reason || 'Phân công lại nhân sự phụ trách'`,
  `reason || 'Reassigning responsible staff member'`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy phiếu can thiệp.');`,
  `if (idx === -1) throw new Error('Intervention ticket not found.');`
);
content = content.replace(
  `throw new Error('Chỉ Head Teacher hoặc CM mới có quyền xác minh phiếu can thiệp!');`,
  `throw new Error('Only Head Teacher or CM can verify intervention tickets.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Chỉ Head Teacher hoặc CM chi nhánh mới có quyền xác minh phiếu can thiệp.');`,
  `throw new Error('Permission denied: Only Head Teacher or Center Manager can verify intervention tickets.');`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy phản hồi.');`,
  `if (idx === -1) throw new Error('Feedback not found.');`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy buổi học.');`,
  `if (idx === -1) throw new Error('Supplementary session not found.');`
);
content = content.replace(
  `if (idx === -1) throw new Error('Không tìm thấy bản ghi tái tục.');`,
  `if (idx === -1) throw new Error('Renewal record not found.');`
);
content = content.replace(
  `throw new Error('Quyền bị từ chối: Chỉ Quản trị hệ thống (System Admin) mới có quyền chỉnh sửa cấu hình hệ thống.');`,
  `throw new Error('Permission denied: Only System Administrator can modify system configuration.');`
);

// Add sample feedback for Pham Minh Khoi matching customer Image 3 directly
if (!content.includes(`student_id: 'b0000000-0000-0000-0000-000000000005'`)) {
  const khoiFeedbacks = `  {
    id: 'f0000000-0000-0000-0000-000000000005',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Pham Hai Dang (Father)',
    parent_phone: '0905 667 788',
    feedback_type: 'academic_concern',
    channel: 'phone',
    content: 'Parents requested teacher to assign additional speaking homework with voice recordings via Zalo.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    due_date: '2026-11-18',
    status: 'resolved',
    resolution_notes: 'HRT Tram created a dedicated Zalo group and guided parent on submitting voice recordings.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000006',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Pham Hai Dang (Father)',
    parent_phone: '0905 667 788',
    feedback_type: 'academic_concern',
    channel: 'phone',
    content: 'Parent inquired about Cambridge Flyers mock exam schedule and registration procedure.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    due_date: '2026-11-18',
    status: 'resolved',
    resolution_notes: 'HRT Tram sent Cambridge Flyers exam dates schedule and registered mock test session.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },`;

  content = content.replace(
    `const DEFAULT_FEEDBACKS: ParentFeedback[] = [`,
    `const DEFAULT_FEEDBACKS: ParentFeedback[] = [\n${khoiFeedbacks}`
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated src/lib/supabase.ts to 100% English!');
