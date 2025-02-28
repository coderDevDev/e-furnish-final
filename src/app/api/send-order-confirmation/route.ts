import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'avdeasisjewelry2@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'dqeq ukrn hvjg vnyx'
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      order,
      userProfile,
      orderSummary,
      shippingAddress,
      estimatedDeliveryDate
    } = body;

    // Send email
    const info = await transporter.sendMail({
      from: 'E-Furnish Store',
      to: 'dextermiranda441@gmail.com',
      subject: `Order Confirmation #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your order!</h2>
          
          <p>Dear ${userProfile.full_name},</p>
          
          <p>We're excited to confirm your order #${
            order.id
          }. Thank you for choosing our store!</p>
          
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
              <strong>Total Amount: ₱${order.total_amount.toLocaleString()}</strong>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Shipping Details</h3>
            <p>
              ${shippingAddress.street}<br>
              ${shippingAddress.barangay_name}<br>
              ${shippingAddress.city_name}, ${shippingAddress.province_name}<br>
              ${shippingAddress.zip_code}
            </p>
          </div>
          
          <p>Estimated Delivery Date: ${format(
            new Date(estimatedDeliveryDate),
            'MMMM dd, yyyy'
          )}</p>
          
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
