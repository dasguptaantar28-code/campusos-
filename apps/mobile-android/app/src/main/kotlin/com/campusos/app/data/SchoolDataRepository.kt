package com.campusos.app.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

// =========================================================================
// INSTITUTION & DATA MODELS (Multi-Institution: School, College, University)
// =========================================================================

data class InstitutionData(
    val id: String,
    val name: String,
    val shortName: String,
    val type: String, // "School", "College", "University"
    val code: String,
    val tagline: String,
    val classList: List<String>,
    val sectionList: List<String>,
    val iconEmoji: String = "🏫"
)

data class StudentProfileData(
    val id: String = "std-c10a-01",
    val studentIdCode: String = "MIC-2026-C10A-01",
    val firstName: String = "Rahim",
    val lastName: String = "Chowdhury",
    val className: String = "Class 10",
    val sectionName: String = "Section A",
    val institutionId: String = "inst-school",
    val institutionName: String = "Green Valley Smart Model School",
    val institutionCode: String = "GVS",
    val institutionType: String = "School",
    val attendancePercentage: Double = 96.0,
    val currentGpa: Double = 5.00,
    val bloodGroup: String = "B+",
    val email: String = "student.demo@campusos.edu",
    val phone: String = "+880 1712-345678",
    val guardianName: String = "Kabir Chowdhury",
    val guardianPhone: String = "+880 1812-311113",
    val classNumber: Int = 10,
    val rollNumber: Int = 1,
    val gender: String = "Male",
    val guardianEmail: String = "guardian.demo@campusos.edu",
    val guardianRelation: String = "Father"
) {
    val fullName: String get() = "$firstName $lastName"
    val rollDisplay: String get() = String.format("%02d", rollNumber)
}

data class RoutineSlotData(
    val id: String,
    val subjectCode: String,
    val subjectName: String,
    val teacherName: String,
    val startTime: String,
    val endTime: String,
    val roomNumber: String,
    val dayOfWeek: String,
    val className: String = "Class 10",
    val sectionName: String = "Section A",
    val institutionId: String = "inst-school"
)

data class InvoiceItemData(
    val id: String,
    val invoiceNumber: String,
    val title: String,
    val totalAmount: Double,
    val paidAmount: Double,
    val dueAmount: Double,
    val status: String,
    val dueDate: String,
    val studentId: String = ""
)

data class CampusNoticeData(
    val id: String,
    val title: String,
    val content: String,
    val publishedDate: String,
    val category: String = "Academic",
    val isPinned: Boolean = false,
    val institutionId: String = "inst-school"
)

data class ExaminationRecordData(
    val id: String,
    val title: String,
    val startDate: String,
    val time: String,
    val room: String,
    val status: String = "Scheduled",
    val className: String = "Class 10",
    val subjectCode: String = "",
    val institutionId: String = "inst-school"
)

data class DailyAttendanceRecordData(
    val date: String,
    val day: String,
    val status: String,
    val subject: String,
    val time: String
)

data class SubjectResultData(
    val code: String,
    val title: String,
    val credits: Int,
    val gradePoint: Double,
    val letterGrade: String,
    val marks: Int = 85
)

data class RegistrationItemData(
    val id: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val institutionName: String,
    val role: String,
    val source: String,
    var status: String,
    val notes: String,
    val createdAt: String
)

// =========================================================================
// CENTRAL SCHOOL & MULTI-INSTITUTION REPOSITORY (Single Source of Truth)
// =========================================================================

object SchoolDataRepository {

    // Creator Information & Copyright Constants
    const val CREATOR_NAME = "Antar Dasgupta"
    const val CREATOR_TITLE = "System Creator & Chief Architect • Super Administrator"
    const val CREATOR_EMAIL = "antardasgupta@gmail.com"
    const val COPYRIGHT_NOTICE = "© 2026 Antar Dasgupta. All Rights Reserved. Created by Antar Dasgupta."

    // Three Complete Institutions
    val institutions = listOf(
        InstitutionData(
            id = "inst-school",
            name = "Green Valley Smart Model School",
            shortName = "Green Valley School",
            type = "School",
            code = "GVS",
            tagline = "General Schooling (Class 1 to 10 • 40 Sections • 800 Students)",
            classList = (1..10).map { "Class $it" },
            sectionList = listOf("Section A", "Section B", "Section C", "Section D"),
            iconEmoji = "🏫"
        ),
        InstitutionData(
            id = "inst-college",
            name = "Crescent Model Higher Secondary College",
            shortName = "Crescent College",
            type = "College",
            code = "CMC",
            tagline = "Higher Secondary Education (HSC 11 & 12 • Science, Business, Humanities, ICT)",
            classList = listOf("Class 11 (HSC 1st Year)", "Class 12 (HSC 2nd Year)"),
            sectionList = listOf("Section A (Science)", "Section B (Business)", "Section C (Humanities)", "Section D (ICT Voc)"),
            iconEmoji = "🎓"
        ),
        InstitutionData(
            id = "inst-university",
            name = "Metropolitan University of Technology & Science",
            shortName = "Metropolitan University",
            type = "University",
            code = "MUTS",
            tagline = "Undergraduate Degree Programs (Dept of CSE, EEE, BBA, English • 4 Batches)",
            classList = listOf("Dept of CSE", "Dept of EEE", "Dept of BBA", "Dept of English"),
            sectionList = listOf("1st Year (Batch 26)", "2nd Year (Batch 25)", "3rd Year (Batch 24)", "4th Year (Batch 23)"),
            iconEmoji = "🏛️"
        )
    )

