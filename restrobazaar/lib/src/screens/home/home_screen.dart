import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/catalog_providers.dart';
import '../../controllers/city_controller.dart';
import '../../models/category.dart';
import '../../widgets/city_selector_sheet.dart';

const _mobileHeroBanner =
    'https://res.cloudinary.com/debhhnzgh/image/upload/v1766925734/IMG_20251228_181115_c6o3io.png';
const _customPrintingBackground =
    'https://res.cloudinary.com/debhhnzgh/image/upload/v1766044565/ecofriendly-food-packaging-items-paper-cups-plates-containers-catering-street-fast_baydeb.jpg';

const _green600 = Color(0xFF16A34A);
const _emerald600 = Color(0xFF059669);
const _purple600 = Color(0xFF9333EA);
const _orange600 = Color(0xFFEA580C);

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final cityState = ref.watch(cityControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('RestroBazaar'),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            onPressed: () => context.push('/cart'),
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoriesProvider);
          ref.invalidate(cityControllerProvider);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            _CityBanner(
              selectedCity: cityState.selected?.displayName,
              onSelectCity: () {
                showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => const CitySelectorSheet(),
                );
              },
            ),
            const _HeroImage(),
            _CategoriesSection(categoriesAsync: categoriesAsync),
            const _QualitySection(),
            const _IndustriesSection(),
            const _CustomPrintingSection(),
            const _TestimonialsSection(),
            const _FaqSection(),
          ],
        ),
      ),
    );
  }
}

class _CityBanner extends StatelessWidget {
  const _CityBanner({required this.selectedCity, required this.onSelectCity});

  final String? selectedCity;
  final VoidCallback onSelectCity;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.red.withValues(alpha: 0.15)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFfee2e2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.location_on_outlined,
                color: Color(0xFFe11d48),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Deliver to',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.grey.shade900,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    selectedCity ?? 'Select your city to see products near you',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade700,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(onPressed: onSelectCity, child: const Text('Change')),
          ],
        ),
      ),
    );
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: CachedNetworkImage(
            imageUrl: _mobileHeroBanner,
            fit: BoxFit.cover,
            placeholder: (context, _) => Container(color: Colors.grey.shade200),
            errorWidget: (_, __, ___) => Container(
              color: Colors.grey.shade200,
              alignment: Alignment.center,
              child: const Icon(Icons.broken_image_outlined),
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoriesSection extends StatelessWidget {
  const _CategoriesSection({required this.categoriesAsync});

  final AsyncValue<List<CategoryModel>> categoriesAsync;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade50,
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFfee2e2),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'Shop by Category',
                    style: TextStyle(
                      color: Color(0xFFe11d48),
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Explore our categories',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Quick access to all supply categories for your restaurant and catering needs.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade700,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          categoriesAsync.when(
            data: (categories) {
              if (categories.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: Text('No categories available')),
                );
              }
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: categories.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.9,
                  ),
                  itemBuilder: (context, index) {
                    final category = categories[index];
                    return GestureDetector(
                      onTap: () => context.push('/category/${category.slug}'),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 12,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(14),
                                ),
                                child: CachedNetworkImage(
                                  imageUrl:
                                      category.image ??
                                      'https://via.placeholder.com/300x200?text=Category',
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  placeholder: (_, __) =>
                                      Container(color: Colors.grey.shade200),
                                  errorWidget: (_, __, ___) =>
                                      Container(color: Colors.grey.shade200),
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(10),
                              child: Text(
                                category.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text(error.toString()),
            ),
          ),
        ],
      ),
    );
  }
}

