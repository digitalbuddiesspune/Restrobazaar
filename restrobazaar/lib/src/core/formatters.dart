import 'package:intl/intl.dart';

final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

String formatCurrency(num value) {
  return _currency.format(value);
}
