// ==============================================================================
// KAPLA Staff Dashboard — Bidirectional Dynamic Data Translation Utility (VI <-> EN)
// ==============================================================================

export type SupportedLanguage = 'vi' | 'en';

// Master Bidirectional Translation Pairs (Exact Matches)
const TRANSLATION_PAIRS: [string, string][] = [
  // Branches & Campuses
  ['KAPLA Phạm Hùng', 'KAPLA Pham Hung Campus'],
  ['Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM', 'Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, HCMC'],
  ['KAPLA Bình Tân', 'KAPLA Binh Tan Campus'],
  ['KAPLA Dĩ An', 'KAPLA Di An Campus'],
  ['Chi nhánh Phạm Hùng', 'Pham Hung Campus'],
  ['Hệ Thống KAPLA', 'KAPLA System'],

  // Rooms & Classes
  ['Phòng Oxford 201', 'Oxford Room 201'],
  ['Phòng Cambridge 302', 'Cambridge Room 302'],
  ['Phòng học Oxford', 'Oxford Classroom'],
  ['Phòng học chính', 'Main Classroom'],
  ['Thứ 2 & 4 (17:30 - 19:00)', 'Mon & Wed (17:30 - 19:00)'],
  ['Thứ 3 & 5 (17:30 - 19:00)', 'Tue & Thu (17:30 - 19:00)'],
  ['Thứ 7 & CN (09:00 - 10:30)', 'Sat & Sun (09:00 - 10:30)'],
  ['Thứ 7 & CN (14:30 - 16:00)', 'Sat & Sun (14:30 - 16:00)'],
  ['Chưa xếp lớp', 'Unassigned'],
  ['Mặc định theo lớp', 'Class Default'],
  ['HRT riêng', 'Designated HRT'],
  ['Chưa phân công', 'Unassigned'],

  // Assessment Periods
  ['Kỳ 1 - Giữa kỳ', 'Semester 1 - Midterm'],
  ['Kỳ 1 - Cuối kỳ', 'Semester 1 - Final'],
  ['Kỳ 2 - Giữa kỳ', 'Semester 2 - Midterm'],
  ['Kỳ 2 - Cuối kỳ', 'Semester 2 - Final'],

  // Tuition Packages
  ['Gói Starters Pro (6 tháng - 24 tuần)', 'Starters Pro Package (6 months - 24 weeks)'],
  ['Gói Starters Foundation (1 năm)', 'Starters Foundation Package (1 year)'],
  ['Gói Movers Mastery (1 năm - 48 tuần)', 'Movers Mastery Package (1 year - 48 weeks)'],
  ['Gói Flyers Elite (1 năm - 48 tuần)', 'Flyers Elite Package (1 year - 48 weeks)'],

  // Care Tasks Titles & Notes
  [
    'Gọi điện báo cáo tiến độ tuần 4 & bài viết cho PH em Nguyễn Bình An',
    'Call parents of student Nguyen Binh An to report week 4 progress & writing sample',
  ],
  [
    'Trao đổi kết quả bài kiểm tra mini-check viết câu và buổi học bổ trợ cùng Head Teacher Jamie.',
    'Discuss mini-check sentence writing test results and supplementary tutoring session with Head Teacher Jamie.',
  ],
  [
    'Nhắc tái tục học phí sắp hết hạn cho em Trần Thái Bình',
    'Remind parents of student Tran Thai Binh about upcoming tuition expiration',
  ],
  [
    'Hạn học phí còn 7 ngày, gửi brochure lộ trình khóa Starters 2 chuẩn Oxford.',
    '7 days remaining on tuition; sent Oxford-standard Starters 2 course roadmap brochure.',
  ],
  [
    'Xử lý học phí quá hạn em Đặng Bảo Nam',
    'Follow up on overdue tuition for student Dang Bao Nam',
  ],
  [
    'Đã quá hạn 3 ngày, gọi điện xác nhận lại lịch chuyển khoản của mẹ bé.',
    'Overdue by 3 days; called to confirm the bank transfer schedule with the student\'s mother.',
  ],
  [
    'Gửi video clip thuyết trình trên lớp cho PH em Lê Quốc Cường',
    'Send in-class presentation video clip to parents of student Le Quoc Cuong',
  ],
  [
    'Clip bé thuyết trình mini chủ đề My Favorite Sport với Head Teacher Jamie.',
    'Clip of the student giving a mini presentation on "My Favorite Sport" with Head Teacher Jamie.',
  ],

  // Student Notes
  [
    'Học viên có năng khiếu giao tiếp, tự tin nói chuyện với GV bản ngữ, đang được kèm bổ trợ viết câu.',
    'Talented communicator, confident conversing with native teachers, currently receiving sentence writing tutoring.',
  ],
  [
    'Phụ huynh quan tâm tiến độ chuẩn Oxford, HRT Minh đã liên hệ tư vấn gói 6 tháng Starters 2.',
    'Parents interested in Oxford standard progress; HRT Minh has reached out regarding the 6-month Starters 2 package.',
  ],
  [
    'Học lực xuất sắc, phát âm chuẩn Oxford, chuẩn bị thi Cambridge Movers.',
    'Outstanding academic performance, authentic Oxford pronunciation, preparing for Cambridge Movers examination.',
  ],
  [
    'Học phí quá hạn, HRT Minh đã liên hệ nhắc phụ huynh xếp lịch đóng phí.',
    'Tuition overdue; HRT Minh has contacted parents to arrange fee payment.',
  ],
  [
    'Cấp độ Flyers, gia đình có nguyện vọng thi lấy chứng chỉ quốc tế 15 khiên.',
    'Flyers level; family aims for a perfect 15-shield Cambridge international certification.',
  ],
  [
    'Rất tích cực phát biểu, hoàn thành bài tập về nhà đầy đủ.',
    'Highly participatory in class, consistently completes all homework assignments.',
  ],
  [
    'Tiếp thu bài nhanh, đam mê học lập trình Robotics STEAM.',
    'Quick learner, passionate about STEAM Robotics coding curriculum.',
  ],
  [
    'Kỹ năng Đọc cần cải thiện, HRT Trâm đang theo dõi sát sao.',
    'Reading comprehension requires improvement; HRT Tram is closely monitoring.',
  ],

  // Student Assessments (Strengths, Weaknesses, Progress Notes)
  [
    'Phát âm tự nhiên chuẩn Oxford, phản xạ nói nhanh, tương tác hào hứng với giáo viên bản ngữ.',
    'Natural Oxford pronunciation, fast speaking reflexes, enthusiastic interaction with native teachers.',
  ],
  [
    'Ngữ pháp viết câu đơn còn nhầm thì hiện tại đơn và chia động từ ngôi thứ 3 số ít.',
    'Simple sentence grammar confuses Present Simple tense and 3rd person singular verb conjugation.',
  ],
  [
    'Cần can thiệp bổ trợ kỹ năng Viết để củng cố trước kỳ thi Starters.',
    'Requires writing skill intervention to consolidate fundamentals before the Starters exam.',
  ],
  [
    'Nắm từ vựng tốt, tích cực trong các hoạt động trò chơi ngôn ngữ.',
    'Strong vocabulary retention, highly engaged in language games and activities.',
  ],
  [
    'Thỉnh thoảng mất tập trung ở 15 phút cuối buổi học.',
    'Occasional lapse of concentration during the last 15 minutes of class.',
  ],
  [
    'Khả năng nói lưu loát, dùng được các câu ghép cơ bản, ngữ điệu tự nhiên.',
    'Fluent speaking ability, uses basic compound sentences with natural intonation.',
  ],
  [
    'Cần đọc thêm truyện tiếng Anh nhiều trang để tăng tốc độ đọc.',
    'Should read more multi-page English storybooks to enhance reading speed.',
  ],
  [
    'Nghe tốt bài hội thoại dài, từ vựng phong phú.',
    'Good comprehension of lengthy dialogues, rich vocabulary foundation.',
  ],
  [
    'Kỹ năng Skimming và Scanning bài đọc dài còn hạn chế, hay bị bẫy từ đồng nghĩa.',
    'Skimming and scanning skills on long passages need development; vulnerable to synonym traps.',
  ],

  // Academic Interventions
  [
    'Kỹ năng Viết đạt 2.5/5 khiên, gặp khó khăn chia động từ hiện tại đơn và trật tự từ.',
    'Writing skill scored 2.5/5 shields; struggles with Present Simple verb conjugation and word order.',
  ],
  [
    'Chưa nắm vững quy tắc thêm s/es và câu hỏi Do/Does trong câu nghi vấn.',
    'Has not mastered s/es inflection rules and Do/Does auxiliary questions in interrogatives.',
  ],
  [
    'Kèm bổ trợ ngữ pháp 1-1 30 phút mỗi thứ 4, giao 4 phiếu bài tập viết Oxford.',
    '1-on-1 30-min grammar tutoring every Wednesday; assigned 4 Oxford writing worksheets.',
  ],
  [
    'Học viên đã hoàn thành 4 phiếu bài tập, bài mini-test đạt 3.8/5 khiên.',
    'Student completed all 4 worksheets; mini-test score improved to 3.8/5 shields.',
  ],
  [
    'Head Teacher Jamie đã duyệt: Học viên An đạt tiến bộ rõ rệt, kết thúc can thiệp.',
    'Approved by Head Teacher Jamie: Student An showed marked progress, intervention concluded.',
  ],
  [
    'Nói ngập ngừng, ngại giao tiếp khi trả lời câu hỏi mở của giáo viên bản ngữ.',
    'Hesitant speech, reluctant to respond to open-ended questions from native teachers.',
  ],
  [
    'Vốn từ vựng chủ đề School & Hobbies còn hạn chế, sợ phát âm sai.',
    'Limited vocabulary in School & Hobbies topics; hesitant due to fear of mispronunciation.',
  ],
  [
    'Luyện phát âm qua flashcard Oxford và ghép cặp thực hành hội thoại đầu giờ.',
    'Practice pronunciation via Oxford flashcards and pair conversation exercises at class start.',
  ],
  [
    'Đọc hiểu chậm, hay nhầm lẫn thông tin chi tiết trong đoạn văn Starters.',
    'Slow reading comprehension, frequently confuses detailed facts in Starters passages.',
  ],
  [
    'Chưa biết kỹ thuật gạch chân từ khóa (keywords) khi đọc câu hỏi trắc nghiệm.',
    'Unfamiliar with underlining keywords when tackling multiple-choice questions.',
  ],
  [
    'Hướng dẫn kỹ năng đọc quét Skim & Scan, luyện 2 bài đọc mẫu mỗi tuần.',
    'Instruct on Skim & Scan reading techniques; practice 2 sample reading passages weekly.',
  ],

  // Parent Feedback
  [
    'Phụ huynh hỏi về lộ trình ôn thi chứng chỉ Cambridge Starters và nhờ thầy cô kèm thêm phần Viết câu.',
    'Parents inquired about Cambridge Starters exam roadmap and requested extra sentence writing support.',
  ],
  [
    'HRT Vy đã gọi tư vấn chi tiết lộ trình và xếp lịch học bổ trợ ngữ pháp thứ Tư hàng tuần.',
    'HRT Vy made a detailed consultation call and scheduled weekly Wednesday grammar tutoring.',
  ],
  [
    'Phụ huynh khen bé dạo này về nhà tự giác nghe bài hát tiếng Anh và nói chuyện tự tin hơn hẳn.',
    'Parents praised the student for self-initiating English listening at home and speaking much more confidently.',
  ],
  [
    'Đã gửi lời cảm ơn mẹ và gửi kèm video clip bé thuyết trình mini trên lớp.',
    'Sent a thank-you note to the mother along with the student\'s in-class mini presentation video.',
  ],
  [
    'Gia đình muốn tìm hiểu đăng ký câu lạc bộ Robotics sáng tạo và hoạt động ngoại khóa cuối tuần.',
    'Family requested information on enrolling in the Creative Robotics club and weekend extracurriculars.',
  ],
  [
    'CM Phương Nhi đã tư vấn lịch trải nghiệm CLB Robotics thứ 7 tuần này.',
    'CM Phuong Nhi consulted the family regarding this Saturday\'s Robotics trial workshop.',
  ],
  [
    'Phụ huynh cần bảng điểm tổng hợp giữa kỳ để đối chiếu tiến độ học tiếng Anh ở trường tiểu học.',
    'Parents requested a midterm transcript summary to compare English learning progress at primary school.',
  ],

  // Supplementary Tutoring Sessions
  [
    'Bổ trợ kỹ năng Viết & Cấu trúc câu đơn (Starters)',
    'Writing Skills & Simple Sentence Structure Tutoring (Starters)',
  ],
  [
    'Quy tắc chia động từ ngôi thứ 3 số ít và viết mô tả tranh theo chuẩn Cambridge',
    '3rd person singular verb conjugation rules and Cambridge-standard picture description',
  ],
  [
    'Học viên nhận diện đúng chủ ngữ và viết câu đúng ít nhất 80% phiếu bài tập',
    'Students accurately identify subjects and construct correct sentences on >= 80% of worksheets',
  ],
  [
    'Học sinh chú ý lắng nghe, làm đúng 4/5 câu viết mẫu.',
    'Student listened attentively and correctly wrote 4 out of 5 model sentences.',
  ],
  [
    'Đã nhớ cấu trúc câu cơ bản, cần rèn luyện thêm chính tả.',
    'Remembered basic sentence structures; needs further spelling reinforcement.',
  ],
  [
    'Luyện phản xạ Nói & Phát âm âm đuôi chuẩn Oxford (Movers)',
    'Speaking Reflexes & Oxford Ending Sounds Training (Movers)',
  ],
  [
    'Mô tả sự khác biệt giữa hai bức tranh và kể lại câu chuyện 4 tranh',
    'Describe differences between two pictures and tell a 4-picture story',
  ],
  [
    'Nói câu hoàn chỉnh có thì Quá khứ đơn, phát âm rõ âm đuôi /s/, /z/, /ed/',
    'Produce complete sentences in Past Simple tense with clear /s/, /z/, /ed/ endings',
  ],
  [
    'Buổi học diễn ra hào hứng, các bạn tương tác nhóm sôi nổi.',
    'Class was highly engaging with vibrant group interactions.',
  ],
  [
    'Phát âm chuẩn, kể chuyện mạch lạc và giàu cảm xúc.',
    'Authentic pronunciation, coherent and expressive storytelling.',
  ],
  [
    'Tự tin phát biểu, tương tác tốt cùng bạn ghép đôi.',
    'Spoke confidently with excellent peer collaboration in paired activities.',
  ],

  // Renewal Records
  [
    'Phụ huynh rất quan tâm khóa Starters nâng cao, hẹn thứ Bảy lên trung tâm chốt gói 6 tháng.',
    'Parents very interested in advanced Starters; appointment this Saturday at campus to finalize 6-month package.',
  ],
  [
    'Học phí quá hạn 3 ngày. Mẹ bé báo tuần này bận công tác, chuyển khoản gia hạn vào thứ Sáu.',
    'Tuition overdue by 3 days. Mother reported business travel this week, will wire renewal payment on Friday.',
  ],
  [
    'Phụ huynh muốn nâng cấp lên gói 1 năm kèm CLB Robotics cuối tuần, đã gửi phiếu ưu đãi học phí sớm.',
    'Parents wish to upgrade to 1-year package with weekend Robotics club; early-bird tuition voucher delivered.',
  ],

  // System & Audit Logs
  [
    'Khởi tạo hệ thống quản trị học vụ KAPLA Phạm Hùng',
    'Initialize KAPLA Pham Hung academic management system',
  ],
  [
    'Phê duyệt vai trò nhân sự',
    'Approve staff role permissions',
  ],
  [
    'Cập nhật thông tin học viên',
    'Update student profile details',
  ],
  [
    'Chuyển lớp học viên',
    'Transfer student cohort',
  ],
];

