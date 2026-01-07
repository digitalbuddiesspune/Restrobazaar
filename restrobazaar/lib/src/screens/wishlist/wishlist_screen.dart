import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/cart_controller.dart';
import '../../controllers/wishlist_controller.dart';
import '../../core/formatters.dart';
import '../../models/product.dart';

class WishlistScreen extends ConsumerStatefulWidget {
  const WishlistScreen({super.key});

  @override
  ConsumerState<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends ConsumerState<WishlistScreen> {
  final Set<String> _removingIds = {};
  final Set<String> _addingToCartIds = {};

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(wishlistControllerProvider.notifier).loadWishlist();
    });
  }

  Future<void> _refreshWishlist() {
    return ref.read(wishlistControllerProvider.notifier).loadWishlist();
  }

  Future<void> _removeFromWishlist(VendorProductModel product) async {
    setState(() => _removingIds.add(product.id));
    await ref.read(wishlistControllerProvider.notifier).toggleWishlist(product);
    if (mounted) setState(() => _removingIds.remove(product.id));
  }

  Future<void> _addToCart(VendorProductModel product) async {
    setState(() => _addingToCartIds.add(product.id));
    try {
      await ref.read(cartControllerProvider.notifier).addToCart(
            product,
            quantity: product.minimumOrderQuantity ?? 1,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product added to cart!')),
      );
    } finally {
      if (mounted) setState(() => _addingToCartIds.remove(product.id));
    }
  }

  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            height: 38,
            width: 38,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: Color(0xFFdc2626),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Loading wishlist...',
            style: TextStyle(
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFFdc2626),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 14),
            ElevatedButton(
              onPressed: _refreshWishlist,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFdc2626),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader({String? errorMessage}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Wishlist',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: Colors.grey.shade900,
                ),
          ),
          if (errorMessage != null) ...[
            const SizedBox(height: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFfef2f2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFfecdd3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline,
                      size: 18, color: Color(0xFFdc2626)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorMessage,
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _refreshWishlist,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      children: [
        _buildHeader(),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.favorite_border,
                size: 70,
                color: Color(0xFF9ca3af),
              ),
              const SizedBox(height: 14),
              Text(
                'Your wishlist is empty',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: Colors.grey.shade900,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'Start adding products you love to your wishlist!',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade600,
                    ),
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFdc2626),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
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
    );
  }

  Widget _buildGrid(List<VendorProductModel> items, {String? error}) {
    return RefreshIndicator(
      onRefresh: _refreshWishlist,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(errorMessage: error)),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.58,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final product = items[index];
                  return _WishlistTile(
                    product: product,
                    removing: _removingIds.contains(product.id),
                    addingToCart: _addingToCartIds.contains(product.id),
                    onTap: () => context.push('/product/${product.id}'),
                    onRemove: () => _removeFromWishlist(product),
                    onAddToCart: () => _addToCart(product),
                  );
                },
                childCount: items.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wishlistState = ref.watch(wishlistControllerProvider);
    final items = wishlistState.items;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: wishlistState.loading && items.isEmpty
            ? _buildLoading()
            : (wishlistState.error != null && items.isEmpty)
            ? _buildError(wishlistState.error!)
            : items.isEmpty
            ? _buildEmpty()
            : _buildGrid(items, error: wishlistState.error),
      ),
    );
  }
}

class _WishlistTile extends StatelessWidget {
  const _WishlistTile({
    required this.product,
    required this.onTap,
    required this.onRemove,
    required this.onAddToCart,
    this.removing = false,
    this.addingToCart = false,
  });

  final VendorProductModel product;
  final VoidCallback onTap;
  final VoidCallback onRemove;
  final VoidCallback onAddToCart;
  final bool removing;
  final bool addingToCart;

  String _priceLabel() {
    final price = product.displayPrice;
    if (price == null || price == 0) {
      return 'Price on request';
    }
    return formatCurrency(price);
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = product.product?.images.isNotEmpty == true
        ? product.product!.images.first
        : null;
    final title = product.product?.productName ?? 'Product';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 12,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.grey.shade50,
                              Colors.grey.shade100,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        child: imageUrl != null
                            ? CachedNetworkImage(
                                imageUrl: imageUrl,
                                fit: BoxFit.cover,
                                placeholder: (context, _) => Container(
                                  color: Colors.grey.shade200,
                                ),
                                errorWidget: (_, __, ___) => Icon(
                                  Icons.broken_image_outlined,
                                  color: Colors.grey.shade400,
                                  size: 32,
                                ),
                              )
                            : Icon(
                                Icons.image_outlined,
                                color: Colors.grey.shade400,
                                size: 42,
                              ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: IconButton(
                      onPressed: removing ? null : onRemove,
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white,
                        padding: const EdgeInsets.all(8),
                        shape: const CircleBorder(),
                        side: BorderSide(color: Colors.grey.shade200),
                        elevation: 3,
                        shadowColor: Colors.black12,
                      ),
                      icon: removing
                          ? const SizedBox(
                              height: 14,
                              width: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFFdc2626),
                              ),
                            )
                          : const Icon(
                              Icons.favorite,
                              color: Color(0xFFdc2626),
                            ),
                    ),
                  ),
                ],
              ),
              Expanded(
                child: Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.grey.shade100,
                        Colors.white,
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _priceLabel(),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: addingToCart ? null : onAddToCart,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFdc2626),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 1,
                            shadowColor: Colors.black12,
                          ),
                          child: Text(
                            addingToCart ? 'Adding...' : 'Add to Cart',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
