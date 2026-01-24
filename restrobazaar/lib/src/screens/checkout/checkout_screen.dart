import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../controllers/auth_controller.dart';
import '../../controllers/cart_controller.dart';
import '../../controllers/checkout_controller.dart';
import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/shipping.dart';
import '../../models/address.dart';
import '../../models/cart_item.dart';
import '../../models/coupon.dart';
import '../../repositories/repository_providers.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String _paymentMethod = 'cod';
  static const _merchantVpa = '9545235223@kotak';
  static const _merchantName = 'RestroBazaar';
  final TextEditingController _couponController = TextEditingController();
  List<CouponModel> _availableCoupons = [];
  bool _showCoupons = false;
  bool _loadingCoupons = false;
  bool _applyingCoupon = false;
  CouponValidationResult? _appliedCoupon;
  String? _couponError;
  double _couponDiscount = 0;
  double _lastCartTotal = -1;
  String? _lastVendorKey;
  bool _pendingCouponRefresh = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(checkoutControllerProvider.notifier).loadAddresses();
      _refreshCoupons(ref.read(cartControllerProvider));
    });
  }

  String? _singleVendorId(List<CartItem> items) {
    if (items.isEmpty) return null;
    final first = items.first.vendorId;
    if (first.isEmpty) return null;
    final sameVendor = items.every((item) => item.vendorId == first);
    return sameVendor ? first : null;
  }

  String? _vendorKey(CartState cartState) {
    if (cartState.items.isEmpty) return null;
    return _singleVendorId(cartState.items) ?? 'multiple';
  }

  void _scheduleCouponRefresh(CartState cartState) {
    final vendorKey = _vendorKey(cartState);
    if (_lastCartTotal == cartState.subtotal && _lastVendorKey == vendorKey) {
      return;
    }

    _lastCartTotal = cartState.subtotal;
    _lastVendorKey = vendorKey;

    if (_pendingCouponRefresh) return;
    _pendingCouponRefresh = true;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _refreshCoupons(cartState, clearApplied: true);
      _pendingCouponRefresh = false;
    });
  }

  String _couponErrorMessage(Object error) {
    if (error is ApiException) return error.message;
    return error.toString();
  }

  Future<void> _refreshCoupons(
    CartState cartState, {
    bool clearApplied = false,
  }) async {
    if (!mounted) return;
    setState(() {
      _loadingCoupons = true;
      _couponError = null;
      if (clearApplied) {
        _appliedCoupon = null;
        _couponDiscount = 0;
      }
    });

    if (cartState.items.isEmpty) {
      if (!mounted) return;
      setState(() {
        _availableCoupons = [];
        _loadingCoupons = false;
      });
      return;
    }

    final repo = ref.read(couponRepositoryProvider);
    try {
      final coupons = await repo.getAvailableCoupons(
        vendorId: _singleVendorId(cartState.items),
        cartTotal: cartState.subtotal,
        cartItems: cartState.items,
      );
      if (!mounted) return;
      setState(() {
        _availableCoupons = coupons;
        _loadingCoupons = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _availableCoupons = [];
        _loadingCoupons = false;
        _couponError = _couponErrorMessage(error);
      });
    }
  }

  Future<void> _applyCoupon(
    CartState cartState, {
    String? overrideCode,
  }) async {
    final code = (overrideCode ?? _couponController.text).trim().toUpperCase();
    if (code.isEmpty) {
      setState(() {
        _couponError = 'Please enter a coupon code';
      });
      return;
    }

    setState(() {
      _applyingCoupon = true;
      _couponError = null;
    });

    final repo = ref.read(couponRepositoryProvider);
    try {
      final result = await repo.validateCoupon(
        code: code,
        cartTotal: cartState.subtotal,
        vendorId: _singleVendorId(cartState.items),
        cartItems: cartState.items,
      );
      if (!mounted) return;
      setState(() {
        _appliedCoupon = result;
        _couponDiscount = result.discount;
        _couponController.text = '';
        _applyingCoupon = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _appliedCoupon = null;
        _couponDiscount = 0;
        _couponError = _couponErrorMessage(error);
        _applyingCoupon = false;
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _couponDiscount = 0;
      _couponError = null;
    });
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final cartState = ref.watch(cartControllerProvider);
    final checkoutState = ref.watch(checkoutControllerProvider);
    final checkoutNotifier = ref.read(checkoutControllerProvider.notifier);

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: Container(
          width: double.infinity,
          color: Colors.grey.shade50,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Please sign in to continue',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.push('/signin'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFdc2626),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Sign in'),
              ),
            ],
          ),
        ),
      );
    }

    if (cartState.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: Container(
          color: Colors.grey.shade50,
          alignment: Alignment.center,
          child: const Text(
            'Add items to cart to continue',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      );
    }

    _scheduleCouponRefresh(cartState);

    final gstBreakdown = cartState.items
        .map((item) {
          final itemTotal =
              item.unitPriceForQuantity(item.quantity) * item.quantity;
          final gstPercentage = item.gstPercentage;
          final gstAmount = (itemTotal * gstPercentage) / 100;
          return gstAmount;
        })
        .fold<double>(0, (sum, value) => sum + value);
    final gst = double.parse(gstBreakdown.toStringAsFixed(2));
    final shipping = calculateShippingCharges(cartState.subtotal);
    final totalBeforeCoupon = cartState.subtotal + gst + shipping;
    final discountedTotal = totalBeforeCoupon - _couponDiscount;
    final double totalAmount =
        (discountedTotal < 0 ? 0 : discountedTotal).toDouble();
    final upiData =
        _paymentMethod == 'online' ? _buildUpiData(totalAmount) : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Container(
        color: Colors.grey.shade50,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ProgressSteps(showPayment: _paymentMethod.isNotEmpty),
            const SizedBox(height: 12),
            _AddressCard(
              checkoutState: checkoutState,
              onAdd: () => _showAddressForm(context),
              onEdit: (address) => _showAddressForm(context, address: address),
              onDelete: checkoutNotifier.deleteAddress,
              onSelect: checkoutNotifier.selectAddress,
            ),
            const SizedBox(height: 12),
            _PaymentSection(
              selected: _paymentMethod,
              onSelect: (method) => setState(() => _paymentMethod = method),
              upiData: upiData,
            ),
            const SizedBox(height: 12),
            _CouponSection(
              coupons: _availableCoupons,
              showCoupons: _showCoupons,
              loading: _loadingCoupons,
              applying: _applyingCoupon,
              controller: _couponController,
              appliedCoupon: _appliedCoupon,
              couponError: _couponError,
              onToggleCoupons: () {
                setState(() => _showCoupons = !_showCoupons);
              },
              onApply: () => _applyCoupon(cartState),
              onRemove: _removeCoupon,
              onCodeChanged: (value) {
                setState(() => _couponError = null);
              },
              onSelectCoupon: (coupon) {
                _couponController.text = coupon.code;
                _applyCoupon(cartState, overrideCode: coupon.code);
              },
            ),
            const SizedBox(height: 12),
            _SummaryCard(
              cartState: cartState,
              gst: gst,
              shipping: shipping,
              totalAmount: totalAmount,
              couponCode: _appliedCoupon?.code,
              couponDiscount: _couponDiscount,
              placingOrder: checkoutState.placingOrder,
              error: checkoutState.error,
              onPlaceOrder: () async {
                final order = await checkoutNotifier.placeOrder(
                  cartItems: cartState.items,
                  cartTotal: cartState.subtotal,
                  gstAmount: gst,
                  shippingCharges: shipping,
                  totalAmount: totalAmount,
                  couponCode: _appliedCoupon?.code,
                  paymentMethod: _paymentMethod,
                );
                if (!mounted) return;
                if (order != null) {
                  await ref.read(cartControllerProvider.notifier).clear();
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Order placed!')),
                  );
                  context.go('/orders');
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showAddressForm(
    BuildContext context, {
    AddressModel? address,
  }) async {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: address?.name ?? '');
    final phoneController = TextEditingController(text: address?.phone ?? '');
    final line1Controller = TextEditingController(
      text: address?.addressLine1 ?? '',
    );
    final line2Controller = TextEditingController(
      text: address?.addressLine2 ?? '',
    );
    final cityController = TextEditingController(text: address?.city ?? '');
    final stateController = TextEditingController(text: address?.state ?? '');
    final pincodeController = TextEditingController(
      text: address?.pincode ?? '',
    );
    final landmarkController = TextEditingController(
      text: address?.landmark ?? '',
    );
    String addressType = address?.addressType ?? 'home';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return SafeArea(
          top: false,
          bottom: false,
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
                left: 16,
                right: 16,
                top: 18,
              ),
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            address == null ? 'Add address' : 'Edit address',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _AddressField(
                        controller: nameController,
                        label: 'Name',
                        keyboardType: TextInputType.name,
                        validator: (value) =>
                            value == null || value.isEmpty ? 'Required' : null,
                      ),
                      _AddressField(
                        controller: phoneController,
                        label: 'Phone',
                        keyboardType: TextInputType.phone,
                        validator: (value) =>
                            value == null || value.isEmpty ? 'Required' : null,
                      ),
                      _AddressField(
                        controller: line1Controller,
                        label: 'Address line 1',
                        validator: (value) =>
                            value == null || value.isEmpty ? 'Required' : null,
                      ),
                      _AddressField(
                        controller: line2Controller,
                        label: 'Address line 2',
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _AddressField(
                              controller: cityController,
                              label: 'City',
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _AddressField(
                              controller: stateController,
                              label: 'State',
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _AddressField(
                              controller: pincodeController,
                              label: 'Pincode',
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _AddressField(
                              controller: landmarkController,
                              label: 'Landmark',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 10,
                        children: ['home', 'work', 'other'].map((type) {
                          return ChoiceChip(
                            label: Text(type),
                            selected: addressType == type,
                            onSelected: (_) => setState(() => addressType = type),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            if (!formKey.currentState!.validate()) return;
                            final newAddress = AddressModel(
                              id: address?.id ?? '',
                              name: nameController.text,
                              phone: phoneController.text,
                              addressLine1: line1Controller.text,
                              addressLine2: line2Controller.text,
                              city: cityController.text,
                              state: stateController.text,
                              pincode: pincodeController.text,
                              landmark: landmarkController.text,
                              addressType: addressType,
                            );
                            await ref
                                .read(checkoutControllerProvider.notifier)
                                .upsertAddress(newAddress, isEdit: address != null);
                            if (!mounted) return;
                            Navigator.of(context).pop();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFdc2626),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Save address',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  _UpiData _buildUpiData(double totalAmount) {
    final orderId = 'ORDER_${DateTime.now().millisecondsSinceEpoch}';
    final note = 'Order $orderId - $_merchantName';
    final url =
        'upi://pay?pa=$_merchantVpa&pn=${Uri.encodeComponent(_merchantName)}&am=${totalAmount.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(note)}';
    return _UpiData(
      url: url,
      orderId: orderId,
      amount: totalAmount,
      vpa: _merchantVpa,
    );
  }
}

class _ProgressSteps extends StatelessWidget {
  const _ProgressSteps({required this.showPayment});

  final bool showPayment;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const _StepCircle(label: '1', title: 'MY BAG', active: true),
          const _StepLine(active: true),
          const _StepCircle(label: '2', title: 'ADDRESS', active: true),
          _StepLine(active: showPayment),
          _StepCircle(label: '3', title: 'PAYMENT', active: showPayment),
        ],
      ),
    );
  }
}

class _StepCircle extends StatelessWidget {
  const _StepCircle({required this.label, required this.title, required this.active});

  final String label;
  final String title;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 32,
          width: 32,
          decoration: BoxDecoration(
            color: active ? const Color(0xFFdc2626) : Colors.grey.shade300,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: active ? const Color(0xFFdc2626) : const Color(0xFF6b7280),
          ),
        ),
      ],
    );
  }
}

class _StepLine extends StatelessWidget {
  const _StepLine({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 2,
      margin: const EdgeInsets.symmetric(horizontal: 6),
      color: active ? const Color(0xFFdc2626) : Colors.grey.shade300,
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({
    required this.checkoutState,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
    required this.onSelect,
  });

  final CheckoutState checkoutState;
  final VoidCallback onAdd;
  final void Function(AddressModel address) onEdit;
  final void Function(String id) onDelete;
  final void Function(String id) onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Delivery To',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              TextButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add),
                label: const Text('Add address'),
              ),
            ],
          ),
          if (checkoutState.loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: CircularProgressIndicator(
                  color: Color(0xFFdc2626),
                ),
              ),
            )
          else if (checkoutState.addresses.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Text(
                'No addresses found. Add your first address.',
                style: TextStyle(color: Color(0xFF6b7280)),
              ),
            )
          else
            Column(
              children: checkoutState.addresses.map<Widget>((address) {
                final selected = checkoutState.selectedAddressId == address.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selected
                          ? const Color(0xFFdc2626)
                          : Colors.grey.shade200,
                      width: selected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Radio<String>(
                        value: address.id,
                        groupValue: checkoutState.selectedAddressId,
                        onChanged: (value) => onSelect(value ?? address.id),
                        activeColor: const Color(0xFFdc2626),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  address.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                  ),
                                ),
                                Text(
                                  address.addressType,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF6b7280),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${address.addressLine1}, ${address.addressLine2}',
                              style: const TextStyle(
                                color: Color(0xFF4b5563),
                              ),
                            ),
                            Text(
                              '${address.city}, ${address.state} ${address.pincode}',
                              style: const TextStyle(
                                color: Color(0xFF4b5563),
                              ),
                            ),
                            if (address.phone != null &&
                                address.phone!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'Phone: ${address.phone}',
                                  style: const TextStyle(
                                    color: Color(0xFF6b7280),
                                  ),
                                ),
                              ),
                            Row(
                              children: [
                                TextButton(
                                  onPressed: () => onEdit(address),
                                  child: const Text('Edit'),
                                ),
                                TextButton(
                                  onPressed: () => onDelete(address.id),
                                  child: const Text(
                                    'Delete',
                                    style: TextStyle(color: Color(0xFFdc2626)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
}

class _PaymentSection extends StatelessWidget {
  const _PaymentSection({
    required this.selected,
    required this.onSelect,
    this.upiData,
  });

  final String selected;
  final void Function(String method) onSelect;
  final _UpiData? upiData;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Payment Method',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          _PaymentTile(
            title: 'Cash on Delivery',
            subtitle: 'Pay when your order arrives',
            selected: selected == 'cod',
            onTap: () => onSelect('cod'),
          ),
          const SizedBox(height: 10),
          _PaymentTile(
            title: 'Online / UPI',
            subtitle: 'Pay securely via UPI',
            selected: selected == 'online',
            onTap: () => onSelect('online'),
          ),
          if (upiData != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Scan to pay',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Center(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(12),
                      child: QrImageView(
                        data: upiData!.url,
                        size: 200,
                        backgroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Amount: ${formatCurrency(upiData!.amount)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    'UPI ID: ${upiData!.vpa}',
                    style: const TextStyle(
                      color: Color(0xFF6b7280),
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    'Order: ${upiData!.orderId}',
                    style: const TextStyle(
                      color: Color(0xFF6b7280),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Use any UPI app to scan and pay. After payment, your order will be confirmed.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6b7280),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AddressField extends StatelessWidget {
  const _AddressField({
    required this.controller,
    required this.label,
    this.keyboardType,
    this.validator,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 14,
          ),
        ),
      ),
    );
  }
}

class _UpiData {
  const _UpiData({
    required this.url,
    required this.orderId,
    required this.amount,
    required this.vpa,
  });

  final String url;
  final String orderId;
  final double amount;
  final String vpa;
}

class _PaymentTile extends StatelessWidget {
  const _PaymentTile({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? const Color(0xFFdc2626) : Colors.grey.shade200,
            width: selected ? 2 : 1,
          ),
          color: selected ? const Color(0xFFfef2f2) : Colors.white,
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? const Color(0xFFdc2626) : Colors.grey.shade400,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF6b7280),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CouponSection extends StatelessWidget {
  const _CouponSection({
    required this.coupons,
    required this.showCoupons,
    required this.loading,
    required this.applying,
    required this.controller,
    required this.appliedCoupon,
    required this.couponError,
    required this.onToggleCoupons,
    required this.onApply,
    required this.onRemove,
    required this.onCodeChanged,
    required this.onSelectCoupon,
  });

  final List<CouponModel> coupons;
  final bool showCoupons;
  final bool loading;
  final bool applying;
  final TextEditingController controller;
  final CouponValidationResult? appliedCoupon;
  final String? couponError;
  final VoidCallback onToggleCoupons;
  final VoidCallback onApply;
  final VoidCallback onRemove;
  final ValueChanged<String> onCodeChanged;
  final ValueChanged<CouponModel> onSelectCoupon;

  String _couponSubtitle(CouponModel coupon) {
    final isPercentage = coupon.discountType == 'percentage';
    final valueLabel = isPercentage
        ? '${coupon.discountValue.toStringAsFixed(0)}% OFF'
        : '${formatCurrency(coupon.discountValue)} OFF';
    return '$valueLabel • Min. ${formatCurrency(coupon.minimumOrderAmount)}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Have a Coupon?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              if (loading)
                const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else if (coupons.isNotEmpty)
                TextButton(
                  onPressed: onToggleCoupons,
                  child: Text(
                    showCoupons
                        ? 'Hide Available (${coupons.length})'
                        : 'View Available (${coupons.length})',
                  ),
                ),
            ],
          ),
          if (showCoupons && coupons.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...coupons.map(
              (coupon) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => onSelectCoupon(coupon),
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                coupon.code,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                coupon.description?.isNotEmpty == true
                                    ? coupon.description!
                                    : _couponSubtitle(coupon),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF6b7280),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (coupon.estimatedDiscount != null)
                          Text(
                            'Save ${formatCurrency(coupon.estimatedDiscount!)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF16A34A),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
          if (appliedCoupon == null)
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      hintText: 'Enter coupon code',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    onChanged: onCodeChanged,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: applying ? null : onApply,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFdc2626),
                    foregroundColor: Colors.white,
                  ),
                  child: applying
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Apply'),
                ),
              ],
            )
          else
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${appliedCoupon!.code} Applied',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF166534),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'You saved ${formatCurrency(appliedCoupon!.discount)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF15803D),
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: onRemove,
                    child: const Text(
                      'Remove',
                      style: TextStyle(color: Color(0xFFdc2626)),
                    ),
                  ),
                ],
              ),
            ),
          if (couponError != null) ...[
            const SizedBox(height: 6),
            Text(
              couponError!,
              style: const TextStyle(
                color: Color(0xFFdc2626),
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.cartState,
    required this.gst,
    required this.shipping,
    required this.totalAmount,
    this.couponCode,
    this.couponDiscount = 0,
    required this.placingOrder,
    required this.error,
    required this.onPlaceOrder,
  });

  final CartState cartState;
  final double gst;
  final double shipping;
  final double totalAmount;
  final String? couponCode;
  final double couponDiscount;
  final bool placingOrder;
  final String? error;
  final VoidCallback onPlaceOrder;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Summary',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          _SummaryRow(
            label: 'Subtotal (${cartState.totalItems} items)',
            value: formatCurrency(cartState.subtotal),
          ),
          _SummaryRow(label: 'GST', value: formatCurrency(gst)),
          _SummaryRow(
            label: 'Shipping',
            value: shipping == 0 ? 'Free' : formatCurrency(shipping),
          ),
          if (couponDiscount > 0 && couponCode != null)
            _SummaryRow(
              label: 'Coupon Discount ($couponCode)',
              value: '-${formatCurrency(couponDiscount)}',
            ),
          const Divider(height: 18),
          _SummaryRow(
            label: 'Total',
            value: formatCurrency(totalAmount),
            isBold: true,
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: placingOrder ? null : onPlaceOrder,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFdc2626),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: placingOrder
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Place Order',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                error!,
                style: const TextStyle(color: Color(0xFFdc2626)),
              ),
            ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  final String label;
  final String value;
  final bool isBold;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(label, style: style),
          const Spacer(),
          Text(value, style: style),
        ],
      ),
    );
  }
}
