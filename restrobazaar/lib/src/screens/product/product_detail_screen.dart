import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/cart_controller.dart';
import '../../controllers/catalog_providers.dart';
import '../../controllers/city_controller.dart';
import '../../controllers/wishlist_controller.dart';
import '../../core/formatters.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';

/// Product detail — structure mirrors web `ProductDetail.jsx`.
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
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<String> _imagesFor(VendorProductModel product) {
    final images = product.product?.images ?? [];
    if (images.isNotEmpty) return images;
    return ['https://via.placeholder.com/600x600?text=Product+Image'];
  }

  /// Same as web `findBestMatchingSlab`: highest minQty among qty >= minQty.
  PriceSlab? _findBestMatchingSlab(List<PriceSlab> bulkSlabs, int quantity) {
    if (bulkSlabs.isEmpty) return null;
    final matching = bulkSlabs.where((s) => quantity >= s.minQty).toList();
    if (matching.isEmpty) return null;
    matching.sort((a, b) => b.minQty.compareTo(a.minQty));
    return matching.first;
  }

  void _syncWithProduct(VendorProductModel product) {
    final minQty = product.minimumOrderQuantity ?? 1;
    if (_loadedProductId != product.id) {
      _loadedProductId = product.id;
      _quantity = minQty;
      _selectedSlab = _findBestMatchingSlab(product.pricing.bulk, minQty);
      _imageIndex = 0;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_pageController.hasClients) {
          _pageController.jumpToPage(0);
        }
      });
    } else {
      if (_quantity < minQty) _quantity = minQty;
      final maxStock = product.availableStock;
      if (maxStock != null && _quantity > maxStock) {
        _quantity = maxStock;
      }
      _selectedSlab =
          _findBestMatchingSlab(product.pricing.bulk, _quantity) ??
              _selectedSlab;
    }
  }

  double? _unitPrice(VendorProductModel product, int qty) {
    if (product.priceType == 'single') return product.pricing.singlePrice;
    return _findBestMatchingSlab(product.pricing.bulk, qty)?.price;
  }

  double? _totalPrice(VendorProductModel product, int qty) {
    final unit = _unitPrice(product, qty);
    if (unit == null) return null;
    return unit * qty;
  }

  double? _originalUnitPrice(VendorProductModel product) {
    return product.defaultPrice ?? product.originalPrice;
  }

  bool _showStrike(VendorProductModel product, double? sellPrice) {
    final original = _originalUnitPrice(product);
    return original != null &&
        sellPrice != null &&
        original > sellPrice;
  }

  int _normalizeQty(VendorProductModel product, int newQty, {int? relativeTo}) {
    final minQty = product.minimumOrderQuantity ?? 1;
    final maxStock = product.availableStock;
    final step = minQty > 0 ? minQty : 1;
    final baseline = relativeTo ?? _quantity;

    if (newQty < minQty) newQty = minQty;
    if (maxStock != null && newQty > maxStock) newQty = maxStock;

    final remainder = newQty % step;
    if (remainder != 0) {
      newQty = newQty - remainder + (newQty > baseline ? step : 0);
      if (newQty < minQty) newQty = minQty;
      if (maxStock != null && newQty > maxStock) {
        newQty = (maxStock ~/ step) * step;
        if (newQty < minQty) newQty = minQty;
      }
    }
    return newQty;
  }

  void _updateQuantity(VendorProductModel product, int newQty) {
    final valid = _normalizeQty(product, newQty);
    setState(() {
      _quantity = valid;
      _selectedSlab = _findBestMatchingSlab(product.pricing.bulk, valid);
    });
  }

  /// When already in cart, ± updates cart qty (same as product cards).
  Future<void> _changeCartQuantity(
    VendorProductModel product,
    int delta,
  ) async {
    final cartState = ref.read(cartControllerProvider);
    final matches = cartState.items
        .where((i) => i.vendorProductId.toString() == product.id.toString())
        .toList();
    if (matches.isEmpty) return;

    final cartItem = matches.first;
    final current = matches.fold<int>(0, (s, i) => s + i.quantity);
    final next = _normalizeQty(product, current + delta, relativeTo: current);
    if (next == current) return;

    await ref
        .read(cartControllerProvider.notifier)
        .updateQuantity(cartItem.id, next);
    if (!mounted) return;
    setState(() {
      _quantity = next;
      _selectedSlab = _findBestMatchingSlab(product.pricing.bulk, next);
    });
  }

  Future<void> _toggleWishlist(VendorProductModel product) async {
    setState(() => _wishlistLoading = true);
    await ref.read(wishlistControllerProvider.notifier).toggleWishlist(product);
    if (mounted) setState(() => _wishlistLoading = false);
  }

  Future<void> _shareProduct(VendorProductModel product) async {
    final slug = product.slug ?? product.id;
    final categorySlug = product.product?.category?.slug;
    final url = categorySlug != null && categorySlug.isNotEmpty
        ? 'https://restrobazaar.com/category/$categorySlug/${product.id}'
        : 'https://restrobazaar.com/product/$slug';
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
            selectedSlab: _selectedSlab ??
                _findBestMatchingSlab(product.pricing.bulk, _quantity),
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
    final cartState = ref.watch(cartControllerProvider);
    final cityId = ref.watch(cityControllerProvider).selected?.id;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.grey.shade50,
        elevation: 0,
        foregroundColor: Colors.grey.shade900,
        title: const Text('Product details'),
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
          // Treat missing stock as available (same as previous app behavior).
          final inStock = product.availableStock == null ||
              (product.availableStock ?? 0) > 0;
          final headerPrice = product.priceType == 'single'
              ? product.pricing.singlePrice
              : (product.pricing.bulk.isNotEmpty
                  ? product.pricing.bulk.last.price
                  : null);
          final original = _originalUnitPrice(product);
          final showHeaderStrike = _showStrike(product, headerPrice);
          final showBoxStrike = product.priceType == 'single' &&
              _showStrike(product, product.pricing.singlePrice);
          final cartMatches = cartState.items
              .where(
                (i) => i.vendorProductId.toString() == product.id.toString(),
              )
              .toList();
          final cartQty = cartMatches.fold<int>(0, (s, i) => s + i.quantity);
          final isInCart = cartQty > 0;
          // In cart: stepper shows / edits cart qty. Otherwise local pick qty.
          final displayQty = isInCart ? cartQty : _quantity;
          final totalPrice = _totalPrice(product, displayQty);
          final category = product.product?.category;
          final shortDescription = product.product?.shortDescription?.trim();
          final activeSlab =
              _findBestMatchingSlab(product.pricing.bulk, displayQty);

          final sizeParts = <String>[
            if (product.product?.size?.height?.isNotEmpty == true)
              'Height: ${product.product!.size!.height}',
            if (product.product?.size?.width?.isNotEmpty == true)
              'Width: ${product.product!.size!.width}',
            if (product.product?.size?.base?.isNotEmpty == true)
              'Base: ${product.product!.size!.base}',
          ];
          final detailItems = <_DetailItem>[
            if (product.product?.subCategory != null &&
                product.product!.subCategory!.isNotEmpty)
              _DetailItem(
                label: 'Sub Category',
                value: product.product!.subCategory!,
              ),
            if (product.product?.otherCategory != null &&
                product.product!.otherCategory!.isNotEmpty)
              _DetailItem(
                label: 'Other Category',
                value: product.product!.otherCategory!,
              ),
            if (product.product?.unit != null &&
                product.product!.unit!.isNotEmpty)
              _DetailItem(label: 'Unit', value: product.product!.unit!),
            if (product.product?.weight != null &&
                product.product!.weight!.isNotEmpty)
              _DetailItem(label: 'Weight', value: product.product!.weight!),
            if (product.product?.capacity != null &&
                product.product!.capacity!.isNotEmpty)
              _DetailItem(
                label: 'Capacity',
                value: product.product!.capacity!,
              ),
            if (sizeParts.isNotEmpty)
              _DetailItem(label: 'Size', value: sizeParts.join(', ')),
            _DetailItem(
              label: 'Minimum Order',
              value: '$minQty pieces',
            ),
            if (product.product?.isReturnable != null)
              _DetailItem(
                label: 'Returnable',
                value: product.product!.isReturnable! ? 'Yes' : 'No',
                valueColor: product.product!.isReturnable!
                    ? const Color(0xFF16a34a)
                    : const Color(0xFF4b5563),
                valueBold: true,
              ),
          ];

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              // Back to Products (web)
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: () {
                    if (context.canPop()) {
                      context.pop();
                    } else if (category != null && category.slug.isNotEmpty) {
                      context.go('/category/${category.slug}');
                    } else {
                      context.go('/home');
                    }
                  },
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: const Text('Back to Products'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF374151),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: Colors.grey.shade300),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Gallery — aspect 5/4, object-contain (web)
              Container(
                constraints: const BoxConstraints(maxWidth: 512),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 5 / 4,
                      child: PageView.builder(
                        controller: _pageController,
                        itemCount: images.length,
                        onPageChanged: (i) {
                          setState(() => _imageIndex = i);
                        },
                        itemBuilder: (context, index) {
                          return ColoredBox(
                            color: Colors.white,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: CachedNetworkImage(
                                imageUrl: images[index],
                                fit: BoxFit.contain,
                                errorWidget: (_, __, ___) => Icon(
                                  Icons.image_outlined,
                                  size: 40,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Row(
                        children: [
                          _OverlayIconButton(
                            onPressed: () => _shareProduct(product),
                            icon: Icons.ios_share_outlined,
                            filled: false,
                          ),
                          const SizedBox(width: 8),
                          _OverlayIconButton(
                            onPressed: _wishlistLoading
                                ? null
                                : () => _toggleWishlist(product),
                            filled: inWishlist,
                            child: _wishlistLoading
                                ? const SizedBox(
                                    height: 16,
                                    width: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Icon(
                                    inWishlist
                                        ? Icons.favorite
                                        : Icons.favorite_border,
                                    size: 18,
                                    color: inWishlist
                                        ? Colors.white
                                        : const Color(0xFF4b5563),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              if (images.length > 1) ...[
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: images.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                  ),
                  itemBuilder: (context, index) {
                    final selected = index == _imageIndex;
                    return GestureDetector(
                      onTap: () {
                        setState(() => _imageIndex = index);
                        _pageController.animateToPage(
                          index,
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOut,
                        );
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selected
                                ? const Color(0xFFdc2626)
                                : Colors.grey.shade200,
                            width: selected ? 2 : 1,
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFFdc2626)
                                        .withValues(alpha: 0.2),
                                    blurRadius: 6,
                                  ),
                                ]
                              : null,
                        ),
                        padding: const EdgeInsets.all(4),
                        child: CachedNetworkImage(
                          imageUrl: images[index],
                          fit: BoxFit.contain,
                          errorWidget: (_, __, ___) => Icon(
                            Icons.image_outlined,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],

              const SizedBox(height: 20),

              // Category link → name → hero price → short description
              if (category != null &&
                  category.name.isNotEmpty &&
                  category.slug.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: GestureDetector(
                    onTap: () => context.push('/category/${category.slug}'),
                    child: Text(
                      category.name,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFdc2626),
                      ),
                    ),
                  ),
                ),
              Text(
                product.product?.productName ?? 'Product Name',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 8),
              if (headerPrice != null)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    if (showHeaderStrike && original != null) ...[
                      Text(
                        formatCurrency(original),
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.shade400,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      formatCurrency(headerPrice),
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                    ),
                    if (product.priceType == 'single')
                      const Padding(
                        padding: EdgeInsets.only(left: 8),
                        child: Text(
                          'per piece',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6b7280),
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
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF6b7280),
                  ),
                ),
              if (shortDescription != null && shortDescription.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    shortDescription,
                    style: const TextStyle(
                      color: Color(0xFF4b5563),
                      height: 1.45,
                      fontSize: 13,
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              // Price box (web)
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                padding: const EdgeInsets.all(20),
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
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          if (showBoxStrike && original != null) ...[
                            Text(
                              formatCurrency(original),
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade400,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            formatCurrency(product.pricing.singlePrice!),
                            style: const TextStyle(
                              fontSize: 20,
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
                            'Volume Pricing ⭐',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFdc2626),
                            ),
                          ),
                          const SizedBox(height: 10),
                          ...product.pricing.bulk.map((slab) {
                            final isActive = activeSlab != null &&
                                activeSlab.minQty == slab.minQty &&
                                activeSlab.price == slab.price;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isActive
                                    ? const Color(0xFFfef2f2)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isActive
                                      ? const Color(0xFFdc2626)
                                      : Colors.grey.shade200,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Buy ${slab.minQty} Pieces or more at',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: const Color(0xFF374151),
                                        fontWeight: isActive
                                            ? FontWeight.w700
                                            : FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    '${formatCurrency(slab.price)}/piece',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isActive
                                          ? const Color(0xFFdc2626)
                                          : const Color(0xFF111827),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      )
                    else
                      const Text(
                        'Price on request',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF6b7280),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Colors.grey.shade200),
                        ),
                      ),
                      child: Row(
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
                              inStock ? 'In Stock' : 'Out of Stock',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: inStock
                                    ? const Color(0xFF166534)
                                    : const Color(0xFFb91c1c),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (inStock) ...[
                      const SizedBox(height: 16),
                      Text(
                        isInCart
                            ? 'Quantity in cart (Min: $minQty)'
                            : 'Quantity (Min: $minQty, Step: $minQty)',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF374151),
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border:
                                Border.all(color: Colors.black, width: 1.2),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Row(
                            children: [
                              _QuantityButton(
                                icon: Icons.remove,
                                onTap: displayQty <= minQty
                                    ? null
                                    : () {
                                        if (isInCart) {
                                          _changeCartQuantity(
                                            product,
                                            -minQty,
                                          );
                                        } else {
                                          _updateQuantity(
                                            product,
                                            displayQty - minQty,
                                          );
                                        }
                                      },
                                tooltip: 'Decrease by $minQty',
                                roundedLeft: true,
                              ),
                              Expanded(
                                child: Container(
                                  alignment: Alignment.center,
                                  color: Colors.white,
                                  child: Text(
                                    '$displayQty',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
                              _QuantityButton(
                                icon: Icons.add,
                                onTap: () {
                                  if (isInCart) {
                                    _changeCartQuantity(product, minQty);
                                  } else {
                                    _updateQuantity(
                                      product,
                                      displayQty + minQty,
                                    );
                                  }
                                },
                                tooltip: 'Increase by $minQty',
                                roundedRight: true,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isInCart
                            ? 'Use + / − to update cart quantity (steps of $minQty)'
                            : 'Quantity must be in multiples of $minQty',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      if (totalPrice != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 14),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border:
                                  Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Total Price',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF374151),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Row(
                                  children: [
                                    if (_showStrike(product, headerPrice) &&
                                        original != null) ...[
                                      Text(
                                        formatCurrency(original * displayQty),
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.grey.shade400,
                                          decoration:
                                              TextDecoration.lineThrough,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
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
                              ],
                            ),
                          ),
                        ),
                      // After add: only ± stepper (no "Add More to Cart").
                      if (!isInCart) ...[
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _addingToCart
                                ? null
                                : () => _addToCart(product),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFdc2626),
                              foregroundColor: Colors.white,
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              elevation: 2,
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
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Product Details card (web)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(20),
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
                    const SizedBox(height: 12),
                    for (int i = 0; i < detailItems.length; i++) ...[
                      _DetailRow(
                        label: detailItems[i].label,
                        value: detailItems[i].value,
                        valueColor: detailItems[i].valueColor,
                        valueBold: detailItems[i].valueBold,
                      ),
                      if (i != detailItems.length - 1)
                        Divider(height: 1, color: Colors.grey.shade100),
                    ],
                  ],
                ),
              ),

              // You may also like (web)
              if (cityId != null &&
                  cityId.isNotEmpty &&
                  product.product?.category?.id != null)
                _SuggestedProductsSection(
                  cityId: cityId,
                  categoryId: product.product!.category!.id,
                  excludeProductId: product.id,
                ),
            ],
          );
        },
      ),
    );
  }
}

class _SuggestedProductsSection extends ConsumerWidget {
  const _SuggestedProductsSection({
    required this.cityId,
    required this.categoryId,
    required this.excludeProductId,
  });

  final String cityId;
  final String categoryId;
  final String excludeProductId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(
      vendorProductsProvider(
        VendorProductsParams(
          cityId: cityId,
          categoryId: categoryId,
          page: 1,
          limit: 1000,
        ),
      ),
    );

    return productsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.only(top: 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You may also like',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
              ),
            ),
            SizedBox(height: 16),
            Center(child: CircularProgressIndicator(color: Color(0xFFdc2626))),
          ],
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (products) {
        final related = products
            .where((p) => p.id != excludeProductId)
            .toList()
          ..sort((a, b) {
            final seqA = a.sequenceNumber ?? 0x7fffffffffffffff;
            final seqB = b.sequenceNumber ?? 0x7fffffffffffffff;
            return seqA.compareTo(seqB);
          });
        final limited = related.take(12).toList();
        if (limited.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.only(top: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'You may also like',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 14),
              LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth;
                  final crossAxisCount = width >= 900
                      ? 5
                      : width >= 600
                          ? 3
                          : 2;
                  const spacing = 6.0;
                  final itemWidth = (width -
                          (spacing * (crossAxisCount - 1))) /
                      crossAxisCount;
                  final itemHeight = itemWidth + 96;

                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: limited.length,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      mainAxisSpacing: spacing,
                      crossAxisSpacing: spacing,
                      mainAxisExtent: itemHeight,
                    ),
                    itemBuilder: (context, index) {
                      final p = limited[index];
                      return ProductCard(
                        product: p,
                        onTap: () => context.push('/product/${p.id}'),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _OverlayIconButton extends StatelessWidget {
  const _OverlayIconButton({
    this.onPressed,
    this.icon,
    this.child,
    this.filled = false,
  });

  final VoidCallback? onPressed;
  final IconData? icon;
  final Widget? child;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? const Color(0xFFdc2626) : Colors.white,
      shape: const CircleBorder(),
      elevation: 2,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: child ??
              Icon(
                icon,
                size: 18,
                color: filled ? Colors.white : const Color(0xFF4b5563),
              ),
        ),
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
    this.roundedLeft = false,
    this.roundedRight = false,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final String tooltip;
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
        child: Tooltip(
          message: tooltip,
          child: Ink(
            width: 48,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: radius,
            ),
            child: Center(
              child: Icon(
                icon,
                size: 20,
                color: onTap == null
                    ? Colors.grey.shade500
                    : const Color(0xFF111827),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.valueBold = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final bool valueBold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF4b5563),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: 12,
                fontWeight: valueBold ? FontWeight.w700 : FontWeight.w400,
                color: valueColor ?? const Color(0xFF111827),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailItem {
  const _DetailItem({
    required this.label,
    required this.value,
    this.valueColor,
    this.valueBold = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final bool valueBold;
}
