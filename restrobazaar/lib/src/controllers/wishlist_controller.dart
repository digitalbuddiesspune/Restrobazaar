import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/product.dart';
import '../repositories/repository_providers.dart';
import 'auth_controller.dart';

class WishlistState {
  const WishlistState({
    this.items = const [],
    this.loading = false,
    this.error,
  });

  final List<VendorProductModel> items;
  final bool loading;
  final String? error;

  bool contains(String productId) => items.any((item) => item.id == productId);

  WishlistState copyWith({
    List<VendorProductModel>? items,
    bool? loading,
    String? error,
  }) {
    return WishlistState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

final wishlistControllerProvider =
    StateNotifierProvider<WishlistController, WishlistState>((ref) {
      return WishlistController(ref);
    });

class WishlistController extends StateNotifier<WishlistState> {
  WishlistController(this._ref) : super(const WishlistState());

  final Ref _ref;

  Future<void> loadWishlist() async {
    final isLoggedIn = _ref.read(authControllerProvider).isAuthenticated;
    if (!isLoggedIn) {
      state = const WishlistState(items: []);
      return;
    }

    state = state.copyWith(loading: true, error: null);
    try {
      final repo = _ref.read(wishlistRepositoryProvider);
      final items = await repo.getWishlist();
      state = state.copyWith(items: items, loading: false);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> toggleWishlist(VendorProductModel product) async {
    final repo = _ref.read(wishlistRepositoryProvider);
    final isLoggedIn = _ref.read(authControllerProvider).isAuthenticated;
    if (!isLoggedIn) {
      state = state.copyWith(error: 'Please sign in to manage wishlist');
      return;
    }

    final exists = state.contains(product.id);
    try {
      if (exists) {
        await repo.removeFromWishlist(product.id);
        state = state.copyWith(
          items: state.items.where((item) => item.id != product.id).toList(),
          error: null,
        );
      } else {
        await repo.addToWishlist(product.id);
        state = state.copyWith(items: [...state.items, product], error: null);
      }
    } catch (error) {
      state = state.copyWith(error: error.toString());
    }
  }
}
