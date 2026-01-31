import 'package:flutter/material.dart';

class SuperAdminLoginScreen extends StatelessWidget {
  const SuperAdminLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Super admin login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Restricted access',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
            ),
            SizedBox(height: 8),
            Text(
              'Admin and super admin operations are currently available on the web dashboard. '
              'Use your admin credentials on desktop to manage vendors, cities, and catalog.',
              style: TextStyle(height: 1.4),
            ),
            SizedBox(height: 12),
            Text('For access requests, contact admin@restrobazaar.com'),
          ],
        ),
      ),
    );
  }
}

class SuperAdminDashboardScreen extends StatelessWidget {
  const SuperAdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin dashboard')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Admin dashboards (analytics, approvals, city management) are supported on the web for now.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
