import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/constants.dart';
import '../core/local_storage.dart';
import '../core/providers.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartState {
  const CartState({this.items = const []});

  final List<CartItem> items;

  double get subtotal =>
      items.fold(0, (sum, item) => sum + (item.price * item.quantity));

  int get totalItems => items.fold(0, (count, item) => count + item.quantity);

  CartState copyWith({List<CartItem>? items}) {
    return CartState(items: items ?? this.items);
  }
}

final cartControllerProvider = StateNotifierProvider<CartController, CartState>(
  (ref) {
    return CartController(ref);
  },
);

class CartController extends StateNotifier<CartState> {
  CartController(this._ref) : super(const CartState());

  final Ref _ref;

  LocalStorage get _storage => _ref.read(localStorageProvider);

  Future<void> loadCart() async {
    final rawItems = _storage.getString(cartStorageKey);
    if (rawItems == null) return;
    try {
      final decoded = jsonDecode(rawItems);
      if (decoded is List) {
        final items = decoded
            .whereType<Map<String, dynamic>>()
            .map(CartItem.fromJson)
            .toList();
        state = state.copyWith(items: items);
      }
    } catch (_) {
      // Ignore parsing errors and start fresh
    }
  }

  Future<void> _persist() async {
    final payload = state.items.map((e) => e.toJson()).toList();
    await _storage.setString(cartStorageKey, jsonEncode(payload));
  }

  Future<void> addToCart(
    VendorProductModel product, {
    int quantity = 1,
    PriceSlab? selectedSlab,
  }) async {
    final minQty = product.minimumOrderQuantity ?? 1;
    final normalizedMinQty = minQty > 0 ? minQty : 1;
    var addQuantity = quantity <= 0 ? normalizedMinQty : quantity;

    final baseItem = CartItem.fromVendorProduct(
      product,
      quantity: 1,
      selectedSlab: selectedSlab,
    );
    final updated = [...state.items];
    final existingIndex = updated.indexWhere((item) => item.id == baseItem.id);
    if (existingIndex >= 0) {
      final existing = updated[existingIndex];
      updated[existingIndex] = existing.copyWith(
        quantity: existing.quantity + addQuantity,
      );
    } else {
      if (addQuantity < normalizedMinQty) {
        addQuantity = normalizedMinQty;
      }
      updated.add(baseItem.copyWith(quantity: addQuantity));
    }
    state = state.copyWith(items: updated);
    await _persist();
  }

  Future<void> removeItem(String id) async {
    final updated = state.items.where((item) => item.id != id).toList();
    state = state.copyWith(items: updated);
    await _persist();
  }

  Future<void> updateQuantity(String id, int quantity) async {
    final updated = <CartItem>[];
    for (final item in state.items) {
      if (item.id == id) {
        if (quantity > 0) {
          updated.add(item.copyWith(quantity: quantity));
        }
      } else {
        updated.add(item);
      }
    }
    state = state.copyWith(items: updated);
    await _persist();
  }

  Future<void> clear() async {
    state = const CartState(items: []);
    await _storage.remove(cartStorageKey);
  }
}
