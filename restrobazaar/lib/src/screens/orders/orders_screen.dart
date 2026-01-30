import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:qr_flutter/qr_flutter.dart';

import '../../controllers/order_providers.dart';
import '../../core/formatters.dart';
import '../../models/cart_item.dart';
import '../../models/order.dart';
import '../../repositories/repository_providers.dart';
import '../../widgets/categories_nav_bar.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Orders'),
        bottom: const CategoriesNavBar(),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      backgroundColor: Colors.grey.shade50,
      body: ordersAsync.when(
        data: (orders) {
          if (orders.isEmpty) {
            return _EmptyOrders(
              onShop: () => context.go('/home'),
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            children: [
              const SizedBox(height: 4),
              const Text(
                'Your Orders',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '${orders.length} order${orders.length == 1 ? '' : 's'} placed',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 12),
              ...orders.map(
                (order) => _OrderCard(
                  order: order,
                  onViewDetails: () => _showOrderDetails(context, ref, order),
                  onDownloadInvoice: () => _downloadInvoice(context, order),
                ),
              ),
            ],
          );
        },
        loading: () => const _LoadingOrders(),
        error: (error, _) => _ErrorOrders(message: error.toString()),
      ),
    );
  }
}

class _LoadingOrders extends StatelessWidget {
  const _LoadingOrders();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 44,
            width: 44,
            child: CircularProgressIndicator(
              color: Colors.red.shade600,
              strokeWidth: 3,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Loading orders...',
            style: TextStyle(
              color: Color(0xFF6b7280),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorOrders extends StatelessWidget {
  const _ErrorOrders({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 36, color: Colors.red.shade600),
            const SizedBox(height: 10),
            const Text(
              'Unable to load orders',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6b7280)),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders({required this.onShop});

  final VoidCallback onShop;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.shopping_bag_outlined,
                size: 72,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 12),
              const Text(
                'No orders yet',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Start shopping to see your orders here',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF6b7280),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onShop,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFdc2626),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Continue shopping',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.order,
    required this.onViewDetails,
    required this.onDownloadInvoice,
  });

  final OrderModel order;
  final VoidCallback onViewDetails;
  final VoidCallback onDownloadInvoice;

  @override
  Widget build(BuildContext context) {
    final statusStyle = _statusStyleFor(order.status);
    final statusText = _statusText(order.status);
    final items = order.items;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Wrap(
                    spacing: 16,
                    runSpacing: 10,
                    children: [
                      _OrderInfo(
                        label: 'Order placed',
                        value: _formatDate(order.createdAt),
                      ),
                      _OrderInfo(
                        label: 'Total',
                        value: formatCurrency(order.totalAmount),
                      ),
                      _OrderInfo(
                        label: 'Payment',
                        value: _paymentLabel(order.paymentMethod),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Order #${_shortOrderId(order.id)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    TextButton(
                      onPressed: onViewDetails,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(0, 32),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Order details',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusChip(label: statusText, style: statusStyle),
                const SizedBox(height: 12),
                if (items.isEmpty)
                  const Text(
                    'No items found for this order.',
                    style: TextStyle(color: Color(0xFF6b7280)),
                  )
                else
                  Column(
                    children: items.asMap().entries.map((entry) {
                      final item = entry.value;
                      final isLast = entry.key == items.length - 1;
                      return Padding(
                        padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
                        child: _OrderItemTile(item: item),
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 14),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    OutlinedButton(
                      onPressed: onViewDetails,
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        side: BorderSide(color: Colors.grey.shade300),
                        foregroundColor: Colors.grey.shade800,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                      ),
                      child: const Text('View order details'),
                    ),
                    ElevatedButton.icon(
                      onPressed: onDownloadInvoice,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFdc2626),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.receipt_long_rounded, size: 18),
                      label: const Text(
                        'Download invoice',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderInfo extends StatelessWidget {
  const _OrderInfo({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF6b7280),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}

class _OrderItemTile extends StatelessWidget {
  const _OrderItemTile({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ProductThumb(imageUrl: item.productImage),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.productName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Quantity: ${item.quantity}',
                style: const TextStyle(
                  color: Color(0xFF6b7280),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                formatCurrency(item.lineTotal),
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ProductThumb extends StatelessWidget {
  const _ProductThumb({required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: imageUrl.isNotEmpty
            ? Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) {
                  return Icon(
                    Icons.image_not_supported_outlined,
                    color: Colors.grey.shade400,
                  );
                },
              )
            : Icon(
                Icons.image_not_supported_outlined,
                color: Colors.grey.shade400,
              ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.style});

  final String label;
  final _StatusStyle style;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: style.border),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 12,
          color: style.text,
        ),
      ),
    );
  }
}

class _StatusStyle {
  const _StatusStyle({
    required this.background,
    required this.text,
    required this.border,
  });

  final Color background;
  final Color text;
  final Color border;
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.bold = false,
  });

  final String label;
  final String value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
      fontSize: bold ? 14 : 13,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: style.copyWith(color: const Color(0xFF6b7280)),
            ),
          ),
          Text(value, style: style),
        ],
      ),
    );
  }
}

