import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../controllers/auth_controller.dart';
import '../../models/user.dart';
import '../../widgets/categories_nav_bar.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  static const _accent = Color(0xFFdc2626);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authControllerProvider.notifier).refreshUser(force: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;

    if (authState.loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('My Account'),
          bottom: const CategoriesNavBar(),
        ),
        backgroundColor: Colors.grey.shade50,
        body: const _LoadingAccount(),
      );
    }

    if (!authState.isAuthenticated || user == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('My Account'),
          bottom: const CategoriesNavBar(),
        ),
        backgroundColor: Colors.grey.shade50,
        body: _AuthPrompt(
          onSignin: () => context.push('/signin'),
          onSignup: () => context.push('/signup'),
        ),
      );
    }

    return WillPopScope(
      onWillPop: () async {
        if (context.canPop()) return true;
        context.go('/home');
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Account'),
          bottom: const CategoriesNavBar(),
        ),
        backgroundColor: Colors.grey.shade50,
        body: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            children: [
              _HeaderCard(
                user: user,
                onLogout: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) context.go('/signin');
                },
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Personal Information',
                children: [
                  _InfoTile(
                    icon: Icons.person,
                    label: 'Full Name',
                    value: user.name,
                  ),
                  _InfoTile(
                    icon: Icons.email_outlined,
                    label: 'Email Address',
                    value: user.email ?? 'Add your email',
                  ),
                  _InfoTile(
                    icon: Icons.phone_outlined,
                    label: 'Phone Number',
                    value: user.phone?.isNotEmpty == true
                        ? user.phone!
                        : 'Add phone number',
                  ),
                  _InfoTile(
                    icon: Icons.receipt_long_outlined,
                    label: 'GST Number',
                    value: user.gstNumber?.trim().isNotEmpty == true
                        ? user.gstNumber!.trim()
                        : 'Not provided',
                  ),
                  if (user.city?.isNotEmpty == true)
                    _InfoTile(
                      icon: Icons.location_on_outlined,
                      label: 'City',
                      value: user.city!,
                    ),
                ],
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Account Details',
                children: [
                  _InfoTile(
                    icon: Icons.calendar_today_outlined,
                    label: 'Account Created',
                    value: _formatDate(user.createdAt),
                  ),
                  _InfoTile(
                    icon: Icons.badge_outlined,
                    label: 'User ID',
                    value: user.id,
                    isMono: true,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _QuickActionsCard(
                actions: [
                  _ActionButton(
                    icon: Icons.receipt_long_outlined,
                    label: 'View Orders',
                    onTap: () => context.go('/orders'),
                  ),
                  _ActionButton(
                    icon: Icons.shopping_cart_outlined,
                    label: 'View Cart',
                    onTap: () => context.go('/cart'),
                  ),
                  _ActionButton(
                    icon: Icons.favorite_border,
                    label: 'Wishlist',
                    onTap: () => context.go('/wishlist'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.user, required this.onLogout});

  final UserModel user;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: _AccountScreenState._accent.withOpacity(0.1),
            child: Text(
              _initials(user.name),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: _AccountScreenState._accent,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Account',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                // Text(
                //   'Manage your account information and preferences',
                //   style: TextStyle(
                //     color: Colors.grey.shade700,
                //   ),
                // ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _AccountScreenState._accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    user.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: _AccountScreenState._accent,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            onPressed: onLogout,
            style: ElevatedButton.styleFrom(
              backgroundColor: _AccountScreenState._accent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Logout',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final maxWidth = constraints.maxWidth;
          final isWide = maxWidth > 640;
          final itemWidth = isWide ? (maxWidth - 12) / 2 : maxWidth;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: children
                    .map((child) => SizedBox(width: itemWidth, child: child))
                    .toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    this.isMono = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool isMono;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            height: 36,
            width: 36,
            decoration: BoxDecoration(
              color: _AccountScreenState._accent.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: _AccountScreenState._accent),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6b7280),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value.isNotEmpty ? value : 'Not provided',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontFamily: isMono ? 'monospace' : null,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFcfd4de), width: 1.8),
            color: const Color(0xFFf9fafb),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: const Color(0xFF2f3a4b), size: 22),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2f3a4b),
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthPrompt extends StatelessWidget {
  const _AuthPrompt({required this.onSignin, required this.onSignup});

  final VoidCallback onSignin;
  final VoidCallback onSignup;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 12,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Sign in to manage your account',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onSignin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _AccountScreenState._accent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Sign in',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onSignup,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: Colors.grey.shade300),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Create account',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingAccount extends StatelessWidget {
  const _LoadingAccount();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 48,
            width: 48,
            child: CircularProgressIndicator(
              color: _AccountScreenState._accent,
              strokeWidth: 3,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Loading account information...',
            style: TextStyle(
              color: Color(0xFF6b7280),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

String _formatDate(DateTime? date) {
  if (date == null) return 'Not available';
  return DateFormat('MMMM d, y').format(date);
}

class _QuickActionsCard extends StatelessWidget {
  const _QuickActionsCard({required this.actions});

  final List<_ActionButton> actions;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(actions.length, (index) {
            final action = actions[index];
            final isLast = index == actions.length - 1;
            return Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
              child: action,
            );
          }),
        ],
      ),
    );
  }
}

String _roleLabel(String role) {
  if (role.trim().isEmpty) return 'User';
  final formatted = role.replaceAll('_', ' ');
  return formatted[0].toUpperCase() + formatted.substring(1);
}

String _initials(String name) {
  final parts = name
      .trim()
      .split(' ')
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts.isNotEmpty ? parts.first[0].toUpperCase() : 'U';
}
