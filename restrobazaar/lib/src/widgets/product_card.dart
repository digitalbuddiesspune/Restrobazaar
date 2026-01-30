import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/cart_controller.dart';
import '../controllers/wishlist_controller.dart';
import '../core/formatters.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class ProductCard extends ConsumerWidget {
  const ProductCard({super.key, required this.product, this.onTap});

  final VendorProductModel product;
  final VoidCallback? onTap;

  static String _truncateWithEllipsis(String value, int maxLength) {
    if (value.length <= maxLength) {
      return value;
    }
    return '${value.substring(0, maxLength).trimRight()}...';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    PriceSlab? slabForQuantity(VendorProductModel product, int qty) {
      if (product.priceType != 'bulk' || product.pricing.bulk.isEmpty) {
        return null;
      }
      PriceSlab? best;
      for (final slab in product.pricing.bulk) {
        final max = slab.maxQty;
        if (qty >= slab.minQty && (max == null || qty <= max)) {
          if (best == null || slab.minQty > best.minQty) {
            best = slab;
          }
        }
      }
      if (best != null) return best;
      return product.pricing.bulk
          .reduce((a, b) => a.minQty <= b.minQty ? a : b);
    }

    final cartState = ref.watch(cartControllerProvider);
    final wishlistState = ref.watch(wishlistControllerProvider);
    final inWishlist = wishlistState.contains(product.id);
    final price = product.displayPrice ?? 0;
    final originalPrice = product.originalPrice;
    final hasDiscount =
        originalPrice != null && originalPrice > price && price > 0;
    final discountPercent = hasDiscount
        ? (((originalPrice - price) / originalPrice) * 100).round()
        : 0;
    final imageUrl = product.product?.images.isNotEmpty == true
        ? product.product!.images.first
        : 'https://via.placeholder.com/300x300?text=Product';
    final productName = product.product?.productName ?? 'Product';
    final displayName = _truncateWithEllipsis(productName, 28);
    final minQty = (product.minimumOrderQuantity ?? 1) > 0
        ? product.minimumOrderQuantity ?? 1
        : 1;
    CartItem? cartItem;
    for (final item in cartState.items) {
      if (item.vendorProductId == product.id) {
        cartItem = item;
        break;
      }
    }
    int? maxValidQty;
    if (product.availableStock != null) {
      maxValidQty = (product.availableStock! ~/ minQty) * minQty;
      if (maxValidQty == 0) maxValidQty = minQty;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, _) =>
                          Container(color: Colors.grey.shade200),
                      errorWidget: (context, _, __) => Container(
                        color: Colors.grey.shade200,
                        alignment: Alignment.center,
                        child: const Icon(Icons.image_not_supported_outlined),
                      ),
                    ),
                  ),
                ),
                if (hasDiscount && discountPercent > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFfee2e2),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: const Color(0xFFfecaca)),
                      ),
                      child: Text(
                        '$discountPercent% OFF',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFdc2626),
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: InkWell(
                    onTap: () async {
                      await ref
                          .read(wishlistControllerProvider.notifier)
                          .toggleWishlist(product);
                      if (context.mounted && wishlistState.error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(wishlistState.error!)),
                        );
                      }
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.85),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: Icon(
                        inWishlist ? Icons.favorite : Icons.favorite_border,
                        color: inWishlist
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey.shade700,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        price > 0 ? formatCurrency(price) : 'Price on request',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Theme.of(context).colorScheme.primary,
                          fontSize: 15,
                        ),
                      ),
                      if (hasDiscount) ...[
                        const SizedBox(width: 6),
                        Text(
                          formatCurrency(originalPrice),
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF9ca3af),
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 34,
                    child: cartItem == null
                        ? OutlinedButton.icon(
                            onPressed: () async {
                              final alreadyInCart = cartItem != null;
                              await ref
                                  .read(cartControllerProvider.notifier)
                                  .addToCart(
                                    product,
                                    quantity: minQty,
                                    selectedSlab: slabForQuantity(
                                      product,
                                      minQty,
                                    ),
                                  );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      alreadyInCart
                                          ? 'Added $minQty more item(s)'
                                          : 'Added to cart',
                                    ),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              }
                            },
                            icon: const Icon(
                              Icons.add_shopping_cart_outlined,
                              size: 18,
                            ),
                            label: const Text(
                              'Add to cart',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.grey.shade300),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              minimumSize: const Size.fromHeight(34),
                              padding: EdgeInsets.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              foregroundColor: Colors.grey.shade900,
                            ),
                          )
                        : () {
                            final item = cartItem!;
                            return Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: Row(
                              children: [
                                _QtyButton(
                                  icon: Icons.remove,
                                  onTap: item.quantity <= minQty
                                      ? null
                                      : () => ref
                                          .read(
                                            cartControllerProvider.notifier,
                                          )
                                          .updateQuantity(
                                            item.id,
                                            item.quantity - minQty,
                                          ),
                                ),
                                Expanded(
                                  child: Center(
                                    child: Text(
                                      '${item.quantity}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),
                                _QtyButton(
                                  icon: Icons.add,
                                  onTap: maxValidQty != null &&
                                          item.quantity >= maxValidQty
                                      ? null
                                      : () => ref
                                          .read(
                                            cartControllerProvider.notifier,
                                          )
                                          .updateQuantity(
                                            item.id,
                                            item.quantity + minQty,
                                          ),
                                ),
                              ],
                            ),
                          );
                          }(),
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

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 34,
        height: double.infinity,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: onTap == null ? Colors.grey.shade200 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 16, color: Colors.black87),
      ),
    );
  }
}
