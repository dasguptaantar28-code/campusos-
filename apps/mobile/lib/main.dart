import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/brand_colors.dart';
import 'core/env.dart';
import 'features/screens/academic_screens.dart';
import 'features/screens/auth_screens.dart';
import 'features/screens/dashboard_screen.dart';
import 'features/screens/operations_screens.dart';
import 'services/auth_controller.dart';
import 'services/push_service.dart';
import 'services/remote_config_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (CampusEnv.isSupabaseConfigured) {
    await Supabase.initialize(
      url: CampusEnv.supabaseUrl,
      anonKey: CampusEnv.supabaseAnonKey,
    );
  }

  await CampusPushService.initialize();

  runApp(const ProviderScope(child: CampusOsApp()));
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    GoRoute(path: '/tenants', builder: (_, __) => const TenantSelectScreen()),
    GoRoute(path: '/dashboard', builder: (_, __) => const RoleDashboardScreen()),
    GoRoute(path: '/student-profile', builder: (_, __) => const StudentProfileScreen()),
    GoRoute(path: '/teacher-profile', builder: (_, __) => const TeacherProfileScreen()),
    GoRoute(path: '/attendance', builder: (_, __) => const AttendanceScreen()),
    GoRoute(path: '/exams', builder: (_, __) => const ExaminationScreen()),
    GoRoute(path: '/results', builder: (_, __) => const ResultsScreen()),
    GoRoute(path: '/fees', builder: (_, __) => const FeesScreen()),
    GoRoute(path: '/homework', builder: (_, __) => const HomeworkScreen()),
    GoRoute(path: '/timetable', builder: (_, __) => const TimetableScreen()),
    GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
    GoRoute(path: '/documents', builder: (_, __) => const DocumentsScreen()),
    GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    GoRoute(path: '/support', builder: (_, __) => const SupportScreen()),
    GoRoute(
      path: '/custom/:slug',
      builder: (_, state) => CustomRemoteScreen(customPath: '/${state.pathParameters['slug'] ?? ''}'),
    ),
  ],
);

class CampusOsApp extends ConsumerWidget {
  const CampusOsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final cfg = ref.watch(remoteConfigProvider).config;

    final primary = CampusBrandColors.parseHex(cfg.primaryHex, CampusBrandColors.primaryGreen);
    final secondary = CampusBrandColors.parseHex(cfg.emeraldHex, CampusBrandColors.emeraldGreen);

    return MaterialApp.router(
      title: cfg.brandName,
      debugShowCheckedModeBanner: false,
      themeMode: auth.themeMode,
      theme: CampusBrandColors.buildTheme(
        brightness: Brightness.light,
        primary: primary,
        secondary: secondary,
      ),
      darkTheme: CampusBrandColors.buildTheme(
        brightness: Brightness.dark,
        primary: primary,
        secondary: secondary,
      ),
      routerConfig: _router,
    );
  }
}
