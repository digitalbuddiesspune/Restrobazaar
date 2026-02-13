String formatOrderId(Object? orderId) {
  if (orderId == null) return '#N/A';

  final idString = orderId.toString();
  final digitsOnly = idString.replaceAll(RegExp(r'\D'), '');
  if (digitsOnly.isEmpty) return '#N/A';

  final lastSix = digitsOnly.length > 6
      ? digitsOnly.substring(digitsOnly.length - 6)
      : digitsOnly.padLeft(6, '0');

  return '#$lastSix';
}
