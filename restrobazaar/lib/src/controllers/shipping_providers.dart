import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/cart_controller.dart';
import '../core/shipping.dart';
import '../repositories/repository_providers.dart';

/// Shipping settings for the primary vendor in the cart.
final cartShippingSettingsProvider =
    FutureProvider.autoDispose<ShippingSettings>((ref) async {
  final items = ref.watch(cartControllerProvider).items;
  if (items.isEmpty) return ShippingSettings.defaults;
  final vendorId = items.first.vendorId;
  if (vendorId.isEmpty) return ShippingSettings.defaults;
  return ref.read(vendorRepositoryProvider).getShippingSettings(vendorId);
});
