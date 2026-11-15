class RemoteModuleConfig {
  final String key;
  final String name;
  final String icon;
  final String defaultRoute;
  final int navOrder;
  final bool enabled;

  const RemoteModuleConfig({
    required this.key,
    required this.name,
    required this.icon,
    required this.defaultRoute,
    required this.navOrder,
    required this.enabled,
  });

  factory RemoteModuleConfig.fromJson(Map<String, dynamic> json) {
    return RemoteModuleConfig(
      key: json['key']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'LayoutGrid',
      defaultRoute: json['default_route']?.toString() ?? '',
      navOrder: (json['nav_order'] as num?)?.toInt() ?? 100,
      enabled: json['enabled'] == true,
    );
  }
}

class RemoteNavItem {
  final String id;
  final String moduleKey;
  final String label;
  final String icon;
  final String routePath;
  final String targetType;
  final Map<String, dynamic> payloadJson;
  final int sortOrder;
  final bool isCustom;

  const RemoteNavItem({
    required this.id,
    required this.moduleKey,
    required this.label,
    required this.icon,
    required this.routePath,
    required this.targetType,
    required this.payloadJson,
    required this.sortOrder,
    required this.isCustom,
  });

  factory RemoteNavItem.fromJson(Map<String, dynamic> json) {
    return RemoteNavItem(
      id: json['id']?.toString() ?? '',
      moduleKey: json['module_key']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'CircleDot',
      routePath: json['route_path']?.toString() ?? '',
      targetType: json['target_type']?.toString() ?? 'native',
      payloadJson: (json['payload_json'] as Map?)?.cast<String, dynamic>() ?? const {},
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 100,
      isCustom: json['is_custom'] == true,
    );
  }
}

class RemoteWidgetConfig {
  final String id;
  final String widgetKey;
  final String moduleKey;
  final String title;
  final String widgetType;
  final int sortOrder;

  const RemoteWidgetConfig({
    required this.id,
    required this.widgetKey,
    required this.moduleKey,
    required this.title,
    required this.widgetType,
    required this.sortOrder,
  });

  factory RemoteWidgetConfig.fromJson(Map<String, dynamic> json) {
    return RemoteWidgetConfig(
      id: json['id']?.toString() ?? '',
      widgetKey: json['widget_key']?.toString() ?? '',
      moduleKey: json['module_key']?.toString() ?? 'overview',
      title: json['title']?.toString() ?? '',
      widgetType: json['widget_type']?.toString() ?? 'kpi',
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 100,
    );
  }
}

class EffectiveRemoteConfig {
  final bool authorized;
  final int version;
  final bool maintenanceMode;
  final String maintenanceMessage;
  final bool sessionRevoked;
  final bool isPlatformAdmin;
  final String? tenantStatus;
  final String? error;
  final String? tenantId;
  final String? tenantName;
  final String role;
  final List<String> permissions;
  final String primaryHex;
  final String emeraldHex;
  final String brandName;
  final String tagline;
  final List<RemoteModuleConfig> modules;
  final List<RemoteNavItem> navigation;
  final List<RemoteWidgetConfig> widgets;
  final Map<String, dynamic> rawJson;

  const EffectiveRemoteConfig({
    required this.authorized,
    required this.version,
    required this.maintenanceMode,
    required this.maintenanceMessage,
    required this.sessionRevoked,
    required this.isPlatformAdmin,
    this.tenantStatus,
    this.error,
    this.tenantId,
    this.tenantName,
    required this.role,
    required this.permissions,
    required this.primaryHex,
    required this.emeraldHex,
    required this.brandName,
    required this.tagline,
    required this.modules,
    required this.navigation,
    required this.widgets,
    required this.rawJson,
  });

