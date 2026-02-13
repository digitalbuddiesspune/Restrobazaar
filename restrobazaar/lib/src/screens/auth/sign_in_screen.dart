import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../widgets/restrobazaar_logo.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  bool _otpSent = false;
  bool _otpLoading = false;
  int _otpTimer = 0;
  Timer? _otpTimerHandle;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
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
    setState(() => _otpTimer = 60);
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

  void _resetOtpForm({bool clearPhone = true}) {
    _otpController.clear();
    if (clearPhone) {
      _phoneController.clear();
    }
    _otpSent = false;
    _otpTimer = 0;
  }

  Future<void> _sendOtp(AuthController authNotifier) async {
    setState(() {
      _errorMessage = null;
      _otpLoading = true;
    });

    final normalizedPhone = _normalizeIndianPhone(_phoneController.text.trim());
    if (!_isValidIndianPhone(_phoneController.text.trim())) {
      setState(() {
        _errorMessage =
            'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
        _otpLoading = false;
      });
      return;
    }

    final success = await authNotifier.sendOtpLogin(phone: normalizedPhone);
    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    setState(() {
      _otpLoading = false;
      if (success) {
        _otpSent = true;
        _startOtpTimer();
      } else {
        _errorMessage = latest.error ?? 'Failed to send OTP';
      }
    });
  }

  Future<void> _verifyOtp(AuthController authNotifier) async {
    setState(() => _errorMessage = null);

    final normalizedPhone = _normalizeIndianPhone(_phoneController.text.trim());
    final otp = _otpController.text.trim();

    if (!_isValidIndianPhone(_phoneController.text.trim())) {
      setState(() {
        _errorMessage =
            'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
      });
      return;
    }

    if (otp.length != 6 || !RegExp(r'^\d{6}$').hasMatch(otp)) {
      setState(() => _errorMessage = 'Please enter a valid 6-digit OTP');
      return;
    }

    final success = await authNotifier.verifyOtpLogin(
      phone: normalizedPhone,
      otp: otp,
    );
    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    if (success) {
      context.go('/home');
    } else {
      setState(() => _errorMessage = latest.error ?? 'Invalid OTP');
    }
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
                'Welcome back',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: secondaryColor,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Sign in to continue shopping from trusted vendors.',
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
                    Text(
                      'Sign in',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: secondaryColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'OTP Login',
                      style: TextStyle(
                        color: Color(0xFF6b7280),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Container(
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
                    ],
                    const SizedBox(height: 14),
                    if (!_otpSent) ...[
                      TextField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Phone Number',
                          hintText: '9876543210',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.done,
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
                      TextField(
                        controller: _otpController,
                        decoration: const InputDecoration(
                          labelText: 'Enter OTP',
                          hintText: '000000',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        keyboardType: TextInputType.number,
                        textInputAction: TextInputAction.done,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'OTP sent to ${_normalizeIndianPhone(_phoneController.text.trim())}',
                        style: const TextStyle(
                          color: Color(0xFF6b7280),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _resetOtpForm(clearPhone: false);
                              });
                            },
                            child: const Text('Change Phone Number'),
                          ),
                          _otpTimer > 0
                              ? Text(
                                  'Resend in $_otpTimer s',
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
                        ],
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: authState.loading
                              ? null
                              : () => _verifyOtp(authNotifier),
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
                              : const Text('Verify & Sign In'),
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
                    'New here?',
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                  TextButton(
                    onPressed: () => context.push('/signup'),
                    child: const Text('Create account'),
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
