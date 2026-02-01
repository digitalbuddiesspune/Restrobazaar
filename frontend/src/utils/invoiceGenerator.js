import jsPDF from 'jspdf';
import { formatOrderId } from './orderIdFormatter';

// Fetch QR code image as base64 data URL for UPI payment
const fetchUPIQRAsDataURL = async (upiUrl) => {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=5&data=${encodeURIComponent(upiUrl)}`;
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
};

// Convert number to words for invoice amount
export const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convertHundreds = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
  };
  
  const convert = (n) => {
    if (n === 0) return '';
    
    if (n < 1000) return convertHundreds(n);
    if (n < 100000) {
      const thousand = Math.floor(n / 1000);
      const remainder = n % 1000;
      return convertHundreds(thousand) + ' Thousand' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
    }
    if (n < 10000000) {
      const lakh = Math.floor(n / 100000);
      const remainder = n % 100000;
      return convertHundreds(lakh) + ' Lakh' + (remainder > 0 ? ' ' + convert(remainder) : '');
    }
    const crore = Math.floor(n / 10000000);
    const remainder = n % 10000000;
    return convertHundreds(crore) + ' Crore' + (remainder > 0 ? ' ' + convert(remainder) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertHundreds(paise) + ' Paisa';
  }
  return result + ' Only';
};

// Get state code from state name
export const getStateCode = (stateName) => {
  const stateCodes = {
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
  return stateCodes[stateName] || '';
};

// Format date for invoice
export const formatDateForInvoice = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Get status text
export const getStatusText = (status) => {
  const texts = {
    pending: 'Order Pending',
    confirmed: 'Order Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return texts[status] || status;
};

// Generate invoice PDF
export const generateInvoicePDF = async (order, vendor = {}) => {
  try {
    const doc = new jsPDF();
    // Set default font and encoding to avoid text rendering issues
    doc.setFont('helvetica');
    doc.setFontSize(10);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20; // Increased from 10 to add more space from top
    const leftMargin = 10;
    const rightMargin = pageWidth - 10;
    const contentWidth = pageWidth - 20;

    // Get vendor information
    const vendorName = vendor.businessName || 'AK Enterprises';
    const vendorEmail = vendor.email || 'support@restrobazaar.com';
    const vendorGSTIN = vendor.gstNumber || '27DJSPK2679K1ZB';
    const vendorState = vendor.address?.state || 'Maharashtra';
    const vendorStateCode = getStateCode(vendorState) || '27';

    // Get customer information
    const customer = order.deliveryAddress || {};
    const customerName = customer.name || 'Customer Name';
    const customerAddressLine1 = customer.addressLine1 || '';
    const customerAddressLine2 = customer.addressLine2 || '';
    const customerCity = customer.city || '';
    const customerState = customer.state || '';
    const customerPincode = customer.pincode || '';
    const customerGSTIN = customer.gstNumber || 'URP';
    
    // Build full address string
    const addressParts = [customerAddressLine1];
    if (customerAddressLine2) addressParts.push(customerAddressLine2);
    if (customerCity) addressParts.push(customerCity);
    if (customerState) addressParts.push(customerState);
    if (customerPincode) addressParts.push(customerPincode);
    const customerAddress = addressParts.join(', ');

    // Calculate totals - use stored billingDetails for accuracy
    const billing = order.billingDetails || {};
    const cartTotal = parseFloat(billing.cartTotal) || 0;
    const totalGstAmount = parseFloat(billing.gstAmount) || 0;
    const shippingCharges = parseFloat(billing.shippingCharges) || 0;
    const couponDiscount = parseFloat(order.couponAmount ?? billing.couponDiscount) || 0;
    const totalAmount = parseFloat(billing.totalAmount) || (cartTotal + totalGstAmount + shippingCharges - couponDiscount);
    
    // Verify totals by summing items (for validation, but use billingDetails for display)
    let calculatedCartTotal = 0;
    let calculatedGstAmount = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const itemSubtotal = parseFloat(item.total) || (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        const itemGst = parseFloat(item.gstAmount) || 0;
        calculatedCartTotal += itemSubtotal;
        calculatedGstAmount += itemGst;
      });
    }
    
    // Use billingDetails values (they are the source of truth), but log if there's a mismatch
    if (Math.abs(calculatedCartTotal - cartTotal) > 0.01 || Math.abs(calculatedGstAmount - totalGstAmount) > 0.01) {
      console.warn('Invoice totals mismatch - using billingDetails values:', {
        billingCartTotal: cartTotal,
        calculatedCartTotal,
        billingGstAmount: totalGstAmount,
        calculatedGstAmount
      });
    }
    
    // Calculate CGST and SGST (assuming equal split for intra-state)
    const cgstAmount = totalGstAmount / 2;
    const sgstAmount = totalGstAmount / 2;
    // Calculate GST rate - percentage based on cartTotal
    // Rate = (GST Amount / Cart Total) * 100
    const cgstRate = cartTotal > 0 && totalGstAmount > 0 
      ? Math.round((cgstAmount / cartTotal) * 100 * 100) / 100  // Round to 2 decimal places
      : 0;
    const sgstRate = cgstRate;

    // ========== HEADER SECTION ==========
    // "RESTROBAZAAR" in red, bold, larger font
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38); // Red color
    doc.setFont(undefined, 'bold');
    doc.text('RESTROBAZAAR', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // Tagline
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text('Your Trusted Packaging Solutions Partner', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    // Vendor information
    doc.setFontSize(9);
    const vendorInfo = `By: ${vendorName} | Email: ${vendorEmail} | GST No: ${vendorGSTIN} | State Code: ${vendorStateCode}`;
    doc.text(vendorInfo, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;

    // Divider line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 5;

    // "TAX INVOICE" title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 3;

    // Divider line
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 8;

    // ========== INVOICE DETAILS SECTION ==========
    // Header bar with dark gray background
    doc.setFillColor(64, 64, 64); // Dark gray
    doc.rect(leftMargin, yPos - 3, contentWidth, 6, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont(undefined, 'bold');
    // Center text vertically in the gray bar
    doc.text('Invoice Details', leftMargin + 3, yPos - -0.5);
    yPos += 8;

    // Invoice details table with borders and alternating backgrounds
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    // Determine payment mode text
    const paymentModeText = order.paymentMethod === 'cod' 
      ? 'Cash' 
      : order.paymentMethod === 'online' 
        ? 'UPI / Bank Transfer' 
        : 'UPI / Cash / Bank Transfer';
    
    // Format invoice and order numbers correctly
    // Use GST-compliant invoice number if available, otherwise use formatted order ID
    let invoiceNumber = null;
    let formattedOrderNo = null;
    
    // Priority: Use invoiceNumber from order (GST-compliant) if available
    if (order.invoiceNumber) {
      invoiceNumber = order.invoiceNumber;
      // For display, we can still show formatted order ID
      const orderId = order.orderNumber || order._id || order.order_id;
      formattedOrderNo = formatOrderId(orderId);
    } else {
      // Fallback: Use formatted order ID if invoice number not available
      let orderId = null;
      if (order.orderNumber) {
        orderId = String(order.orderNumber);
      } else if (order._id) {
        orderId = String(order._id);
      } else if (order.order_id) {
        orderId = String(order.order_id);
      }
      
      if (!orderId) {
        throw new Error('Order ID is missing. Cannot generate invoice.');
      }
      
      formattedOrderNo = formatOrderId(orderId);
      // Use formatted order ID as invoice number (legacy format)
      invoiceNumber = `RBZ-${formattedOrderNo}`;
    }
    
    const invoiceDetails = [
      ['Invoice No:', invoiceNumber],
      ['Order No:', formattedOrderNo],
      ['Order Status:', getStatusText(order.orderStatus)],
      ['Payment Mode:', paymentModeText],
      ['Place of Supply:', `${vendorStateCode} – ${vendorState}`],
      ['Invoice Date:', formatDateForInvoice(order.createdAt)],
      ['Order Date:', formatDateForInvoice(order.createdAt)],
      ['Payment Status:', order.paymentStatus === 'completed' ? 'Paid' : 'Unpaid'],
    ];

    const col1X = leftMargin;
    const col2X = leftMargin + 60;
    const col1Width = 57;
    const col2Width = contentWidth - col1Width;
    const rowHeight = 4;
    const tableStartY = yPos;

    // Draw table with borders and alternating backgrounds
    invoiceDetails.forEach(([label, value], index) => {
      const rowY = tableStartY + (index * rowHeight);
      
      // Alternating row background (light gray for even rows)
      if (index % 2 === 1) {
        doc.setFillColor(240, 240, 240); // Light gray
        doc.rect(col1X, rowY - 3, contentWidth, rowHeight, 'F');
      }
      
      // Draw cell borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      // Left border
      doc.line(col1X, rowY - 3, col1X, rowY - 3 + rowHeight);
      // Right border
      doc.line(col1X + contentWidth, rowY - 3, col1X + contentWidth, rowY - 3 + rowHeight);
      // Top border
      doc.line(col1X, rowY - 3, col1X + contentWidth, rowY - 3);
      // Bottom border
      doc.line(col1X, rowY - 3 + rowHeight, col1X + contentWidth, rowY - 3 + rowHeight);
      // Middle border between columns
      doc.line(col2X, rowY - 3, col2X, rowY - 3 + rowHeight);
      
      // Draw text
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(label, col1X + 3, rowY);
      doc.setFont(undefined, 'bold');
      doc.text(value, col2X + 3, rowY);
    });
    
    yPos = tableStartY + (invoiceDetails.length * rowHeight);
    yPos += 3;

    // ========== BILL TO SECTION ==========
    // Header bar
    doc.setFillColor(64, 64, 64);
    doc.rect(leftMargin, yPos - 3, contentWidth, 6, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    // Center text vertically in the gray bar
    doc.text('Bill To', leftMargin + 3, yPos - -0.5);
    yPos += 8;

    // Bill To details
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Customer Name/ Restaurant Name: ${customerName}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`Address: ${customerAddress}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`GST No: ${customerGSTIN}`, leftMargin + 3, yPos);
    yPos += 6;

    // ========== ORDER DETAILS SECTION ==========
    // Header bar
    doc.setFillColor(64, 64, 64);
    doc.rect(leftMargin, yPos - 3, contentWidth, 6, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    // Center text vertically in the gray bar
    doc.text('Order Details', leftMargin + 3, yPos - -0.5);
    yPos += 8;

    // Table headers with light gray background and borders
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const orderTableStartY = yPos;
    const headerRowHeight = 5;
    
    // Draw header background
    doc.setFillColor(230, 230, 230); // Light gray background
    doc.rect(leftMargin, yPos - 3, contentWidth, headerRowHeight, 'F');
    
    // Column positions - adjusted to include GST Amount column with proper spacing
    const colSrNoX = leftMargin;
    const colSrNoWidth = 12;
    const colDescX = leftMargin + 12;
    const colDescWidth = 42; // Reduced slightly to make room
    const colHSNX = leftMargin + 54;
    const colHSNWidth = 18;
    const colQtyX = leftMargin + 72;
    const colQtyWidth = 12;
    const colRateX = leftMargin + 84;
    const colRateWidth = 18;
    const colGSTX = leftMargin + 102;
    const colGSTWidth = 16; // Increased from 12 to prevent overlap
    const colGSTAmountX = leftMargin + 118;
    const colGSTAmountWidth = 24; // Increased from 18 to prevent overlap
    const colAmountX = leftMargin + 142;
    const colAmountWidth = rightMargin - colAmountX; // Reduced size
    
    // Draw header borders
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    // Top border
    doc.line(leftMargin, yPos - 3, rightMargin, yPos - 3);
    // Bottom border
    doc.line(leftMargin, yPos - 3 + headerRowHeight, rightMargin, yPos - 3 + headerRowHeight);
    // Column borders
    doc.line(colDescX, yPos - 3, colDescX, yPos - 3 + headerRowHeight);
    doc.line(colHSNX, yPos - 3, colHSNX, yPos - 3 + headerRowHeight);
    doc.line(colQtyX, yPos - 3, colQtyX, yPos - 3 + headerRowHeight);
    doc.line(colRateX, yPos - 3, colRateX, yPos - 3 + headerRowHeight);
    doc.line(colGSTX, yPos - 3, colGSTX, yPos - 3 + headerRowHeight);
    doc.line(colGSTAmountX, yPos - 3, colGSTAmountX, yPos - 3 + headerRowHeight);
    doc.line(colAmountX, yPos - 3, colAmountX, yPos - 3 + headerRowHeight);
    
    // Header text
    doc.setTextColor(0, 0, 0);
    doc.text('Sr No', colSrNoX + 3, yPos);
    doc.text('Item Description', colDescX + 3, yPos);
    doc.text('HSN', colHSNX + 3, yPos);
    const qtyHeaderWidth = doc.getTextWidth('Qty');
    doc.text('Qty', colQtyX + colQtyWidth - qtyHeaderWidth - 3, yPos);
    const rateHeaderWidth = doc.getTextWidth('Rate');
    doc.text('Rate', colRateX + colRateWidth - rateHeaderWidth - 3, yPos);
    // GST % - center or left align to prevent overlap
    doc.text('GST %', colGSTX + 3, yPos);
    // GST Amount - left align with proper spacing
    doc.text('GST Amount', colGSTAmountX + 3, yPos);
    const amountHeaderWidth = doc.getTextWidth('Amount');
    doc.text('Amount', rightMargin - amountHeaderWidth - 3, yPos);
    yPos += headerRowHeight;

    // Table rows with borders
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const baseRowHeight = 5;
    const lineSpacing = 4;
    order.items?.forEach((item, index) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      // Get HSN code from populated productId or fallback to default
      // Priority: item.hsnCode (if stored) > item.productId.hsnCode (from populated product) > default
      let hsnCode = '482369'; // Default fallback
      if (item.hsnCode) {
        hsnCode = item.hsnCode;
      } else if (item.productId) {
        // Check if productId is populated (object) or just an ID (string/ObjectId)
        if (typeof item.productId === 'object' && item.productId !== null && item.productId.hsnCode) {
          hsnCode = item.productId.hsnCode;
        }
      }
      // Use stored values from order for accuracy
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity) || 0;
      // Use item.total if available (stored subtotal), otherwise calculate
      const itemSubtotal = parseFloat(item.total) || (itemPrice * itemQty);
      const itemGstPercentage = parseFloat(item.gstPercentage) || 0;
      // Use stored gstAmount from order (more accurate than recalculating)
      const itemGstAmount = parseFloat(item.gstAmount) || 0;
      // Item total should be subtotal + GST
      const itemTotal = itemSubtotal + itemGstAmount;

      // Ensure all values are properly converted to strings
      const srNo = String(index + 1);
      const qty = String(itemQty);
      const rate = itemPrice.toFixed(2);
      const gstPercent = itemGstPercentage > 0 ? itemGstPercentage.toFixed(2) : '-';
      const gstAmount = itemGstAmount.toFixed(2);
      const amount = itemTotal.toFixed(2);
      const hsnCodeStr = String(hsnCode || '482369');
      
      // Calculate dynamic row height based on product name wrapping
      const maxNameWidth = 38; // Adjusted to match reduced column width
      const productName = String(item.productName || 'Product');
      const productNameLines = doc.splitTextToSize(productName, maxNameWidth);
      const actualRowHeight = baseRowHeight + (productNameLines.length - 1) * lineSpacing;
      const rowStartY = yPos - 3;
      const rowEndY = rowStartY + actualRowHeight;
      
      // Draw cell borders with dynamic height
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      // Left border
      doc.line(leftMargin, rowStartY, leftMargin, rowEndY);
      // Right border
      doc.line(rightMargin, rowStartY, rightMargin, rowEndY);
      // Top border
      doc.line(leftMargin, rowStartY, rightMargin, rowStartY);
      // Bottom border
      doc.line(leftMargin, rowEndY, rightMargin, rowEndY);
      // Column borders
      doc.line(colDescX, rowStartY, colDescX, rowEndY);
      doc.line(colHSNX, rowStartY, colHSNX, rowEndY);
      doc.line(colQtyX, rowStartY, colQtyX, rowEndY);
      doc.line(colRateX, rowStartY, colRateX, rowEndY);
      doc.line(colGSTX, rowStartY, colGSTX, rowEndY);
      doc.line(colGSTAmountX, rowStartY, colGSTAmountX, rowEndY);
      doc.line(colAmountX, rowStartY, colAmountX, rowEndY);
      
      // Draw text - all columns aligned to top of row
      doc.setTextColor(0, 0, 0);
      const textY = rowStartY + 3; // Top alignment with padding
      
      // Sr No
      doc.text(srNo, colSrNoX + 3, textY);
      
      // Item Description - can be multiple lines
      productNameLines.forEach((line, lineIndex) => {
        doc.text(line, colDescX + 3, textY + (lineIndex * lineSpacing));
      });
      
      // HSN - aligned to top
      doc.text(hsnCodeStr, colHSNX + 3, textY);
      
      // Right-aligned numerical values - all aligned to top
      const qtyWidth = doc.getTextWidth(qty);
      doc.text(qty, colQtyX + colQtyWidth - qtyWidth - 3, textY);
      const rateWidth = doc.getTextWidth(rate);
      doc.text(rate, colRateX + colRateWidth - rateWidth - 3, textY);
      const gstPercentWidth = doc.getTextWidth(gstPercent);
      doc.text(gstPercent, colGSTX + colGSTWidth - gstPercentWidth - 3, textY);
      const gstAmountWidth = doc.getTextWidth(gstAmount);
      doc.text(gstAmount, colGSTAmountX + colGSTAmountWidth - gstAmountWidth - 3, textY);
      const amountWidth = doc.getTextWidth(amount);
      doc.text(amount, rightMargin - amountWidth - 3, textY);
      
      // Move to next row
      yPos = rowEndY + 3;
    });

    yPos += 3;

    // Summary totals table with borders
    const totalsStartX = leftMargin + 110;
    const totalsLabelWidth = 50;
    const totalsValueWidth = rightMargin - totalsStartX - totalsLabelWidth;
    const summaryRowHeight = 5;
    const summaryStartY = yPos;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Convert all numbers to strings
    const subTotalNum = parseFloat(cartTotal) || 0;
    const subTotalStr = subTotalNum.toFixed(2);
    const cgstAmountNum = parseFloat(cgstAmount) || 0;
    const cgstAmountStr = cgstAmountNum.toFixed(2);
    const sgstAmountNum = parseFloat(sgstAmount) || 0;
    const sgstAmountStr = sgstAmountNum.toFixed(2);
    const totalAmountNum = parseFloat(totalAmount) || 0;
    const totalAmountStr = totalAmountNum.toFixed(2);
    const cgstRateNum = parseInt(cgstRate) || 0;
    const cgstRateStr = String(cgstRateNum);
    const sgstRateNum = parseInt(sgstRate) || 0;
    const sgstRateStr = String(sgstRateNum);
    
    // Build summary rows
    const summaryRows = [
      { label: 'Sub Total:', value: subTotalStr, isTotal: false }
    ];
    
    if (cgstAmount > 0) {
      summaryRows.push({ label: `CGST (${cgstRateStr}%):`, value: cgstAmountStr, isTotal: false });
    }
    
    if (sgstAmount > 0) {
      summaryRows.push({ label: `SGST (${sgstRateStr}%):`, value: sgstAmountStr, isTotal: false });
    }
    
    // Shipping Charges - always show (Free when 0)
    const shippingStr = shippingCharges > 0 ? shippingCharges.toFixed(2) : 'Free';
    summaryRows.push({ label: 'Shipping Charges:', value: shippingStr, isTotal: false });
    
    // Coupon Discount - only when coupon applied
    if (couponDiscount > 0) {
      const couponCode = order.couponCode || '';
      const couponLabel = couponCode ? `Coupon Discount (${couponCode}):` : 'Coupon Discount:';
      summaryRows.push({ label: couponLabel, value: `-${couponDiscount.toFixed(2)}`, isTotal: false });
    }
    
    summaryRows.push({ label: 'Total Amount:', value: totalAmountStr, isTotal: true });
    
    // Draw summary table with borders
    summaryRows.forEach((row, index) => {
      const rowTop = summaryStartY - 3 + (index * summaryRowHeight);
      const rowBottom = rowTop + summaryRowHeight;
      const rowCenter = rowTop + (summaryRowHeight / 2);
      
      // Draw borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      // Left border
      doc.line(totalsStartX, rowTop, totalsStartX, rowBottom);
      // Right border
      doc.line(rightMargin, rowTop, rightMargin, rowBottom);
      // Top border
      doc.line(totalsStartX, rowTop, rightMargin, rowTop);
      // Bottom border
      doc.line(totalsStartX, rowBottom, rightMargin, rowBottom);
      // Middle border between label and value
      const valueColX = totalsStartX + totalsLabelWidth;
      doc.line(valueColX, rowTop, valueColX, rowBottom);
      
      // Draw background for Total Amount row
      if (row.isTotal) {
        doc.setFillColor(64, 64, 64);
        doc.rect(totalsStartX, rowTop, rightMargin - totalsStartX, summaryRowHeight, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
      
      // Draw text - properly centered vertically in the row
      // For font size 8-9, position text at rowTop + 3.5 to center it in row height 5
      const textY = rowTop + 3.5;
      doc.text(row.label, totalsStartX + 3, textY);
      const valueWidth = doc.getTextWidth(row.value);
      doc.text(row.value, rightMargin - valueWidth - 3, textY);
    });
    
    yPos = summaryStartY + (summaryRows.length * summaryRowHeight);
    yPos += 3;

    // Amount in words
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Amount in Words:', leftMargin + 3, yPos);
    yPos += 4;
    doc.setFont(undefined, 'normal');
    const amountInWords = numberToWords(totalAmount);
    const wordsLines = doc.splitTextToSize(amountInWords, contentWidth - 10);
    wordsLines.forEach(line => {
      doc.text(line, leftMargin + 3, yPos);
      yPos += 4;
    });
    yPos += 5;

    // ========== BANK DETAILS AND FOOTER ==========
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    const bankDetails = vendor.bankDetails || {};
    const bankName = bankDetails.bankName || 'Kotak Mahindra Bank';
    const accountName = bankDetails.accountHolderName || bankDetails.accountName || vendor.businessName || 'AK Enterprises';
    const bankAccountNo = bankDetails.accountNumber || bankDetails.bankAccountNo || '9545235223';
    const branch = bankDetails.branch || 'Baner';
    const bankIFSC = bankDetails.ifsc || bankDetails.ifscCode || bankDetails.bankIFSC || 'KKBK0001767';
    const upiId = bankDetails.upiId || '9545235223@kotak';

    // Build UPI payment URL for QR (amount + invoice ref)
    const invRef = invoiceNumber || (formattedOrderNo ? `Order ${formattedOrderNo}` : 'Invoice');
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(accountName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invRef)}`;
    let qrDataUrl = null;
    try {
      qrDataUrl = await fetchUPIQRAsDataURL(upiUrl);
    } catch (qrErr) {
      console.warn('Could not fetch QR code for invoice, continuing without:', qrErr);
    }

    // Bank Details
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Bank Details:', leftMargin + 3, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');

    const bankStartY = yPos;
    const qrSize = 48;
    const qrX = rightMargin - qrSize - 5;

    doc.text(`Bank: ${bankName}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`Branch: ${branch}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`IFSC Code: ${bankIFSC}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`Account Name: ${accountName}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`Account No: ${bankAccountNo}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`UPI ID: ${upiId}`, leftMargin + 3, yPos);

    if (qrDataUrl) {
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text('Scan to Pay', qrX + qrSize / 2 - doc.getTextWidth('Scan to Pay') / 2, bankStartY - 2);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.addImage(qrDataUrl, 'PNG', qrX, bankStartY, qrSize, qrSize);
      yPos = Math.max(yPos, bankStartY + qrSize + 4);
    }
    yPos += 6;

    // Disclaimer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer generated Invoice.', leftMargin + 3, yPos);
    yPos += 3;
    doc.text('Reverse Charge: No', leftMargin + 3, yPos);

    // Save the PDF
    // Use invoice number for filename if available, otherwise use formatted order ID
    let filename = 'Invoice';
    if (order.invoiceNumber) {
      // Use invoice number (e.g., INV-2526-0001)
      filename = order.invoiceNumber;
    } else {
      // Fallback: Use formatted order ID
      const orderIdForFilename = order.orderNumber || 
                                (order._id ? String(order._id) : null) || 
                                (order.order_id ? String(order.order_id) : null) || 
                                null;
      if (orderIdForFilename) {
        const filenameOrderId = formatOrderId(orderIdForFilename).replace('#', '');
        filename = `Invoice-${filenameOrderId}`;
      }
    }
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};
