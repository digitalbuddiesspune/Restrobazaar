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
import '../../core/order_id_formatter.dart';
import '../../models/address.dart';
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
            return _EmptyOrders(onShop: () => context.go('/home'));
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            children: [
              const SizedBox(height: 4),
              const Text(
                'Your Orders',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              Text(
                '${orders.length} order${orders.length == 1 ? '' : 's'} placed',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
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
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
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
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              const Text(
                'Start shopping to see your orders here',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF6b7280)),
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
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
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
                      'Order ${_displayOrderId(order)}',
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
          style: const TextStyle(fontSize: 12, color: Color(0xFF6b7280)),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
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
                style: const TextStyle(color: Color(0xFF6b7280), fontSize: 12),
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
  final canCancel = ![
    'cancelled',
    'delivered',
  ].contains(order.status.toLowerCase());
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
                        'Order ${_displayOrderId(order)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    _StatusChip(
                      label: _statusText(order.status),
                      style: statusStyle,
                    ),
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
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
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
                              bottom: entry.key == order.items.length - 1
                                  ? 0
                                  : 10,
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
    final filename =
        'Invoice-${_displayOrderId(order).replaceAll('#', '')}.pdf';
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
  final subtotal =
      order.billingDetails?.cartTotal ??
      order.cartTotal ??
      order.items.fold<double>(0, (sum, item) => sum + item.lineTotal);
  final gstAmount =
      order.billingDetails?.gstAmount ??
      order.gstAmount ??
      _calculateGstFromItems(order.items);
  final shipping =
      order.billingDetails?.shippingCharges ?? order.shippingCharges ?? 0;
  final couponDiscount = order.couponAmount ?? 0;
  final totalAmount =
      order.billingDetails?.totalAmount ??
      (order.totalAmount != 0
          ? order.totalAmount
          : subtotal + gstAmount + shipping - couponDiscount);

  final vendor = order.vendor;
  final vendorName = vendor?.businessName.isNotEmpty == true
      ? vendor!.businessName
      : 'AK Enterprises';
  final vendorEmail = vendor?.email?.isNotEmpty == true
      ? vendor!.email!
      : 'pune@restrobazaar.com';
  final vendorGst = vendor?.gstNumber?.isNotEmpty == true
      ? vendor!.gstNumber!
      : '27DJSPK2679K1ZB';
  final vendorState = vendor?.state?.isNotEmpty == true
      ? vendor!.state!
      : 'Maharashtra';
  final stateCode = _stateCode(vendorState);
  final bank = vendor?.bankDetails;
  final bankName = bank?.bankName?.isNotEmpty == true
      ? bank!.bankName!
      : 'Kotak Mahindra Bank';
  final bankIfsc = bank?.ifsc?.isNotEmpty == true ? bank!.ifsc! : 'KKBK0001767';
  final accountName = bank?.accountHolderName?.isNotEmpty == true
      ? bank!.accountHolderName!
      : vendorName;
  final accountNumber = bank?.accountNumber?.isNotEmpty == true
      ? bank!.accountNumber!
      : '9545235223';
  final upiId = bank?.upiId?.isNotEmpty == true
      ? bank!.upiId!
      : '9545235223@kotak';

  final formattedOrderId = _displayOrderId(order);
  final orderNumberForDisplay = formattedOrderId.replaceAll('#', '');
  final invoiceNumber = order.invoiceNumber?.isNotEmpty == true
      ? order.invoiceNumber!
      : 'RBZ-$formattedOrderId';
  final paymentStatus = order.paymentStatus?.toLowerCase() == 'completed'
      ? 'Paid'
      : 'Unpaid';
  final paymentModeText = _paymentModeText(order.paymentMethod);
  final placeOfSupply = '$stateCode - $vendorState';
  final gstDisplay = order.gstNumber?.trim().isNotEmpty == true
      ? order.gstNumber!.trim()
      : 'URP';
  final customerName = customer?.name.isNotEmpty == true
      ? customer!.name
      : 'N/A';
  final customerPhone = customer?.phone.isNotEmpty == true
      ? customer!.phone
      : '';
  final customerAddress = _buildInvoiceAddress(customer);

  final upiUrl =
      'upi://pay?pa=${Uri.encodeComponent(upiId)}&pn=${Uri.encodeComponent(accountName)}&am=${totalAmount.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(invoiceNumber)}';
  final qrBytes = await _buildQrBytes(upiUrl);
  final groupedTaxes = _buildSgstCgstBreakdownFromItems(order.items);

  final invoiceRows = <List<String>>[
    ['Invoice No:', invoiceNumber],
    ['Order No:', orderNumberForDisplay],
    ['Order Status:', _statusText(order.status)],
    ['Payment Mode:', paymentModeText],
    ['Place of Supply:', placeOfSupply],
    ['Invoice Date:', _formatInvoiceDate(invoiceDate)],
    ['Order Date:', _formatInvoiceDate(invoiceDate)],
    ['Payment Status:', paymentStatus],
  ];

  final orderRows = order.items.asMap().entries.map((entry) {
    final item = entry.value;
    final taxableValue = item.lineTotal;
    final itemGstAmount =
        item.gstAmount ?? ((taxableValue * item.gstPercentage) / 100);
    final amount = taxableValue + itemGstAmount;
    final hsn = item.hsnCode?.isNotEmpty == true ? item.hsnCode! : '39231090';
    return <String>[
      '${entry.key + 1}',
      item.productName,
      hsn,
      item.quantity.toString(),
      _n(item.price),
      _n(taxableValue),
      _n(item.gstPercentage),
      _n(itemGstAmount),
      _n(amount),
    ];
  }).toList();

  final summaryRows = <_InvoiceSummaryRow>[
    _InvoiceSummaryRow('Sub Total:', _n(subtotal)),
    ...groupedTaxes.expand(
      (line) => [
        _InvoiceSummaryRow(
          'SGST (${_formatTaxPercent(line.sgstRate)}%):',
          _n(line.sgstAmount),
        ),
        _InvoiceSummaryRow(
          'CGST (${_formatTaxPercent(line.cgstRate)}%):',
          _n(line.cgstAmount),
        ),
      ],
    ),
    _InvoiceSummaryRow(
      'Shipping Charges:',
      shipping == 0 ? 'Free' : _n(shipping),
    ),
    if (couponDiscount > 0)
      _InvoiceSummaryRow('Coupon Discount:', '-${_n(couponDiscount)}'),
    _InvoiceSummaryRow('Total Amount:', _n(totalAmount), isTotal: true),
  ];

  final amountInWords = _numberToWords(totalAmount);

  final pdf = pw.Document();
  pdf.addPage(
    pw.MultiPage(
      pageTheme: const pw.PageTheme(
        margin: pw.EdgeInsets.fromLTRB(26, 24, 26, 24),
        textDirection: pw.TextDirection.ltr,
      ),
      build: (_) => [
        pw.Center(
          child: pw.Text(
            'RESTROBAZAAR',
            style: pw.TextStyle(
              fontSize: 22,
              fontWeight: pw.FontWeight.bold,
              color: PdfColor.fromInt(const Color(0xFFdc2626).value),
            ),
          ),
        ),
        pw.SizedBox(height: 2),
        pw.Center(
          child: pw.Text(
            'Your Trusted Packaging Solutions Partner',
            style: const pw.TextStyle(fontSize: 10),
          ),
        ),
        pw.SizedBox(height: 2),
        pw.Center(
          child: pw.Text(
            'By: $vendorName | Email: $vendorEmail | GST No: $vendorGst | State Code: $stateCode',
            style: const pw.TextStyle(fontSize: 8),
          ),
        ),
        pw.SizedBox(height: 8),
        pw.Divider(color: PdfColors.black, thickness: 1),
        pw.Center(
          child: pw.Text(
            'TAX INVOICE',
            style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
          ),
        ),
        pw.Divider(color: PdfColors.black, thickness: 1),
        pw.SizedBox(height: 8),

        _invoiceSectionHeader('Invoice Details'),
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey700, width: 0.5),
          columnWidths: const {
            0: pw.FlexColumnWidth(1.3),
            1: pw.FlexColumnWidth(2.7),
          },
          children: invoiceRows
              .map(
                (row) => pw.TableRow(
                  children: [
                    _invoiceTableCell(row[0], isHeader: false),
                    _invoiceTableCell(row[1], bold: true),
                  ],
                ),
              )
              .toList(),
        ),
        pw.SizedBox(height: 8),

        _invoiceSectionHeader('Bill To'),
        pw.Padding(
          padding: const pw.EdgeInsets.symmetric(horizontal: 3, vertical: 4),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                'Customer Name/ Restaurant Name: $customerName',
                style: const pw.TextStyle(fontSize: 8),
              ),
              if (customerPhone.isNotEmpty)
                pw.Text(
                  'Phone: $customerPhone',
                  style: const pw.TextStyle(fontSize: 8),
                ),
              pw.Text(
                'Address: $customerAddress',
                style: const pw.TextStyle(fontSize: 8),
              ),
              pw.Text(
                'GST No: $gstDisplay',
                style: const pw.TextStyle(fontSize: 8),
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 8),

        _invoiceSectionHeader('Order Details'),
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey700, width: 0.5),
          columnWidths: const {
            0: pw.FixedColumnWidth(28),
            1: pw.FlexColumnWidth(2.5),
            2: pw.FixedColumnWidth(46),
            3: pw.FixedColumnWidth(28),
            4: pw.FixedColumnWidth(34),
            5: pw.FixedColumnWidth(42),
            6: pw.FixedColumnWidth(28),
            7: pw.FixedColumnWidth(40),
            8: pw.FixedColumnWidth(46),
          },
          children: [
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: PdfColors.grey300),
              children: [
                _InvoiceHeaderCell('Sr\nNo'),
                _InvoiceHeaderCell('Item Name'),
                _InvoiceHeaderCell('HSN'),
                _InvoiceHeaderCell('Qty'),
                _InvoiceHeaderCell('Rate'),
                _InvoiceHeaderCell('Taxable\nValue'),
                _InvoiceHeaderCell('GST\n%'),
                _InvoiceHeaderCell('GST\nAmount'),
                _InvoiceHeaderCell('Amount'),
              ],
            ),
            ...orderRows.map(
              (row) => pw.TableRow(
                children: [
                  _invoiceTableCell(row[0], align: pw.TextAlign.center),
                  _invoiceTableCell(row[1], align: pw.TextAlign.center),
                  _invoiceTableCell(row[2], align: pw.TextAlign.center),
                  _invoiceTableCell(row[3], align: pw.TextAlign.center),
                  _invoiceTableCell(row[4], align: pw.TextAlign.center),
                  _invoiceTableCell(row[5], align: pw.TextAlign.center),
                  _invoiceTableCell(row[6], align: pw.TextAlign.center),
                  _invoiceTableCell(row[7], align: pw.TextAlign.center),
                  _invoiceTableCell(row[8], align: pw.TextAlign.center),
                ],
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 6),
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(child: pw.SizedBox()),
            pw.SizedBox(
              width: 210,
              child: pw.Table(
                border: pw.TableBorder.all(
                  color: PdfColors.grey700,
                  width: 0.5,
                ),
                columnWidths: const {
                  0: pw.FlexColumnWidth(2),
                  1: pw.FlexColumnWidth(1),
                },
                children: summaryRows
                    .map(
                      (row) => pw.TableRow(
                        decoration: row.isTotal
                            ? const pw.BoxDecoration(color: PdfColors.grey800)
                            : null,
                        children: [
                          _invoiceTableCell(
                            row.label,
                            color: row.isTotal
                                ? PdfColors.white
                                : PdfColors.black,
                          ),
                          _invoiceTableCell(
                            row.value,
                            align: pw.TextAlign.right,
                            bold: true,
                            color: row.isTotal
                                ? PdfColors.white
                                : PdfColors.black,
                          ),
                        ],
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 8),
        pw.Text(
          'Amount in Words:',
          style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9),
        ),
        pw.Text(amountInWords, style: const pw.TextStyle(fontSize: 8)),
        pw.SizedBox(height: 10),
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Bank Details:',
                    style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 9,
                    ),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Text(
                    'Bank: $bankName',
                    style: const pw.TextStyle(fontSize: 8),
                  ),
                  pw.Text(
                    'IFSC Code: $bankIfsc',
                    style: const pw.TextStyle(fontSize: 8),
                  ),
                  pw.Text(
                    'Account Name: $accountName',
                    style: const pw.TextStyle(fontSize: 8),
                  ),
                  pw.Text(
                    'Account No: $accountNumber',
                    style: const pw.TextStyle(fontSize: 8),
                  ),
                  pw.Text(
                    'UPI ID: $upiId',
                    style: const pw.TextStyle(fontSize: 8),
                  ),
                ],
              ),
            ),
            if (qrBytes != null)
              pw.Column(
                children: [
                  pw.Text(
                    'Scan to Pay',
                    style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 8,
                    ),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Image(pw.MemoryImage(qrBytes), width: 110, height: 110),
                ],
              ),
          ],
        ),
        pw.SizedBox(height: 10),
        pw.Text(
          'This is a computer generated Invoice.',
          style: pw.TextStyle(fontSize: 7, color: PdfColors.grey700),
        ),
        pw.Text(
          'Reverse Charge: No',
          style: pw.TextStyle(fontSize: 7, color: PdfColors.grey700),
        ),
      ],
    ),
  );

  return pdf.save();
}

