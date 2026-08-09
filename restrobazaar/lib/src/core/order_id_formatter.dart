/// Matches web `frontend/src/utils/orderIdFormatter.js`.
/// Shows `#` + last 6 numeric digits of the order id / orderNumber.
String formatOrderId(String? orderId) {
  if (orderId == null || orderId.isEmpty) return '#N/A';

  final digitsOnly = orderId.replaceAll(RegExp(r'\D'), '');
  if (digitsOnly.isEmpty) return '#N/A';

  final lastSix = digitsOnly.length > 6
      ? digitsOnly.substring(digitsOnly.length - 6)
      : digitsOnly.padLeft(6, '0');

  return '#$lastSix';
}
