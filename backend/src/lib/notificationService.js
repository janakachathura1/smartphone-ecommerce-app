import nodemailer from 'nodemailer';

// Configure Nodemailer Transporter
const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null; // Return null if SMTP not configured (will fallback to console logging)
};

/**
 * Send an Email
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || '"TechPulse Store" <no-reply@techpulse.lk>';
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n📧 [EMAIL SIMULATION] -------------------`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${text || 'HTML Email Body (SMTP credentials missing in .env)'}`);
    console.log(`-----------------------------------------\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log(`✉️ Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send an SMS via Twilio or HTTP Gateway with fallback simulation
 */
export const sendSMS = async ({ to, message }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.log(`\n📱 [SMS SIMULATION] ---------------------`);
    console.log(`TO: ${to}`);
    console.log(`MESSAGE: ${message}`);
    console.log(`-----------------------------------------\n`);
    return { success: true, simulated: true };
  }

  try {
    // Dynamic import for optional twilio dependency or fetch API call
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({ From: fromPhone, To: to, Body: message });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`📲 SMS sent successfully to ${to}. SID: ${data.sid}`);
      return { success: true, sid: data.sid };
    } else {
      console.error(`❌ Twilio SMS Error:`, data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Order Confirmation Email & SMS
 */
export const sendOrderConfirmationNotifications = async (order, userEmail, userPhone, customerName) => {
  const orderNum = order.orderNumber || order.id;
  const totalStr = `Rs. ${order.totalAmount.toLocaleString('en-LK')}`;
  
  const itemsListHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.productName} ${item.storage ? `(${item.storage})` : ''} ${item.color ? `[${item.color}]` : ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Rs. ${(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('en-LK')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
        <h1 style="color: #1e293b; margin: 0; font-size: 24px;">TechPulse Mobile Store</h1>
        <p style="color: #64748b; margin: 5px 0 0 0;">Order Confirmation</p>
      </div>

      <div style="padding: 20px 0;">
        <h2 style="color: #0f172a; font-size: 18px;">Thank you for your order, ${customerName || 'Valued Customer'}!</h2>
        <p style="color: #475569; line-height: 1.6;">We have received your order <strong>#${orderNum}</strong> and are processing it. Below are your order details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 10px; text-align: left; color: #475569;">Item</th>
              <th style="padding: 10px; text-align: center; color: #475569;">Qty</th>
              <th style="padding: 10px; text-align: right; color: #475569;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; text-align: right;">
          <p style="margin: 4px 0; color: #475569;">Subtotal: <strong>Rs. ${order.subtotal.toLocaleString('en-LK')}</strong></p>
          <p style="margin: 4px 0; color: #475569;">Delivery Fee: <strong>Rs. ${order.deliveryFee.toLocaleString('en-LK')}</strong></p>
          ${order.discountAmount > 0 ? `<p style="margin: 4px 0; color: #ef4444;">Discount: <strong>-Rs. ${order.discountAmount.toLocaleString('en-LK')}</strong></p>` : ''}
          <h3 style="margin: 10px 0 0 0; color: #2563eb;">Total: ${totalStr}</h3>
        </div>
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
        <p>If you have any questions, contact us at UltraMobile@gmail.com or 0757192832.</p>
        <p>© ${new Date().getFullYear()} TechPulse Mobile Store. All rights reserved.</p>
      </div>
    </div>
  `;

  if (userEmail) {
    await sendEmail({
      to: userEmail,
      subject: `Order Confirmation #${orderNum} - TechPulse Store`,
      html,
      text: `Thank you for your order #${orderNum}! Total: ${totalStr}. We are processing your items.`,
    });
  }

  if (userPhone) {
    const smsMsg = `TechPulse: Thank you for your order #${orderNum}! Total: ${totalStr}. We will notify you when it ships.`;
    await sendSMS({ to: userPhone, message: smsMsg });
  }
};

/**
 * Send Order Status Update Email & SMS
 */
export const sendOrderStatusUpdateNotifications = async (order, userEmail, userPhone, newStatus) => {
  const orderNum = order.orderNumber || order.id;
  const statusFormatted = newStatus.toUpperCase();

  const statusMessages = {
    confirmed: 'Your order has been confirmed by our team!',
    processing: 'Your order is currently being packed and prepared for shipment.',
    shipped: 'Great news! Your order has been shipped and is on its way to you.',
    delivered: 'Your order has been successfully delivered. Thank you for shopping with us!',
    cancelled: 'Your order has been cancelled. Please contact support if you need assistance.',
  };

  const statusNote = statusMessages[newStatus] || `Your order status is now: ${newStatus}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #3b82f6;">
        <h2 style="color: #1e293b; margin: 0;">TechPulse Mobile Store</h2>
        <p style="color: #64748b; margin: 5px 0 0 0;">Order Status Update</p>
      </div>
      <div style="padding: 20px 0; text-align: center;">
        <h3 style="color: #0f172a;">Order #${orderNum} Status Changed</h3>
        <div style="display: inline-block; padding: 8px 18px; background-color: #3b82f6; color: #ffffff; border-radius: 20px; font-weight: bold; margin: 10px 0;">
          ${statusFormatted}
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-top: 15px;">${statusNote}</p>
      </div>
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} TechPulse Mobile Store</p>
      </div>
    </div>
  `;

  if (userEmail) {
    await sendEmail({
      to: userEmail,
      subject: `Order Status Update: #${orderNum} is now ${statusFormatted}`,
      html,
      text: `Order #${orderNum} status update: ${statusFormatted}. ${statusNote}`,
    });
  }

  if (userPhone) {
    const smsMsg = `TechPulse Alert: Your order #${orderNum} is now ${statusFormatted}. ${statusNote}`;
    await sendSMS({ to: userPhone, message: smsMsg });
  }
};

/**
 * Send Password Reset Token / OTP Email
 */
export const sendPasswordResetEmail = async (userEmail, resetTokenOrOtp, firstName) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #ef4444;">
        <h2 style="color: #1e293b; margin: 0;">TechPulse Mobile Store</h2>
        <p style="color: #64748b; margin: 5px 0 0 0;">Password Reset Request</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="color: #334155;">Hello ${firstName || 'User'},</p>
        <p style="color: #475569; line-height: 1.5;">We received a request to reset your password. Use the Verification Code / Token below to reset your password:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #ef4444; background: #fef2f2; padding: 12px 24px; border-radius: 8px; border: 1px dashed #fca5a5;">
            ${resetTokenOrOtp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} TechPulse Mobile Store</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Password Reset Code: ${resetTokenOrOtp} - TechPulse Store`,
    html,
    text: `Your TechPulse password reset verification code is: ${resetTokenOrOtp}. This code expires in 15 minutes.`,
  });
};
