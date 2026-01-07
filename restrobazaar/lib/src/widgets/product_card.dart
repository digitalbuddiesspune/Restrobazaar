import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/cart_controller.dart';
import '../controllers/wishlist_controller.dart';
import '../core/formatters.dart';
import '../models/product.dart';

class ProductCard extends ConsumerWidget {
  const ProductCard({super.key, required this.product, this.onTap});

  final VendorProductModel product;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlistState = ref.watch(wishlistControllerProvider);
    final inWishlist = wishlistState.contains(product.id);
    final price = product.displayPrice ?? 0;

    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 1,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: CachedNetworkImage(
                  imageUrl: product.product?.images.isNotEmpty == true
                      ? product.product!.images.first
                      : 'https://via.placeholder.com/300x300?text=Product',
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
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.product?.productName ?? 'Product',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    product.vendor?.businessName ?? '',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    price > 0 ? formatCurrency(price) : 'Price on request',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 15,
                    ),
                  ),
                  if (product.availableStock != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Row(
                        children: [
                          Icon(
                            product.availableStock! > 0
                                ? Icons.check_circle
                                : Icons.error,
                            color: product.availableStock! > 0
                                ? Colors.green
                                : Colors.red,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            product.availableStock! > 0
                                ? 'In stock'
                                : 'Out of stock',
                            style: TextStyle(
                              color: product.availableStock! > 0
                                  ? Colors.green
                                  : Colors.red,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            await ref
                                .read(cartControllerProvider.notifier)
                                .addToCart(
                                  product,
                                  quantity: product.minimumOrderQuantity ?? 1,
                                );
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Added to cart'),
                                  duration: Duration(seconds: 1),
                                ),
                              );
                            }
                          },
                          child: const Text('Add'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filledTonal(
                        onPressed: () async {
                          await ref
                              .read(wishlistControllerProvider.notifier)
                              .toggleWishlist(product);
                          if (context.mounted && wishlistState.error != null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(wishlistState.error!)),
                            );
                          }
                        },
                        icon: Icon(
                          inWishlist ? Icons.favorite : Icons.favorite_border,
                          color: inWishlist
                              ? Theme.of(context).colorScheme.primary
                              : Colors.grey.shade700,
                        ),
                      ),
                    ],
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
