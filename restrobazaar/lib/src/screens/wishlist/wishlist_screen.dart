import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/wishlist_controller.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';

class WishlistScreen extends ConsumerStatefulWidget {
  const WishlistScreen({super.key});

  @override
  ConsumerState<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends ConsumerState<WishlistScreen> {
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

  Widget _buildHeader({String? errorMessage}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Wishlist',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Products you saved for later',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
            ),
          ),
          if (errorMessage != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFfef2f2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFfecaca)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      errorMessage,
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
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

  Widget _buildError(String message) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      children: [
        _buildHeader(),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: [
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.red.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _refreshWishlist,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFdc2626),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ],
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
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
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
                    borderRadius: BorderRadius.circular(8),
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
          // Same grid proportions as category product cards.
          SliverLayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.crossAxisExtent - 20;
              const crossAxisCount = 2;
              const spacing = 6.0;
              final itemWidth =
                  (width - (spacing * (crossAxisCount - 1))) / crossAxisCount;
              final itemHeight = itemWidth + 96;

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(10, 0, 10, 20),
                sliver: SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    mainAxisSpacing: spacing,
                    crossAxisSpacing: spacing,
                    mainAxisExtent: itemHeight,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final product = items[index];
                      return ProductCard(
                        product: product,
                        onTap: () => context.push('/product/${product.id}'),
                      );
                    },
                    childCount: items.length,
                  ),
                ),
              );
            },
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
                    ? RefreshIndicator(
                        onRefresh: _refreshWishlist,
                        child: _buildEmpty(),
                      )
                    : _buildGrid(items, error: wishlistState.error),
      ),
    );
  }
}
