import fs from 'fs';
import path from 'path';
export * from './school-types';
import {
  StudentProfileData,
  RoutineSlotData,
  ExaminationRecordData,
  INSTITUTIONS
} from './school-types';

const maleFirstNames = [
  'Rahim', 'Karim', 'Tanvir', 'Farhan', 'Arif', 'Mehedi', 'Shahriar', 'Tahmid', 'Mahir', 'Fahim',
  'Ayman', 'Nabil', 'Sakib', 'Rifat', 'Shafi', 'Rayhan', 'Salman', 'Arman', 'Sadman', 'Zubair',
  'Tariq', 'Hasan', 'Alvi', 'Siam', 'Tamim', 'Imtiaz', 'Asif', 'Nayem', 'Sabbir', 'Mushfiq',
  'Jubayer', 'Shihab', 'Munim', 'Adnan', 'Kamrul', 'Mustafa', 'Anwar', 'Bashir', 'Nasim', 'Belal'
];

const femaleFirstNames = [
  'Sadia', 'Nusrat', 'Anika', 'Jannatul', 'Sumaiya', 'Nabila', 'Tasnim', 'Sabrina', 'Zarin', 'Fatema',
  'Samia', 'Lamia', 'Bushra', 'Maria', 'Mim', 'Afsana', 'Raisa', 'Farzana', 'Maliha', 'Ayesha',
  'Mehzabin', 'Humaira', 'Tasmia', 'Lubna', 'Sanjida', 'Nafisa', 'Afia', 'Israt', 'Rinvi', 'Maisha',
  'Tania', 'Fabiha', 'Nishat', 'Subah', 'Fariha', 'Samira', 'Ananya', 'Roshni', 'Tabassum', 'Zannat'
];

const lastNames = [
  'Chowdhury', 'Ahmed', 'Islam', 'Rahman', 'Hasan', 'Khan', 'Hossain', 'Ali', 'Haque', 'Sikder',
  'Mahmud', 'Mollah', 'Mia', 'Talukder', 'Dewan', 'Bepari', 'Gazi', 'Mazumder', 'Sarker', 'Pramanik',
  'Bhuiyan', 'Akhtar', 'Khatun', 'Kazi', 'Barua', 'Howlader', 'Patwary', 'Chakraborty', 'Roy', 'Biswas'
];

const fatherNames = [
  'Kabir', 'Mohammad', 'Abdur', 'Rafiqul', 'Golam', 'Jahangir', 'Nurul', 'Mizanur', 'Kamal', 'Shafiqul',
  'Mostafizur', 'Abdul', 'Zahirul', 'Ashraf', 'Monirul', 'Anisur', 'Enamul', 'Delwar', 'Harun', 'Farid'
];

const motherNames = [
  'Rokeya', 'Salma', 'Parvin', 'Nasreen', 'Shahana', 'Monira', 'Farida', 'Shirin', 'Bilkis', 'Rehana',
  'Sultana', 'Lutfun', 'Rasheda', 'Kohinoor', 'Jahanara', 'Shamima', 'Hosne', 'Maksuda', 'Nazma', 'Tahmina'
];

const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'];

