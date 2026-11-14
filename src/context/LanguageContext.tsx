// ==============================================================================
// KAPLA Staff Dashboard — Language Context & Localization (100% English Portal)
// ==============================================================================

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { translateDbText } from '../utils/dataTranslator';

export { translateDbText };
export type Language = 'vi' | 'en';

const STORAGE_KEY = 'kapla_language';

const EN_TRANSLATIONS: Record<string, string> = {
    // Brand & General (Official from kapla.edu.vn)
    'brand.portalTitle': 'KAPLA Staff Portal',
    'brand.portalSubtitle': 'Centralized Academic & Campus Operations Portal',
    'brand.oxfordBadge': 'Oxford Quality Certified 2025–2028 • Oxford University Press',
    'brand.heroHeadline': 'KAPLA — American Creative English with Oxford Quality Standards',
    'brand.heroDesc': 'The only English education system in Vietnam certified by 03 prestigious global bodies: Oxford Quality, Emerging Excellence, and Cambridge English Qualifications. Comprehensive curriculum aligned with US CCSS & NGSS standards with integrated Robotics.',
    'brand.statAccreditationNum': '03',
    'brand.statAccreditationLabel': 'Global Accreditations',
    'brand.statAccreditationSub': 'Oxford • Cambridge • NatGeo',
    'brand.statCambridgeNum': '15/15',
    'brand.statCambridgeLabel': 'Max Cambridge Shields',
    'brand.statCambridgeSub': 'Starters • Movers • Flyers',
    'brand.statCentresNum': '11',
    'brand.statCentresLabel': 'Active Campuses',
    'brand.statCentresSub': 'HCMC & Binh Duong',
    'brand.statSteamNum': '100%',
    'brand.statSteamLabel': 'US CCSS & NGSS Aligned',
    'brand.statSteamSub': 'Integrated Robotics STEAM',
    'brand.featureOxfordTitle': 'Oxford Quality Active Classrooms',
    'brand.featureOxfordDesc': 'Big Question Learning methodology — inspiring critical thinking, creativity, and 4C skills.',
    'brand.featureSteamTitle': 'American STEAM & Robotics Ecosystem',
    'brand.featureSteamDesc': 'State-of-the-art Robotics Labs integrating Computer Science, Kangaroo Math (IKMC) & FIDE Chess.',
    'brand.campusTicker': '11-Campus Network: KAPLA Pham Hung • Binh Tan • Tan Ky Tan Quy • Bau Cat • Nguyen Van Luong • Di An...',
    'brand.securityPillar': 'Strict Role-Based Access',
    'brand.securityPillarDesc': 'Row-level security protecting parent data and tuition records',
    'brand.multiBranchPillar': 'Native Multi-Branch',
    'brand.multiBranchPillarDesc': 'Centralized deployment with autonomous campus operations',
    'brand.footerVersion': 'Version 2.1 (RLS Secured)',
    'brand.internalTag': 'Internal',
    'brand.campusBadge': 'Pham Hung Campus • Flagship Center HCMC',
    'brand.campusHighlight': 'Creative American English & STEM Learning Environment',
    'brand.campusSub': 'Smart interactive classrooms, Oxford library, and Robotics makerspace.',
    'brand.classroomThumb': 'Oxford Quality Classroom',
    'brand.roboticsThumb': 'STEAM & Robotics Lab',

    // Auth Screens
    'auth.loginTitle': 'Sign in to your account',
    'auth.loginSubtitle': 'Enter your work email and password to access the KAPLA system.',
    'auth.emailLabel': 'Work Email',
    'auth.emailPlaceholder': 'staff.name@kapla.edu.vn',
    'auth.passwordLabel': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.rememberMe': 'Remember login state on this device',
    'auth.signInBtn': 'Sign In to Portal',
    'auth.signingIn': 'Authenticating...',
    'auth.newStaffPrompt': 'New to KAPLA staff?',
    'auth.registerNow': 'Register account now',
    'auth.demoAccountsHeader': 'Quick select demo account:',

    'auth.registerTitle': 'Staff Account Registration',
    'auth.registerSubtitle': 'Create your staff account to be reviewed and assigned to your campus.',
    'auth.fullNameLabel': 'Full Name',
    'auth.fullNamePlaceholder': 'John Doe',
    'auth.phoneLabel': 'Phone Number',
    'auth.preferredBranchLabel': 'Preferred Campus',
    'auth.selectBranchOption': '-- Select Learning Campus --',
    'auth.passwordRule': 'At least 6 characters',
    'auth.registerBtn': 'Register Account',
    'auth.registering': 'Registering...',
    'auth.alreadyHaveAccount': 'Already have a staff account?',
    'auth.backToLogin': 'Sign in now',

    'auth.pendingTitle': 'Account Pending Approval',
    'auth.pendingSubtitle': 'Your registration is logged. An administrator or Center Manager (CM) will review your profile and assign appropriate roles.',
    'auth.checkStatusBtn': 'Check Approval Status',
    'auth.checking': 'Checking...',

    'auth.verifyEmailTitle': 'Email Verification Required',
    'auth.verifyEmailSubtitle': 'We sent an activation link to your work email. Please open your inbox and click the confirmation link.',
    'auth.resendEmail': 'Resend Verification Email',

    'auth.disabledTitle': 'Account Suspended',
    'auth.disabledSubtitle': 'Your account has been deactivated or suspended. Please contact your Center Director or System Admin for support.',
    'auth.logout': 'Sign Out',
    'auth.contactSupport': 'Contact Academic Office / IT',

    // Missing Auth & Registration Keys (EN)
    'auth.emailError': 'Please enter your work email address.',
    'auth.passwordError': 'Please enter your password.',
    'auth.nameError': 'Please enter your full name.',
    'auth.emailInvalidError': 'Work email must have @kapla.edu.vn domain or be a valid email.',
    'auth.passwordLengthError': 'Password must be at least 6 characters long.',
    'auth.passwordMismatchError': 'Passwords do not match.',
    'auth.confirmPasswordLabel': 'Confirm Password',
    'auth.confirmPasswordPlaceholder': 'Re-enter your password',
    'auth.workflowLabel': 'Internal Approval Workflow:',
    'auth.workflowDesc': 'Newly registered accounts will remain pending. A System Admin or Center Manager (CM) will review and assign role permissions within 24 working hours.',
    'auth.branchHint': 'Select the primary campus you report to so the CM can review your profile',
    'auth.pendingStatusLabel': 'Awaiting Role Approval',
    'auth.pendingSecurityNotice': 'Your account has been registered on the KAPLA Staff Portal. To protect student privacy under Enterprise RLS standards, a System Admin or Center Manager (CM) must verify your identity and assign your academic role before dashboard access is granted.',
    'auth.accountSummaryTitle': 'Registered Account Summary',
    'auth.pendingBadge': 'Pending Assignment',
    'auth.registeredBranch': 'Target Campus',
    'auth.adminRole': 'System Administrator',
    'auth.staffRole': 'Campus Staff',

    // Staff & Student CRUD Keys (EN)
    'staff.addNew': 'Add New Staff',
    'staff.editStaff': 'Edit Staff Profile',
    'staff.deleteStaff': 'Delete Staff Account',
    'staff.deleteConfirm': 'Are you sure you want to delete this staff member? This will remove their account and campus permissions.',
    'staff.addSuccess': 'Staff account created successfully.',
    'staff.updateSuccess': 'Staff profile updated successfully.',
    'staff.deleteSuccess': 'Staff account deleted successfully.',
    'staff.nameLabel': 'Staff Full Name',
    'staff.emailLabel': 'Work Email',
    'staff.phoneLabel': 'Phone Number',
    'staff.branchLabel': 'Assigned Campus',
    'staff.roleLabel': 'Staff Academic Role',
    'staff.systemRoleLabel': 'System Access Level',
    'staff.statusLabel': 'Account Status',

    'student.addNew': 'Add New Student',
    'student.editStudent': 'Edit Student Profile',
    'student.deleteStudent': 'Delete Student',
    'student.deleteConfirm': 'Are you sure you want to delete this student? All related assessments, attendance, and care tasks will be removed.',
    'student.addSuccess': 'Student added successfully.',
    'student.updateSuccess': 'Student profile updated successfully.',
    'student.deleteSuccess': 'Student deleted successfully.',

    // Sidebar & Navigation
    'nav.overview': 'Academic Overview',
    'nav.students': 'Student Records',
    'nav.care_tasks': 'HRT Tasks',
    'nav.assessments': 'Competency Assessments',
    'nav.interventions': 'Academic Interventions',
    'nav.feedback': 'Parent Feedback',
    'nav.supplementary': 'Supplementary Tutoring',
    'nav.renewal': 'Renewal & Retention',
    'nav.logs': 'Activity Logs',
    'nav.staff_roles': 'Staff & Permissions',
    'nav.branches_classes': 'Branches & Classes',

    // TopBar Section Meta
    'topbar.selectBranch': 'Select Branch',
    'topbar.systemBranches': 'System-wide Branches',
    'topbar.assignedBranches': 'Assigned Branches',
    'topbar.refreshData': 'Refresh Data',
    'topbar.emailVerified': '● Email Verified',

    'topbar.overviewTitle': 'Academic Overview & Progress',
    'topbar.overviewSub': 'Monitor student progress, academic risks, and intervention milestones.',
    'topbar.studentsTitle': 'Student Records (Student Master)',
    'topbar.studentsSub': 'Manage academic records, HRT assignments, and tuition expiry.',
    'topbar.careTasksTitle': 'HRT Tasks (Care Worklist)',
    'topbar.careTasksSub': 'Student care tasks prioritized by designated individual HRT.',
    'topbar.assessmentsTitle': '4-Skill Competency Assessments',
    'topbar.assessmentsSub': 'Track Listening, Speaking, Reading, Writing via Oxford & Cambridge standards.',
    'topbar.interventionsTitle': 'Academic Interventions',
    'topbar.interventionsSub': 'Track action plans, target resolution dates, and supervisory verification.',
    'topbar.feedbackTitle': 'Parent Feedback & Expectations',
    'topbar.feedbackSub': 'Log and coordinate resolution for parent inquiries and feedback.',
    'topbar.supplementaryTitle': 'Supplementary Tutoring',
    'topbar.supplementarySub': 'Track attendance, tailored tutoring curriculum, and progress notes.',
    'topbar.renewalTitle': 'Renewal & Tuition Risk Management',
    'topbar.renewalSub': 'Tuition renewal alerts and proactive parent outreach before expiration.',
    'topbar.staffRolesTitle': 'Staff & Permissions',
    'topbar.staffRolesSub': 'Review pending registrations, assign roles, and allocate campuses.',
    'topbar.branchesClassesTitle': 'Branches & Class Directory',
    'topbar.branchesClassesSub': 'Configure branch operations and classroom cohort assignments.',
    'topbar.logsTitle': 'Activity Logs (Follow-up Logs)',
    'topbar.logsSub': 'Audit trail of staff communication and academic care actions.',

    // Common UI Terms
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.save': 'Save Changes',
    'common.saving': 'Saving...',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.loading': 'Loading data...',
    'common.noData': 'No matching records found',
    'common.refresh': 'Refresh',
    'common.details': 'Details',
    'common.back': 'Back',
    'common.view': 'View',
    'common.notes': 'Notes',
    'common.date': 'Date',
    'common.student': 'Student',
    'common.class': 'Class',
    'common.branch': 'Campus',
    'common.phone': 'Phone Number',
    'common.email': 'Email',
    'common.role': 'Role',
    'common.priority': 'Priority',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending',
    'common.overdue': 'Overdue',
    'common.warning': 'Warning',
    'common.days': 'days',
    'common.none': 'None',

    // Overview View
    'overview.greeting': 'Welcome back, {name}!',
    'overview.subtitle': 'Row-level security (RLS) active for role {role}. Data access strictly isolated by authorized campus.',
    'overview.stateTesting': 'UI State Testing:',
    'overview.kpiStudents': 'Total Enrolled Students',
    'overview.kpiStudentsSub': '+4 this month • Officially enrolled at campus',
    'overview.kpiInterventions': 'Academic Risks Needing Action',
    'overview.kpiInterventionsBadge': 'Requires Verification',
    'overview.kpiInterventionsSub': '2 In Progress, 1 Pending CM Approval',
    'overview.kpiFeedback': 'Open Parent Inquiries',
    'overview.kpiFeedbackBadge': 'Oxford Pronunciation Goals',
    'overview.kpiFeedbackSub': '1 Support Received, 1 HRT Assigned',
    'overview.kpiRenewal': 'Expiring Tuitions',
    'overview.kpiRenewalBadge': 'Retention Follow-up',
    'overview.kpiRenewalSub': 'HRT reminder email scheduled',
    'overview.campusHeroTag': 'Oxford Quality Campus',
    'overview.campusHeroStatus': 'Fully Operational',
    'overview.campusHeroAttendance': 'Attendance: 96.8%',
    'overview.campusHeroSatisfaction': 'Satisfaction: 4.9/5.0',
    'overview.quickActionsTitle': 'Academic Operations Quick Actions',
    'overview.quickActionsSub': 'Immediate access to student intervention and care workflows',
    'overview.quickActionIntervention': 'Create Academic Intervention',
    'overview.quickActionInterventionDesc': 'Open action plan for students with academic risks',
    'overview.quickActionTutoring': 'Schedule 1-on-1 Tutoring',
    'overview.quickActionTutoringDesc': 'Oxford phonics, intonation and fluency support',
    'overview.quickActionFeedback': 'Record Parent Feedback',
    'overview.quickActionFeedbackDesc': 'Document family requests and coordinate response',
    'overview.activityFeedTitle': 'Real-Time Academic Operations & Care Stream',
    'overview.activityFeedSub': 'Live operational updates across interventions, tutoring, and HRT parent care',
    'overview.activityFeedBadge': 'Live Today',

    // Student List View
    'students.title': 'Student Records',
    'students.subtitle': 'Manage student records, tuition expiry, class enrollment, and HRT assignments at {branch}',
    'students.addBtn': 'Add New Student',
    'students.searchPlaceholder': 'Search by student name, code, parent info...',
    'students.allClasses': 'All Classes',
    'students.allStatuses': 'All Statuses',
    'students.allHrts': 'All HRTs',
    'students.kpiTotalTracked': 'Total Tracked Students',
    'students.kpiTotalTrackedSub': 'On Track',
    'students.kpiAcademicRisk': 'High Academic Risk',
    'students.kpiAcademicRiskSub': 'Open Interventions',
    'students.kpiParentPerception': 'High Parent Perception Risk',
    'students.kpiParentPerceptionSub': 'Pending Feedback',
    'students.kpiRenewalRisk': 'Expiring Fees / Renewal Risk',
    'students.kpiRenewalRiskSub': 'Fee expiry ≤ 30 days or High/Critical risk',
    'students.filterAllLevels': 'All Levels',
    'students.filterAllTeachers': 'All Teachers',
    'students.filterAcademicStatus': 'Academic Status',
    'students.filterAcademicOnTrack': 'On Track',
    'students.filterAcademicRisk': 'High Academic Risk',
    'students.filterRenewalRisk': 'Renewal Risk',
    'students.filterRenewalSafe': 'Safe (> 30 days)',
    'students.filterRenewalExpiring': 'Expiring (≤ 30 days)',
    'students.filterRenewalDueSoon': 'Due Soon (≤ 14 days)',
    'students.filterRenewalOverdue': 'Overdue Tuition',
    'students.viewProfile': 'View Profile / Logcall',
    'students.colStudent': 'Student ID & Name',
    'students.colClass': 'Class & Level',
    'students.colParent': 'Parent & Contact',
    'students.colExpiry': 'Tuition Expiration',
    'students.colStatus': 'Status',
    'students.colHrt': 'Assigned HRT',
    'students.colActions': 'Actions',
    'students.statusActive': 'Active',
    'students.statusWarning': 'Tuition Warning',
    'students.statusOverdue': 'Overdue',
    'students.statusWithdrawn': 'Withdrawn',
    'students.hrtDefault': 'Class Default HRT',
    'students.hrtIndividual': 'Individual HRT',
    'students.transferBtn': 'Transfer Class',
    'students.assignHrtBtn': 'Assign Individual HRT',
    'students.addModalTitle': 'Enroll New Student Record',
    'students.fullNameLabel': 'Student Full Name *',
    'students.studentCodeLabel': 'Student Code (HS-xxxx) *',
    'students.dobLabel': 'Date of Birth',
    'students.parentNameLabel': 'Parent Full Name *',
    'students.parentPhoneLabel': 'Parent Phone Number *',
    'students.parentEmailLabel': 'Parent Email',
    'students.initialClassLabel': 'Initial Class Cohort *',
    'students.expiryDateLabel': 'Tuition Expiry Date *',
    'students.optionalHrtLabel': 'Designate Individual HRT (Optional)',
    'students.submitAdd': 'Save Student Record',
    'students.transferModalTitle': 'Transfer Student to Another Class',
    'students.currentClass': 'Current Class:',
    'students.selectNewClass': 'Select Target Class *',
    'students.transferReason': 'Transfer Reason *',
    'students.confirmTransfer': 'Confirm Class Transfer',
    'students.transferHistory': 'Transfer Audit History:',
    'students.assignModalTitle': 'Designate Individual HRT',
    'students.selectIndividualHrt': 'Select Individual HRT *',
    'students.removeIndividualHrt': 'Remove Individual HRT (Use Class Default)',
    'students.confirmAssign': 'Save HRT Assignment',

    // Care Tasks View
    'care.title': 'Designated HRT Tasks',
    'care.subtitle': 'Student care tasks prioritized by individual HRT designation at {branch}',
    'care.priorityUrgent': 'Urgent',
    'care.priorityHigh': 'High',
    'care.priorityNormal': 'Normal',
    'care.statusPending': 'Pending',
    'care.statusInProgress': 'In Progress',
    'care.statusCompleted': 'Completed',
    'care.callBtn': 'Call Parent',
    'care.zaloBtn': 'Send Zalo',
    'care.meetBtn': 'In-Person Meeting',
    'care.logAction': 'Log Care Action',
    'care.due': 'Target Date:',

    // Assessments View
    'assessments.title': '4-Skill Competency Assessments',
    'assessments.subtitle': 'Track Listening, Speaking, Reading, Writing via Oxford & Cambridge standards at {branch}',
    'assessments.addBtn': 'Add 4-Skill Assessment',
    'assessments.colStudent': 'Student',
    'assessments.colClass': 'Class',
    'assessments.colListening': 'Listening',
    'assessments.colSpeaking': 'Speaking',
    'assessments.colReading': 'Reading',
    'assessments.colWriting': 'Writing',
    'assessments.colAverage': 'Average',
    'assessments.colPeriod': 'Evaluation Period',
    'assessments.createIntervention': 'Create Intervention Ticket',
    'assessments.modalTitle': 'Add 4-Skill Assessment',
    'assessments.studentSelection': 'Student Selection (Filter by Class Code first) *',
    'assessments.switchStudent': 'Switch student',
    'assessments.changeStudent': 'Change',
    'assessments.term': 'Term *',
    'assessments.date': 'Date *',
    'assessments.progressVsPrevious': 'Progress vs Previous',
    'assessments.competencyLevels': 'Skill Competency Levels (3 Levels & N/A) *',
    'assessments.listening': 'Listening',
    'assessments.speaking': 'Speaking',
    'assessments.reading': 'Reading',
    'assessments.writing': 'Writing',
    'assessments.belowLevel': 'Below Level',
    'assessments.onTrack': 'On Track',
    'assessments.aboveLevel': 'Above Level',
    'assessments.na': 'N/A',
    'assessments.strengths': 'Strengths to Celebrate',
    'assessments.weaknesses': 'Weaknesses to Address',
    'assessments.progressNotes': 'Next Steps / Teacher Guidance',
    'assessments.submitBtn': 'Save Assessment',
    'assessments.filterFromDate': 'From Date',
    'assessments.filterToDate': 'To Date',
    'assessments.filterMonth': 'Month',
    'assessments.filterProgress': 'Progress',
    'assessments.filterRisk': 'Academic Risk',
    'assessments.viewModeLog': 'Log / Table View',
    'assessments.viewModeCards': 'Card View',

    // Interventions View
    'interventions.title': 'Academic Interventions',
    'interventions.subtitle': '4-Stage Workflow: Open → In Progress → Resolved → Verified at {branch}',
    'interventions.createBtn': 'Create Intervention Ticket',
    'interventions.stageOpen': 'Open',
    'interventions.stageInProgress': 'In Progress',
    'interventions.stageResolved': 'Resolved',
    'interventions.stageVerified': 'Verified',
    'interventions.startHandling': 'Start Handling',
    'interventions.submitResolved': 'Submit Re-assessment (Resolved)',
    'interventions.verifyBtn': 'Verify Academic Standards (Head Teacher / CM)',
    'interventions.modalTitle': 'Create New Academic Intervention Ticket',
    'interventions.targetStudent': 'Target Student *',
    'interventions.assignedStaff': 'Assigned Lead Staff *',
    'interventions.targetSkill': 'Target Skill / Subject *',
    'interventions.reason': 'Root Cause & Academic Deficit *',
    'interventions.actionPlan': 'Detailed Intervention Plan *',
    'interventions.targetDate': 'Target Resolution Date *',
    'interventions.resolveModalTitle': 'Submit Post-Intervention Re-evaluation',
    'interventions.reevalScore': 'Re-evaluation Score (0 - 5.0) *',
    'interventions.reevalNotes': 'Outcome & Progress Notes *',
    'interventions.verifyModalTitle': 'Verify Academic Intervention Quality',
    'interventions.verifyNotes': 'Supervisory Feedback (Head Teacher / CM) *',
    'interventions.academicRisk': 'Academic Risk',

    // Feedback View
    'feedback.title': 'Parent Feedback & Expectations',
    'feedback.subtitle': 'Log and coordinate parent inquiries, complaints, and feedback at {branch}',
    'feedback.addBtn': 'Log Parent Feedback',
    'feedback.categoryAcademics': 'Academics & Progress',
    'feedback.categoryTeachers': 'Teaching Staff & TAs',
    'feedback.categoryFacilities': 'Facilities & Cleanliness',
    'feedback.categoryTuition': 'Tuition & Renewal',
    'feedback.categoryOther': 'Other Topics',
    'feedback.sentimentPositive': 'Positive',
    'feedback.sentimentNeutral': 'Neutral',
    'feedback.sentimentNegative': 'Dissatisfied',
    'feedback.sentimentUrgent': 'Urgent Escalation',
    'feedback.statusNew': 'New Inquiry',
    'feedback.statusInProgress': 'In Progress',
    'feedback.statusResponded': 'Responded',
    'feedback.statusClosed': 'Closed',
    'feedback.modalTitle': 'Record New Parent Feedback',
    'feedback.parentFeedbackContent': 'Feedback / Inquiry Details *',
    'feedback.submitFeedback': 'Save Feedback Record',

    // Supplementary View
    'supplementary.title': 'Supplementary & 1-on-1 Tutoring',
    'supplementary.subtitle': 'Manage tutoring sessions, attendance, and progress reviews at {branch}',
    'supplementary.addBtn': 'Schedule Tutoring Session',
    'supplementary.colSession': 'Session & Schedule',
    'supplementary.colStudent': 'Enrolled Student',
    'supplementary.colTeacher': 'Assigned Teacher',
    'supplementary.colSubject': 'Topic & Focus Skill',
    'supplementary.colAttendance': 'Attendance',
    'supplementary.colNotes': 'Progress Review',
    'supplementary.present': 'Present',
    'supplementary.excused': 'Excused Absence',
    'supplementary.unexcused': 'Unexcused Absence',
    'supplementary.modalTitle': 'Schedule New Tutoring Session',

    // Renewal View
    'renewal.title': 'Renewal & Tuition Risk Management',
    'renewal.subtitle': 'Tuition renewal alerts and proactive parent outreach at {branch}',
    'renewal.warningThreshold': 'Tuition warning threshold: {days} days',
    'renewal.adminConfig': 'Admin threshold setting:',
    'renewal.saveThreshold': 'Save Threshold',
    'renewal.previewRecipients': 'Preview Scheduled Recipients',
    'renewal.checking': 'Checking...',
    'renewal.statusOverdue': 'Overdue',
    'renewal.statusDueToday': 'Expires Today',
    'renewal.statusDueSoon': 'Expiring Soon',
    'renewal.statusSafe': 'In Good Standing',
    'renewal.daysRemaining': '{days} days remaining',
    'renewal.daysOverdue': '{days} days overdue',
    'renewal.dueToday': 'Today',
    'renewal.actionCall': 'Immediate Call Required',
    'renewal.emailScheduled': 'HRT email reminder scheduled',

    // Staff & Roles View
    'staff.title': 'Staff Management & Permissions',
    'staff.subtitle': 'Approve accounts, assign branches, and allocate academic roles',
    'staff.tabPending': 'Pending Approvals',
    'staff.tabStaff': 'Staff Directory',
    'staff.tabAudit': 'Permission Audit Trail',
    'staff.approveBtn': 'Approve & Assign Role',
    'staff.deactivateBtn': 'Deactivate Account',
    'staff.assignBranch': 'Assigned Campus',
    'staff.assignRole': 'Academic Role',
    'staff.assignSystemRole': 'System Role',
    'staff.colName': 'Full Name',
    'staff.colEmail': 'Email & Contact',
    'staff.colBranchRole': 'Campus & Role',
    'staff.colSystemRole': 'System Access',
    'staff.colStatus': 'Status',
    'staff.colAction': 'Actions',

    // Branches & Classes View
    'branches.title': 'Branches & Classroom Cohorts',
    'branches.subtitle': 'Centralized multi-branch architecture with autonomous campus operations',
    'branches.systemBranches': 'Campuses in System ({count})',
    'branches.selected': 'Selected',
    'branches.classesInBranch': 'Classroom Cohorts at {branch} ({count})',
    'branches.colClassName': 'Class Name',
    'branches.colLevel': 'Level',
    'branches.colDefaultHrt': 'Class Default HRT',
    'branches.colMainTeacher': 'Main Teacher',
    'branches.colSchedule': 'Schedule',
    'branches.colStatus': 'Status',

};

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  vi: EN_TRANSLATIONS,
  en: EN_TRANSLATIONS,
};


interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallbackVi?: string) => string;
  tDb: (text: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: Language = 'en';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'en');
    } catch {
      // ignore
    }
    document.documentElement.lang = 'en';
    document.title = 'KAPLA - Oxford Quality English | Staff Portal';
  }, []);

  const setLanguage = (_lang: Language) => {
    // 100% English-only application
  };

  const toggleLanguage = () => {
    // 100% English-only application
  };

  const t = useMemo(() => {
    return (key: string, fallbackVi?: string): string => {
      const translated = TRANSLATIONS.en?.[key];
      if (translated) return translated;
      if (fallbackVi) {
        return translateDbText(fallbackVi, 'en') || key;
      }
      return key;
    };
  }, []);

  const tDb = useMemo(() => {
    return (text: string | null | undefined): string => {
      return translateDbText(text, 'en');
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, tDb }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// ==============================================================================
// Language Toggle Button Component (Hidden for 100% English Production)
// ==============================================================================

export const LanguageToggle: React.FC<{ className?: string; compact?: boolean }> = () => {
  return null;
};