pw.Widget _invoiceSectionHeader(String title) {
  return pw.Container(
    color: PdfColors.grey800,
    width: double.infinity,
    padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
    child: pw.Text(
      title,
      style: pw.TextStyle(
        color: PdfColors.white,
        fontSize: 9,
        fontWeight: pw.FontWeight.bold,
      ),
    ),
  );
}

pw.Widget _invoiceTableCell(
  String value, {
  bool bold = false,
  bool isHeader = false,
  pw.TextAlign align = pw.TextAlign.left,
  PdfColor color = PdfColors.black,
}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
    child: pw.Text(
      value,
      textAlign: align,
      style: pw.TextStyle(
        fontSize: isHeader ? 8 : 7.8,
        fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
        color: color,
      ),
    ),
  );
}

String _paymentModeText(String? paymentMethod) {
  final method = paymentMethod?.toLowerCase() ?? '';
  if (method == 'cod' || method == 'cash on delivery') return 'Cash';
  if (method == 'online' || method == 'upi') return 'UPI / Bank Transfer';
  return 'UPI / Cash / Bank Transfer';
}

String _buildInvoiceAddress(AddressModel? customer) {
  if (customer == null) return 'N/A';
  final parts = <String>[
    if (customer.addressLine1.isNotEmpty) customer.addressLine1,
    if (customer.addressLine2?.isNotEmpty == true) customer.addressLine2!,
    if (customer.city?.isNotEmpty == true) customer.city!,
    if (customer.state?.isNotEmpty == true) customer.state!,
    if (customer.pincode?.isNotEmpty == true) customer.pincode!,
  ];
  return parts.isEmpty ? 'N/A' : parts.join(', ');
}