void _showOrderDetails(BuildContext context, WidgetRef ref, OrderModel order) {
  final statusStyle = _statusStyleFor(order.status);
  final canCancel = !['cancelled', 'delivered']
      .contains(order.status.toLowerCase());
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      final bottomInset = MediaQuery.of(sheetContext).viewInsets.bottom;
      return SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + bottomInset),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 48,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Order #${_shortOrderId(order.id)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    _StatusChip(label: _statusText(order.status), style: statusStyle),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Placed on ${_formatDate(order.createdAt)}',
                  style: const TextStyle(
                    color: Color(0xFF6b7280),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Items',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 8),
                if (order.items.isEmpty)
                  const Text(
                    'No items found for this order.',
                    style: TextStyle(color: Color(0xFF6b7280)),
                  )
                else
                  Column(
                    children: order.items
                        .asMap()
                        .entries
                        .map(
                          (entry) => Padding(
                            padding: EdgeInsets.only(
                              bottom: entry.key == order.items.length - 1 ? 0 : 10,
                            ),
                            child: _OrderItemTile(item: entry.value),
                          ),
                        )
                        .toList(),
                  ),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 12),
                _SummaryRow(
                  label: 'Total amount',
                  value: formatCurrency(order.totalAmount),
                  bold: true,
                ),
                _SummaryRow(
                  label: 'Payment method',
                  value: _paymentLabel(order.paymentMethod),
                ),
                const SizedBox(height: 16),
                if (canCancel) ...[
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: sheetContext,
                          builder: (dialogContext) {
                            return AlertDialog(
                              title: const Text('Cancel order?'),
                              content: const Text(
                                'Are you sure you want to cancel this order?',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(dialogContext).pop(false),
                                  child: const Text('No'),
                                ),
                                ElevatedButton(
                                  onPressed: () =>
                                      Navigator.of(dialogContext).pop(true),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFdc2626),
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Yes, cancel'),
                                ),
                              ],
                            );
                          },
                        );
                        if (confirm != true) return;
                        final messenger = ScaffoldMessenger.of(sheetContext);
                        try {
                          final repo = ref.read(orderRepositoryProvider);
                          await repo.cancelOrder(order.id);
                          if (!sheetContext.mounted) return;
                          ref.invalidate(ordersProvider);
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('Order cancelled successfully'),
                            ),
                          );
                          Navigator.of(sheetContext).pop();
                        } catch (e) {
                          if (!sheetContext.mounted) return;
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text('Failed to cancel order: $e'),
                            ),
                          );
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFdc2626),
                        side: const BorderSide(color: Color(0xFFdc2626)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Cancel Order',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(sheetContext).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFdc2626),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Close',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

Future<void> _downloadInvoice(BuildContext context, OrderModel order) async {
  final messenger = ScaffoldMessenger.of(context);
  final rootNavigator = Navigator.of(context, rootNavigator: true);
  final startedAt = DateTime.now();
  showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) {
      return AlertDialog(
        content: Row(
          children: const [
            SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Expanded(child: Text('Downloading invoice...')),
          ],
        ),
      );
    },
  );
  try {
    final bytes = await _buildInvoicePdf(order);
    final Directory dir;
    if (Platform.isAndroid) {
      dir =
          await getExternalStorageDirectory() ??
          await getApplicationDocumentsDirectory();
    } else {
      dir = await getApplicationDocumentsDirectory();
    }
    final filename = 'Invoice-${_shortOrderId(order.id)}.pdf';
    final file = File('${dir.path}/$filename');
    await file.writeAsBytes(bytes, flush: true);
    final elapsed = DateTime.now().difference(startedAt);
    const minDialogDuration = Duration(seconds: 2);
    if (elapsed < minDialogDuration) {
      await Future.delayed(minDialogDuration - elapsed);
    }
    if (rootNavigator.canPop()) rootNavigator.pop();
    final result = await OpenFilex.open(file.path);
    if (result.type == ResultType.done) return;
    messenger.showSnackBar(
      const SnackBar(
        content: Text('Invoice downloaded. Unable to open automatically.'),
      ),
    );
  } catch (e) {
    if (rootNavigator.canPop()) {
      rootNavigator.pop();
    }
    messenger.showSnackBar(
      SnackBar(content: Text('Failed to download invoice: $e')),
    );
  }
}

