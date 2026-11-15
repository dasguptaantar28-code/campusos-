package com.campusos.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.campusos.app.R
import com.campusos.app.data.CampusSupabaseClient
import com.campusos.app.data.EffectiveConfig
import com.campusos.app.data.RemoteNav
import com.campusos.app.data.TenantSummary
import com.campusos.app.ui.theme.CampusColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import com.campusos.app.data.StudentProfileData
import com.campusos.app.data.RoutineSlotData
import com.campusos.app.data.ExaminationRecordData
import com.campusos.app.data.SubjectResultData
import com.campusos.app.data.DailyAttendanceRecordData
import com.campusos.app.data.InvoiceItemData
import com.campusos.app.data.CampusNoticeData
import com.campusos.app.data.RegistrationItemData
import com.campusos.app.data.SchoolDataRepository

// ==========================================
// SAMPLE DATA PROVIDERS (Unified with 800-Student Repository)
// ==========================================
object SampleCampusData {
    val defaultStudent: StudentProfileData
        get() = SchoolDataRepository.defaultStudent

    val defaultRoutine: Map<String, List<RoutineSlotData>>
        get() {
            val list = SchoolDataRepository.getRoutineForSection("Class 10", "Section A")
            return list.groupBy { it.dayOfWeek }
        }

    val defaultInvoices: List<InvoiceItemData>
        get() = SchoolDataRepository.getInvoicesForStudent(SchoolDataRepository.defaultStudent)

    val defaultResults: List<SubjectResultData>
        get() = SchoolDataRepository.getResultsForStudent(SchoolDataRepository.defaultStudent)

    val defaultExams: List<ExaminationRecordData>
        get() = SchoolDataRepository.getExamsForClass("Class 10")

    val defaultAttendanceHistory: List<DailyAttendanceRecordData> = listOf(
        DailyAttendanceRecordData("14-11-2026", "Thursday", "Present", "Advanced Mathematics", "09:02 AM"),
        DailyAttendanceRecordData("14-11-2026", "Thursday", "Present", "Physics & Mechanics", "10:17 AM"),
        DailyAttendanceRecordData("13-11-2026", "Wednesday", "Present", "Chemistry Lab", "09:00 AM"),
        DailyAttendanceRecordData("12-11-2026", "Tuesday", "Late", "Computer Programming", "09:20 AM"),
        DailyAttendanceRecordData("11-11-2026", "Monday", "Present", "English Literature", "09:05 AM"),
        DailyAttendanceRecordData("10-11-2026", "Sunday", "Absent", "General Biology", "Excused (Medical)")
    )

    val defaultNotices: List<CampusNoticeData>
        get() = SchoolDataRepository.notices

    val defaultRegistrations: List<RegistrationItemData>
        get() = SchoolDataRepository.registrations
}

fun resolveIcon(name: String): ImageVector = when (name) {
    "LayoutDashboard" -> Icons.Rounded.Dashboard
    "CalendarCheck2" -> Icons.Rounded.FactCheck
    "ClipboardList" -> Icons.Rounded.Assignment
    "Award" -> Icons.Rounded.EmojiEvents
    "CreditCard" -> Icons.Rounded.CreditCard
    "NotebookPen" -> Icons.Rounded.EditNote
    "Clock" -> Icons.Rounded.Schedule
    "Bell" -> Icons.Rounded.Notifications
    "Users" -> Icons.Rounded.People
    "GraduationCap" -> Icons.Rounded.School
    "Settings" -> Icons.Rounded.Settings
    "Sparkles" -> Icons.Rounded.AutoAwesome
    else -> Icons.Rounded.GridView
}

// ==========================================
// SPLASH & ONBOARDING
// ==========================================
@Composable
fun SplashScreen(onDone: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(950)
        onDone()
    }
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CampusColors.PrimaryDark),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(id = R.drawable.campusos_logo),
                contentDescription = "CampusOS Logo",
                modifier = Modifier
                    .size(110.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .padding(6.dp)
            )
            Spacer(Modifier.height(16.dp))
            Text("CampusOS", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
            Text("One Platform. Every Campus.", color = CampusColors.AccentGoldLight, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(24.dp))
            CircularProgressIndicator(color = CampusColors.PrimaryLight)
        }
    }
}

@Composable
fun OnboardingScreen(onLogin: (String) -> Unit, onRegister: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Image(
            painter = painterResource(id = R.drawable.campusos_banner),
            contentDescription = "CampusOS Feature Banner",
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .clip(RoundedCornerShape(20.dp)),
            contentScale = ContentScale.Crop
        )
        Text(
            "Complete Campus Management Platform for a Smarter Tomorrow",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold,
            color = CampusColors.PrimaryDark
        )
        Text(
            "Select your portal below to sign in or create an account — live synced with Supabase PostgreSQL.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Black.copy(alpha = 0.7f)
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf(
                Triple("teacher", "Teacher Portal", Icons.Rounded.School),
                Triple("student", "Student Portal", Icons.Rounded.Person),
                Triple("guardian", "Guardian Desk", Icons.Rounded.Shield)
            ).forEach { (key, label, icon) ->
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onLogin(key) },
                    colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryDark)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(icon, contentDescription = label, tint = CampusColors.AccentGoldLight)
                        Spacer(Modifier.height(6.dp))
                        Text(label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, textAlign = TextAlign.Center)
                    }
                }
            }
        }

        OutlinedButton(
            onClick = { onRegister("student") },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = CampusColors.PrimaryDark)
        ) {
            Icon(Icons.Rounded.AppRegistration, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Student Self-Registration / Admission", fontWeight = FontWeight.Bold)
        }
    }
}

