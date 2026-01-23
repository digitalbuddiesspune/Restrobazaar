import jsPDF from 'jspdf';

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
export const generateInvoicePDF = (order, vendor = {}) => {
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
    const vendorGSTIN = vendor.gstNumber || '27AAXXXXXXXX';
    const vendorState = vendor.address?.state || 'Maharashtra';
    const vendorStateCode = getStateCode(vendorState) || '27';

    // Get customer information
    const customer = order.deliveryAddress || {};
    const customerName = customer.name || 'Customer Name';
    const customerAddress = customer.addressLine1 || '';
    const customerCity = customer.city || '';
    const customerState = customer.state || '';
    const customerPincode = customer.pincode || '';
    const customerGSTIN = customer.gstNumber || 'URP';

    // Calculate totals
    const billing = order.billingDetails || {};
    const cartTotal = billing.cartTotal || 0;
    const totalGstAmount = billing.gstAmount || 0;
    const shippingCharges = billing.shippingCharges || 0;
    const totalAmount = billing.totalAmount || (cartTotal + totalGstAmount + shippingCharges);
    
    // Calculate CGST and SGST (assuming equal split for intra-state)
    const cgstAmount = totalGstAmount / 2;
    const sgstAmount = totalGstAmount / 2;
    const cgstRate = totalGstAmount > 0 ? Math.round((cgstAmount / cartTotal) * 100) : 0;
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
    // Center text vertically in the gray bar (bar center at yPos, adjust for font baseline)
    doc.text('Invoice Details', leftMargin + 3, yPos - -1);
    yPos += 8;

    // Invoice details table
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    const invoiceDetails = [
      ['Invoice No:', `RBZ-${order.orderNumber || order._id?.toString().slice(-5) || '00123'}`],
      ['Order No:', `ORD-${order.orderNumber || order._id?.toString().slice(-5) || '45678'}`],
      ['Order Status:', getStatusText(order.orderStatus)],
      ['Place of Supply:', `${order.paymentMethod === 'cod' ? 'Cash' : order.paymentMethod === 'online' ? 'UPI / Bank Transfer' : 'UPI / Cash / Bank Transfer'}`],
      ['Place of Supply:', `${vendorStateCode}-${vendorState}`],
      ['Invoice Date:', formatDateForInvoice(order.createdAt)],
      ['Order Date:', formatDateForInvoice(order.createdAt)],
      ['Payment Status:', order.paymentStatus === 'completed' ? 'Paid' : 'Unpaid'],
    ];

    const col1X = leftMargin + 3;
    const col2X = leftMargin + 60;
    invoiceDetails.forEach(([label, value], index) => {
      doc.setFont(undefined, 'normal');
      doc.text(label, col1X, yPos);
      doc.setFont(undefined, 'bold');
      doc.text(value, col2X, yPos);
      yPos += 4;
    });
    yPos += 3;

    // ========== BILL TO SECTION ==========
    // Header bar
    doc.setFillColor(64, 64, 64);
    doc.rect(leftMargin, yPos - 3, contentWidth, 6, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    // Center text vertically in the gray bar
    doc.text('Bill To', leftMargin + 3, yPos - -1);
    yPos += 8;

    // Bill To details
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Customer Name/ Restaurant Name: ${customerName}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`Address: ${customerAddress}${customerCity ? `, ${customerCity}` : ''}${customerState ? `, ${customerState}` : ''}${customerPincode ? ` - ${customerPincode}` : ''}`, leftMargin + 3, yPos);
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
    doc.text('Order Details', leftMargin + 3, yPos - -1);
    yPos += 8;

    // Table headers - Remove rupee symbol to avoid encoding issues
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    const tableStartY = yPos;
    // Column positions - use fixed positions, calculate right alignment manually
    doc.text('Sr No', leftMargin + 3, yPos);
    doc.text('Item Description', leftMargin + 18, yPos);
    doc.text('HSN', leftMargin + 65, yPos);
    // Calculate widths for right-aligned headers
    doc.setFont('helvetica', 'bold');
    const qtyHeaderWidth = doc.getTextWidth('Qty');
    const rateHeaderWidth = doc.getTextWidth('Rate');
    const gstHeaderWidth = doc.getTextWidth('GST %');
    const amountHeaderWidth = doc.getTextWidth('Amount');
    doc.text('Qty', leftMargin + 100 - qtyHeaderWidth, yPos);
    doc.text('Rate', leftMargin + 120 - rateHeaderWidth, yPos);
    doc.text('GST %', leftMargin + 145 - gstHeaderWidth, yPos);
    doc.text('Amount', rightMargin - amountHeaderWidth, yPos);
    yPos += 5;

    // Table rows
    doc.setFont('helvetica', 'normal');
    order.items?.forEach((item, index) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      const hsnCode = item.hsnCode || item.productId?.hsnCode || '482369';
      // Calculate item values properly
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity) || 0;
      const itemSubtotal = itemPrice * itemQty;
      const itemGstPercentage = parseFloat(item.gstPercentage) || 0;
      // Use gstAmount from item if available, otherwise calculate it
      const itemGstAmount = parseFloat(item.gstAmount) || (itemSubtotal * itemGstPercentage / 100);
      // Item total should be subtotal + GST
      const itemTotal = itemSubtotal + itemGstAmount;

      // Ensure all values are properly converted to strings - use explicit conversion
      // All calculations already done above, now convert to display strings
      const srNo = String(index + 1);
      const qty = String(itemQty);
      const rate = itemPrice.toFixed(2);
      const gstPercent = itemGstPercentage > 0 ? itemGstPercentage.toFixed(2) : '-';
      const amount = itemTotal.toFixed(2);
      const hsnCodeStr = String(hsnCode || '482369');
      
      // Use simple text rendering without special characters
      doc.text(srNo, leftMargin + 3, yPos);
      
      // Wrap product name if too long
      const maxNameWidth = 45;
      const productName = String(item.productName || 'Product');
      const productNameLines = doc.splitTextToSize(productName, maxNameWidth);
      doc.text(productNameLines[0], leftMargin + 18, yPos);
      
      // Ensure font is set before each text call to avoid encoding issues
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(hsnCodeStr, leftMargin + 65, yPos);
      // Calculate right-aligned positions manually to avoid encoding issues
      const qtyWidth = doc.getTextWidth(qty);
      const rateWidth = doc.getTextWidth(rate);
      const gstPercentWidth = doc.getTextWidth(gstPercent);
      const amountWidth = doc.getTextWidth(amount);
      doc.text(qty, leftMargin + 100 - qtyWidth, yPos);
      doc.text(rate, leftMargin + 120 - rateWidth, yPos);
      doc.text(gstPercent, leftMargin + 145 - gstPercentWidth, yPos);
      doc.text(amount, rightMargin - amountWidth, yPos);
      
      if (productNameLines.length > 1) {
        yPos += 4;
        doc.text(productNameLines[1], leftMargin + 15, yPos);
      }
      
      yPos += 5;
    });

    yPos += 3;

    // Summary totals - Convert all numbers to strings properly
    const totalsStartX = leftMargin + 110;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    // Convert all numbers to strings to avoid encoding issues - use parseFloat for proper conversion
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
    
    // Ensure font is properly set before rendering numbers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Sub Total:', totalsStartX, yPos);
    const subTotalWidth = doc.getTextWidth(subTotalStr);
    doc.text(subTotalStr, rightMargin - subTotalWidth, yPos);
    yPos += 5;

    if (cgstAmount > 0) {
      const cgstLabel = 'CGST (' + cgstRateStr + '%):';
      doc.text(cgstLabel, totalsStartX, yPos);
      const cgstWidth = doc.getTextWidth(cgstAmountStr);
      doc.text(cgstAmountStr, rightMargin - cgstWidth, yPos);
      yPos += 5;
    }

    if (sgstAmount > 0) {
      const sgstLabel = 'SGST (' + sgstRateStr + '%):';
      doc.text(sgstLabel, totalsStartX, yPos);
      const sgstWidth = doc.getTextWidth(sgstAmountStr);
      doc.text(sgstAmountStr, rightMargin - sgstWidth, yPos);
      yPos += 5;
    }

    // Total Amount in dark box
    doc.setFillColor(64, 64, 64);
    doc.rect(totalsStartX - 3, yPos - 3, rightMargin - totalsStartX + 3, 5, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', totalsStartX, yPos - -0.5);
    const totalAmountWidth = doc.getTextWidth(totalAmountStr);
    doc.text(totalAmountStr, rightMargin - totalAmountWidth, yPos - -0.5);
    yPos += 8;

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

    // Bank Details
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Bank Details:', leftMargin + 3, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    const bankDetails = vendor.bankDetails || {};
    const bankName = bankDetails.bankName || 'State Bank of India (SBI)';
    const bankIFSC = bankDetails.ifscCode || bankDetails.bankIFSC || 'SBIN000XXX';
    const bankAccountNo = bankDetails.accountNumber || bankDetails.bankAccountNo || '1234567890';
    const upiId = bankDetails.upiId || 'restrobazaar@upi';

    doc.text(`Bank: ${bankName}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`IFSC: ${bankIFSC}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`Account No: ${bankAccountNo}`, leftMargin + 3, yPos);
    yPos += 4;
    doc.text(`UPI ID: ${upiId}`, leftMargin + 3, yPos);
    yPos += 6;

    // Disclaimer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer generated Invoice.', leftMargin + 3, yPos);
    yPos += 3;
    doc.text('Reverse Charge: No', leftMargin + 3, yPos);

    // Save the PDF
    doc.save(`Invoice-RBZ-${order.orderNumber || order._id}.pdf`);
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};