// =========================================================================
// 1. GENERATE ALL 1,280 DETERMINISTIC STUDENTS ACROSS 3 INSTITUTIONS
// =========================================================================
export function generateInitialStudents(): StudentProfileData[] {
  const list: StudentProfileData[] = [];

  // 1. SCHOOL: Green Valley Smart Model School (Class 1 to 10 x 4 Sections x 20 Students = 800)
  for (let cIndex = 1; cIndex <= 10; cIndex++) {
    const cName = `Class ${cIndex}`;
    for (let sIndex = 0; sIndex <= 3; sIndex++) {
      const secLetter = String.fromCharCode(65 + sIndex);
      const sName = `Section ${secLetter}`;
      for (let roll = 1; roll <= 20; roll++) {
        const isFemale = roll % 2 === 0;
        const seed = cIndex * 100 + sIndex * 25 + roll;

        const firstName = isFemale
          ? femaleFirstNames[seed % femaleFirstNames.length]
          : maleFirstNames[seed % maleFirstNames.length];
        const lastName = lastNames[(seed * 3) % lastNames.length];
        const gender = isFemale ? 'Female' : 'Male';

        const isGuardianMother = roll % 3 === 0;
        const guardianFirst = isGuardianMother
          ? motherNames[seed % motherNames.length]
          : fatherNames[seed % fatherNames.length];
        const guardianName = `${guardianFirst} ${lastName}`;
        const guardianRel = isGuardianMother ? 'Mother' : 'Father';

        const stdCode = `MIC-2026-C${String(cIndex).padStart(2, '0')}${secLetter}-${String(roll).padStart(2, '0')}`;
        const id = `std-sch-c${cIndex}${secLetter.toLowerCase()}-${roll}`;

        const att = 82.0 + ((seed * 7) % 17) + (roll <= 3 ? 2.0 : 0.0);
        const clampedAtt = Math.min(99.0, Math.max(80.0, att));

        const gpaBase = 3.6 + ((seed * 13) % 140) / 100.0;
        const currentGpa = roll === 1 ? 5.0 : Math.min(5.0, Math.max(3.5, Math.round(gpaBase * 100) / 100));

        const blood = bloodGroups[seed % bloodGroups.length];
        const phone = `+880 1712-${String((cIndex * 7 + roll) % 90 + 10).padStart(2, '0')}${String((sIndex * 19 + roll) % 90 + 10).padStart(2, '0')}${String((roll * 4) % 90 + 10).padStart(2, '0')}`;
        const gPhone = `+880 1812-${String((cIndex * 11 + roll) % 90 + 10).padStart(2, '0')}${String((sIndex * 23 + roll) % 90 + 10).padStart(2, '0')}${String((roll * 3) % 90 + 10).padStart(2, '0')}`;

        const isDemo = cIndex === 10 && secLetter === 'A' && roll === 1;

        const email = isDemo
          ? 'student.demo@campusos.edu'
          : `student.c${String(cIndex).padStart(2, '0')}${secLetter.toLowerCase()}${roll}@campusos.edu`;

        const gEmail = isDemo
          ? 'guardian.demo@campusos.edu'
          : `guardian.c${String(cIndex).padStart(2, '0')}${secLetter.toLowerCase()}${roll}@campusos.edu`;

        const finalFirst = isDemo ? 'Rahim' : firstName;
        const finalLast = isDemo ? 'Chowdhury' : lastName;

        list.push({
          id,
          studentIdCode: stdCode,
          firstName: finalFirst,
          lastName: finalLast,
          fullName: `${finalFirst} ${finalLast}`,
          className: cName,
          sectionName: sName,
          institutionId: 'inst-school',
          institutionName: 'Green Valley Smart Model School',
          institutionCode: 'GVS',
          institutionType: 'School',
          attendancePercentage: isDemo ? 96.0 : clampedAtt,
          currentGpa: isDemo ? 5.0 : currentGpa,
          bloodGroup: isDemo ? 'B+' : blood,
          email,
          phone,
          guardianName: isDemo ? 'Kabir Chowdhury' : guardianName,
          guardianPhone: isDemo ? '+880 1812-311113' : gPhone,
          classNumber: cIndex,
          rollNumber: roll,
          rollDisplay: String(roll).padStart(2, '0'),
          gender: isDemo ? 'Male' : gender,
          guardianEmail: gEmail,
          guardianRelation: isDemo ? 'Father' : guardianRel
        });
      }
    }
  }

  // 2. COLLEGE: Crescent Model Higher Secondary College (Class 11 & 12 x 4 Sections x 20 Students = 160)
  const collegeClasses = ['Class 11 (HSC 1st Year)', 'Class 12 (HSC 2nd Year)'];
  const collegeSections = ['Section A (Science)', 'Section B (Business)', 'Section C (Humanities)', 'Section D (ICT Voc)'];

  collegeClasses.forEach((cName, cIdx) => {
    collegeSections.forEach((sName, sIdx) => {
      for (let roll = 1; roll <= 20; roll++) {
        const isFemale = roll % 2 === 1;
        const seed = 2000 + cIdx * 100 + sIdx * 25 + roll;
        const firstName = isFemale ? femaleFirstNames[seed % femaleFirstNames.length] : maleFirstNames[seed % maleFirstNames.length];
        const lastName = lastNames[(seed * 3) % lastNames.length];
        const isMother = roll % 3 === 0;
        const gFirst = isMother ? motherNames[seed % motherNames.length] : fatherNames[seed % fatherNames.length];
        const stdCode = `CMC-2026-H${String(cIdx + 11)}${String.fromCharCode(65 + sIdx)}-${String(roll).padStart(2, '0')}`;
        const id = `std-col-h${cIdx + 11}${String.fromCharCode(97 + sIdx)}-${roll}`;
        const isCollegeDemo = cIdx === 1 && sIdx === 0 && roll === 1;

        const att = Math.min(99.0, Math.max(80.0, 84.0 + ((seed * 7) % 15)));
        const gpa = roll === 1 ? 5.00 : Math.min(5.00, Math.max(3.50, Math.round((3.70 + ((seed * 11) % 130) / 100.0) * 100) / 100));

        list.push({
          id,
          studentIdCode: stdCode,
          firstName: isCollegeDemo ? 'Samiul' : firstName,
          lastName: isCollegeDemo ? 'Karim' : lastName,
          fullName: isCollegeDemo ? 'Samiul Karim' : `${firstName} ${lastName}`,
          className: cName,
          sectionName: sName,
          institutionId: 'inst-college',
          institutionName: 'Crescent Model Higher Secondary College',
          institutionCode: 'CMC',
          institutionType: 'College',
          attendancePercentage: isCollegeDemo ? 95.5 : att,
          currentGpa: isCollegeDemo ? 4.92 : gpa,
          bloodGroup: bloodGroups[seed % bloodGroups.length],
          email: isCollegeDemo ? 'student.college@campusos.edu' : `student.col${cIdx + 11}${String.fromCharCode(97 + sIdx)}${roll}@campusos.edu`,
          phone: `+880 1713-${String((cIdx * 9 + roll) % 90 + 10).padStart(2, '0')}${String((sIdx * 17 + roll) % 90 + 10).padStart(2, '0')}${String((roll * 3) % 90 + 10).padStart(2, '0')}`,
          guardianName: isCollegeDemo ? 'Fazlur Karim' : `${gFirst} ${lastName}`,
          guardianPhone: `+880 1813-${String((cIdx * 13 + roll) % 90 + 10).padStart(2, '0')}${String((sIdx * 21 + roll) % 90 + 10).padStart(2, '0')}${String((roll * 4) % 90 + 10).padStart(2, '0')}`,
          classNumber: cIdx + 11,
          rollNumber: roll,
          rollDisplay: String(roll).padStart(2, '0'),
          gender: isFemale ? 'Female' : 'Male',
          guardianEmail: isCollegeDemo ? 'guardian.college@campusos.edu' : `guardian.col${cIdx + 11}${String.fromCharCode(97 + sIdx)}${roll}@campusos.edu`,
          guardianRelation: isMother ? 'Mother' : 'Father'
        });
      }
    });
  });

  // 3. UNIVERSITY: Metropolitan University of Technology & Science (4 Depts x 4 Batches x 20 Students = 320)
  const univDepts = ['Dept of CSE', 'Dept of EEE', 'Dept of BBA', 'Dept of English'];
  const univBatches = ['1st Year (Batch 26)', '2nd Year (Batch 25)', '3rd Year (Batch 24)', '4th Year (Batch 23)'];
  const deptCodes = ['CSE', 'EEE', 'BBA', 'ENG'];

  univDepts.forEach((dName, dIdx) => {
    const dCode = deptCodes[dIdx];
    univBatches.forEach((bName, bIdx) => {
      for (let roll = 1; roll <= 20; roll++) {
        const isFemale = roll % 2 === 0;
        const seed = 3000 + dIdx * 100 + bIdx * 25 + roll;
        const firstName = isFemale ? femaleFirstNames[seed % femaleFirstNames.length] : maleFirstNames[seed % maleFirstNames.length];
        const lastName = lastNames[(seed * 3) % lastNames.length];
        const isMother = roll % 3 === 0;
        const gFirst = isMother ? motherNames[seed % motherNames.length] : fatherNames[seed % fatherNames.length];
        const stdCode = `MUTS-2026-${dCode}${bIdx + 1}-${String(roll).padStart(2, '0')}`;
        const id = `std-uni-${dCode.toLowerCase()}${bIdx + 1}-${roll}`;
        const isUnivDemo = dIdx === 0 && bIdx === 3 && roll === 1;

        const att = Math.min(99.0, Math.max(80.0, 85.0 + ((seed * 5) % 14)));
        const cgpa = isUnivDemo ? 3.98 : Math.min(4.00, Math.max(3.20, Math.round((3.50 + ((seed * 9) % 50) / 100.0) * 100) / 100));

        list.push({
          id,
          studentIdCode: stdCode,
          firstName: isUnivDemo ? 'Tanvir' : firstName,
          lastName: isUnivDemo ? 'Ahmed' : lastName,
          fullName: isUnivDemo ? 'Tanvir Ahmed' : `${firstName} ${lastName}`,
          className: dName,
          sectionName: bName,
          institutionId: 'inst-university',
          institutionName: 'Metropolitan University of Technology & Science',
          institutionCode: 'MUTS',
          institutionType: 'University',
          attendancePercentage: isUnivDemo ? 97.0 : att,
          currentGpa: isUnivDemo ? 3.98 : cgpa,
          bloodGroup: bloodGroups[seed % bloodGroups.length],
          email: isUnivDemo ? 'student.varsity@campusos.edu' : `student.${dCode.toLowerCase()}${bIdx + 1}${String(roll).padStart(2, '0')}@campusos.edu`,
          phone: `+880 1714-${String((dIdx * 11 + roll) % 90 + 10).padStart(2, '0')}${String((bIdx * 15 + roll) % 90 + 10).padStart(2, '0')}${String((roll * 5) % 90 + 10).padStart(2, '0')}`,
          guardianName: isUnivDemo ? 'Aminul Ahmed' : `${gFirst} ${lastName}`,
          guardianPhone: `+880 1814-${String((dIdx * 17 + roll) % 90 + 10).padStart(2, '0')}${String((bIdx * 19 + roll) % 90 + 10).padStart(2, '0')}${String((roll * 2) % 90 + 10).padStart(2, '0')}`,
          classNumber: bIdx + 1,
          rollNumber: roll,
          rollDisplay: String(roll).padStart(2, '0'),
          gender: isFemale ? 'Female' : 'Male',
          guardianEmail: isUnivDemo ? 'guardian.varsity@campusos.edu' : `guardian.${dCode.toLowerCase()}${bIdx + 1}${String(roll).padStart(2, '0')}@campusos.edu`,
          guardianRelation: isMother ? 'Mother' : 'Father'
        });
      }
    });
  });

  return list;
}

