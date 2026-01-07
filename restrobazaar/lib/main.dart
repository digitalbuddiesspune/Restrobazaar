import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import 'src/app.dart';
import 'src/config/constants.dart';
import 'src/core/api_client.dart';
import 'src/core/local_storage.dart';
import 'src/core/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');

  final baseUrl =
      dotenv.env[apiBaseUrlKey] ??
      dotenv.env['API_BASE_URL'] ??
      'http://localhost:3003/api/v1';

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
