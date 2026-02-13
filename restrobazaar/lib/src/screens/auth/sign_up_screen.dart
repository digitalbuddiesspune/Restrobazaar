import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../widgets/restrobazaar_logo.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _restaurantNameController = TextEditingController();
  final _gstNumberController = TextEditingController();
  final _otpController = TextEditingController();

  bool _otpSent = false;
  bool _otpLoading = false;
  int _otpTimer = 0;
  Timer? _otpTimerHandle;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _restaurantNameController.dispose();
    _gstNumberController.dispose();
    _otpController.dispose();
    _otpTimerHandle?.cancel();
    super.dispose();
  }

  String _normalizeIndianPhone(String value) {
    final cleaned = value.replaceAll(RegExp(r'\D'), '');
    if (cleaned.length == 12 && cleaned.startsWith('91')) {
      return cleaned.substring(2);
    }
    if (cleaned.length == 11 && cleaned.startsWith('0')) {
      return cleaned.substring(1);
    }
    return cleaned;
  }

  bool _isValidIndianPhone(String value) {
    final normalized = _normalizeIndianPhone(value);
    return RegExp(r'^[6-9]\d{9}$').hasMatch(normalized);
  }

  void _startOtpTimer() {
    _otpTimerHandle?.cancel();
    setState(() => _otpTimer = 30);
    _otpTimerHandle = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_otpTimer <= 1) {
        timer.cancel();
        if (mounted) {
          setState(() => _otpTimer = 0);
        }
      } else if (mounted) {
        setState(() => _otpTimer -= 1);
      }
    });
  }

  bool _validateForm() {
    if (_nameController.text.trim().isEmpty) {
      setState(() => _errorMessage = 'Please enter your name');
      return false;
    }
    if (!_isValidIndianPhone(_phoneController.text.trim())) {
      setState(() {
        _errorMessage =
            'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
      });
      return false;
    }
    return true;
  }

  Future<void> _sendOtp(AuthController authNotifier) async {
    setState(() {
      _errorMessage = null;
      _successMessage = null;
      _otpLoading = true;
    });

    if (!_validateForm()) {
      setState(() => _otpLoading = false);
      return;
    }

    final normalizedPhone = _normalizeIndianPhone(_phoneController.text.trim());
    final success = await authNotifier.sendOtpSignup(phone: normalizedPhone);
    if (!mounted) return;

    final latest = ref.read(authControllerProvider);
    setState(() {
      _otpLoading = false;
      if (success) {
        _otpSent = true;
        _successMessage = 'OTP sent successfully to your phone number';
        _startOtpTimer();
      } else {
        _errorMessage = latest.error ?? 'Failed to send OTP';
      }
    });
  }

  Future<void> _verifyOtpAndCreate(AuthController authNotifier) async {
    setState(() {
      _errorMessage = null;
      _successMessage = null;
    });

    final otp = _otpController.text.trim();
    if (otp.length != 6 || !RegExp(r'^\d{6}$').hasMatch(otp)) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit OTP');
      return;
    }

    if (!_validateForm()) return;

    final normalizedPhone = _normalizeIndianPhone(_phoneController.text.trim());

    final success = await authNotifier.verifyOtpSignup(
      name: _nameController.text.trim(),
      phone: normalizedPhone,
      otp: otp,
      restaurantName: _restaurantNameController.text.trim(),
      gstNumber: _gstNumberController.text.trim(),
    );

    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    if (success) {
      context.go('/home');
    } else {
      setState(() {
        _errorMessage =
            latest.error ?? 'Registration failed. Please try again.';
      });
    }
  }

  void _backToFormStep() {
    setState(() {
      _otpSent = false;
      _otpController.clear();
      _errorMessage = null;
      _successMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final authNotifier = ref.read(authControllerProvider.notifier);
    final secondaryColor = Theme.of(context).colorScheme.secondary;

    return Scaffold(
      body: SafeArea(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFFF1F2), Color(0xFFFFFBEB), Color(0xFFF8FAFC)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.arrow_back),
                      tooltip: 'Back',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Center(child: RestroBazaarLogo(height: 56)),
              const SizedBox(height: 18),
              Text(
                _otpSent ? 'Verify OTP' : 'Create Account',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: secondaryColor,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _otpSent
                    ? 'Enter the OTP sent to your phone'
                    : 'Fill in your details to get started',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 16,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_errorMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: Color(0xFFdc2626),
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(
                                  color: Color(0xFF991B1B),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (_successMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF3),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.check_circle_outline,
                              color: Color(0xFF15803D),
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _successMessage!,
                                style: const TextStyle(
                                  color: Color(0xFF166534),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (!_otpSent) ...[
                      TextField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Full Name *',
                          hintText: 'Enter your full name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Phone Number *',
                          hintText: '9876543210',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        '10-digit mobile number starting with 6, 7, 8, or 9',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF6b7280),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _restaurantNameController,
                        decoration: const InputDecoration(
                          labelText: 'Restaurant Name (Optional)',
                          hintText: 'Your restaurant name',
                          prefixIcon: Icon(Icons.storefront_outlined),
                        ),
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _gstNumberController,
                        decoration: const InputDecoration(
                          labelText: 'GST Number (Optional)',
                          hintText: 'GST Number (e.g., 22AAAAA0000A1Z5)',
                          prefixIcon: Icon(Icons.description_outlined),
                        ),
                        textInputAction: TextInputAction.done,
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _otpLoading
                              ? null
                              : () => _sendOtp(authNotifier),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: _otpLoading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text('Send OTP'),
                        ),
                      ),
                    ] else ...[
                      TextButton.icon(
                        onPressed: _backToFormStep,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(0, 28),
                        ),
                        icon: const Icon(Icons.arrow_back, size: 16),
                        label: const Text('Back to edit details'),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'OTP sent to',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6b7280),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '+91 ${_normalizeIndianPhone(_phoneController.text.trim())}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Name: ${_nameController.text.trim()}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6b7280),
                              ),
                            ),
                            if (_restaurantNameController.text
                                .trim()
                                .isNotEmpty)
                              Text(
                                'Restaurant: ${_restaurantNameController.text.trim()}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF6b7280),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _otpController,
                        decoration: const InputDecoration(
                          labelText: 'Enter 6-digit OTP',
                          hintText: '000000',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        keyboardType: TextInputType.number,
                        textInputAction: TextInputAction.done,
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: _otpTimer > 0
                            ? Text(
                                'Resend OTP in ${_otpTimer}s',
                                style: const TextStyle(
                                  color: Color(0xFF6b7280),
                                  fontSize: 12,
                                ),
                              )
                            : TextButton(
                                onPressed: _otpLoading
                                    ? null
                                    : () => _sendOtp(authNotifier),
                                child: const Text('Resend OTP'),
                              ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: authState.loading
                              ? null
                              : () => _verifyOtpAndCreate(authNotifier),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: authState.loading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text('Verify & Create Account'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already have an account?',
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                  TextButton(
                    onPressed: () => context.push('/signin'),
                    child: const Text('Sign in'),
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