Future<Uint8List> _buildInvoicePdf(OrderModel order) async {
  final customer = order.deliveryAddress;
  final invoiceDate = order.createdAt ?? DateTime.now();
  final subtotal = order.cartTotal ??
      order.items.fold<double>(0, (sum, item) => sum + item.lineTotal);
  final gstAmount =
      order.gstAmount ?? _calculateGstFromItems(order.items);
  final shipping = order.shippingCharges ?? 0;
  final totalAmount =
      order.totalAmount != 0 ? order.totalAmount : subtotal + gstAmount + shipping;
  final paymentStatus =
      order.paymentStatus?.isNotEmpty == true ? _titleCase(order.paymentStatus!) : 'Pending';
  final orderNumber = order.id.isNotEmpty ? order.id : 'N/A';
  final paymentMethod = order.paymentMethod?.toLowerCase() ?? '';
  final showQr = paymentMethod == 'online' || paymentMethod == 'upi';
  final upiUrl = _buildUpiUrl(totalAmount, orderNumber);
  final qrBytes = showQr ? await _buildQrBytes(upiUrl) : null;

  final pdf = pw.Document();
  pdf.addPage(
    pw.MultiPage(
      pageTheme: const pw.PageTheme(
        margin: pw.EdgeInsets.all(28),
        textDirection: pw.TextDirection.ltr,
      ),
      build: (context) => [
        pw.Center(
          child: pw.Column(
            children: [
              pw.Text(
                'RestroBazaar',
                style: pw.TextStyle(
                  fontSize: 26,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColor.fromInt(const Color(0xFFdc2626).value),
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Text(
                'Your Trusted Restaurant Supply Partner',
                style: pw.TextStyle(
                  fontSize: 11,
                  color: PdfColors.grey700,
                ),
              ),
              pw.SizedBox(height: 2),
              pw.Text(
                'Email: support@restrobazaar.com | Phone: +91-XXXXXXXXXX',
                style: pw.TextStyle(
                  fontSize: 10,
                  color: PdfColors.grey700,
                ),
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 10),
        pw.Center(
          child: pw.Text(
            'TAX INVOICE',
            style: pw.TextStyle(
              fontSize: 16,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        ),
        pw.SizedBox(height: 14),
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Invoice Details:',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 6),
                  _detailLine('Invoice Number:', orderNumber),
                  _detailLine('Invoice Date:', _formatDate(invoiceDate)),
                  _detailLine('Order Number:', orderNumber),
                  _detailLine('Order Date:', _formatDate(invoiceDate)),
                  _detailLine('Order Status:', _statusText(order.status), boldValue: true),
                  _detailLine('Payment Status:', paymentStatus),
                  _detailLine('Payment Method:', _paymentLabel(order.paymentMethod)),
                ],
              ),
            ),
            pw.SizedBox(width: 24),
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Bill To / Ship To:',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Text(
                    customer != null && customer.name.isNotEmpty
                        ? customer.name
                        : 'Not provided',
                    style: const pw.TextStyle(fontSize: 12),
                  ),
                  if (customer != null && customer.addressLine1.isNotEmpty)
                    pw.Text(customer.addressLine1, style: const pw.TextStyle(fontSize: 12)),
                  if (customer?.addressLine2?.isNotEmpty == true)
                    pw.Text(customer!.addressLine2!, style: const pw.TextStyle(fontSize: 12)),
                  if (customer != null &&
                      (customer!.city?.isNotEmpty == true || customer!.state?.isNotEmpty == true))
                    pw.Text(
                      '${customer!.city ?? ''}${customer!.city != null && customer!.state != null ? ', ' : ''}${customer!.state ?? ''}',
                      style: const pw.TextStyle(fontSize: 12),
                    ),
                  if (customer?.pincode?.isNotEmpty == true)
                    pw.Text('Pincode: ${customer!.pincode}',
                        style: const pw.TextStyle(fontSize: 12)),
                  if (customer != null && customer.phone.isNotEmpty)
                    pw.Text('Phone: ${customer.phone}', style: const pw.TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 18),
        pw.Text(
          'Order Items:',
          style: pw.TextStyle(
            fontSize: 13,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
        pw.SizedBox(height: 8),
        if (order.items.isEmpty)
          pw.Text(
            'No items found for this order.',
            style: pw.TextStyle(color: PdfColors.grey600),
          )
        else
          pw.Table(
            border: pw.TableBorder.all(
              color: PdfColors.grey300,
              width: 0.6,
            ),
            columnWidths: {
              0: const pw.FixedColumnWidth(40),
              1: const pw.FlexColumnWidth(3),
              2: const pw.FlexColumnWidth(1),
              3: const pw.FlexColumnWidth(1.2),
              4: const pw.FlexColumnWidth(1.2),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                children: [
                  _tableHeaderCell('S.No.'),
                  _tableHeaderCell('Item'),
                  _tableHeaderCell('Qty'),
                  _tableHeaderCell('Unit Price'),
                  _tableHeaderCell('Total'),
                ],
              ),
              ...order.items.asMap().entries.map((entry) {
                final item = entry.value;
                return pw.TableRow(
                  children: [
                    _tableCell('${entry.key + 1}'),
                    _tableCell(item.productName),
                    _tableCell(item.quantity.toString()),
                    _tableCell(_rs(item.price)),
                    _tableCell(_rs(item.lineTotal)),
                  ],
                );
              }),
            ],
          ),
        pw.SizedBox(height: 12),
        pw.Align(
          alignment: pw.Alignment.centerRight,
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              _summaryLine('Subtotal (Excl. of all taxes):', _rs(subtotal)),
              _summaryLine('GST:', _rs(gstAmount)),
              _summaryLine('Shipping Charges:', _rs(shipping)),
              pw.SizedBox(height: 6),
              pw.Row(
                mainAxisSize: pw.MainAxisSize.min,
                children: [
                  pw.Text(
                    'Total Amount: ',
                    style: pw.TextStyle(
                      fontSize: 14,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    _rs(totalAmount),
                    style: pw.TextStyle(
                      fontSize: 16,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromInt(const Color(0xFFdc2626).value),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 14),
        pw.Text(
          'Payment Information:',
          style: pw.TextStyle(
            fontWeight: pw.FontWeight.bold,
            fontSize: 12,
          ),
        ),
        pw.SizedBox(height: 6),
        pw.Text('Payment Method: ${_paymentLabel(order.paymentMethod)}'),
        pw.Text('Payment Status: $paymentStatus'),
        if (showQr && qrBytes != null) ...[
          pw.SizedBox(height: 12),
          pw.Text(
            'Scan to pay (UPI):',
            style: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              fontSize: 12,
            ),
          ),
          pw.SizedBox(height: 8),
          pw.Center(
            child: pw.Container(
              padding: const pw.EdgeInsets.all(8),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.6),
              ),
              child: pw.Image(
                pw.MemoryImage(qrBytes),
                width: 120,
                height: 120,
              ),
            ),
          ),
          pw.SizedBox(height: 6),
          pw.Text('UPI ID: 9545235223@kotak'),
          pw.Text('Amount: ${_rs(totalAmount)}'),
        ],
        pw.SizedBox(height: 24),
        pw.Divider(color: PdfColors.grey400, thickness: 0.6),
        pw.SizedBox(height: 10),
        pw.Center(
          child: pw.Column(
            children: [
              pw.Text(
                'Thank you for your business!',
                style: pw.TextStyle(
                  fontStyle: pw.FontStyle.italic,
                  fontSize: 11,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Text(
                'This is a computer-generated invoice and does not require a signature.',
                style: pw.TextStyle(
                  fontSize: 9,
                  color: PdfColors.grey700,
                  fontStyle: pw.FontStyle.italic,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Text(
                'For any queries, please contact us at support@restrobazaar.com',
                style: pw.TextStyle(
                  fontSize: 9,
                  color: PdfColors.grey700,
                  fontStyle: pw.FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  return pdf.save();
}

pw.Widget _detailLine(String label, String value, {bool boldValue = false}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 3),
    child: pw.RichText(
      text: pw.TextSpan(
        children: [
          pw.TextSpan(
            text: '$label ',
            style: pw.TextStyle(
              fontSize: 12,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
          pw.TextSpan(
            text: value,
            style: pw.TextStyle(
              fontSize: 12,
              fontWeight: boldValue ? pw.FontWeight.bold : pw.FontWeight.normal,
            ),
          ),
        ],
      ),
    ),
  );
}

pw.Widget _tableHeaderCell(String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 6),
    child: pw.Text(
      value,
      style: pw.TextStyle(
        fontWeight: pw.FontWeight.bold,
        fontSize: 11,
      ),
    ),
  );
}

pw.Widget _tableCell(String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 6),
    child: pw.Text(
      value,
      style: const pw.TextStyle(fontSize: 11),
    ),
  );
}

pw.Widget _summaryLine(String label, String value) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 6),
    child: pw.Row(
      mainAxisSize: pw.MainAxisSize.min,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 12,
            color: PdfColors.grey700,
          ),
        ),
        pw.SizedBox(width: 6),
        pw.Text(
          value,
          style: const pw.TextStyle(
            fontSize: 12,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
      ],
    ),
  );
}

double _calculateGstFromItems(List<CartItem> items) {
  final total = items.fold<double>(0, (sum, item) {
    final itemTotal =
        item.unitPriceForQuantity(item.quantity) * item.quantity;
    final gstAmount = (itemTotal * item.gstPercentage) / 100;
    return sum + gstAmount;
  });
  return double.parse(total.toStringAsFixed(2));
}

String _rs(num value) => 'Rs. ${value.toStringAsFixed(2)}';

String _formatDate(DateTime? date) {
  if (date == null) return 'Date unavailable';
  return DateFormat('MMMM d, y').format(date);
}

String _paymentLabel(String? method) {
  final value = method?.toLowerCase() ?? '';
  switch (value) {
    case 'cod':
    case 'cash on delivery':
      return 'Cash on delivery';
    case 'online':
    case 'upi':
      return 'Online / UPI';
    default:
      return value.isNotEmpty ? _titleCase(value) : 'Not specified';
  }
}

String _buildUpiUrl(double amount, String orderNumber) {
  const vpa = '9545235223@kotak';
  const merchant = 'RestroBazaar';
  final note = 'Order $orderNumber - $merchant';
  return 'upi://pay?pa=$vpa&pn=${Uri.encodeComponent(merchant)}&am=${amount.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(note)}';
}

Future<Uint8List?> _buildQrBytes(String data) async {
  final painter = QrPainter(
    data: data,
    version: QrVersions.auto,
    gapless: false,
  );
  final byteData = await painter.toImageData(
    200,
    format: ui.ImageByteFormat.png,
  );
  if (byteData == null) return null;
  return byteData.buffer.asUint8List();
}

String _shortOrderId(String id) {
  if (id.isEmpty) return '—';
  final trimmed = id.length > 8 ? id.substring(0, 8) : id;
  return trimmed.toUpperCase();
}

String _statusText(String status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Order Pending';
    case 'confirmed':
      return 'Order Confirmed';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return _titleCase(status);
  }
}

_StatusStyle _statusStyleFor(String status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return const _StatusStyle(
        background: Color(0xFFfefce8),
        text: Color(0xFF854d0e),
        border: Color(0xFFfef3c7),
      );
    case 'confirmed':
      return const _StatusStyle(
        background: Color(0xFFeff6ff),
        text: Color(0xFF1e40af),
        border: Color(0xFFbfdbfe),
      );
    case 'processing':
      return const _StatusStyle(
        background: Color(0xFFfaf5ff),
        text: Color(0xFF6b21a8),
        border: Color(0xFFe9d5ff),
      );
    case 'shipped':
      return const _StatusStyle(
        background: Color(0xFFeef2ff),
        text: Color(0xFF4338ca),
        border: Color(0xFFc7d2fe),
      );
    case 'delivered':
      return const _StatusStyle(
        background: Color(0xFFecfdf3),
        text: Color(0xFF166534),
        border: Color(0xFFbbf7d0),
      );
    case 'cancelled':
      return const _StatusStyle(
        background: Color(0xFFfef2f2),
        text: Color(0xFFb91c1c),
        border: Color(0xFFfecdd3),
      );
    default:
      return const _StatusStyle(
        background: Color(0xFFf3f4f6),
        text: Color(0xFF374151),
        border: Color(0xFFe5e7eb),
      );
  }
}

String _titleCase(String value) {
  if (value.trim().isEmpty) return 'Unknown';
  final lower = value.toLowerCase();
  return lower[0].toUpperCase() + lower.substring(1);
}