    var currentInstitutionId by mutableStateOf("inst-school")

    val currentInstitution: InstitutionData
        get() = institutions.find { it.id == currentInstitutionId } ?: institutions.first()

    val classList: List<String>
        get() = currentInstitution.classList

    val sectionList: List<String>
        get() = currentInstitution.sectionList

    fun switchInstitution(id: String) {
        if (institutions.any { it.id == id }) {
            currentInstitutionId = id
        }
    }

    // Common Bangla Name Pools
    private val maleFirstNames = listOf(
        "Rahim", "Karim", "Tanvir", "Farhan", "Arif", "Mehedi", "Shahriar", "Tahmid", "Mahir", "Fahim",
        "Ayman", "Nabil", "Sakib", "Rifat", "Shafi", "Rayhan", "Salman", "Arman", "Sadman", "Zubair",
        "Tariq", "Hasan", "Alvi", "Siam", "Tamim", "Imtiaz", "Asif", "Nayem", "Sabbir", "Mushfiq",
        "Jubayer", "Shihab", "Munim", "Adnan", "Kamrul", "Mustafa", "Anwar", "Bashir", "Nasim", "Belal"
    )

    private val femaleFirstNames = listOf(
        "Sadia", "Nusrat", "Anika", "Jannatul", "Sumaiya", "Nabila", "Tasnim", "Sabrina", "Zarin", "Fatema",
        "Samia", "Lamia", "Bushra", "Maria", "Mim", "Afsana", "Raisa", "Farzana", "Maliha", "Ayesha",
        "Mehzabin", "Humaira", "Tasmia", "Lubna", "Sanjida", "Nafisa", "Afia", "Israt", "Rinvi", "Maisha",
        "Tania", "Fabiha", "Nishat", "Subah", "Fariha", "Samira", "Ananya", "Roshni", "Tabassum", "Zannat"
    )

    private val lastNames = listOf(
        "Chowdhury", "Ahmed", "Islam", "Rahman", "Hasan", "Khan", "Hossain", "Ali", "Haque", "Sikder",
        "Mahmud", "Mollah", "Mia", "Talukder", "Dewan", "Bepari", "Gazi", "Mazumder", "Sarker", "Pramanik",
        "Bhuiyan", "Akhtar", "Khatun", "Kazi", "Barua", "Howlader", "Patwary", "Chakraborty", "Roy", "Biswas"
    )

    private val fatherNames = listOf(
        "Kabir", "Mohammad", "Abdur", "Rafiqul", "Golam", "Jahangir", "Nurul", "Mizanur", "Kamal", "Shafiqul",
        "Mostafizur", "Abdul", "Zahirul", "Ashraf", "Monirul", "Anisur", "Enamul", "Delwar", "Harun", "Farid"
    )

    private val motherNames = listOf(
        "Rokeya", "Salma", "Parvin", "Nasreen", "Shahana", "Monira", "Farida", "Shirin", "Bilkis", "Rehana",
        "Sultana", "Lutfun", "Rasheda", "Kohinoor", "Jahanara", "Shamima", "Hosne", "Maksuda", "Nazma", "Tahmina"
    )

    private val bloodGroups = listOf("A+", "B+", "O+", "AB+", "A-", "B-", "O-")

    // =========================================================================
    // 1. GENERATE ALL 1,280 STUDENTS ACROSS 3 INSTITUTIONS
    // =========================================================================