// =========================================================================
// 2. GENERATE ROUTINES ACROSS ALL 3 INSTITUTIONS
// =========================================================================
export function generateInitialRoutines(): Record<string, RoutineSlotData[]> {
  const map: Record<string, RoutineSlotData[]> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const periods = [
    ['09:00 AM', '10:00 AM'],
    ['10:15 AM', '11:15 AM'],
    ['11:30 AM', '12:30 PM'],
    ['01:15 PM', '02:15 PM'],
    ['02:30 PM', '03:30 PM']
  ];

  // 1. School Routines
  for (let cIndex = 1; cIndex <= 10; cIndex++) {
    const cName = `Class ${cIndex}`;
    for (let sIndex = 0; sIndex <= 3; sIndex++) {
      const secLetter = String.fromCharCode(65 + sIndex);
      const sName = `Section ${secLetter}`;
      const key = `inst-school - ${cName} - ${sName}`;
      const legacyKey = `${cName} - ${sName}`;

      const slots: RoutineSlotData[] = [];
      const subList = cIndex <= 5 ? [
        ['BAN-101', 'Bangla Language & Literature'],
        ['ENG-101', 'English for Today'],
        ['MTH-101', 'Elementary Mathematics'],
        ['SCI-101', 'Elementary Science'],
        ['BGS-101', 'Bangladesh & Global Studies']
      ] : cIndex <= 8 ? [
        ['BAN-201', 'Bangla Sahitya & Byakaran'],
        ['ENG-201', 'English Grammar & Comp'],
        ['MTH-201', 'General Mathematics'],
        ['GSC-201', 'General Science'],
        ['ICT-201', 'ICT & Computer Literacy']
      ] : [
        ['MTH-301', 'Advanced Mathematics'],
        ['PHY-301', 'Physics & Mechanics'],
        ['CHM-301', 'Chemistry & Lab'],
        ['BIO-301', 'Biology & Genetics'],
        ['ICT-301', 'Computer Programming & Algorithms']
      ];

      days.forEach((day, dIdx) => {
        periods.forEach((period, pIdx) => {
          const sub = subList[(dIdx + pIdx + sIndex) % subList.length];
          slots.push({
            id: `rt-sch-${cIndex}${secLetter}-${dIdx}-${pIdx}`,
            subjectCode: sub[0],
            subjectName: sub[1],
            teacherName: `Dr. Faculty ${pIdx + 1}`,
            startTime: period[0],
            endTime: period[1],
            roomNumber: `Room ${100 + cIndex * 2 + pIdx}`,
            dayOfWeek: day,
            className: cName,
            sectionName: sName,
            institutionId: 'inst-school'
          });
        });
      });

      map[key] = slots;
      map[legacyKey] = slots; // fallback backwards compatibility
    }
  }

  // 2. College Routines
  const collegeClasses = ['Class 11 (HSC 1st Year)', 'Class 12 (HSC 2nd Year)'];
  const collegeSections = ['Section A (Science)', 'Section B (Business)', 'Section C (Humanities)', 'Section D (ICT Voc)'];
  collegeClasses.forEach((cName, cIdx) => {
    collegeSections.forEach((sName, sIdx) => {
      const key = `inst-college - ${cName} - ${sName}`;
      const slots: RoutineSlotData[] = [];
      const subList = sIdx === 0 ? [
        ['PHY-101', 'HSC Physics & Mechanics'],
        ['CHM-101', 'HSC Organic Chemistry'],
        ['MTH-101', 'HSC Calculus & Higher Math'],
        ['BIO-101', 'HSC Zoology & Botany'],
        ['ENG-101', 'HSC English Comp']
      ] : sIdx === 1 ? [
        ['ACC-101', 'Principles of Accounting'],
        ['FIN-101', 'Finance & Banking'],
        ['BOM-101', 'Business Organization'],
        ['ECO-101', 'Microeconomics'],
        ['ENG-101', 'HSC English Comp']
      ] : sIdx === 2 ? [
        ['ECO-101', 'Economics'],
        ['CIV-101', 'Civics & Good Governance'],
        ['HIS-101', 'Islamic History & Culture'],
        ['SOC-101', 'Social Work'],
        ['ENG-101', 'HSC English Comp']
      ] : [
        ['ICT-101', 'ICT & Database Systems'],
        ['PRG-101', 'C Programming & Web Dev'],
        ['MTH-101', 'Applied Mathematics'],
        ['BAN-101', 'Bangla 1st'],
        ['ENG-101', 'HSC English Comp']
      ];

      days.forEach((day, dIdx) => {
        periods.forEach((period, pIdx) => {
          const sub = subList[(dIdx + pIdx) % subList.length];
          slots.push({
            id: `rt-col-${cIdx}-${sIdx}-${dIdx}-${pIdx}`,
            subjectCode: sub[0],
            subjectName: sub[1],
            teacherName: `Prof. College Faculty ${pIdx + 1}`,
            startTime: period[0],
            endTime: period[1],
            roomNumber: `College Hall ${201 + pIdx}`,
            dayOfWeek: day,
            className: cName,
            sectionName: sName,
            institutionId: 'inst-college'
          });
        });
      });
      map[key] = slots;
    });
  });

  // 3. University Routines
  const univDepts = ['Dept of CSE', 'Dept of EEE', 'Dept of BBA', 'Dept of English'];
  const univBatches = ['1st Year (Batch 26)', '2nd Year (Batch 25)', '3rd Year (Batch 24)', '4th Year (Batch 23)'];
  univDepts.forEach((dName, dIdx) => {
    univBatches.forEach((bName, bIdx) => {
      const key = `inst-university - ${dName} - ${bName}`;
      const slots: RoutineSlotData[] = [];
      const subList = dIdx === 0 ? [
        ['CSE-301', 'Algorithms & Complexity'],
        ['CSE-305', 'Database Systems & SQL'],
        ['CSE-315', 'Software Engineering'],
        ['CSE-401', 'Artificial Intelligence'],
        ['CSE-410', 'Computer Networks']
      ] : dIdx === 1 ? [
        ['EEE-201', 'Electric Circuit Analysis'],
        ['EEE-301', 'Microprocessors & Interfacing'],
        ['EEE-315', 'Signals and Linear Systems'],
        ['EEE-401', 'Power System Analysis'],
        ['EEE-410', 'Telecommunication Engineering']
      ] : dIdx === 2 ? [
        ['BBA-201', 'Financial Management'],
        ['BBA-205', 'Principles of Marketing'],
        ['BBA-301', 'Organizational Behavior'],
        ['BBA-315', 'Strategic Business Analytics'],
        ['BBA-401', 'Corporate Governance']
      ] : [
        ['ENG-201', 'Linguistics & Phonetics'],
        ['ENG-205', '19th Century British Poetry'],
        ['ENG-301', 'Shakespearean Drama'],
        ['ENG-315', 'Literary Criticism'],
        ['ENG-401', 'Postcolonial Literature']
      ];

      days.forEach((day, dIdxDay) => {
        periods.forEach((period, pIdx) => {
          const sub = subList[(dIdxDay + pIdx) % subList.length];
          slots.push({
            id: `rt-uni-${dIdx}-${bIdx}-${dIdxDay}-${pIdx}`,
            subjectCode: sub[0],
            subjectName: sub[1],
            teacherName: 'Prof. Dr. Department Chair',
            startTime: period[0],
            endTime: period[1],
            roomNumber: `Academic Complex Lab ${301 + pIdx}`,
            dayOfWeek: day,
            className: dName,
            sectionName: bName,
            institutionId: 'inst-university'
          });
        });
      });
      map[key] = slots;
    });
  });

  return map;
}

