import 'package:flutter/material.dart';

class StaticPageScreen extends StatelessWidget {
  const StaticPageScreen({
    super.key,
    required this.title,
    required this.paragraphs,
  });

  final String title;
  final List<String> paragraphs;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...paragraphs.map(
            (text) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(text, style: const TextStyle(height: 1.4)),
            ),
          ),
        ],
      ),
    );
  }
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return Scaffold(
      appBar: AppBar(title: const Text('About RestroBazaar')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'About RestroBazaar',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'RestroBazaar is a single destination for restaurants, cafés, bakeries, and cloud kitchens to source reliable food packaging.',
            style: TextStyle(height: 1.4),
          ),
          const SizedBox(height: 12),
          const Text(
            'We curate packaging that keeps food fresh, travels well, and represents your brand with pride. Our team focuses on trust, transparency, and long-term partnerships with hospitality businesses.',
            style: TextStyle(height: 1.4),
          ),
          const SizedBox(height: 12),
          const Text(
            'Whether you are scaling up delivery or refreshing your dine-in experience, we are here with practical guidance and quality supplies.',
            style: TextStyle(height: 1.4),
          ),
          const SizedBox(height: 28),
          Text(
            'Our Founders',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'The leadership behind RestroBazaar',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 16),
          _FounderCard(
            initials: 'PK',
            name: 'Mrs. Pranali Kadam',
            role: 'Managing Director (MD)',
            description:
                'Leads RestroBazaar’s overall vision, strategy, and growth — focused on building trusted packaging partnerships for restaurants and food brands.',
            accent: primary,
          ),
          const SizedBox(height: 12),
          _FounderCard(
            initials: 'AK',
            name: 'Mr. Akshay Kadam',
            role: 'Chief Operations Officer',
            description:
                'Oversees day-to-day operations, supply reliability, and customer fulfillment — ensuring quality packaging is delivered on time, every time.',
            accent: primary,
          ),
        ],
      ),
    );
  }
}

class _FounderCard extends StatelessWidget {
  const _FounderCard({
    required this.initials,
    required this.name,
    required this.role,
    required this.description,
    required this.accent,
  });

  final String initials;
  final String name;
  final String role;
  final String description;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: accent.withValues(alpha: 0.25)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: accent,
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    role,
                    style: TextStyle(
                      color: accent,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: TextStyle(
                      height: 1.4,
                      color: Colors.grey.shade700,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StaticPageScreen(
      title: 'Contact us',
      paragraphs: [
        'Have a query about products, bulk pricing, or delivery schedules? Drop us a note and the RestroBazaar team will get back to you.',
        'Email: hello@restrobazaar.com\nPhone: +91-00000-00000\nService hours: 9:30 AM – 7:00 PM IST',
      ],
    );
  }
}

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StaticPageScreen(
      title: 'Privacy policy',
      paragraphs: [
        'We collect only the information needed to serve you—such as contact details, delivery addresses, and order history.',
        'Data is used for fulfilling orders, improving the catalog, and communicating updates. We never sell your data to third parties.',
        'You can request data deletion or corrections anytime by contacting support.',
      ],
    );
  }
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StaticPageScreen(
      title: 'Terms of service',
      paragraphs: [
        'Orders are subject to product availability in your selected city. Prices may vary by vendor and pack size.',
        'Payments are processed securely. Please review your address and quantities before checkout.',
        'For vendor or admin access, separate credentials are required. Misuse of the platform can result in account suspension.',
      ],
    );
  }
}

class RefundPolicyScreen extends StatelessWidget {
  const RefundPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StaticPageScreen(
      title: 'Refund & cancellation',
      paragraphs: [
        'If you receive damaged or incorrect items, reach out within 48 hours of delivery with photos and your order ID.',
        'Refunds or replacements are processed after verification. Custom-printed items may not be eligible unless defective.',
      ],
    );
  }
}

class ShippingPolicyScreen extends StatelessWidget {
  const ShippingPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StaticPageScreen(
      title: 'Shipping policy',
      paragraphs: [
        'We deliver based on the serviceable cities shown in the app. Delivery timelines depend on inventory and vendor proximity.',
        'Shipping fees are waived on qualifying order values. You will see estimated delivery windows at checkout.',
      ],
    );
  }
}
