import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../widgets/restrobazaar_logo.dart';

const _primaryRed = Color(0xFFdc2626);
const _navy = Color(0xFF0f172a);

/// OTP signup — fields match web SignUpModal (name, phone, restaurant, GST).
class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _restaurantController = TextEditingController();
  final _gstController = TextEditingController();
  final _otpControllers = List.generate(6, (_) => TextEditingController());
  final _otpFocusNodes = List.generate(6, (_) => FocusNode());

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
    _restaurantController.dispose();
    _gstController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final n in _otpFocusNodes) {
      n.dispose();
    }
    _otpTimerHandle?.cancel();
    super.dispose();
  }

  String get _otpString => _otpControllers.map((c) => c.text.trim()).join();

  void _startOtpTimer() {
    _otpTimerHandle?.cancel();
    setState(() => _otpTimer = 30);
    _otpTimerHandle = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_otpTimer <= 1) {
        timer.cancel();
        if (mounted) setState(() => _otpTimer = 0);
      } else if (mounted) {
        setState(() => _otpTimer -= 1);
      }
    });
  }

  void _clearOtpDigits() {
    for (final c in _otpControllers) {
      c.clear();
    }
  }

  bool _validateForm() {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter your name');
      return false;
    }
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(phone)) {
      setState(
        () => _errorMessage = 'Please enter a valid 10-digit mobile number',
      );
      return false;
    }
    return true;
  }

  Future<void> _sendOtp() async {
    setState(() {
      _errorMessage = null;
      _successMessage = null;
    });
    if (!_validateForm()) return;

    setState(() => _otpLoading = true);
    final authNotifier = ref.read(authControllerProvider.notifier);
    final success = await authNotifier.sendOtpSignup(
      phone: _phoneController.text.trim(),
    );
    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    setState(() {
      _otpLoading = false;
      if (success) {
        _otpSent = true;
        _clearOtpDigits();
        _successMessage = 'OTP sent successfully to your phone number';
        _startOtpTimer();
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _otpFocusNodes.first.requestFocus();
        });
      } else {
        _errorMessage = latest.error ?? 'Failed to send OTP';
      }
    });
  }

  Future<void> _verifyAndSignup() async {
    setState(() {
      _errorMessage = null;
      _successMessage = null;
    });
    final otp = _otpString;
    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit OTP');
      return;
    }

    final authNotifier = ref.read(authControllerProvider.notifier);
    final success = await authNotifier.verifyOtpSignup(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      otp: otp,
      restaurantName: _restaurantController.text.trim(),
      gstNumber: _gstController.text.trim(),
    );
    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    if (success) {
      context.go('/home');
    } else {
      setState(() => _errorMessage = latest.error ?? 'Registration failed');
    }
  }

  void _onOtpChanged(int index, String value) {
    if (value.length > 1) {
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (var i = 0; i < 6; i++) {
        _otpControllers[i].text = i < digits.length ? digits[i] : '';
      }
      _otpFocusNodes[digits.length.clamp(0, 5)].requestFocus();
      setState(() {});
      return;
    }
    if (value.isNotEmpty && index < 5) {
      _otpFocusNodes[index + 1].requestFocus();
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          Positioned(
            top: 48,
            right: 24,
            child: Icon(
              Icons.lunch_dining_outlined,
              size: 72,
              color: _primaryRed.withValues(alpha: 0.06),
            ),
          ),
          Positioned(
            top: 100,
            left: 20,
            child: Icon(
              Icons.local_cafe_outlined,
              size: 56,
              color: _primaryRed.withValues(alpha: 0.05),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: IgnorePointer(
              child: CustomPaint(
                size: Size(MediaQuery.sizeOf(context).width, 90),
                painter: _CitySilhouettePainter(
                  color: _primaryRed.withValues(alpha: 0.06),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Material(
                      color: Colors.white,
                      shape: const CircleBorder(),
                      elevation: 2,
                      shadowColor: Colors.black26,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () {
                          if (_otpSent) {
                            setState(() {
                              _otpSent = false;
                              _clearOtpDigits();
                              _errorMessage = null;
                              _successMessage = null;
                            });
                            return;
                          }
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/signin');
                          }
                        },
                        child: const Padding(
                          padding: EdgeInsets.all(10),
                          child: Icon(Icons.arrow_back, size: 20),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                    children: [
                      const SizedBox(height: 8),
                      const Center(child: RestroBazaarLogo(height: 48)),
                      const SizedBox(height: 10),
                      Center(
                        child: Container(
                          width: 40,
                          height: 3,
                          decoration: BoxDecoration(
                            color: _primaryRed,
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        _otpSent ? 'Verify OTP' : 'Create Account',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: _navy,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _otpSent
                            ? 'Enter the OTP sent to your phone'
                            : 'Fill in your details to get started',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.45,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 22),
                      Container(
                        padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 24,
                              offset: const Offset(0, 10),
                            ),
                          ],
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFfef2f2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    _otpSent
                                        ? Icons.lock_outline_rounded
                                        : Icons.person_add_alt_1_outlined,
                                    color: _primaryRed,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _otpSent
                                            ? 'Enter verification code'
                                            : 'Account details',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                          color: _navy,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _otpSent
                                            ? 'OTP sent to +91 ${_phoneController.text.trim()}'
                                            : 'Name & mobile are required',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (_errorMessage != null) ...[
                              const SizedBox(height: 14),
                              _MessageBanner(
                                message: _errorMessage!,
                                isError: true,
                              ),
                            ],
                            if (_successMessage != null) ...[
                              const SizedBox(height: 14),
                              _MessageBanner(
                                message: _successMessage!,
                                isError: false,
                              ),
                            ],
                            const SizedBox(height: 16),
                            if (!_otpSent) ...[
                              _LabeledField(
                                label: 'Full Name',
                                requiredField: true,
                                child: _OutlinedInput(
                                  controller: _nameController,
                                  hint: 'Enter your full name',
                                  icon: Icons.person_outline,
                                  textInputAction: TextInputAction.next,
                                ),
                              ),
                              const SizedBox(height: 12),
                              _LabeledField(
                                label: 'Mobile Number',
                                requiredField: true,
                                child: _PhoneInput(controller: _phoneController),
                              ),
                              const SizedBox(height: 12),
                              _LabeledField(
                                label: 'Restaurant Name',
                                optional: true,
                                child: _OutlinedInput(
                                  controller: _restaurantController,
                                  hint: 'Your restaurant name',
                                  icon: Icons.storefront_outlined,
                                  textInputAction: TextInputAction.next,
                                ),
                              ),
                              const SizedBox(height: 12),
                              _LabeledField(
                                label: 'GST Number',
                                optional: true,
                                child: _OutlinedInput(
                                  controller: _gstController,
                                  hint: 'GST Number (e.g., 22AAAAA0000A1Z5)',
                                  icon: Icons.description_outlined,
                                  textCapitalization:
                                      TextCapitalization.characters,
                                  textInputAction: TextInputAction.done,
                                ),
                              ),
                              const SizedBox(height: 18),
                              _PrimaryActionButton(
                                label: 'Send OTP',
                                loading: _otpLoading,
                                onPressed: _otpLoading ? null : _sendOtp,
                              ),
                            ] else ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade300),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'OTP sent to',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                    Text(
                                      '+91 ${_phoneController.text.trim()}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: _navy,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Name: ${_nameController.text.trim()}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                    if (_restaurantController.text
                                        .trim()
                                        .isNotEmpty)
                                      Text(
                                        'Restaurant: ${_restaurantController.text.trim()}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Enter 6-digit OTP',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF374151),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: List.generate(6, (index) {
                                  return Expanded(
                                    child: Padding(
                                      padding: EdgeInsets.only(
                                        right: index == 5 ? 0 : 6,
                                      ),
                                      child: SizedBox(
                                        height: 42,
                                        child: TextField(
                                          controller: _otpControllers[index],
                                          focusNode: _otpFocusNodes[index],
                                          textAlign: TextAlign.center,
                                          keyboardType: TextInputType.number,
                                          maxLength: 1,
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            color: _navy,
                                          ),
                                          inputFormatters: [
                                            FilteringTextInputFormatter
                                                .digitsOnly,
                                          ],
                                          decoration: InputDecoration(
                                            counterText: '',
                                            filled: false,
                                            contentPadding: EdgeInsets.zero,
                                            border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                              borderSide: BorderSide(
                                                color: Colors.grey.shade300,
                                                width: 1.5,
                                              ),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                              borderSide: const BorderSide(
                                                color: _primaryRed,
                                                width: 1.8,
                                              ),
                                            ),
                                          ),
                                          onChanged: (v) =>
                                              _onOtpChanged(index, v),
                                        ),
                                      ),
                                    ),
                                  );
                                }),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _otpSent = false;
                                        _clearOtpDigits();
                                        _errorMessage = null;
                                        _successMessage = null;
                                      });
                                    },
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.grey.shade700,
                                      padding: EdgeInsets.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text(
                                      'Edit details',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  _otpTimer > 0
                                      ? Text(
                                          'Resend in $_otpTimer s',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                          ),
                                        )
                                      : TextButton(
                                          onPressed:
                                              _otpLoading ? null : _sendOtp,
                                          style: TextButton.styleFrom(
                                            foregroundColor: _primaryRed,
                                            padding: EdgeInsets.zero,
                                            tapTargetSize:
                                                MaterialTapTargetSize
                                                    .shrinkWrap,
                                          ),
                                          child: const Text(
                                            'Resend OTP',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              _PrimaryActionButton(
                                label: 'Verify & Create Account',
                                loading: authState.loading,
                                onPressed: authState.loading ||
                                        _otpString.length < 6
                                    ? null
                                    : _verifyAndSignup,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Already have an account? ',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.push('/signin'),
                            style: TextButton.styleFrom(
                              foregroundColor: _primaryRed,
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Sign in',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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

class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.child,
    this.requiredField = false,
    this.optional = false,
  });

  final String label;
  final Widget child;
  final bool requiredField;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            text: label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF374151),
            ),
            children: [
              if (requiredField)
                const TextSpan(
                  text: ' *',
                  style: TextStyle(color: _primaryRed),
                ),
              if (optional)
                TextSpan(
                  text: ' (Optional)',
                  style: TextStyle(
                    color: Colors.grey.shade400,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

class _OutlinedInput extends StatelessWidget {
  const _OutlinedInput({
    required this.controller,
    required this.hint,
    required this.icon,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFfca5a5)),
      ),
      child: TextField(
        controller: controller,
        textInputAction: textInputAction,
        textCapitalization: textCapitalization,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: _navy,
        ),
        decoration: InputDecoration(
          filled: false,
          border: InputBorder.none,
          hintText: hint,
          hintStyle: const TextStyle(
            color: Color(0xFF9ca3af),
            fontWeight: FontWeight.w500,
            fontSize: 12,
          ),
          prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 18),
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          isDense: true,
        ),
      ),
    );
  }
}

class _PhoneInput extends StatelessWidget {
  const _PhoneInput({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFfca5a5)),
      ),
      child: Row(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                Text('🇮🇳', style: TextStyle(fontSize: 14)),
                SizedBox(width: 4),
                Text(
                  '+91',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: _navy,
                  ),
                ),
              ],
            ),
          ),
          Container(width: 1, height: 22, color: Colors.grey.shade300),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _navy,
              ),
              decoration: const InputDecoration(
                counterText: '',
                filled: false,
                border: InputBorder.none,
                isDense: true,
                hintText: 'Enter mobile number',
                hintStyle: TextStyle(
                  color: Color(0xFF9ca3af),
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimaryActionButton extends StatelessWidget {
  const _PrimaryActionButton({
    required this.label,
    required this.loading,
    required this.onPressed,
  });

  final String label;
  final bool loading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryRed,
          foregroundColor: Colors.white,
          disabledBackgroundColor: _primaryRed.withValues(alpha: 0.55),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: loading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: Colors.white,
                ),
              )
            : Row(
                children: [
                  const Spacer(),
                  Text(
                    label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.22),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_forward_rounded,
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _MessageBanner extends StatelessWidget {
  const _MessageBanner({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFfef2f2) : const Color(0xFFf0fdf4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isError ? const Color(0xFFfecaca) : const Color(0xFFbbf7d0),
        ),
      ),
      child: Text(
        message,
        style: TextStyle(
          color: isError ? const Color(0xFF991b1b) : const Color(0xFF166534),
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _CitySilhouettePainter extends CustomPainter {
  _CitySilhouettePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()..moveTo(0, size.height);
    final buildings = <List<double>>[
      [0, 0.55],
      [0.08, 0.35],
      [0.16, 0.48],
      [0.24, 0.28],
      [0.34, 0.42],
      [0.42, 0.22],
      [0.52, 0.38],
      [0.62, 0.30],
      [0.72, 0.45],
      [0.82, 0.25],
      [0.92, 0.40],
      [1.0, 0.50],
    ];
    for (var i = 0; i < buildings.length - 1; i++) {
      final x0 = buildings[i][0] * size.width;
      final y0 = buildings[i][1] * size.height;
      final x1 = buildings[i + 1][0] * size.width;
      path
        ..lineTo(x0, y0)
        ..lineTo(x1, y0);
    }
    path
      ..lineTo(size.width, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CitySilhouettePainter oldDelegate) =>
      oldDelegate.color != color;
}
