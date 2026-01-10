// Invoice Template Generators for Print and Modal Display

export interface InvoiceData {
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
  };
  shopSettings: {
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
    shop_email?: string;
    currency?: string;
    logo_url?: string;
    invoice_footer?: string;
    terms_and_conditions?: string;
    invoice_format?: string;
  } | null;
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  t: (key: string) => string;
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ==================== SIMPLE INVOICE TEMPLATE ====================
export const generateSimplePrintHTML = (data: InvoiceData): string => {
  const { sale, shopSettings, customerInfo, t } = data;
  const currency = shopSettings?.currency || "BDT";

  return `
    <html>
      <head>
        <title>Invoice - ${sale.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 25px;
            color: #374151; 
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 35px;
          }
          .shop-info {
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .shop-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
          .shop-details {
            max-width: 250px;
          }
          .shop-details h2 {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 5px;
          }
          .shop-details p {
            color: #6b7280;
            font-size: 10px;
            margin: 2px 0;
            line-height: 1.4;
          }
          .invoice-right {
            text-align: right;
          }
          .invoice-right p {
            font-size: 11px;
            color: #6b7280;
          }
          .invoice-right .title {
            font-weight: 500;
            color: #374151;
          }
          .address-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .address-block {
            max-width: 250px;
          }
          .address-block.right {
            text-align: right;
          }
          .address-block h3 {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
          .address-block p {
            font-size: 10px;
            color: #6b7280;
            line-height: 1.5;
          }
          .address-block .name {
            font-weight: 500;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            text-align: left;
            padding: 12px 8px;
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            border-top: 1px solid #9ca3af;
            border-bottom: 1px solid #9ca3af;
          }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td {
            padding: 15px 8px;
            font-size: 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          td.center { text-align: center; }
          td.right { text-align: right; }
          .product-name {
            color: #111827;
            font-weight: 500;
          }
          .totals-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals {
            width: 280px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 11px;
          }
          .total-label {
            color: #6b7280;
          }
          .total-value {
            color: #111827;
            font-weight: 500;
          }
          .terms {
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            margin-bottom: 20px;
          }
          .terms h4 {
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 5px;
          }
          .terms p {
            font-size: 10px;
            color: #9ca3af;
            white-space: pre-line;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
          }
          .footer p {
            font-size: 11px;
            color: #6b7280;
          }
          @media print { 
            body { padding: 15px; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-info">
            ${shopSettings?.logo_url ? `<img class="shop-logo" src="${shopSettings.logo_url}" alt="Logo" />` : ''}
            <div class="shop-details">
              <h2>${shopSettings?.shop_name || 'My Shop'}</h2>
              ${shopSettings?.shop_address ? `<p>${shopSettings.shop_address}</p>` : ''}
              ${shopSettings?.shop_email ? `<p>${shopSettings.shop_email}</p>` : ''}
              ${shopSettings?.shop_phone ? `<p>${shopSettings.shop_phone}</p>` : ''}
            </div>
          </div>
          <div class="invoice-right">
            <p class="title">Order Invoice</p>
            <p>Invoice: #${sale.invoice_number}</p>
            <p>Date: ${new Date(sale.sale_date).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            })}</p>
          </div>
        </div>
        
        <div class="address-row">
          <div class="address-block">
            <h3>BILL TO:</h3>
            <p class="name">${customerInfo.name || 'Walk-in Customer'}</p>
            ${customerInfo.phone ? `<p>${customerInfo.phone}</p>` : ''}
            ${customerInfo.email ? `<p>${customerInfo.email}</p>` : ''}
            ${customerInfo.address ? `<p>${customerInfo.address}</p>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th>Products</th>
              <th class="center">Quantity</th>
              <th class="right">Unit Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><span class="product-name">${item.product_name}</span></td>
                <td class="center">${item.quantity}</td>
                <td class="right">${currency} ${formatAmount(Number(item.unit_price))}</td>
                <td class="right">${currency} ${formatAmount(Number(item.total))}</td>
              </tr>
            `).join("") || ""}
          </tbody>
        </table>
        
        <div class="totals-wrapper">
          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">${currency} ${formatAmount(Number(sale.subtotal))}</span>
            </div>
            ${Number(sale.discount) > 0 ? `
              <div class="total-row">
                <span class="total-label">Discount</span>
                <span class="total-label">-${currency} ${formatAmount(Number(sale.discount))}</span>
              </div>
            ` : ""}
            ${Number(sale.tax) > 0 ? `
              <div class="total-row">
                <span class="total-label">Tax</span>
                <span class="total-label">+${currency} ${formatAmount(Number(sale.tax))}</span>
              </div>
            ` : ""}
            <div class="total-row">
              <span class="total-label">Total</span>
              <span class="total-value">${currency} ${formatAmount(Number(sale.total))}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Paid</span>
              <span class="total-value">${currency} ${formatAmount(Number(sale.paid_amount))}</span>
            </div>
            ${Number(sale.due_amount) > 0 ? `
              <div class="total-row">
                <span class="total-label">Due</span>
                <span class="total-value" style="color:#dc2626;">${currency} ${formatAmount(Number(sale.due_amount))}</span>
              </div>
            ` : ""}
          </div>
        </div>
        
        ${shopSettings?.terms_and_conditions ? `
          <div class="terms">
            <h4>Terms & Conditions:</h4>
            <p>${shopSettings.terms_and_conditions}</p>
          </div>
        ` : ""}
        
        <div class="footer">
          <p>${shopSettings?.invoice_footer || '**This is computer generated invoice, no signature required.**'}</p>
        </div>
      </body>
    </html>
  `;
};