// =========================================================================
// 3. GENERATE EXAMS ACROSS ALL 3 INSTITUTIONS
// =========================================================================
export function generateInitialExams(): Record<string, ExaminationRecordData[]> {
  const map: Record<string, ExaminationRecordData[]> = {};

  // 1. School Exams
  for (let cIndex = 1; cIndex <= 10; cIndex++) {
    const cName = `Class ${cIndex}`;
    const key = `inst-school - ${cName}`;
    const legacyKey = cName;

    const examList: ExaminationRecordData[] = [
      { id: `ex-sch-${cIndex}-1`, title: 'Midterm Examination - Mathematics', startDate: '28 Nov 2026', time: '10:00 AM - 01:00 PM', room: `Hall ${100 + cIndex}`, status: 'Scheduled', className: cName, subjectCode: 'MTH-101', institutionId: 'inst-school' },
      { id: `ex-sch-${cIndex}-2`, title: 'Midterm Examination - Science', startDate: '30 Nov 2026', time: '10:00 AM - 01:00 PM', room: `Hall ${100 + cIndex}`, status: 'Scheduled', className: cName, subjectCode: 'SCI-101', institutionId: 'inst-school' },
      { id: `ex-sch-${cIndex}-3`, title: 'Midterm Examination - English', startDate: '02 Dec 2026', time: '10:00 AM - 01:00 PM', room: `Hall ${100 + cIndex}`, status: 'Scheduled', className: cName, subjectCode: 'ENG-101', institutionId: 'inst-school' }
    ];
    map[key] = examList;
    map[legacyKey] = examList;
  }

  // 2. College Exams
  ['Class 11 (HSC 1st Year)', 'Class 12 (HSC 2nd Year)'].forEach((cName, idx) => {
    const key = `inst-college - ${cName}`;
    map[key] = [
      { id: `ex-col-${idx}-1`, title: 'HSC Pre-Test - Physics / Accounting / Economics', startDate: '28 Nov 2026', time: '10:00 AM - 01:00 PM', room: 'College Auditorium Hall 1', status: 'Scheduled', className: cName, subjectCode: 'HSC-301', institutionId: 'inst-college' },
      { id: `ex-col-${idx}-2`, title: 'HSC Pre-Test - Chemistry / Business / Civics', startDate: '30 Nov 2026', time: '10:00 AM - 01:00 PM', room: 'College Auditorium Hall 1', status: 'Scheduled', className: cName, subjectCode: 'HSC-302', institutionId: 'inst-college' },
      { id: `ex-col-${idx}-3`, title: 'HSC Pre-Test - Higher Math / Finance / History', startDate: '02 Dec 2026', time: '10:00 AM - 01:00 PM', room: 'College Auditorium Hall 1', status: 'Scheduled', className: cName, subjectCode: 'HSC-303', institutionId: 'inst-college' }
    ];
  });

  // 3. University Exams
  ['Dept of CSE', 'Dept of EEE', 'Dept of BBA', 'Dept of English'].forEach((dName, idx) => {
    const key = `inst-university - ${dName}`;
    map[key] = [
      { id: `ex-uni-${idx}-1`, title: 'Semester Final Exam - Core Major Course 1', startDate: '28 Nov 2026', time: '10:00 AM - 01:00 PM', room: 'Exam Hall Complex 402', status: 'Scheduled', className: dName, subjectCode: 'UNI-401', institutionId: 'inst-university' },
      { id: `ex-uni-${idx}-2`, title: 'Semester Final Exam - Core Major Course 2', startDate: '30 Nov 2026', time: '10:00 AM - 01:00 PM', room: 'Exam Hall Complex 404', status: 'Scheduled', className: dName, subjectCode: 'UNI-402', institutionId: 'inst-university' },
      { id: `ex-uni-${idx}-3`, title: 'Semester Final Exam - Elective / Lab Practical', startDate: '02 Dec 2026', time: '10:00 AM - 01:00 PM', room: 'Science Complex Lab 102', status: 'Scheduled', className: dName, subjectCode: 'UNI-403', institutionId: 'inst-university' }
    ];
  });

  return map;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'school_students.json');
