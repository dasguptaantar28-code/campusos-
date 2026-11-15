import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/env.dart';
import '../../services/remote_config_controller.dart';
import '../../widgets/campus_shell.dart';
import '../../widgets/state_views.dart';

class RoleDashboardScreen extends ConsumerStatefulWidget {
  const RoleDashboardScreen({super.key});

  @override
  ConsumerState<RoleDashboardScreen> createState() => _RoleDashboardScreenState();
}

class _RoleDashboardScreenState extends ConsumerState<RoleDashboardScreen> {
  Map<String, dynamic> _stats = {};
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final tenantId = ref.read(remoteConfigProvider).config.tenantId;
    if (!CampusEnv.isSupabaseConfigured || tenantId == null) return;
    setState(() => _loading = true);
    try {
      final res = await Supabase.instance.client.rpc('get_school_overview_stats', params: {'p_tenant_id': tenantId});
      if (res is Map) {
        setState(() => _stats = res.cast<String, dynamic>());
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final rcState = ref.watch(remoteConfigProvider);
    final cfg = rcState.config;
    final primary = Theme.of(context).colorScheme.primary;

    return CampusShell(
      title: 'Dashboard',
      currentRoute: '/dashboard',
      child: RefreshIndicator(
        onRefresh: () async {
          await ref.read(remoteConfigProvider.notifier).syncNow();
          await _loadStats();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primary, const Color(0xFF064E3B)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome Back (${cfg.role.toUpperCase()})',
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${cfg.tenantName ?? cfg.brandName} • Remote Config v${cfg.version}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_loading) const LinearProgressIndicator(),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.55,
              children: [
                _KpiCard(label: 'Students', value: '${_stats['total_students'] ?? 0}', icon: Icons.people_rounded),
                _KpiCard(label: 'Teachers', value: '${_stats['total_teachers'] ?? 0}', icon: Icons.school_rounded),
                _KpiCard(label: 'Attendance %', value: '${_stats['attendance_percentage'] ?? 0}%', icon: Icons.fact_check_rounded),
                _KpiCard(label: 'Active Navs', value: '${cfg.navigation.length}', icon: Icons.widgets_rounded),
              ],
            ),
            const SizedBox(height: 20),
            Text('Enabled Modules (Server-Driven)', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 2.3,
              ),
              itemCount: cfg.navigation.length,
              itemBuilder: (context, idx) {
                final item = cfg.navigation[idx];
                return Card(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      if (item.isCustom || item.targetType == 'custom_screen') {
                        final clean = item.routePath.startsWith('/') ? item.routePath : '/${item.routePath}';
                        context.push('/custom$clean');
                      } else if (item.routePath.isEmpty || item.routePath == '/') {
                        context.go('/dashboard');
                      } else {
                        context.push(item.routePath);
                      }
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          Icon(resolveCampusIcon(item.icon), color: primary),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              item.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _KpiCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary, size: 22),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text(label, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
