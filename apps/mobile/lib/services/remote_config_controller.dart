import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/env.dart';
import '../models/remote_config.dart';

class RemoteConfigState {
  final EffectiveRemoteConfig config;
  final bool syncing;
  final String? lastError;
  final DateTime? lastSyncedAt;

  const RemoteConfigState({
    required this.config,
    this.syncing = false,
    this.lastError,
    this.lastSyncedAt,
  });

  RemoteConfigState copyWith({
    EffectiveRemoteConfig? config,
    bool? syncing,
    String? lastError,
    DateTime? lastSyncedAt,
  }) {
    return RemoteConfigState(
      config: config ?? this.config,
      syncing: syncing ?? this.syncing,
      lastError: lastError,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
    );
  }
}

class RemoteConfigController extends StateNotifier<RemoteConfigState> {
  RemoteConfigController() : super(RemoteConfigState(config: EffectiveRemoteConfig.fallback()));

  String? _activeTenantId;
  RealtimeChannel? _channel;
  StreamSubscription<List<ConnectivityResult>>? _connSub;
  StreamSubscription<AuthState>? _authSub;

  static const String _cachePrefix = 'campusos_mobile_remote_cfg_';

  Future<void> initialize({String? tenantId}) async {
    _activeTenantId = tenantId;
    await _loadFromCache(tenantId);
    await syncNow(tenantId: tenantId);
    _attachListeners();
  }

  Future<void> setActiveTenant(String? tenantId) async {
    _activeTenantId = tenantId;
    await _loadFromCache(tenantId);
    await syncNow(tenantId: tenantId);
    _resubscribeRealtime();
  }

  Future<void> _loadFromCache(String? tenantId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_cachePrefix${tenantId ?? 'global'}');
      if (raw != null && raw.isNotEmpty) {
        final decoded = (jsonDecode(raw) as Map).cast<String, dynamic>();
        state = state.copyWith(config: EffectiveRemoteConfig.fromJson(decoded));
      }
    } catch (_) {
      // Safe fallback remains active
    }
  }

  Future<void> syncNow({String? tenantId}) async {
    final targetTenant = tenantId ?? _activeTenantId;
    if (!CampusEnv.isSupabaseConfigured) return;

    state = state.copyWith(syncing: true, lastError: null);
    try {
      final client = Supabase.instance.client;
      final response = await client.rpc(
        'resolve_effective_config',
        params: {
          'p_tenant_id': targetTenant,
          'p_platform': 'mobile',
        },
      );

      if (response is Map) {
        final map = response.cast<String, dynamic>();
        final resolved = EffectiveRemoteConfig.fromJson(map);
        state = state.copyWith(
          config: resolved,
          syncing: false,
          lastSyncedAt: DateTime.now(),
        );

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('$_cachePrefix${targetTenant ?? 'global'}', jsonEncode(map));

        if (resolved.sessionRevoked) {
          await client.auth.signOut();
        }
      } else {
        state = state.copyWith(syncing: false);
      }
    } catch (e) {
      state = state.copyWith(syncing: false, lastError: e.toString());
    }
  }

  void _attachListeners() {
    if (!CampusEnv.isSupabaseConfigured) return;

    _connSub?.cancel();
    _connSub = Connectivity().onConnectivityChanged.listen((results) {
      if (results.any((r) => r != ConnectivityResult.none)) {
        unawaited(syncNow());
      }
    });

    _authSub?.cancel();
    _authSub = Supabase.instance.client.auth.onAuthStateChange.listen((event) {
      if (event.event == AuthChangeEvent.signedIn || event.event == AuthChangeEvent.tokenRefreshed) {
        unawaited(syncNow());
      }
    });

    _resubscribeRealtime();
  }

  void _resubscribeRealtime() {
    if (!CampusEnv.isSupabaseConfigured) return;
    final client = Supabase.instance.client;
    if (_channel != null) {
      unawaited(client.removeChannel(_channel!));
    }

    const tables = [
      'global_config',
      'app_config',
      'configuration_versions',
      'modules',
      'tenant_features',
      'navigation_items',
      'dashboard_widgets',
      'tenants',
      'user_sessions',
    ];

    var ch = client.channel('campusos-mobile-cfg-${_activeTenantId ?? 'global'}');
    for (final tbl in tables) {
      ch = ch.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: tbl,
        callback: (_) {
          if (kDebugMode) {
            debugPrint('CampusOS Realtime config trigger on $tbl');
          }
          unawaited(syncNow());
        },
      );
    }
    _channel = ch..subscribe();
  }

  @override
  void dispose() {
    _connSub?.cancel();
    _authSub?.cancel();
    if (_channel != null && CampusEnv.isSupabaseConfigured) {
      unawaited(Supabase.instance.client.removeChannel(_channel!));
    }
    super.dispose();
  }
}

final remoteConfigProvider = StateNotifierProvider<RemoteConfigController, RemoteConfigState>(
  (ref) => RemoteConfigController(),
);
