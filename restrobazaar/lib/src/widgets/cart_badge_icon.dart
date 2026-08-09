import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/cart_controller.dart';

/// Cart icon with live item-count badge (app bar / nav).
class CartBadgeIconButton extends ConsumerWidget {
  const CartBadgeIconButton({
    super.key,
    this.onPressed,
    this.color,
  });

  final VoidCallback? onPressed;
  final Color? color;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(cartControllerProvider).totalItems;
    return IconButton(
      onPressed: onPressed ?? () => context.go('/cart'),
      tooltip: 'Cart',
      icon: CartBadgeIcon(count: count, color: color),
    );
  }
}

class CartBadgeIcon extends StatelessWidget {
  const CartBadgeIcon({
    super.key,
    required this.count,
    this.color,
    this.size = 24,
    this.outlined = true,
  });

  final int count;
  final Color? color;
  final double size;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    return NavCountBadgeIcon(
      count: count,
      color: color,
      size: size,
      icon: outlined ? Icons.shopping_cart_outlined : Icons.shopping_cart,
    );
  }
}

/// Generic nav icon with a red count badge (cart, wishlist, etc.).
class NavCountBadgeIcon extends StatelessWidget {
  const NavCountBadgeIcon({
    super.key,
    required this.count,
    required this.icon,
    this.color,
    this.size = 24,
  });

  final int count;
  final IconData icon;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final child = Icon(icon, size: size, color: color);
    if (count <= 0) return child;

    final label = count > 99 ? '99+' : '$count';
    return Badge(
      label: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: Colors.white,
          height: 1,
        ),
      ),
      backgroundColor: const Color(0xFFdc2626),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      alignment: AlignmentDirectional.topEnd,
      offset: const Offset(6, -6),
      child: child,
    );
  }
}
