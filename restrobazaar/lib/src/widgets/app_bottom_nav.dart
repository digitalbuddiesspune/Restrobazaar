import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../controllers/cart_controller.dart';
import '../controllers/wishlist_controller.dart';

class AppBottomNav extends ConsumerWidget {
  const AppBottomNav({super.key});

  static const _whatsappSvg =
      '<svg viewBox="0 0 24 24" fill="currentColor">'
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>'
      '</svg>';

  int _indexForLocation(String location) {
    if (location.startsWith('/wishlist')) {
      return 1;
    }
    if (location.startsWith('/cart')) {
      return 2;
    }
    if (location.startsWith('/account') ||
        location.startsWith('/signin') ||
        location.startsWith('/signup')) {
      return 4;
    }
    return 0;
  }

  String _pathForIndex(int index) {
    switch (index) {
      case 0:
        return '/home';
      case 1:
        return '/wishlist';
      case 2:
        return '/cart';
      case 4:
      default:
        return '/account';
    }
  }

  Future<void> _launchWhatsapp(BuildContext context) async {
    final uri = Uri.parse(
      'https://wa.me/919545235223?text=Hi%2C%20I%27m%20interested%20in%20your%20products.%20Could%20you%20please%20share%20details%3F',
    );
    final canLaunch = await canLaunchUrl(uri);
    if (!canLaunch) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to open WhatsApp.')),
        );
      }
      return;
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _whatsappIcon() {
    return Builder(
      builder: (context) {
        final color = IconTheme.of(context).color ?? Colors.black;
        return SvgPicture.string(
          _whatsappSvg,
          width: 24,
          height: 24,
          colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
        );
      },
    );
  }

  Widget _badgeWrapper(Widget icon, int count) {
    if (count <= 0) {
      return icon;
    }
    final label = count > 99 ? '99+' : '$count';
    return Stack(
      clipBehavior: Clip.none,
      children: [
        icon,
        Positioned(
          top: -6,
          right: -8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            constraints: const BoxConstraints(minHeight: 18, minWidth: 18),
            decoration: BoxDecoration(
              color: const Color(0xFFE11D48),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Center(
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  BottomNavigationBarItem _navItem({
    required Widget icon,
    required String label,
    int badgeCount = 0,
    Widget? activeIcon,
  }) {
    return BottomNavigationBarItem(
      icon: _badgeWrapper(icon, badgeCount),
      activeIcon: _badgeWrapper(activeIcon ?? icon, badgeCount),
      label: label,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.path;
    final selectedIndex = _indexForLocation(location);
    final cartCount =
        ref.watch(cartControllerProvider.select((state) => state.items.length));
    final wishlistCount = ref.watch(
      wishlistControllerProvider.select((state) => state.items.length),
    );

    const selectedColor = Color(0xFFE11D48); // red tone from web
    final unselectedColor = Colors.grey.shade700;

    final bottomInset = MediaQuery.of(context).padding.bottom;
    const baseHeight = 72.0;

    Widget navItem({
      required int index,
      required String label,
      required Widget icon,
      int badgeCount = 0,
      Widget? activeIcon,
      required VoidCallback onTap,
    }) {
      final isSelected = selectedIndex == index;
      final color = isSelected ? selectedColor : unselectedColor;
      return Expanded(
        child: InkWell(
          onTap: onTap,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconTheme(
                data: IconThemeData(color: color, size: 24),
                child: _badgeWrapper(activeIcon ?? icon, badgeCount),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      height: baseHeight + bottomInset,
      padding: EdgeInsets.only(bottom: bottomInset, top: 6),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE5E7EB)),
        ),
      ),
      child: Row(
        children: [
          navItem(
            index: 0,
            label: 'Home',
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            onTap: () {
              final target = _pathForIndex(0);
              if (target != location) {
                context.go(target);
              }
            },
          ),
          navItem(
            index: 1,
            label: 'Wishlist',
            icon: const Icon(Icons.favorite_border),
            activeIcon: const Icon(Icons.favorite),
            badgeCount: wishlistCount,
            onTap: () {
              final target = _pathForIndex(1);
              if (target != location) {
                context.go(target);
              }
            },
          ),
          navItem(
            index: 2,
            label: 'Cart',
            icon: const Icon(Icons.shopping_cart_outlined),
            activeIcon: const Icon(Icons.shopping_cart),
            badgeCount: cartCount,
            onTap: () {
              final target = _pathForIndex(2);
              if (target != location) {
                context.go(target);
              }
            },
          ),
          navItem(
            index: 3,
            label: 'WhatsApp',
            icon: _whatsappIcon(),
            onTap: () async {
              await _launchWhatsapp(context);
            },
          ),
          navItem(
            index: 4,
            label: 'Account',
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            onTap: () {
              final target = _pathForIndex(4);
              if (target != location) {
                context.go(target);
              }
            },
          ),
        ],
      ),
    );
  }
}
