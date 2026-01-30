import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/auth_controller.dart';
import '../screens/account/account_screen.dart';
import '../screens/admin/admin_screens.dart';
import '../screens/auth/sign_in_screen.dart';
import '../screens/auth/sign_up_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/catalog/categories_screen.dart';
import '../screens/catalog/category_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/orders/orders_screen.dart';
import '../screens/product/product_detail_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/shared/splash_screen.dart';
import '../screens/static_pages/static_pages.dart';
import '../screens/vendor/vendor_screens.dart';
import '../screens/wishlist/wishlist_screen.dart';
import '../widgets/app_bottom_nav.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: GlobalKey<NavigatorState>(),
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      ShellRoute(
        builder: (context, state, child) {
          return Scaffold(
            body: child,
            bottomNavigationBar: const AppBottomNav(),
          );
        },
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/wishlist',
            builder: (context, state) => const WishlistScreen(),
          ),
          GoRoute(
            path: '/cart',
            builder: (context, state) => const CartScreen(),
          ),
          GoRoute(
            path: '/account',
            builder: (context, state) => const AccountScreen(),
          ),
          GoRoute(
            path: '/categories',
            builder: (context, state) => const CategoriesScreen(),
          ),
          GoRoute(
            path: '/category/:slug',
            builder: (context, state) {
              final slug = state.pathParameters['slug'] ?? '';
              return CategoryScreen(slug: slug);
            },
          ),
          GoRoute(
            path: '/product/:id',
            builder: (context, state) {
              final id = state.pathParameters['id'] ?? '';
              return ProductDetailScreen(productId: id);
            },
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) {
              final query = state.uri.queryParameters['q'];
              return SearchScreen(initialQuery: query);
            },
          ),
          GoRoute(
            path: '/checkout',
            builder: (context, state) => const CheckoutScreen(),
          ),
          GoRoute(
            path: '/orders',
            builder: (context, state) => const OrdersScreen(),
          ),
          GoRoute(
            path: '/about',
            builder: (context, state) => const AboutScreen(),
          ),
          GoRoute(
            path: '/contact',
            builder: (context, state) => const ContactScreen(),
          ),
          GoRoute(
            path: '/privacy-policy',
            builder: (context, state) => const PrivacyPolicyScreen(),
          ),
          GoRoute(
            path: '/terms-of-service',
            builder: (context, state) => const TermsScreen(),
          ),
          GoRoute(
            path: '/refund-policy',
            builder: (context, state) => const RefundPolicyScreen(),
          ),
          GoRoute(
            path: '/shipping-policy',
            builder: (context, state) => const ShippingPolicyScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/signin',
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignUpScreen(),
      ),
      GoRoute(
        path: '/vendor/login',
        builder: (context, state) => const VendorLoginScreen(),
      ),
      GoRoute(
        path: '/vendor/dashboard',
        builder: (context, state) => const VendorDashboardScreen(),
      ),
      GoRoute(
        path: '/super_admin/login',
        builder: (context, state) => const SuperAdminLoginScreen(),
      ),
      GoRoute(
        path: '/admin/dashboard',
        builder: (context, state) => const SuperAdminDashboardScreen(),
      ),
    ],
    redirect: (context, state) {
      final loggedIn = ref.read(authControllerProvider).isAuthenticated;
      final loggingIn =
          state.matchedLocation == '/signin' ||
          state.matchedLocation == '/signup';

      if (!loggedIn &&
          (state.matchedLocation == '/checkout' ||
              state.matchedLocation == '/orders' ||
              state.matchedLocation == '/account')) {
        return '/signin';
      }

      if (loggedIn && loggingIn) {
        return '/home';
      }

      return null;
    },
  );
});
