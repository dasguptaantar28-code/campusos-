import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/env.dart';

class CampusPushService {
  static bool _firebaseReady = false;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static bool get isFirebaseReady => _firebaseReady;

  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      _firebaseReady = true;

      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      await _localNotifications.initialize(const InitializationSettings(android: androidInit));

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);

      FirebaseMessaging.onMessage.listen((RemoteMessage msg) async {
        final notif = msg.notification;
        if (notif != null) {
          await _localNotifications.show(
            msg.hashCode,
            notif.title ?? 'CampusOS',
            notif.body ?? '',
            const NotificationDetails(
              android: AndroidNotificationDetails(
                'campusos_alerts',
                'CampusOS Notifications',
                importance: Importance.high,
                priority: Priority.high,
              ),
            ),
          );
        }
      });
    } catch (e) {
      // Safe fallback when google-services.json is not yet provisioned
      _firebaseReady = false;
      if (kDebugMode) {
        debugPrint('FCM skipped (google-services.json not configured): $e');
      }
    }
  }

  static Future<String?> getFcmTokenIfReady() async {
    if (!_firebaseReady) return null;
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  static Future<void> syncDeviceToken({String? tenantId}) async {
    if (!CampusEnv.isSupabaseConfigured) return;
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    final fcmToken = await getFcmTokenIfReady();
    await Supabase.instance.client.from('device_registrations').upsert({
      'user_id': user.id,
      'tenant_id': tenantId,
      'device_id': 'android-${user.id.substring(0, 8)}',
      'platform': 'android',
      'device_name': 'Android CampusOS Device',
      'app_version': '1.0.0',
      'fcm_token': fcmToken,
      'is_active': true,
      'last_seen_at': DateTime.now().toIso8601String(),
    }, onConflict: 'user_id,device_id');
  }
}