// Pre-build exact maps for O(1) instant lookup
const VI_TO_EN_MAP = new Map<string, string>();
const EN_TO_VI_MAP = new Map<string, string>();

TRANSLATION_PAIRS.forEach(([vi, en]) => {
  VI_TO_EN_MAP.set(vi.trim(), en.trim());
  EN_TO_VI_MAP.set(en.trim(), vi.trim());
});

// Common parent relationships & titles
const PARENT_RELATIONS_VI_TO_EN: [RegExp, string][] = [
  [/\(Bố\)/g, '(Father)'],
  [/\(Mẹ\)/g, '(Mother)'],
  [/\(Bác\)/g, '(Guardian)'],
  [/\(Chú\)/g, '(Guardian)'],
  [/\(Cô\)/g, '(Aunt)'],
  [/\(Dì\)/g, '(Aunt)'],
  [/\(Ông\)/g, '(Grandfather)'],
  [/\(Bà\)/g, '(Grandmother)'],
];

const PARENT_RELATIONS_EN_TO_VI: [RegExp, string][] = [
  [/\(Father\)/g, '(Bố)'],
  [/\(Mother\)/g, '(Mẹ)'],
  [/\(Guardian\)/g, '(Người giám hộ)'],
  [/\(Aunt\)/g, '(Cô/Dì)'],
  [/\(Grandfather\)/g, '(Ông)'],
  [/\(Grandmother\)/g, '(Bà)'],
];

