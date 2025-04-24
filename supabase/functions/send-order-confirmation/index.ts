import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp/mod.ts';

serve(async req => {
  try {
    const {
      to,
      orderId,
      orderDate,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      total,
      estimatedDelivery
    } = await req.json();

    // Configure email client
    const client = new SmtpClient();
    await client.connect({
      hostname: Deno.env.get('SMTP_HOSTNAME') || '',
      port: Number(Deno.env.get('SMTP_PORT')) || 587,
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || ''
    });

    // Generate HTML for items
    const itemsHtml = items
      .map(
        item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.name
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">₱${
          item.price
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">₱${
          item.subtotal
        }</td>
      </tr>
      ${
        item.customization
          ? `
      <tr>
        <td colspan="4" style="padding: 5px 10px; background-color: #f9f9f9; font-size: 14px;">
          <em>Customization: ${JSON.stringify(item.customization)}</em>
        </td>
      </tr>
      `
          : ''
      }
    `
      )
      .join('');

    // Create email content
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #4CAF50; padding: 20px; color: white; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
        .totals { margin-top: 20px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for your order! We've received your order and are working on it right away.</p>
          
          <h2>Order Details</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Order Date:</strong> ${orderDate}</p>
          
          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Subtotal:</strong> ₱${subtotal}</p>
            <p><strong>Shipping:</strong> ₱${shippingFee}</p>
            <p style="font-size: 18px;"><strong>Total:</strong> ₱${total}</p>
          </div>
          
          <h3>Shipping Information</h3>
          <p>${shippingAddress}</p>
          
          <h3>Payment Method</h3>
          <p>${paymentMethod}</p>
          
          <h3>Estimated Delivery</h3>
          <p>${estimatedDelivery}</p>
          
          <p>If you have any questions about your order, please contact our customer service at support@example.com.</p>
          
          <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>© 2023 Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send the email
    await client.send({
      from: Deno.env.get('EMAIL_FROM') || 'no-reply@yourdomain.com',
      to: to,
      subject: `Order Confirmation #${orderId}`,
      content: emailHtml,
      html: emailHtml
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
