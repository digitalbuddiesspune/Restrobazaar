import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import '../repositories/repository_providers.dart';

final ordersProvider = FutureProvider<List<OrderModel>>((ref) async {
  final repo = ref.read(orderRepositoryProvider);
  return repo.getOrders();
});