  static EffectiveRemoteConfig fallback() {
    return const EffectiveRemoteConfig(
      authorized: true,
      version: 1,
      maintenanceMode: false,
      maintenanceMessage: 'CampusOS is undergoing scheduled maintenance.',
      sessionRevoked: false,
      isPlatformAdmin: false,
      role: 'guest',
      permissions: [],
      primaryHex: '#16A34A',
      emeraldHex: '#22C55E',
      brandName: 'CampusOS',
      tagline: 'One Platform. Every Campus.',
      modules: [
        RemoteModuleConfig(key: 'overview', name: 'Overview', icon: 'LayoutDashboard', defaultRoute: '', navOrder: 10, enabled: true),
        RemoteModuleConfig(key: 'attendance', name: 'Attendance', icon: 'CalendarCheck2', defaultRoute: '/attendance', navOrder: 20, enabled: true),
        RemoteModuleConfig(key: 'exams', name: 'Examinations', icon: 'ClipboardList', defaultRoute: '/exams', navOrder: 30, enabled: true),
        RemoteModuleConfig(key: 'results', name: 'Results', icon: 'Award', defaultRoute: '/results', navOrder: 40, enabled: true),
        RemoteModuleConfig(key: 'fees', name: 'Fees', icon: 'CreditCard', defaultRoute: '/fees', navOrder: 50, enabled: true),
        RemoteModuleConfig(key: 'homework', name: 'Homework', icon: 'NotebookPen', defaultRoute: '/homework', navOrder: 60, enabled: true),
        RemoteModuleConfig(key: 'timetable', name: 'Timetable', icon: 'Clock', defaultRoute: '/timetable', navOrder: 70, enabled: true),
        RemoteModuleConfig(key: 'notices', name: 'Notifications', icon: 'Bell', defaultRoute: '/notifications', navOrder: 80, enabled: true),
        RemoteModuleConfig(key: 'settings', name: 'Settings', icon: 'Settings', defaultRoute: '/settings', navOrder: 90, enabled: true),
      ],
      navigation: [
        RemoteNavItem(id: 'nav-overview', moduleKey: 'overview', label: 'Home', icon: 'LayoutDashboard', routePath: '', targetType: 'native', payloadJson: {}, sortOrder: 10, isCustom: false),
        RemoteNavItem(id: 'nav-attendance', moduleKey: 'attendance', label: 'Attendance', icon: 'CalendarCheck2', routePath: '/attendance', targetType: 'native', payloadJson: {}, sortOrder: 20, isCustom: false),
        RemoteNavItem(id: 'nav-results', moduleKey: 'results', label: 'Results', icon: 'Award', routePath: '/results', targetType: 'native', payloadJson: {}, sortOrder: 30, isCustom: false),
        RemoteNavItem(id: 'nav-fees', moduleKey: 'fees', label: 'Fees', icon: 'CreditCard', routePath: '/fees', targetType: 'native', payloadJson: {}, sortOrder: 40, isCustom: false),
        RemoteNavItem(id: 'nav-homework', moduleKey: 'homework', label: 'Homework', icon: 'NotebookPen', routePath: '/homework', targetType: 'native', payloadJson: {}, sortOrder: 50, isCustom: false),
        RemoteNavItem(id: 'nav-timetable', moduleKey: 'timetable', label: 'Timetable', icon: 'Clock', routePath: '/timetable', targetType: 'native', payloadJson: {}, sortOrder: 60, isCustom: false),
      ],
      widgets: [],
      rawJson: {},
    );
  }

  factory EffectiveRemoteConfig.fromJson(Map<String, dynamic> json) {
    final theme = (json['theme'] as Map?)?.cast<String, dynamic>() ?? const {};
    final branding = (json['branding'] as Map?)?.cast<String, dynamic>() ?? const {};
    final tenant = (json['tenant'] as Map?)?.cast<String, dynamic>();

    return EffectiveRemoteConfig(
      authorized: json['authorized'] != false,
      version: (json['version'] as num?)?.toInt() ?? 1,
      maintenanceMode: json['maintenance_mode'] == true,
      maintenanceMessage: json['maintenance_message']?.toString() ?? 'CampusOS is undergoing scheduled maintenance.',
      sessionRevoked: json['session_revoked'] == true,
      isPlatformAdmin: json['is_platform_admin'] == true,
      tenantStatus: json['tenant_status']?.toString() ?? tenant?['status']?.toString(),
      error: json['error']?.toString(),
      tenantId: tenant?['id']?.toString(),
      tenantName: branding['institutionName']?.toString() ?? tenant?['name']?.toString(),
      role: json['role']?.toString() ?? 'guest',
      permissions: ((json['permissions'] as List?) ?? const []).map((e) => e.toString()).toList(),
      primaryHex: theme['primary']?.toString() ?? '#16A34A',
      emeraldHex: theme['emerald']?.toString() ?? '#22C55E',
      brandName: branding['brandName']?.toString() ?? 'CampusOS',
      tagline: branding['tagline']?.toString() ?? 'One Platform. Every Campus.',
      modules: ((json['modules'] as List?) ?? const [])
          .whereType<Map>()
          .map((m) => RemoteModuleConfig.fromJson(m.cast<String, dynamic>()))
          .toList(),
      navigation: ((json['navigation'] as List?) ?? const [])
          .whereType<Map>()
          .map((n) => RemoteNavItem.fromJson(n.cast<String, dynamic>()))
          .toList(),
      widgets: ((json['widgets'] as List?) ?? const [])
          .whereType<Map>()
          .map((w) => RemoteWidgetConfig.fromJson(w.cast<String, dynamic>()))
          .toList(),
      rawJson: json,
    );
  }

  bool isModuleEnabled(String key) {
    if (isPlatformAdmin) return true;
    if (!authorized || maintenanceMode) return false;
    final idx = modules.indexWhere((m) => m.key == key);
    if (idx == -1) return false;
    return modules[idx].enabled;
  }
}
