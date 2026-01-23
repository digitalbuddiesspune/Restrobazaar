import { useState } from 'react';
import jsPDF from 'jspdf';

const OrdersTable = ({ 
  orders, 
  isLoading, 
  onUpdateStatus,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onOrderClick,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);

  const orderStatuses = [
    { value: 'pending', label: 'Pending', colorClass: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', colorClass: 'bg-blue-500' },
    { value: 'processing', label: 'Processing', colorClass: 'bg-purple-500' },
    { value: 'shipped', label: 'Shipped', colorClass: 'bg-indigo-500' },
    { value: 'delivered', label: 'Delivered', colorClass: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-500' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentDisplayText = (order) => {
    const paymentMethod = order.paymentMethod?.toLowerCase();
    const paymentStatus = order.paymentStatus?.toLowerCase();

    // If online payment and completed, show "Paid Online"
    if (paymentMethod === 'online' && paymentStatus === 'completed') {
      return 'Paid Online';
    }

    // If COD and payment status is completed, show "Paid COD"
    if (paymentMethod === 'cod' && paymentStatus === 'completed') {
      return 'Paid COD';
    }

    // Map payment status to display text
    if (paymentStatus === 'completed') {
      return paymentMethod === 'cod' ? 'Paid COD' : 'Paid';
    }

    // Otherwise, show the payment status
    return paymentStatus === 'pending' ? 'Unpaid' : paymentStatus || 'Unpaid';
  };

  const getPaymentDisplayColor = (order) => {
    const paymentStatus = order.paymentStatus?.toLowerCase();

    // If payment is completed, show green (paid)
    if (paymentStatus === 'completed') {
      return 'bg-green-100 text-green-800';
    }

    // Otherwise, use the standard payment status color (pending/unpaid)
    return getPaymentStatusColor(paymentStatus);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateForInvoice = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  };

  // Convert number to words for invoice amount
  const numberToWords = (num) => {
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
    return result + ' only';
  };

  // Get state code from state name
  const getStateCode = (stateName) => {
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

  const handleDownloadInvoice = (order) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;
      const leftMargin = 15;
      const rightMargin = pageWidth - 15;
      const contentWidth = pageWidth - 30;

      // Get vendor information - Use provided business details or fallback to order data
      const vendor = order.vendorId || {};
      const vendorName = vendor.businessName || vendor.legalName || 'AK ENTERPRISES';
      const vendorLegalName = vendor.legalName || 'ANUPAMA MANOHAR KADAM';
      const vendorTradeName = vendor.tradeName || vendor.businessName || 'AK ENTERPRISES';
      const vendorAddress = vendor.address || {};
      const vendorBuilding = vendorAddress.line1 || vendorAddress.buildingNo || 'SURVEY NO. 75/1/1';
      const vendorStreet = vendorAddress.line2 || vendorAddress.road || 'OPPOSITE IIMS COLLEGE';
      const vendorLandmark = vendorAddress.landmark || 'OPPOSITE IIMS COLLEGE';
      const vendorCity = vendorAddress.city || 'Nere';
      const vendorDistrict = vendorAddress.district || 'Pune';
      const vendorState = vendorAddress.state || 'Maharashtra';
      const vendorPincode = vendorAddress.pincode || '410506';
      const vendorPhone = vendor.phone || '9545235223';
      const vendorEmail = vendor.email || 'ak.enterprises.info1@gmail.com';
      const vendorGSTIN = vendor.gstNumber || '27DJSPK2679K1ZB';
      const vendorStateCode = getStateCode(vendorState) || '27';

      // Get customer information
      const customer = order.customerId || {};
      const customerName = order.deliveryAddress?.name || customer.name || 'Customer Name';
      const customerAddress = order.deliveryAddress || {};
      const customerAddressLine = customerAddress.addressLine1 || '';
      const customerAddressLine2 = customerAddress.addressLine2 || '';
      const customerCity = customerAddress.city || '';
      const customerState = customerAddress.state || '';
      const customerPincode = customerAddress.pincode || '';
      const customerPhone = customerAddress.phone || customer.phone || '';
      const customerGSTIN = order.customerGSTIN || customer.gstNumber || '';

      // Calculate totals
      const billing = order.billingDetails || {};
      const cartTotal = billing.cartTotal || 0;
      const totalGstAmount = billing.gstAmount || 0;
      const shippingCharges = billing.shippingCharges || 0;
      const totalAmount = billing.totalAmount || (cartTotal + totalGstAmount + shippingCharges);
      
      // Calculate SGST and CGST (assuming 5% GST = 2.5% SGST + 2.5% CGST for intra-state)
      const sgstRate = 2.5;
      const cgstRate = 2.5;
      const sgstAmount = totalGstAmount / 2;
      const cgstAmount = totalGstAmount / 2;

      // ========== VYAPAR STYLE INVOICE LAYOUT ==========
      
      // 1. BOLD BUSINESS HEADER SECTION
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(vendorTradeName, leftMargin, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(vendorBuilding, leftMargin, yPos);
      yPos += 5;
      if (vendorStreet) {
        doc.text(vendorStreet, leftMargin, yPos);
        yPos += 5;
      }
      if (vendorLandmark && vendorLandmark !== vendorStreet) {
        doc.text(vendorLandmark, leftMargin, yPos);
        yPos += 5;
      }
      doc.text(`${vendorCity}, ${vendorDistrict}, ${vendorState} - ${vendorPincode}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`Phone: ${vendorPhone}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`Email: ${vendorEmail}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`GSTIN: ${vendorGSTIN}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`State: ${vendorStateCode}-${vendorState}`, leftMargin, yPos);
      yPos += 8;

      // 2. CENTERED TAX INVOICE TITLE WITH DIVIDER
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += 5;
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += 8;

      // 3. HEADER SECTION - Two Column Layout
      const headerStartY = yPos;
      const col1X = leftMargin;
      const col2X = pageWidth / 2 + 5;

      // Right Column: Invoice Details
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Invoice No.:', col2X, headerStartY);
      doc.setFont(undefined, 'normal');
      doc.text(`${order.orderNumber || order._id}`, rightMargin, headerStartY, { align: 'right' });
      
      let invoiceY = headerStartY + 6;
      doc.setFont(undefined, 'bold');
      doc.text('Date:', col2X, invoiceY);
      doc.setFont(undefined, 'normal');
      doc.text(formatDateForInvoice(order.createdAt), rightMargin, invoiceY, { align: 'right' });
      
      invoiceY += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Place of Supply:', col2X, invoiceY);
      doc.setFont(undefined, 'normal');
      doc.text(`${vendorStateCode}-${vendorState}`, rightMargin, invoiceY, { align: 'right' });
      
      yPos = Math.max(headerStartY + 25, invoiceY + 8);

      // 4. BILL TO / SHIP TO SECTION - Two Column Layout
      const billToStartY = yPos;
      const billToCol1X = leftMargin;
      const billToCol2X = pageWidth / 2 + 5;

      // Left Column: Bill To
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Bill To:', billToCol1X, billToStartY);
      let billToY = billToStartY + 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(customerName, billToCol1X, billToY);
      billToY += 5;
      if (customerAddressLine) {
        doc.text(customerAddressLine, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerAddressLine2) {
        doc.text(customerAddressLine2, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerCity || customerState || customerPincode) {
        const cityLine = `${customerCity || ''}${customerCity && customerState ? ', ' : ''}${customerState || ''}${(customerCity || customerState) && customerPincode ? ' - ' : ''}${customerPincode || ''}`;
        doc.text(cityLine, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerPhone) {
        doc.text(`Contact No.: ${customerPhone}`, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerGSTIN) {
        doc.text(`GSTIN: ${customerGSTIN}`, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerState) {
        const customerStateCode = getStateCode(customerState);
        if (customerStateCode) {
          doc.text(`State: ${customerStateCode}-${customerState}`, billToCol1X, billToY);
          billToY += 4;
        }
      }

      // Right Column: Ship To
      const shipToStartY = billToStartY;
      let shipToY = shipToStartY + 6;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Ship To:', billToCol2X, shipToStartY);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const shipToAddress = order.deliveryAddress || {};
      if (shipToAddress.addressLine1) {
        doc.text(shipToAddress.addressLine1, billToCol2X, shipToY);
        shipToY += 4;
      }
      if (shipToAddress.addressLine2) {
        doc.text(shipToAddress.addressLine2, billToCol2X, shipToY);
        shipToY += 4;
      }
      if (shipToAddress.landmark) {
        doc.text(shipToAddress.landmark, billToCol2X, shipToY);
        shipToY += 4;
      }
      if (shipToAddress.city || shipToAddress.state || shipToAddress.pincode) {
        const shipToLine = `${shipToAddress.city || ''}${shipToAddress.city && shipToAddress.state ? ', ' : ''}${shipToAddress.state || ''}${(shipToAddress.city || shipToAddress.state) && shipToAddress.pincode ? ' - ' : ''}${shipToAddress.pincode || ''}`;
        doc.text(shipToLine, billToCol2X, shipToY);
        shipToY += 4;
      }

      yPos = Math.max(billToY, shipToY) + 8;

      // 5. ITEM TABLE - VYAPAR STYLE
      // Table Header with light background
      doc.setFillColor(245, 245, 245);
      doc.rect(leftMargin, yPos - 4, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      const tableHeaderY = yPos;
      doc.text('Sr No', leftMargin + 3, tableHeaderY);
      doc.text('Item Name', leftMargin + 18, tableHeaderY);
      doc.text('HSN / SAC', leftMargin + 65, tableHeaderY);
      doc.text('Quantity', leftMargin + 95, tableHeaderY, { align: 'right' });
      doc.text('Unit', leftMargin + 115, tableHeaderY);
      doc.text('Rate', leftMargin + 130, tableHeaderY, { align: 'right' });
      doc.text('Tax %', leftMargin + 150, tableHeaderY, { align: 'right' });
      doc.text('Amount', rightMargin - 2, tableHeaderY, { align: 'right' });
      yPos += 8;

      // Draw border lines
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(leftMargin, yPos - 8, leftMargin, yPos);
      doc.line(leftMargin + 15, yPos - 8, leftMargin + 15, yPos);
      doc.line(leftMargin + 62, yPos - 8, leftMargin + 62, yPos);
      doc.line(leftMargin + 92, yPos - 8, leftMargin + 92, yPos);
      doc.line(leftMargin + 112, yPos - 8, leftMargin + 112, yPos);
      doc.line(leftMargin + 127, yPos - 8, leftMargin + 127, yPos);
      doc.line(leftMargin + 147, yPos - 8, leftMargin + 147, yPos);
      doc.line(rightMargin, yPos - 8, rightMargin, yPos);
      doc.line(leftMargin, yPos - 8, rightMargin, yPos - 8);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      yPos += 2;

      // Table Rows
      order.items?.forEach((item, index) => {
        if (yPos > pageHeight - 120) {
          doc.addPage();
          yPos = 20;
          // Redraw header on new page
          doc.setFillColor(245, 245, 245);
          doc.rect(leftMargin, yPos - 4, contentWidth, 8, 'F');
          doc.setFont(undefined, 'bold');
          doc.text('Sr No', leftMargin + 3, yPos);
          doc.text('Item Name', leftMargin + 18, yPos);
          doc.text('HSN / SAC', leftMargin + 65, yPos);
          doc.text('Quantity', leftMargin + 95, yPos, { align: 'right' });
          doc.text('Unit', leftMargin + 115, yPos);
          doc.text('Rate', leftMargin + 130, yPos, { align: 'right' });
          doc.text('Tax %', leftMargin + 150, yPos, { align: 'right' });
          doc.text('Amount', rightMargin - 2, yPos, { align: 'right' });
          yPos += 8;
          doc.setDrawColor(200, 200, 200);
          doc.line(leftMargin, yPos - 8, leftMargin, yPos);
          doc.line(leftMargin + 15, yPos - 8, leftMargin + 15, yPos);
          doc.line(leftMargin + 62, yPos - 8, leftMargin + 62, yPos);
          doc.line(leftMargin + 92, yPos - 8, leftMargin + 92, yPos);
          doc.line(leftMargin + 112, yPos - 8, leftMargin + 112, yPos);
          doc.line(leftMargin + 127, yPos - 8, leftMargin + 127, yPos);
          doc.line(leftMargin + 147, yPos - 8, leftMargin + 147, yPos);
          doc.line(rightMargin, yPos - 8, rightMargin, yPos);
          doc.line(leftMargin, yPos - 8, rightMargin, yPos - 8);
          doc.line(leftMargin, yPos, rightMargin, yPos);
          doc.setFont(undefined, 'normal');
          yPos += 2;
        }

        const productName = item.productName || 'Product';
        const hsnSac = item.hsnCode || item.sacCode || item.hsnSac || '';
        const quantity = item.quantity || 0;
        const unit = item.unit || 'Pcs';
        const rate = Number(item.price || 0);
        const gstPercentage = item.gstPercentage || 0;
        const itemSubtotal = item.total || (rate * quantity);
        const itemGstAmount = item.gstAmount || (itemSubtotal * gstPercentage / 100);
        const itemTotal = itemSubtotal + itemGstAmount;

        const rowY = yPos;
        doc.text((index + 1).toString(), leftMargin + 3, rowY);
        
        // Wrap product name if too long
        const maxNameWidth = 42;
        const productNameLines = doc.splitTextToSize(productName, maxNameWidth);
        doc.text(productNameLines[0], leftMargin + 18, rowY);
        
        doc.text(hsnSac || '-', leftMargin + 65, rowY);
        doc.text(quantity.toString(), leftMargin + 95, rowY, { align: 'right' });
        doc.text(unit, leftMargin + 115, rowY);
        doc.text(`₹${rate.toFixed(2)}`, leftMargin + 130, rowY, { align: 'right' });
        doc.text(gstPercentage > 0 ? `${gstPercentage}%` : '-', leftMargin + 150, rowY, { align: 'right' });
        doc.text(`₹${itemTotal.toFixed(2)}`, rightMargin - 2, rowY, { align: 'right' });
        
        // Handle multi-line product names
        if (productNameLines.length > 1) {
          yPos += 4;
          doc.text(productNameLines[1], leftMargin + 18, yPos);
        }
        
        yPos += 6;
        
        // Draw row border
        doc.setDrawColor(220, 220, 220);
        doc.line(leftMargin, yPos, rightMargin, yPos);
        yPos += 2;
      });

      // Draw closing border for table
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPos - 2, rightMargin, yPos - 2);
      yPos += 5;

      // 6. TOTALS SECTION - Right Aligned (Vyapar Style)
      const totalsStartX = leftMargin + 100;
      
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Subtotal', totalsStartX, yPos);
      doc.text(`₹${cartTotal.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
      yPos += 6;
      
      if (cgstAmount > 0) {
        doc.text(`CGST @ ${cgstRate}%`, totalsStartX, yPos);
        doc.text(`₹${cgstAmount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 6;
      }
      
      if (sgstAmount > 0) {
        doc.text(`SGST @ ${sgstRate}%`, totalsStartX, yPos);
        doc.text(`₹${sgstAmount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 6;
      }
      
      if (shippingCharges > 0) {
        doc.text('Shipping Charges', totalsStartX, yPos);
        doc.text(`₹${shippingCharges.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Grand Total - Highlighted
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(totalsStartX, yPos - 2, rightMargin, yPos - 2);
      yPos += 4;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Grand Total', totalsStartX, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(`₹${totalAmount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      // 7. AMOUNT IN WORDS
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Amount in Words:', leftMargin, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');
      const amountInWords = numberToWords(totalAmount);
      const wordsLines = doc.splitTextToSize(amountInWords, contentWidth - 20);
      wordsLines.forEach(line => {
        doc.text(line, leftMargin + 5, yPos);
        yPos += 4;
      });
      yPos += 8;

      // 8. FOOTER SECTION - Two Column Layout
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      const footerStartY = Math.max(yPos, pageHeight - 55);
      const footerCol1X = leftMargin;
      const footerCol2X = pageWidth / 2 + 5;

      // Left Column: Bank Details
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Information (Pay To):', footerCol1X, footerStartY);
      let bankY = footerStartY + 5;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      // Bank details (these should come from vendor profile)
      const bankName = vendor.bankName || 'KOTAK MAHINDRA BANK LIMITED, PUNE BANER ROAD BRANCH';
      const bankAccountNo = vendor.bankAccountNo || vendor.accountNumber || vendorPhone || 'Account Number';
      const bankIFSC = vendor.bankIFSC || vendor.ifscCode || 'KKBK0001767';
      const accountHolderName = vendor.accountHolderName || vendorTradeName;
      
      doc.text(`Bank Name: ${bankName}`, footerCol1X, bankY);
      bankY += 4;
      doc.text(`Bank Account No.: ${bankAccountNo}`, footerCol1X, bankY);
      bankY += 4;
      doc.text(`Bank IFSC code: ${bankIFSC}`, footerCol1X, bankY);
      bankY += 4;
      doc.text(`Account holder's name: ${accountHolderName}`, footerCol1X, bankY);
      bankY += 6;
      
      // UPI QR Code placeholder
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('UPI SCAN TO PAY', footerCol1X, bankY);
      bankY += 10;

      // Right Column: Authorized Signatory
      const signY = footerStartY;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`For : ${vendorTradeName}`, footerCol2X, signY);
      const signatureY = signY + 20;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(footerCol2X, signatureY, footerCol2X + 50, signatureY);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Authorized Signatory', footerCol2X, signatureY + 5);

      // Save the PDF
      doc.save(`Invoice-${order.orderNumber || order._id}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-xs text-gray-500">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Order Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr 
                key={order._id} 
                className="hover:bg-gray-50 transition cursor-pointer even:bg-gray-50"
                onClick={() => onOrderClick && onOrderClick(order._id)}
              >
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900 leading-tight">
                    {(() => {
                      const orderId = order._id || order.orderNumber || 'N/A';
                      if (!orderId || orderId === 'N/A') return 'N/A';
                      const idString = String(orderId);
                      const lastSix = idString.length > 6 ? idString.slice(-6) : idString;
                      return `#${lastSix}`;
                    })()}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs text-gray-900 leading-tight">
                    {order.deliveryAddress?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 leading-tight">
                    {order.deliveryAddress?.phone || ''}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs text-gray-900 font-medium leading-tight">
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-semibold text-gray-900 leading-tight">
                    ₹{order.billingDetails?.totalAmount?.toLocaleString() || 0}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="relative">
                    {(() => {
                      const isDelivered = order.orderStatus === 'delivered';
                      const isCancelled = order.orderStatus === 'cancelled';
                      const canChangeStatus = !isDelivered && !isCancelled;
                      
                      return (
                        <>
                          <button
                            onClick={() => canChangeStatus && setShowStatusDropdown(showStatusDropdown === order._id ? null : order._id)}
                            disabled={!canChangeStatus}
                            className={`px-2 py-0.5 inline-flex items-center space-x-1 text-xs leading-4 font-semibold rounded-full transition ${getStatusColor(
                              order.orderStatus
                            )} ${
                              canChangeStatus 
                                ? 'cursor-pointer hover:opacity-80' 
                                : 'cursor-not-allowed opacity-75'
                            }`}
                            title={!canChangeStatus ? 'Cannot change status for delivered or cancelled orders' : 'Change order status'}
                          >
                            <span>{order.orderStatus || 'pending'}</span>
                           
                          </button>
                            {showStatusDropdown === order._id && canChangeStatus && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowStatusDropdown(null)}
                                ></div>
                                <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                  <div className="py-1">
                                    {orderStatuses.map((status) => (
                                      <button
                                        key={status.value}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (order.orderStatus !== status.value) {
                                            onUpdateStatus(order._id, status.value);
                                          }
                                          setShowStatusDropdown(null);
                                        }}
                                        disabled={order.orderStatus === status.value}
                                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 transition flex items-center space-x-2 ${
                                          order.orderStatus === status.value
                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${status.colorClass}`}></span>
                                        <span>{status.label}</span>
                                        {order.orderStatus === status.value && (
                                          <span className="ml-auto text-xs">(Current)</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getPaymentDisplayColor(
                          order
                        )}`}
                      >
                        {getPaymentDisplayText(order)}
                      </span>
                     
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 leading-tight">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;

