import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import Modal from '../components/Modal';
import jsPDF from 'jspdf';
import { useOrders, useCancelOrder } from '../hooks/useApiQueries';
import Button from '../components/Button';

const Orders = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  // React Query hooks for orders with caching
  const { data: ordersResponse, isLoading: loading, error: ordersError } = useOrders({}, {
    enabled: isAuthenticated(),
    retry: false,
  });

  const cancelOrderMutation = useCancelOrder();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
  }, [navigate]);

  const orders = ordersResponse?.success && ordersResponse?.data ? ordersResponse.data : [];
  const error = ordersError ? (ordersError.response?.data?.message || 'Failed to load orders') : '';

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingOrder(orderId);
      await cancelOrderMutation.mutateAsync(orderId);
      // Query will automatically refetch due to invalidation in the mutation
      alert('Order cancelled successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
      processing: 'bg-purple-50 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-50 text-green-800 border-green-200',
      cancelled: 'bg-red-50 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  const getStatusText = (status) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your Orders</h1>
          <p className="text-sm text-gray-600 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Order Placed</span>
                        <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="hidden sm:block text-gray-300">|</div>
                      <div>
                        <span className="text-sm text-gray-600">Total</span>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{order.billingDetails?.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="hidden sm:block text-gray-300">|</div>
                      <div>
                        <span className="text-sm text-gray-600">Ship to</span>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                          {order.deliveryAddress?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Order #{order.orderNumber}</span>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        Order Details
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4">
                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {getStatusText(order.orderStatus)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-contain p-1 bg-white rounded border border-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/96?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded border border-gray-200 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.productName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{item.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    {order.orderStatus === 'delivered' && (
                      <Button variant="secondary" size="md">
                        Buy Again
                      </Button>
                    )}
                    {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                      <>
                        <Button variant="secondary" size="md">
                          Track Package
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingOrder === order._id}
                          loading={cancellingOrder === order._id}
                        >
                          Cancel Order
                        </Button>
                      </>
                    )}
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleViewOrder(order)}
                    >
                      View Order Details
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleDownloadInvoice(order)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Invoice
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)}>
        {selectedOrder && (
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Order #{selectedOrder.orderNumber}
            </h2>

            <div className="space-y-6">
              {/* Order Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status</h3>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {getStatusText(selectedOrder.orderStatus)}
                  </span>
                  <span className="text-sm text-gray-600">
                    Payment: {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                      selectedOrder.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-contain p-1 bg-white rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900">{selectedOrder.deliveryAddress.name}</p>
                  <p className="text-gray-600">{selectedOrder.deliveryAddress.addressLine1}</p>
                  {selectedOrder.deliveryAddress.addressLine2 && (
                    <p className="text-gray-600">{selectedOrder.deliveryAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-600">
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} -{' '}
                    {selectedOrder.deliveryAddress.pincode}
                  </p>
                  <p className="text-gray-600">Phone: {selectedOrder.deliveryAddress.phone}</p>
                </div>
              </div>

              {/* Billing Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing Details</h3>
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cart Total:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.cartTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.gstAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {/* GST Breakdown */}
                  {selectedOrder.items?.filter(item => item.gstPercentage > 0).length > 0 && (
                    <div className="pl-2 border-l-2 border-gray-200 space-y-1 mt-1">
                      {selectedOrder.items
                        .filter(item => item.gstPercentage > 0)
                        .map((item, index) => {
                          const itemGstAmount = item.gstAmount || ((item.total || 0) * (item.gstPercentage || 0) / 100);
                          return (
                            <div key={index} className="flex justify-between text-xs text-gray-600">
                              <span>{item.productName} ({item.gstPercentage}%):</span>
                              <span>₹{itemGstAmount.toFixed(2)}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.shippingCharges?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total Amount:</span>
                    <span className="text-red-600">₹{selectedOrder.billingDetails?.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
                <p className="text-gray-600">
                  {selectedOrder.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'UPI Online Payment'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleDownloadInvoice(selectedOrder)}
                className="flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Invoice
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