    private fun buildAllStudents(): List<StudentProfileData> {
        val list = mutableListOf<StudentProfileData>()

        // 1. SCHOOL: Green Valley School (Class 1 to 10 x 4 Sections x 20 Students = 800)
        for (cIndex in 1..10) {
            val cName = "Class $cIndex"
            for (sIndex in 0..3) {
                val secLetter = ('A' + sIndex).toString()
                val sName = "Section $secLetter"
                for (roll in 1..20) {
                    val isFemale = (roll % 2 == 0)
                    val seed = cIndex * 100 + sIndex * 25 + roll
                    val firstName = if (isFemale) femaleFirstNames[seed % femaleFirstNames.size] else maleFirstNames[seed % maleFirstNames.size]
                    val lastName = lastNames[(seed * 3) % lastNames.size]
                    val isMother = (roll % 3 == 0)
                    val gFirst = if (isMother) motherNames[seed % motherNames.size] else fatherNames[seed % fatherNames.size]
                    val stdCode = String.format("MIC-2026-C%02d%s-%02d", cIndex, secLetter, roll)
                    val id = "std-sch-c${cIndex}${secLetter.lowercase()}-$roll"
                    val isDemo = (cIndex == 10 && secLetter == "A" && roll == 1)

                    val att = (82.0 + ((seed * 7) % 17) + if (roll <= 3) 2.0 else 0.0).coerceIn(80.0, 99.0)
                    val gpaBase = 3.60 + ((seed * 13) % 140) / 100.0
                    val currentGpa = if (roll == 1) 5.00 else (Math.round(gpaBase * 100.0) / 100.0).coerceIn(3.50, 5.00)

                    list.add(
                        StudentProfileData(
                            id = id,
                            studentIdCode = stdCode,
                            firstName = if (isDemo) "Rahim" else firstName,
                            lastName = if (isDemo) "Chowdhury" else lastName,
                            className = cName,
                            sectionName = sName,
                            institutionId = "inst-school",
                            institutionName = "Green Valley Smart Model School",
                            institutionCode = "GVS",
                            institutionType = "School",
                            attendancePercentage = if (isDemo) 96.0 else att,
                            currentGpa = if (isDemo) 5.00 else currentGpa,
                            bloodGroup = if (isDemo) "B+" else bloodGroups[seed % bloodGroups.size],
                            email = if (isDemo) "student.demo@campusos.edu" else String.format("student.c%02d%s%02d@campusos.edu", cIndex, secLetter.lowercase(), roll),
                            phone = String.format("+880 1712-%02d%02d%02d", (cIndex * 7 + roll) % 90 + 10, (sIndex * 19 + roll) % 90 + 10, roll * 4 % 90 + 10),
                            guardianName = if (isDemo) "Kabir Chowdhury" else "$gFirst $lastName",
                            guardianPhone = if (isDemo) "+880 1812-311113" else String.format("+880 1812-%02d%02d%02d", (cIndex * 11 + roll) % 90 + 10, (sIndex * 23 + roll) % 90 + 10, roll * 3 % 90 + 10),
                            classNumber = cIndex,
                            rollNumber = roll,
                            gender = if (isDemo) "Male" else if (isFemale) "Female" else "Male",
                            guardianEmail = if (isDemo) "guardian.demo@campusos.edu" else String.format("guardian.c%02d%s%02d@campusos.edu", cIndex, secLetter.lowercase(), roll),
                            guardianRelation = if (isDemo) "Father" else if (isMother) "Mother" else "Father"
                        )
                    )
                }
            }
        }

        // 2. COLLEGE: Crescent College (Class 11 & 12 x 4 Sections x 20 Students = 160)
        val collegeClasses = listOf("Class 11 (HSC 1st Year)", "Class 12 (HSC 2nd Year)")
        val collegeSections = listOf("Section A (Science)", "Section B (Business)", "Section C (Humanities)", "Section D (ICT Voc)")
        collegeClasses.forEachIndexed { cIdx, cName ->
            collegeSections.forEachIndexed { sIdx, sName ->
                for (roll in 1..20) {
                    val isFemale = (roll % 2 == 1)
                    val seed = 2000 + cIdx * 100 + sIdx * 25 + roll
                    val firstName = if (isFemale) femaleFirstNames[seed % femaleFirstNames.size] else maleFirstNames[seed % maleFirstNames.size]
                    val lastName = lastNames[(seed * 3) % lastNames.size]
                    val isMother = (roll % 3 == 0)
                    val gFirst = if (isMother) motherNames[seed % motherNames.size] else fatherNames[seed % fatherNames.size]
                    val stdCode = String.format("CMC-2026-H%02d%s-%02d", cIdx + 11, ('A' + sIdx), roll)
                    val id = "std-col-h${cIdx + 11}${('a' + sIdx)}-$roll"
                    val isCollegeDemo = (cIdx == 1 && sIdx == 0 && roll == 1)

                    val att = (84.0 + ((seed * 7) % 15)).coerceIn(80.0, 99.0)
                    val gpa = if (roll == 1) 5.00 else (3.70 + ((seed * 11) % 130) / 100.0).coerceIn(3.50, 5.00)

                    list.add(
                        StudentProfileData(
                            id = id,
                            studentIdCode = stdCode,
                            firstName = if (isCollegeDemo) "Samiul" else firstName,
                            lastName = if (isCollegeDemo) "Karim" else lastName,
                            className = cName,
                            sectionName = sName,
                            institutionId = "inst-college",
                            institutionName = "Crescent Model Higher Secondary College",
                            institutionCode = "CMC",
                            institutionType = "College",
                            attendancePercentage = if (isCollegeDemo) 95.5 else att,
                            currentGpa = if (isCollegeDemo) 4.92 else Math.round(gpa * 100.0) / 100.0,
                            bloodGroup = bloodGroups[seed % bloodGroups.size],
                            email = if (isCollegeDemo) "student.college@campusos.edu" else String.format("student.col%02d%s%02d@campusos.edu", cIdx + 11, ('a' + sIdx), roll),
                            phone = String.format("+880 1713-%02d%02d%02d", (cIdx * 9 + roll) % 90 + 10, (sIdx * 17 + roll) % 90 + 10, roll * 3 % 90 + 10),
                            guardianName = if (isCollegeDemo) "Fazlur Karim" else "$gFirst $lastName",
                            guardianPhone = String.format("+880 1813-%02d%02d%02d", (cIdx * 13 + roll) % 90 + 10, (sIdx * 21 + roll) % 90 + 10, roll * 4 % 90 + 10),
                            classNumber = cIdx + 11,
                            rollNumber = roll,
                            gender = if (isFemale) "Female" else "Male",
                            guardianEmail = if (isCollegeDemo) "guardian.college@campusos.edu" else String.format("guardian.col%02d%s%02d@campusos.edu", cIdx + 11, ('a' + sIdx), roll),
                            guardianRelation = if (isMother) "Mother" else "Father"
                        )
                    )
                }
            }
        }

        // 3. UNIVERSITY: Metropolitan University (4 Depts x 4 Batches x 20 Students = 320)
        val univDepts = listOf("Dept of CSE", "Dept of EEE", "Dept of BBA", "Dept of English")
        val univBatches = listOf("1st Year (Batch 26)", "2nd Year (Batch 25)", "3rd Year (Batch 24)", "4th Year (Batch 23)")
        val deptCodes = listOf("CSE", "EEE", "BBA", "ENG")

        univDepts.forEachIndexed { dIdx, dName ->
            val dCode = deptCodes[dIdx]
            univBatches.forEachIndexed { bIdx, bName ->
                for (roll in 1..20) {
                    val isFemale = (roll % 2 == 0)
                    val seed = 3000 + dIdx * 100 + bIdx * 25 + roll
                    val firstName = if (isFemale) femaleFirstNames[seed % femaleFirstNames.size] else maleFirstNames[seed % maleFirstNames.size]
                    val lastName = lastNames[(seed * 3) % lastNames.size]
                    val isMother = (roll % 3 == 0)
                    val gFirst = if (isMother) motherNames[seed % motherNames.size] else fatherNames[seed % fatherNames.size]
                    val stdCode = String.format("MUTS-2026-%s%d-%02d", dCode, bIdx + 1, roll)
                    val id = "std-uni-${dCode.lowercase()}${bIdx + 1}-$roll"
                    val isUnivDemo = (dIdx == 0 && bIdx == 3 && roll == 1) // 4th Year CSE Roll 1

                    val att = (85.0 + ((seed * 5) % 14)).coerceIn(80.0, 99.0)
                    val cgpa = if (roll == 1) 3.98 else (3.50 + ((seed * 9) % 50) / 100.0).coerceIn(3.20, 4.00)

                    list.add(
                        StudentProfileData(
                            id = id,
                            studentIdCode = stdCode,
                            firstName = if (isUnivDemo) "Tanvir" else firstName,
                            lastName = if (isUnivDemo) "Ahmed" else lastName,
                            className = dName,
                            sectionName = bName,
                            institutionId = "inst-university",
                            institutionName = "Metropolitan University of Technology & Science",
                            institutionCode = "MUTS",
                            institutionType = "University",
                            attendancePercentage = if (isUnivDemo) 97.0 else att,
                            currentGpa = if (isUnivDemo) 3.98 else Math.round(cgpa * 100.0) / 100.0,
                            bloodGroup = bloodGroups[seed % bloodGroups.size],
                            email = if (isUnivDemo) "student.varsity@campusos.edu" else String.format("student.%s%d%02d@campusos.edu", dCode.lowercase(), bIdx + 1, roll),
                            phone = String.format("+880 1714-%02d%02d%02d", (dIdx * 11 + roll) % 90 + 10, (bIdx * 15 + roll) % 90 + 10, roll * 5 % 90 + 10),
                            guardianName = if (isUnivDemo) "Aminul Ahmed" else "$gFirst $lastName",
                            guardianPhone = String.format("+880 1814-%02d%02d%02d", (dIdx * 17 + roll) % 90 + 10, (bIdx * 19 + roll) % 90 + 10, roll * 2 % 90 + 10),
                            classNumber = bIdx + 1,
                            rollNumber = roll,
                            gender = if (isFemale) "Female" else "Male",
                            guardianEmail = if (isUnivDemo) "guardian.varsity@campusos.edu" else String.format("guardian.%s%d%02d@campusos.edu", dCode.lowercase(), bIdx + 1, roll),
                            guardianRelation = if (isMother) "Mother" else "Father"
                        )
                    )
                }
            }
        }

        return list
    }

