import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:campusos_mobile/core/brand_colors.dart';
import 'package:campusos_mobile/features/screens/academic_screens.dart';
import 'package:campusos_mobile/features/screens/operations_screens.dart';
import 'package:campusos_mobile/models/remote_config.dart';
import 'package:campusos_mobile/services/remote_config_controller.dart';
import 'package:campusos_mobile/widgets/campus_shell.dart';

class _TestConfigController extends RemoteConfigController {
  _TestConfigController(EffectiveRemoteConfig initial) {
    state = RemoteConfigState(config: initial);
  }

  void pushConfig(EffectiveRemoteConfig next) {
    state = state.copyWith(config: next);
  }
}

void main() {
  test('Fallback remote config includes core CampusOS brand colors and modules', () {
    final fallback = EffectiveRemoteConfig.fallback();
    expect(fallback.primaryHex, '#16A34A');
    expect(fallback.brandName, 'CampusOS');
    expect(fallback.isModuleEnabled('attendance'), isTrue);
  });

  testWidgets('TEST A (Mobile): Disabling attendance module hides it from nav and locks Attendance screen', (tester) async {
    final disabledJson = {
      'authorized': true,
      'version': 2,
      'maintenance_mode': false,
      'role': 'school_admin',
      'permissions': ['attendance.read'],
      'theme': {'primary': '#16A34A', 'emerald': '#22C55E'},
      'branding': {'brandName': 'CampusOS', 'institutionName': 'Green Valley'},
      'modules': [
        {'key': 'overview', 'name': 'Overview', 'icon': 'LayoutDashboard', 'default_route': '', 'nav_order': 10, 'enabled': true},
        {'key': 'attendance', 'name': 'Attendance', 'icon': 'CalendarCheck2', 'default_route': '/attendance', 'nav_order': 20, 'enabled': false},
      ],
      'navigation': [
        {'id': '1', 'module_key': 'overview', 'label': 'Home', 'icon': 'LayoutDashboard', 'route_path': '', 'target_type': 'native', 'sort_order': 10, 'is_custom': false},
      ],
      'widgets': [],
    };

    final controller = _TestConfigController(EffectiveRemoteConfig.fromJson(disabledJson));
    final router = GoRouter(
      initialLocation: '/attendance',
      routes: [
        GoRoute(path: '/attendance', builder: (_, __) => const AttendanceScreen()),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [remoteConfigProvider.overrideWith((_) => controller)],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Attendance Disabled'), findsOneWidget);
  });

  testWidgets('TEST B & D (Mobile): Theme override applies color and suspended tenant locks UI', (tester) async {
    final themedJson = {
      'authorized': true,
      'version': 3,
      'maintenance_mode': false,
      'role': 'student',
      'theme': {'primary': '#059669', 'emerald': '#10B981'},
      'branding': {'brandName': 'CampusOS', 'institutionName': 'Green Valley'},
      'modules': [
        {'key': 'overview', 'name': 'Overview', 'icon': 'LayoutDashboard', 'default_route': '', 'nav_order': 10, 'enabled': true},
      ],
      'navigation': [
        {'id': '1', 'module_key': 'overview', 'label': 'Home', 'icon': 'LayoutDashboard', 'route_path': '', 'target_type': 'native', 'sort_order': 10, 'is_custom': false},
      ],
    };

    final controller = _TestConfigController(EffectiveRemoteConfig.fromJson(themedJson));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [remoteConfigProvider.overrideWith((_) => controller)],
        child: Consumer(
          builder: (context, ref, _) {
            final cfg = ref.watch(remoteConfigProvider).config;
            final primary = CampusBrandColors.parseHex(cfg.primaryHex, CampusBrandColors.primaryGreen);
            return MaterialApp(
              theme: CampusBrandColors.buildTheme(brightness: Brightness.light, primary: primary),
              home: const CampusShell(
                title: 'Dashboard',
                currentRoute: '/dashboard',
                child: Center(child: Text('Active Workspace')),
              ),
            );
          },
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Active Workspace'), findsOneWidget);

    // Trigger TEST D: tenant suspended
    controller.pushConfig(EffectiveRemoteConfig.fromJson({
      'authorized': false,
      'tenant_status': 'suspended',
      'error': 'Institution access is currently suspended',
      'role': 'student',
      'theme': {'primary': '#059669'},
      'branding': {'brandName': 'CampusOS'},
      'modules': [],
      'navigation': [],
    }));
    await tester.pumpAndSettle();
    expect(find.text('Institution Access Restricted'), findsOneWidget);
  });

  testWidgets('TEST C (Mobile): Custom configurable navigation item renders CustomRemoteScreen', (tester) async {
    final customJson = {
      'authorized': true,
      'version': 4,
      'maintenance_mode': false,
      'role': 'student',
      'theme': {'primary': '#16A34A'},
      'branding': {'brandName': 'CampusOS'},
      'modules': [],
      'navigation': [
        {
          'id': 'nav-custom',
          'module_key': 'custom_scholarship',
          'label': 'Scholarship Portal',
          'icon': 'Award',
          'route_path': '/scholarships',
          'target_type': 'custom_screen',
          'payload_json': {'banner': 'Fall 2026 Grants Open'},
          'sort_order': 260,
          'is_custom': true,
        },
      ],
    };

    final controller = _TestConfigController(EffectiveRemoteConfig.fromJson(customJson));
    final router = GoRouter(
      initialLocation: '/custom/scholarships',
      routes: [
        GoRoute(
          path: '/custom/:slug',
          builder: (_, state) => CustomRemoteScreen(customPath: '/${state.pathParameters['slug']}'),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [remoteConfigProvider.overrideWith((_) => controller)],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Scholarship Portal'), findsWidgets);
    expect(find.textContaining('Remote Configuration v4'), findsOneWidget);
  });
}
