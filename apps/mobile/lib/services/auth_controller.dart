import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/env.dart';
import 'push_service.dart';

class TenantMembershipSummary {
  final String tenantId;
  final String tenantName;
  final String tenantSlug;
  final String tenantStatus;
  final String roleKey;
  final String roleName;

  const TenantMembershipSummary({
    required this.tenantId,
    required this.tenantName,
    required this.tenantSlug,
    required this.tenantStatus,
    required this.roleKey,
    required this.roleName,
  });
}

class AuthAppState {
  final User? user;
  final String? selectedTenantId;
  final List<TenantMembershipSummary> memberships;
  final ThemeMode themeMode;
  final bool loading;

  const AuthAppState({
    this.user,
    this.selectedTenantId,
    this.memberships = const [],
    this.themeMode = ThemeMode.system,
    this.loading = false,
  });

  AuthAppState copyWith({
    User? user,
    String? selectedTenantId,
    List<TenantMembershipSummary>? memberships,
    ThemeMode? themeMode,
    bool? loading,
  }) {
    return AuthAppState(
      user: user ?? this.user,
      selectedTenantId: selectedTenantId ?? this.selectedTenantId,
      memberships: memberships ?? this.memberships,
      themeMode: themeMode ?? this.themeMode,
      loading: loading ?? this.loading,
    );
  }
}

class AuthController extends StateNotifier<AuthAppState> {
  AuthController() : super(const AuthAppState());

  static const _storage = FlutterSecureStorage();
  static const _tenantKey = 'campusos_selected_tenant_id';

  Future<void> bootstrap() async {
    if (!CampusEnv.isSupabaseConfigured) return;
    final client = Supabase.instance.client;
    final user = client.auth.currentUser;
    final savedTenant = await _storage.read(key: _tenantKey);
    state = state.copyWith(user: user, selectedTenantId: savedTenant);
    if (user != null) {
      await fetchMemberships();
    }
  }

  Future<void> signIn(String email, String password) async {
    if (!CampusEnv.isSupabaseConfigured) {
      throw Exception('Supabase URL and Anon Key not configured (--dart-define).');
    }
    state = state.copyWith(loading: true);
    try {
      final res = await Supabase.instance.client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      if (res.user == null) throw Exception('Authentication failed');

      await _registerDeviceAndSession(res.user!, res.session?.accessToken);
      state = state.copyWith(user: res.user, loading: false);
      await fetchMemberships();
    } catch (e) {
      state = state.copyWith(loading: false);
      rethrow;
    }
  }

  Future<void> signUp({
    required String fullName,
    required String email,
    required String password,
    String? schoolName,
  }) async {
    if (!CampusEnv.isSupabaseConfigured) {
      throw Exception('Supabase URL and Anon Key not configured.');
    }
    state = state.copyWith(loading: true);
    try {
      final res = await Supabase.instance.client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {'full_name': fullName},
      );
      if (res.user == null) throw Exception('Sign up failed');

      if (schoolName != null && schoolName.trim().isNotEmpty && res.session != null) {
        await Supabase.instance.client.rpc('register_school_onboarding', params: {
          'p_name': schoolName.trim(),
          'p_email': email.trim(),
        });
      }
      state = state.copyWith(user: res.user, loading: false);
      if (res.session != null) await fetchMemberships();
    } catch (e) {
      state = state.copyWith(loading: false);
      rethrow;
    }
  }

  Future<void> fetchMemberships() async {
    if (!CampusEnv.isSupabaseConfigured) return;
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    final rows = await Supabase.instance.client
        .from('tenant_memberships')
        .select('tenant_id, roles(key, name), tenants(id, name, slug, status)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .is('deleted_at', null);

    final list = <TenantMembershipSummary>[];
    for (final row in (rows as List)) {
      final t = row['tenants'] as Map?;
      final r = row['roles'] as Map?;
      if (t == null) continue;
      list.add(TenantMembershipSummary(
        tenantId: t['id'].toString(),
        tenantName: t['name'].toString(),
        tenantSlug: t['slug'].toString(),
        tenantStatus: t['status'].toString(),
        roleKey: r?['key']?.toString() ?? 'student',
        roleName: r?['name']?.toString() ?? 'Member',
      ));
    }
    state = state.copyWith(memberships: list);
  }

  Future<void> selectTenant(String tenantId) async {
    await _storage.write(key: _tenantKey, value: tenantId);
    state = state.copyWith(selectedTenantId: tenantId);
    await CampusPushService.syncDeviceToken(tenantId: tenantId);
  }

  void setThemeMode(ThemeMode mode) {
    state = state.copyWith(themeMode: mode);
  }

  Future<void> signOut() async {
    await _storage.delete(key: _tenantKey);
    if (CampusEnv.isSupabaseConfigured) {
      await Supabase.instance.client.auth.signOut();
    }
    state = const AuthAppState();
  }

  Future<void> _registerDeviceAndSession(User user, String? accessToken) async {
    String deviceName = 'Android Device';
    String deviceId = 'android-${user.id.substring(0, 8)}';
    try {
      final info = DeviceInfoPlugin();
      final android = await info.androidInfo;
      deviceName = '${android.manufacturer} ${android.model}';
      deviceId = android.id;
    } catch (_) {}

    final fcmToken = await CampusPushService.getFcmTokenIfReady();
    await Supabase.instance.client.from('device_registrations').upsert({
      'user_id': user.id,
      'device_id': deviceId,
      'platform': 'android',
      'device_name': deviceName,
      'app_version': '1.0.0',
      'fcm_token': fcmToken,
      'is_active': true,
      'last_seen_at': DateTime.now().toIso8601String(),
    }, onConflict: 'user_id,device_id');

    final tokenHash = accessToken != null && accessToken.length > 16
        ? accessToken.substring(accessToken.length - 16)
        : 'mobile-session';
    await Supabase.instance.client.from('user_sessions').insert({
      'user_id': user.id,
      'session_token_hash': tokenHash,
      'platform': 'android',
      'user_agent': deviceName,
    });
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthAppState>(
  (ref) => AuthController(),
);
