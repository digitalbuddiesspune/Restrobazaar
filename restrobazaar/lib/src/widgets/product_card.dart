import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/cart_controller.dart';
import '../controllers/wishlist_controller.dart';
import '../core/formatters.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import 'auth_gate.dart';

/// Storefront product card — mirrors web `/category/:slug` layout.
/// When the product is in the cart, shows quantity stepper instead of Add to Cart.
class ProductCard extends ConsumerWidget {
  const ProductCard({super.key, required this.product, this.onTap});

  final VendorProductModel product;
  final VoidCallback? onTap;

  String get _productId => product.id.toString();

  CartItem? _cartItemForProduct(CartState cart) {
    for (final item in cart.items) {
      if (item.vendorProductId.toString() == _productId) return item;
    }
    return null;
  }

  int _cartQuantity(CartState cart) {
    return cart.items
        .where((i) => i.vendorProductId.toString() == _productId)
        .fold(0, (sum, i) => sum + i.quantity);
  }

  Future<void> _changeQuantity(
    WidgetRef ref,
    CartItem cartItem,
    int delta,
  ) async {
    final rawMoq =
        product.minimumOrderQuantity ?? cartItem.minimumOrderQuantity;
    final step = (rawMoq > 0) ? rawMoq : 1;
    final current = _cartQuantity(ref.read(cartControllerProvider));
    var next = current + delta;
    if (next < step) {
      // Mirror web: floor at MOQ (do not remove from cart via −).
      next = step;
    }
    final stock = product.availableStock ?? cartItem.availableStock;
    if (stock != null && next > stock) next = stock;

    final remainder = next % step;
    if (remainder != 0) {
      next = next - remainder;
      if (next < step) next = step;
    }

    if (next == current) return;
    await ref
        .read(cartControllerProvider.notifier)
        .updateQuantity(cartItem.id, next);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlistState = ref.watch(wishlistControllerProvider);
    final cartState = ref.watch(cartControllerProvider);
    final inWishlist = wishlistState.contains(product.id);
    final price = product.displayPrice;
    final defaultPrice = product.displayDefaultPrice;
    final showStrike =
        defaultPrice != null && price != null && defaultPrice > price;
    final imageUrl = product.product?.images.isNotEmpty == true
        ? product.product!.images.first
        : 'https://via.placeholder.com/300x300?text=Product';
    final productName = product.product?.productName ?? 'Product';
    // Null stock = unknown / not provided (e.g. wishlist payload) → treat as available.
    // Only show Out of Stock when the API explicitly returns 0.
    final inStock =
        product.availableStock == null || product.availableStock! > 0;
    final rawMoq = product.minimumOrderQuantity ?? 1;
    final moq = rawMoq > 0 ? rawMoq : 1;
    final cartItem = _cartItemForProduct(cartState);
    final cartQty = _cartQuantity(cartState);
    final inCart = cartItem != null && cartQty > 0;
    final activeCartItem = cartItem;

    Widget cartAction;
    if (!inStock) {
      cartAction = ElevatedButton(
        onPressed: null,
        style: ElevatedButton.styleFrom(
          disabledBackgroundColor: Colors.grey.shade300,
          disabledForegroundColor: Colors.grey.shade600,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
        child: const Text('Out of Stock'),
      );
    } else if (inCart && activeCartItem != null) {
      cartAction = _CartQuantityStepper(
        quantity: cartQty,
        onDecrease: () => _changeQuantity(ref, activeCartItem, -moq),
        onIncrease: () => _changeQuantity(ref, activeCartItem, moq),
      );
    } else {
      cartAction = ElevatedButton(
        onPressed: () async {
          await ref
              .read(cartControllerProvider.notifier)
              .addToCart(product, quantity: moq);
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFdc2626),
          foregroundColor: Colors.white,
          elevation: 1,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
        child: const Text('Add to Cart'),
      );
    }

    return Material(
      color: Colors.white,
      elevation: 1.5,
      shadowColor: Colors.black26,
      borderRadius: BorderRadius.circular(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            child: AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  InkWell(
                    onTap: onTap,
                    child: ColoredBox(
                      color: Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.contain,
                          placeholder: (context, _) =>
                              Container(color: Colors.grey.shade100),
                          errorWidget: (context, _, __) => Container(
                            color: Colors.grey.shade100,
                            alignment: Alignment.center,
                            child:
                                const Icon(Icons.image_not_supported_outlined),
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (inCart)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFdc2626),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '$cartQty',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Material(
                      color:
                          inWishlist ? const Color(0xFFdc2626) : Colors.white,
                      shape: const CircleBorder(),
                      elevation: 2,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () async {
                          final ok = await ensureLoggedIn(context, ref);
                          if (!ok || !context.mounted) return;
                          await ref
                              .read(wishlistControllerProvider.notifier)
                              .toggleWishlist(product);
                          if (context.mounted &&
                              wishlistState.error != null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(wishlistState.error!)),
                            );
                          }
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: Icon(
                            inWishlist ? Icons.favorite : Icons.favorite_border,
                            color: inWishlist
                                ? Colors.white
                                : Colors.grey.shade600,
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InkWell(
                    onTap: onTap,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          productName,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 11,
                            height: 1.15,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (price != null && price > 0)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              if (showStrike) ...[
                                Text(
                                  formatCurrency(defaultPrice ?? 0),
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade400,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                                const SizedBox(width: 4),
                              ],
                              Text(
                                formatCurrency(price),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  color: Color(0xFF111827),
                                ),
                              ),
                            ],
                          )
                        else
                          const Text(
                            'Price on request',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              color: Color(0xFF111827),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Add to Cart → ± quantity once product is in cart.
                  SizedBox(
                    width: double.infinity,
                    height: 30,
                    child: cartAction,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Matches web category qty control: bordered − / count / + section.
class _CartQuantityStepper extends StatelessWidget {
  const _CartQuantityStepper({
    required this.quantity,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 30,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black, width: 1.2),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          _StepperSideButton(
            icon: Icons.remove,
            onTap: onDecrease,
            roundedLeft: true,
          ),
          Expanded(
            child: Container(
              alignment: Alignment.center,
              color: Colors.white,
              child: Text(
                '$quantity',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
            ),
          ),
          _StepperSideButton(
            icon: Icons.add,
            onTap: onIncrease,
            roundedRight: true,
          ),
        ],
      ),
    );
  }
}

class _StepperSideButton extends StatelessWidget {
  const _StepperSideButton({
    required this.icon,
    required this.onTap,
    this.roundedLeft = false,
    this.roundedRight = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool roundedLeft;
  final bool roundedRight;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.only(
      topLeft: roundedLeft ? const Radius.circular(7) : Radius.zero,
      bottomLeft: roundedLeft ? const Radius.circular(7) : Radius.zero,
      topRight: roundedRight ? const Radius.circular(7) : Radius.zero,
      bottomRight: roundedRight ? const Radius.circular(7) : Radius.zero,
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        child: Ink(
          width: 28,
          height: 30,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: radius,
          ),
          child: Icon(icon, size: 14, color: Colors.black),
        ),
      ),
    );
  }
}
