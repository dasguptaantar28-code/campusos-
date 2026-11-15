import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/env.dart';
import '../../services/auth_controller.dart';
import '../../services/push_service.dart';
import '../../services/remote_config_controller.dart';
import '../../widgets/campus_shell.dart';
import '../../widgets/state_views.dart';
import 'academic_screens.dart';

class FeesScreen extends StatelessWidget {
  const FeesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Fees & Dues',
      route: '/fees',
      moduleKey: 'fees',
      table: 'student_fees',
      orderBy: 'due_date',
      emptyIcon: Icons.credit_card_outlined,
      itemBuilder: (r) {
        final net = ((r['net_amount_cents'] as num?) ?? 0) / 100;
        final paid = ((r['paid_amount_cents'] as num?) ?? 0) / 100;
        return ListTile(
          leading: const Icon(Icons.receipt_long_rounded),
          title: Text('${r['title'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text('Net: \$${net.toStringAsFixed(2)} • Paid: \$${paid.toStringAsFixed(2)} • Due: ${r['due_date'] ?? ''}'),
          trailing: Chip(label: Text('${r['status'] ?? ''}')),
        );
      },
    );
  }
}

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ModuleQueryScreen(
      title: 'Documents & Materials',
      route: '/documents',
      moduleKey: 'overview',
      table: 'learning_materials',
      orderBy: 'created_at',
      emptyIcon: Icons.folder_open_rounded,
      itemBuilder: (r) => ListTile(
        leading: const Icon(Icons.description_rounded),
        title: Text('${r['title'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${r['material_type'] ?? 'document'} • ${r['description'] ?? ''}'),
      ),
    );
  }
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!CampusEnv.isSupabaseConfigured) {
      setState(() => _loading = false);
      return;
    }
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final rows = await Supabase.instance.client
          .from('notifications')
          .select()
          .eq('recipient_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
      setState(() {
        _items = (rows as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CampusShell(
      title: 'Notifications',
      currentRoute: '/notifications',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const CampusStateView(
                  icon: Icons.notifications_none_rounded,
                  title: 'All Caught Up',
                  subtitle: 'Attendance alerts, fee reminders, result notices, and admin broadcasts appear here.',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, idx) {
                      final n = _items[idx];
                      return Card(
                        child: ListTile(
                          leading: Icon(
                            n['is_read'] == true ? Icons.mark_email_read_outlined : Icons.notifications_active_rounded,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          title: Text('${n['title'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('${n['body'] ?? ''}'),
                          onTap: () async {
                            if (CampusEnv.isSupabaseConfigured && n['is_read'] != true) {
                              await Supabase.instance.client
                                  .from('notifications')
                                  .update({'is_read': true, 'read_at': DateTime.now().toIso8601String()})
                                  .eq('id', n['id']);
                              await _load();
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final rcState = ref.watch(remoteConfigProvider);
    final cfg = rcState.config;

    return CampusShell(
      title: 'Settings & Remote Sync',
      currentRoute: '/settings',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Appearance Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(value: ThemeMode.system, label: Text('System')),
                      ButtonSegment(value: ThemeMode.light, label: Text('Light')),
                      ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
                    ],
                    selected: {auth.themeMode},
                    onSelectionChanged: (sel) => ref.read(authControllerProvider.notifier).setThemeMode(sel.first),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.cloud_sync_rounded),
              title: Text('Remote Config Version v${cfg.version}'),
              subtitle: Text('Primary Theme: ${cfg.primaryHex} • FCM Ready: ${CampusPushService.isFirebaseReady}'),
              trailing: ElevatedButton(
                onPressed: () => ref.read(remoteConfigProvider.notifier).syncNow(),
                child: const Text('Sync Now'),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout_rounded, color: Colors.red),
              title: const Text('Secure Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              subtitle: Text(auth.user?.email ?? 'Signed out'),
              onTap: () async {
                await ref.read(authControllerProvider.notifier).signOut();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
        ],
      ),
    );
  }
}

class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({super.key});

  @override
  ConsumerState<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends ConsumerState<SupportScreen> {
  final _subjCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _submitting = false;
  String? _status;

  @override
  void dispose() {
    _subjCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!CampusEnv.isSupabaseConfigured) {
      setState(() => _status = 'Supabase not configured.');
      return;
    }
    final user = Supabase.instance.client.auth.currentUser;
    final tenantId = ref.read(remoteConfigProvider).config.tenantId;
    if (user == null) return;

    setState(() {
      _submitting = true;
      _status = null;
    });
    try {
      await Supabase.instance.client.from('support_tickets').insert({
        'tenant_id': tenantId,
        'created_by': user.id,
        'subject': _subjCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'priority': 'medium',
      });
      _subjCtrl.clear();
      _descCtrl.clear();
      setState(() => _status = 'Support ticket submitted to CampusOS team.');
    } catch (e) {
      setState(() => _status = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CampusShell(
      title: 'Help & Support',
      currentRoute: '/support',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_status != null) ...[
            Card(child: Padding(padding: const EdgeInsets.all(12), child: Text(_status!))),
            const SizedBox(height: 12),
          ],
          TextField(controller: _subjCtrl, decoration: const InputDecoration(labelText: 'Subject')),
          const SizedBox(height: 12),
          TextField(controller: _descCtrl, maxLines: 5, decoration: const InputDecoration(labelText: 'Describe your issue')),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting ? const CircularProgressIndicator(color: Colors.white) : const Text('Submit Support Ticket'),
          ),
        ],
      ),
    );
  }
}

class CustomRemoteScreen extends ConsumerWidget {
  final String customPath;

  const CustomRemoteScreen({super.key, required this.customPath});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cfg = ref.watch(remoteConfigProvider).config;
    final match = cfg.navigation.where(
      (n) => n.routePath == customPath || n.routePath == '/$customPath' || '/${n.routePath}' == customPath,
    );
    final nav = match.isNotEmpty ? match.first : null;

    return CampusShell(
      title: nav?.label ?? 'Custom Module',
      currentRoute: '/custom$customPath',
      child: nav == null
          ? const CampusStateView(
              icon: Icons.auto_awesome_outlined,
              title: 'Route Inactive',
              subtitle: 'This custom navigation item is not currently active.',
            )
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Icon(resolveCampusIcon(nav.icon), color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 10),
                          Text(nav.label, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Rendered dynamically from Remote Configuration v${cfg.version} without rebuilding the Android APK.'),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          const JsonEncoder.withIndent('  ').convert({
                            'module_key': nav.moduleKey,
                            'route_path': nav.routePath,
                            'target_type': nav.targetType,
                            'payload': nav.payloadJson,
                          }),
                          style: const TextStyle(color: Color(0xFF86EFAC), fontFamily: 'monospace', fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
