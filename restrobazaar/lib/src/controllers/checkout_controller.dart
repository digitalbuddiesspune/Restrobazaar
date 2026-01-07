import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/address.dart';
import '../models/cart_item.dart';
import '../models/order.dart';
import '../repositories/address_repository.dart';
import '../repositories/order_repository.dart';
import '../repositories/repository_providers.dart';

class CheckoutState {
  const CheckoutState({
    this.addresses = const [],
    this.selectedAddressId,
    this.loading = false,
    this.error,
    this.placingOrder = false,
    this.lastOrder,
  });

  final List<AddressModel> addresses;
  final String? selectedAddressId;
  final bool loading;
  final bool placingOrder;
  final String? error;
  final OrderModel? lastOrder;

  CheckoutState copyWith({
    List<AddressModel>? addresses,
    String? selectedAddressId,
    bool? loading,
    bool? placingOrder,
    String? error,
    OrderModel? lastOrder,
  }) {
    return CheckoutState(
      addresses: addresses ?? this.addresses,
      selectedAddressId: selectedAddressId ?? this.selectedAddressId,
      loading: loading ?? this.loading,
      placingOrder: placingOrder ?? this.placingOrder,
      error: error,
      lastOrder: lastOrder ?? this.lastOrder,
    );
  }
}

final checkoutControllerProvider =
    StateNotifierProvider<CheckoutController, CheckoutState>((ref) {
      return CheckoutController(ref);
    });

class CheckoutController extends StateNotifier<CheckoutState> {
  CheckoutController(this._ref) : super(const CheckoutState());

  final Ref _ref;

  AddressRepository get _addressRepository =>
      _ref.read(addressRepositoryProvider);
  OrderRepository get _orderRepository => _ref.read(orderRepositoryProvider);

  Future<void> loadAddresses() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final addresses = await _addressRepository.getAddresses();
      state = state.copyWith(
        addresses: addresses,
        loading: false,
        selectedAddressId:
            state.selectedAddressId ??
            (addresses.isNotEmpty ? addresses.first.id : null),
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  void selectAddress(String id) {
    state = state.copyWith(selectedAddressId: id);
  }

  Future<void> upsertAddress(
    AddressModel address, {
    bool isEdit = false,
  }) async {
    try {
      state = state.copyWith(loading: true, error: null);
      AddressModel? saved;
      if (isEdit) {
        saved = await _addressRepository.updateAddress(address);
      } else {
        saved = await _addressRepository.createAddress(address);
      }
      if (saved != null) {
        await loadAddresses();
        state = state.copyWith(selectedAddressId: saved.id);
      } else {
        state = state.copyWith(loading: false);
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> deleteAddress(String id) async {
    try {
      await _addressRepository.deleteAddress(id);
      final remaining = state.addresses
          .where((address) => address.id != id)
          .toList();
      state = state.copyWith(
        addresses: remaining,
        selectedAddressId: remaining.isNotEmpty ? remaining.first.id : null,
      );
    } catch (error) {
      state = state.copyWith(error: error.toString());
    }
  }

  Future<OrderModel?> placeOrder({
    required List<CartItem> cartItems,
    required double cartTotal,
    required double gstAmount,
    required double shippingCharges,
    required String paymentMethod,
    String? paymentId,
    String? transactionId,
  }) async {
    if (state.selectedAddressId == null) {
      state = state.copyWith(error: 'Please select an address');
      return null;
    }

    state = state.copyWith(placingOrder: true, error: null);

    try {
      final payload = {
        'addressId': state.selectedAddressId,
        'paymentMethod': paymentMethod,
        'cartItems': cartItems.map((item) => item.toJson()).toList(),
        'totalAmount': cartTotal + gstAmount + shippingCharges,
        'cartTotal': cartTotal,
        'gstAmount': gstAmount,
        'shippingCharges': shippingCharges,
        'paymentId': paymentId,
        'transactionId': transactionId,
      };

      final order = await _orderRepository.createOrder(payload);
      state = state.copyWith(placingOrder: false, lastOrder: order);
      return order;
    } catch (error) {
      state = state.copyWith(placingOrder: false, error: error.toString());
      return null;
    }
  }
}
