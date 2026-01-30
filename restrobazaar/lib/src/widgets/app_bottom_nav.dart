import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

class AppBottomNav extends StatelessWidget {
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

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final selectedIndex = _indexForLocation(location);

    const selectedColor = Color(0xFFE11D48); // red tone from web
    final unselectedColor = Colors.grey.shade700;

    return BottomNavigationBar(
      currentIndex: selectedIndex,
      onTap: (index) async {
        if (index == 3) {
          await _launchWhatsapp(context);
          return;
        }
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
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.favorite_border),
          activeIcon: Icon(Icons.favorite),
          label: 'Wishlist',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_cart_outlined),
          activeIcon: Icon(Icons.shopping_cart),
          label: 'Cart',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline),
          activeIcon: Icon(Icons.chat_bubble),
          label: 'WhatsApp',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: 'Account',
        ),
      ],
    );
  }
}
