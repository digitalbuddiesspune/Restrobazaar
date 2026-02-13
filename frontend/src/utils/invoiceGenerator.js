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
export const generateInvoicePDF = async (order, vendor = {}) => {
  try {
    // Fetch vendor details if vendorId is available but vendor object is incomplete
    let vendorData = vendor;
    if (order.vendorId && (!vendor.bankDetails || !vendor.businessName)) {
      try {
        const { vendorAPI } = await import('./api');
        const vendorId = order.vendorId._id || order.vendorId;
        const vendorResponse = await vendorAPI.getVendorBankDetails(vendorId);
        if (vendorResponse.success && vendorResponse.data) {
          // Merge fetched vendor data with existing vendor data
          vendorData = {
            ...vendor,
            ...vendorResponse.data,
            bankDetails: {
              ...vendor.bankDetails,
              ...vendorResponse.data.bankDetails,
            },
          };
        }
      } catch (err) {
        console.warn('Could not fetch vendor details for invoice:', err);
        // Continue with existing vendor data
      }
    }

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
    const vendorName = vendorData.businessName || 'RestroBazaar';
    const vendorEmail = vendorData.email || '';
    const vendorGSTIN = vendorData.gstNumber || '';
    const vendorState = vendorData.address?.state || '';
    const vendorStateCode = vendorState ? getStateCode(vendorState) : '';

    // Get customer information
    const customer = order.deliveryAddress || {};
    const customerName = customer.name || 'Customer Name';
    const customerPhone = customer.phone || '';
    const customerAddressLine1 = customer.addressLine1 || '';
    const customerAddressLine2 = customer.addressLine2 || '';
    const customerCity = customer.city || '';
    const customerState = customer.state || '';
    const customerPincode = customer.pincode || '';
    // Get GST number from deliveryAddress - prioritize customer entered GST
    // Check order.deliveryAddress.gstNumber first (from checkout), then fallback
    const customerGSTIN = (order.deliveryAddress?.gstNumber) || 
                          (customer.gstNumber) || 
                          (order.gstNumber) || 
                          '';
    
    // Debug: Log GST number retrieval (remove in production if needed)
    if (order.deliveryAddress?.gstNumber) {
      console.log('GST Number found in order.deliveryAddress:', order.deliveryAddress.gstNumber);
    }
    
    // Build full address string
    const addressParts = [customerAddressLine1];
    if (customerAddressLine2) addressParts.push(customerAddressLine2);
    if (customerCity) addressParts.push(customerCity);
    if (customerState) addressParts.push(customerState);
    if (customerPincode) addressParts.push(customerPincode);
    const customerAddress = addressParts.join(', ');

    // Calculate totals - use stored billingDetails for accuracy
    const billing = order.billingDetails || {};
    const cartTotal = billing.cartTotal || 0;
    const totalGstAmount = billing.gstAmount || 0;
    const shippingCharges = billing.shippingCharges || 0;
    const totalAmount = billing.totalAmount || (cartTotal + totalGstAmount + shippingCharges);
    

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
    const vendorInfo = `By: AK Enterprises | Email: ${vendorEmail} | GST No: 27DJSPK2679K1ZB | State Code: ${vendorStateCode}`;
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
    if (customerPhone) {
      doc.text(`Phone: ${customerPhone}`, leftMargin + 3, yPos);
      yPos += 4;
    }
    doc.text(`Address: ${customerAddress}`, leftMargin + 3, yPos);
    yPos += 4;
    // Always show GST No - use customer GST if available, otherwise show URP
    const gstDisplay = customerGSTIN && customerGSTIN.trim() ? customerGSTIN.trim() : 'URP';
    doc.text(`GST No: ${gstDisplay}`, leftMargin + 3, yPos);
    yPos += 4;
    yPos += 2;

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
    const baseHeaderRowHeight = 5;
    const headerLineSpacing = 4;
    
    // Column positions - adjusted to include Rate*Qty and GST Amount columns with proper spacing
    const colSrNoX = leftMargin;
    const colSrNoWidth = 10;
    const colDescX = leftMargin + 10;
    const colDescWidth = 38; // Reduced to make room for new column
    const colHSNX = leftMargin + 48;
    const colHSNWidth = 16;
    const colQtyX = leftMargin + 64;
    const colQtyWidth = 10;
    const colRateX = leftMargin + 74;
    const colRateWidth = 16;
    const colRateQtyX = leftMargin + 90;
    const colRateQtyWidth = 18; // New column for Rate * Qty
    const colGSTX = leftMargin + 108;
    const colGSTWidth = 14;
    const colGSTAmountX = leftMargin + 122;
    const colGSTAmountWidth = 20;
    const colAmountX = leftMargin + 142;
    const colAmountWidth = rightMargin - colAmountX;
    
    // Calculate header text wrapping and determine maximum lines needed
    const headerTexts = [
      { text: 'Sr No', width: colSrNoWidth - 6, align: 'left' },
      { text: 'Item Name', width: colDescWidth - 6, align: 'left' },
      { text: 'HSN', width: colHSNWidth - 6, align: 'center' },
      { text: 'Qty', width: colQtyWidth - 6, align: 'right' },
      { text: 'Rate', width: colRateWidth - 6, align: 'right' },
      { text: 'Taxable Value', width: colRateQtyWidth - 6, align: 'right' },
      { text: 'GST %', width: colGSTWidth - 6, align: 'left' },
      { text: 'GST Amount', width: colGSTAmountWidth - 6, align: 'left' },
      { text: 'Amount', width: colAmountWidth - 6, align: 'right' }
    ];
    
    let maxHeaderLines = 1;
    const headerLines = [];
    headerTexts.forEach((header, index) => {
      const lines = doc.splitTextToSize(header.text, header.width);
      headerLines.push({ lines, align: header.align, index });
      if (lines.length > maxHeaderLines) {
        maxHeaderLines = lines.length;
      }
    });
    
    // Calculate dynamic header row height based on maximum lines
    const headerRowHeight = baseHeaderRowHeight + (maxHeaderLines - 1) * headerLineSpacing;
    
    // Draw header background
    doc.setFillColor(230, 230, 230); // Light gray background
    doc.rect(leftMargin, yPos - 3, contentWidth, headerRowHeight, 'F');
    
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
    doc.line(colRateQtyX, yPos - 3, colRateQtyX, yPos - 3 + headerRowHeight);
    doc.line(colGSTX, yPos - 3, colGSTX, yPos - 3 + headerRowHeight);
    doc.line(colGSTAmountX, yPos - 3, colGSTAmountX, yPos - 3 + headerRowHeight);
    doc.line(colAmountX, yPos - 3, colAmountX, yPos - 3 + headerRowHeight);
    
    // Header text with wrapping - all center-aligned
    doc.setTextColor(0, 0, 0);
    const headerStartY = yPos - 3 + 3; // Top padding
    
    // Sr No - center aligned
    const srNoLines = headerLines[0].lines;
    srNoLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colSrNoX + (colSrNoWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // Item Name - center aligned
    const itemNameLines = headerLines[1].lines;
    itemNameLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colDescX + (colDescWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // HSN - center aligned
    const hsnLines = headerLines[2].lines;
    hsnLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colHSNX + (colHSNWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // Qty - center aligned
    const qtyLines = headerLines[3].lines;
    qtyLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colQtyX + (colQtyWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // Rate - center aligned
    const rateLines = headerLines[4].lines;
    rateLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colRateX + (colRateWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // Taxable Value - center aligned
    const taxableValueLines = headerLines[5].lines;
    taxableValueLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colRateQtyX + (colRateQtyWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // GST % - center aligned
    const gstPercentLines = headerLines[6].lines;
    gstPercentLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colGSTX + (colGSTWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // GST Amount - center aligned
    const gstAmountLines = headerLines[7].lines;
    gstAmountLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colGSTAmountX + (colGSTAmountWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
    // Amount - center aligned
    const amountLines = headerLines[8].lines;
    amountLines.forEach((line, lineIndex) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, colAmountX + (colAmountWidth / 2) - (lineWidth / 2), headerStartY + (lineIndex * headerLineSpacing));
    });
    
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

      // Ensure all values are properly converted to strings
      const srNo = String(index + 1);
      const qty = String(itemQty);
      const rate = itemPrice.toFixed(2);
      const rateQty = itemSubtotal.toFixed(2); // Rate * Quantity (subtotal before GST)
      const gstPercent = itemGstPercentage > 0 ? itemGstPercentage.toFixed(2) : '-';
      const gstAmount = itemGstAmount.toFixed(2);
      const amount = itemTotal.toFixed(2);
      const hsnCodeStr = String(hsnCode || '482369');
      
      // Calculate dynamic row height based on product name wrapping
      // Reduced width to ensure proper wrapping for long product names
      const maxNameWidth = 32; // Reduced to ensure long names wrap properly to next line
      const productName = String(item.productName || item.product?.productName || 'Product');
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
      doc.line(colRateQtyX, rowStartY, colRateQtyX, rowEndY);
      doc.line(colGSTX, rowStartY, colGSTX, rowEndY);
      doc.line(colGSTAmountX, rowStartY, colGSTAmountX, rowEndY);
      doc.line(colAmountX, rowStartY, colAmountX, rowEndY);
      
      // Draw text - all columns center-aligned
      doc.setTextColor(0, 0, 0);
      const textY = rowStartY + 3; // Top alignment with padding
      
      // Sr No - center aligned
      const srNoWidth = doc.getTextWidth(srNo);
      doc.text(srNo, colSrNoX + (colSrNoWidth / 2) - (srNoWidth / 2), textY);
      
      // Item Name - can be multiple lines (wraps to next line if long), center aligned
      productNameLines.forEach((line, lineIndex) => {
        const lineWidth = doc.getTextWidth(line);
        doc.text(line, colDescX + (colDescWidth / 2) - (lineWidth / 2), textY + (lineIndex * lineSpacing));
      });
      
      // HSN - center aligned
      const hsnWidth = doc.getTextWidth(hsnCodeStr);
      doc.text(hsnCodeStr, colHSNX + (colHSNWidth / 2) - (hsnWidth / 2), textY);
      
      // All numerical values - center aligned
      const qtyWidth = doc.getTextWidth(qty);
      doc.text(qty, colQtyX + (colQtyWidth / 2) - (qtyWidth / 2), textY);
      const rateWidth = doc.getTextWidth(rate);
      doc.text(rate, colRateX + (colRateWidth / 2) - (rateWidth / 2), textY);
      const rateQtyWidth = doc.getTextWidth(rateQty);
      doc.text(rateQty, colRateQtyX + (colRateQtyWidth / 2) - (rateQtyWidth / 2), textY);
      const gstPercentWidth = doc.getTextWidth(gstPercent);
      doc.text(gstPercent, colGSTX + (colGSTWidth / 2) - (gstPercentWidth / 2), textY);
      const gstAmountWidth = doc.getTextWidth(gstAmount);
      doc.text(gstAmount, colGSTAmountX + (colGSTAmountWidth / 2) - (gstAmountWidth / 2), textY);
      const amountWidth = doc.getTextWidth(amount);
      doc.text(amount, colAmountX + (colAmountWidth / 2) - (amountWidth / 2), textY);
      
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
    const totalAmountNum = parseFloat(totalAmount) || 0;
    const totalAmountStr = totalAmountNum.toFixed(2);
    
    // Group items by GST percentage and calculate SGST/CGST
    const gstGroups = {};
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const itemGstPercentage = parseFloat(item.gstPercentage) || 0;
        const itemGstAmount = parseFloat(item.gstAmount) || 0;
        
        if (itemGstPercentage > 0 && itemGstAmount > 0) {
          // Round GST percentage to 2 decimal places for grouping
          const gstKey = itemGstPercentage.toFixed(2);
          
          if (!gstGroups[gstKey]) {
            gstGroups[gstKey] = {
              percentage: itemGstPercentage,
              totalGst: 0
            };
          }
          
          gstGroups[gstKey].totalGst += itemGstAmount;
        }
      });
    }
    
    // Build summary rows
    const summaryRows = [
      { label: 'Sub Total:', value: subTotalStr, isTotal: false }
    ];
    
    // Add SGST and CGST for each GST percentage group
    // Sort by GST percentage (descending) for better readability
    const sortedGstKeys = Object.keys(gstGroups).sort((a, b) => parseFloat(b) - parseFloat(a));
    
    sortedGstKeys.forEach(gstKey => {
      const group = gstGroups[gstKey];
      const totalGst = parseFloat(group.totalGst.toFixed(2));
      const sgstAmount = parseFloat((totalGst / 2).toFixed(2));
      const cgstAmount = parseFloat((totalGst / 2).toFixed(2));
      const sgstRate = parseFloat((group.percentage / 2).toFixed(2));
      const cgstRate = sgstRate;
      
      // Add SGST row
      summaryRows.push({ 
        label: `SGST (${sgstRate}%):`, 
        value: sgstAmount.toFixed(2), 
        isTotal: false 
      });
      
      // Add CGST row
      summaryRows.push({ 
        label: `CGST (${cgstRate}%):`, 
        value: cgstAmount.toFixed(2), 
        isTotal: false 
      });
    });
    
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

    const bankDetails = vendorData.bankDetails || {};
    const bankName = bankDetails.bankName || '';
    const accountName = bankDetails.accountHolderName || vendorData.businessName || '';
    const bankAccountNo = bankDetails.accountNumber || '';
    const branch = bankDetails.branch || '';
    const bankIFSC = bankDetails.ifsc || '';
    const upiId = bankDetails.upiId || '';

    // Build UPI payment URL for QR (amount + invoice ref) - only if UPI ID is available
    let qrDataUrl = null;
    if (upiId && accountName) {
      const invRef = invoiceNumber || (formattedOrderNo ? `Order ${formattedOrderNo}` : 'Invoice');
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(accountName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invRef)}`;
      try {
        qrDataUrl = await fetchUPIQRAsDataURL(upiUrl);
      } catch (qrErr) {
        console.warn('Could not fetch QR code for invoice, continuing without:', qrErr);
      }
    }

    // Bank Details - Only show if we have bank details
    const hasBankDetails = accountName || upiId || bankAccountNo || bankName || bankIFSC;
    
    if (hasBankDetails) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Bank Details:', leftMargin + 3, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');

      const bankStartY = yPos;
      const qrSize = 48;
      const qrX = rightMargin - qrSize - 5;

      if (bankName) {
        doc.text(`Bank: ${bankName}`, leftMargin + 3, yPos);
        yPos += 4;
      }
      if (branch) {
        doc.text(`Branch: ${branch}`, leftMargin + 3, yPos);
        yPos += 4;
      }
      if (bankIFSC) {
        doc.text(`IFSC Code: ${bankIFSC}`, leftMargin + 3, yPos);
        yPos += 4;
      }
      if (accountName) {
        doc.text(`Account Name: ${accountName}`, leftMargin + 3, yPos);
        yPos += 4;
      }
      if (bankAccountNo) {
        doc.text(`Account No: ${bankAccountNo}`, leftMargin + 3, yPos);
        yPos += 4;
      }
      if (upiId) {
        doc.text(`UPI ID: ${upiId}`, leftMargin + 3, yPos);
        yPos += 4;
      }

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
    }

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