    // =========================================================================
    // 2. ROUTINES ACROSS ALL 3 INSTITUTIONS
    // =========================================================================

    private fun buildAllRoutines(): Map<String, List<RoutineSlotData>> {
        val map = mutableMapOf<String, MutableList<RoutineSlotData>>()
        val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday")
        val periods = listOf(
            Pair("09:00 AM", "10:00 AM"),
            Pair("10:15 AM", "11:15 AM"),
            Pair("11:30 AM", "12:30 PM"),
            Pair("01:15 PM", "02:15 PM"),
            Pair("02:30 PM", "03:30 PM")
        )

        // 1. School Routines
        for (cIndex in 1..10) {
            val cName = "Class $cIndex"
            for (sIndex in 0..3) {
                val secLetter = ('A' + sIndex).toString()
                val sName = "Section $secLetter"
                val key = "inst-school - $cName - $sName"
                val slots = mutableListOf<RoutineSlotData>()
                val subList = when {
                    cIndex <= 5 -> listOf(Pair("BAN-101", "Bangla Literature"), Pair("ENG-101", "English for Today"), Pair("MTH-101", "Mathematics"), Pair("SCI-101", "Elementary Science"), Pair("BGS-101", "Global Studies"))
                    cIndex <= 8 -> listOf(Pair("BAN-201", "Bangla Grammar"), Pair("ENG-201", "English 2nd"), Pair("MTH-201", "General Math"), Pair("GSC-201", "General Science"), Pair("ICT-201", "ICT & Computer"))
                    else -> listOf(Pair("MTH-301", "Higher Mathematics"), Pair("PHY-301", "Physics"), Pair("CHM-301", "Chemistry & Lab"), Pair("BIO-301", "Biology"), Pair("ICT-301", "Computer Science"))
                }
                days.forEachIndexed { dIdx, day ->
                    periods.forEachIndexed { pIdx, (start, end) ->
                        val sub = subList[(dIdx + pIdx + sIndex) % subList.size]
                        slots.add(RoutineSlotData("rt-sch-${cIndex}${secLetter}-$dIdx-$pIdx", sub.first, sub.second, "Dr. Faculty ${pIdx + 1}", start, end, "Room ${100 + cIndex * 2 + pIdx}", day, cName, sName, "inst-school"))
                    }
                }
                map[key] = slots
            }
        }

        // 2. College Routines
        val collegeClasses = listOf("Class 11 (HSC 1st Year)", "Class 12 (HSC 2nd Year)")
        val collegeSections = listOf("Section A (Science)", "Section B (Business)", "Section C (Humanities)", "Section D (ICT Voc)")
        collegeClasses.forEachIndexed { cIdx, cName ->
            collegeSections.forEachIndexed { sIdx, sName ->
                val key = "inst-college - $cName - $sName"
                val slots = mutableListOf<RoutineSlotData>()
                val subList = when (sIdx) {
                    0 -> listOf(Pair("PHY-101", "HSC Physics & Mechanics"), Pair("CHM-101", "HSC Organic Chemistry"), Pair("MTH-101", "HSC Calculus & Higher Math"), Pair("BIO-101", "HSC Zoology & Botany"), Pair("ENG-101", "HSC English Comp"))
                    1 -> listOf(Pair("ACC-101", "Principles of Accounting"), Pair("FIN-101", "Finance & Banking"), Pair("BOM-101", "Business Organization"), Pair("ECO-101", "Microeconomics"), Pair("ENG-101", "HSC English Comp"))
                    2 -> listOf(Pair("ECO-101", "Economics"), Pair("CIV-101", "Civics & Good Governance"), Pair("HIS-101", "Islamic History & Culture"), Pair("SOC-101", "Social Work"), Pair("ENG-101", "HSC English Comp"))
                    else -> listOf(Pair("ICT-101", "ICT & Database Systems"), Pair("PRG-101", "C Programming & Web Dev"), Pair("MTH-101", "Applied Mathematics"), Pair("BAN-101", "Bangla 1st"), Pair("ENG-101", "HSC English Comp"))
                }
                days.forEachIndexed { dIdx, day ->
                    periods.forEachIndexed { pIdx, (start, end) ->
                        val sub = subList[(dIdx + pIdx) % subList.size]
                        slots.add(RoutineSlotData("rt-col-$cIdx-$sIdx-$dIdx-$pIdx", sub.first, sub.second, "Prof. College Faculty ${pIdx + 1}", start, end, "College Hall ${201 + pIdx}", day, cName, sName, "inst-college"))
                    }
                }
                map[key] = slots
            }
        }

        // 3. University Routines
        val univDepts = listOf("Dept of CSE", "Dept of EEE", "Dept of BBA", "Dept of English")
        val univBatches = listOf("1st Year (Batch 26)", "2nd Year (Batch 25)", "3rd Year (Batch 24)", "4th Year (Batch 23)")
        univDepts.forEachIndexed { dIdx, dName ->
            univBatches.forEachIndexed { bIdx, bName ->
                val key = "inst-university - $dName - $bName"
                val slots = mutableListOf<RoutineSlotData>()
                val subList = when (dIdx) {
                    0 -> listOf(Pair("CSE-301", "Algorithms & Complexity"), Pair("CSE-305", "Database Systems & SQL"), Pair("CSE-315", "Software Engineering"), Pair("CSE-401", "Artificial Intelligence"), Pair("CSE-410", "Computer Networks"))
                    1 -> listOf(Pair("EEE-201", "Electric Circuit Analysis"), Pair("EEE-301", "Microprocessors & Interfacing"), Pair("EEE-315", "Signals and Linear Systems"), Pair("EEE-401", "Power System Analysis"), Pair("EEE-410", "Telecommunication Engineering"))
                    2 -> listOf(Pair("BBA-201", "Financial Management"), Pair("BBA-205", "Principles of Marketing"), Pair("BBA-301", "Organizational Behavior"), Pair("BBA-315", "Strategic Business Analytics"), Pair("BBA-401", "Corporate Governance"))
                    else -> listOf(Pair("ENG-201", "Linguistics & Phonetics"), Pair("ENG-205", "19th Century British Poetry"), Pair("ENG-301", "Shakespearean Drama"), Pair("ENG-315", "Literary Criticism"), Pair("ENG-401", "Postcolonial Literature"))
                }
                days.forEachIndexed { dIdxDay, day ->
                    periods.forEachIndexed { pIdx, (start, end) ->
                        val sub = subList[(dIdxDay + pIdx) % subList.size]
                        slots.add(RoutineSlotData("rt-uni-$dIdx-$bIdx-$dIdxDay-$pIdx", sub.first, sub.second, "Prof. Dr. Department Chair", start, end, "Academic Complex Lab ${301 + pIdx}", day, dName, bName, "inst-university"))
                    }
                }
                map[key] = slots
            }
        }

        return map
    }