// Schedule Days
const SCHEDULE_VI_TO_EN: [RegExp, string][] = [
  [/Thứ 2 & 4/g, 'Mon & Wed'],
  [/Thứ 3 & 5/g, 'Tue & Thu'],
  [/Thứ 4 & 6/g, 'Wed & Fri'],
  [/Thứ 7 & CN/g, 'Sat & Sun'],
  [/Thứ 2/g, 'Monday'],
  [/Thứ 3/g, 'Tuesday'],
  [/Thứ 4/g, 'Wednesday'],
  [/Thứ 5/g, 'Thursday'],
  [/Thứ 6/g, 'Friday'],
  [/Thứ 7/g, 'Saturday'],
  [/Chủ Nhật|CN/g, 'Sunday'],
];

const SCHEDULE_EN_TO_VI: [RegExp, string][] = [
  [/Mon & Wed/g, 'Thứ 2 & 4'],
  [/Tue & Thu/g, 'Thứ 3 & 5'],
  [/Wed & Fri/g, 'Thứ 4 & 6'],
  [/Sat & Sun/g, 'Thứ 7 & CN'],
  [/Monday/g, 'Thứ 2'],
  [/Tuesday/g, 'Thứ 3'],
  [/Wednesday/g, 'Thứ 4'],
  [/Thursday/g, 'Thứ 5'],
  [/Friday/g, 'Thứ 6'],
  [/Saturday/g, 'Thứ 7'],
  [/Sunday/g, 'Chủ Nhật'],
];

