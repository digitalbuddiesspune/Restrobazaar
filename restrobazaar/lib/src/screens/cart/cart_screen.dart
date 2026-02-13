import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/cart_controller.dart';
import '../../controllers/city_controller.dart';
import '../../core/formatters.dart';
import '../../core/shipping.dart';
import '../../widgets/categories_nav_bar.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartControllerProvider);
    final cartNotifier = ref.read(cartControllerProvider.notifier);
    final cityState = ref.watch(cityControllerProvider);
    final selectedCity = cityState.selected?.displayName ?? 'Select city';

    if (cartState.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Cart'),
          bottom: const CategoriesNavBar(),
        ),
        body: Container(
          width: double.infinity,
          color: Colors.grey.shade50,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 14,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.shopping_bag_outlined,
                      size: 72,
                      color: Colors.grey,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Your cart is empty',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Add some products to get started!',
                      style: TextStyle(color: Color(0xFF6b7280)),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/home'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFdc2626),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 22,
                          vertical: 14,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Continue Shopping',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final shipping = calculateShippingCharges(cartState.subtotal);
    final itemCount = cartState.totalItems;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cart'),
        bottom: const CategoriesNavBar(),
      ),
      body: Container(
        color: Colors.grey.shade50,
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Shopping Cart',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                  ),
                ),
                TextButton(
                  onPressed: () => cartNotifier.clear(),
                  child: const Text('Clear Cart'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    child: Row(
                      children: [
                        Text(
                          'Cart Items ($itemCount)',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          'Delivering to: $selectedCity',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6b7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: Colors.grey.shade200),
                  ...cartState.items.asMap().entries.map((entry) {
                    final index = entry.key;
                    final item = entry.value;
                    final unitPrice = item.unitPriceForQuantity(item.quantity);
                    final total = unitPrice * item.quantity;
                    final minQty = item.minimumOrderQuantity > 0
                        ? item.minimumOrderQuantity
                        : 1;
                    int? maxValidQty;
                    if (item.availableStock != null) {
                      maxValidQty = (item.availableStock! ~/ minQty) * minQty;
                      if (maxValidQty == 0) {
                        maxValidQty = minQty;
                      }
                    }
                    final canDecrease = item.quantity > minQty;
                    final canIncrease = maxValidQty == null
                        ? true
                        : item.quantity < maxValidQty;

                    return Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: CachedNetworkImage(
                                  imageUrl: item.productImage.isNotEmpty
                                      ? item.productImage
                                      : 'https://via.placeholder.com/150?text=Product',
                                  height: 72,
                                  width: 72,
                                  fit: BoxFit.contain,
                                  errorWidget: (_, __, ___) => Container(
                                    height: 72,
                                    width: 72,
                                    color: Colors.grey.shade100,
                                    alignment: Alignment.center,
                                    child: const Icon(Icons.image_outlined),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            item.productName,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          onPressed: () =>
                                              cartNotifier.removeItem(item.id),
                                          icon: const Icon(Icons.close),
                                          color: const Color(0xFF6b7280),
                                          iconSize: 18,
                                          visualDensity: VisualDensity.compact,
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${formatCurrency(unitPrice)} / ${item.unit ?? ''}',
                                      style: const TextStyle(
                                        color: Color(0xFFdc2626),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Text(
                                              'Qty:',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Color(0xFF6b7280),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              decoration: BoxDecoration(
                                                border: Border.all(
                                                  color: Colors.grey.shade300,
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(6),
                                              ),
                                              child: Row(
                                                children: [
                                                  _QtyStepButton(
                                                    icon: Icons.remove,
                                                    onTap: canDecrease
                                                        ? () => cartNotifier
                                                              .updateQuantity(
                                                                item.id,
                                                                item.quantity -
                                                                    minQty,
                                                              )
                                                        : null,
                                                  ),
                                                  Container(
                                                    alignment: Alignment.center,
                                                    width: 36,
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          vertical: 4,
                                                        ),
                                                    child: Text(
                                                      '${item.quantity}',
                                                      style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        fontSize: 12,
                                                      ),
                                                    ),
                                                  ),
                                                  _QtyStepButton(
                                                    icon: Icons.add,
                                                    onTap: canIncrease
                                                        ? () {
                                                            var nextQty =
                                                                item.quantity +
                                                                minQty;
                                                            if (maxValidQty !=
                                                                    null &&
                                                                nextQty >
                                                                    maxValidQty) {
                                                              nextQty =
                                                                  maxValidQty;
                                                            }
                                                            cartNotifier
                                                                .updateQuantity(
                                                                  item.id,
                                                                  nextQty,
                                                                );
                                                          }
                                                        : null,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              formatCurrency(total),
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w800,
                                                fontSize: 14,
                                                color: Color(0xFF111827),
                                              ),
                                            ),
                                            if (item.availableStock != null &&
                                                item.availableStock! <= 5 &&
                                                item.availableStock! > 0)
                                              const Text(
                                                'Only few left',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Color(0xFFea580c),
                                                ),
                                              ),
                                            if (item.availableStock == 0)
                                              const Text(
                                                'Out of stock',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Color(0xFFdc2626),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (index != cartState.items.length - 1)
                          Divider(height: 1, color: Colors.grey.shade200),
                      ],
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Order Summary',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  _SummaryRow(
                    label: 'Subtotal ($itemCount items)',
                    value: formatCurrency(cartState.subtotal),
                  ),
                  _SummaryRow(
                    label: 'Shipping Charges',
                    value: shipping == 0 ? 'Free' : formatCurrency(shipping),
                    valueColor: shipping == 0 ? const Color(0xFF16A34A) : null,
                  ),
                  const Divider(height: 20),
                  _SummaryRow(
                    label: 'Total',
                    value: formatCurrency(cartState.subtotal + shipping),
                    isBold: true,
                    valueColor: const Color(0xFFdc2626),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Prices are exclusive of GST. Applicable GST will be calculated at checkout.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6b7280)),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => context.push('/checkout'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFdc2626),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'Place Order',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: TextButton(
                      onPressed: () => context.go('/home'),
                      child: const Text(
                        'Continue Shopping',
                        style: TextStyle(color: Color(0xFF6b7280)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyStepButton extends StatelessWidget {
  const _QtyStepButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        height: 28,
        width: 28,
        child: Icon(
          icon,
          size: 16,
          color: onTap == null ? Colors.grey.shade400 : const Color(0xFF111827),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

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
          Text(value, style: style.copyWith(color: valueColor)),
        ],
      ),
    );
  }
}
