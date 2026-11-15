package com.campusos.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

object CampusColors {
    // Primary Palette (Emerald & Deep Forest Green)
    val PrimaryDark = Color(0xFF064E3B)
    val Primary = Color(0xFF047857)
    val PrimaryGreen = Color(0xFF047857)
    val PrimaryLight = Color(0xFF10B981)
    val EmeraldGreen = Color(0xFF10B981)
    val DarkGreen = Color(0xFF064E3B)
    val PrimaryContainer = Color(0xFFD1FAE5)

    // Secondary & Academic Gold
    val AccentGold = Color(0xFFD97706)
    val AccentGoldLight = Color(0xFFF59E0B)
    val AccentGoldContainer = Color(0xFFFEF3C7)

    // Super Admin Dedicated Palette
    val SuperAdminDark = Color(0xFF2E1065)
    val SuperAdminMedium = Color(0xFF3B0764)
    val SuperAdminLight = Color(0xFF581C87)
    val SuperAdminContainer = Color(0xFFF3E8FF)

    // Surface & Neutrals
    val Black = Color(0xFF111827)
    val Charcoal = Color(0xFF1F2937)
    val White = Color(0xFFFFFFFF)
    val LightBackground = Color(0xFFF8FAFC)
    val BorderLight = Color(0xFFE2E8F0)

    // Status
    val Success = Color(0xFF059669)
    val Warning = Color(0xFFD97706)
    val Error = Color(0xFFDC2626)
    val Info = Color(0xFF2563EB)

    fun parseHex(hex: String?, fallback: Color): Color {
        if (hex.isNullOrBlank()) return fallback
        val clean = hex.trim().removePrefix("#")
        return try {
            when (clean.length) {
                6 -> Color(("FF$clean").toLong(16))
                8 -> Color(clean.toLong(16))
                else -> fallback
            }
        } catch (_: Exception) {
            fallback
        }
    }
}

@Composable
fun CampusTheme(
    darkModeOverride: Boolean? = null,
    primaryHex: String? = null,
    emeraldHex: String? = null,
    content: @Composable () -> Unit
) {
    val darkTheme = darkModeOverride ?: isSystemInDarkTheme()
    val primary = CampusColors.parseHex(primaryHex, CampusColors.PrimaryGreen)
    val secondary = CampusColors.parseHex(emeraldHex, CampusColors.EmeraldGreen)

    val scheme = if (darkTheme) {
        darkColorScheme(
            primary = primary,
            secondary = secondary,
            background = Color(0xFF0B111A),
            surface = CampusColors.Black,
            surfaceVariant = CampusColors.Charcoal,
            onPrimary = CampusColors.White,
            onBackground = CampusColors.White,
            onSurface = CampusColors.White
        )
    } else {
        lightColorScheme(
            primary = primary,
            secondary = secondary,
            background = CampusColors.LightBackground,
            surface = CampusColors.White,
            surfaceVariant = Color(0xFFF1F5F9),
            onPrimary = CampusColors.White,
            onBackground = CampusColors.Black,
            onSurface = CampusColors.Black
        )
    }

    MaterialTheme(
        colorScheme = scheme,
        content = content
    )
}
