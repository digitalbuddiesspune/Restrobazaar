import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  NotificationService._();

  static final NotificationService instance = NotificationService._();

  FirebaseMessaging? _messaging;
  FlutterLocalNotificationsPlugin? _localNotifications;

  bool _initialized = false;
  bool _enabled = true;
  StreamSubscription<String>? _tokenRefreshSub;

  Future<void> init({bool enable = true}) async {
    if (_initialized) return;
    _enabled = enable;
    if (!_enabled) {
      _initialized = true;
      return;
    }
    await Firebase.initializeApp();
    _messaging = FirebaseMessaging.instance;
    _localNotifications = FlutterLocalNotificationsPlugin();
    await _initLocalNotifications();
    await _configureFirebaseListeners();
    _initialized = true;
  }

  Future<void> _initLocalNotifications() async {
    if (!_enabled) return;
    final local = _localNotifications;
    if (local == null) return;
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await local.initialize(initSettings);

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      const channel = AndroidNotificationChannel(
        'restrobazaar_default',
        'RestroBazaar Alerts',
        description: 'Order updates and account alerts.',
        importance: Importance.high,
      );
      await local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  Future<void> _configureFirebaseListeners() async {
    if (!_enabled) return;
    await _messaging?.setForegroundNotificationPresentationOptions(
      alert: false,
      badge: false,
      sound: false,
    );

    FirebaseMessaging.onMessage.listen((message) {
      _showLocalNotificationFromMessage(message);
    });
  }

  Future<NotificationSettings> requestPermissions() async {
    if (!_enabled || _messaging == null) {
      const setting = AppleNotificationSetting.notSupported;
      const preview = AppleShowPreviewSetting.notSupported;
      return const NotificationSettings(
        alert: setting,
        announcement: setting,
        authorizationStatus: AuthorizationStatus.notDetermined,
        badge: setting,
        carPlay: setting,
        lockScreen: setting,
        notificationCenter: setting,
        showPreviews: preview,
        timeSensitive: setting,
        criticalAlert: setting,
        sound: setting,
        providesAppNotificationSettings: setting,
      );
    }
    return _messaging!.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<void> bindTokenRegistration(
    Future<void> Function(String token, String platform) onToken,
  ) async {
    await init();
    if (!_enabled) return;
    await requestPermissions();

    final token = await _messaging?.getToken();
    if (token != null && token.isNotEmpty) {
      await onToken(token, _platformLabel());
    }

    await _tokenRefreshSub?.cancel();
    _tokenRefreshSub = _messaging?.onTokenRefresh.listen((token) {
      if (token.isNotEmpty) {
        onToken(token, _platformLabel());
      }
    });
  }

  Future<void> unbindTokenRegistration() async {
    await _tokenRefreshSub?.cancel();
    _tokenRefreshSub = null;
  }

  Future<String?> getToken() async {
    if (!_enabled) return null;
    return _messaging?.getToken();
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    Map<String, String>? payload,
  }) async {
    if (!_enabled) return;
    final id = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    await _localNotifications?.show(
      id,
      title,
      body,
      _defaultNotificationDetails(),
      payload: payload?.toString(),
    );
  }

  Future<void> _showLocalNotificationFromMessage(RemoteMessage message) async {
    final title = message.notification?.title ?? 'RestroBazaar';
    final body = message.notification?.body ?? 'You have a new update.';
    await showLocalNotification(
      title: title,
      body: body,
      payload: message.data.map((key, value) => MapEntry(key, '$value')),
    );
  }

  NotificationDetails _defaultNotificationDetails() {
    const androidDetails = AndroidNotificationDetails(
      'restrobazaar_default',
      'RestroBazaar Alerts',
      channelDescription: 'Order updates and account alerts.',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails();
    return const NotificationDetails(android: androidDetails, iOS: iosDetails);
  }

  String _platformLabel() {
    if (kIsWeb) return 'web';
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'ios';
    if (defaultTargetPlatform == TargetPlatform.android) return 'android';
    return 'unknown';
  }
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}
