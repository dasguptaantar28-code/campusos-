package com.campusos.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.campusos.app.data.CampusSupabaseClient
import com.campusos.app.data.EffectiveConfig
import com.campusos.app.data.SchoolDataRepository
import com.campusos.app.ui.screens.*
import com.campusos.app.ui.theme.CampusTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val client = CampusSupabaseClient(applicationContext)

        setContent {
            val navController = rememberNavController()
            val scope = rememberCoroutineScope()
            var config by remember { mutableStateOf(client.getCachedConfig(client.selectedTenantId)) }
            var syncing by remember { mutableStateOf(false) }
            var darkMode by remember { mutableStateOf<Boolean?>(null) }

            fun triggerSync(tenantId: String? = client.selectedTenantId) {
                scope.launch {
                    syncing = true
                    val next = client.resolveRemoteConfig(tenantId)
                    config = if (next.role == "guest" && config.role != "guest") {
                        next.copy(role = config.role, isPlatformAdmin = config.isPlatformAdmin)
                    } else {
                        next
                    }
                    syncing = false
                }
            }

            // Live Remote Config polling when signed in & connected
            LaunchedEffect(client.selectedTenantId, client.accessToken) {
                while (true) {
                    if (client.isConfigured && client.accessToken != null) {
                        val next = client.resolveRemoteConfig(client.selectedTenantId)
                        if (next.role == "guest" && config.role != "guest") {
                            config = next.copy(role = config.role, isPlatformAdmin = config.isPlatformAdmin)
                        } else {
                            config = next
                        }
                    }
                    delay(20_000)
                }
            }

            val backStack by navController.currentBackStackEntryAsState()
            val currentRoute = backStack?.destination?.route ?: "splash"

            CampusTheme(
                darkModeOverride = darkMode,
                primaryHex = config.primaryHex,
                emeraldHex = config.emeraldHex
            ) {
                NavHost(navController = navController, startDestination = "splash") {
                    composable("splash") {
                        SplashScreen {
                            val dest = when {
                                client.accessToken != null && client.selectedTenantId != null -> "/dashboard"
                                client.accessToken != null -> "tenants"
                                else -> "login"
                            }
                            if (client.selectedTenantId != null) triggerSync(client.selectedTenantId)
                            navController.navigate(dest) { popUpTo("splash") { inclusive = true } }
                        }
                    }
                    val applyPortalSession: (String) -> Unit = { portal ->
                        val r = if (portal == "guardian") "parent" else portal
                        val isAdmin = (r == "admin" || r == "super_admin")
                        val email = (client.userEmail ?: "").lowercase()

                        val targetInstId = when {
                            isAdmin -> SchoolDataRepository.currentInstitutionId
                            email.contains("college") -> "inst-college"
                            email.contains("varsity") || email.contains("uni") -> "inst-university"
                            r == "student" -> {
                                val s = SchoolDataRepository.getStudentByEmail(email)
                                s?.institutionId ?: "inst-school"
                            }
                            r == "parent" -> {
                                val ch = SchoolDataRepository.getChildrenForGuardian(email)
                                ch.firstOrNull()?.institutionId ?: "inst-school"
                            }
                            else -> "inst-school"
                        }
                        SchoolDataRepository.switchInstitution(targetInstId)
                        client.selectedTenantId = targetInstId
                        config = config.copy(
                            role = r,
                            isPlatformAdmin = isAdmin,
                            tenantName = SchoolDataRepository.currentInstitution.name
                        )
                    }

                    composable("onboarding") {
                        LaunchedEffect(Unit) {
                            navController.navigate("login") { popUpTo("onboarding") { inclusive = true } }
                        }
                    }
                    composable("login") {
                        LoginScreen(
                            client = client,
                            initialPortal = "student",
                            onSignedIn = { portal ->
                                applyPortalSession(portal)
                                navController.navigate("/dashboard") { popUpTo("login") { inclusive = true } }
                            },
                            onRegister = { role -> navController.navigate("register/$role") },
                            onOfflinePreview = { portal ->
                                applyPortalSession(portal)
                                navController.navigate("/dashboard")
                            }
                        )
                    }
                    composable("login/{portal}") { entry ->
                        val p = entry.arguments?.getString("portal") ?: "student"
                        LoginScreen(
                            client = client,
                            initialPortal = p,
                            onSignedIn = { portal ->
                                applyPortalSession(portal)
                                navController.navigate("/dashboard") { popUpTo("onboarding") { inclusive = true } }
                            },
                            onRegister = { role -> navController.navigate("register/$role") },
                            onOfflinePreview = { portal ->
                                applyPortalSession(portal)
                                navController.navigate("/dashboard")
                            }
                        )
                    }
                    composable("register") {
                        RegisterScreen(
                            client = client,
                            initialRole = "student",
                            onDone = {
                                applyPortalSession("student")
                                navController.navigate("/dashboard") { popUpTo("login") { inclusive = true } }
                            },
                            onBack = { navController.popBackStack() }
                        )
                    }
                    composable("register/{role}") { entry ->
                        val role = entry.arguments?.getString("role") ?: "student"
                        RegisterScreen(
                            client = client,
                            initialRole = role,
                            onDone = {
                                applyPortalSession(role)
                                navController.navigate("/dashboard") { popUpTo("login") { inclusive = true } }
                            },
                            onBack = { navController.popBackStack() }
                        )
                    }
                    composable("tenants") {
                        val isSuperAdmin = (config.role == "super_admin" || config.role == "admin" || config.isPlatformAdmin)
                        if (!isSuperAdmin) {
                            LaunchedEffect(Unit) {
                                navController.navigate("/dashboard") { popUpTo("tenants") { inclusive = true } }
                            }
                        } else {
                            TenantSelectionScreen(
                                client = client,
                                onSelectTenant = { tid ->
                                    client.selectedTenantId = tid
                                    SchoolDataRepository.switchInstitution(tid)
                                    config = config.copy(tenantName = SchoolDataRepository.currentInstitution.name)
                                    triggerSync(tid)
                                    navController.navigate("/dashboard") { popUpTo("tenants") { inclusive = true } }
                                },
                                onBack = {
                                    if (!navController.popBackStack()) {
                                        navController.navigate("/dashboard")
                                    }
                                },
                                onSignOut = {
                                    client.signOut()
                                    navController.navigate("login") { popUpTo(0) }
                                }
                            )
                        }
                    }

                    val workspaceNavigate: (String) -> Unit = { rawRoute ->
                        val route = rawRoute.trim()
                        if (route.isNotBlank()) {
                            val target = when (route) {
                                "", "/" -> "/dashboard"
                                else -> route
                            }
                            try {
                                navController.navigate(target) {
                                    launchSingleTop = true
                                }
                            } catch (e: Exception) {
                                try {
                                    val slug = target.removePrefix("/").replace("/", "-")
                                    navController.navigate("/custom/$slug") {
                                        launchSingleTop = true
                                    }
                                } catch (_: Exception) {
                                    // Safe fallback prevents any crash
                                }
                            }
                        }
                    }
                    val workspaceSignOut: () -> Unit = {
                        client.signOut()
                        navController.navigate("login") { popUpTo(0) }
                    }
                    val safeSwitchTenant: () -> Unit = {
                        if (config.role == "super_admin" || config.role == "admin" || config.isPlatformAdmin) {
                            navController.navigate("tenants")
                        }
                    }

                    composable("/dashboard") {
                        CampusWorkspaceScaffold(
                            config = config,
                            currentRoute = "/dashboard",
                            syncing = syncing,
                            onNavigate = workspaceNavigate,
                            onSync = { triggerSync() },
                            onSwitchTenant = safeSwitchTenant,
                            onSignOut = workspaceSignOut
                        ) { _ ->
                            DashboardScreen(
                                client = client,
                                config = config,
                                onNavigate = workspaceNavigate,
                                onSwitchTenant = safeSwitchTenant,
                                onSignOut = workspaceSignOut
                            )
                        }
                    }

                    composable("/students") {
                        CampusWorkspaceScaffold(config, "/students", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Students Directory", "students", "students", "created_at", client, config) { r ->
                                "${r.optString("first_name")} ${r.optString("last_name")}" to "Code: ${r.optString("student_code", "N/A")} • Gender: ${r.optString("gender", "N/A")} • Status: ${r.optString("status", "active").uppercase()}"
                            }
                        }
                    }

                    composable("/teachers") {
                        CampusWorkspaceScaffold(config, "/teachers", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Faculty & Teachers", "teachers", "teachers", "created_at", client, config) { r ->
                                r.optString("full_name") to "${r.optString("designation", "Faculty")} • ${r.optString("department", "Academics")} • ${r.optString("email")}"
                            }
                        }
                    }

                    composable("/classes") {
                        CampusWorkspaceScaffold(config, "/classes", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Classes & Grades", "classes", "classes", "numeric_level", client, config) { r ->
                                "${r.optString("name")} (${r.optString("code")})" to "Numeric Level: ${r.optInt("numeric_level")} • Capacity: ${r.optInt("capacity")} students"
                            }
                        }
                    }

                    composable("/sections") {
                        CampusWorkspaceScaffold(config, "/sections", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Class Sections", "sections", "sections", "created_at", client, config) { r ->
                                r.optString("name") to "Room: ${r.optString("room_number", "TBA")} • Capacity: ${r.optInt("capacity")}"
                            }
                        }
                    }

                    composable("/subjects") {
                        CampusWorkspaceScaffold(config, "/subjects", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Academic Subjects", "subjects", "subjects", "code", client, config) { r ->
                                "${r.optString("name")} (${r.optString("code")})" to "Type: ${r.optString("subject_type").uppercase()} • Max: ${r.optInt("default_max_marks", 100)} (Pass: ${r.optInt("default_pass_marks", 33)})"
                            }
                        }
                    }

                    composable("/sessions") {
                        CampusWorkspaceScaffold(config, "/sessions", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Academic Sessions", "sessions", "academic_sessions", "start_date", client, config) { r ->
                                r.optString("name") to "${r.optString("start_date")} to ${r.optString("end_date")} • Current: ${if (r.optBoolean("is_current")) "YES" else "NO"}"
                            }
                        }
                    }

                    composable("/assignments") {
                        CampusWorkspaceScaffold(config, "/assignments", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Assignments", "assignments", "homework", "due_date", client, config) { r ->
                                r.optString("title") to "Due: ${r.optString("due_date", "TBD")} • ${r.optString("description")}"
                            }
                        }
                    }

                    composable("/admissions") {
                        CampusWorkspaceScaffold(config, "/admissions", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Online Admissions", "admissions", "students", "created_at", client, config) { r ->
                                "${r.optString("first_name")} ${r.optString("last_name")}" to "Admission #: ${r.optString("admission_number")} • Status: ${r.optString("status")}"
                            }
                        }
                    }

                    composable("/expenses") {
                        CampusWorkspaceScaffold(config, "/expenses", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Campus Expenses", "expenses", "student_fees", "created_at", client, config) { r ->
                                r.optString("title") to "Amount: $${r.optDouble("gross_amount_cents", 0.0) / 100} • Status: ${r.optString("status").uppercase()}"
                            }
                        }
                    }

                    composable("/notices") {
                        CampusWorkspaceScaffold(config, "/notices", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Campus Notices", "notices", "notices", "published_at", client, config) { r ->
                                r.optString("title") to r.optString("body")
                            }
                        }
                    }

                    composable("/notifications") {
                        CampusWorkspaceScaffold(config, "/notifications", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Notifications", "notices", "notices", "published_at", client, config) { r ->
                                r.optString("title") to r.optString("body")
                            }
                        }
                    }

                    composable("/events") {
                        CampusWorkspaceScaffold(config, "/events", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Campus Events", "events", "notices", "published_at", client, config) { r ->
                                r.optString("title") to r.optString("body")
                            }
                        }
                    }

                    composable("/communication") {
                        CampusWorkspaceScaffold(config, "/communication", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Parent Communication", "communication", "notices", "created_at", client, config) { r ->
                                r.optString("title") to r.optString("body")
                            }
                        }
                    }

                    composable("/reports") {
                        CampusWorkspaceScaffold(config, "/reports", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Academic Reports", "reports", "results", "created_at", client, config) { r ->
                                "Academic Performance Card" to "Grade: ${r.optString("grade", "A+")} • GPA: ${r.optDouble("gpa", 5.0)} • Rank #${r.optInt("rank_position", 1)}"
                            }
                        }
                    }

                    composable("/attendance") {
                        CampusWorkspaceScaffold(config, "/attendance", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            AttendanceSectionsScreen(client = client, config = config)
                        }
                    }

                    composable("/exams") {
                        CampusWorkspaceScaffold(config, "/exams", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Examinations", "exams", "exams", "created_at", client, config) { r ->
                                r.optString("name") to "${r.optString("category").uppercase()} • Status: ${r.optString("status").uppercase()}"
                            }
                        }
                    }

                    composable("/results") {
                        CampusWorkspaceScaffold(config, "/results", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Results", "results", "results", "created_at", client, config) { r ->
                                "Grade ${r.optString("grade")} • GPA ${r.optDouble("gpa")}" to "${r.optDouble("percentage")}% • Rank #${r.optInt("rank_position")}"
                            }
                        }
                    }

                    composable("/fees") {
                        CampusWorkspaceScaffold(config, "/fees", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Fees & Dues", "fees", "student_fees", "due_date", client, config) { r ->
                                r.optString("title") to "Status: ${r.optString("status").uppercase()} • Due: ${r.optString("due_date")}"
                            }
                        }
                    }

                    composable("/homework") {
                        CampusWorkspaceScaffold(config, "/homework", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Homework", "homework", "homework", "due_date", client, config) { r ->
                                r.optString("title") to "Due: ${r.optString("due_date")} • ${r.optString("description")}"
                            }
                        }
                    }

                    composable("/timetable") {
                        CampusWorkspaceScaffold(config, "/timetable", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Timetable & Routine", "timetable", "timetables", "day_of_week", client, config) { r ->
                                val days = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
                                val dayName = days.getOrElse(r.optInt("day_of_week", 0)) { "Day ${r.optInt("day_of_week")}" }
                                "$dayName (${r.optString("start_time")}–${r.optString("end_time")})" to "Room: ${r.optString("room_number", "TBA")}"
                            }
                        }
                    }

                    composable("/student-profile") {
                        CampusWorkspaceScaffold(config, "/student-profile", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Student Profile", "students", "students", "created_at", client, config) { r ->
                                "${r.optString("first_name")} ${r.optString("last_name")}" to "ID: ${r.optString("student_code")} • ${r.optString("status")}"
                            }
                        }
                    }

                    composable("/teacher-profile") {
                        CampusWorkspaceScaffold(config, "/teacher-profile", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Teacher Profile", "teachers", "teachers", "created_at", client, config) { r ->
                                r.optString("full_name") to "${r.optString("designation")} • ${r.optString("department")}"
                            }
                        }
                    }

                    composable("/documents") {
                        CampusWorkspaceScaffold(config, "/documents", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            ModuleDataScreen("Documents", "overview", "learning_materials", "created_at", client, config) { r ->
                                r.optString("title") to "${r.optString("material_type")} • ${r.optString("description")}"
                            }
                        }
                    }

                    composable("/settings") {
                        CampusWorkspaceScaffold(config, "/settings", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            SettingsScreen(
                                client = client,
                                config = config,
                                darkMode = darkMode,
                                onSetDarkMode = { darkMode = it },
                                onSync = { triggerSync() },
                                onSignOut = workspaceSignOut
                            )
                        }
                    }

                    composable("/support") {
                        CampusWorkspaceScaffold(config, "/support", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            SupportScreen(client = client, config = config)
                        }
                    }

                    composable("/custom/{slug}") { entry ->
                        val slug = entry.arguments?.getString("slug") ?: ""
                        CampusWorkspaceScaffold(config, "/custom/$slug", syncing, workspaceNavigate, { triggerSync() }, { navController.navigate("tenants") }, workspaceSignOut) { _ ->
                            CustomRemoteRouteScreen(routePath = "/$slug", config = config)
                        }
                    }
                }
            }
        }
    }
}
