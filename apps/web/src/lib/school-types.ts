export interface InstitutionData {
  id: string;
  name: string;
  shortName: string;
  type: 'School' | 'College' | 'University';
  code: string;
  tagline: string;
  classList: string[];
  sectionList: string[];
  iconEmoji: string;
}

export const CREATOR_NAME = "Antar Dasgupta";
export const CREATOR_EMAIL = "antardasgupta@gmail.com";
export const CREATOR_TITLE = "System Creator & Chief Architect";
export const COPYRIGHT_NOTICE = "© 2026 Antar Dasgupta. All Rights Reserved.";

export const INSTITUTIONS: InstitutionData[] = [
  {
    id: "inst-school",
    name: "Green Valley Smart Model School",
    shortName: "Green Valley School",
    type: "School",
    code: "GVS",
    tagline: "General Schooling (Class 1 to 10 • 40 Sections • 800 Students)",
    classList: Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`),
    sectionList: ['Section A', 'Section B', 'Section C', 'Section D'],
    iconEmoji: "🏫",
  },
  {
    id: "inst-college",
    name: "Crescent Model Higher Secondary College",
    shortName: "Crescent College",
    type: "College",
    code: "CMC",
    tagline: "Higher Secondary Education (HSC 11 & 12 • Science, Business, Humanities, ICT)",
    classList: ['Class 11 (HSC 1st Year)', 'Class 12 (HSC 2nd Year)'],
    sectionList: ['Section A (Science)', 'Section B (Business)', 'Section C (Humanities)', 'Section D (ICT Voc)'],
    iconEmoji: "🎓",
  },
  {
    id: "inst-university",
    name: "Metropolitan University of Technology & Science",
    shortName: "Metropolitan University",
    type: "University",
    code: "MUTS",
    tagline: "Undergraduate Degree Programs (Dept of CSE, EEE, BBA, English • 4 Batches)",
    classList: ['Dept of CSE', 'Dept of EEE', 'Dept of BBA', 'Dept of English'],
    sectionList: ['1st Year (Batch 26)', '2nd Year (Batch 25)', '3rd Year (Batch 24)', '4th Year (Batch 23)'],
    iconEmoji: "🏛️",
  },
];

export interface StudentProfileData {
  id: string;
  studentIdCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  className: string;
  sectionName: string;
  institutionId?: string;
  institutionName: string;
  institutionCode: string;
  institutionType?: string;
  attendancePercentage: number;
  currentGpa: number;
  bloodGroup: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  classNumber: number;
  rollNumber: number;
  rollDisplay: string;
  gender: string;
  guardianEmail: string;
  guardianRelation: string;
}

export interface RoutineSlotData {
  id: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  dayOfWeek: string;
  className: string;
  sectionName: string;
  institutionId?: string;
}

export interface ExaminationRecordData {
  id: string;
  title: string;
  startDate: string;
  time: string;
  room: string;
  status: string;
  className: string;
  subjectCode: string;
  institutionId?: string;
}

export interface SubjectResultData {
  code: string;
  title: string;
  credits: number;
  gradePoint: number;
  letterGrade: string;
  marks: number;
}

export const CLASS_LIST = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

export const SECTION_LIST = ['Section A', 'Section B', 'Section C', 'Section D'];

export function getStudentResults(student: StudentProfileData): SubjectResultData[] {
  const g = student.currentGpa;
  const letter = g >= 4.90 ? 'A+' : g >= 4.00 ? 'A' : g >= 3.50 ? 'A-' : 'B';
  const markBase = Math.min(98, Math.max(70, Math.floor(g * 19.5)));

  if (student.institutionId === 'inst-college') {
    return [
      { code: 'PHY-101', title: 'HSC Physics', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase + 2 },
      { code: 'CHM-101', title: 'HSC Chemistry', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'MTH-101', title: 'Higher Mathematics', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase + 3 },
      { code: 'ENG-101', title: 'English Comp', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 1 },
      { code: 'ICT-101', title: 'Information Technology', credits: 3, gradePoint: 5.0, letterGrade: 'A+', marks: 96 }
    ];
  }

  if (student.institutionId === 'inst-university') {
    return [
      { code: 'CSE-301', title: 'Algorithms & Complexity', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 2 },
      { code: 'CSE-305', title: 'Database Systems', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'CSE-315', title: 'Software Engineering', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 3 },
      { code: 'CSE-401', title: 'Artificial Intelligence', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 1 },
      { code: 'CSE-410', title: 'Computer Networks Lab', credits: 1, gradePoint: 4.0, letterGrade: 'A+', marks: 95 }
    ];
  }

  const c = student.classNumber;
  if (c <= 5) {
    return [
      { code: 'BAN-101', title: 'Bangla Language & Literature', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'ENG-101', title: 'English for Today', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 1 },
      { code: 'MTH-101', title: 'Elementary Mathematics', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase + 2 },
      { code: 'SCI-101', title: 'Elementary Science', credits: 3, gradePoint: Math.max(3.5, g - 0.2), letterGrade: 'A', marks: markBase - 4 },
      { code: 'BGS-101', title: 'Bangladesh & Global Studies', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'REL-101', title: 'Religious & Moral Studies', credits: 2, gradePoint: 5.0, letterGrade: 'A+', marks: 95 }
    ];
  } else if (c <= 8) {
    return [
      { code: 'BAN-201', title: 'Bangla Sahitya & Byakaran', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'ENG-201', title: 'English Grammar & Comp', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 1 },
      { code: 'MTH-201', title: 'General Mathematics', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase + 3 },
      { code: 'GSC-201', title: 'General Science', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'ICT-201', title: 'ICT & Computer', credits: 3, gradePoint: 5.0, letterGrade: 'A+', marks: 94 },
      { code: 'BGS-201', title: 'Bangladesh & Global Studies', credits: 3, gradePoint: Math.max(3.5, g - 0.3), letterGrade: 'A', marks: markBase - 5 }
    ];
  } else {
    return [
      { code: 'MTH-301', title: 'Advanced Mathematics', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase + 3 },
      { code: 'PHY-301', title: 'Physics & Mechanics', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase + 2 },
      { code: 'CHM-301', title: 'Chemistry & Lab', credits: 4, gradePoint: g, letterGrade: letter, marks: markBase },
      { code: 'ENG-301', title: 'English Literature & Comp', credits: 3, gradePoint: g, letterGrade: letter, marks: markBase + 1 },
      { code: 'ICT-301', title: 'Computer Programming & Algo', credits: 3, gradePoint: 5.0, letterGrade: 'A+', marks: 96 },
      { code: 'BIO-301', title: 'General Biology', credits: 3, gradePoint: Math.max(3.5, g - 0.4), letterGrade: 'A', marks: markBase - 6 }
    ];
  }
}
