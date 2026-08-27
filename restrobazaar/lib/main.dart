import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:media_store_plus/media_store_plus.dart';

import 'src/app.dart';
import 'src/config/constants.dart';
import 'src/core/api_client.dart';
import 'src/core/local_storage.dart';
import 'src/core/notifications/notification_service.dart';
import 'src/core/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // isOptional: empty/missing .env must not block app startup (native splash hang).
  await dotenv.load(fileName: '.env', isOptional: true);

  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    await MediaStore.ensureInitialized();
    MediaStore.appFolder = 'RestroBazaar';
  }

  final enableNotifications =
      !(defaultTargetPlatform == TargetPlatform.iOS || kIsWeb);
  if (enableNotifications) {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }
  await NotificationService.instance.init(enable: enableNotifications);

  final baseUrl =
      dotenv.env[apiBaseUrlKey] ??
      dotenv.env['API_BASE_URL'] ??
      'https://api.restrobazaar.in/api/v1';

  final appDir = await getApplicationDocumentsDirectory();
  final cookieJar = PersistCookieJar(
    storage: FileStorage('${appDir.path}/restro_cookies'),
  );

  final apiClient = ApiClient(baseUrl: baseUrl, cookieJar: cookieJar);
  final storage = LocalStorage();
  await storage.init();

  runApp(
    ProviderScope(
      overrides: [
        apiClientProvider.overrideWithValue(apiClient),
        localStorageProvider.overrideWithValue(storage),
        baseUrlProvider.overrideWithValue(baseUrl),
      ],
      child: const RestroApp(),
    ),
  );
}
