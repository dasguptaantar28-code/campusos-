import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/remote_config.dart';
import '../services/auth_controller.dart';
import '../services/remote_config_controller.dart';
import 'state_views.dart';

class CampusShell extends ConsumerWidget {
  final String title;
  final Widget child;
  final String currentRoute;

  const CampusShell({
    super.key,
    required this.title,
    required this.child,
    required this.currentRoute,
  });

  String _mapNavToRoute(RemoteNavItem item) {
    if (item.isCustom || item.targetType == 'custom_screen') {
      final clean = item.routePath.startsWith('/') ? item.routePath : '/${item.routePath}';
      return '/custom$clean';
    }
    if (item.routePath.isEmpty || item.routePath == '/') return '/dashboard';
    return item.routePath;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rcState = ref.watch(remoteConfigProvider);
    final cfg = rcState.config;

    if (!cfg.authorized && !cfg.isPlatformAdmin) {
      return Scaffold(
        body: CampusStateView(
          icon: Icons.block_rounded,
          color: Colors.red,
          title: 'Institution Access Restricted',
          subtitle: cfg.error ?? 'Institution status is currently ${cfg.tenantStatus ?? 'suspended'}.',
          action: ElevatedButton(
            onPressed: () => context.go('/tenants'),
            child: const Text('Switch Institution'),
          ),
        ),
      );
    }

    if (cfg.maintenanceMode && !cfg.isPlatformAdmin) {
      return Scaffold(
        body: CampusStateView(
          icon: Icons.build_circle_rounded,
          color: Colors.amber,
          title: 'Scheduled Maintenance',
          subtitle: cfg.maintenanceMessage,
          action: ElevatedButton(
            onPressed: () => ref.read(remoteConfigProvider.notifier).syncNow(),
            child: const Text('Check Status'),
          ),
        ),
      );
    }

    final navItems = cfg.navigation;
    final bottomItems = navItems.take(4).toList();
    int selectedIdx = bottomItems.indexWhere((n) => _mapNavToRoute(n) == currentRoute);
    if (selectedIdx < 0) selectedIdx = 0;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            Text(
              '${cfg.tenantName ?? cfg.brandName} • v${cfg.version}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Sync Remote Config',
            onPressed: rcState.syncing ? null : () => ref.read(remoteConfigProvider.notifier).syncNow(),
            icon: rcState.syncing
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.sync_rounded),
          ),
          IconButton(
            tooltip: 'Notifications',
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                color: Theme.of(context).colorScheme.primary,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Image.asset('assets/images/campusos-logo.jpg', height: 48),
                    const SizedBox(height: 10),
                    Text(
                      cfg.tenantName ?? cfg.brandName,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      'Role: ${cfg.role.toUpperCase()} • Config v${cfg.version}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    ...navItems.map((item) {
                      final route = _mapNavToRoute(item);
                      return ListTile(
                        leading: Icon(resolveCampusIcon(item.icon)),
                        title: Text(item.label),
                        trailing: item.isCustom ? const Chip(label: Text('Custom', style: TextStyle(fontSize: 10))) : null,
                        selected: currentRoute == route,
                        onTap: () {
                          Navigator.pop(context);
                          context.go(route);
                        },
                      );
                    }),
                    const Divider(),
                    ListTile(leading: const Icon(Icons.person_rounded), title: const Text('Student Profile'), onTap: () { Navigator.pop(context); context.push('/student-profile'); }),
                    ListTile(leading: const Icon(Icons.school_rounded), title: const Text('Teacher Profile'), onTap: () { Navigator.pop(context); context.push('/teacher-profile'); }),
                    ListTile(leading: const Icon(Icons.folder_copy_rounded), title: const Text('Documents'), onTap: () { Navigator.pop(context); context.push('/documents'); }),
                    ListTile(leading: const Icon(Icons.help_outline_rounded), title: const Text('Help & Support'), onTap: () { Navigator.pop(context); context.push('/support'); }),
                    ListTile(leading: const Icon(Icons.settings_rounded), title: const Text('Settings'), onTap: () { Navigator.pop(context); context.push('/settings'); }),
                    ListTile(leading: const Icon(Icons.swap_horiz_rounded), title: const Text('Switch Institution'), onTap: () { Navigator.pop(context); context.go('/tenants'); }),
                    ListTile(
                      leading: const Icon(Icons.logout_rounded, color: Colors.red),
                      title: const Text('Secure Logout', style: TextStyle(color: Colors.red)),
                      onTap: () async {
                        await ref.read(authControllerProvider.notifier).signOut();
                        if (context.mounted) context.go('/login');
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: child,
      bottomNavigationBar: bottomItems.length >= 2
          ? NavigationBar(
              selectedIndex: selectedIdx,
              onDestinationSelected: (idx) => context.go(_mapNavToRoute(bottomItems[idx])),
              destinations: bottomItems
                  .map((item) => NavigationDestination(
                        icon: Icon(resolveCampusIcon(item.icon)),
                        label: item.label,
                      ))
                  .toList(),
            )
          : null,
    );
  }
}
