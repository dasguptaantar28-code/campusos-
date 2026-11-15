import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/brand_colors.dart';
import '../core/env.dart';
import '../services/auth_controller.dart';
import '../services/remote_config_controller.dart';
import '../widgets/state_views.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await ref.read(authControllerProvider.notifier).bootstrap();
    final auth = ref.read(authControllerProvider);
    await ref.read(remoteConfigProvider.notifier).initialize(tenantId: auth.selectedTenantId);
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    if (auth.user != null) {
      if (auth.selectedTenantId != null) {
        context.go('/dashboard');
      } else {
        context.go('/tenants');
      }
    } else {
      context.go('/onboarding');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CampusBrandColors.darkGreen,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset('assets/images/campusos-logo.jpg', width: 120, height: 120, fit: BoxFit.contain),
            ),
            const SizedBox(height: 20),
            const Text('CampusOS', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text('One Platform. Every Campus.', style: TextStyle(color: Color(0xFFA7F3D0), fontSize: 13)),
            const SizedBox(height: 28),
            const CircularProgressIndicator(color: CampusBrandColors.emeraldGreen),
          ],
        ),
      ),
    );
  }
}

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset('assets/images/campusos-banner.jpg', fit: BoxFit.cover),
              ),
              const SizedBox(height: 28),
              Text(
                'Complete School Management Platform for a Smarter Tomorrow',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'Manage Students, Teachers, Attendance, Results, Fees, and Live Server-Driven Remote Modules — unified with Supabase.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () => context.go('/login'),
                child: const Text('Sign In to CampusOS'),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () => context.go('/register'),
                child: const Text('Register Institution or Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String _selectedPortal = 'teacher';
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    try {
      await ref.read(authControllerProvider.notifier).signIn(_emailCtrl.text, _passCtrl.text);
      if (mounted) context.go('/tenants');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authControllerProvider).loading;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Image.asset('assets/images/campusos-logo.jpg', width: 84, height: 84),
                ),
              ),
              const SizedBox(height: 24),
              Text('Sign In', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Select Teacher, Student, or Guardian section to sign in.'),
              const SizedBox(height: 16),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'teacher', icon: Icon(Icons.school_rounded), label: Text('Teacher')),
                  ButtonSegment(value: 'student', icon: Icon(Icons.person_rounded), label: Text('Student')),
                  ButtonSegment(value: 'guardian', icon: Icon(Icons.shield_rounded), label: Text('Guardian')),
                ],
                selected: {_selectedPortal},
                onSelectionChanged: (sel) => setState(() => _selectedPortal = sel.first),
              ),
              if (!CampusEnv.isSupabaseConfigured) ...[
                const SizedBox(height: 16),
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(12),
                    child: Text(
                      'Supabase dart-defines not provided yet. Pass --dart-define=SUPABASE_URL=... and --dart-define=SUPABASE_ANON_KEY=... to connect to live cloud.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ],
              const SizedBox(height: 20),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: '${_selectedPortal[0].toUpperCase()}${_selectedPortal.substring(1)} Email Address'),
              ),
              const SizedBox(height: 14),
              TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: loading ? null : _submit,
                child: loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text('Sign In as ${_selectedPortal[0].toUpperCase()}${_selectedPortal.substring(1)}'),
              ),
              if (_selectedPortal == 'student') ...[
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () => context.go('/register'),
                  child: const Text('Create Account / Register'),
                ),
              ] else ...[
                const SizedBox(height: 10),
                Text(
                  '${_selectedPortal[0].toUpperCase()}${_selectedPortal.substring(1)} accounts are created by Super Admin.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
              const SizedBox(height: 12),
              if (!CampusEnv.isSupabaseConfigured)
                TextButton(
                  onPressed: () => context.go('/dashboard'),
                  child: const Text('Preview Offline UI Shell'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _schoolCtrl = TextEditingController();
  String? _statusMsg;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _schoolCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _statusMsg = null);
    try {
      await ref.read(authControllerProvider.notifier).signUp(
            fullName: _nameCtrl.text,
            email: _emailCtrl.text,
            password: _passCtrl.text,
            schoolName: _schoolCtrl.text,
          );
      if (mounted) context.go('/tenants');
    } catch (e) {
      setState(() => _statusMsg = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authControllerProvider).loading;
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account / School')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_statusMsg != null) ...[
              Text(_statusMsg!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
            ],
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 12),
            TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 12),
            TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password (8+ chars)')),
            const SizedBox(height: 12),
            TextField(controller: _schoolCtrl, decoration: const InputDecoration(labelText: 'Institution Name (optional)')),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: loading ? null : _submit,
              child: loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Register'),
            ),
          ],
        ),
      ),
    );
  }
}

class TenantSelectScreen extends ConsumerStatefulWidget {
  const TenantSelectScreen({super.key});

  @override
  ConsumerState<TenantSelectScreen> createState() => _TenantSelectScreenState();
}

class _TenantSelectScreenState extends ConsumerState<TenantSelectScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authControllerProvider.notifier).fetchMemberships());
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Institution'),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).signOut();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: auth.memberships.isEmpty
          ? CampusStateView(
              icon: Icons.apartment_rounded,
              title: 'No Active Institution Memberships',
              subtitle: 'Register a school or wait for administrator approval.',
              action: ElevatedButton(
                onPressed: () => ref.read(authControllerProvider.notifier).fetchMemberships(),
                child: const Text('Refresh Memberships'),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: auth.memberships.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final m = auth.memberships[idx];
                final active = m.tenantStatus == 'active';
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: active ? CampusBrandColors.primaryGreen : Colors.red,
                      child: const Icon(Icons.school_rounded, color: Colors.white),
                    ),
                    title: Text(m.tenantName, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${m.roleName} • Status: ${m.tenantStatus.toUpperCase()}'),
                    trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                    onTap: () async {
                      await ref.read(authControllerProvider.notifier).selectTenant(m.tenantId);
                      await ref.read(remoteConfigProvider.notifier).setActiveTenant(m.tenantId);
                      if (context.mounted) context.go('/dashboard');
                    },
                  ),
                );
              },
            ),
    );
  }
}
