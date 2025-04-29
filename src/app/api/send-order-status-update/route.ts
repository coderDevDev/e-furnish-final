import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'avdeasisjewelry2@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'dqeq ukrn hvjg vnyx'
  }
});

const getStatusMessage = (status: string) => {
  switch (status.toLowerCase()) {
    case 'processing':
      return "We're now processing your order.";
    case 'shipped':
      return 'Your order has been shipped and is on its way!';
    case 'delivered':
      return 'Your order has been delivered. Enjoy!';
    case 'cancelled':
      return 'Your order has been cancelled.';
    default:
      return `Your order status has been updated to: ${status}`;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order, userProfile, orderSummary, status, statusUpdateDate } = body;

    const statusMessage = getStatusMessage(status);

    console.log({ userProfile: userProfile.email });
    const info = await transporter.sendMail({
      from: '"E-Furnish Store" <efurnishstore@gmail.com>',
      to: userProfile.email,
      subject: `Order Status Update - Order #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Status Update</h2>
          
          <p>Dear ${userProfile.full_name},</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0;">Status Update for Order #${order.id}</h3>
            <p style="font-size: 16px; color: #1a1a1a;">${statusMessage}</p>
            ${
              order.status_reason
                ? `<p style="color: #666;">Reason: ${order.status_reason}</p>`
                : ''
            }
            <p style="color: #666;">Updated on: ${new Date(
              statusUpdateDate
            ).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
            <h3>Order Summary</h3>
            ${orderSummary
              .map(
                item => `
              <div style="margin-bottom: 20px; display: flex; align-items: start;">
                ${
                  item.image
                    ? `<img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px;">`
                    : ''
                }
                <div>
                  <strong>${item.name}</strong><br>
                  Quantity: ${item.quantity}<br>
                  Price: ₱${item.price.toLocaleString()}<br>
                  ${
                    item.customization
                      ? `<div style="margin-top: 8px; font-size: 14px; color: #666;">
                          <strong>Customization:</strong><br>
                          ${Object.entries(item.customization)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('<br>')}
                         </div>`
                      : ''
                  }
                </div>
              </div>
            `
              )
              .join('')}
            
            <div style="border-top: 1px solid #dee2e6; margin-top: 10px; padding-top: 10px;">
              <strong>Total Amount: ₱${order.total_amount.toLocaleString(
                'en-PH',
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }
              )}</strong>
            </div>
          </div>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa;">
            <h3>Order Details</h3>
            <p>
              Order ID: #${order.id}<br>
              Payment Method: ${order.payment_method.toUpperCase()}<br>
              Payment Status: ${order.payment_status}<br>
              Order Date: ${new Date(order.created_at).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa;">
            <h3>Need Help?</h3>
            <p>If you have any questions about your order, please contact our customer support:</p>
            <p>Email: support@efurnish.com<br>
            Phone: +63</p>
          </div>
          
          <p style="color: #6c757d; font-size: 0.9em;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `
    });

    return NextResponse.json({ message: 'Email sent successfully', info });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error },
      { status: 500 }
    );
  }
}