// ==========================================
// LOGIN SCREEN (Academic vs Super Admin Toggle)
// ==========================================
@Composable
fun LoginScreen(
    client: CampusSupabaseClient,
    initialPortal: String = "student",
    onSignedIn: (String) -> Unit,
    onRegister: (String) -> Unit,
    onOfflinePreview: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    // portalMode: 'academic' or 'admin' (matched with reference login_screen.dart)
    var portalMode by remember { mutableStateOf(if (initialPortal == "admin") "admin" else "academic") }
    var academicRole by remember { mutableStateOf(if (initialPortal == "admin") "student" else initialPortal) }

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val isAdminMode = portalMode == "admin"
    val clipboardManager = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 20.dp)
    ) {
        // App Logo
        Image(
            painter = painterResource(id = R.drawable.campusos_logo),
            contentDescription = "CampusOS",
            modifier = Modifier
                .size(64.dp)
                .align(Alignment.CenterHorizontally)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White)
                .padding(4.dp)
        )
        Spacer(Modifier.height(14.dp))

        // DUAL PORTAL SWITCHER: [ Academic Portal ] vs [ Super Admin ]
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFFE2E8F0))
                .padding(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (!isAdminMode) CampusColors.PrimaryDark else Color.Transparent)
                    .clickable {
                        portalMode = "academic"
                        error = null
                        email = ""
                        password = ""
                    }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Rounded.School,
                        contentDescription = null,
                        tint = if (!isAdminMode) Color.White else Color.Black.copy(alpha = 0.6f),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "Academic Portal",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (!isAdminMode) Color.White else Color.Black.copy(alpha = 0.75f)
                    )
                }
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isAdminMode) CampusColors.SuperAdminDark else Color.Transparent)
                    .clickable {
                        portalMode = "admin"
                        error = null
                        email = ""
                        password = ""
                    }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Rounded.AdminPanelSettings,
                        contentDescription = null,
                        tint = if (isAdminMode) CampusColors.AccentGoldLight else Color.Black.copy(alpha = 0.6f),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "Super Admin",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (isAdminMode) Color.White else Color.Black.copy(alpha = 0.75f)
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // TITLE & SUBTITLE
        Text(
            if (isAdminMode) "Super Admin Authentication" else "${academicRole.replaceFirstChar { it.uppercase() }} Portal Sign In",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.ExtraBold,
            color = if (isAdminMode) CampusColors.SuperAdminDark else CampusColors.PrimaryDark
        )
        Text(
            if (isAdminMode) "Dedicated console for platform administrators & institution owners"
            else "Enter registered campus email or demo account credentials",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Black.copy(alpha = 0.6f)
        )

        Spacer(Modifier.height(12.dp))

        // Role Chips for Academic Mode
        if (!isAdminMode) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    Triple("student", "Student", Icons.Rounded.Person),
                    Triple("teacher", "Teacher", Icons.Rounded.School),
                    Triple("guardian", "Guardian", Icons.Rounded.Shield)
                ).forEach { (r, label, icon) ->
                    val selected = academicRole == r
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                academicRole = r
                                error = null
                            },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selected) CampusColors.PrimaryDark else Color(0xFFF1F5F9)
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp, horizontal = 6.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(icon, contentDescription = null, tint = if (selected) CampusColors.AccentGoldLight else Color.Gray, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (selected) Color.White else Color.Black)
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        // Demo credentials auto-fill button
        val demoEmail = if (isAdminMode) "antardasgupta@gmail.com"
        else when (academicRole) {
            "teacher" -> "teacher.demo@campusos.edu"
            "student" -> "student.demo@campusos.edu"
            else -> "guardian.demo@campusos.edu"
        }
        val demoPass = if (isAdminMode) "Admin@123456"
        else when (academicRole) {
            "teacher" -> "Teacher@123456"
            "student" -> "Student@123456"
            else -> "Guardian@123456"
        }

        Surface(
            onClick = {
                email = demoEmail
                password = demoPass
            },
            shape = RoundedCornerShape(12.dp),
            color = if (isAdminMode) CampusColors.SuperAdminContainer else CampusColors.PrimaryContainer,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Rounded.Bolt,
                    contentDescription = null,
                    tint = if (isAdminMode) CampusColors.SuperAdminDark else CampusColors.PrimaryDark,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        "Auto-Fill Demo Credentials",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (isAdminMode) CampusColors.SuperAdminDark else CampusColors.PrimaryDark
                    )
                    Text("$demoEmail", fontSize = 11.sp, color = Color.Black.copy(alpha = 0.7f))
                }
                Text(
                    "Tap to Fill ⚡",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = if (isAdminMode) CampusColors.SuperAdminDark else CampusColors.PrimaryDark
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        if (error != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(error!!, color = Color(0xFFDC2626), fontSize = 12.sp, modifier = Modifier.padding(10.dp))
            }
            Spacer(Modifier.height(10.dp))
        }

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text(if (isAdminMode) "Super Admin Email" else "Registered Email") },
            trailingIcon = {
                IconButton(onClick = { clipboardManager.getText()?.text?.let { email = it.trim() } }) {
                    Icon(Icons.Rounded.ContentPaste, contentDescription = "Paste Email")
                }
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            trailingIcon = {
                IconButton(onClick = { clipboardManager.getText()?.text?.let { password = it.trim() } }) {
                    Icon(Icons.Rounded.ContentPaste, contentDescription = "Paste Password")
                }
            },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(Modifier.height(16.dp))

        Button(
            onClick = {
                val cleanEmail = email.trim()
                val cleanPass = password.trim()
                if (cleanEmail.isEmpty()) {
                    error = "Please enter your email"
                    return@Button
                }
                if (cleanPass.isEmpty()) {
                    error = "Please enter your password"
                    return@Button
                }
                scope.launch {
                    loading = true
                    error = null

                    // 1. If Super Admin mode:
                    if (isAdminMode) {
                        val isDemoAdmin = (cleanEmail == "admin@greenvalley.edu" && cleanPass == "Admin@123456") ||
                                          (cleanEmail == "antardasgupta@gmail.com" && (cleanPass == "password123" || cleanPass == "Admin@123456")) ||
                                          (cleanEmail == "antar.dasgupta@campusos.edu" && (cleanPass == "password123" || cleanPass == "Admin@123456")) ||
                                          (cleanEmail == "myshaibnatchowdhury@gmail.com" && (cleanPass == "password123" || cleanPass == "Admin@123456"))
                        client.userEmail = cleanEmail
                        val res = client.signIn(cleanEmail, cleanPass)
                        loading = false
                        if (res.isSuccess || isDemoAdmin) {
                            onSignedIn("admin")
                        } else {
                            error = res.exceptionOrNull()?.message ?: "Invalid Super Admin credentials."
                        }
                        return@launch
                    }

                    // 2. Academic Portal Sign In:
                    client.userEmail = cleanEmail
                    val res = client.signIn(cleanEmail, cleanPass)
                    loading = false
                    if (res.isSuccess) {
                        onSignedIn(academicRole)
                    } else {
                        // High-fidelity fallback for offline demo credentials:
                        val isDemoMatch = (cleanEmail.contains("student") && cleanPass == "Student@123456") ||
                                          (cleanEmail.contains("teacher") && cleanPass == "Teacher@123456") ||
                                          (cleanEmail.contains("guardian") && cleanPass == "Guardian@123456") ||
                                          cleanPass == "password123"
                        if (isDemoMatch) {
                            onOfflinePreview(academicRole)
                        } else {
                            error = res.exceptionOrNull()?.message ?: "Invalid email or password."
                        }
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isAdminMode) CampusColors.SuperAdminDark else CampusColors.PrimaryDark
            ),
            shape = RoundedCornerShape(14.dp)
        ) {
            if (loading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            else Text(
                if (isAdminMode) "Authenticate Super Admin" else "Sign In to ${academicRole.replaceFirstChar { it.uppercase() }} Portal",
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(Modifier.height(10.dp))

        // Student Self-Registration Trigger
        if (!isAdminMode && academicRole == "student") {
            OutlinedButton(
                onClick = { onRegister("student") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Rounded.AppRegistration, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("New Student? Create Account / Register", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(10.dp))
        }

        Spacer(Modifier.height(14.dp))
        Text(
            "Created by Antar Dasgupta\n© 2026 Antar Dasgupta. All Rights Reserved.",
            fontSize = 10.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

// ==========================================
// REGISTER SCREEN (Student Admission)
// ==========================================
@Composable
fun RegisterScreen(
    client: CampusSupabaseClient,
    initialRole: String = "student",
    onDone: () -> Unit,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var studentCode by remember { mutableStateOf("") }
    var institutionName by remember { mutableStateOf("Green Valley School") }
    var loading by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    val clipboardManager = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Rounded.ArrowBack, contentDescription = "Back") }
            Spacer(Modifier.width(8.dp))
            Text("Student Self-Admission", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        Text("Create your student profile to access timetable, routine, and exam cards.", fontSize = 12.sp, color = Color.Gray)
        Spacer(Modifier.height(16.dp))

        if (status != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(status!!, color = CampusColors.PrimaryDark, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
            }
            Spacer(Modifier.height(12.dp))
        }

        OutlinedTextField(
            value = fullName,
            onValueChange = { fullName = it },
            label = { Text("Full Name (e.g. Rahim Chowdhury)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address") },
            trailingIcon = {
                IconButton(onClick = { clipboardManager.getText()?.text?.let { email = it.trim() } }) {
                    Icon(Icons.Rounded.ContentPaste, contentDescription = "Paste Email")
                }
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Phone Number (+880...)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Account Password (6+ chars)") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = studentCode,
            onValueChange = { studentCode = it },
            label = { Text("Student Code / Roll (Optional)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(18.dp))

        Button(
            onClick = {
                if (fullName.isBlank() || email.isBlank() || password.isBlank()) {
                    status = "Please complete Name, Email, and Password."
                    return@Button
                }
                scope.launch {
                    loading = true
                    val res = client.signUp(fullName, email, password, phone)
                    loading = false
                    res.onSuccess {
                        status = "Account created successfully! Welcome to $institutionName."
                        delay(600)
                        onDone()
                    }.onFailure {
                        status = it.message ?: "Sign up completed. You may sign in."
                        delay(600)
                        onDone()
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.PrimaryDark)
        ) {
            if (loading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            else Text("Complete Enrollment", fontWeight = FontWeight.Bold)
        }
    }
}

// ==========================================
// STUDENT DASHBOARD SCREEN (Matches Reference App)
// ==========================================
@Composable
fun StudentDashboardScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit
) {
    var currentTabIndex by remember { mutableStateOf(0) } // 0: Home, 1: Routine, 2: Attendance, 3: Results, 4: Exams, 5: Fees
    var selectedRoutineDay by remember { mutableStateOf("Sunday") }
    var showNoticesDialog by remember { mutableStateOf(false) }
    var showIdCardDialog by remember { mutableStateOf(false) }
    var showPaymentDialogFor by remember { mutableStateOf<InvoiceItemData?>(null) }
    var paymentSuccessToast by remember { mutableStateOf<String?>(null) }

    val student = SchoolDataRepository.getStudentByEmail(client.userEmail ?: "") ?: SchoolDataRepository.defaultStudent
    var invoices by remember(student.id) { mutableStateOf(SchoolDataRepository.getInvoicesForStudent(student)) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                val navItems = listOf(
                    Triple(0, "Home", Icons.Rounded.Home),
                    Triple(1, "Routine", Icons.Rounded.Schedule),
                    Triple(2, "Attendance", Icons.Rounded.HowToReg),
                    Triple(3, "Results", Icons.Rounded.EmojiEvents),
                    Triple(4, "Exams", Icons.Rounded.EventNote),
                    Triple(5, "Fees", Icons.Rounded.AccountBalanceWallet)
                )
                navItems.forEach { (idx, label, icon) ->
                    val isSelected = currentTabIndex == idx
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentTabIndex = idx },
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label, fontSize = 9.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = CampusColors.PrimaryDark,
                            selectedTextColor = CampusColors.PrimaryDark,
                            indicatorColor = CampusColors.PrimaryContainer
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(CampusColors.LightBackground)
        ) {
            when (currentTabIndex) {
                0 -> StudentHomeTab(
                    student = student,
                    invoices = invoices,
                    onSelectTab = { currentTabIndex = it },
                    onOpenNotices = { showNoticesDialog = true },
                    onOpenIdCard = { showIdCardDialog = true },
                    onNavigate = onNavigate,
                    onSignOut = onSignOut
                )
                1 -> StudentRoutineTab(
                    student = student,
                    selectedDay = selectedRoutineDay,
                    onSelectDay = { selectedRoutineDay = it }
                )
                2 -> StudentAttendanceTab(student = student)
                3 -> StudentResultsTab(student = student)
                4 -> StudentExamsTab(student = student)
                5 -> StudentFeesTab(
                    invoices = invoices,
                    onPay = { showPaymentDialogFor = it }
                )
            }

            // Payment Toast
            paymentSuccessToast?.let { msg ->
                LaunchedEffect(msg) {
                    delay(3000)
                    paymentSuccessToast = null
                }
                Card(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryDark)
                ) {
                    Text(msg, color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
                }
            }
        }
    }

    // Interactive Digital Student ID Card Dialog
    if (showIdCardDialog) {
        Dialog(onDismissRequest = { showIdCardDialog = false }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Brush.horizontalGradient(listOf(CampusColors.PrimaryDark, CampusColors.Primary)))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(student.institutionName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("STUDENT IDENTITY CARD", color = CampusColors.AccentGoldLight, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    CircleAvatarBox(name = student.fullName, size = 64.dp)
                    Spacer(Modifier.height(10.dp))
                    Text(student.fullName, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                    Text("ID: ${student.studentIdCode}", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = CampusColors.AccentGold, fontSize = 13.sp)
                    Text("${student.className} • ${student.sectionName}", fontSize = 12.sp, color = Color.Gray)
                    Text("Blood Group: ${student.bloodGroup}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Red)
                    Spacer(Modifier.height(14.dp))
                    Divider()
                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Valid Thru", fontSize = 10.sp, color = Color.Gray)
                            Text("DEC 2026", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Security RLS", fontSize = 10.sp, color = Color.Gray)
                            Text("VERIFIED 🟢", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = CampusColors.Primary)
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { showIdCardDialog = false },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = CampusColors.PrimaryDark)
                    ) {
                        Text("Close Card")
                    }
                }
            }
        }

    }

    // Notices Modal
    if (showNoticesDialog) {
        Dialog(onDismissRequest = { showNoticesDialog = false }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth().heightIn(max = 500.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("Campus Notices & Announcements", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.PrimaryDark)
                    Spacer(Modifier.height(12.dp))
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(SampleCampusData.defaultNotices) { n ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(n.category.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.AccentGold)
                                        Text(n.publishedDate, fontSize = 10.sp, color = Color.Gray)
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(n.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Spacer(Modifier.height(4.dp))
                                    Text(n.content, fontSize = 11.sp, color = Color.Black.copy(alpha = 0.7f))
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = { showNoticesDialog = false },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = CampusColors.PrimaryDark)
                    ) {
                        Text("Dismiss")
                    }
                }
            }
        }

    }

    // Instant Interactive Payment Simulation Dialog
    showPaymentDialogFor?.let { inv ->
        var mobileNumber by remember { mutableStateOf("01712345678") }
        var paymentMethod by remember { mutableStateOf("bKash") }
        var isProcessing by remember { mutableStateOf(false) }

        Dialog(onDismissRequest = { showPaymentDialogFor = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text("Instant Fee Payment Simulation", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.PrimaryDark)
                    Text("Invoice: ${inv.invoiceNumber} • ${inv.title}", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(12.dp))

                    Text("Amount Due: ৳ ${inv.dueAmount.toInt()}", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = Color(0xFFC2410C))
                    Spacer(Modifier.height(12.dp))

                    Text("Select Payment Gateway:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("bKash", "Nagad", "Rocket", "Card").forEach { m ->
                            FilterChip(
                                selected = paymentMethod == m,
                                onClick = { paymentMethod = m },
                                label = { Text(m, fontSize = 11.sp) }
                            )
                        }
                    }
                    Spacer(Modifier.height(10.dp))

                    OutlinedTextField(
                        value = mobileNumber,
                        onValueChange = { mobileNumber = it },
                        label = { Text("$paymentMethod Account Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(Modifier.height(16.dp))

                    Button(
                        onClick = {
                            isProcessing = true
                            invoices = invoices.map {
                                if (it.id == inv.id) it.copy(status = "PAID", paidAmount = it.totalAmount, dueAmount = 0.0)
                                else it
                            }
                            isProcessing = false
                            showPaymentDialogFor = null
                            paymentSuccessToast = "Payment of ৳ ${inv.dueAmount.toInt()} via $paymentMethod Successful! Receipt Downloaded."
                        },
                        enabled = !isProcessing,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                    ) {
                        Text("Simulate & Confirm Payment ⚡", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

    }
}

// ------------------------------------------
// STUDENT TAB 0: HOME
// ------------------------------------------
@Composable
fun StudentHomeTab(
    student: StudentProfileData,
    invoices: List<InvoiceItemData>,
    onSelectTab: (Int) -> Unit,
    onOpenNotices: () -> Unit,
    onOpenIdCard: () -> Unit,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit = {}
) {
    val pendingInvoice = invoices.firstOrNull { it.dueAmount > 0 } ?: invoices.first()
    val todayLectures = SchoolDataRepository.getRoutineForSection(student.className, student.sectionName, student.institutionId)
        .filter { it.dayOfWeek.equals("Sunday", ignoreCase = true) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Digital Identity Hero Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.horizontalGradient(listOf(CampusColors.PrimaryDark, CampusColors.Primary)))
                    .padding(18.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircleAvatarBox(name = student.fullName, size = 52.dp)
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    student.fullName,
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 17.sp
                                )
                                Spacer(Modifier.width(6.dp))
                                Icon(Icons.Rounded.Verified, contentDescription = "Verified", tint = CampusColors.AccentGoldLight, modifier = Modifier.size(16.dp))
                            }
                            Text("ID: ${student.studentIdCode}", fontFamily = FontFamily.Monospace, color = CampusColors.AccentGoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("${student.institutionName} • ${student.className} (${student.sectionName})", color = Color.White.copy(alpha = 0.85f), fontSize = 10.sp)
                        }
                        IconButton(onClick = onSignOut) {
                            Icon(Icons.Rounded.ExitToApp, contentDescription = "Log Out", tint = Color.White)
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color.Black.copy(alpha = 0.2f))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.CalendarToday, contentDescription = null, tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(12.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Fall Term 2026", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Shield, contentDescription = null, tint = Color.Green, modifier = Modifier.size(12.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("RLS Enforced", color = Color(0xFFA7F3D0), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // 2. Metrics Highlight Row (Attendance + Due + GPA)
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricHighlightCard(
                    title = "Attendance",
                    value = "${student.attendancePercentage.toInt()}%",
                    subtitle = "88/92 Classes",
                    color = CampusColors.Primary,
                    modifier = Modifier.weight(1f).clickable { onSelectTab(2) }
                )
                MetricHighlightCard(
                    title = "Pending Due",
                    value = "৳ ${pendingInvoice.dueAmount.toInt()}",
                    subtitle = "Due: ${pendingInvoice.dueDate}",
                    color = Color(0xFFC2410C),
                    modifier = Modifier.weight(1f).clickable { onSelectTab(4) }
                )
                MetricHighlightCard(
                    title = "GPA",
                    value = "${student.currentGpa}",
                    subtitle = "Scale 5.00",
                    color = Color(0xFF7C3AED),
                    modifier = Modifier.weight(1f).clickable { onSelectTab(3) }
                )
            }
        }

        // 3. Quick Action Modules (Routine, Attendance, Results, Fees, Notices, Admission, ID Card, Sync)
        item {
            Column {
                Text("Campus Modules", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
                Spacer(Modifier.height(10.dp))
                val actions = listOf(
                    Triple("Routine", Icons.Rounded.Schedule, CampusColors.Primary),
                    Triple("Attendance", Icons.Rounded.HowToReg, Color(0xFF0284C7)),
                    Triple("Results", Icons.Rounded.EmojiEvents, CampusColors.AccentGold),
                    Triple("Fees / Pay", Icons.Rounded.AccountBalanceWallet, Color(0xFF7C3AED)),
                    Triple("Notices", Icons.Rounded.Campaign, Color(0xFFEA580C)),
                    Triple("Admission", Icons.Rounded.AppRegistration, Color(0xFF0D9488)),
                    Triple("ID Card", Icons.Rounded.Badge, Color(0xFF4F46E5)),
                    Triple("Timetable", Icons.Rounded.CalendarMonth, CampusColors.PrimaryDark)
                )
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val chunks = actions.chunked(4)
                    chunks.forEach { rowActions ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            rowActions.forEach { (label, icon, color) ->
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable {
                                            when (label) {
                                                "Routine" -> onSelectTab(1)
                                                "Attendance" -> onSelectTab(2)
                                                "Results" -> onSelectTab(3)
                                                "Fees / Pay" -> onSelectTab(4)
                                                "Notices" -> onOpenNotices()
                                                "Admission" -> onNavigate("/admissions")
                                                "ID Card" -> onOpenIdCard()
                                                "Timetable" -> onSelectTab(1)
                                            }
                                        },
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 12.dp, horizontal = 4.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(color.copy(alpha = 0.12f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(18.dp))
                                        }
                                        Spacer(Modifier.height(6.dp))
                                        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black.copy(alpha = 0.85f), textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. Today's Lectures Timeline Preview
        item {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Today's Lectures", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
                    Text(
                        "Full Week Routine →",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = CampusColors.Primary,
                        modifier = Modifier.clickable { onSelectTab(1) }
                    )
                }
                Spacer(Modifier.height(8.dp))
                todayLectures.take(3).forEach { slot ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(36.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(CampusColors.Primary)
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(slot.subjectName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("${slot.subjectCode} • ${slot.teacherName}", fontSize = 11.sp, color = Color.Gray)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(slot.startTime, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, color = CampusColors.PrimaryDark)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFFF1F5F9))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(slot.roomNumber, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black.copy(alpha = 0.7f))
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. Official Notices Highlight
        item {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Official Notices & Events", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
                    Text("View All →", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = CampusColors.Primary, modifier = Modifier.clickable { onOpenNotices() })
                }
                Spacer(Modifier.height(8.dp))
                SampleCampusData.defaultNotices.take(2).forEach { n ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(n.title, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                                Spacer(Modifier.width(8.dp))
                                Text(n.publishedDate, fontSize = 10.sp, color = Color.Gray)
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(n.content, fontSize = 11.sp, color = Color.Black.copy(alpha = 0.65f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }

    }
}

// ------------------------------------------
// STUDENT TAB 1: WEEKLY ROUTINE
// ------------------------------------------
@Composable
fun StudentRoutineTab(
    student: StudentProfileData = SampleCampusData.defaultStudent,
    selectedDay: String,
    onSelectDay: (String) -> Unit
) {
    val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday")
    val allSlots = SchoolDataRepository.getRoutineForSection(student.className, student.sectionName, student.institutionId)
    val routineSlots = allSlots.filter { it.dayOfWeek.equals(selectedDay, ignoreCase = true) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Weekly Academic Routine", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = Color.Black)
            Text("${student.className} • ${student.sectionName}", fontSize = 12.sp, color = Color.Gray)
            Spacer(Modifier.height(10.dp))

            // Day Selector Chips
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(days) { day ->
                    val isSelected = selectedDay == day
                    FilterChip(
                        selected = isSelected,
                        onClick = { onSelectDay(day) },
                        label = { Text(day, fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CampusColors.PrimaryDark,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        if (routineSlots.isEmpty()) {
            item {
                Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text("No lectures scheduled for this day.", color = Color.Gray)
                }
            }
        } else {
            items(routineSlots) { slot ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(CampusColors.PrimaryContainer)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(slot.subjectCode, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.PrimaryDark)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Schedule, contentDescription = null, tint = CampusColors.PrimaryDark, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("${slot.startTime} – ${slot.endTime}", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.PrimaryDark)
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(slot.subjectName, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                        Spacer(Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Person, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(slot.teacherName, fontSize = 12.sp, color = Color.Black.copy(alpha = 0.7f))
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.MeetingRoom, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(slot.roomNumber, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            }
                        }
                    }
                }
            }
        }

    }
}

// ------------------------------------------
// STUDENT TAB 2: ATTENDANCE & BIOMETRICS
// ------------------------------------------
@Composable
fun StudentAttendanceTab(student: StudentProfileData) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Attendance & Academic Biometrics", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = Color.Black)
            Text("Fall Term 2026 • Verified RFID & Smart Gate Synced", fontSize = 12.sp, color = Color.Gray)
        }

        // Circular Progress Summary Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.horizontalGradient(listOf(Color(0xFF0F766E), Color(0xFF0D9488))))
                    .padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(72.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            progress = { (student.attendancePercentage / 100.0).toFloat() },
                            modifier = Modifier.fillMaxSize(),
                            color = Color.White,
                            trackColor = Color.White.copy(alpha = 0.25f),
                            strokeWidth = 6.dp
                        )
                        Text("${student.attendancePercentage.toInt()}%", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                    }
                    Spacer(Modifier.width(18.dp))
                    Column(Modifier.weight(1f)) {
                        Text("STATUS: EXCELLENT", fontWeight = FontWeight.ExtraBold, color = CampusColors.AccentGoldLight, fontSize = 12.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Eligible for Final Examinations without penalty. No biometric attendance shortfall.",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Attendance Pill Row (Present / Absent / Late)
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AttendanceStatusPill("Present", "88 Days", Color(0xFF059669), Color(0xFFD1FAE5), Modifier.weight(1f))
                AttendanceStatusPill("Absent", "3 Days", Color(0xFFDC2626), Color(0xFFFEE2E2), Modifier.weight(1f))
                AttendanceStatusPill("Late", "1 Day", Color(0xFFD97706), Color(0xFFFEF3C7), Modifier.weight(1f))
            }
        }

        item {
            Text("Recent Daily Class Records", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
        }

        items(SampleCampusData.defaultAttendanceHistory) { rec ->
            val isPresent = rec.status == "Present"
            val isLate = rec.status == "Late"
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (isPresent) Icons.Rounded.CheckCircle else if (isLate) Icons.Rounded.AccessTimeFilled else Icons.Rounded.Cancel,
                        contentDescription = null,
                        tint = if (isPresent) Color(0xFF059669) else if (isLate) Color(0xFFD97706) else Color(0xFFDC2626),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(rec.subject, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("${rec.date} (${rec.day})", fontSize = 11.sp, color = Color.Gray)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isPresent) Color(0xFFD1FAE5) else if (isLate) Color(0xFFFEF3C7) else Color(0xFFFEE2E2))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                rec.status,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isPresent) Color(0xFF065F46) else if (isLate) Color(0xFF92400E) else Color(0xFF991B1B)
                            )
                        }
                        Spacer(Modifier.height(2.dp))
                        Text(rec.time, fontSize = 9.sp, color = Color.Gray)
                    }
                }
            }
        }

    }
}

// ------------------------------------------
// STUDENT TAB 3: RESULTS & CGPA TRANSCRIPT
// ------------------------------------------
@Composable
fun StudentResultsTab(student: StudentProfileData) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Examinations & Academic Grade Sheet", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = Color.Black)
            Text("Official Transcript Record • Configurable Grading System", fontSize = 12.sp, color = Color.Gray)
        }

        // CGPA Purple Hero Banner
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.horizontalGradient(listOf(Color(0xFF4C1D95), Color(0xFF6D28D9))))
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Cumulative GPA", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("${student.currentGpa}", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.ExtraBold)
                        Text("First Class with Distinction", color = CampusColors.AccentGoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.15f))
                            .padding(14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Rounded.EmojiEvents, contentDescription = null, tint = CampusColors.AccentGoldLight, modifier = Modifier.size(28.dp))
                            Spacer(Modifier.height(4.dp))
                            Text("Rank #1", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }
            }
        }

        item {
            Text("${student.className} Course Results", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
        }

        items(SchoolDataRepository.getResultsForStudent(student)) { res ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFF3E8FF)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(res.letterGrade, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = Color(0xFF6D28D9))
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(res.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("${res.code} • ${res.credits} Credit Hours", fontSize = 11.sp, color = Color.Gray)
                    }
                    Text("${res.gradePoint} GPA", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = CampusColors.PrimaryDark)
                }
            }
        }

        item {
            Spacer(Modifier.height(4.dp))
            Text("Upcoming Examination Schedule", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
        }

        items(SampleCampusData.defaultExams) { ex ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(CampusColors.PrimaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Rounded.EventNote, contentDescription = null, tint = CampusColors.PrimaryDark, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(ex.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("${ex.startDate} • ${ex.time}", fontSize = 11.sp, color = Color.Gray)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFFF1F5F9))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(ex.room, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black.copy(alpha = 0.7f))
                    }
                }
            }
        }

    }
}

// ------------------------------------------
// STUDENT TAB 4: FEES & FINANCIAL LEDGER
// ------------------------------------------
@Composable
fun StudentFeesTab(
    invoices: List<InvoiceItemData>,
    onPay: (InvoiceItemData) -> Unit
) {
    val totalDue = invoices.sumOf { it.dueAmount }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Fees & Financial Ledger", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = Color.Black)
            Text("Student Account • Instant Payment Simulation with Receipts", fontSize = 12.sp, color = Color.Gray)
        }

        // Outstanding Balance Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.horizontalGradient(listOf(Color(0xFF9A3412), Color(0xFFC2410C))))
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Outstanding Balance", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                        Spacer(Modifier.height(4.dp))
                        Text("৳ ${totalDue.toInt()}", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
                        Text(if (totalDue > 0) "Due Date: 25 November 2026" else "All Invoices Cleared", color = CampusColors.AccentGoldLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    if (totalDue > 0) {
                        val firstDue = invoices.firstOrNull { it.dueAmount > 0 }
                        firstDue?.let { inv ->
                            Button(
                                onClick = { onPay(inv) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF9A3412)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Rounded.Payment, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Pay Now", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        item {
            Text("Invoices & Payment Records", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
        }

        items(invoices) { inv ->
            val isPaid = inv.status == "PAID"
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(inv.invoiceNumber, fontFamily = FontFamily.Monospace, fontSize = 11.sp, color = Color.Gray)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (isPaid) Color(0xFFD1FAE5) else Color(0xFFFEF3C7))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                inv.status,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isPaid) Color(0xFF065F46) else Color(0xFF92400E)
                            )
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(inv.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total: ৳ ${inv.totalAmount.toInt()}", fontSize = 12.sp, color = Color.Gray)
                        Text(
                            "Due: ৳ ${inv.dueAmount.toInt()}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isPaid) Color(0xFF059669) else Color(0xFFC2410C)
                        )
                    }
                    if (!isPaid) {
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = { onPay(inv) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = CampusColors.PrimaryDark)
                        ) {
                            Icon(Icons.Rounded.Payment, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Simulate Payment & Download Receipt", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

    }
}

// ------------------------------------------
// STUDENT TAB: OFFICIAL EXAMINATIONS SCHEDULE
// ------------------------------------------
@Composable
fun StudentExamsTab(student: StudentProfileData) {
    val exams = SchoolDataRepository.getExamsForClass(student.className, student.institutionId)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Official Examination Schedule", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = Color.Black)
            Text("${student.className} • ${student.sectionName} • Term Examinations", fontSize = 12.sp, color = Color.Gray)
        }

        // Exam Notice Hero Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Brush.horizontalGradient(listOf(Color(0xFF0D9488), Color(0xFF14B8A6))))
                    .padding(18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Digital Admit Card: ACTIVE 🟢", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                        Text("ID: ${student.studentIdCode} • Roll: ${student.rollDisplay}", color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text("Please carry your RFID smart campus card to all exam halls.", color = Color.White.copy(alpha = 0.75f), fontSize = 10.sp)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.2f))
                            .padding(10.dp)
                    ) {
                        Icon(Icons.Rounded.FactCheck, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                    }
                }
            }
        }

        item {
            Text("Scheduled Course Examinations", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color.Black)
        }

        if (exams.isEmpty()) {
            item {
                Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text("No upcoming examinations scheduled.", color = Color.Gray)
                }
            }
        } else {
            items(exams) { ex ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(CampusColors.PrimaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Rounded.EventNote, contentDescription = null, tint = CampusColors.PrimaryDark, modifier = Modifier.size(24.dp))
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(ex.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(Modifier.height(3.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.CalendarToday, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(12.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(ex.startDate, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = CampusColors.PrimaryDark)
                                Spacer(Modifier.width(8.dp))
                                Icon(Icons.Rounded.Schedule, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(12.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(ex.time, fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFF1F5F9))
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(ex.room, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color.Black)
                        }
                    }
                }
            }
        }

    }
}

// ==========================================
// TEACHER DASHBOARD SCREEN (Full 10 Classes × 4 Sections × 20 Students View)
// ==========================================
@Composable
fun TeacherDashboardScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit
) {
    var selectedClass by remember(SchoolDataRepository.currentInstitutionId) {
        mutableStateOf(SchoolDataRepository.currentInstitution.classList.first())
    }
    var selectedSection by remember(SchoolDataRepository.currentInstitutionId) {
        mutableStateOf(SchoolDataRepository.currentInstitution.sectionList.first())
    }
    var selectedTab by remember { mutableStateOf(0) } // 0: Students (20), 1: Routine, 2: Exams
    var selectedDay by remember { mutableStateOf("Sunday") }
    var searchQuery by remember { mutableStateOf("") }
    var showAttendanceSheet by remember { mutableStateOf(false) }
    var viewingStudentCard by remember { mutableStateOf<StudentProfileData?>(null) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    val rawStudents = if (searchQuery.isNotBlank()) {
        SchoolDataRepository.searchStudents(searchQuery, SchoolDataRepository.currentInstitutionId)
    } else {
        SchoolDataRepository.getStudentsByClassAndSection(selectedClass, selectedSection, SchoolDataRepository.currentInstitutionId)
    }

    val sectionRoutine = SchoolDataRepository.getRoutineForSection(selectedClass, selectedSection, SchoolDataRepository.currentInstitutionId)
    val dayRoutine = sectionRoutine.filter { it.dayOfWeek.equals(selectedDay, ignoreCase = true) }
    val classExams = SchoolDataRepository.getExamsForClass(selectedClass, SchoolDataRepository.currentInstitutionId)

    val avgAttendance = if (rawStudents.isNotEmpty()) Math.round(rawStudents.map { it.attendancePercentage }.average() * 10.0) / 10.0 else 0.0
    val avgGpa = if (rawStudents.isNotEmpty()) Math.round(rawStudents.map { it.currentGpa }.average() * 100.0) / 100.0 else 0.0

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(CampusColors.LightBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Teacher Profile Header Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(18.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircleAvatarBox(name = "Prof. Kabir Ahmed", size = 52.dp)
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Prof. Kabir Ahmed", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                        Text("Faculty of Science & Mathematics • ${SchoolDataRepository.currentInstitution.name}", fontSize = 11.sp, color = Color.Gray)
                        Text("Assigned Scope: ${SchoolDataRepository.currentInstitution.classList.first()} to ${SchoolDataRepository.currentInstitution.classList.last()} (All Sections)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = CampusColors.PrimaryDark)
                    }
                    IconButton(onClick = onSignOut) {
                        Icon(Icons.Rounded.ExitToApp, contentDescription = "Log Out", tint = CampusColors.PrimaryDark)
                    }
                }
            }
        }

        // Current Assigned Institution (Strictly Scoped for Teacher - No Switching)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Rounded.LocationCity, contentDescription = null, tint = CampusColors.AccentGoldLight, modifier = Modifier.size(22.dp))
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Assigned Institution Campus", fontSize = 10.sp, color = Color.White.copy(alpha = 0.8f))
                        Text(
                            SchoolDataRepository.currentInstitution.name,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF16A34A).copy(alpha = 0.35f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Active 🟢", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.AccentGoldLight)
                    }
                }
            }
        }

        // CLASS SELECTOR
        item {
            Column {
                Text("Select Academic Class / Department", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = Color.Black)
                Spacer(Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(SchoolDataRepository.currentInstitution.classList) { cName ->
                        val isSelected = selectedClass == cName
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                selectedClass = cName
                                searchQuery = ""
                            },
                            label = { Text(cName, fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CampusColors.PrimaryDark,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }
        }

        // SECTION SELECTOR
        item {
            Column {
                Text("Select Class Section / Batch", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = Color.Black)
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    SchoolDataRepository.currentInstitution.sectionList.forEach { sName ->
                        val isSelected = selectedSection == sName
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                selectedSection = sName
                                searchQuery = ""
                            },
                            label = { Text(sName, fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                            modifier = Modifier.weight(1f),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CampusColors.PrimaryDark,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }
        }

        // SECTION SUMMARY METRICS
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricHighlightCard("Section Enrolled", "${rawStudents.size} Students", "$selectedClass $selectedSection", CampusColors.Primary, Modifier.weight(1f))
                MetricHighlightCard("Avg Attendance", "$avgAttendance%", "Gate Verified", Color(0xFF0284C7), Modifier.weight(1f))
                MetricHighlightCard("Avg CGPA", "$avgGpa", "Out of 5.00", Color(0xFFD97706), Modifier.weight(1f))
            }
        }

        // ACTION BUTTON: MARK ATTENDANCE FOR SECTION
        item {
            Button(
                onClick = { showAttendanceSheet = true },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CampusColors.PrimaryDark)
            ) {
                Icon(Icons.Rounded.HowToReg, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Take Class Attendance ($selectedClass - $selectedSection)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }

        // SEARCH BAR (Search any student among 800)
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search 800 students by name, roll, or ID code...", fontSize = 11.sp) },
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Rounded.Close, contentDescription = "Clear")
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = Color.White, focusedContainerColor = Color.White)
            )
        }

        // VIEW MODE TABS: [ 👥 Students (20) ] | [ 📅 Routine ] | [ 📝 Exams ]
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFE2E8F0))
                    .padding(3.dp)
            ) {
                listOf(
                    Pair(0, "Students (${rawStudents.size})"),
                    Pair(1, "Routine"),
                    Pair(2, "Exams")
                ).forEach { (idx, title) ->
                    val isSel = selectedTab == idx
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSel) CampusColors.PrimaryDark else Color.Transparent)
                            .clickable { selectedTab = idx }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(title, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = if (isSel) Color.White else Color.Black.copy(alpha = 0.7f))
                    }
                }
            }
        }

        // TAB 0: STUDENTS ROSTER (20 Students)
        if (selectedTab == 0) {
            item {
                Text(
                    if (searchQuery.isBlank()) "$selectedClass • $selectedSection Student Roster (20 Students)"
                    else "Search Results (${rawStudents.size} Matches)",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = Color.Black
                )
            }

            if (rawStudents.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text("No students found matching query.", color = Color.Gray)
                    }
                }
            } else {
                items(rawStudents) { student ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(CampusColors.PrimaryContainer)
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text("Roll ${student.rollDisplay}", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.PrimaryDark)
                                    }
                                    Spacer(Modifier.width(10.dp))
                                    Column {
                                        Text(student.fullName, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                                        Text("ID: ${student.studentIdCode} • ${student.className} - ${student.sectionName}", fontSize = 10.sp, color = Color.Gray)
                                    }
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFFFEF3C7))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("GPA ${student.currentGpa}", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFB45309))
                                    }
                            }
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Attendance: ${student.attendancePercentage}% • Blood: ${student.bloodGroup}", fontSize = 11.sp, color = Color.DarkGray)
                                Text("Guardian: ${student.guardianName} (${student.guardianRelation})", fontSize = 10.sp, color = Color.Gray)
                            }
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Phone: ${student.guardianPhone}", fontSize = 10.sp, color = CampusColors.PrimaryDark, fontWeight = FontWeight.SemiBold)
                                TextButton(
                                    onClick = { viewingStudentCard = student },
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                                ) {
                                    Text("View Details 👁️", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // TAB 1: CLASS ROUTINE
        if (selectedTab == 1) {
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("$selectedClass • $selectedSection Routine", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday")) { day ->
                            FilterChip(
                                selected = selectedDay == day,
                                onClick = { selectedDay = day },
                                label = { Text(day, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.PrimaryDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                }
            }

            items(dayRoutine) { slot ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(slot.subjectName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${slot.startTime} – ${slot.endTime} • Teacher: ${slot.teacherName}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFF1F5F9))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(slot.roomNumber, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // TAB 2: EXAM TIMETABLE
        if (selectedTab == 2) {
            item {
                Text("$selectedClass Examination Timetable", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(classExams) { ex ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(ex.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${ex.startDate} • ${ex.time}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFE0F2FE))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(ex.room, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0369A1))
                        }
                    }
                }
            }
        }

    }

    // TEACHER ATTENDANCE SHEET DIALOG (All 20 students)
    if (showAttendanceSheet) {
        val sectionStudents = SchoolDataRepository.getStudentsByClassAndSection(selectedClass, selectedSection)
        var attendanceState by remember {
            mutableStateOf(sectionStudents.associate { it.id to "Present" })
        }

        Dialog(onDismissRequest = { showAttendanceSheet = false }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().fillMaxHeight(0.85f).padding(8.dp)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text("Class Attendance Sheet", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.PrimaryDark)
                    Text("$selectedClass • $selectedSection (20 Students)", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(10.dp))

                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(sectionStudents) { std ->
                            val currentStatus = attendanceState[std.id] ?: "Present"
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(8.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(Modifier.weight(1f)) {
                                        Text("${std.rollDisplay}. ${std.fullName}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        Text("ID: ${std.studentIdCode}", fontSize = 9.sp, color = Color.Gray)
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                        listOf("Present", "Absent", "Late").forEach { opt ->
                                            FilterChip(
                                                selected = currentStatus == opt,
                                                onClick = {
                                                    attendanceState = attendanceState.toMutableMap().also { it[std.id] = opt }
                                                },
                                                label = { Text(opt.take(1), fontSize = 9.sp, fontWeight = FontWeight.Bold) }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = {
                            attendanceState.forEach { (stdId, st) ->
                                SchoolDataRepository.recordAttendance(stdId, st)
                            }
                            showAttendanceSheet = false
                            toastMessage = "Attendance for $selectedClass $selectedSection saved & recorded!"
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = CampusColors.PrimaryDark),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Save Class Attendance 🟢", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

    }

    // VIEW STUDENT DETAILS DIALOG
    viewingStudentCard?.let { std ->
        val results = SchoolDataRepository.getResultsForStudent(std)
        Dialog(onDismissRequest = { viewingStudentCard = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().fillMaxHeight(0.85f).padding(8.dp)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(std.fullName, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                            Text("ID: ${std.studentIdCode} • Roll: ${std.rollDisplay}", fontSize = 11.sp, color = Color.Gray)
                            Text("${std.className} • ${std.sectionName}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = CampusColors.PrimaryDark)
                        }
                        IconButton(onClick = { viewingStudentCard = null }) {
                            Icon(Icons.Rounded.Close, contentDescription = "Close")
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        MetricHighlightCard("Attendance", "${std.attendancePercentage}%", "Verified", CampusColors.Primary, Modifier.weight(1f))
                        MetricHighlightCard("CGPA", "${std.currentGpa}", "Out of 5.00", Color(0xFFD97706), Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(10.dp))
                    Text("Guardian Contact Information", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text("Guardian: ${std.guardianName} (${std.guardianRelation})", fontSize = 11.sp)
                    Text("Phone: ${std.guardianPhone}", fontSize = 11.sp, color = CampusColors.PrimaryDark, fontWeight = FontWeight.Bold)
                    Text("Email: ${std.guardianEmail}", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(10.dp))
                    Text("Subject Transcript & Marks", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(results) { res ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
                            ) {
                                Row(
                                    modifier = Modifier.padding(8.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(res.title, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        Text("Code: ${res.code} • Credits: ${res.credits}", fontSize = 9.sp, color = Color.Gray)
                                    }
                                    Text("${res.letterGrade} (${res.marks})", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.PrimaryDark)
                                }
                            }
                        }
                    }
                }
            }
        }

    }

    toastMessage?.let { msg ->
        LaunchedEffect(msg) {
            delay(3000)
            toastMessage = null
        }
        Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.BottomCenter) {
            Card(colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryDark)) {
                Text(msg, color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
            }
        }
    }
}

// ==========================================
// PARENT / GUARDIAN DASHBOARD SCREEN
// STRICT ACCESS CONTROL: Guardian sees ONLY their own children!
// ==========================================
@Composable
fun ParentDashboardScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit
) {
    val guardianEmail = client.userEmail ?: "guardian.demo@campusos.edu"
    // STRICT FILTER: Children linked to this guardian only!
    val children = SchoolDataRepository.getChildrenForGuardian(guardianEmail)

    var selectedChildIndex by remember { mutableStateOf(0) }
    val student = children.getOrElse(selectedChildIndex) { children.first() }

    var selectedParentTab by remember { mutableStateOf(0) } // 0: Overview, 1: Attendance, 2: Results, 3: Routine, 4: Exams, 5: Fees
    var selectedRoutineDay by remember { mutableStateOf("Sunday") }
    var showPaymentDialogFor by remember { mutableStateOf<InvoiceItemData?>(null) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    val invoices = SchoolDataRepository.getInvoicesForStudent(student)
    val pendingDue = invoices.filter { it.dueAmount > 0 }
    val results = SchoolDataRepository.getResultsForStudent(student)
    val exams = SchoolDataRepository.getExamsForClass(student.className, student.institutionId)
    val routineSlots = SchoolDataRepository.getRoutineForSection(student.className, student.sectionName, student.institutionId)
        .filter { it.dayOfWeek.equals(selectedRoutineDay, ignoreCase = true) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(CampusColors.LightBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // GUARDIAN RESTRICTED NOTICE BANNER
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFFEF3C7))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Shield, contentDescription = null, tint = Color(0xFFB45309), modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Guardian Portal: Strictly Scoped to Your Linked Child (${student.fullName} • ${student.institutionName})",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF92400E)
                    )
                }
            }
        }

        // CHILD SWITCHER (Only if Guardian has multiple registered children)
        if (children.size > 1) {
            item {
                Column {
                    Text("Select Your Child (Cross-Institution)", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = Color.Black)
                    Spacer(Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        children.forEachIndexed { idx, ch ->
                            val isSel = selectedChildIndex == idx
                            val campusTag = when (ch.institutionId) {
                                "inst-college" -> "College"
                                "inst-university" -> "Univ"
                                else -> "School"
                            }
                            FilterChip(
                                selected = isSel,
                                onClick = {
                                    selectedChildIndex = idx
                                    SchoolDataRepository.switchInstitution(ch.institutionId)
                                },
                                label = { Text("👶 ${ch.fullName} ($campusTag • ${ch.className})", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                modifier = Modifier.weight(1f),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = CampusColors.PrimaryDark,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }

        // CHILD HERO PROFILE CARD
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(18.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircleAvatarBox(name = student.fullName, size = 56.dp)
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(student.fullName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                            Spacer(Modifier.width(6.dp))
                            Icon(Icons.Rounded.Verified, contentDescription = null, tint = CampusColors.PrimaryDark, modifier = Modifier.size(16.dp))
                        }
                        Text("ID: ${student.studentIdCode} • Roll: ${student.rollDisplay}", fontSize = 11.sp, color = Color.Gray, fontFamily = FontFamily.Monospace)
                        Text("${student.institutionName} • ${student.className} (${student.sectionName})", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = CampusColors.PrimaryDark)
                        Text("Blood Group: ${student.bloodGroup} • Relation: ${student.guardianRelation}", fontSize = 10.sp, color = Color.Gray)
                    }
                    IconButton(onClick = onSignOut) {
                        Icon(Icons.Rounded.ExitToApp, contentDescription = "Log Out", tint = CampusColors.PrimaryDark)
                    }
                }
            }
        }

        // CHILD QUICK STATS
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricHighlightCard("Attendance", "${student.attendancePercentage}%", "Verified", CampusColors.Primary, Modifier.weight(1f))
                MetricHighlightCard("Current GPA", "${student.currentGpa}", "Out of 5.00", CampusColors.AccentGold, Modifier.weight(1f))
                MetricHighlightCard("Due Fees", "৳ ${pendingDue.sumOf { it.dueAmount }.toInt()}", "${pendingDue.size} Invoices", Color(0xFFDC2626), Modifier.weight(1f))
            }
        }

        // CHILD NAVIGATION TABS: [ Overview | Attendance | Marks | Routine | Exams | Fees ]
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(
                    listOf(
                        Pair(0, "Overview"),
                        Pair(1, "Attendance"),
                        Pair(2, "Grade Card"),
                        Pair(3, "Routine"),
                        Pair(4, "Exams"),
                        Pair(5, "Fees (${pendingDue.size})")
                    )
                ) { (idx, title) ->
                    val isSel = selectedParentTab == idx
                    FilterChip(
                        selected = isSel,
                        onClick = { selectedParentTab = idx },
                        label = { Text(title, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CampusColors.PrimaryDark,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // TAB 0: OVERVIEW & NOTICE
        if (selectedParentTab == 0) {
            item {
                Text("Today's Schedule & Campus Notice", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(routineSlots.take(3)) { slot ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(slot.subjectName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${slot.startTime} – ${slot.endTime} • Teacher: ${slot.teacherName}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(CampusColors.PrimaryContainer)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(slot.roomNumber, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = CampusColors.PrimaryDark)
                        }
                    }
                }
            }

            if (pendingDue.isNotEmpty()) {
                item {
                    Text("Pending School Fees & Dues", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = Color.Black)
                }
                items(pendingDue) { inv ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(inv.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("Due Date: ${inv.dueDate}", fontSize = 11.sp, color = Color.Gray)
                            }
                            Button(
                                onClick = { showPaymentDialogFor = inv },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Pay ৳ ${inv.dueAmount.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // TAB 1: ATTENDANCE HISTORY FOR CHILD
        if (selectedParentTab == 1) {
            item {
                Text("${student.fullName}'s Daily Attendance Log", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(SampleCampusData.defaultAttendanceHistory) { att ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(att.subject, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${att.date} (${att.day}) • ${att.time}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (att.status == "Present") Color(0xFFD1FAE5) else if (att.status == "Late") Color(0xFFFEF3C7) else Color(0xFFFEE2E2))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                att.status,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (att.status == "Present") Color(0xFF065F46) else if (att.status == "Late") Color(0xFF92400E) else Color(0xFF991B1B)
                            )
                        }
                    }
                }
            }
        }

        // TAB 2: GRADE CARD & MARKS FOR CHILD
        if (selectedParentTab == 2) {
            item {
                Text("${student.fullName}'s Academic Grade Sheet", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(results) { res ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(res.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Subject Code: ${res.code} • Credits: ${res.credits}", fontSize = 10.sp, color = Color.Gray)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(res.letterGrade, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = CampusColors.PrimaryDark)
                            Text("${res.marks} Marks", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }

        // TAB 3: CLASS ROUTINE FOR CHILD
        if (selectedParentTab == 3) {
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("${student.className} • ${student.sectionName} Timetable", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday")) { d ->
                            FilterChip(
                                selected = selectedRoutineDay == d,
                                onClick = { selectedRoutineDay = d },
                                label = { Text(d, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.PrimaryDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                }
            }
            items(routineSlots) { slot ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(slot.subjectName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${slot.startTime} – ${slot.endTime} • ${slot.teacherName}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFF1F5F9))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(slot.roomNumber, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // TAB 4: EXAM TIMETABLE FOR CHILD
        if (selectedParentTab == 4) {
            item {
                Text("${student.className} Examination Timetable", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(exams) { ex ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(ex.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${ex.startDate} • ${ex.time}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFE0F2FE))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(ex.room, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0369A1))
                        }
                    }
                }
            }
        }

        // TAB 5: FEES & PAYMENT
        if (selectedParentTab == 5) {
            item {
                Text("${student.fullName}'s School Fees & Dues", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(invoices) { inv ->
                val isPaid = inv.status == "PAID"
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(inv.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Due Date: ${inv.dueDate} • Invoice: ${inv.invoiceNumber}", fontSize = 10.sp, color = Color.Gray)
                        }
                        if (isPaid) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFFD1FAE5))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text("PAID ৳ ${inv.totalAmount.toInt()}", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF065F46))
                            }
                        } else {
                            Button(
                                onClick = { showPaymentDialogFor = inv },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Pay ৳ ${inv.dueAmount.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

    }

    // PAYMENT DIALOG
    showPaymentDialogFor?.let { inv ->
        Dialog(onDismissRequest = { showPaymentDialogFor = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Text("Digital Fee Payment Gateway", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.PrimaryDark)
                    Text("Payment for ${student.fullName} • ${inv.title}", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(14.dp))
                    Text("Payable Amount: ৳ ${inv.dueAmount.toInt()}", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFDC2626))
                    Spacer(Modifier.height(14.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                showPaymentDialogFor = null
                                toastMessage = "Payment of ৳ ${inv.dueAmount.toInt()} completed successfully via bKash!"
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE2136E))
                        ) {
                            Text("bKash ⚡", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                        Button(
                            onClick = {
                                showPaymentDialogFor = null
                                toastMessage = "Payment of ৳ ${inv.dueAmount.toInt()} completed successfully via Nagad!"
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF7941D))
                        ) {
                            Text("Nagad ⚡", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }
                }
            }
        }

    }

    toastMessage?.let { msg ->
        LaunchedEffect(msg) {
            delay(3000)
            toastMessage = null
        }
        Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.BottomCenter) {
            Card(colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryDark)) {
                Text(msg, color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
            }
        }
    }
}

// ==========================================
// SUPER ADMIN DASHBOARD SCREEN
// MASTER EDIT RIGHTS: Full edit capabilities across the entire system!
// ==========================================
@Composable
fun SuperAdminDashboardScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    onNavigate: (String) -> Unit,
    onSwitchTenant: () -> Unit,
    onSignOut: () -> Unit
) {
    var adminTab by remember { mutableStateOf(0) } // 0: Student Master (EDIT), 1: Routines (EDIT), 2: Exams (EDIT), 3: Admissions, 4: Platform
    var selectedClass by remember { mutableStateOf(SchoolDataRepository.classList.firstOrNull() ?: "Class 10") }
    var selectedSection by remember { mutableStateOf(SchoolDataRepository.sectionList.firstOrNull() ?: "Section A") }
    var selectedRoutineDay by remember { mutableStateOf("Sunday") }
    var searchQuery by remember { mutableStateOf("") }

    val currentInst = SchoolDataRepository.currentInstitution
    LaunchedEffect(currentInst.id) {
        if (!currentInst.classList.contains(selectedClass)) {
            selectedClass = currentInst.classList.firstOrNull() ?: ""
        }
        if (!currentInst.sectionList.contains(selectedSection)) {
            selectedSection = currentInst.sectionList.firstOrNull() ?: ""
        }
    }

    var studentToEdit by remember { mutableStateOf<StudentProfileData?>(null) }
    var routineToEdit by remember { mutableStateOf<RoutineSlotData?>(null) }
    var examToEdit by remember { mutableStateOf<ExaminationRecordData?>(null) }
    var feedbackToast by remember { mutableStateOf<String?>(null) }
    var showServerConfigDialog by remember { mutableStateOf(false) }

    val rawStudents = if (searchQuery.isNotBlank()) {
        SchoolDataRepository.searchStudents(searchQuery)
    } else {
        SchoolDataRepository.getStudentsByClassAndSection(selectedClass, selectedSection)
    }

    val sectionRoutine = SchoolDataRepository.getRoutineForSection(selectedClass, selectedSection)
    val dayRoutine = sectionRoutine.filter { it.dayOfWeek.equals(selectedRoutineDay, ignoreCase = true) }
    val classExams = SchoolDataRepository.getExamsForClass(selectedClass)
    val registrations = SchoolDataRepository.registrations
    val pendingCount = registrations.count { it.status == "pending" }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(CampusColors.LightBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Super Admin Profile Hero Banner
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.horizontalGradient(listOf(CampusColors.SuperAdminDark, CampusColors.SuperAdminLight)))
                    .padding(18.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircleAvatarBox(name = "Antar Dasgupta", size = 52.dp, bgColor = Color.White, textColor = CampusColors.SuperAdminDark)
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Antar Dasgupta", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
                                Spacer(Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(CampusColors.AccentGold)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("CREATOR 👑", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                            Text("antardasgupta@gmail.com", color = Color(0xFFC084FC), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            Text("System Creator & Chief Architect • Super Administrator", color = Color.White.copy(alpha = 0.85f), fontSize = 10.sp)
                        }
                        IconButton(onClick = onSignOut) {
                            Icon(Icons.Rounded.ExitToApp, contentDescription = "Log Out", tint = Color.White)
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color.Black.copy(alpha = 0.25f))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Platform: 3 Institutions • 1,280 Students", color = Color.White.copy(alpha = 0.95f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text("MASTER EDIT RIGHTS: FULL ✍️", color = CampusColors.AccentGoldLight, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }
            }
        }

        // ACTIVE INSTITUTION SWITCHER ROW (School • College • University)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("ACTIVE INSTITUTION SWITCHER", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.SuperAdminDark)
                        Text("3 Unified Campuses", fontSize = 10.sp, color = Color.Gray)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        SchoolDataRepository.institutions.forEach { inst ->
                            val isSelected = SchoolDataRepository.currentInstitutionId == inst.id
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    SchoolDataRepository.switchInstitution(inst.id)
                                    selectedClass = inst.classList.first()
                                    selectedSection = inst.sectionList.first()
                                    searchQuery = ""
                                },
                                label = {
                                    Text(
                                        "${inst.iconEmoji} ${inst.shortName}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    )
                                },
                                modifier = Modifier.weight(1f),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = CampusColors.SuperAdminDark,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }

        // Platform KPI Tiles
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricHighlightCard("Institution", currentInst.shortName, currentInst.type, CampusColors.Primary, Modifier.weight(1f))
                MetricHighlightCard("Total Students", "${SchoolDataRepository.students.size}", "1,280 Platform Total", Color(0xFF0284C7), Modifier.weight(1f))
                MetricHighlightCard("Review Queue", "$pendingCount Pending", "Admissions", Color(0xFF7C3AED), Modifier.weight(1f))
            }
        }

        // ADMIN NAVIGATION TABS
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(
                    listOf(
                        Pair(0, "👥 Edit Students"),
                        Pair(1, "📅 Edit Routines"),
                        Pair(2, "📝 Edit Exams"),
                        Pair(3, "📥 Admissions ($pendingCount)"),
                        Pair(4, "⚙️ Platform")
                    )
                ) { (idx, title) ->
                    val isSel = adminTab == idx
                    FilterChip(
                        selected = isSel,
                        onClick = { adminTab = idx },
                        label = { Text(title, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CampusColors.SuperAdminDark,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // TAB 0: 👥 STUDENT MASTER (EDIT STUDENT DATA)
        if (adminTab == 0) {
            item {
                Column {
                    Text("Select Class & Section to Manage", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                    Spacer(Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(SchoolDataRepository.classList) { cName ->
                            FilterChip(
                                selected = selectedClass == cName,
                                onClick = {
                                    selectedClass = cName
                                    searchQuery = ""
                                },
                                label = { Text(cName, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.SuperAdminDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        SchoolDataRepository.sectionList.forEach { sName ->
                            FilterChip(
                                selected = selectedSection == sName,
                                onClick = {
                                    selectedSection = sName
                                    searchQuery = ""
                                },
                                label = { Text(sName, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                modifier = Modifier.weight(1f),
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.SuperAdminDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search 800 students by name, roll, or ID code...", fontSize = 11.sp) },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Rounded.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = Color.White, focusedContainerColor = Color.White)
                )
            }

            item {
                Text(
                    if (searchQuery.isBlank()) "$selectedClass • $selectedSection (20 Students) - Click 'Edit' to Modify"
                    else "Search Results (${rawStudents.size} Matches)",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 13.sp
                )
            }

            items(rawStudents) { student ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(CampusColors.SuperAdminContainer)
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("Roll ${student.rollDisplay}", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = CampusColors.SuperAdminDark)
                                }
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Text(student.fullName, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                                    Text("ID: ${student.studentIdCode} • ${student.className} - ${student.sectionName}", fontSize = 10.sp, color = Color.Gray)
                                }
                            }
                            Button(
                                onClick = { studentToEdit = student },
                                colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Rounded.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Edit ✏️", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Att: ${student.attendancePercentage}% • CGPA: ${student.currentGpa} • Blood: ${student.bloodGroup}", fontSize = 11.sp, color = Color.DarkGray)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text("Guardian: ${student.guardianName} (${student.guardianPhone})", fontSize = 10.sp, color = Color.Gray)
                    }
                }
            }
        }

        // TAB 1: 📅 CLASS ROUTINES (EDIT ROUTINES)
        if (adminTab == 1) {
            item {
                Column {
                    Text("Select Class, Section & Day to Edit Routine", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                    Spacer(Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(SchoolDataRepository.classList) { cName ->
                            FilterChip(
                                selected = selectedClass == cName,
                                onClick = { selectedClass = cName },
                                label = { Text(cName, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.SuperAdminDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        SchoolDataRepository.sectionList.forEach { sName ->
                            FilterChip(
                                selected = selectedSection == sName,
                                onClick = { selectedSection = sName },
                                label = { Text(sName, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                modifier = Modifier.weight(1f),
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.SuperAdminDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday")) { d ->
                            FilterChip(
                                selected = selectedRoutineDay == d,
                                onClick = { selectedRoutineDay = d },
                                label = { Text(d, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.SuperAdminDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                }
            }

            items(dayRoutine) { slot ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(slot.subjectName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${slot.startTime} – ${slot.endTime} • Teacher: ${slot.teacherName} • ${slot.roomNumber}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Button(
                            onClick = { routineToEdit = slot },
                            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Edit ✏️", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // TAB 2: 📝 EXAM SCHEDULES (EDIT EXAMS)
        if (adminTab == 2) {
            item {
                Column {
                    Text("Select Class to Edit Examination Timetable", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                    Spacer(Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(SchoolDataRepository.classList) { cName ->
                            FilterChip(
                                selected = selectedClass == cName,
                                onClick = { selectedClass = cName },
                                label = { Text(cName, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = CampusColors.SuperAdminDark, selectedLabelColor = Color.White)
                            )
                        }
                    }
                }
            }

            items(classExams) { ex ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(ex.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("${ex.startDate} • ${ex.time} • Room: ${ex.room}", fontSize = 11.sp, color = Color.Gray)
                        }
                        Button(
                            onClick = { examToEdit = ex },
                            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Edit ✏️", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // TAB 3: 📥 ADMISSIONS REVIEW
        if (adminTab == 3) {
            item {
                Text("Admission Applications Queue ($pendingCount Pending)", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
            items(registrations) { reg ->
                val isPending = reg.status == "pending"
                val isApproved = reg.status == "approved"

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(reg.fullName, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isApproved) Color(0xFFD1FAE5) else if (isPending) Color(0xFFFEF3C7) else Color(0xFFFEE2E2))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    reg.status.uppercase(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (isApproved) Color(0xFF065F46) else if (isPending) Color(0xFF92400E) else Color(0xFF991B1B)
                                )
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Text("${reg.email} • ${reg.phone}", fontSize = 11.sp, color = Color.Gray)
                        Text("Role: ${reg.role.uppercase()} • Source: ${reg.source}", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = CampusColors.PrimaryDark)
                        Text(reg.notes, fontSize = 10.sp, color = Color.Black.copy(alpha = 0.7f))

                        if (isPending) {
                            Spacer(Modifier.height(10.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        SchoolDataRepository.approveRegistration(reg.id)
                                        feedbackToast = "${reg.fullName} Approved!"
                                    },
                                    modifier = Modifier.weight(1f).height(38.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Approve 🟢", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                OutlinedButton(
                                    onClick = {
                                        SchoolDataRepository.rejectRegistration(reg.id)
                                        feedbackToast = "${reg.fullName} Rejected."
                                    },
                                    modifier = Modifier.weight(1f).height(38.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Reject 🔴", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // TAB 4: ⚙️ PLATFORM (Super Admin Master Backend Control)
        if (adminTab == 4) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Backend & Database Configuration", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Connected Backend: Supabase PostgreSQL", fontSize = 11.sp, color = Color.Gray)
                        Text("Project URL: ${client.supabaseUrl.ifBlank { "Default Campus Backend" }}", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = Color.DarkGray)
                        Text("Tenant ID: ${client.selectedTenantId ?: "Default Campus"}", fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Spacer(Modifier.height(14.dp))
                        Button(
                            onClick = { showServerConfigDialog = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Rounded.Settings, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Configure Supabase Backend ⚙️", fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(8.dp))
                        Button(
                            onClick = onSwitchTenant,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Switch / Select Institution 🏢")
                        }
                    }
                }
            }
        }

        // COPYRIGHT & CREATOR ATTRIBUTION FOOTER
        item {
            Spacer(Modifier.height(8.dp))
            Column(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "CampusOS Multi-Institution Unified Platform",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = CampusColors.SuperAdminDark
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "All Rights Reserved to Antar Dasgupta\n© 2026 Antar Dasgupta. System Creator & Chief Architect.",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )
            }
        }
    }

    // =========================================================================
    // EDIT STUDENT DIALOG (Admin Master Rights)
    // =========================================================================
    studentToEdit?.let { std ->
        var editFirst by remember { mutableStateOf(std.firstName) }
        var editLast by remember { mutableStateOf(std.lastName) }
        var editRoll by remember { mutableStateOf(std.rollNumber.toString()) }
        var editAtt by remember { mutableStateOf(std.attendancePercentage.toString()) }
        var editGpa by remember { mutableStateOf(std.currentGpa.toString()) }
        var editBlood by remember { mutableStateOf(std.bloodGroup) }
        var editGuardianName by remember { mutableStateOf(std.guardianName) }
        var editGuardianPhone by remember { mutableStateOf(std.guardianPhone) }

        Dialog(onDismissRequest = { studentToEdit = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().fillMaxHeight(0.9f).padding(8.dp)
            ) {
                Column(
                    modifier = Modifier.padding(18.dp).verticalScroll(rememberScrollState())
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Edit Student Record ✏️", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.SuperAdminDark)
                        IconButton(onClick = { studentToEdit = null }) {
                            Icon(Icons.Rounded.Close, contentDescription = "Close")
                        }
                    }
                    Text("ID: ${std.studentIdCode} • ${std.className} - ${std.sectionName}", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = editFirst,
                        onValueChange = { editFirst = it },
                        label = { Text("First Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editLast,
                        onValueChange = { editLast = it },
                        label = { Text("Last Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = editRoll,
                            onValueChange = { editRoll = it },
                            label = { Text("Roll (1-20)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                        OutlinedTextField(
                            value = editBlood,
                            onValueChange = { editBlood = it },
                            label = { Text("Blood Group") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                    Spacer(Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = editAtt,
                            onValueChange = { editAtt = it },
                            label = { Text("Attendance %") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                        OutlinedTextField(
                            value = editGpa,
                            onValueChange = { editGpa = it },
                            label = { Text("Current GPA") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editGuardianName,
                        onValueChange = { editGuardianName = it },
                        label = { Text("Guardian Full Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editGuardianPhone,
                        onValueChange = { editGuardianPhone = it },
                        label = { Text("Guardian Phone Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { studentToEdit = null },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Cancel")
                        }

                        Button(
                            onClick = {
                                val rollInt = editRoll.toIntOrNull() ?: std.rollNumber
                                val attDbl = editAtt.toDoubleOrNull() ?: std.attendancePercentage
                                val gpaDbl = editGpa.toDoubleOrNull() ?: std.currentGpa

                                val updated = std.copy(
                                    firstName = editFirst.trim(),
                                    lastName = editLast.trim(),
                                    rollNumber = rollInt,
                                    attendancePercentage = attDbl,
                                    currentGpa = gpaDbl,
                                    bloodGroup = editBlood.trim().uppercase(),
                                    guardianName = editGuardianName.trim(),
                                    guardianPhone = editGuardianPhone.trim()
                                )

                                SchoolDataRepository.updateStudent(updated)
                                studentToEdit = null
                                feedbackToast = "Updated student ${updated.fullName} (${updated.studentIdCode})!"
                            },
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Save Changes 💾", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

    }

    // =========================================================================
    // EDIT ROUTINE SLOT DIALOG (Admin Master Rights)
    // =========================================================================
    routineToEdit?.let { slot ->
        var subName by remember { mutableStateOf(slot.subjectName) }
        var teacherName by remember { mutableStateOf(slot.teacherName) }
        var startTime by remember { mutableStateOf(slot.startTime) }
        var endTime by remember { mutableStateOf(slot.endTime) }
        var roomNo by remember { mutableStateOf(slot.roomNumber) }

        Dialog(onDismissRequest = { routineToEdit = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Text("Edit Routine Slot ✏️", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.SuperAdminDark)
                    Text("${slot.className} • ${slot.sectionName} • ${slot.dayOfWeek}", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = subName,
                        onValueChange = { subName = it },
                        label = { Text("Subject Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = teacherName,
                        onValueChange = { teacherName = it },
                        label = { Text("Teacher Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = startTime,
                            onValueChange = { startTime = it },
                            label = { Text("Start Time") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                        OutlinedTextField(
                            value = endTime,
                            onValueChange = { endTime = it },
                            label = { Text("End Time") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = roomNo,
                        onValueChange = { roomNo = it },
                        label = { Text("Room Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { routineToEdit = null },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Cancel")
                        }

                        Button(
                            onClick = {
                                val updated = slot.copy(
                                    subjectName = subName.trim(),
                                    teacherName = teacherName.trim(),
                                    startTime = startTime.trim(),
                                    endTime = endTime.trim(),
                                    roomNumber = roomNo.trim()
                                )
                                SchoolDataRepository.updateRoutineSlot(slot.className, slot.sectionName, updated)
                                routineToEdit = null
                                feedbackToast = "Routine slot updated successfully!"
                            },
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Save Slot 💾", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

    }

    // =========================================================================
    // EDIT EXAM SCHEDULE DIALOG (Admin Master Rights)
    // =========================================================================
    examToEdit?.let { ex ->
        var examTitle by remember { mutableStateOf(ex.title) }
        var examDate by remember { mutableStateOf(ex.startDate) }
        var examTime by remember { mutableStateOf(ex.time) }
        var examRoom by remember { mutableStateOf(ex.room) }

        Dialog(onDismissRequest = { examToEdit = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Text("Edit Exam Schedule ✏️", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = CampusColors.SuperAdminDark)
                    Text("${ex.className} • Midterm Examination", fontSize = 11.sp, color = Color.Gray)
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = examTitle,
                        onValueChange = { examTitle = it },
                        label = { Text("Exam Title") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = examDate,
                            onValueChange = { examDate = it },
                            label = { Text("Exam Date") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                        OutlinedTextField(
                            value = examTime,
                            onValueChange = { examTime = it },
                            label = { Text("Exam Time") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = examRoom,
                        onValueChange = { examRoom = it },
                        label = { Text("Exam Hall / Room") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { examToEdit = null },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Cancel")
                        }

                        Button(
                            onClick = {
                                val updated = ex.copy(
                                    title = examTitle.trim(),
                                    startDate = examDate.trim(),
                                    time = examTime.trim(),
                                    room = examRoom.trim()
                                )
                                SchoolDataRepository.updateExam(ex.className, updated)
                                examToEdit = null
                                feedbackToast = "Exam schedule updated successfully!"
                            },
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.SuperAdminDark),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Save Exam 💾", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

    }

    feedbackToast?.let { msg ->
        LaunchedEffect(msg) {
            delay(3000)
            feedbackToast = null
        }
        Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.BottomCenter) {
            Card(colors = CardDefaults.cardColors(containerColor = CampusColors.SuperAdminDark)) {
                Text(msg, color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
            }
        }
    }

    if (showServerConfigDialog) {
        ServerConfigDialog(client = client, onDismiss = { showServerConfigDialog = false })
    }
}

// ==========================================
// UNIFIED DASHBOARD SCREEN (Routes by Role)
// ==========================================
@Composable
fun DashboardScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    onNavigate: (String) -> Unit,
    onSwitchTenant: () -> Unit = {},
    onSignOut: () -> Unit = {}
) {
    val role = config.role.lowercase()

    when {
        config.isPlatformAdmin || role == "super_admin" || role == "admin" -> {
            SuperAdminDashboardScreen(
                client = client,
                config = config,
                onNavigate = onNavigate,
                onSwitchTenant = onSwitchTenant,
                onSignOut = onSignOut
            )
        }
        role == "teacher" -> {
            TeacherDashboardScreen(
                client = client,
                config = config,
                onNavigate = onNavigate,
                onSignOut = onSignOut
            )
        }
        role == "guardian" || role == "parent" -> {
            ParentDashboardScreen(
                client = client,
                config = config,
                onNavigate = onNavigate,
                onSignOut = onSignOut
            )
        }
        else -> {
            // Default to the rich Student Dashboard
            StudentDashboardScreen(
                client = client,
                config = config,
                onNavigate = onNavigate,
                onSignOut = onSignOut
            )
        }
    }
}

// ==========================================
// REUSABLE HELPER UI COMPONENTS
// ==========================================
@Composable
fun MetricHighlightCard(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(title, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = color, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, fontSize = 9.sp, color = Color.Black.copy(alpha = 0.6f), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
fun AttendanceStatusPill(
    label: String,
    count: String,
    textColor: Color,
    bgColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(count, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = textColor)
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = textColor.copy(alpha = 0.85f))
        }
    }
}

@Composable
fun CircleAvatarBox(
    name: String,
    size: androidx.compose.ui.unit.Dp,
    bgColor: Color = CampusColors.PrimaryContainer,
    textColor: Color = CampusColors.PrimaryDark
) {
    val initial = name.firstOrNull()?.uppercase() ?: "S"
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(bgColor),
        contentAlignment = Alignment.Center
    ) {
        Text(initial, fontWeight = FontWeight.ExtraBold, fontSize = (size.value * 0.45).sp, color = textColor)
    }
}

// ==========================================
// WORKSPACE SCAFFOLD & TENANT SELECTION
// ==========================================
@Composable
fun TenantSelectionScreen(
    client: CampusSupabaseClient,
    onSelectTenant: (String) -> Unit,
    onBack: () -> Unit = {},
    onSignOut: () -> Unit
) {
    val institutions = SchoolDataRepository.institutions
    val currentInstId = SchoolDataRepository.currentInstitutionId

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CampusColors.LightBackground)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = CampusColors.PrimaryDark)
                }
                Spacer(Modifier.width(4.dp))
                Column {
                    Text("Select Campus Institution", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = CampusColors.PrimaryDark)
                    Text("3 Integrated Campuses • 1,280 Total Students", fontSize = 11.sp, color = Color.Gray)
                }
            }
            IconButton(onClick = onSignOut) {
                Icon(Icons.Rounded.Logout, contentDescription = "Sign Out", tint = Color(0xFFDC2626))
            }
        }

        Spacer(Modifier.height(14.dp))

        // Hero Instruction Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryDark),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(CampusColors.AccentGoldLight.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Rounded.SwapHoriz, contentDescription = null, tint = CampusColors.AccentGoldLight, modifier = Modifier.size(24.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        "Multi-Campus Unified Platform",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp
                    )
                    Text(
                        "Select any institution below to switch students, routines, examinations, and faculty console.",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(institutions) { inst ->
                val isActive = inst.id == currentInstId
                val instIcon = when (inst.type.lowercase()) {
                    "college" -> Icons.Rounded.School
                    "university" -> Icons.Rounded.AccountBalance
                    else -> Icons.Rounded.LocationCity
                }
                val badgeColor = when (inst.type.lowercase()) {
                    "college" -> Color(0xFF7C3AED)
                    "university" -> Color(0xFF2563EB)
                    else -> Color(0xFF0F766E)
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            SchoolDataRepository.switchInstitution(inst.id)
                            client.selectedTenantId = inst.id
                            onSelectTenant(inst.id)
                        },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isActive) Color(0xFFF0FDF4) else Color.White
                    ),
                    border = BorderStroke(
                        width = if (isActive) 2.dp else 1.dp,
                        color = if (isActive) Color(0xFF16A34A) else Color(0xFFE2E8F0)
                    )
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(badgeColor.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(instIcon, contentDescription = null, tint = badgeColor, modifier = Modifier.size(26.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(
                                    inst.name,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = Color(0xFF1E293B)
                                )
                                Spacer(Modifier.height(2.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(badgeColor)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(inst.type.uppercase(), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Text("•", color = Color.Gray, fontSize = 10.sp)
                                    Text(inst.code, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.DarkGray)
                                }
                            }
                            if (isActive) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(Color(0xFFDCFCE7))
                                        .padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text("Active 🟢", color = Color(0xFF16A34A), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }

                        Spacer(Modifier.height(12.dp))
                        HorizontalDivider(color = Color(0xFFF1F5F9))
                        Spacer(Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                inst.tagline,
                                fontSize = 11.sp,
                                color = Color(0xFF64748B),
                                fontWeight = FontWeight.Medium
                            )
                            Button(
                                onClick = {
                                    SchoolDataRepository.switchInstitution(inst.id)
                                    client.selectedTenantId = inst.id
                                    onSelectTenant(inst.id)
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isActive) Color(0xFF16A34A) else CampusColors.PrimaryDark
                                ),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    if (isActive) "Current Campus ✓" else "Switch to Campus ➔",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "Created by Antar Dasgupta",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = CampusColors.PrimaryDark
            )
            Text(
                "© 2026 Antar Dasgupta. All Rights Reserved.",
                fontSize = 10.sp,
                color = Color.Gray
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CampusWorkspaceScaffold(
    config: EffectiveConfig,
    currentRoute: String,
    syncing: Boolean,
    onNavigate: (String) -> Unit,
    onSync: () -> Unit,
    onSwitchTenant: () -> Unit,
    onSignOut: () -> Unit,
    content: @Composable (PaddingValues) -> Unit
) {
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val isSuperAdmin = config.role == "super_admin" || config.role == "admin" || config.isPlatformAdmin

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isSuperAdmin) CampusColors.SuperAdminDark else CampusColors.PrimaryDark)
                        .padding(20.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.campusos_logo),
                        contentDescription = "CampusOS",
                        modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)).background(Color.White).padding(3.dp)
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(config.tenantName ?: config.brandName, color = Color.White, fontWeight = FontWeight.Bold)
                    Text("Role: ${config.role.uppercase()} • v${config.version}", color = CampusColors.AccentGoldLight, fontSize = 12.sp)
                }
                LazyColumn(modifier = Modifier.weight(1f).padding(vertical = 8.dp)) {
                    item {
                        NavigationDrawerItem(
                            icon = { Icon(Icons.Rounded.Dashboard, contentDescription = null) },
                            label = { Text("Campus Dashboard", fontWeight = FontWeight.Bold) },
                            selected = currentRoute == "/dashboard",
                            onClick = {
                                scope.launch { drawerState.close() }
                                onNavigate("/dashboard")
                            }
                        )
                    }
                    if (isSuperAdmin) {
                        item {
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "   SWITCH INSTITUTION (3 CAMPUSES)",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = CampusColors.PrimaryDark
                            )
                            Spacer(Modifier.height(4.dp))
                        }
                        items(SchoolDataRepository.institutions) { inst ->
                            val isCurr = inst.id == SchoolDataRepository.currentInstitutionId
                            val instIcon = when (inst.type.lowercase()) {
                                "college" -> Icons.Rounded.School
                                "university" -> Icons.Rounded.AccountBalance
                                else -> Icons.Rounded.LocationCity
                            }
                            NavigationDrawerItem(
                                icon = {
                                    Icon(
                                        instIcon,
                                        contentDescription = null,
                                        tint = if (isCurr) Color(0xFF16A34A) else Color.Gray
                                    )
                                },
                                label = {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            inst.name,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.weight(1f),
                                            fontSize = 12.sp,
                                            fontWeight = if (isCurr) FontWeight.Bold else FontWeight.Normal
                                        )
                                        if (isCurr) {
                                            Text(" Active 🟢", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF16A34A))
                                        }
                                    }
                                },
                                selected = isCurr,
                                onClick = {
                                    SchoolDataRepository.switchInstitution(inst.id)
                                    scope.launch { drawerState.close() }
                                    onSwitchTenant()
                                }
                            )
                        }
                    } else {
                        item {
                            Spacer(Modifier.height(8.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                                colors = CardDefaults.cardColors(containerColor = CampusColors.PrimaryContainer.copy(alpha = 0.6f)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Rounded.LocationCity, contentDescription = null, tint = CampusColors.PrimaryDark, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            if (config.role == "teacher") "Assigned Institution" else "Enrolled Institution",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = CampusColors.PrimaryDark
                                        )
                                        Text(
                                            SchoolDataRepository.currentInstitution.name,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color.Black,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                        }
                    }
                    if (config.navigation.isNotEmpty()) {
                        item {
                            Spacer(Modifier.height(8.dp))
                            HorizontalDivider()
                            Spacer(Modifier.height(4.dp))
                        }
                        items(config.navigation) { nav ->
                            val target = mapNavRoute(nav)
                            NavigationDrawerItem(
                                icon = { Icon(resolveIcon(nav.icon), contentDescription = null) },
                                label = { Text(nav.label) },
                                selected = currentRoute == target,
                                onClick = {
                                    scope.launch { drawerState.close() }
                                    onNavigate(target)
                                }
                            )
                        }
                    }
                }
                if (isSuperAdmin) {
                    HorizontalDivider()
                    NavigationDrawerItem(
                        icon = { Icon(Icons.Rounded.SwapHoriz, contentDescription = null) },
                        label = { Text("All Institutions Screen 🏢", fontWeight = FontWeight.Bold) },
                        selected = false,
                        onClick = {
                            scope.launch { drawerState.close() }
                            onSwitchTenant()
                        }
                    )
                }
                NavigationDrawerItem(
                    icon = { Icon(Icons.Rounded.Logout, contentDescription = null, tint = Color(0xFFDC2626)) },
                    label = { Text("Log Out", color = Color(0xFFDC2626), fontWeight = FontWeight.Bold) },
                    selected = false,
                    onClick = {
                        scope.launch { drawerState.close() }
                        onSignOut()
                    }
                )
                Spacer(Modifier.height(8.dp))
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = if (isSuperAdmin) CampusColors.SuperAdminDark else CampusColors.PrimaryDark,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White,
                        actionIconContentColor = Color.White
                    ),
                    navigationIcon = {
                        if (currentRoute != "/dashboard") {
                            IconButton(onClick = { onNavigate("/dashboard") }) {
                                Icon(Icons.Rounded.ArrowBack, contentDescription = "Back")
                            }
                        } else {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Rounded.Menu, contentDescription = "Menu")
                            }
                        }
                    },
                    title = {
                        Column {
                            Text(config.tenantName ?: "CampusOS", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Config v${config.version} • ${config.role.uppercase()}", fontSize = 10.sp, color = CampusColors.AccentGoldLight)
                        }
                    },
                    actions = {
                        IconButton(onClick = onSync) {
                            if (syncing) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                            else Icon(Icons.Rounded.Sync, contentDescription = "Sync")
                        }
                        IconButton(onClick = { onNavigate("/notices") }) {
                            Icon(Icons.Rounded.Notifications, contentDescription = "Notifications")
                        }
                        if (isSuperAdmin) {
                            IconButton(onClick = onSwitchTenant) {
                                Icon(Icons.Rounded.SwapHoriz, contentDescription = "Switch")
                            }
                        }
                        IconButton(onClick = onSignOut) {
                            Icon(Icons.Rounded.Logout, contentDescription = "Log Out", tint = Color.White.copy(alpha = 0.8f))
                        }
                    }
                )
            },
            content = { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    content(innerPadding)
                }
            }
        )
    }
}

private fun mapNavRoute(nav: RemoteNav): String {
    if (nav.isCustom || nav.targetType == "custom_screen") {
        val clean = if (nav.routePath.startsWith("/")) nav.routePath else "/${nav.routePath}"
        return "/custom$clean"
    }
    return if (nav.routePath.isBlank() || nav.routePath == "/") "/dashboard" else nav.routePath
}

// ==========================================
// MODULE SCREENS (Attendance, Tables, Settings)
// ==========================================
@Composable
fun AttendanceSectionsScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig
) {
    val sections = listOf(
        Triple("teacher", "Teacher", "teacher_attendance"),
        Triple("student", "Student", "attendance"),
        Triple("guardian", "Guardian", "guardian_attendance")
    )
    var selectedTab by remember { mutableStateOf(1) } // default student
    var rows by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    var feedback by remember { mutableStateOf<String?>(null) }

    val (_, sectionLabel, table) = sections[selectedTab]

    LaunchedEffect(table, config.tenantId) {
        loading = true
        rows = client.fetchTable(table, config.tenantId, "attendance_date")
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            sections.forEachIndexed { idx, (_, label, _) ->
                Tab(
                    selected = selectedTab == idx,
                    onClick = { selectedTab = idx },
                    text = { Text(label, fontWeight = FontWeight.SemiBold) }
                )
            }
        }

        if (feedback != null) {
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Text(feedback!!, modifier = Modifier.padding(12.dp), fontSize = 12.sp)
            }
        }

        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else if (rows.isEmpty()) {
            // Render sample attendance rows so screen is never blank!
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(SampleCampusData.defaultAttendanceHistory) { rec ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Text("$sectionLabel • ${rec.date} (${rec.day})", fontWeight = FontWeight.Bold)
                            Text("Subject: ${rec.subject} • Status: ${rec.status.uppercase()} (${rec.time})", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(rows) { r ->
                    val recordId = r.optString("id")
                    val currentStatus = r.optString("status", "present")
                    val dateStr = r.optString("attendance_date", "")

                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Text("$sectionLabel • $dateStr", fontWeight = FontWeight.Bold)
                            Text("Status: ${currentStatus.uppercase()}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("present", "absent", "late", "excused").forEach { st ->
                                    FilterChip(
                                        selected = currentStatus == st,
                                        onClick = {
                                            if (recordId.isNotBlank()) {
                                                scope.launch {
                                                    val res = client.updateAttendanceStatus(table, recordId, st)
                                                    feedback = if (res.isSuccess) {
                                                        rows = client.fetchTable(table, config.tenantId, "attendance_date")
                                                        "Updated status to ${st.uppercase()}."
                                                    } else {
                                                        res.exceptionOrNull()?.message
                                                    }
                                                }
                                            }
                                        },
                                        label = { Text(st, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

    }
}

@Composable
fun ModuleDataScreen(
    title: String,
    moduleKey: String,
    table: String,
    orderCol: String,
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    rowSummary: (JSONObject) -> Pair<String, String>
) {
    var rows by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(table, config.tenantId) {
        loading = true
        rows = client.fetchTable(table, config.tenantId, orderCol)
        loading = false
    }

    if (loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
    } else if (rows.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Rounded.Inbox, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(44.dp))
                Spacer(Modifier.height(8.dp))
                Text("No $title Records Yet", fontWeight = FontWeight.SemiBold)
                Text(
                    if (client.isConfigured) "Records created in Web or Mobile will sync here." else "Connect Supabase in Settings to sync live data.",
                    fontSize = 12.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )
            }
        }
    } else {
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(rows) { r ->
                val (head, sub) = rowSummary(r)
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(14.dp)) {
                        Text(head, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        Text(sub, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

    }
}

@Composable
fun SettingsScreen(
    client: CampusSupabaseClient,
    config: EffectiveConfig,
    darkMode: Boolean?,
    onSetDarkMode: (Boolean?) -> Unit,
    onSync: () -> Unit,
    onSignOut: () -> Unit
) {
    var showServerDialog by remember { mutableStateOf(false) }

    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Appearance Mode", fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(selected = darkMode == null, onClick = { onSetDarkMode(null) }, label = { Text("System") })
                        FilterChip(selected = darkMode == false, onClick = { onSetDarkMode(false) }, label = { Text("Light") })
                        FilterChip(selected = darkMode == true, onClick = { onSetDarkMode(true) }, label = { Text("Dark") })
                    }
                }
            }
        }
        item {
            Card(Modifier.fillMaxWidth()) {
                ListTileRow(
                    title = "Remote Config v${config.version}",
                    subtitle = "Role: ${config.role.uppercase()} • Supabase: ${if (client.isConfigured) "Connected 🟢" else "Unconfigured"}",
                    trailing = { Button(onClick = onSync) { Text("Sync") } }
                )
            }
        }
        if (config.isPlatformAdmin || config.role.lowercase() == "super_admin" || config.role.lowercase() == "admin") {
            item {
                Card(Modifier.fillMaxWidth().clickable { showServerDialog = true }) {
                    ListTileRow(
                        title = "Configure Supabase Connection",
                        subtitle = client.supabaseUrl.ifBlank { "Tap to set Project URL & Anon Key" },
                        trailing = { Icon(Icons.Rounded.ChevronRight, contentDescription = null) }
                    )
                }
            }
        }
        item {
            Card(Modifier.fillMaxWidth().clickable { onSignOut() }) {
                ListTileRow(
                    title = "Secure Logout",
                    subtitle = client.userEmail ?: "Signed in as ${config.role}",
                    trailing = { Icon(Icons.Rounded.Logout, contentDescription = null, tint = Color.Red) }
                )
            }
        }
    }

    if (showServerDialog) {
        ServerConfigDialog(client = client, onDismiss = { showServerDialog = false })
    }
}

@Composable
fun SupportScreen(client: CampusSupabaseClient, config: EffectiveConfig) {
    val scope = rememberCoroutineScope()
    var subject by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var status by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Help & Support", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        if (status != null) Text(status!!, color = CampusColors.PrimaryDark, fontSize = 13.sp)
        OutlinedTextField(value = subject, onValueChange = { subject = it }, label = { Text("Subject") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = body, onValueChange = { body = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth(), minLines = 4)
        Button(
            onClick = {
                scope.launch {
                    val res = client.submitSupportTicket(config.tenantId, subject, body)
                    res.onSuccess {
                        subject = ""
                        body = ""
                        status = "Support ticket submitted."
                    }.onFailure { status = it.message }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = CampusColors.PrimaryDark)
        ) { Text("Submit Ticket") }
    }
}

@Composable
fun CustomRemoteRouteScreen(routePath: String, config: EffectiveConfig) {
    val item = config.navigation.firstOrNull {
        it.routePath == routePath || "/${it.routePath.removePrefix("/")}" == routePath
    }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text(item?.label ?: "Custom Remote Screen", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Spacer(Modifier.height(6.dp))
                Text("Dynamically provisioned by Remote Configuration v${config.version} for route $routePath.")
            }
        }
    }
}

@Composable
private fun ListTileRow(title: String, subtitle: String, trailing: @Composable () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        trailing()
    }
}

@Composable
fun ServerConfigDialog(client: CampusSupabaseClient, onDismiss: () -> Unit) {
    var url by remember { mutableStateOf(client.supabaseUrl) }
    var anon by remember { mutableStateOf(client.supabaseAnonKey) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Connect Supabase Backend") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = url, onValueChange = { url = it }, label = { Text("SUPABASE_URL") })
                OutlinedTextField(value = anon, onValueChange = { anon = it }, label = { Text("SUPABASE_ANON_KEY") })
            }
        },
        confirmButton = {
            Button(onClick = {
                client.supabaseUrl = url
                client.supabaseAnonKey = anon
                onDismiss()
            }) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