// ==================== BETTER INVOICE TEMPLATE ====================
export const generateBetterPrintHTML = (data: InvoiceData): string => {
  const { sale, shopSettings, customerInfo } = data;

  const discountPercent = sale.discount && sale.subtotal 
    ? ((Number(sale.discount) / Number(sale.subtotal)) * 100).toFixed(0)
    : '0';

  const itemCount = sale.items?.length || 0;
  const emptyRowsNeeded = Math.max(0, 9 - itemCount);
  const emptyRows = Array.from({ length: emptyRowsNeeded }).map(() => `
    <tr>
      <td></td>
      <td></td>
      <td></td>
      <td class="amount">$ 0.00</td>
      <td></td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Invoice - ${sale.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 0;
            color: #333; 
            font-size: 11px;
            line-height: 1.4;
            background: #fff;
          }
          .invoice-container {
            border: 2px solid #e8a339;
            margin: 20px;
          }
          .header-dark {
            background: #4a4a4a;
            padding: 20px 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-placeholder {
            width: 50px;
            height: 50px;
            border: 2px solid #e8a339;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
          }
          .logo-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .logo-text {
            color: #fff;
          }
          .logo-text h1 {
            font-size: 22px;
            font-weight: bold;
            color: #fff;
          }
          .logo-text .tagline {
            color: #e8a339;
            font-size: 10px;
            margin-top: 2px;
          }
          .invoice-title {
            color: #e8a339;
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 3px;
          }
          .company-info {
            background: #5a5a5a;
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            color: #fff;
            font-size: 10px;
          }
          .company-details p {
            margin: 2px 0;
            color: #ddd;
          }
          .invoice-meta {
            text-align: right;
          }
          .invoice-meta p {
            margin: 3px 0;
          }
          .invoice-meta span {
            color: #aaa;
          }
          .bill-to-section {
            padding: 20px 25px;
          }
          .bill-to-header {
            background: #e8a339;
            color: #fff;
            padding: 6px 12px;
            font-weight: bold;
            font-size: 11px;
            display: inline-block;
            margin-bottom: 10px;
          }
          .bill-to-content p {
            margin: 3px 0;
            color: #666;
            font-size: 11px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 25px;
            width: calc(100% - 50px);
          }
          .items-table th {
            background: #e8a339;
            color: #fff;
            padding: 10px 12px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
          }
          .items-table th.center { text-align: center; }
          .items-table th.right { text-align: right; }
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
            color: #333;
          }
          .items-table td.center { text-align: center; }
          .items-table td.amount { text-align: right; }
          .items-table tr:nth-child(even) td {
            background: #fafafa;
          }
          .subtotal-row td {
            background: #f5f5f5 !important;
            font-weight: bold;
          }
          .check-icon {
            color: #e8a339;
            font-size: 14px;
            text-align: center;
          }
          .footer-section {
            padding: 20px 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .thank-you {
            font-size: 10px;
            color: #666;
            max-width: 300px;
            line-height: 1.5;
          }
          .thank-you strong {
            color: #333;
          }
          .totals-box {
            text-align: right;
          }
          .totals-box .row {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            margin: 5px 0;
            font-size: 11px;
          }
          .totals-box .label {
            color: #666;
            min-width: 120px;
            text-align: right;
          }
          .totals-box .value {
            min-width: 100px;
            text-align: right;
          }
          .balance-due {
            background: #e8a339;
            color: #fff;
            padding: 8px 15px;
            font-weight: bold;
            font-size: 13px;
            margin-top: 8px;
            display: inline-flex;
            gap: 30px;
          }
          @media print { 
            body { padding: 0; margin: 0; }
            .invoice-container { margin: 0; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header-dark">
            <div class="logo-section">
              ${shopSettings?.logo_url ? `
                <div class="logo-placeholder">
                  <img src="${shopSettings.logo_url}" alt="Logo" />
                </div>
              ` : `
                <div class="logo-placeholder">
                  <span style="color:#e8a339;font-size:8px;">LOGO</span>
                </div>
              `}
              <div class="logo-text">
                <h1>${shopSettings?.shop_name || 'Shop Name'}</h1>
                <p class="tagline">${shopSettings?.invoice_footer || 'Your trusted business partner'}</p>
              </div>
            </div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="company-info">
            <div class="company-details">
              ${shopSettings?.shop_address ? `<p>${shopSettings.shop_address}</p>` : '<p>Street address</p>'}
              <p>Phone: ${shopSettings?.shop_phone || '<Phone number>'}</p>
              ${shopSettings?.shop_email ? `<p>${shopSettings.shop_email}</p>` : '<p>&lt;Email&gt;</p>'}
            </div>
            <div class="invoice-meta">
              <p><span>Date:</span> ${new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}</p>
              <p><span>Invoice #:</span> ${sale.invoice_number}</p>
              <p><span>For:</span> PO # ${sale.invoice_number}</p>
            </div>
          </div>
          
          <div class="bill-to-section">
            <div class="bill-to-header">Bill To:</div>
            <div class="bill-to-content">
              <p>${customerInfo.name || 'Contact at company'}</p>
              <p>${customerInfo.phone || 'Phone number'}</p>
              ${customerInfo.address ? `<p>${customerInfo.address}</p>` : ''}
              ${customerInfo.email ? `<p>${customerInfo.email}</p>` : ''}
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width:80px;">Quantity</th>
                <th>Description</th>
                <th style="width:100px;">Unit price</th>
                <th style="width:100px;" class="right">Amount</th>
                <th style="width:100px;" class="center">Discount applied</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items?.map((item) => `
                <tr>
                  <td class="center">${item.quantity}</td>
                  <td>${item.product_name}</td>
                  <td>$ ${formatAmount(Number(item.unit_price))}</td>
                  <td class="amount">$ ${formatAmount(Number(item.total))}</td>
                  <td class="check-icon">${item.discount && Number(item.discount) > 0 ? '✔' : ''}</td>
                </tr>
              `).join("") || ""}
              ${emptyRows}
              <tr class="subtotal-row">
                <td colspan="3">Subtotal</td>
                <td class="amount">$ ${formatAmount(Number(sale.subtotal))}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer-section">
            <div class="thank-you">
              <p>Make all checks payable to <strong>${shopSettings?.shop_name || 'Company name'}</strong>. If you have any questions concerning this invoice, contact us at <strong>${shopSettings?.shop_phone || 'Phone'}</strong>, <strong>${shopSettings?.shop_email || 'Email'}</strong>.</p>
              <p style="margin-top:10px;"><strong>Thank you for your business!</strong></p>
            </div>
            <div class="totals-box">
              ${Number(sale.paid_amount) > 0 ? `
                <div class="row">
                  <span class="label">Credit</span>
                  <span class="value">$ ${formatAmount(Number(sale.paid_amount))}</span>
                </div>
              ` : ''}
              ${Number(sale.discount) > 0 ? `
                <div class="row">
                  <span class="label">Additional discount</span>
                  <span class="value">${discountPercent}%</span>
                </div>
              ` : ''}
              <div class="balance-due">
                <span>Balance due</span>
                <span>$ ${formatAmount(Number(sale.due_amount) > 0 ? Number(sale.due_amount) : Number(sale.total))}</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==================== SIMPLE INVOICE MODAL COMPONENT ====================
export const SimpleInvoiceModal = ({ sale, shopSettings, customerInfo, t }: InvoiceData) => {
  const currency = shopSettings?.currency || "BDT";
  
  return (
    <div className="bg-white p-8 text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-start gap-4">
          {shopSettings?.logo_url && (
            <img src={shopSettings.logo_url} alt="Logo" className="w-20 h-20 object-contain" />
          )}
          <div className="text-sm" style={{ maxWidth: '250px' }}>
            <h2 className="font-bold text-lg text-gray-900 mb-1">{shopSettings?.shop_name || 'My Shop'}</h2>
            {shopSettings?.shop_address && <p className="text-gray-600 text-xs leading-relaxed">{shopSettings.shop_address}</p>}
            {shopSettings?.shop_email && <p className="text-gray-600 text-xs">{shopSettings.shop_email}</p>}
            {shopSettings?.shop_phone && <p className="text-gray-600 text-xs">{shopSettings.shop_phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-700 font-medium">Order Invoice</p>
          <p className="text-sm text-gray-600">Invoice: #{sale.invoice_number}</p>
          <p className="text-sm text-gray-600">
            Date: {new Date(sale.sale_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-700 mb-2">BILL TO:</h3>
        <div className="text-gray-600 text-xs leading-relaxed">
          <p className="font-medium text-gray-800">{customerInfo.name || t("shop.walkInCustomer")}</p>
          {customerInfo.phone && <p>{customerInfo.phone}</p>}
          {customerInfo.email && <p>{customerInfo.email}</p>}
          {customerInfo.address && <p>{customerInfo.address}</p>}
        </div>
      </div>

      {/* Products Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b border-gray-400">
              <th className="py-3 text-left font-semibold text-gray-700 w-8">#</th>
              <th className="py-3 text-left font-semibold text-gray-700">Products</th>
              <th className="py-3 text-center font-semibold text-gray-700">Qty</th>
              <th className="py-3 text-right font-semibold text-gray-700">Unit Price</th>
              <th className="py-3 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 text-gray-600">{index + 1}</td>
                <td className="py-4 font-medium text-gray-800 text-xs">{item.product_name}</td>
                <td className="py-4 text-center text-gray-600 text-xs">{item.quantity}</td>
                <td className="py-4 text-right text-gray-600 text-xs">{currency} {formatAmount(Number(item.unit_price))}</td>
                <td className="py-4 text-right font-medium text-gray-800 text-xs">{currency} {formatAmount(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-72 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{currency} {formatAmount(Number(sale.subtotal))}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Discount</span>
              <span className="text-gray-600">-{currency} {formatAmount(Number(sale.discount))}</span>
            </div>
          )}
          {Number(sale.tax) > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-600">+{currency} {formatAmount(Number(sale.tax))}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-300">
            <span className="text-gray-700 font-semibold">Total</span>
            <span className="font-bold">{currency} {formatAmount(Number(sale.total))}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Paid</span>
            <span className="text-green-600 font-medium">{currency} {formatAmount(Number(sale.paid_amount))}</span>
          </div>
          {Number(sale.due_amount) > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Due</span>
              <span className="text-red-600 font-semibold">{currency} {formatAmount(Number(sale.due_amount))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms */}
      {shopSettings?.terms_and_conditions && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Terms & Conditions:</p>
          <p className="text-xs text-gray-400 whitespace-pre-line">{shopSettings.terms_and_conditions}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-6">
        <p className="text-sm text-gray-500">{shopSettings?.invoice_footer || '**This is computer generated invoice, no signature required.**'}</p>
      </div>
    </div>
  );
};

// ==================== BETTER INVOICE MODAL COMPONENT ====================
export const BetterInvoiceModal = ({ sale, shopSettings, customerInfo, t }: InvoiceData) => {
  return (
    <div className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="border-2 border-[#e8a339] m-4">
        {/* Dark Header */}
        <div className="bg-[#4a4a4a] p-5 flex justify-between items-start">
          <div className="flex items-center gap-3">
            {shopSettings?.logo_url ? (
              <div className="w-12 h-12 border-2 border-[#e8a339] p-1 flex items-center justify-center bg-white">
                <img src={shopSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 border-2 border-[#e8a339] flex items-center justify-center">
                <span className="text-[#e8a339] text-[8px]">LOGO</span>
              </div>
            )}
            <div>
              <h1 className="text-white text-xl font-bold">{shopSettings?.shop_name || 'Shop Name'}</h1>
              <p className="text-[#e8a339] text-[10px]">{shopSettings?.invoice_footer || 'Your trusted business partner'}</p>
            </div>
          </div>
          <h2 className="text-[#e8a339] text-4xl font-bold tracking-widest">INVOICE</h2>
        </div>
        
        {/* Company Info Row */}
        <div className="bg-[#5a5a5a] px-5 py-3 flex justify-between text-[10px]">
          <div className="text-gray-300">
            <p>{shopSettings?.shop_address || 'Street address'}</p>
            <p>Phone: {shopSettings?.shop_phone || '<Phone number>'}</p>
            <p>{shopSettings?.shop_email || '<Email>'}</p>
          </div>
          <div className="text-right text-white">
            <p><span className="text-gray-400">Date:</span> {new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}</p>
            <p><span className="text-gray-400">Invoice #:</span> {sale.invoice_number}</p>
            <p><span className="text-gray-400">For:</span> PO # {sale.invoice_number}</p>
          </div>
        </div>
        
        {/* Bill To Section */}
        <div className="p-5">
          <div className="bg-[#e8a339] text-white px-3 py-1.5 font-bold text-[11px] inline-block mb-2">Bill To:</div>
          <div className="text-[11px] text-gray-600">
            <p>{customerInfo.name || 'Contact at company'}</p>
            <p>{customerInfo.phone || 'Phone number'}</p>
            {customerInfo.address && <p>{customerInfo.address}</p>}
            {customerInfo.email && <p>{customerInfo.email}</p>}
          </div>
        </div>
        
        {/* Items Table */}
        <div className="px-5">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#e8a339] text-white">
                <th className="py-2.5 px-3 text-left font-bold w-20">Quantity</th>
                <th className="py-2.5 px-3 text-left font-bold">Description</th>
                <th className="py-2.5 px-3 text-left font-bold w-24">Unit price</th>
                <th className="py-2.5 px-3 text-right font-bold w-24">Amount</th>
                <th className="py-2.5 px-3 text-center font-bold w-28">Discount applied</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                  <td className="py-2.5 px-3">{item.product_name}</td>
                  <td className="py-2.5 px-3">$ {formatAmount(Number(item.unit_price))}</td>
                  <td className="py-2.5 px-3 text-right">$ {formatAmount(Number(item.total))}</td>
                  <td className="py-2.5 px-3 text-center text-[#e8a339] text-lg">{item.discount && Number(item.discount) > 0 ? '✔' : ''}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 5 - (sale.items?.length || 0)) }).map((_, i) => (
                <tr key={`empty-${i}`} className={((sale.items?.length || 0) + i) % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="py-2.5 px-3">&nbsp;</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right text-gray-400">$ 0.00</td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="py-2.5 px-3" colSpan={3}>Subtotal</td>
                <td className="py-2.5 px-3 text-right">$ {formatAmount(Number(sale.subtotal))}</td>
                <td className="py-2.5 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Footer Section */}
        <div className="p-5 flex justify-between items-start">
          <div className="text-[10px] text-gray-600 max-w-xs leading-relaxed">
            <p>Make all checks payable to <strong className="text-gray-800">{shopSettings?.shop_name || 'Company name'}</strong>. If you have any questions concerning this invoice, contact us at <strong className="text-gray-800">{shopSettings?.shop_phone || 'Phone'}</strong>, <strong className="text-gray-800">{shopSettings?.shop_email || 'Email'}</strong>.</p>
            <p className="mt-2 font-bold text-gray-800">Thank you for your business!</p>
          </div>
          <div className="text-right text-[11px]">
            {Number(sale.paid_amount) > 0 && (
              <div className="flex justify-end gap-5 mb-1">
                <span className="text-gray-600">Credit</span>
                <span>$ {formatAmount(Number(sale.paid_amount))}</span>
              </div>
            )}
            {Number(sale.discount) > 0 && (
              <div className="flex justify-end gap-5 mb-1">
                <span className="text-gray-600">Additional discount</span>
                <span>{((Number(sale.discount) / Number(sale.subtotal)) * 100).toFixed(0)}%</span>
              </div>
            )}
            <div className="bg-[#e8a339] text-white px-4 py-2 font-bold flex gap-8 mt-2">
              <span>Balance due</span>
              <span>$ {formatAmount(Number(sale.due_amount) > 0 ? Number(sale.due_amount) : Number(sale.total))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
