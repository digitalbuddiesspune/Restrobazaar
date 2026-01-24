import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../controllers/catalog_providers.dart';
import '../../controllers/city_controller.dart';
import '../../models/category.dart';
import '../../widgets/restrobazaar_logo.dart';
import '../../widgets/city_selector_sheet.dart';

const _heroCarouselImages = [
  'assets/images/carouselImages/carouselImage1.png',
  'assets/images/carouselImages/carouselImage2.jpg',
  // 'assets/images/carouselImages/carouselImage3.png',
];
const _customPrintingBackground =
    'https://res.cloudinary.com/debhhnzgh/image/upload/v1766044565/ecofriendly-food-packaging-items-paper-cups-plates-containers-catering-street-fast_baydeb.jpg';

const _green600 = Color(0xFF16A34A);
const _emerald600 = Color(0xFF059669);
const _purple600 = Color(0xFF9333EA);
const _orange600 = Color(0xFFEA580C);

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _didPromptCity = false;

  @override
  Widget build(BuildContext context) {
    ref.listen<CityState>(cityControllerProvider, (previous, next) {
      if (_didPromptCity || !mounted) return;
      final hasSelection = next.selected != null;
      final hasCities = next.available.isNotEmpty;
      if (!hasSelection && hasCities) {
        _didPromptCity = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            builder: (_) => const CitySelectorSheet(),
          );
        });
      }
    });

    final categoriesAsync = ref.watch(categoriesProvider);
    final cityState = ref.watch(cityControllerProvider);

    if (!_didPromptCity &&
        cityState.selected == null &&
        cityState.available.isNotEmpty) {
      _didPromptCity = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          builder: (_) => const CitySelectorSheet(),
        );
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const RestroBazaarLogo(height: 32),
        actions: [
          IconButton(
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            onPressed: () => context.go('/cart'),
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
            const _HeroCarousel(),
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

class _HeroCarousel extends StatefulWidget {
  const _HeroCarousel();

  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  int _activeIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: SizedBox(
          height: 260,
          child: Stack(
            children: [
              CarouselSlider(
                items: _heroCarouselImages
                    .map(
                      (path) => Image.asset(
                        path,
                        fit: BoxFit.cover,
                        width: double.infinity,
                      ),
                    )
                    .toList(),
                options: CarouselOptions(
                  viewportFraction: 1,
                  autoPlay: true,
                  autoPlayInterval: const Duration(seconds: 4),
                  autoPlayAnimationDuration: const Duration(milliseconds: 700),
                  enableInfiniteScroll: _heroCarouselImages.length > 1,
                  onPageChanged: (index, _) {
                    if (!mounted) return;
                    setState(() => _activeIndex = index);
                  },
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 14,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_heroCarouselImages.length, (index) {
                    final isActive = index == _activeIndex;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 6,
                      width: isActive ? 18 : 6,
                      decoration: BoxDecoration(
                        color: isActive
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(99),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ],
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
                    crossAxisCount: 3,
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
                                  fontWeight: FontWeight.w600,
                                  fontSize: 11,
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
              mainAxisExtent: 220,
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
                      child: SvgPicture.string(
                        feature.iconSvg,
                        height: 24,
                        width: 24,
                        colorFilter: const ColorFilter.mode(
                          Colors.white,
                          BlendMode.srcIn,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      feature.title,
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      feature.description,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
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

class _IndustriesSection extends StatefulWidget {
  const _IndustriesSection();

  @override
  State<_IndustriesSection> createState() => _IndustriesSectionState();
}

class _IndustriesSectionState extends State<_IndustriesSection>
    with SingleTickerProviderStateMixin {
  static const double _marqueeHeight = 180;
  static const double _marqueeSpeed = 35; // pixels per second

  late final ScrollController _scrollController;
  late final Ticker _ticker;
  Duration? _lastTick;
  double _offset = 0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _ticker = createTicker(_onTick)..start();
  }

  void _onTick(Duration elapsed) {
    if (!_scrollController.hasClients) return;
    if (_lastTick == null) {
      _lastTick = elapsed;
      return;
    }
    final deltaSeconds =
        (elapsed - _lastTick!).inMilliseconds.clamp(0, 100) / 1000;
    _lastTick = elapsed;
    final max = _scrollController.position.maxScrollExtent;
    if (max <= 0) return;
    _offset += _marqueeSpeed * deltaSeconds;
    if (_offset >= max) {
      _offset = 0;
    }
    _scrollController.jumpTo(_offset);
  }

  @override
  void dispose() {
    _ticker.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final marqueeItems = List.generate(
      _industries.length * 2,
      (index) => _industries[index % _industries.length],
    );

    return Container(
      color: Colors.white,
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
            child: Text.rich(
              TextSpan(
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                  height: 1.45,
                ),
                children: const [
                  TextSpan(
                    text:
                        'RestroBazaar caters to a wide range of industries, which include brands from the ',
                  ),
                  TextSpan(
                    text:
                        'Cloud Kitchen, Restaurants, Bakeries, Sweet Shops, Catering Services, Household Supply, Medical and Hygiene',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  TextSpan(
                    text:
                        ', and more. At ',
                  ),
                  TextSpan(
                    text: 'RestroBazaar',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  TextSpan(
                    text:
                        ', we provide the best quality ',
                  ),
                  TextSpan(
                    text: 'food packaging boxes and products',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  TextSpan(text: '.'),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: _marqueeHeight,
            child: ListView.separated(
              controller: _scrollController,
              physics: const NeverScrollableScrollPhysics(),
              scrollDirection: Axis.horizontal,
              itemCount: marqueeItems.length,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              separatorBuilder: (_, __) => const SizedBox(width: 18),
              itemBuilder: (context, index) {
                final industry = marqueeItems[index];
                return SizedBox(
                  width: 220,
                  child: Column(
                    children: [
                      Expanded(
                        child: CachedNetworkImage(
                          imageUrl: industry.image,
                          fit: BoxFit.contain,
                          placeholder: (_, __) =>
                              Container(color: Colors.grey.shade200),
                          errorWidget: (_, __, ___) =>
                              Container(color: Colors.grey.shade200),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        industry.name,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CustomPrintingSection extends StatelessWidget {
  const _CustomPrintingSection();

  Future<void> _launchExternal(BuildContext context, Uri uri) async {
    final canLaunch = await canLaunchUrl(uri);
    if (!canLaunch) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open link on this device.')),
      );
      return;
    }
    await launchUrl(uri, mode: LaunchMode.platformDefault);
  }

  @override
  Widget build(BuildContext context) {
    final callUri = Uri(scheme: 'tel', path: '9545235223');
    final whatsappUri = Uri.parse(
      'https://wa.me/919545235223?text=Hi%2C%20I%27m%20interested%20in%20custom%20printing%2Fbranding%20on%20your%20product.%20Could%20you%20please%20share%20a%20quote%3F',
    );

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
          Text.rich(
            TextSpan(
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade900,
              ),
              children: const [
                TextSpan(text: 'Custom Printing & '),
                TextSpan(
                  text: 'Brand Packaging',
                  style: TextStyle(color: Color(0xFFE7000B)),
                ),
              ],
            ),
            textAlign: TextAlign.center,
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
                      child: SvgPicture.string(
                        feature.iconSvg,
                        height: 24,
                        width: 24,
                        colorFilter: const ColorFilter.mode(
                          Color(0xFFe11d48),
                          BlendMode.srcIn,
                        ),
                      ),
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
                            onPressed: () async =>
                                _launchExternal(context, callUri),
                            child: const Text('Call Us'),
                          ),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white),
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.1,
                              ),
                            ),
                            onPressed: () async =>
                                _launchExternal(context, whatsappUri),
                            child: const Text('Whatsapp Us'),
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
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFfee2e2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: SvgPicture.string(
                            _quoteIconSvg,
                            width: 32,
                            height: 32,
                            colorFilter: const ColorFilter.mode(
                              Color(0xFFe11d48),
                              BlendMode.srcIn,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
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
                        const SizedBox(height: 16),
                        Divider(color: Colors.grey.shade200),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFFfee2e2),
                              ),
                              child: const Icon(
                                Icons.person,
                                color: Color(0xFFe11d48),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
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
                                    style: TextStyle(
                                      color: Colors.grey.shade700,
                                    ),
                                  ),
                                  Text(
                                    testimonial.location,
                                    style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
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
          const SizedBox(height: 12),
          Text.rich(
            TextSpan(
              children: [
                const TextSpan(text: 'Frequently Asked '),
                TextSpan(
                  text: 'Questions',
                  style: TextStyle(color: Colors.red.shade600),
                ),
              ],
            ),
            textAlign: TextAlign.center,
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
          const SizedBox(height: 16),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Column(
              children: _faqItems.asMap().entries.map((entry) {
                final idx = entry.key;
                final item = entry.value;
                final isOpen = openIndex == idx;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
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
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () {
                        setState(() {
                          openIndex = isOpen ? null : idx;
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Text(
                                    item.question,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                ),
                                AnimatedRotation(
                                  duration: const Duration(milliseconds: 200),
                                  turns: isOpen ? 0.5 : 0,
                                  child: const Icon(
                                    Icons.expand_more,
                                    color: Color(0xFFe11d48),
                                  ),
                                ),
                              ],
                            ),
                            AnimatedCrossFade(
                              firstChild: const SizedBox.shrink(),
                              secondChild: Padding(
                                padding: const EdgeInsets.only(top: 10),
                                child: Text(
                                  item.answer,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: Colors.grey.shade700,
                                        height: 1.5,
                                      ),
                                ),
                              ),
                              crossFadeState: isOpen
                                  ? CrossFadeState.showSecond
                                  : CrossFadeState.showFirst,
                              duration: const Duration(milliseconds: 200),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _QualityFeature {
  const _QualityFeature({
    required this.title,
    required this.description,
    required this.iconSvg,
    required this.accentColor,
  });

  final String title;
  final String description;
  final String iconSvg;
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
    required this.iconSvg,
  });

  final String title;
  final String description;
  final String iconSvg;
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

const _quoteIconSvg = '''
<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
</svg>
''';

const List<_QualityFeature> _qualityFeatures = [
  _QualityFeature(
    title: 'Cost-Effective Single-Use Solutions',
    description: 'Premium quality at competitive pricing.',
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.57.393A9.065 9.065 0 0121 18.5M5 14.5l-1.57.393A9.065 9.065 0 003 18.5m15.75-4.196v5.714a2.25 2.25 0 01-.659 1.591L15 22.5m-10.5 0l-1.57-.393A9.065 9.065 0 013 18.5m15.75-4.196V18.5" />
</svg>
''',
    accentColor: _green600,
  ),
  _QualityFeature(
    title: 'Eco-Conscious Packaging',
    description: 'Sustainable, biodegradable choices.',
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
</svg>
''',
    accentColor: _emerald600,
  ),
  _QualityFeature(
    title: 'Professional Brand Presentation',
    description: 'Clean, premium visual appeal.',
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
</svg>
''',
    accentColor: _purple600,
  ),
  _QualityFeature(
    title: 'Durable, Leak-Proof & Reliable',
    description: 'Strong, spill-resistant build.',
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
</svg>
''',
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
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
</svg>
''',
  ),
  _CustomPrintingFeature(
    title: 'Food-grade ink & materials',
    description:
        'All printing uses food-safe, non-toxic inks and materials that meet health standards.',
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
</svg>
''',
  ),
  _CustomPrintingFeature(
    title: 'Ideal for takeaway, delivery',
    description:
        'Perfect for building brand recognition across all customer touchpoints.',
    iconSvg: '''
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
</svg>
''',
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
