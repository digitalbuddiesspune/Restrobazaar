import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../controllers/cart_controller.dart';
import '../../controllers/checkout_controller.dart';
import '../../core/formatters.dart';
import '../../models/address.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String _paymentMethod = 'cod';

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(checkoutControllerProvider.notifier).loadAddresses();
    });
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
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Please sign in to continue'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.push('/signin'),
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
        body: const Center(child: Text('Add items to cart to continue')),
      );
    }

    final gst = cartState.subtotal * 0.18;
    final shipping = cartState.subtotal > 1000 ? 0.0 : 50.0;

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Delivery address',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                TextButton(
                  onPressed: () => _showAddressForm(context),
                  child: const Text('Add new'),
                ),
              ],
            ),
            if (checkoutState.loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 10),
                child: CircularProgressIndicator(),
              ),
            if (checkoutState.addresses.isNotEmpty)
              Column(
                children: checkoutState.addresses.map((address) {
                  return RadioListTile<String>(
                    value: address.id,
                    groupValue: checkoutState.selectedAddressId,
                    onChanged: (value) =>
                        checkoutNotifier.selectAddress(value!),
                    title: Text(address.name),
                    subtitle: Text(
                      '${address.addressLine1}, ${address.city ?? ''} ${address.pincode ?? ''}',
                    ),
                    secondary: IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () =>
                          _showAddressForm(context, address: address),
                    ),
                  );
                }).toList(),
              ),
            if (checkoutState.addresses.isEmpty && !checkoutState.loading)
              const Text('No saved addresses'),
            const SizedBox(height: 16),
            const Text(
              'Payment method',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            RadioListTile<String>(
              value: 'cod',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value!),
              title: const Text('Cash on delivery'),
            ),
            RadioListTile<String>(
              value: 'online',
              groupValue: _paymentMethod,
              onChanged: (value) => setState(() => _paymentMethod = value!),
              title: const Text('Online / UPI'),
            ),
            const SizedBox(height: 16),
            const Text(
              'Order summary',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 8),
            _SummaryRow(
              label: 'Subtotal',
              value: formatCurrency(cartState.subtotal),
            ),
            _SummaryRow(label: 'GST (18%)', value: formatCurrency(gst)),
            _SummaryRow(
              label: 'Shipping',
              value: shipping == 0 ? 'Free' : formatCurrency(shipping),
            ),
            const Divider(),
            _SummaryRow(
              label: 'Total',
              value: formatCurrency(cartState.subtotal + gst + shipping),
              isBold: true,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: checkoutState.placingOrder
                    ? null
                    : () async {
                        final order = await checkoutNotifier.placeOrder(
                          cartItems: cartState.items,
                          cartTotal: cartState.subtotal,
                          gstAmount: gst,
                          shippingCharges: shipping,
                          paymentMethod: _paymentMethod,
                        );
                        if (!context.mounted) return;
                        if (order != null) {
                          await ref
                              .read(cartControllerProvider.notifier)
                              .clear();
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Order placed!')),
                          );
                          context.go('/orders');
                        }
                      },
                child: checkoutState.placingOrder
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Place order'),
              ),
            ),
            if (checkoutState.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  checkoutState.error!,
                  style: const TextStyle(color: Colors.red),
                ),
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
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    address == null ? 'Add address' : 'Edit address',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Name'),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  TextFormField(
                    controller: phoneController,
                    decoration: const InputDecoration(labelText: 'Phone'),
                    keyboardType: TextInputType.phone,
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  TextFormField(
                    controller: line1Controller,
                    decoration: const InputDecoration(
                      labelText: 'Address line 1',
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                  TextFormField(
                    controller: line2Controller,
                    decoration: const InputDecoration(
                      labelText: 'Address line 2',
                    ),
                  ),
                  TextFormField(
                    controller: cityController,
                    decoration: const InputDecoration(labelText: 'City'),
                  ),
                  TextFormField(
                    controller: stateController,
                    decoration: const InputDecoration(labelText: 'State'),
                  ),
                  TextFormField(
                    controller: pincodeController,
                    decoration: const InputDecoration(labelText: 'Pincode'),
                    keyboardType: TextInputType.number,
                  ),
                  TextFormField(
                    controller: landmarkController,
                    decoration: const InputDecoration(labelText: 'Landmark'),
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
                  const SizedBox(height: 14),
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
                        if (!context.mounted) return;
                        Navigator.of(context).pop();
                      },
                      child: const Text('Save address'),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        );
      },
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