    // =========================================================================
    // 3. EXAMS ACROSS ALL 3 INSTITUTIONS
    // =========================================================================

    private fun buildAllExams(): Map<String, List<ExaminationRecordData>> {
        val map = mutableMapOf<String, List<ExaminationRecordData>>()

        // School Exams
        for (cIndex in 1..10) {
            val cName = "Class $cIndex"
            val key = "inst-school - $cName"
            map[key] = listOf(
                ExaminationRecordData("ex-sch-$cIndex-1", "Midterm Examination - Mathematics", "28 Nov 2026", "10:00 AM - 01:00 PM", "Hall ${100 + cIndex}", "Scheduled", cName, "MTH-101", "inst-school"),
                ExaminationRecordData("ex-sch-$cIndex-2", "Midterm Examination - Science", "30 Nov 2026", "10:00 AM - 01:00 PM", "Hall ${100 + cIndex}", "Scheduled", cName, "SCI-101", "inst-school"),
                ExaminationRecordData("ex-sch-$cIndex-3", "Midterm Examination - English", "02 Dec 2026", "10:00 AM - 01:00 PM", "Hall ${100 + cIndex}", "Scheduled", cName, "ENG-101", "inst-school")
            )
        }

        // College Exams
        listOf("Class 11 (HSC 1st Year)", "Class 12 (HSC 2nd Year)").forEachIndexed { idx, cName ->
            val key = "inst-college - $cName"
            map[key] = listOf(
                ExaminationRecordData("ex-col-$idx-1", "HSC Pre-Test - Physics / Accounting / Economics", "28 Nov 2026", "10:00 AM - 01:00 PM", "College Auditorium Hall 1", "Scheduled", cName, "HSC-301", "inst-college"),
                ExaminationRecordData("ex-col-$idx-2", "HSC Pre-Test - Chemistry / Business / Civics", "30 Nov 2026", "10:00 AM - 01:00 PM", "College Auditorium Hall 1", "Scheduled", cName, "HSC-302", "inst-college"),
                ExaminationRecordData("ex-col-$idx-3", "HSC Pre-Test - Higher Math / Finance / History", "02 Dec 2026", "10:00 AM - 01:00 PM", "College Auditorium Hall 1", "Scheduled", cName, "HSC-303", "inst-college")
            )
        }

        // University Exams
        listOf("Dept of CSE", "Dept of EEE", "Dept of BBA", "Dept of English").forEachIndexed { idx, dName ->
            val key = "inst-university - $dName"
            map[key] = listOf(
                ExaminationRecordData("ex-uni-$idx-1", "Semester Final Exam - Core Major Course 1", "28 Nov 2026", "10:00 AM - 01:00 PM", "Exam Hall Complex 402", "Scheduled", dName, "UNI-401", "inst-university"),
                ExaminationRecordData("ex-uni-$idx-2", "Semester Final Exam - Core Major Course 2", "30 Nov 2026", "10:00 AM - 01:00 PM", "Exam Hall Complex 404", "Scheduled", dName, "UNI-402", "inst-university"),
                ExaminationRecordData("ex-uni-$idx-3", "Semester Final Exam - Elective / Lab Practical", "02 Dec 2026", "10:00 AM - 01:00 PM", "Science Complex Lab 102", "Scheduled", dName, "UNI-403", "inst-university")
            )
        }

        return map
    }

