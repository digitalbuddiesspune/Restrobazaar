import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/catalog_providers.dart';

class CategoriesNavBar extends ConsumerStatefulWidget
    implements PreferredSizeWidget {
  const CategoriesNavBar({super.key});

  static const double _height = 46;

  @override
  Size get preferredSize => const Size.fromHeight(_height);

  @override
  ConsumerState<CategoriesNavBar> createState() => _CategoriesNavBarState();
}

class _CategoriesNavBarState extends ConsumerState<CategoriesNavBar> {
  String? _activeSlug(String location) {
    final match = RegExp(r'^/category/([^/]+)').firstMatch(location);
    return match?.group(1);
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final location = GoRouterState.of(context).uri.path;
    final activeSlug = _activeSlug(location);

    return Material(
      color: Colors.grey.shade50,
      elevation: 0,
      child: SizedBox(
        height: CategoriesNavBar._height,
        child: categoriesAsync.when(
          data: (categories) {
            if (categories.isEmpty) {
              return const SizedBox.shrink();
            }
            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final category = categories[index];
                final selected = category.slug == activeSlug;
                return GestureDetector(
                  onTap: () => context.push('/category/${category.slug}'),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color:
                          selected ? const Color(0xFFdc2626) : Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: selected
                            ? const Color(0xFFdc2626)
                            : Colors.grey.shade300,
                      ),
                      boxShadow: selected
                          ? [
                              BoxShadow(
                                color: Colors.red.withValues(alpha: 0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      category.name,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: selected
                            ? Colors.white
                            : const Color(0xFF374151),
                      ),
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(
            child: SizedBox(
              height: 16,
              width: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ),
    );
  }
}
