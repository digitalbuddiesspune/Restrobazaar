import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/cart_controller.dart';
import '../../controllers/catalog_providers.dart';
import '../../controllers/wishlist_controller.dart';
import '../../core/formatters.dart';
import '../../models/product.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _quantity = 1;
  PriceSlab? _selectedSlab;
  String? _loadedProductId;
  bool _wishlistLoading = false;
  bool _addingToCart = false;
  int _imageIndex = 0;

  List<String> _imagesFor(VendorProductModel product) {
    final images = product.product?.images ?? [];
    if (images.isNotEmpty) return images;
    return ['https://via.placeholder.com/600x600?text=Product'];
  }

  void _syncWithProduct(VendorProductModel product) {
    final minQty = product.minimumOrderQuantity ?? 1;
    if (_loadedProductId != product.id) {
      _loadedProductId = product.id;
      _quantity = minQty;
      _selectedSlab = _slabForQuantity(product, minQty);
      _imageIndex = 0;
    } else {
      if (_quantity < minQty) _quantity = minQty;
      final maxStock = product.availableStock;
      if (maxStock != null && _quantity > maxStock) {
        _quantity = maxStock;
      }
      _selectedSlab ??= _slabForQuantity(product, _quantity);
    }
  }

  PriceSlab? _slabForQuantity(VendorProductModel product, int qty) {
    if (product.priceType != 'bulk' || product.pricing.bulk.isEmpty) {
      return null;
    }
    for (final slab in product.pricing.bulk) {
      final max = slab.maxQty ?? 1000000000;
      if (qty >= slab.minQty && qty <= max) return slab;
    }
    return product.pricing.bulk.last;
  }

  double? _unitPrice(VendorProductModel product, int qty) {
    if (product.priceType == 'single') return product.pricing.singlePrice;
    return _slabForQuantity(product, qty)?.price;
  }

  double? _totalPrice(VendorProductModel product, int qty) {
    final unit = _unitPrice(product, qty);
    if (unit == null) return null;
    return unit * qty;
  }

  void _updateQuantity(VendorProductModel product, int newQty) {
    final minQty = product.minimumOrderQuantity ?? 1;
    final maxStock = product.availableStock;
    final step = minQty > 0 ? minQty : 1;

    if (newQty < minQty) newQty = minQty;
    if (maxStock != null && newQty > maxStock) newQty = maxStock;

    final remainder = newQty % step;
    if (remainder != 0) {
      newQty = newQty - remainder + (newQty > _quantity ? step : 0);
    }

    setState(() {
      _quantity = newQty;
      _selectedSlab = _slabForQuantity(product, newQty);
    });
  }

  Future<void> _toggleWishlist(VendorProductModel product) async {
    setState(() => _wishlistLoading = true);
    await ref.read(wishlistControllerProvider.notifier).toggleWishlist(product);
    if (mounted) setState(() => _wishlistLoading = false);
  }

  Future<void> _shareProduct(VendorProductModel product) async {
    final slug = product.slug ?? product.id;
    final url = 'https://restrobazaar.com/product/$slug';
    await Clipboard.setData(ClipboardData(text: url));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Product link copied to clipboard')),
    );
  }

  Future<void> _addToCart(VendorProductModel product) async {
    final price = _unitPrice(product, _quantity);
    if (price == null || price == 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Price unavailable for this product')),
      );
      return;
    }

    setState(() => _addingToCart = true);
    try {
      await ref.read(cartControllerProvider.notifier).addToCart(
            product,
            quantity: _quantity,
            selectedSlab: _selectedSlab ?? _slabForQuantity(product, _quantity),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Added to cart')),
      );
    } finally {
      if (mounted) setState(() => _addingToCart = false);
    }
  }

  Widget _loadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            height: 48,
            width: 48,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: Color(0xFFdc2626),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Loading product details...',
            style: TextStyle(
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorView(String? message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: Color(0xFFdc2626),
            ),
            const SizedBox(height: 12),
            Text(
              message ?? 'Product not found',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF1f2937),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton(
                  onPressed: () => context.pop(),
                  child: const Text('Go Back'),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () => context.go('/home'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFdc2626),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Go Home'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.productId));
    final wishlistState = ref.watch(wishlistControllerProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.grey.shade50,
        elevation: 0,
        foregroundColor: Colors.grey.shade900,
        title: const Text('Product details'),
        actions: [
          IconButton(
            onPressed: () => context.go('/cart'),
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
      body: productAsync.when(
        loading: _loadingView,
        error: (err, _) => _errorView(err.toString()),
        data: (product) {
          if (product == null) return _errorView('Product not found');

          _syncWithProduct(product);
          final images = _imagesFor(product);
          final inWishlist = wishlistState.contains(product.id);
          final minQty = product.minimumOrderQuantity ?? 1;
          final inStock = product.availableStock == null ||
              (product.availableStock ?? 0) > 0;
          final totalPrice = _totalPrice(product, _quantity);

          return ListView(
            padding: EdgeInsets.zero,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Stack(
                    children: [
                      AspectRatio(
                        aspectRatio: 1,
                        child: PageView.builder(
                          itemCount: images.length,
                          onPageChanged: (i) {
                            setState(() => _imageIndex = i);
                          },
                          itemBuilder: (context, index) {
                            final imageUrl = images[index];
                            return Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.grey.shade50,
                                    Colors.grey.shade200,
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: CachedNetworkImage(
                                imageUrl: imageUrl,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => Icon(
                                  Icons.image_outlined,
                                  size: 40,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Row(
                          children: [
                            IconButton(
                              onPressed: () => _shareProduct(product),
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.white,
                                shape: const CircleBorder(),
                                padding: const EdgeInsets.all(10),
                                side: BorderSide(color: Colors.grey.shade200),
                                elevation: 3,
                                shadowColor: Colors.black12,
                              ),
                              icon: const Icon(
                                Icons.ios_share_outlined,
                                color: Color(0xFF4b5563),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed:
                                  _wishlistLoading ? null : () => _toggleWishlist(product),
                              style: IconButton.styleFrom(
                                backgroundColor:
                                    inWishlist ? const Color(0xFFdc2626) : Colors.white,
                                shape: const CircleBorder(),
                                padding: const EdgeInsets.all(10),
                                side: BorderSide(
                                  color: inWishlist
                                      ? const Color(0xFFdc2626)
                                      : Colors.grey.shade200,
                                ),
                                elevation: 3,
                                shadowColor: Colors.black12,
                              ),
                              icon: _wishlistLoading
                                  ? const SizedBox(
                                      height: 16,
                                      width: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Icon(
                                      Icons.favorite,
                                      color: inWishlist
                                          ? Colors.white
                                          : const Color(0xFFdc2626),
                                    ),
                            ),
                          ],
                        ),
                      ),
                      if (images.length > 1)
                        Positioned(
                          bottom: 10,
                          left: 0,
                          right: 0,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(
                              images.length,
                              (index) => Container(
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                width: _imageIndex == index ? 18 : 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: _imageIndex == index
                                      ? const Color(0xFFdc2626)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.grey.shade300),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (images.length > 1)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    height: 78,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: images.length,
                      itemBuilder: (context, index) {
                        final imageUrl = images[index];
                        final selected = index == _imageIndex;
                        return GestureDetector(
                          onTap: () => setState(() => _imageIndex = index),
                          child: Container(
                            width: 78,
                            margin: const EdgeInsets.only(right: 10, bottom: 6),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected
                                    ? const Color(0xFFdc2626)
                                    : Colors.grey.shade200,
                                width: selected ? 2 : 1,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: CachedNetworkImage(
                                imageUrl: imageUrl,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => Icon(
                                  Icons.image_outlined,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (product.product?.category?.name != null &&
                        product.product!.category!.name.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFfee2e2),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          product.product!.category!.name,
                          style: const TextStyle(
                            color: Color(0xFFdc2626),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    const SizedBox(height: 10),
                    Text(
                      product.product?.productName ?? 'Product Name',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                    ),
                    if (product.product?.shortDescription != null &&
                        product.product!.shortDescription!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          product.product!.shortDescription!,
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            height: 1.4,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 12,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Price',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6b7280),
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (product.priceType == 'single' &&
                          product.pricing.singlePrice != null)
                        Row(
                          children: [
                            Text(
                              formatCurrency(product.pricing.singlePrice!),
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFdc2626),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'per piece',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF6b7280),
                              ),
                            ),
                          ],
                        )
                      else if (product.priceType == 'bulk' &&
                          product.pricing.bulk.isNotEmpty)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Bulk pricing available',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFdc2626),
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...product.pricing.bulk.map(
                              (slab) => Container(
                                margin: const EdgeInsets.only(bottom: 6),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.grey.shade200),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${slab.minQty}-${slab.maxQty ?? '∞'} pieces',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF4b5563),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      '${formatCurrency(slab.price)}/piece',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                      else
                        const Text(
                          'Price on request',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Availability',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6b7280),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: inStock
                                  ? const Color(0xFFdcfce7)
                                  : const Color(0xFFfee2e2),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              inStock
                                  ? 'In Stock (${product.availableStock ?? 'Available'})'
                                  : 'Out of Stock',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color:
                                    inStock ? const Color(0xFF166534) : const Color(0xFFb91c1c),
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (inStock) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Quantity',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6b7280),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _QuantityButton(
                              icon: Icons.remove,
                              onTap: _quantity <= minQty
                                  ? null
                                  : () => _updateQuantity(
                                        product,
                                        _quantity - minQty,
                                      ),
                              tooltip: 'Decrease by $minQty',
                            ),
                            Container(
                              width: 68,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '$_quantity',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            _QuantityButton(
                              icon: Icons.add,
                              onTap: () => _updateQuantity(
                                product,
                                _quantity + minQty,
                              ),
                              tooltip: 'Increase by $minQty',
                            ),
                            const SizedBox(width: 10),
                            Flexible(
                              child: Text(
                                'Min $minQty • multiples only',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF6b7280),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (totalPrice != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Total price',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF6b7280),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    formatCurrency(totalPrice),
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFFdc2626),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _addingToCart ? null : () => _addToCart(product),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFdc2626),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              elevation: 2,
                              shadowColor: Colors.black12,
                            ),
                            child: _addingToCart
                                ? const SizedBox(
                                    height: 18,
                                    width: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'Add to Cart',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              if (product.vendor != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Vendor Information',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(
                              Icons.storefront_outlined,
                              size: 18,
                              color: Color(0xFF6b7280),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                product.vendor?.businessName ?? 'Vendor',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (product.vendor?.businessName != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Trusted vendor on RestroBazaar',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 12,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Product Details',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 10),
                      _DetailRow(
                        label: 'Product ID',
                        value: product.id,
                      ),
                      _DetailRow(
                        label: 'Price Type',
                        value: product.priceType,
                      ),
                      _DetailRow(
                        label: 'Minimum Order',
                        value: '${product.minimumOrderQuantity ?? 1} pieces',
                      ),
                      _DetailRow(
                        label: 'Available Stock',
                        value: '${product.availableStock ?? 0} pieces',
                      ),
                      if (product.city != null)
                        _DetailRow(
                          label: 'Location',
                          value: [
                            product.city!.displayName,
                            if (product.city!.state != null &&
                                product.city!.state!.isNotEmpty)
                              ', ${product.city!.state}',
                          ].join(),
                        ),
                      if (product.product?.description != null &&
                          product.product!.description!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(
                            product.product!.description!,
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              height: 1.45,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 26),
                child: OutlinedButton.icon(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Back to Products'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Ink(
          height: 46,
          width: 46,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey.shade300),
            color: onTap == null ? Colors.grey.shade200 : Colors.white,
          ),
          child: Tooltip(
            message: tooltip,
            child: Icon(
              icon,
              color: const Color(0xFF111827),
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF6b7280),
              fontWeight: FontWeight.w600,
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