const ROUTINES_FILE = path.join(DATA_DIR, 'school_routines.json');
const EXAMS_FILE = path.join(DATA_DIR, 'school_exams.json');

// Memory Cache
let memoryStudents: StudentProfileData[] | null = null;
let memoryRoutines: Record<string, RoutineSlotData[]> | null = null;
let memoryExams: Record<string, ExaminationRecordData[]> | null = null;

export function getSchoolStudents(): StudentProfileData[] {
  if (memoryStudents && memoryStudents.length >= 1280) return memoryStudents;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STUDENTS_FILE)) {
      const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length >= 1280) {
        memoryStudents = parsed;
        return memoryStudents!;
      }
    }
  } catch (e) {
    console.error('Error reading students file:', e);
  }

  // Generate and save initial 1,280 students across 3 institutions
  memoryStudents = generateInitialStudents();
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(memoryStudents, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing students file:', e);
  }
  return memoryStudents;
}

export function saveSchoolStudents(students: StudentProfileData[]): void {
  memoryStudents = students;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf8');
  } catch (e) {
    console.error('Error persisting students:', e);
  }
}

export function updateSchoolStudent(updated: Partial<StudentProfileData> & { id: string }): StudentProfileData | null {
  const current = getSchoolStudents();
  let foundStudent: StudentProfileData | null = null;
  const nextList = current.map(s => {
    if (s.id === updated.id) {
      const updatedItem = {
        ...s,
        ...updated,
        fullName: `${updated.firstName ?? s.firstName} ${updated.lastName ?? s.lastName}`,
        rollDisplay: updated.rollNumber !== undefined ? String(updated.rollNumber).padStart(2, '0') : s.rollDisplay
      };
      foundStudent = updatedItem;
      return updatedItem;
    }
    return s;
  });

  if (foundStudent) {
    saveSchoolStudents(nextList);
  }
  return foundStudent;
}