String _formatInvoiceDate(DateTime date) {
  return DateFormat('d-MMM-yyyy').format(date);
}

String _stateCode(String state) {
  const map = {
    'Maharashtra': '27',
    'Gujarat': '24',
    'Karnataka': '29',
    'Tamil Nadu': '33',
    'Delhi': '07',
    'West Bengal': '19',
    'Rajasthan': '08',
    'Uttar Pradesh': '09',
    'Punjab': '03',
    'Haryana': '06',
  };
  return map[state] ?? '27';
}

String _n(num value) => value.toStringAsFixed(2);

class _InvoiceHeaderCell extends pw.StatelessWidget {
  _InvoiceHeaderCell(this.text);

  final String text;

  @override
  pw.Widget build(pw.Context context) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 3, vertical: 3),
      child: pw.Text(
        text,
        textAlign: pw.TextAlign.center,
        style: pw.TextStyle(fontSize: 7.2, fontWeight: pw.FontWeight.bold),
      ),
    );
  }
}

class _InvoiceSummaryRow {
  const _InvoiceSummaryRow(this.label, this.value, {this.isTotal = false});

  final String label;
  final String value;
  final bool isTotal;
}

String _numberToWords(double value) {
  final ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  final tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  String convertHundreds(int n) {
    if (n == 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      final t = n ~/ 10;
      final o = n % 10;
      return tens[t] + (o > 0 ? ' ${ones[o]}' : '');
    }
    final h = n ~/ 100;
    final rem = n % 100;
    return '${ones[h]} Hundred${rem > 0 ? ' ${convertHundreds(rem)}' : ''}';
  }

  String convertIndian(int n) {
    if (n == 0) return 'Zero';
    if (n < 1000) return convertHundreds(n);
    if (n < 100000) {
      final thousand = n ~/ 1000;
      final rem = n % 1000;
      return '${convertHundreds(thousand)} Thousand${rem > 0 ? ' ${convertHundreds(rem)}' : ''}';
    }
    if (n < 10000000) {
      final lakh = n ~/ 100000;
      final rem = n % 100000;
      return '${convertHundreds(lakh)} Lakh${rem > 0 ? ' ${convertIndian(rem)}' : ''}';
    }
    final crore = n ~/ 10000000;
    final rem = n % 10000000;
    return '${convertHundreds(crore)} Crore${rem > 0 ? ' ${convertIndian(rem)}' : ''}';
  }

  final rupees = value.floor();
  final paise = ((value - rupees) * 100).round();
  var result = '${convertIndian(rupees)} Rupees';
  if (paise > 0) {
    result += ' and ${convertHundreds(paise)} Paisa';
  }
  return '$result Only';
}

