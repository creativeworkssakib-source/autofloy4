// Thermal Receipt Template - Super Shop Style POS Receipt
// Supports 80mm, 58mm thermal printers and A4 format

export interface ThermalReceiptData {
  sale: {
    invoice_number: string;
    sale_date: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total: number;
      discount?: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid_amount: number;
    due_amount: number;
    payment_method?: string;
  };
  shopSettings: {
    shop_name?: string;
    branch_name?: string;
    shop_address?: string;
    shop_phone?: string;
    shop_email?: string;
    currency?: string;
    logo_url?: string;
    invoice_footer?: string;
    terms_and_conditions?: string;
    tax_rate?: number;
    invoice_format?: 'simple' | 'better';
    receipt_size?: '80mm' | '58mm' | 'a4';
    receipt_font_size?: 'small' | 'medium' | 'large';
    show_logo_on_receipt?: boolean;
    thank_you_message?: string;
    show_tax_on_receipt?: boolean;
    show_payment_method?: boolean;
    receipt_header_text?: string;
    receipt_footer_text?: string;
  } | null;
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  t: (key: string) => string;
}

const formatAmount = (amount: number, currency: string = '৳') => {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get font sizes based on setting
const getFontSizes = (size: 'small' | 'medium' | 'large' = 'small') => {
  switch (size) {
    case 'large':
      return { body: '12px', header: '16px', title: '20px', small: '10px' };
    case 'medium':
      return { body: '10px', header: '14px', title: '18px', small: '8px' };
    default: // small
      return { body: '8px', header: '12px', title: '14px', small: '7px' };
  }
};

// Get receipt width based on paper size
const getReceiptWidth = (size: '80mm' | '58mm' | 'a4' = '80mm') => {
  switch (size) {
    case '58mm':
      return '58mm';
    case 'a4':
      return '210mm';
    default:
      return '80mm';
  }
};

// ==================== THERMAL RECEIPT TEMPLATE (80mm / 58mm) ====================
export const generateThermalReceiptHTML = (data: ThermalReceiptData): string => {
  const { sale, shopSettings, customerInfo } = data;
  const currency = shopSettings?.currency || '৳';
  const receiptSize = shopSettings?.receipt_size || '80mm';
  const fontSize = getFontSizes(shopSettings?.receipt_font_size || 'small');
  const receiptWidth = getReceiptWidth(receiptSize);
  const showLogo = shopSettings?.show_logo_on_receipt !== false;
  const showTax = shopSettings?.show_tax_on_receipt !== false;
  const showPaymentMethod = shopSettings?.show_payment_method !== false;
  const thankYouMessage = shopSettings?.thank_you_message || 'Thank you for shopping with us!';

  const is58mm = receiptSize === '58mm';
  const isA4 = receiptSize === 'a4';

  // For A4, use regular invoice style
  if (isA4) {
    return generateA4InvoiceHTML(data);
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${sale.invoice_number}</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          @page {
            size: ${receiptWidth} auto;
            margin: 0;
          }
          body { 
            font-family: 'Courier New', Courier, monospace;
            width: ${receiptWidth};
            margin: 0 auto;
            padding: ${is58mm ? '3mm' : '4mm'};
            color: #000;
            font-size: ${fontSize.body};
            line-height: 1.3;
            background: #fff;
          }
          .receipt-container {
            width: 100%;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .double-divider {
            border-top: 2px solid #000;
            margin: 4px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .logo {
            max-width: ${is58mm ? '35mm' : '45mm'};
            max-height: ${is58mm ? '20mm' : '25mm'};
            margin: 0 auto 4px;
            display: block;
          }
          .shop-name {
            font-size: ${fontSize.title};
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .branch-name {
            font-size: ${fontSize.header};
            margin-bottom: 2px;
          }
          .shop-info {
            font-size: ${fontSize.small};
            line-height: 1.4;
          }
          .invoice-info {
            margin: 6px 0;
            font-size: ${fontSize.body};
          }
          .invoice-info-row {
            display: flex;
            justify-content: space-between;
          }
          .customer-info {
            margin: 4px 0;
            font-size: ${fontSize.small};
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: ${fontSize.small};
            padding: 2px 0;
          }
          .item-row {
            margin: 2px 0;
            font-size: ${fontSize.body};
          }
          .item-name {
            display: block;
            word-wrap: break-word;
          }
          .item-calc {
            display: flex;
            justify-content: space-between;
            font-size: ${fontSize.small};
            padding-left: ${is58mm ? '2mm' : '4mm'};
          }
          .totals {
            margin-top: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: ${fontSize.body};
            padding: 1px 0;
          }
          .grand-total {
            font-size: ${fontSize.header};
            font-weight: bold;
            padding: 3px 0;
          }
          .due-amount {
            color: #000;
            font-weight: bold;
          }
          .payment-info {
            margin-top: 4px;
            font-size: ${fontSize.small};
            text-align: center;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: ${fontSize.small};
          }
          .thank-you {
            font-size: ${fontSize.body};
            font-weight: bold;
            margin: 4px 0;
          }
          .terms {
            font-size: ${fontSize.small};
            white-space: pre-line;
            margin-top: 4px;
          }
          .barcode-area {
            text-align: center;
            margin-top: 6px;
            font-size: ${fontSize.small};
          }
          @media print {
            body { 
              width: ${receiptWidth}; 
              padding: 2mm;
            }
            @page { 
              margin: 0; 
              size: ${receiptWidth} auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="header">
            ${showLogo && shopSettings?.logo_url ? `<img class="logo" src="${shopSettings.logo_url}" alt="Logo" />` : ''}
            <div class="shop-name">${shopSettings?.shop_name || 'MY SHOP'}</div>
            ${shopSettings?.branch_name ? `<div class="branch-name">${shopSettings.branch_name}</div>` : ''}
            <div class="shop-info">
              ${shopSettings?.shop_address ? `${shopSettings.shop_address}<br>` : ''}
              ${shopSettings?.shop_phone ? `Tel: ${shopSettings.shop_phone}<br>` : ''}
              ${shopSettings?.shop_email ? `${shopSettings.shop_email}` : ''}
            </div>
            ${shopSettings?.receipt_header_text ? `<div class="shop-info" style="margin-top:2px;">${shopSettings.receipt_header_text}</div>` : ''}
          </div>

          <div class="divider"></div>

          <!-- Invoice Info -->
          <div class="invoice-info">
            <div class="invoice-info-row">
              <span>Invoice:</span>
              <span class="bold">#${sale.invoice_number}</span>
            </div>
            <div class="invoice-info-row">
              <span>Date:</span>
              <span>${formatDate(sale.sale_date)}</span>
            </div>
          </div>

          ${customerInfo.name ? `
            <div class="customer-info">
              <div>Customer: ${customerInfo.name}</div>
              ${customerInfo.phone ? `<div>Phone: ${customerInfo.phone}</div>` : ''}
            </div>
          ` : ''}

          <div class="double-divider"></div>

          <!-- Items Header -->
          <div class="items-header">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          <div class="divider"></div>

          <!-- Items -->
          ${sale.items?.map(item => `
            <div class="item-row">
              <span class="item-name">${item.product_name}</span>
              <div class="item-calc">
                <span>${item.quantity} x ${formatAmount(Number(item.unit_price), currency)}</span>
                <span>${formatAmount(Number(item.total), currency)}</span>
              </div>
            </div>
          `).join('') || ''}

          <div class="double-divider"></div>

          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatAmount(Number(sale.subtotal), currency)}</span>
            </div>
            ${Number(sale.discount) > 0 ? `
              <div class="total-row">
                <span>Discount</span>
                <span>-${formatAmount(Number(sale.discount), currency)}</span>
              </div>
            ` : ''}
            ${showTax && Number(sale.tax) > 0 ? `
              <div class="total-row">
                <span>Tax</span>
                <span>+${formatAmount(Number(sale.tax), currency)}</span>
              </div>
            ` : ''}
            <div class="divider"></div>
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${formatAmount(Number(sale.total), currency)}</span>
            </div>
            <div class="divider"></div>
            <div class="total-row">
              <span>Paid</span>
              <span>${formatAmount(Number(sale.paid_amount), currency)}</span>
            </div>
            ${Number(sale.due_amount) > 0 ? `
              <div class="total-row due-amount">
                <span>DUE</span>
                <span>${formatAmount(Number(sale.due_amount), currency)}</span>
              </div>
            ` : `
              <div class="total-row">
                <span>Change</span>
                <span>${formatAmount(Math.max(0, Number(sale.paid_amount) - Number(sale.total)), currency)}</span>
              </div>
            `}
          </div>

          ${showPaymentMethod && sale.payment_method ? `
            <div class="payment-info">
              Payment: ${sale.payment_method.toUpperCase()}
            </div>
          ` : ''}

          <div class="divider"></div>

          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">${thankYouMessage}</div>
            ${shopSettings?.terms_and_conditions ? `<div class="terms">${shopSettings.terms_and_conditions}</div>` : ''}
            ${shopSettings?.receipt_footer_text ? `<div class="terms">${shopSettings.receipt_footer_text}</div>` : ''}
            <div class="barcode-area">
              ${sale.invoice_number}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==================== A4 INVOICE TEMPLATE ====================
const generateA4InvoiceHTML = (data: ThermalReceiptData): string => {
  const { sale, shopSettings, customerInfo } = data;
  const currency = shopSettings?.currency || '৳';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${sale.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 15mm; }
          body { 
            font-family: Arial, sans-serif;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            font-size: 12px;
            line-height: 1.5;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .shop-info { display: flex; align-items: flex-start; gap: 15px; }
          .shop-logo { width: 80px; height: 80px; object-fit: contain; }
          .shop-details h2 { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .shop-details p { color: #666; font-size: 11px; margin: 2px 0; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 28px; color: #333; margin-bottom: 10px; }
          .invoice-title p { font-size: 11px; color: #666; }
          .billing-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .billing-block h3 { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .billing-block p { font-size: 11px; color: #333; line-height: 1.5; }
          .billing-block .name { font-weight: 600; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f5f5f5; text-align: left; padding: 12px; font-size: 11px; font-weight: 600; border-bottom: 2px solid #333; }
          th.right { text-align: right; }
          th.center { text-align: center; }
          td { padding: 12px; font-size: 11px; border-bottom: 1px solid #eee; }
          td.right { text-align: right; }
          td.center { text-align: center; }
          .totals-wrapper { display: flex; justify-content: flex-end; }
          .totals { width: 280px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; border-bottom: 1px solid #eee; }
          .total-row.grand { font-size: 16px; font-weight: bold; border-bottom: 2px solid #333; border-top: 2px solid #333; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; }
          .footer .thank-you { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-info">
            ${shopSettings?.logo_url ? `<img class="shop-logo" src="${shopSettings.logo_url}" alt="Logo" />` : ''}
            <div class="shop-details">
              <h2>${shopSettings?.shop_name || 'My Shop'}</h2>
              ${shopSettings?.branch_name ? `<p><strong>${shopSettings.branch_name}</strong></p>` : ''}
              ${shopSettings?.shop_address ? `<p>${shopSettings.shop_address}</p>` : ''}
              ${shopSettings?.shop_phone ? `<p>Tel: ${shopSettings.shop_phone}</p>` : ''}
              ${shopSettings?.shop_email ? `<p>${shopSettings.shop_email}</p>` : ''}
            </div>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <p><strong>Invoice #:</strong> ${sale.invoice_number}</p>
            <p><strong>Date:</strong> ${formatDate(sale.sale_date)}</p>
          </div>
        </div>

        <div class="billing-section">
          <div class="billing-block">
            <h3>Bill To</h3>
            <p class="name">${customerInfo.name || 'Walk-in Customer'}</p>
            ${customerInfo.phone ? `<p>${customerInfo.phone}</p>` : ''}
            ${customerInfo.email ? `<p>${customerInfo.email}</p>` : ''}
            ${customerInfo.address ? `<p>${customerInfo.address}</p>` : ''}
          </div>
          <div class="billing-block" style="text-align: right;">
            <h3>Payment Info</h3>
            <p><strong>Method:</strong> ${sale.payment_method || 'Cash'}</p>
            <p><strong>Status:</strong> ${Number(sale.due_amount) > 0 ? 'Partial' : 'Paid'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>Item Description</th>
              <th class="center">Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product_name}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${formatAmount(Number(item.unit_price), currency)}</td>
                <td class="right">${formatAmount(Number(item.total), currency)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="totals-wrapper">
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatAmount(Number(sale.subtotal), currency)}</span>
            </div>
            ${Number(sale.discount) > 0 ? `
              <div class="total-row">
                <span>Discount</span>
                <span>-${formatAmount(Number(sale.discount), currency)}</span>
              </div>
            ` : ''}
            ${Number(sale.tax) > 0 ? `
              <div class="total-row">
                <span>Tax</span>
                <span>+${formatAmount(Number(sale.tax), currency)}</span>
              </div>
            ` : ''}
            <div class="total-row grand">
              <span>Grand Total</span>
              <span>${formatAmount(Number(sale.total), currency)}</span>
            </div>
            <div class="total-row">
              <span>Paid Amount</span>
              <span>${formatAmount(Number(sale.paid_amount), currency)}</span>
            </div>
            ${Number(sale.due_amount) > 0 ? `
              <div class="total-row" style="color: #dc2626;">
                <span>Due Amount</span>
                <span>${formatAmount(Number(sale.due_amount), currency)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="footer">
          <p class="thank-you">${shopSettings?.thank_you_message || 'Thank you for your business!'}</p>
          ${shopSettings?.terms_and_conditions ? `<p>${shopSettings.terms_and_conditions}</p>` : ''}
          ${shopSettings?.invoice_footer ? `<p>${shopSettings.invoice_footer}</p>` : ''}
        </div>
      </body>
    </html>
  `;
};

// ==================== REACT COMPONENTS FOR MODAL PREVIEW ====================
import React from 'react';

export const ThermalReceiptPreview: React.FC<ThermalReceiptData> = ({
  sale,
  shopSettings,
  customerInfo,
}) => {
  const currency = shopSettings?.currency || '৳';
  const receiptSize = shopSettings?.receipt_size || '80mm';
  const showLogo = shopSettings?.show_logo_on_receipt !== false;
  const showTax = shopSettings?.show_tax_on_receipt !== false;
  const showPaymentMethod = shopSettings?.show_payment_method !== false;
  const thankYouMessage = shopSettings?.thank_you_message || 'Thank you for shopping with us!';
  const is58mm = receiptSize === '58mm';

  const receiptWidthClass = is58mm ? 'w-[58mm]' : 'w-[80mm]';
  const fontSizeClass = {
    small: 'text-[8px]',
    medium: 'text-[10px]',
    large: 'text-[12px]',
  }[shopSettings?.receipt_font_size || 'small'];

  return (
    <div className={`${receiptWidthClass} mx-auto bg-white p-3 font-mono ${fontSizeClass} text-black border border-dashed border-gray-300`}>
      {/* Header */}
      <div className="text-center mb-2">
        {showLogo && shopSettings?.logo_url && (
          <img src={shopSettings.logo_url} alt="Logo" className="max-w-[40mm] max-h-[20mm] mx-auto mb-1" />
        )}
        <div className="font-bold text-sm uppercase">{shopSettings?.shop_name || 'MY SHOP'}</div>
        {shopSettings?.branch_name && <div className="text-xs">{shopSettings.branch_name}</div>}
        <div className="text-[7px] leading-tight">
          {shopSettings?.shop_address && <div>{shopSettings.shop_address}</div>}
          {shopSettings?.shop_phone && <div>Tel: {shopSettings.shop_phone}</div>}
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Invoice Info */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Invoice:</span>
          <span className="font-bold">#{sale.invoice_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(sale.sale_date)}</span>
        </div>
      </div>

      {customerInfo.name && (
        <div className="mt-1 text-[7px]">
          <div>Customer: {customerInfo.name}</div>
          {customerInfo.phone && <div>Phone: {customerInfo.phone}</div>}
        </div>
      )}

      <div className="border-t-2 border-black my-1" />

      {/* Items Header */}
      <div className="flex justify-between font-bold text-[7px]">
        <span>ITEM</span>
        <span>TOTAL</span>
      </div>
      <div className="border-t border-dashed border-black my-0.5" />

      {/* Items */}
      <div className="space-y-1">
        {sale.items?.map((item, index) => (
          <div key={index}>
            <div className="break-words">{item.product_name}</div>
            <div className="flex justify-between text-[7px] pl-2">
              <span>{item.quantity} x {formatAmount(Number(item.unit_price), currency)}</span>
              <span>{formatAmount(Number(item.total), currency)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-black my-1" />

      {/* Totals */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatAmount(Number(sale.subtotal), currency)}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatAmount(Number(sale.discount), currency)}</span>
          </div>
        )}
        {showTax && Number(sale.tax) > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>+{formatAmount(Number(sale.tax), currency)}</span>
          </div>
        )}
        <div className="border-t border-dashed border-black my-0.5" />
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{formatAmount(Number(sale.total), currency)}</span>
        </div>
        <div className="border-t border-dashed border-black my-0.5" />
        <div className="flex justify-between">
          <span>Paid</span>
          <span>{formatAmount(Number(sale.paid_amount), currency)}</span>
        </div>
        {Number(sale.due_amount) > 0 ? (
          <div className="flex justify-between font-bold">
            <span>DUE</span>
            <span>{formatAmount(Number(sale.due_amount), currency)}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatAmount(Math.max(0, Number(sale.paid_amount) - Number(sale.total)), currency)}</span>
          </div>
        )}
      </div>

      {showPaymentMethod && sale.payment_method && (
        <div className="text-center mt-1 text-[7px]">
          Payment: {sale.payment_method.toUpperCase()}
        </div>
      )}

      <div className="border-t border-dashed border-black my-1" />

      {/* Footer */}
      <div className="text-center space-y-1">
        <div className="font-bold">{thankYouMessage}</div>
        {shopSettings?.terms_and_conditions && (
          <div className="text-[6px] whitespace-pre-line">{shopSettings.terms_and_conditions}</div>
        )}
        <div className="text-[7px] mt-1">{sale.invoice_number}</div>
      </div>
    </div>
  );
};

export default { generateThermalReceiptHTML, ThermalReceiptPreview };