    // =========================================================================
    // STATEFUL HOLDER (Updates trigger live UI Recomposition instantly)
    // =========================================================================

    var students by mutableStateOf<List<StudentProfileData>>(buildAllStudents())
        private set

    var routines by mutableStateOf<Map<String, List<RoutineSlotData>>>(buildAllRoutines())
        private set

    var examSchedules by mutableStateOf<Map<String, List<ExaminationRecordData>>>(buildAllExams())
        private set

    var notices by mutableStateOf<List<CampusNoticeData>>(
        listOf(
            CampusNoticeData(
                id = "not-1",
                title = "Final Examination Schedule Fall 2026",
                content = "The official examinations schedule for all classes and departments has been finalized and published. Midterm exams start from 28 November 2026.",
                publishedDate = "14 Nov 2026",
                category = "Exam",
                isPinned = true
            ),
            CampusNoticeData(
                id = "not-2",
                title = "Smart RFID Identity Card Distribution",
                content = "Students and faculty can collect digital smart NFC/RFID cards from the campus administrative affairs office starting Sunday.",
                publishedDate = "12 Nov 2026",
                category = "Administration"
            ),
            CampusNoticeData(
                id = "not-3",
                title = "Fall Semester Tuition Fee Payment Notice",
                content = "Guardians and students can make tuition and examination fee payments via bKash, Nagad, Rocket, or Bank cards through the portal.",
                publishedDate = "10 Nov 2026",
                category = "Finance"
            )
        )
    )
        private set