double _calculateGstFromItems(List<CartItem> items) {
  final total = items.fold<double>(0, (sum, item) {
    final itemTotal = item.unitPriceForQuantity(item.quantity) * item.quantity;
    final gstAmount = (itemTotal * item.gstPercentage) / 100;
    return sum + gstAmount;
  });
  return double.parse(total.toStringAsFixed(2));
}

class _TaxBreakdownLine {
  const _TaxBreakdownLine({
    required this.cgstRate,
    required this.sgstRate,
    required this.cgstAmount,
    required this.sgstAmount,
  });

  final double cgstRate;
  final double sgstRate;
  final double cgstAmount;
  final double sgstAmount;
}

List<_TaxBreakdownLine> _buildSgstCgstBreakdownFromItems(List<CartItem> items) {
  final Map<String, double> groupedGstAmounts = {};
  for (final item in items) {
    if (item.gstPercentage <= 0) continue;
    final itemTotal = item.unitPriceForQuantity(item.quantity) * item.quantity;
    final gstAmount = (itemTotal * item.gstPercentage) / 100;
    if (gstAmount <= 0) continue;
    final key = item.gstPercentage.toStringAsFixed(2);
    groupedGstAmounts[key] = (groupedGstAmounts[key] ?? 0) + gstAmount;
  }

  final lines = groupedGstAmounts.entries.map((entry) {
    final gstPercentage = double.parse(entry.key);
    final totalGst = double.parse(entry.value.toStringAsFixed(2));
    final halfRate = double.parse((gstPercentage / 2).toStringAsFixed(2));
    final halfAmount = double.parse((totalGst / 2).toStringAsFixed(2));
    return _TaxBreakdownLine(
      cgstRate: halfRate,
      sgstRate: halfRate,
      cgstAmount: halfAmount,
      sgstAmount: halfAmount,
    );
  }).toList();

  lines.sort((a, b) => b.cgstRate.compareTo(a.cgstRate));
  return lines;
}

String _formatTaxPercent(double value) {
  final isWhole = value == value.roundToDouble();
  return isWhole ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
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

String _displayOrderId(OrderModel order) {
  final rawOrderId = order.orderNumber?.isNotEmpty == true
      ? order.orderNumber!
      : order.id;
  return formatOrderId(rawOrderId);
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
