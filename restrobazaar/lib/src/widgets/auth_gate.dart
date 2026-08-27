import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/auth_controller.dart';
import '../screens/auth/sign_in_screen.dart';

/// Shows the OTP login UI as a modal sheet. Returns `true` if the user signed in.
Future<bool> showLoginPopup(BuildContext context) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: true,
    enableDrag: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (sheetContext) {
      final height = MediaQuery.sizeOf(sheetContext).height * 0.92;
      return SizedBox(
        height: height,
        child: const SignInScreen(asPopup: true),
      );
    },
  );
  return result == true;
}

/// If already logged in, returns `true`. Otherwise opens the login popup first.
Future<bool> ensureLoggedIn(BuildContext context, WidgetRef ref) async {
  if (ref.read(authControllerProvider).isAuthenticated) return true;
  if (!context.mounted) return false;
  final ok = await showLoginPopup(context);
  if (!context.mounted) return false;
  return ok || ref.read(authControllerProvider).isAuthenticated;
}
