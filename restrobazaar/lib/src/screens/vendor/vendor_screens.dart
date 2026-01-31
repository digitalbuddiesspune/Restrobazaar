import 'package:flutter/material.dart';

class VendorLoginScreen extends StatelessWidget {
  const VendorLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vendor login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Vendor access',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
            ),
            SizedBox(height: 8),
            Text(
              'Use your vendor credentials provided by RestroBazaar to access the dashboard. '
              'The mobile app currently provides a read-only placeholder for vendor features; '
              'please continue using the web dashboard for inventory and order management.',
              style: TextStyle(height: 1.4),
            ),
            SizedBox(height: 12),
            Text('Need help? Email vendor-support@restrobazaar.com'),
          ],
        ),
      ),
    );
  }
}

class VendorDashboardScreen extends StatelessWidget {
  const VendorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vendor dashboard')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Vendor management (catalog uploads, order processing, payouts) is available on the web dashboard. '
            'Sign in from a desktop browser for the full experience.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