class _QualitySection extends StatelessWidget {
  const _QualitySection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFfee2e2),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text(
                'Quality Features',
                style: TextStyle(
                  color: Color(0xFFe11d48),
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: 'Why Choose '),
                  const TextSpan(
                    text: 'RestroBazaar ',
                    style: TextStyle(color: Color(0xFFe11d48)),
                  ),
                  const TextSpan(text: 'Packaging'),
                ],
              ),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade900,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: SizedBox(
              width: 420,
              child: Text(
                'High-quality, hygienic, and reliable food packaging solutions trusted by food businesses across all scales.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _qualityFeatures.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.95,
            ),
            itemBuilder: (context, index) {
              final feature = _qualityFeatures[index];
              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: feature.accentColor.withValues(alpha: 0.2),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: feature.accentColor.withValues(alpha: 0.12),
                      blurRadius: 12,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: feature.accentColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(feature.icon, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      feature.title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      feature.description,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade700,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      height: 4,
                      width: 50,
                      decoration: BoxDecoration(
                        color: feature.accentColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _IndustriesSection extends StatelessWidget {
  const _IndustriesSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'Industries We Serve',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'RestroBazaar caters to a wide range of industries including cloud kitchens, restaurants, bakeries, sweet shops, and catering services.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade700,
                height: 1.45,
              ),
            ),
          ),
          const SizedBox(height: 16),
          CarouselSlider(
            options: CarouselOptions(
              height: 260,
              viewportFraction: 0.55,
              enableInfiniteScroll: true,
              autoPlay: true,
              autoPlayInterval: const Duration(seconds: 3),
              enlargeCenterPage: true,
            ),
            items: _industries.map((industry) {
              return Builder(
                builder: (context) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: CachedNetworkImage(
                              imageUrl: industry.image,
                              fit: BoxFit.contain,
                              width: double.infinity,
                              placeholder: (_, __) =>
                                  Container(color: Colors.grey.shade200),
                              errorWidget: (_, __, ___) =>
                                  Container(color: Colors.grey.shade200),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          child: Text(
                            industry.name,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _CustomPrintingSection extends StatelessWidget {
  const _CustomPrintingSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFfee2e2),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Brand Packaging',
              style: TextStyle(
                color: Color(0xFFe11d48),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Custom Printing & Brand Packaging',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Want your brand on every order?',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade700,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          Column(
            children: _customPrintingFeatures.map((feature) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFfee2e2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(feature.icon, color: const Color(0xFFe11d48)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            feature.title,
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            feature.description,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Colors.grey.shade700,
                                  height: 1.45,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          Stack(
            children: [
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  image: DecorationImage(
                    image: CachedNetworkImageProvider(
                      _customPrintingBackground,
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        'Stand out and build brand recall with professional packaging.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Transform your packaging into a powerful marketing tool that reinforces your brand identity with every order.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        alignment: WrapAlignment.center,
                        children: [
                          FilledButton(
                            onPressed: () => context.push('/categories'),
                            child: const Text('Explore Categories'),
                          ),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white),
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.1,
                              ),
                            ),
                            onPressed: () => context.push('/contact'),
                            child: const Text('Get Quote'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TestimonialsSection extends StatelessWidget {
  const _TestimonialsSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade50,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFfee2e2),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'What Our Customers Say',
              style: TextStyle(
                color: Color(0xFFe11d48),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Customer Testimonials',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 420,
            child: Text(
              'Hear from restaurant owners and catering professionals who trust RestroBazaar for their supply needs.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 16),
          CarouselSlider(
            options: CarouselOptions(
              height: 330,
              autoPlay: true,
              viewportFraction: 0.9,
              enlargeCenterPage: true,
            ),
            items: _testimonials.map((testimonial) {
              return Builder(
                builder: (context) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFfee2e2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.format_quote,
                            color: Color(0xFFe11d48),
                          ),
                        ),
                        const SizedBox(height: 10),
                        _RatingStars(rating: testimonial.rating),
                        const SizedBox(height: 12),
                        Expanded(
                          child: Text(
                            '"${testimonial.text}"',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Colors.grey.shade800,
                                  height: 1.5,
                                ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 26,
                              backgroundImage: CachedNetworkImageProvider(
                                testimonial.image,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  testimonial.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  testimonial.role,
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                                Text(
                                  testimonial.location,
                                  style: TextStyle(color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _RatingStars extends StatelessWidget {
  const _RatingStars({required this.rating});

  final int rating;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(
        5,
        (index) => Icon(
          index < rating ? Icons.star : Icons.star_border,
          color: Colors.amber.shade500,
          size: 20,
        ),
      ),
    );
  }
}

class _FaqSection extends StatefulWidget {
  const _FaqSection();

  @override
  State<_FaqSection> createState() => _FaqSectionState();
}

class _FaqSectionState extends State<_FaqSection> {
  int? openIndex;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade50,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFfee2e2),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'FAQs',
              style: TextStyle(
                color: Color(0xFFe11d48),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Frequently Asked Questions',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 420,
            child: Text(
              'Find answers to common questions about our products and services.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 14),
          ..._faqItems.asMap().entries.map((entry) {
            final idx = entry.key;
            final item = entry.value;
            final isOpen = openIndex == idx;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ExpansionTile(
                tilePadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 4,
                ),
                initiallyExpanded: isOpen,
                onExpansionChanged: (open) {
                  setState(() {
                    openIndex = open ? idx : null;
                  });
                },
                title: Text(
                  item.question,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                trailing: Icon(
                  isOpen
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                ),
                childrenPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      item.answer,
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _QualityFeature {
  const _QualityFeature({
    required this.title,
    required this.description,
    required this.icon,
    required this.accentColor,
  });

  final String title;
  final String description;
  final IconData icon;
  final Color accentColor;
}

class _IndustryItem {
  const _IndustryItem({required this.name, required this.image});

  final String name;
  final String image;
}

class _CustomPrintingFeature {
  const _CustomPrintingFeature({
    required this.title,
    required this.description,
    required this.icon,
  });

  final String title;
  final String description;
  final IconData icon;
}

class _Testimonial {
  const _Testimonial({
    required this.name,
    required this.role,
    required this.location,
    required this.image,
    required this.rating,
    required this.text,
  });

  final String name;
  final String role;
  final String location;
  final String image;
  final int rating;
  final String text;
}

class _FaqItem {
  const _FaqItem({required this.question, required this.answer});

  final String question;
  final String answer;
}

const List<_QualityFeature> _qualityFeatures = [
  _QualityFeature(
    title: 'Cost-Effective Single-Use Solutions',
    description: 'Premium quality at competitive pricing.',
    icon: Icons.sell_outlined,
    accentColor: _green600,
  ),
  _QualityFeature(
    title: 'Eco-Conscious Packaging',
    description: 'Sustainable, biodegradable choices.',
    icon: Icons.eco_outlined,
    accentColor: _emerald600,
  ),
  _QualityFeature(
    title: 'Professional Brand Presentation',
    description: 'Clean, premium visual appeal.',
    icon: Icons.workspace_premium_outlined,
    accentColor: _purple600,
  ),
  _QualityFeature(
    title: 'Durable, Leak-Proof & Reliable',
    description: 'Strong, spill-resistant build.',
    icon: Icons.inventory_2_outlined,
    accentColor: _orange600,
  ),
];

const List<_IndustryItem> _industries = [
  _IndustryItem(
    name: 'Cloud Kitchen',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766062995/c3817246-47a0-4c48-a66e-120099356b54.png',
  ),
  _IndustryItem(
    name: 'Bakery',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766060009/f4496f0e-58c1-4bda-9e4d-9561c01d9efc.png',
  ),
  _IndustryItem(
    name: 'Events & Party',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766918991/4d7a93e0-f603-41e3-8c06-43b04a976d57.png',
  ),
  _IndustryItem(
    name: 'Sweet Shop',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766060148/32807156-ab45-4d55-a9e5-27520a626dfd.png',
  ),
  _IndustryItem(
    name: 'Restaurant',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766063511/0deeafed-28b8-4c18-8951-3892b2f25e2a.png',
  ),
  _IndustryItem(
    name: 'Food Corner',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766919600/c21f5119-0a53-4bae-813d-46357f59ea4a.png',
  ),
  _IndustryItem(
    name: 'Catering Services',
    image:
        'https://res.cloudinary.com/debhhnzgh/image/upload/v1766061568/5e8cc28a-e115-411f-96b5-76c55dabda45.png',
  ),
];

const List<_CustomPrintingFeature> _customPrintingFeatures = [
  _CustomPrintingFeature(
    title: 'Custom logo printing',
    description:
        'Get your logo, brand colors, and messaging printed on containers, bags, cups, and more.',
    icon: Icons.print_rounded,
  ),
  _CustomPrintingFeature(
    title: 'Food-grade ink & materials',
    description:
        'All printing uses food-safe, non-toxic inks and materials that meet health standards.',
    icon: Icons.verified_outlined,
  ),
  _CustomPrintingFeature(
    title: 'Ideal for takeaway, delivery',
    description:
        'Perfect for building brand recognition across all customer touchpoints.',
    icon: Icons.delivery_dining,
  ),
];

const List<_Testimonial> _testimonials = [
  _Testimonial(
    name: 'Rajesh Kumar',
    role: 'Restaurant Owner',
    location: 'Mumbai, Maharashtra',
    image:
        'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=ef4444&color=fff&size=128',
    rating: 5,
    text:
        'RestroBazaar has been a game-changer for my restaurant. The quality of products is exceptional and delivery is always on time. Highly recommended!',
  ),
  _Testimonial(
    name: 'Priya Sharma',
    role: 'Catering Manager',
    location: 'Delhi, NCR',
    image:
        'https://ui-avatars.com/api/?name=Priya+Sharma&background=ef4444&color=fff&size=128',
    rating: 5,
    text:
        'The variety of products available is amazing. From containers to custom printing, everything we need is in one place with top-notch customer service!',
  ),
  _Testimonial(
    name: 'Amit Patel',
    role: 'Cafe Owner',
    location: 'Ahmedabad, Gujarat',
    image:
        'https://ui-avatars.com/api/?name=Amit+Patel&background=ef4444&color=fff&size=128',
    rating: 5,
    text:
        'Best supplier we\'ve worked with! The prices are competitive and quality never disappoints. Our customers absolutely love the eco-friendly packaging options.',
  ),
  _Testimonial(
    name: 'Kavita Reddy',
    role: 'Hotel Manager',
    location: 'Bangalore, Karnataka',
    image:
        'https://ui-avatars.com/api/?name=Kavita+Reddy&background=ef4444&color=fff&size=128',
    rating: 5,
    text:
        'RestroBazaar understands the needs of the hospitality industry perfectly. Their products are reliable and the bulk ordering process is completely seamless.',
  ),
  _Testimonial(
    name: 'Vikram Singh',
    role: 'Food Truck Owner',
    location: 'Pune, Maharashtra',
    image:
        'https://ui-avatars.com/api/?name=Vikram+Singh&background=ef4444&color=fff&size=128',
    rating: 5,
    text:
        'As a food truck owner, I need quality supplies at affordable prices. RestroBazaar delivers exactly that and the custom printing feature is a great bonus!',
  ),
  _Testimonial(
    name: 'Anjali Desai',
    role: 'Event Caterer',
    location: 'Surat, Gujarat',
    image:
        'https://ui-avatars.com/api/?name=Anjali+Desai&background=ef4444&color=fff&size=128',
    rating: 5,
    text:
        'The packaging solutions are perfect for our events with professional appearance and great quality. RestroBazaar has become our trusted go-to supplier!',
  ),
];

const List<_FaqItem> _faqItems = [
  _FaqItem(
    question: 'Do you supply packaging for bulk orders?',
    answer:
        'Yes, we support bulk and repeat orders for restaurants and cloud kitchens.',
  ),
  _FaqItem(
    question: 'Are your products food-safe?',
    answer:
        'Absolutely. All our products are food-grade and meet safety standards.',
  ),
  _FaqItem(
    question: 'Do you provide customized packaging?',
    answer:
        'Yes, we offer customized packaging solutions for branding requirements.',
  ),
  _FaqItem(
    question: 'Do you offer eco-friendly packaging options?',
    answer:
        'Yes, sustainable and eco-friendly packaging options are available.',
  ),
  _FaqItem(
    question: 'Who can buy from RestroBazaar?',
    answer:
        'Restaurants, cafés, cloud kitchens, bakeries, and food service businesses.',
  ),
];