    var registrations by mutableStateOf<List<RegistrationItemData>>(
        listOf(
            RegistrationItemData("reg-1", "Tanvir Ahmed Chowdhury", "tanvir.student@gmail.com", "+880 1712-345678", "Green Valley School", "student", "mobile_apk", "approved", "Admission: Grade 10 Science, Guardian: Kabir Ahmed", "14 Nov 2026"),
            RegistrationItemData("reg-2", "Sadia Islam", "sadia.islam2026@gmail.com", "+880 1712-345678", "Crescent College", "student", "mobile_apk", "approved", "Applied for Class 11 Science HSC via Mobile App", "14 Nov 2026"),
            RegistrationItemData("reg-3", "Farhan Kabir", "farhan.kabir@yahoo.com", "+880 1819-876543", "Metropolitan University", "student", "web_portal", "pending", "Undergraduate B.Sc in CSE Admission Request", "14 Nov 2026")
        )
    )
        private set

    // Default Students for Each Institution
    val defaultStudent: StudentProfileData
        get() = students.firstOrNull { it.institutionId == currentInstitutionId && it.rollNumber == 1 } ?: students.first()

    fun getStudentsForInstitution(instId: String = currentInstitutionId): List<StudentProfileData> {
        return students.filter { it.institutionId == instId }
    }

    fun getStudentsByClassAndSection(cName: String, sName: String, instId: String = currentInstitutionId): List<StudentProfileData> {
        return students.filter {
            it.institutionId == instId &&
            it.className.equals(cName, ignoreCase = true) &&
            it.sectionName.equals(sName, ignoreCase = true)
        }
    }

    fun getStudentById(id: String): StudentProfileData? {
        return students.firstOrNull { it.id == id }
    }

    fun getStudentByCode(code: String): StudentProfileData? {
        return students.firstOrNull { it.studentIdCode.equals(code.trim(), ignoreCase = true) }
    }

    fun getStudentByEmail(email: String): StudentProfileData? {
        val clean = email.trim().lowercase()
        val match = students.firstOrNull { it.email.lowercase() == clean }
        if (match != null) return match
        // Smart fallback based on email pattern
        return when {
            clean.contains("college") -> students.firstOrNull { it.institutionId == "inst-college" } ?: defaultStudent
            clean.contains("varsity") || clean.contains("uni") -> students.firstOrNull { it.institutionId == "inst-university" } ?: defaultStudent
            else -> defaultStudent
        }
    }

    // STRICT GUARDIAN SCOPING: strictly finds ONLY children linked to this guardian email
    fun getChildrenForGuardian(guardianEmail: String): List<StudentProfileData> {
        val clean = guardianEmail.trim().lowercase()
        val direct = students.filter { it.guardianEmail.lowercase() == clean }
        if (direct.isNotEmpty()) return direct
        // Demo fallback: returns Rahim Chowdhury in School and sibling Samiul Karim in College
        return listOf(
            students.first { it.institutionId == "inst-school" && it.rollNumber == 1 },
            students.first { it.institutionId == "inst-college" && it.rollNumber == 1 }
        )
    }

    fun searchStudents(query: String, instId: String = currentInstitutionId): List<StudentProfileData> {
        val q = query.trim().lowercase()
        val instStudents = getStudentsForInstitution(instId)
        if (q.isEmpty()) return instStudents
        return instStudents.filter {
            it.fullName.lowercase().contains(q) ||
            it.studentIdCode.lowercase().contains(q) ||
            it.rollDisplay.contains(q) ||
            it.className.lowercase().contains(q) ||
            it.sectionName.lowercase().contains(q) ||
            it.guardianName.lowercase().contains(q)
        }
    }

    fun getRoutineForSection(cName: String, sName: String, instId: String = currentInstitutionId): List<RoutineSlotData> {
        val key = "$instId - $cName - $sName"
        return routines[key] ?: routines.values.firstOrNull() ?: emptyList()
    }

    fun getExamsForClass(cName: String, instId: String = currentInstitutionId): List<ExaminationRecordData> {
        val key = "$instId - $cName"
        return examSchedules[key] ?: examSchedules.values.firstOrNull() ?: emptyList()
    }

