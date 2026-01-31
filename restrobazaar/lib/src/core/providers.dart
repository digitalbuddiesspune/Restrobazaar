import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';
import 'local_storage.dart';

final apiClientProvider = Provider<ApiClient>(
  (ref) => throw UnimplementedError('ApiClient has not been initialized'),
);

final localStorageProvider = Provider<LocalStorage>(
  (ref) => throw UnimplementedError('LocalStorage has not been initialized'),
);

final baseUrlProvider = Provider<String>(
  (ref) => throw UnimplementedError('Base URL has not been configured'),
);
