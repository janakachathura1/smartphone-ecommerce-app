import { formatPrice } from './utils';

/**
 * Generate a printable PDF Invoice document in a clean print window / popup
 */
export const printPDFInvoice = (order, settings = {}) => {
  if (!order) return;

  const shopName = settings.shopName || 'TechPulse Mobile Store';
  const shopPhone = settings.contactPhone || '0757192832';
  const shopEmail = settings.contactEmail || 'UltraMobile@gmail.com';
  const shopAddress = settings.footerAddress || '123 Tech Street, Colombo, Sri Lanka';

  const orderNum = order.orderNumber || order.id || 'TP-0000';
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const address = order.address || {};
  const customerName = address.fullName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer';
  const customerPhone = address.phone || order.user?.phone || 'N/A';
  const customerStreet = address.street || '';
  const customerCity = address.city || '';
  const customerState = address.state || '';
  const customerCountry = address.country || 'Sri Lanka';

  const itemsHtml = (order.items || [])
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: 600; color: #1e293b;">${idx + 1}</td>
        <td style="padding: 10px; color: #0f172a;">
          <strong>${item.productName || item.product?.name || 'Smartphone'}</strong>
          ${item.color ? `<br/><span style="font-size: 11px; color: #64748b;">Color: ${item.color}</span>` : ''}
          ${item.storage ? `<span style="font-size: 11px; color: #64748b; margin-left: 8px;">Storage: ${item.storage}</span>` : ''}
        </td>
        <td style="padding: 10px; text-align: center; color: #334155;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; color: #334155;">${formatPrice(item.unitPrice || item.price || 0)}</td>
        <td style="padding: 10px; text-align: right; font-weight: 700; color: #0f172a;">${formatPrice(item.totalPrice || (item.unitPrice || item.price || 0) * item.quantity)}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${orderNum} - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
          .invoice-box { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 16px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .shop-title { font-size: 26px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
          .invoice-title { font-size: 28px; font-weight: 900; color: #0f172a; text-transform: uppercase; text-align: right; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .info-block { vertical-align: top; width: 50%; font-size: 13px; line-height: 1.6; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          .items-table th { background: #f1f5f9; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
          .totals-table { width: 300px; margin-left: auto; border-collapse: collapse; font-size: 13px; margin-bottom: 40px; }
          .totals-table td { padding: 6px 10px; }
          .total-row { font-size: 16px; font-weight: 900; color: #2563eb; border-top: 2px solid #2563eb; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="shop-title">${shopName}</div>
                <div style="font-size: 12px; color: #64748b;">${shopAddress}</div>
                <div style="font-size: 12px; color: #64748b;">Tel: ${shopPhone} | Email: ${shopEmail}</div>
              </td>
              <td style="text-align: right;">
                <div class="invoice-title">INVOICE</div>
                <div style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 4px;">#${orderNum}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${orderDate}</div>
              </td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td class="info-block">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Billed / Shipped To:</strong><br/>
                <strong style="font-size: 15px; color: #0f172a;">${customerName}</strong><br/>
                ${customerStreet ? `${customerStreet}<br/>` : ''}
                ${customerCity ? `${customerCity}, ${customerState}<br/>` : ''}
                ${customerCountry}<br/>
                Phone: ${customerPhone}
              </td>
              <td class="info-block" style="text-align: right;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Order Details:</strong><br/>
                Payment Method: <strong style="text-transform: uppercase;">${order.paymentMethod || 'Card / COD'}</strong><br/>
                Payment Status: <strong style="color: ${order.paymentStatus === 'paid' ? '#16a34a' : '#dc2626'}; text-transform: uppercase;">${order.paymentStatus || 'UNPAID'}</strong><br/>
                Order Status: <strong style="text-transform: uppercase; color: #2563eb;">${order.status || 'PENDING'}</strong>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Item Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 100px;">Unit Price</th>
                <th style="text-align: right; width: 110px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">${formatPrice(order.subtotal || 0)}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Delivery Fee:</td>
              <td style="text-align: right; font-weight: 600;">${order.deliveryFee ? formatPrice(order.deliveryFee) : 'FREE'}</td>
            </tr>
            ${order.discountAmount > 0 ? `
              <tr>
                <td style="color: #ef4444;">Discount Coupon:</td>
                <td style="text-align: right; font-weight: 600; color: #ef4444;">-${formatPrice(order.discountAmount)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td style="padding-top: 10px;">Total Amount:</td>
              <td style="padding-top: 10px; text-align: right;">${formatPrice(order.totalAmount || 0)}</td>
            </tr>
          </table>

          <div class="footer">
            <p style="margin: 0 0 4px 0; font-weight: 600;">Thank you for shopping with ${shopName}!</p>
            <p style="margin: 0;">This is a computer-generated invoice. No signature is required.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
