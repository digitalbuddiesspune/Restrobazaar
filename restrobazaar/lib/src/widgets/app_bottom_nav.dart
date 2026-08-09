import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/cart_controller.dart';
import '../controllers/wishlist_controller.dart';
import 'cart_badge_icon.dart';

class AppBottomNav extends ConsumerWidget {
  const AppBottomNav({super.key});

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
      return 3;
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
      case 3:
      default:
        return '/account';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.path;
    final selectedIndex = _indexForLocation(location);
    final cartCount = ref.watch(cartControllerProvider).totalItems;
    final wishlistCount =
        ref.watch(wishlistControllerProvider).items.length;

    const selectedColor = Color(0xFFE11D48); // red tone from web
    final unselectedColor = Colors.grey.shade700;

    return BottomNavigationBar(
      currentIndex: selectedIndex,
      onTap: (index) {
        final target = _pathForIndex(index);
        if (target != location) {
          context.go(target);
        }
      },
      type: BottomNavigationBarType.fixed,
      backgroundColor: Colors.white,
      selectedItemColor: selectedColor,
      unselectedItemColor: unselectedColor,
      selectedLabelStyle: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
      unselectedLabelStyle: const TextStyle(
        fontWeight: FontWeight.w600,
        fontSize: 13,
      ),
      items: [
        const BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: NavCountBadgeIcon(
            count: wishlistCount,
            icon: Icons.favorite_border,
            color: unselectedColor,
          ),
          activeIcon: NavCountBadgeIcon(
            count: wishlistCount,
            icon: Icons.favorite,
            color: selectedColor,
          ),
          label: 'Wishlist',
        ),
        BottomNavigationBarItem(
          icon: CartBadgeIcon(
            count: cartCount,
            outlined: true,
            color: unselectedColor,
          ),
          activeIcon: CartBadgeIcon(
            count: cartCount,
            outlined: false,
            color: selectedColor,
          ),
          label: 'Cart',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: 'Account',
        ),
      ],
    );
  }
}
