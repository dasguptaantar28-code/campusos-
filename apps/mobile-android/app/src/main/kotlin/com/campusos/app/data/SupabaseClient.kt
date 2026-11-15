package com.campusos.app.data

import android.content.Context
import android.os.Build
import com.campusos.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class RemoteModule(
    val key: String,
    val name: String,
    val icon: String,
    val defaultRoute: String,
    val enabled: Boolean
)

data class RemoteNav(
    val id: String,
    val moduleKey: String,
    val label: String,
    val icon: String,
    val routePath: String,
    val targetType: String,
    val isCustom: Boolean
)

data class TenantSummary(
    val tenantId: String,
    val tenantName: String,
    val tenantSlug: String,
    val tenantStatus: String,
    val roleKey: String,
    val roleName: String
)

data class EffectiveConfig(
    val authorized: Boolean = true,
    val version: Int = 1,
    val maintenanceMode: Boolean = false,
    val maintenanceMessage: String = "CampusOS is undergoing scheduled maintenance.",
    val sessionRevoked: Boolean = false,
    val isPlatformAdmin: Boolean = false,
    val tenantStatus: String? = null,
    val error: String? = null,
    val tenantId: String? = null,
    val tenantName: String? = null,
    val role: String = "guest",
    val primaryHex: String = "#16A34A",
    val emeraldHex: String = "#22C55E",
    val brandName: String = "CampusOS",
    val tagline: String = "One Platform. Every Campus.",
    val modules: List<RemoteModule> = defaultModules(),
    val navigation: List<RemoteNav> = defaultNav(),
    val rawJson: String = "{}"
) {
    fun isModuleEnabled(key: String): Boolean {
        if (isPlatformAdmin) return true
        if (!authorized || maintenanceMode) return false
        return modules.firstOrNull { it.key == key }?.enabled ?: false
    }

    companion object {
        fun defaultModules() = listOf(
            RemoteModule("overview", "Overview", "LayoutDashboard", "", true),
            RemoteModule("attendance", "Attendance", "CalendarCheck2", "/attendance", true),
            RemoteModule("exams", "Examinations", "ClipboardList", "/exams", true),
            RemoteModule("results", "Results", "Award", "/results", true),
            RemoteModule("fees", "Fees", "CreditCard", "/fees", true),
            RemoteModule("homework", "Homework", "NotebookPen", "/homework", true),
            RemoteModule("timetable", "Timetable", "Clock", "/timetable", true),
            RemoteModule("notices", "Notifications", "Bell", "/notifications", true),
            RemoteModule("settings", "Settings", "Settings", "/settings", true)
        )

        fun defaultNav() = listOf(
            RemoteNav("1", "overview", "Home", "LayoutDashboard", "", "native", false),
            RemoteNav("2", "attendance", "Attendance", "CalendarCheck2", "/attendance", "native", false),
            RemoteNav("3", "results", "Results", "Award", "/results", "native", false),
            RemoteNav("4", "fees", "Fees", "CreditCard", "/fees", "native", false),
            RemoteNav("5", "homework", "Homework", "NotebookPen", "/homework", "native", false),
            RemoteNav("6", "timetable", "Timetable", "Clock", "/timetable", "native", false)
        )

        fun fromJson(raw: String): EffectiveConfig {
            return try {
                val obj = JSONObject(raw)
                val theme = obj.optJSONObject("theme")
                val branding = obj.optJSONObject("branding")
                val tenant = obj.optJSONObject("tenant")

                val modsArr = obj.optJSONArray("modules") ?: JSONArray()
                val mods = buildList {
                    for (i in 0 until modsArr.length()) {
                        val m = modsArr.getJSONObject(i)
                        add(
                            RemoteModule(
                                key = m.optString("key"),
                                name = m.optString("name"),
                                icon = m.optString("icon", "LayoutGrid"),
                                defaultRoute = m.optString("default_route"),
                                enabled = m.optBoolean("enabled", false)
                            )
                        )
                    }
                }

                val navArr = obj.optJSONArray("navigation") ?: JSONArray()
                val navs = buildList {
                    for (i in 0 until navArr.length()) {
                        val n = navArr.getJSONObject(i)
                        add(
                            RemoteNav(
                                id = n.optString("id"),
                                moduleKey = n.optString("module_key"),
                                label = n.optString("label"),
                                icon = n.optString("icon", "CircleDot"),
                                routePath = n.optString("route_path"),
                                targetType = n.optString("target_type", "native"),
                                isCustom = n.optBoolean("is_custom", false)
                            )
                        )
                    }
                }

                EffectiveConfig(
                    authorized = obj.optBoolean("authorized", true),
                    version = obj.optInt("version", 1),
                    maintenanceMode = obj.optBoolean("maintenance_mode", false),
                    maintenanceMessage = obj.optString("maintenance_message", "Scheduled maintenance in progress."),
                    sessionRevoked = obj.optBoolean("session_revoked", false),
                    isPlatformAdmin = obj.optBoolean("is_platform_admin", false),
                    tenantStatus = obj.optString("tenant_status").ifBlank { tenant?.optString("status") },
                    error = obj.optString("error").ifBlank { null },
                    tenantId = tenant?.optString("id"),
                    tenantName = branding?.optString("institutionName")?.ifBlank { null } ?: tenant?.optString("name"),
                    role = obj.optString("role", "guest"),
                    primaryHex = theme?.optString("primary", "#16A34A") ?: "#16A34A",
                    emeraldHex = theme?.optString("emerald", "#22C55E") ?: "#22C55E",
                    brandName = branding?.optString("brandName", "CampusOS") ?: "CampusOS",
                    tagline = branding?.optString("tagline", "One Platform. Every Campus.") ?: "One Platform. Every Campus.",
                    modules = mods.ifEmpty { defaultModules() },
                    navigation = navs,
                    rawJson = raw
                )
            } catch (_: Exception) {
                EffectiveConfig()
            }
        }
    }
}