export function getRoutinesStore(): Record<string, RoutineSlotData[]> {
  if (memoryRoutines && Object.keys(memoryRoutines).length > 20) return memoryRoutines;
  try {
    if (fs.existsSync(ROUTINES_FILE)) {
      const data = fs.readFileSync(ROUTINES_FILE, 'utf8');
      memoryRoutines = JSON.parse(data);
      if (memoryRoutines && Object.keys(memoryRoutines).length > 20) {
        return memoryRoutines;
      }
    }
  } catch (e) {
    console.error('Error reading routines file:', e);
  }
  memoryRoutines = generateInitialRoutines();
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ROUTINES_FILE, JSON.stringify(memoryRoutines, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing routines file:', e);
  }
  return memoryRoutines;
}

export function getExamsStore(): Record<string, ExaminationRecordData[]> {
  if (memoryExams && Object.keys(memoryExams).length > 10) return memoryExams;
  try {
    if (fs.existsSync(EXAMS_FILE)) {
      const data = fs.readFileSync(EXAMS_FILE, 'utf8');
      memoryExams = JSON.parse(data);
      if (memoryExams && Object.keys(memoryExams).length > 10) {
        return memoryExams;
      }
    }
  } catch (e) {
    console.error('Error reading exams file:', e);
  }
  memoryExams = generateInitialExams();
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(EXAMS_FILE, JSON.stringify(memoryExams, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing exams file:', e);
  }
  return memoryExams;
}

export function getStudentByEmail(email: string): StudentProfileData | undefined {
  const students = getSchoolStudents();
  const clean = email.trim().toLowerCase();
  return students.find(s => s.email.toLowerCase() === clean) ||
    (clean.includes('college') ? students.find(s => s.institutionId === 'inst-college') : undefined) ||
    (clean.includes('varsity') || clean.includes('uni') ? students.find(s => s.institutionId === 'inst-university') : undefined) ||
    (clean.includes('student') ? students[0] : undefined);
}

export function getChildrenForGuardian(guardianEmail: string): StudentProfileData[] {
  const students = getSchoolStudents();
  const clean = guardianEmail.trim().toLowerCase();
  const direct = students.filter(s => s.guardianEmail.toLowerCase() === clean);
  if (direct.length > 0) return direct;
  // Demo guardian strictly linked to Rahim (School) and sibling Samiul (College)
  return [
    students.find(s => s.institutionId === 'inst-school' && s.rollNumber === 1) || students[0],
    students.find(s => s.institutionId === 'inst-college' && s.rollNumber === 1) || students[1]
  ];
}