/**
 * Bidirectional database string translator.
 * If targetLang is 'en', translates Vietnamese DB text to English.
 * If targetLang is 'vi', translates English DB text to Vietnamese.
 * Preserves untranslatable names, IDs, numbers, and dates untouched.
 */
export function translateDbText(
  text: string | null | undefined,
  targetLang: SupportedLanguage = 'en'
): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (targetLang === 'en') {
    // 1. Exact match check (VI -> EN)
    if (VI_TO_EN_MAP.has(trimmed)) {
      return VI_TO_EN_MAP.get(trimmed)!;
    }

    // 2. Already in English check
    if (EN_TO_VI_MAP.has(trimmed)) {
      return trimmed;
    }

    // 3. Pattern & Substring replacements
    let result = trimmed;
    PARENT_RELATIONS_VI_TO_EN.forEach(([pattern, repl]) => {
      result = result.replace(pattern, repl);
    });
    SCHEDULE_VI_TO_EN.forEach(([pattern, repl]) => {
      result = result.replace(pattern, repl);
    });

    return result;
  } else {
    // targetLang === 'vi'
    // 1. Exact match check (EN -> VI)
    if (EN_TO_VI_MAP.has(trimmed)) {
      return EN_TO_VI_MAP.get(trimmed)!;
    }

    // 2. Already in Vietnamese check
    if (VI_TO_EN_MAP.has(trimmed)) {
      return trimmed;
    }

    // 3. Pattern & Substring replacements
    let result = trimmed;
    PARENT_RELATIONS_EN_TO_VI.forEach(([pattern, repl]) => {
      result = result.replace(pattern, repl);
    });
    SCHEDULE_EN_TO_VI.forEach(([pattern, repl]) => {
      result = result.replace(pattern, repl);
    });

    return result;
  }
}