class CampusSupabaseClient(context: Context) {
    private val prefs = context.getSharedPreferences("campusos_prefs", Context.MODE_PRIVATE)

    var supabaseUrl: String
        get() = prefs.getString("supabase_url", BuildConfig.SUPABASE_URL)?.trim()?.removeSuffix("/") ?: ""
        set(value) { prefs.edit().putString("supabase_url", value.trim().removeSuffix("/")).apply() }

    var supabaseAnonKey: String
        get() = prefs.getString("supabase_anon_key", BuildConfig.SUPABASE_ANON_KEY)?.trim() ?: ""
        set(value) { prefs.edit().putString("supabase_anon_key", value.trim()).apply() }

    var accessToken: String?
        get() = prefs.getString("access_token", null)
        set(value) { prefs.edit().putString("access_token", value).apply() }

    var userId: String?
        get() = prefs.getString("user_id", null)
        set(value) { prefs.edit().putString("user_id", value).apply() }

    var userEmail: String?
        get() = prefs.getString("user_email", null)
        set(value) { prefs.edit().putString("user_email", value).apply() }

    var selectedTenantId: String?
        get() = prefs.getString("tenant_id", null)
        set(value) { prefs.edit().putString("tenant_id", value).apply() }

    val isConfigured: Boolean
        get() = supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 20

    fun getCachedConfig(tenantId: String?): EffectiveConfig {
        val raw = prefs.getString("cfg_${tenantId ?: "global"}", null)
        return if (!raw.isNullOrBlank()) EffectiveConfig.fromJson(raw) else EffectiveConfig()
    }

    private fun saveCachedConfig(tenantId: String?, raw: String) {
        prefs.edit().putString("cfg_${tenantId ?: "global"}", raw).apply()
    }

