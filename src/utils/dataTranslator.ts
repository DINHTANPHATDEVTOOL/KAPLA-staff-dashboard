// ==============================================================================
// KAPLA Staff Dashboard \u2014 Bidirectional Dynamic Data Translation Utility (VI <-> EN)
// ==============================================================================

export type SupportedLanguage = 'vi' | 'en';

// Master Bidirectional Translation Pairs (Exact Matches)
const TRANSLATION_PAIRS: [string, string][] = [
  // Branches & Campuses
  ['KAPLA Ph\u1ea1m H\u00f9ng', 'KAPLA Pham Hung Campus'],
  ['T\u1ea7ng tr\u1ec7t & l\u1eedng, Topaz Elite, Ph\u01b0\u1eddng 4, Qu\u1eadn 8, TP.HCM', 'Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, HCMC'],
  ['KAPLA B\u00ecnh T\u00e2n', 'KAPLA Binh Tan Campus'],
  ['KAPLA D\u0129 An', 'KAPLA Di An Campus'],
  ['Chi nh\u00e1nh Ph\u1ea1m H\u00f9ng', 'Pham Hung Campus'],
  ['H\u1ec7 Th\u1ed1ng KAPLA', 'KAPLA System'],

  // Rooms & Classes
  ['Ph\u00f2ng Oxford 201', 'Oxford Room 201'],
  ['Ph\u00f2ng Cambridge 302', 'Cambridge Room 302'],
  ['Ph\u00f2ng h\u1ecdc Oxford', 'Oxford Classroom'],
  ['Ph\u00f2ng h\u1ecdc ch\u00ednh', 'Main Classroom'],
  ['Th\u1ee9 2 & 4 (17:30 - 19:00)', 'Mon & Wed (17:30 - 19:00)'],
  ['Th\u1ee9 3 & 5 (17:30 - 19:00)', 'Tue & Thu (17:30 - 19:00)'],
  ['Th\u1ee9 7 & CN (09:00 - 10:30)', 'Sat & Sun (09:00 - 10:30)'],
  ['Th\u1ee9 7 & CN (14:30 - 16:00)', 'Sat & Sun (14:30 - 16:00)'],
  ['Ch\u01b0a x\u1ebfp l\u1edbp', 'Unassigned'],
  ['M\u1eb7c \u0111\u1ecbnh theo l\u1edbp', 'Class Default'],
  ['HRT ri\u00eang', 'Designated HRT'],
  ['Ch\u01b0a ph\u00e2n c\u00f4ng', 'Unassigned'],

  // Assessment Periods
  ['K\u1ef3 1 - Gi\u1eefa k\u1ef3', 'Semester 1 - Midterm'],
  ['K\u1ef3 1 - Cu\u1ed1i k\u1ef3', 'Semester 1 - Final'],
  ['K\u1ef3 2 - Gi\u1eefa k\u1ef3', 'Semester 2 - Midterm'],
  ['K\u1ef3 2 - Cu\u1ed1i k\u1ef3', 'Semester 2 - Final'],

  // Tuition Packages
  ['G\u00f3i Starters Pro (6 th\u00e1ng - 24 tu\u1ea7n)', 'Starters Pro Package (6 months - 24 weeks)'],
  ['G\u00f3i Starters Foundation (1 n\u0103m)', 'Starters Foundation Package (1 year)'],
  ['G\u00f3i Movers Mastery (1 n\u0103m - 48 tu\u1ea7n)', 'Movers Mastery Package (1 year - 48 weeks)'],
  ['G\u00f3i Flyers Elite (1 n\u0103m - 48 tu\u1ea7n)', 'Flyers Elite Package (1 year - 48 weeks)'],

  // Care Tasks Titles & Notes
  [
    'G\u1ecdi \u0111i\u1ec7n b\u00e1o c\u00e1o ti\u1ebfn \u0111\u1ed9 tu\u1ea7n 4 & b\u00e0i vi\u1ebft cho PH em Nguy\u1ec5n B\u00ecnh An',
    'Call parents of student Nguyen Binh An to report week 4 progress & writing sample',
  ],
  [
    'Trao \u0111\u1ed5i k\u1ebft qu\u1ea3 b\u00e0i ki\u1ec3m tra mini-check vi\u1ebft c\u00e2u v\u00e0 bu\u1ed5i h\u1ecdc b\u1ed5 tr\u1ee3 c\u00f9ng Head Teacher Jamie.',
    'Discuss mini-check sentence writing test results and supplementary tutoring session with Head Teacher Jamie.',
  ],
  [
    'Nh\u1eafc t\u00e1i t\u1ee5c h\u1ecdc ph\u00ed s\u1eafp h\u1ebft h\u1ea1n cho em Tr\u1ea7n Th\u00e1i B\u00ecnh',
    'Remind parents of student Tran Thai Binh about upcoming tuition expiration',
  ],
  [
    'H\u1ea1n h\u1ecdc ph\u00ed c\u00f2n 7 ng\u00e0y, g\u1eedi brochure l\u1ed9 tr\u00ecnh kh\u00f3a Starters 2 chu\u1ea9n Oxford.',
    '7 days remaining on tuition; sent Oxford-standard Starters 2 course roadmap brochure.',
  ],
  [
    'X\u1eed l\u00fd h\u1ecdc ph\u00ed qu\u00e1 h\u1ea1n em \u0110\u1eb7ng B\u1ea3o Nam',
    'Follow up on overdue tuition for student Dang Bao Nam',
  ],
  [
    '\u0110\u00e3 qu\u00e1 h\u1ea1n 3 ng\u00e0y, g\u1ecdi \u0111i\u1ec7n x\u00e1c nh\u1eadn l\u1ea1i l\u1ecbch chuy\u1ec3n kho\u1ea3n c\u1ee7a m\u1eb9 b\u00e9.',
    'Overdue by 3 days; called to confirm the bank transfer schedule with the student\'s mother.',
  ],
  [
    'G\u1eedi video clip thuy\u1ebft tr\u00ecnh tr\u00ean l\u1edbp cho PH em L\u00ea Qu\u1ed1c C\u01b0\u1eddng',
    'Send in-class presentation video clip to parents of student Le Quoc Cuong',
  ],
  [
    'Clip b\u00e9 thuy\u1ebft tr\u00ecnh mini ch\u1ee7 \u0111\u1ec1 My Favorite Sport v\u1edbi Head Teacher Jamie.',
    'Clip of the student giving a mini presentation on "My Favorite Sport" with Head Teacher Jamie.',
  ],

  // Student Notes
  [
    'H\u1ecdc vi\u00ean c\u00f3 n\u0103ng khi\u1ebfu giao ti\u1ebfp, t\u1ef1 tin n\u00f3i chuy\u1ec7n v\u1edbi GV b\u1ea3n ng\u1eef, \u0111ang \u0111\u01b0\u1ee3c k\u00e8m b\u1ed5 tr\u1ee3 vi\u1ebft c\u00e2u.',
    'Talented communicator, confident conversing with native teachers, currently receiving sentence writing tutoring.',
  ],
  [
    'Ph\u1ee5 huynh quan t\u00e2m ti\u1ebfn \u0111\u1ed9 chu\u1ea9n Oxford, HRT Minh \u0111\u00e3 li\u00ean h\u1ec7 t\u01b0 v\u1ea5n g\u00f3i 6 th\u00e1ng Starters 2.',
    'Parents interested in Oxford standard progress; HRT Minh has reached out regarding the 6-month Starters 2 package.',
  ],
  [
    'H\u1ecdc l\u1ef1c xu\u1ea5t s\u1eafc, ph\u00e1t \u00e2m chu\u1ea9n Oxford, chu\u1ea9n b\u1ecb thi Cambridge Movers.',
    'Outstanding academic performance, authentic Oxford pronunciation, preparing for Cambridge Movers examination.',
  ],
  [
    'H\u1ecdc ph\u00ed qu\u00e1 h\u1ea1n, HRT Minh \u0111\u00e3 li\u00ean h\u1ec7 nh\u1eafc ph\u1ee5 huynh x\u1ebfp l\u1ecbch \u0111\u00f3ng ph\u00ed.',
    'Tuition overdue; HRT Minh has contacted parents to arrange fee payment.',
  ],
  [
    'C\u1ea5p \u0111\u1ed9 Flyers, gia \u0111\u00ecnh c\u00f3 nguy\u1ec7n v\u1ecdng thi l\u1ea5y ch\u1ee9ng ch\u1ec9 qu\u1ed1c t\u1ebf 15 khi\u00ean.',
    'Flyers level; family aims for a perfect 15-shield Cambridge international certification.',
  ],
  [
    'R\u1ea5t t\u00edch c\u1ef1c ph\u00e1t bi\u1ec3u, ho\u00e0n th\u00e0nh b\u00e0i t\u1eadp v\u1ec1 nh\u00e0 \u0111\u1ea7y \u0111\u1ee7.',
    'Highly participatory in class, consistently completes all homework assignments.',
  ],
  [
    'Ti\u1ebfp thu b\u00e0i nhanh, \u0111am m\u00ea h\u1ecdc l\u1eadp tr\u00ecnh Robotics STEAM.',
    'Quick learner, passionate about STEAM Robotics coding curriculum.',
  ],
  [
    'K\u1ef9 n\u0103ng \u0110\u1ecdc c\u1ea7n c\u1ea3i thi\u1ec7n, HRT Tr\u00e2m \u0111ang theo d\u00f5i s\u00e1t sao.',
    'Reading comprehension requires improvement; HRT Tram is closely monitoring.',
  ],

  // Student Assessments (Strengths, Weaknesses, Progress Notes)
  [
    'Ph\u00e1t \u00e2m t\u1ef1 nhi\u00ean chu\u1ea9n Oxford, ph\u1ea3n x\u1ea1 n\u00f3i nhanh, t\u01b0\u01a1ng t\u00e1c h\u00e0o h\u1ee9ng v\u1edbi gi\u00e1o vi\u00ean b\u1ea3n ng\u1eef.',
    'Natural Oxford pronunciation, fast speaking reflexes, enthusiastic interaction with native teachers.',
  ],
  [
    'Ng\u1eef ph\u00e1p vi\u1ebft c\u00e2u \u0111\u01a1n c\u00f2n nh\u1ea7m th\u00ec hi\u1ec7n t\u1ea1i \u0111\u01a1n v\u00e0 chia \u0111\u1ed9ng t\u1eeb ng\u00f4i th\u1ee9 3 s\u1ed1 \u00edt.',
    'Simple sentence grammar confuses Present Simple tense and 3rd person singular verb conjugation.',
  ],
  [
    'C\u1ea7n can thi\u1ec7p b\u1ed5 tr\u1ee3 k\u1ef9 n\u0103ng Vi\u1ebft \u0111\u1ec3 c\u1ee7ng c\u1ed1 tr\u01b0\u1edbc k\u1ef3 thi Starters.',
    'Requires writing skill intervention to consolidate fundamentals before the Starters exam.',
  ],
  [
    'N\u1eafm t\u1eeb v\u1ef1ng t\u1ed1t, t\u00edch c\u1ef1c trong c\u00e1c ho\u1ea1t \u0111\u1ed9ng tr\u00f2 ch\u01a1i ng\u00f4n ng\u1eef.',
    'Strong vocabulary retention, highly engaged in language games and activities.',
  ],
  [
    'Th\u1ec9nh tho\u1ea3ng m\u1ea5t t\u1eadp trung \u1edf 15 ph\u00fat cu\u1ed1i bu\u1ed5i h\u1ecdc.',
    'Occasional lapse of concentration during the last 15 minutes of class.',
  ],
  [
    'Kh\u1ea3 n\u0103ng n\u00f3i l\u01b0u lo\u00e1t, d\u00f9ng \u0111\u01b0\u1ee3c c\u00e1c c\u00e2u gh\u00e9p c\u01a1 b\u1ea3n, ng\u1eef \u0111i\u1ec7u t\u1ef1 nhi\u00ean.',
    'Fluent speaking ability, uses basic compound sentences with natural intonation.',
  ],
  [
    'C\u1ea7n \u0111\u1ecdc th\u00eam truy\u1ec7n ti\u1ebfng Anh nhi\u1ec1u trang \u0111\u1ec3 t\u0103ng t\u1ed1c \u0111\u1ed9 \u0111\u1ecdc.',
    'Should read more multi-page English storybooks to enhance reading speed.',
  ],
  [
    'Nghe t\u1ed1t b\u00e0i h\u1ed9i tho\u1ea1i d\u00e0i, t\u1eeb v\u1ef1ng phong ph\u00fa.',
    'Good comprehension of lengthy dialogues, rich vocabulary foundation.',
  ],
  [
    'K\u1ef9 n\u0103ng Skimming v\u00e0 Scanning b\u00e0i \u0111\u1ecdc d\u00e0i c\u00f2n h\u1ea1n ch\u1ebf, hay b\u1ecb b\u1eaby t\u1eeb \u0111\u1ed3ng ngh\u0129a.',
    'Skimming and scanning skills on long passages need development; vulnerable to synonym traps.',
  ],

  // Academic Interventions
  [
    'K\u1ef9 n\u0103ng Vi\u1ebft \u0111\u1ea1t 2.5/5 khi\u00ean, g\u1eb7p kh\u00f3 kh\u0103n chia \u0111\u1ed9ng t\u1eeb hi\u1ec7n t\u1ea1i \u0111\u01a1n v\u00e0 tr\u1eadt t\u1ef1 t\u1eeb.',
    'Writing skill scored 2.5/5 shields; struggles with Present Simple verb conjugation and word order.',
  ],
  [
    'Ch\u01b0a n\u1eafm v\u1eefng quy t\u1eafc th\u00eam s/es v\u00e0 c\u00e2u h\u1ecfi Do/Does trong c\u00e2u nghi v\u1ea5n.',
    'Has not mastered s/es inflection rules and Do/Does auxiliary questions in interrogatives.',
  ],
  [
    'K\u00e8m b\u1ed5 tr\u1ee3 ng\u1eef ph\u00e1p 1-1 30 ph\u00fat m\u1ed7i th\u1ee9 4, giao 4 phi\u1ebfu b\u00e0i t\u1eadp vi\u1ebft Oxford.',
    '1-on-1 30-min grammar tutoring every Wednesday; assigned 4 Oxford writing worksheets.',
  ],
  [
    'H\u1ecdc vi\u00ean \u0111\u00e3 ho\u00e0n th\u00e0nh 4 phi\u1ebfu b\u00e0i t\u1eadp, b\u00e0i mini-test \u0111\u1ea1t 3.8/5 khi\u00ean.',
    'Student completed all 4 worksheets; mini-test score improved to 3.8/5 shields.',
  ],
  [
    'Head Teacher Jamie \u0111\u00e3 duy\u1ec7t: H\u1ecdc vi\u00ean An \u0111\u1ea1t ti\u1ebfn b\u1ed9 r\u00f5 r\u1ec7t, k\u1ebft th\u00fac can thi\u1ec7p.',
    'Approved by Head Teacher Jamie: Student An showed marked progress, intervention concluded.',
  ],
  [
    'N\u00f3i ng\u1eadp ng\u1eebng, ng\u1ea1i giao ti\u1ebfp khi tr\u1ea3 l\u1eddi c\u00e2u h\u1ecfi m\u1edf c\u1ee7a gi\u00e1o vi\u00ean b\u1ea3n ng\u1eef.',
    'Hesitant speech, reluctant to respond to open-ended questions from native teachers.',
  ],
  [
    'V\u1ed1n t\u1eeb v\u1ef1ng ch\u1ee7 \u0111\u1ec1 School & Hobbies c\u00f2n h\u1ea1n ch\u1ebf, s\u1ee3 ph\u00e1t \u00e2m sai.',
    'Limited vocabulary in School & Hobbies topics; hesitant due to fear of mispronunciation.',
  ],
  [
    'Luy\u1ec7n ph\u00e1t \u00e2m qua flashcard Oxford v\u00e0 gh\u00e9p c\u1eb7p th\u1ef1c h\u00e0nh h\u1ed9i tho\u1ea1i \u0111\u1ea7u gi\u1edd.',
    'Practice pronunciation via Oxford flashcards and pair conversation exercises at class start.',
  ],
  [
    '\u0110\u1ecdc hi\u1ec3u ch\u1eadm, hay nh\u1ea7m l\u1eabn th\u00f4ng tin chi ti\u1ebft trong \u0111o\u1ea1n v\u0103n Starters.',
    'Slow reading comprehension, frequently confuses detailed facts in Starters passages.',
  ],
  [
    'Ch\u01b0a bi\u1ebft k\u1ef9 thu\u1eadt g\u1ea1ch ch\u00e2n t\u1eeb kh\u00f3a (keywords) khi \u0111\u1ecdc c\u00e2u h\u1ecfi tr\u1eafc nghi\u1ec7m.',
    'Unfamiliar with underlining keywords when tackling multiple-choice questions.',
  ],
  [
    'H\u01b0\u1edbng d\u1eabn k\u1ef9 n\u0103ng \u0111\u1ecdc qu\u00e9t Skim & Scan, luy\u1ec7n 2 b\u00e0i \u0111\u1ecdc m\u1eabu m\u1ed7i tu\u1ea7n.',
    'Instruct on Skim & Scan reading techniques; practice 2 sample reading passages weekly.',
  ],

  // Parent Feedback
  [
    'Ph\u1ee5 huynh h\u1ecfi v\u1ec1 l\u1ed9 tr\u00ecnh \u00f4n thi ch\u1ee9ng ch\u1ec9 Cambridge Starters v\u00e0 nh\u1edd th\u1ea7y c\u00f4 k\u00e8m th\u00eam ph\u1ea7n Vi\u1ebft c\u00e2u.',
    'Parents inquired about Cambridge Starters exam roadmap and requested extra sentence writing support.',
  ],
  [
    'HRT Vy \u0111\u00e3 g\u1ecdi t\u01b0 v\u1ea5n chi ti\u1ebft l\u1ed9 tr\u00ecnh v\u00e0 x\u1ebfp l\u1ecbch h\u1ecdc b\u1ed5 tr\u1ee3 ng\u1eef ph\u00e1p th\u1ee9 T\u01b0 h\u00e0ng tu\u1ea7n.',
    'HRT Vy made a detailed consultation call and scheduled weekly Wednesday grammar tutoring.',
  ],
  [
    'Ph\u1ee5 huynh khen b\u00e9 d\u1ea1o n\u00e0y v\u1ec1 nh\u00e0 t\u1ef1 gi\u00e1c nghe b\u00e0i h\u00e1t ti\u1ebfng Anh v\u00e0 n\u00f3i chuy\u1ec7n t\u1ef1 tin h\u01a1n h\u1eb3n.',
    'Parents praised the student for self-initiating English listening at home and speaking much more confidently.',
  ],
  [
    '\u0110\u00e3 g\u1eedi l\u1eddi c\u1ea3m \u01a1n m\u1eb9 v\u00e0 g\u1eedi k\u00e8m video clip b\u00e9 thuy\u1ebft tr\u00ecnh mini tr\u00ean l\u1edbp.',
    'Sent a thank-you note to the mother along with the student\'s in-class mini presentation video.',
  ],
  [
    'Gia \u0111\u00ecnh mu\u1ed1n t\u00ecm hi\u1ec3u \u0111\u0103ng k\u00fd c\u00e2u l\u1ea1c b\u1ed9 Robotics s\u00e1ng t\u1ea1o v\u00e0 ho\u1ea1t \u0111\u1ed9ng ngo\u1ea1i kh\u00f3a cu\u1ed1i tu\u1ea7n.',
    'Family requested information on enrolling in the Creative Robotics club and weekend extracurriculars.',
  ],
  [
    'CM Ph\u01b0\u01a1ng Nhi \u0111\u00e3 t\u01b0 v\u1ea5n l\u1ecbch tr\u1ea3i nghi\u1ec7m CLB Robotics th\u1ee9 7 tu\u1ea7n n\u00e0y.',
    'CM Phuong Nhi consulted the family regarding this Saturday\'s Robotics trial workshop.',
  ],
  [
    'Ph\u1ee5 huynh c\u1ea7n b\u1ea3ng \u0111i\u1ec3m t\u1ed5ng h\u1ee3p gi\u1eefa k\u1ef3 \u0111\u1ec3 \u0111\u1ed1i chi\u1ebfu ti\u1ebfn \u0111\u1ed9 h\u1ecdc ti\u1ebfng Anh \u1edf tr\u01b0\u1eddng ti\u1ec3u h\u1ecdc.',
    'Parents requested a midterm transcript summary to compare English learning progress at primary school.',
  ],

  // Supplementary Tutoring Sessions
  [
    'B\u1ed5 tr\u1ee3 k\u1ef9 n\u0103ng Vi\u1ebft & C\u1ea5u tr\u00fac c\u00e2u \u0111\u01a1n (Starters)',
    'Writing Skills & Simple Sentence Structure Tutoring (Starters)',
  ],
  [
    'Quy t\u1eafc chia \u0111\u1ed9ng t\u1eeb ng\u00f4i th\u1ee9 3 s\u1ed1 \u00edt v\u00e0 vi\u1ebft m\u00f4 t\u1ea3 tranh theo chu\u1ea9n Cambridge',
    '3rd person singular verb conjugation rules and Cambridge-standard picture description',
  ],
  [
    'H\u1ecdc vi\u00ean nh\u1eadn di\u1ec7n \u0111\u00fang ch\u1ee7 ng\u1eef v\u00e0 vi\u1ebft c\u00e2u \u0111\u00fang \u00edt nh\u1ea5t 80% phi\u1ebfu b\u00e0i t\u1eadp',
    'Students accurately identify subjects and construct correct sentences on >= 80% of worksheets',
  ],
  [
    'H\u1ecdc sinh ch\u00fa \u00fd l\u1eafng nghe, l\u00e0m \u0111\u00fang 4/5 c\u00e2u vi\u1ebft m\u1eabu.',
    'Student listened attentively and correctly wrote 4 out of 5 model sentences.',
  ],
  [
    '\u0110\u00e3 nh\u1edb c\u1ea5u tr\u00fac c\u00e2u c\u01a1 b\u1ea3n, c\u1ea7n r\u00e8n luy\u1ec7n th\u00eam ch\u00ednh t\u1ea3.',
    'Remembered basic sentence structures; needs further spelling reinforcement.',
  ],
  [
    'Luy\u1ec7n ph\u1ea3n x\u1ea1 N\u00f3i & Ph\u00e1t \u00e2m \u00e2m \u0111u\u00f4i chu\u1ea9n Oxford (Movers)',
    'Speaking Reflexes & Oxford Ending Sounds Training (Movers)',
  ],
  [
    'M\u00f4 t\u1ea3 s\u1ef1 kh\u00e1c bi\u1ec7t gi\u1eefa hai b\u1ee9c tranh v\u00e0 k\u1ec3 l\u1ea1i c\u00e2u chuy\u1ec7n 4 tranh',
    'Describe differences between two pictures and tell a 4-picture story',
  ],
  [
    'N\u00f3i c\u00e2u ho\u00e0n ch\u1ec9nh c\u00f3 th\u00ec Qu\u00e1 kh\u1ee9 \u0111\u01a1n, ph\u00e1t \u00e2m r\u00f5 \u00e2m \u0111u\u00f4i /s/, /z/, /ed/',
    'Produce complete sentences in Past Simple tense with clear /s/, /z/, /ed/ endings',
  ],
  [
    'Bu\u1ed5i h\u1ecdc di\u1ec5n ra h\u00e0o h\u1ee9ng, c\u00e1c b\u1ea1n t\u01b0\u01a1ng t\u00e1c nh\u00f3m s\u00f4i n\u1ed5i.',
    'Class was highly engaging with vibrant group interactions.',
  ],
  [
    'Ph\u00e1t \u00e2m chu\u1ea9n, k\u1ec3 chuy\u1ec7n m\u1ea1ch l\u1ea1c v\u00e0 gi\u00e0u c\u1ea3m x\u00fac.',
    'Authentic pronunciation, coherent and expressive storytelling.',
  ],
  [
    'T\u1ef1 tin ph\u00e1t bi\u1ec3u, t\u01b0\u01a1ng t\u00e1c t\u1ed1t c\u00f9ng b\u1ea1n gh\u00e9p \u0111\u00f4i.',
    'Spoke confidently with excellent peer collaboration in paired activities.',
  ],

  // Renewal Records
  [
    'Ph\u1ee5 huynh r\u1ea5t quan t\u00e2m kh\u00f3a Starters n\u00e2ng cao, h\u1eb9n th\u1ee9 B\u1ea3y l\u00ean trung t\u00e2m ch\u1ed1t g\u00f3i 6 th\u00e1ng.',
    'Parents very interested in advanced Starters; appointment this Saturday at campus to finalize 6-month package.',
  ],
  [
    'H\u1ecdc ph\u00ed qu\u00e1 h\u1ea1n 3 ng\u00e0y. M\u1eb9 b\u00e9 b\u00e1o tu\u1ea7n n\u00e0y b\u1eadn c\u00f4ng t\u00e1c, chuy\u1ec3n kho\u1ea3n gia h\u1ea1n v\u00e0o th\u1ee9 S\u00e1u.',
    'Tuition overdue by 3 days. Mother reported business travel this week, will wire renewal payment on Friday.',
  ],
  [
    'Ph\u1ee5 huynh mu\u1ed1n n\u00e2ng c\u1ea5p l\u00ean g\u00f3i 1 n\u0103m k\u00e8m CLB Robotics cu\u1ed1i tu\u1ea7n, \u0111\u00e3 g\u1eedi phi\u1ebfu \u01b0u \u0111\u00e3i h\u1ecdc ph\u00ed s\u1edbm.',
    'Parents wish to upgrade to 1-year package with weekend Robotics club; early-bird tuition voucher delivered.',
  ],

  // System & Audit Logs
  [
    'Kh\u1edfi t\u1ea1o h\u1ec7 th\u1ed1ng qu\u1ea3n tr\u1ecb h\u1ecdc v\u1ee5 KAPLA Ph\u1ea1m H\u00f9ng',
    'Initialize KAPLA Pham Hung academic management system',
  ],
  [
    'Ph\u00ea duy\u1ec7t vai tr\u00f2 nh\u00e2n s\u1ef1',
    'Approve staff role permissions',
  ],
  [
    'C\u1eadp nh\u1eadt th\u00f4ng tin h\u1ecdc vi\u00ean',
    'Update student profile details',
  ],
  [
    'Chuy\u1ec3n l\u1edbp h\u1ecdc vi\u00ean',
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
  [/\(B\u1ed1\)/g, '(Father)'],
  [/\(M\u1eb9\)/g, '(Mother)'],
  [/\(B\u00e1c\)/g, '(Guardian)'],
  [/\(Ch\u00fa\)/g, '(Guardian)'],
  [/\(C\u00f4\)/g, '(Aunt)'],
  [/\(D\u00ec\)/g, '(Aunt)'],
  [/\(\u00d4ng\)/g, '(Grandfather)'],
  [/\(B\u00e0\)/g, '(Grandmother)'],
];

const PARENT_RELATIONS_EN_TO_VI: [RegExp, string][] = [
  [/\(Father\)/g, '(B\u1ed1)'],
  [/\(Mother\)/g, '(M\u1eb9)'],
  [/\(Guardian\)/g, '(Ng\u01b0\u1eddi gi\u00e1m h\u1ed9)'],
  [/\(Aunt\)/g, '(C\u00f4/D\u00ec)'],
  [/\(Grandfather\)/g, '(\u00d4ng)'],
  [/\(Grandmother\)/g, '(B\u00e0)'],
];

// Schedule Days
const SCHEDULE_VI_TO_EN: [RegExp, string][] = [
  [/Th\u1ee9 2 & 4/g, 'Mon & Wed'],
  [/Th\u1ee9 3 & 5/g, 'Tue & Thu'],
  [/Th\u1ee9 4 & 6/g, 'Wed & Fri'],
  [/Th\u1ee9 7 & CN/g, 'Sat & Sun'],
  [/Th\u1ee9 2/g, 'Monday'],
  [/Th\u1ee9 3/g, 'Tuesday'],
  [/Th\u1ee9 4/g, 'Wednesday'],
  [/Th\u1ee9 5/g, 'Thursday'],
  [/Th\u1ee9 6/g, 'Friday'],
  [/Th\u1ee9 7/g, 'Saturday'],
  [/Ch\u1ee7 Nh\u1eadt|CN/g, 'Sunday'],
];

const SCHEDULE_EN_TO_VI: [RegExp, string][] = [
  [/Mon & Wed/g, 'Th\u1ee9 2 & 4'],
  [/Tue & Thu/g, 'Th\u1ee9 3 & 5'],
  [/Wed & Fri/g, 'Th\u1ee9 4 & 6'],
  [/Sat & Sun/g, 'Th\u1ee9 7 & CN'],
  [/Monday/g, 'Th\u1ee9 2'],
  [/Tuesday/g, 'Th\u1ee9 3'],
  [/Wednesday/g, 'Th\u1ee9 4'],
  [/Thursday/g, 'Th\u1ee9 5'],
  [/Friday/g, 'Th\u1ee9 6'],
  [/Saturday/g, 'Th\u1ee9 7'],
  [/Sunday/g, 'Ch\u1ee7 Nh\u1eadt'],
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