    fun getResultsForStudent(student: StudentProfileData): List<SubjectResultData> {
        val g = student.currentGpa
        val letter = when {
            g >= 4.90 -> "A+"
            g >= 4.00 -> "A"
            g >= 3.50 -> "A-"
            else -> "B"
        }
        val markBase = (g * 19.5).toInt().coerceIn(70, 98)

        return when (student.institutionId) {
            "inst-college" -> listOf(
                SubjectResultData("PHY-101", "HSC Physics", 4, g, letter, markBase + 2),
                SubjectResultData("CHM-101", "HSC Chemistry", 4, g, letter, markBase),
                SubjectResultData("MTH-101", "Higher Mathematics", 4, g, letter, markBase + 3),
                SubjectResultData("ENG-101", "English Comp", 3, g, letter, markBase + 1),
                SubjectResultData("ICT-101", "Information Technology", 3, 5.0, "A+", 96)
            )
            "inst-university" -> listOf(
                SubjectResultData("CSE-301", "Algorithms & Complexity", 3, g, letter, markBase + 2),
                SubjectResultData("CSE-305", "Database Systems", 3, g, letter, markBase),
                SubjectResultData("CSE-315", "Software Engineering", 3, g, letter, markBase + 3),
                SubjectResultData("CSE-401", "Artificial Intelligence", 3, g, letter, markBase + 1),
                SubjectResultData("CSE-410", "Computer Networks Lab", 1, 4.0, "A+", 95)
            )
            else -> listOf(
                SubjectResultData("MTH-301", "Advanced Mathematics", 4, g, letter, markBase + 3),
                SubjectResultData("PHY-301", "Physics & Mechanics", 4, g, letter, markBase + 2),
                SubjectResultData("CHM-301", "Chemistry & Lab", 4, g, letter, markBase),
                SubjectResultData("ENG-301", "English Literature", 3, g, letter, markBase + 1),
                SubjectResultData("ICT-301", "Computer Programming", 3, 5.0, "A+", 96),
                SubjectResultData("BIO-301", "General Biology", 3, (g - 0.4).coerceAtLeast(3.5), "A", markBase - 5)
            )
        }
    }

    fun getInvoicesForStudent(student: StudentProfileData): List<InvoiceItemData> {
        val label = when (student.institutionId) {
            "inst-college" -> "HSC Term Tuition Fee"
            "inst-university" -> "Semester Credit Tuition Fee"
            else -> "Fall Term Tuition Fee 2026"
        }
        return listOf(
            InvoiceItemData("inv-${student.id}-1", "INV-2026-F10", label, 15000.0, 15000.0, 0.0, "PAID", "15 Oct 2026", student.id),
            InvoiceItemData("inv-${student.id}-2", "INV-2026-F11", "Midterm Lab & Exam Fee", 4500.0, 0.0, 4500.0, "DUE", "25 Nov 2026", student.id),
            InvoiceItemData("inv-${student.id}-3", "INV-2026-F12", "Digital Campus RFID Card", 2000.0, 2000.0, 0.0, "PAID", "01 Sep 2026", student.id)
        )
    }

    // =========================================================================
    // MUTATION METHODS (SUPER ADMIN ONLY - Full System Edit Rights)
    // =========================================================================

    fun updateStudent(updated: StudentProfileData): Boolean {
        var found = false
        students = students.map {
            if (it.id == updated.id) {
                found = true
                updated
            } else {
                it
            }
        }
        return found
    }

    fun updateRoutineSlot(className: String, sectionName: String, updatedSlot: RoutineSlotData, instId: String = currentInstitutionId): Boolean {
        val key = "$instId - $className - $sectionName"
        val existing = routines[key] ?: return false
        val nextList = existing.map { if (it.id == updatedSlot.id) updatedSlot else it }
        routines = routines.toMutableMap().also { it[key] = nextList }
        return true
    }

    fun updateExam(className: String, updatedExam: ExaminationRecordData, instId: String = currentInstitutionId): Boolean {
        val key = "$instId - $className"
        val existing = examSchedules[key] ?: return false
        val nextList = existing.map { if (it.id == updatedExam.id) updatedExam else it }
        examSchedules = examSchedules.toMutableMap().also { it[key] = nextList }
        return true
    }

    fun recordAttendance(studentId: String, status: String) {
        val s = getStudentById(studentId) ?: return
        val currentAtt = s.attendancePercentage
        val nextAtt = when (status) {
            "Present" -> (currentAtt + 0.5).coerceAtMost(100.0)
            "Late" -> currentAtt
            else -> (currentAtt - 1.0).coerceAtLeast(60.0)
        }
        updateStudent(s.copy(attendancePercentage = Math.round(nextAtt * 10.0) / 10.0))
    }

    fun approveRegistration(id: String) {
        registrations = registrations.map { if (it.id == id) it.copy(status = "approved") else it }
    }

    fun rejectRegistration(id: String) {
        registrations = registrations.map { if (it.id == id) it.copy(status = "rejected") else it }
    }
}
