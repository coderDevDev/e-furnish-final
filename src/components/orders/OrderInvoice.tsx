'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { PhilippinePeso } from 'lucide-react';

interface OrderInvoiceProps {
  order: any;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
  };
}

const OrderInvoice = forwardRef<HTMLDivElement, OrderInvoiceProps>(
  ({ order, businessInfo }, ref) => {
    const [normalizedItems, setNormalizedItems] = useState<any[]>([]);

    useEffect(() => {
      // Normalize order items to handle different data structures
      if (order) {
        console.log('Order structure in invoice:', order);

        let items = [];

        // First check order_items
        if (Array.isArray(order.order_items) && order.order_items.length > 0) {
          items = order.order_items.map(item => {
            const product = item.products || item.product || {};

            return {
              ...item,
              products: {
                title: product.title || product.name || 'Product',
                srcurl:
                  product.srcurl || (product.images && product.images[0]) || '',
                ...product
              }
            };
          });
        }
        // If order_items is empty, try using the items array
        else if (Array.isArray(order.items) && order.items.length > 0) {
          items = order.items.map(item => {
            // Need to fetch the product info
            return {
              ...item,
              products: {
                title: `Product #${item.product_id}`,
                price: item.price
              }
            };
          });
        }

        setNormalizedItems(items);
      }
    }, [order]);

    const defaultBusinessInfo = {
      name: 'Manonson Furniture Shop',
      address: 'Zone 2, Colacling Lupi, Camarines Sur',
      phone: '+63992771013 ',
      email: 'support@efurnish.com',
      website: 'e-furnish-final.vercel.app',
      logo: '/logo.png'
    };

    const business = businessInfo || defaultBusinessInfo;

    if (!order) return null;

    return (
      <div
        ref={ref}
        className="bg-white w-full max-w-4xl mx-auto p-8 print:p-6"
        id="invoice-to-print">
        {/* Invoice Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {business.logo && (
              <div className="relative h-16 w-16 print:h-14 print:w-14">
                <Image
                  src={business.logo}
                  alt={business.name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {business.name}
              </h1>
              <p className="text-gray-500">{business.address}</p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-gray-600">#{order.id}</p>
            <p className="text-gray-500">
              Date: {format(new Date(order.created_at), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-6 print:my-4"></div>

        {/* Customer and Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 print:mb-4">
          <div>
            <h3 className="text-gray-500 font-medium mb-2">Bill To:</h3>
            <p className="font-medium">
              {order.profiles?.full_name || 'Customer'}
            </p>
            {order.shipping_address && (
              <>
                <p className="text-gray-600">{order.shipping_address.street}</p>
                <p className="text-gray-600">
                  {order.shipping_address.barangay_name},{' '}
                  {order.shipping_address.city_name}
                </p>
                <p className="text-gray-600">
                  {order.shipping_address.province_name},{' '}
                  {order.shipping_address.zip_code}
                </p>
              </>
            )}
          </div>
          <div>
            <h3 className="text-gray-500 font-medium mb-2">
              Payment Information:
            </h3>
            <p>
              <span className="text-gray-600">Status:</span>{' '}
              <span
                className={
                  order.payment_status === 'paid'
                    ? 'text-green-600 font-medium'
                    : 'text-amber-600 font-medium'
                }>
                {order.payment_status.toUpperCase()}
              </span>
            </p>
            <p>
              <span className="text-gray-600">Method:</span>{' '}
              <span className="font-medium">
                {order.payment_method === 'cod'
                  ? 'Cash on Delivery'
                  : order.payment_method === 'paypal'
                  ? 'PayPal'
                  : order.payment_method}
              </span>
            </p>
            <p>
              <span className="text-gray-600">Order Status:</span>{' '}
              <span className="font-medium capitalize">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Order Items */}
        <table className="w-full border-collapse mb-6 print:mb-4">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-gray-600">Item</th>
              <th className="py-2 text-center text-gray-600">Quantity</th>
              <th className="py-2 text-right text-gray-600">Price</th>
              <th className="py-2 text-right text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {normalizedItems.length > 0 ? (
              normalizedItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-3">
                    <div className="flex items-start gap-3">
                      {item.products?.srcurl && (
                        <Image
                          src={item.products.srcurl}
                          alt={item.products.title}
                          width={40}
                          height={40}
                          className="rounded-md object-cover border print:hidden"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.products.title}</p>
                        {item.customization && (
                          <div className="text-sm text-gray-500 mt-1">
                            <p className="italic">Customizations</p>
                            {item.customization.breakdown?.map(
                              (custom: any, j: number) => (
                                <p key={j} className="text-xs">
                                  {custom.details.displayName ||
                                    custom.fieldLabel}
                                  : {custom.value}
                                  {custom.cost > 0 &&
                                    ` (+₱${custom.cost.toLocaleString()})`}
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">
                    ₱{item.price ? item.price.toLocaleString() : '0'}
                  </td>
                  <td className="py-3 text-right">
                    ₱{((item.price || 0) * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No items found in this order
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Order Summary */}
        <div className="flex justify-end mb-6 print:mb-4">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                ₱
                {(
                  order.total_amount - (order.shipping_fee || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">
                ₱{(order.shipping_fee || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-2 text-lg border-t border-gray-200">
              <span className="font-medium">Total:</span>
              <span className="font-bold">
                ₱{order.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 print:pt-4">
          <p className="text-gray-500 mb-2 text-sm">
            Thank you for your business!
          </p>
          <div className="text-gray-500 text-sm">
            <p>{business.email}</p>
            <p>{business.phone}</p>
            <p>{business.website}</p>
          </div>
        </div>
      </div>
    );
  }
);

OrderInvoice.displayName = 'OrderInvoice';

export default OrderInvoice;
