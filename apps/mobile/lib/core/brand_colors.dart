import 'package:flutter/material.dart';

class CampusBrandColors {
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color emeraldGreen = Color(0xFF22C55E);
  static const Color darkGreen = Color(0xFF064E3B);
  static const Color black = Color(0xFF111827);
  static const Color charcoal = Color(0xFF1F2937);
  static const Color white = Color(0xFFFFFFFF);
  static const Color lightBackground = Color(0xFFF8FAFC);

  static Color parseHex(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    final clean = hex.replaceFirst('#', '').trim();
    if (clean.length == 6) {
      final parsed = int.tryParse('FF$clean', radix: 16);
      if (parsed != null) return Color(parsed);
    } else if (clean.length == 8) {
      final parsed = int.tryParse(clean, radix: 16);
      if (parsed != null) return Color(parsed);
    }
    return fallback;
  }

  static ThemeData buildTheme({
    required Brightness brightness,
    Color primary = primaryGreen,
    Color secondary = emeraldGreen,
  }) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
      primary: primary,
      secondary: secondary,
      surface: isDark ? black : white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? const Color(0xFF0B111A) : lightBackground,
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? black : white,
        foregroundColor: isDark ? white : black,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: isDark ? charcoal : white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: white,
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? black : white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
        ),
      ),
    );
  }
}
