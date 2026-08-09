import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/auth_controller.dart';
import '../../widgets/restrobazaar_logo.dart';

const _primaryRed = Color(0xFFdc2626);
const _navy = Color(0xFF0f172a);

/// OTP-only sign in — mirrors the RestroBazaar mobile login mock.
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _phoneController = TextEditingController();
  final _otpControllers = List.generate(6, (_) => TextEditingController());
  final _otpFocusNodes = List.generate(6, (_) => FocusNode());

  bool _otpSent = false;
  bool _otpLoading = false;
  int _otpTimer = 0;
  Timer? _otpTimerHandle;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final n in _otpFocusNodes) {
      n.dispose();
    }
    _otpTimerHandle?.cancel();
    super.dispose();
  }

  String get _otpString =>
      _otpControllers.map((c) => c.text.trim()).join();

  void _startOtpTimer() {
    _otpTimerHandle?.cancel();
    setState(() => _otpTimer = 60);
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

  void _resetOtpForm({bool clearPhone = true}) {
    _clearOtpDigits();
    if (clearPhone) _phoneController.clear();
    _otpSent = false;
    _otpTimer = 0;
  }

  Future<void> _sendOtp(AuthController authNotifier) async {
    setState(() {
      _errorMessage = null;
      _otpLoading = true;
    });

    final phone = _phoneController.text.trim();
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(phone)) {
      setState(() {
        _errorMessage = 'Enter a valid 10-digit mobile number';
        _otpLoading = false;
      });
      return;
    }

    final success = await authNotifier.sendOtpLogin(phone: phone);
    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    setState(() {
      _otpLoading = false;
      if (success) {
        _otpSent = true;
        _clearOtpDigits();
        _startOtpTimer();
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _otpFocusNodes.first.requestFocus();
        });
      } else {
        _errorMessage = latest.error ?? 'Failed to send OTP';
      }
    });
  }

  Future<void> _verifyOtp(AuthController authNotifier) async {
    setState(() => _errorMessage = null);
    final phone = _phoneController.text.trim();
    final otp = _otpString;

    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit OTP');
      return;
    }

    final success = await authNotifier.verifyOtpLogin(phone: phone, otp: otp);
    if (!mounted) return;
    final latest = ref.read(authControllerProvider);
    if (success) {
      context.go('/home');
    } else {
      setState(() => _errorMessage = latest.error ?? 'Invalid OTP');
    }
  }

  void _onOtpChanged(int index, String value) {
    if (value.length > 1) {
      // Paste support
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (var i = 0; i < 6; i++) {
        _otpControllers[i].text = i < digits.length ? digits[i] : '';
      }
      final focusIndex = digits.length.clamp(0, 5);
      _otpFocusNodes[focusIndex].requestFocus();
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
    final authNotifier = ref.read(authControllerProvider.notifier);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Soft decorative food icons (top)
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
          // Soft city silhouette (bottom)
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
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/home');
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
                      const Text(
                        'Welcome back!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: _navy,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _otpSent
                            ? 'Enter the OTP sent to your mobile number'
                            : "Enter your mobile number and we'll send you a secure OTP to continue",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.45,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 22),

                      // Main card
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
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: _primaryRed.withValues(alpha: 0.45),
                                      width: 1.5,
                                      strokeAlign: BorderSide.strokeAlignInside,
                                    ),
                                  ),
                                  alignment: Alignment.center,
                                  child: Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: _primaryRed.withValues(alpha: 0.35),
                                        style: BorderStyle.solid,
                                        width: 1,
                                      ),
                                      color: const Color(0xFFfef2f2),
                                    ),
                                    child: const Icon(
                                      Icons.smartphone_outlined,
                                      color: _primaryRed,
                                      size: 22,
                                    ),
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
                                            ? 'Verify OTP'
                                            : 'Mobile Number',
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
                                            : "We'll send OTP to verify your number",
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
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFfef2f2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: const Color(0xFFfecaca),
                                  ),
                                ),
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    color: Color(0xFF991b1b),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 16),
                            if (!_otpSent) ...[
                              // Phone field with +91
                              Container(
                                height: 40,
                                decoration: BoxDecoration(
                                  color: Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: const Color(0xFFfca5a5),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 10,
                                      ),
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
                                          SizedBox(width: 2),
                                          Icon(
                                            Icons.keyboard_arrow_down_rounded,
                                            size: 16,
                                            color: Color(0xFF6b7280),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      width: 1,
                                      height: 22,
                                      color: Colors.grey.shade300,
                                    ),
                                    Expanded(
                                      child: TextField(
                                        controller: _phoneController,
                                        keyboardType: TextInputType.phone,
                                        maxLength: 10,
                                        inputFormatters: [
                                          FilteringTextInputFormatter.digitsOnly,
                                        ],
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: _navy,
                                        ),
                                        decoration: const InputDecoration(
                                          counterText: '',
                                          filled: false,
                                          isDense: true,
                                          border: InputBorder.none,
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
                                        onChanged: (_) {
                                          if (_errorMessage != null) {
                                            setState(() => _errorMessage = null);
                                          }
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              _PrimaryActionButton(
                                label: 'Send OTP',
                                loading: _otpLoading,
                                onPressed: _otpLoading
                                    ? null
                                    : () => _sendOtp(authNotifier),
                              ),
                            ] else ...[
                              // 6-digit OTP boxes
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
                                        FilteringTextInputFormatter.digitsOnly,
                                      ],
                                      decoration: InputDecoration(
                                        counterText: '',
                                        filled: false,
                                        contentPadding: EdgeInsets.zero,
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(10),
                                          borderSide: BorderSide(
                                            color: Colors.grey.shade300,
                                            width: 1.5,
                                          ),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(10),
                                          borderSide: const BorderSide(
                                            color: _primaryRed,
                                            width: 1.8,
                                          ),
                                        ),
                                      ),
                                      onChanged: (v) => _onOtpChanged(index, v),
                                      onTap: () {
                                        _otpControllers[index].selection =
                                            TextSelection(
                                          baseOffset: 0,
                                          extentOffset:
                                              _otpControllers[index].text.length,
                                        );
                                      },
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
                                        _resetOtpForm(clearPhone: false);
                                        _errorMessage = null;
                                      });
                                    },
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.grey.shade700,
                                      padding: EdgeInsets.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text(
                                      'Change number',
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
                                          onPressed: _otpLoading
                                              ? null
                                              : () => _sendOtp(authNotifier),
                                          style: TextButton.styleFrom(
                                            foregroundColor: _primaryRed,
                                            padding: EdgeInsets.zero,
                                            tapTargetSize: MaterialTapTargetSize
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
                              const SizedBox(height: 12),
                              _PrimaryActionButton(
                                label: 'Verify & Sign In',
                                loading: authState.loading,
                                onPressed: authState.loading ||
                                        _otpString.length < 6
                                    ? null
                                    : () => _verifyOtp(authNotifier),
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
                            "Don't have an account? ",
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.push('/signup'),
                            style: TextButton.styleFrom(
                              foregroundColor: _primaryRed,
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Sign up',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Secure badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.verified_user_outlined,
                            size: 16,
                            color: _primaryRed,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '100% Secure & Private',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: _navy,
                                  ),
                                ),
                                Text(
                                  'Your information is safe with us',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Feature row
                      Row(
                        children: const [
                          Expanded(
                            child: _FeatureItem(
                              icon: Icons.bolt_rounded,
                              title: 'Fast',
                              subtitle: 'Get OTP instantly',
                            ),
                          ),
                          _FeatureDivider(),
                          Expanded(
                            child: _FeatureItem(
                              icon: Icons.shield_outlined,
                              title: 'Secure',
                              subtitle: 'Bank level security',
                            ),
                          ),
                          _FeatureDivider(),
                          Expanded(
                            child: _FeatureItem(
                              icon: Icons.check_circle_outline,
                              title: 'Simple',
                              subtitle: 'One tap login',
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

class _FeatureItem extends StatelessWidget {
  const _FeatureItem({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            color: Color(0xFFfef2f2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: _primaryRed, size: 20),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 13,
            color: _navy,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey.shade600,
            height: 1.2,
          ),
        ),
      ],
    );
  }
}

class _FeatureDivider extends StatelessWidget {
  const _FeatureDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 56,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: Colors.grey.shade200,
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
