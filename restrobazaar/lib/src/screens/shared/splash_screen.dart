import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../controllers/cart_controller.dart';
import '../../controllers/city_controller.dart';
import '../../controllers/wishlist_controller.dart';
import '../../widgets/restrobazaar_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _bootstrap();
    });
  }

  Future<void> _bootstrap() async {
    final auth = ref.read(authControllerProvider.notifier);
    final cart = ref.read(cartControllerProvider.notifier);
    final city = ref.read(cityControllerProvider.notifier);
    final wishlist = ref.read(wishlistControllerProvider.notifier);

    await Future.wait([
      auth.restoreSession(),
      cart.loadCart(),
      city.loadCities(),
    ]);

    await wishlist.loadWishlist();

    if (mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const RestroBazaarLogo(height: 72),
            const SizedBox(height: 12),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
