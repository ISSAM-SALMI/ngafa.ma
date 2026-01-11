import { Client } from '../types';

interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
}

interface ReceiptData {
  title: string; // e.g. "Salone Receipt" or "Rental Contract"
  id: string;
  date: string;
  client: Client;
  items: ReceiptItem[];
  total: number;
  footerNote?: string;
}

export const printReceipt = (data: ReceiptData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>Fature - ${data.client.firstName} ${data.client.lastName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Tajawal', sans-serif;
          padding: 40px;
          background: #fff;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 20px;
        }
        .brand {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 14px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-box {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
        }
        .label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .value {
          font-size: 16px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          text-align: right;
          padding: 12px;
          background: #f3f4f6;
          font-size: 14px;
          color: #374151;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-section {
          text-align: left;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #111827;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
          font-size: 20px;
          font-weight: bold;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">نوبتشيا ERP</div>
        <div class="subtitle">${data.title}</div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="label">العميل</div>
          <div class="value">${data.client.firstName} ${data.client.lastName}</div>
          <div class="label" style="margin-top:8px">الهاتف</div>
          <div class="value">${data.client.phone}</div>
           ${data.client.cin ? `<div class="label" style="margin-top:8px">CIN</div><div class="value">${data.client.cin}</div>` : ''}
        </div>
        <div class="info-box">
          <div class="label">رقم الفاتورة</div>
          <div class="value">#${data.id.slice(0, 8).toUpperCase()}</div>
          <div class="label" style="margin-top:8px">التاريخ</div>
          <div class="value">${data.date}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>الخدمة / المنتج</th>
            ${data.items.some(i => i.quantity) ? '<th>الكمية</th>' : ''}
            <th style="text-align:left">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}</td>
              ${data.items.some(i => i.quantity) ? `<td>${item.quantity || 1}</td>` : ''}
              <td style="text-align:left">${item.price * (item.quantity || 1)} درهم</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>المجموع الكلي:</span>
          <span>${data.total} درهم</span>
        </div>
      </div>

      <div class="footer">
        <p>${data.footerNote || 'شكراً لثقتكم بنا. نوبتشيا - لجميع مناسباتكم.'}</p>
        <p>تم استخراج هذه الوثيقة تلقائياً من النظام بتاريخ ${new Date().toLocaleDateString('ar-MA')}</p>
      </div>

      <script>
        window.onload = () => {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};