    suspend fun signIn(email: String, password: String): Result<String> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.failure(Exception("Supabase URL & Anon Key not configured yet."))
        try {
            val body = JSONObject().put("email", email.trim()).put("password", password).toString()
            val (code, text) = request("POST", "$supabaseUrl/auth/v1/token?grant_type=password", body, useBearer = false)
            val json = JSONObject(text)
            if (code !in 200..299) {
                return@withContext Result.failure(Exception(json.optString("error_description", json.optString("msg", "Login failed"))))
            }
            val token = json.getString("access_token")
            val user = json.getJSONObject("user")
            accessToken = token
            userId = user.getString("id")
            userEmail = user.optString("email", email)

            registerDeviceAndSession(token, user.getString("id"))
            Result.success(user.getString("id"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signUp(fullName: String, email: String, password: String, schoolName: String): Result<String> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.failure(Exception("Supabase URL & Anon Key not configured yet."))
        try {
            val body = JSONObject()
                .put("email", email.trim())
                .put("password", password)
                .put("data", JSONObject().put("full_name", fullName.trim()))
                .toString()
            val (code, text) = request("POST", "$supabaseUrl/auth/v1/signup", body, useBearer = false)
            val json = JSONObject(text)
            if (code !in 200..299) {
                return@withContext Result.failure(Exception(json.optString("msg", "Sign up failed")))
            }
            val token = json.optString("access_token")
            val user = json.optJSONObject("user")
            if (token.isNotBlank() && user != null) {
                accessToken = token
                userId = user.getString("id")
                userEmail = user.optString("email", email)
                if (schoolName.isNotBlank()) {
                    val rpcBody = JSONObject().put("p_name", schoolName.trim()).put("p_email", email.trim()).toString()
                    request("POST", "$supabaseUrl/rest/v1/rpc/register_school_onboarding", rpcBody, useBearer = true)
                }
            }
            Result.success("Account registered successfully.")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchMemberships(): List<TenantSummary> = withContext(Dispatchers.IO) {
        val uid = userId ?: return@withContext emptyList()
        if (!isConfigured || accessToken.isNullOrBlank()) return@withContext emptyList()
        try {
            val url = "$supabaseUrl/rest/v1/tenant_memberships?select=tenant_id,roles(key,name),tenants(id,name,slug,status)&user_id=eq.$uid&status=eq.active&deleted_at=is.null"
            val (code, text) = request("GET", url, null, useBearer = true)
            if (code !in 200..299) return@withContext emptyList()
            val arr = JSONArray(text)
            buildList {
                for (i in 0 until arr.length()) {
                    val row = arr.getJSONObject(i)
                    val t = row.optJSONObject("tenants") ?: continue
                    val r = row.optJSONObject("roles")
                    add(
                        TenantSummary(
                            tenantId = t.getString("id"),
                            tenantName = t.getString("name"),
                            tenantSlug = t.getString("slug"),
                            tenantStatus = t.getString("status"),
                            roleKey = r?.optString("key") ?: "student",
                            roleName = r?.optString("name") ?: "Member"
                        )
                    )
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    suspend fun resolveRemoteConfig(tenantId: String?): EffectiveConfig = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext getCachedConfig(tenantId)
        try {
            val body = JSONObject()
                .put("p_tenant_id", tenantId ?: JSONObject.NULL)
                .put("p_platform", "mobile")
                .toString()
            val (code, text) = request("POST", "$supabaseUrl/rest/v1/rpc/resolve_effective_config", body, useBearer = true)
            if (code in 200..299) {
                saveCachedConfig(tenantId, text)
                val parsed = EffectiveConfig.fromJson(text)
                if (parsed.sessionRevoked) signOut()
                return@withContext parsed
            }
        } catch (_: Exception) {
        }
        getCachedConfig(tenantId)
    }

    suspend fun fetchSchoolOverviewStats(tenantId: String): JSONObject = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext JSONObject()
        try {
            val body = JSONObject().put("p_tenant_id", tenantId).toString()
            val (code, text) = request("POST", "$supabaseUrl/rest/v1/rpc/get_school_overview_stats", body, useBearer = true)
            if (code in 200..299) JSONObject(text) else JSONObject()
        } catch (_: Exception) {
            JSONObject()
        }
    }

    suspend fun fetchTable(table: String, tenantId: String?, orderCol: String = "created_at"): List<JSONObject> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext emptyList()
        try {
            val filter = if (tenantId != null) "tenant_id=eq.$tenantId&" else ""
            val url = "$supabaseUrl/rest/v1/$table?${filter}order=$orderCol.desc&limit=50"
            val (code, text) = request("GET", url, null, useBearer = true)
            if (code !in 200..299) return@withContext emptyList()
            val arr = JSONArray(text)
            List(arr.length()) { i -> arr.getJSONObject(i) }
        } catch (_: Exception) {
            emptyList()
        }
    }

    suspend fun submitSupportTicket(tenantId: String?, subject: String, description: String): Result<Unit> = withContext(Dispatchers.IO) {
        val uid = userId ?: return@withContext Result.failure(Exception("Sign in required"))
        if (!isConfigured) return@withContext Result.failure(Exception("Supabase not configured"))
        try {
            val body = JSONObject()
                .put("tenant_id", tenantId ?: JSONObject.NULL)
                .put("created_by", uid)
                .put("subject", subject.trim())
                .put("description", description.trim())
                .put("priority", "medium")
                .toString()
            val (code, text) = request("POST", "$supabaseUrl/rest/v1/support_tickets", body, useBearer = true)
            if (code in 200..299) Result.success(Unit) else Result.failure(Exception(text))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateAttendanceStatus(table: String, id: String, newStatus: String): Result<Unit> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext Result.failure(Exception("Offline mode"))
        try {
            val body = JSONObject().put("status", newStatus).toString()
            val (code, text) = request("PATCH", "$supabaseUrl/rest/v1/$table?id=eq.$id", body, useBearer = true)
            if (code in 200..299) Result.success(Unit) else Result.failure(Exception(text))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun signOut() {
        accessToken = null
        userId = null
        userEmail = null
        selectedTenantId = null
    }

    private fun registerDeviceAndSession(token: String, uid: String) {
        try {
            val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"
            val devBody = JSONObject()
                .put("user_id", uid)
                .put("device_id", "android-${Build.FINGERPRINT.take(24)}")
                .put("platform", "android")
                .put("device_name", deviceName)
                .put("app_version", "1.0.0")
                .put("is_active", true)
                .toString()
            request("POST", "$supabaseUrl/rest/v1/device_registrations?on_conflict=user_id,device_id", devBody, useBearer = true, prefer = "resolution=merge-duplicates")

            val sessBody = JSONObject()
                .put("user_id", uid)
                .put("session_token_hash", token.takeLast(16))
                .put("platform", "android")
                .put("user_agent", deviceName)
                .toString()
            request("POST", "$supabaseUrl/rest/v1/user_sessions", sessBody, useBearer = true)
        } catch (_: Exception) {
        }
    }

    private fun request(method: String, urlStr: String, body: String?, useBearer: Boolean, prefer: String? = null): Pair<Int, String> {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 10000
            readTimeout = 10000
            setRequestProperty("apikey", supabaseAnonKey)
            setRequestProperty("Content-Type", "application/json")
            if (useBearer && !accessToken.isNullOrBlank()) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
            if (prefer != null) {
                setRequestProperty("Prefer", prefer)
            }
        }
        if (body != null) {
            conn.doOutput = true
            OutputStreamWriter(conn.outputStream).use { it.write(body) }
        }
        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.bufferedReader()?.readText() ?: ""
        conn.disconnect()
        return code to text
    }
}
