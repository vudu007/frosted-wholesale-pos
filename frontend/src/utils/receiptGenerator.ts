import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define a type compatible with both CartItem and the SaleItem from history
export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
};

export const generateReceipt = (
  items: ReceiptItem[],
  subtotal: number,
  tax: number,
  total: number,
  orderId: string,
  cashierName: string,
  businessInfo: { name: string; address: string },
  logoUrl: string | null,
  customer?: { name: string; pointsEarned: number; totalPoints: number } | null,
  date: string = new Date().toLocaleString(),
  currency: string = "₦"
) => {
  // --- THERMAL PRINTER TEMPLATE (HTML) ---
  const width = '80mm'; // Standard POS width

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt #${orderId}</title>
      <style>
        @page { margin: 0; size: auto; }
        body {
          font-family: 'Courier New', monospace;
          width: ${width};
          margin: 0;
          padding: 5px;
          font-size: 12px;
          color: black;
          background: white;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .logo { max-width: 50%; height: auto; margin-bottom: 5px; }
        .title { font-size: 16px; font-weight: bold; }
        .info { font-size: 10px; margin-bottom: 5px; }
        .divider { border-top: 1px dashed black; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 10px; border-bottom: 1px solid black; }
        td { font-size: 10px; padding-top: 2px; vertical-align: top; }
        .qty { width: 15%; text-align: center; }
        .item { width: 55%; }
        .price { width: 30%; text-align: right; }
        .totals { margin-top: 5px; }
        .row { display: flex; justify-content: space-between; }
        .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        .customer-info { margin-top: 10px; font-size: 11px; border: 1px solid black; padding: 5px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
        <div class="title">${businessInfo.name}</div>
        <div class="info">${businessInfo.address}</div>
        <div class="info">Powered by EmmyPos</div>
        <div class="divider"></div>
        <div class="info" style="text-align: left;">
          Date: ${date}<br>
          Receipt: #${orderId}<br>
          Cashier: ${cashierName}
        </div>
        <div class="divider"></div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="qty">Qty</th>
            <th class="item">Item</th>
            <th class="price">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td class="qty">${item.qty}</td>
              <td class="item">${item.name}</td>
              <td class="price">${currency}${(item.price * item.qty).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals">
        <div class="row">
          <span>Subtotal:</span>
          <span>${currency}${subtotal.toLocaleString()}</span>
        </div>
        <div class="row" style="font-weight: bold; font-size: 16px; margin-top: 5px;">
          <span>TOTAL:</span>
          <span>${currency}${total.toLocaleString()}</span>
        </div>
      </div>

      ${customer ? `
        <div class="customer-info">
          <div><strong>Customer:</strong> ${customer.name}</div>
          <div>Points Earned: +${customer.pointsEarned}</div>
          <div><strong>New Balance: ${customer.totalPoints} pts</strong></div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your patronage!</p>
        <p>No refunds after 24 hours.</p>
        <p style="font-size: 8px; margin-top: 5px;">Powered by EmmyPos Enterprise</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  // Open a new window and print
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert("Pop-up blocked! Please allow pop-ups for printing.");
  }
};

export const downloadReceiptPDF = async (
  items: ReceiptItem[],
  subtotal: number,
  tax: number,
  total: number,
  orderId: string,
  cashierName: string,
  businessInfo: { name: string; address: string },
  logoUrl: string | null,
  customer?: { name: string; pointsEarned: number; totalPoints: number } | null,
  date: string = new Date().toLocaleString(),
  currency: string = "₦"
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
  let y = 10;

  // Logo (if available)
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const imgWidth = 30;
            const imgHeight = (img.height * imgWidth) / img.width;
            const centerX = 40;
            doc.addImage(img, 'PNG', centerX - imgWidth / 2, y, imgWidth, imgHeight);
            y += imgHeight + 5;
            resolve(true);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
      });
    } catch (e) {
      console.warn('Could not load logo:', e);
    }
  }

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(businessInfo.name, 40, y, { align: 'center' });
  y += 6;
  
  if (businessInfo.address) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(businessInfo.address, 40, y, { align: 'center' });
    y += 5;
  }

  doc.setLineWidth(0.1);
  doc.line(5, y, 75, y);
  y += 5;

  // Receipt Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${date}`, 5, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Receipt: #${orderId}`, 5, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Cashier: ${cashierName}`, 5, y);
  y += 6;

  doc.line(5, y, 75, y);
  y += 2;

  // Items Table
  autoTable(doc, {
    startY: y,
    head: [["Qty", "Item", "Price"]],
    body: items.map(item => [
      item.qty.toString(),
      item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name,
      `${currency}${(item.price * item.qty).toLocaleString()}`
    ]),
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: 5, right: 5 },
    tableWidth: 70
  });

  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 5;

  doc.line(5, y, 75, y);
  y += 5;

  // Totals
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Subtotal:`, 40, y, { align: 'right' });
  doc.text(`${currency}${subtotal.toLocaleString()}`, 75, y, { align: 'right' });
  y += 5;

  doc.text(`Tax:`, 40, y, { align: 'right' });
  doc.text(`${currency}${tax.toLocaleString()}`, 75, y, { align: 'right' });
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL:`, 40, y, { align: 'right' });
  doc.text(`${currency}${total.toLocaleString()}`, 75, y, { align: 'right' });
  y += 8;

  // Customer Info (if available)
  if (customer) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Customer: ${customer.name}`, 5, y);
    y += 4;
    doc.text(`Points: ${customer.totalPoints}`, 5, y);
    y += 4;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your patronage!", 40, y, { align: 'center' });
  y += 3;
  doc.text("Powered by EmmyPos Enterprise", 40, y, { align: 'center' });

  doc.save(`Receipt-${orderId}.pdf`);
};

export const generateInvoicePDF = async (
  items: ReceiptItem[],
  subtotal: number,
  tax: number,
  total: number,
  orderId: string,
  cashierName: string,
  businessInfo: { name: string; address: string },
  logoUrl: string | null,
  customer?: { name: string; address?: string; phone?: string } | null,
  date: string = new Date().toLocaleDateString(),
  currency: string = "₦"
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  // Header Background
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 50, 'F');

  // Logo (if available) - positioned on the left
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const imgWidth = 40;
            const imgHeight = (img.height * imgWidth) / img.width;
            doc.addImage(img, 'PNG', 20, 5, imgWidth, Math.min(imgHeight, 40));
            resolve(true);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
      });
    } catch (e) {
      console.warn('Could not load logo:', e);
    }
  }

  // Business Branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const businessNameX = logoUrl ? 70 : 20;
  doc.text(businessInfo.name, businessNameX, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(businessInfo.address || '', businessNameX, 28);

  // Invoice Label
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 190, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #${orderId}`, 190, 30, { align: 'right' });
  doc.text(`Date: ${date}`, 190, 36, { align: 'right' });

  y = 60;
  doc.setTextColor(0, 0, 0);

  // Bill To / Invoice Details Section
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.rect(20, y - 5, 170, 35, 'F');

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 20, y);
  doc.text("INVOICE DETAILS:", 140, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name || "Guest Customer", 20, y);
  doc.text(`Invoice ID: #${orderId}`, 140, y);

  y += 5;
  if (customer?.address) {
    doc.text(customer.address, 20, y);
  }
  doc.text(`Date: ${date}`, 140, y);

  y += 5;
  if (customer?.phone) {
    doc.text(`Tel: ${customer.phone}`, 20, y);
  }
  doc.text(`Served by: ${cashierName}`, 140, y);

  y += 5;
  if (businessInfo.address) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Business Address: ${businessInfo.address}`, 20, y);
  }

  y += 15;

  // Items Table
  autoTable(doc, {
    startY: y,
    head: [["S/N", "Item Description", "Qty", "Unit Price", "Total"]],
    body: items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.qty.toString(),
      `${currency}${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      `${currency}${(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 }
  });

  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 15;

  // Totals Section
  const summaryX = 140;
  doc.setFillColor(248, 250, 252);
  doc.rect(summaryX - 10, y - 5, 70, 50, 'F');

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Subtotal:", summaryX, y);
  doc.text(`${currency}${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 190, y, { align: 'right' });

  y += 10;
  doc.setFillColor(30, 41, 59);
  doc.rect(summaryX - 10, y - 6, 70, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("GRAND TOTAL:", summaryX, y);
  doc.text(`${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 190, y, { align: 'right' });

  // Footer
  y = 270;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.line(20, y - 5, 190, y - 5);
  doc.text("Thank you for choosing EmmyPos Enterprise.", 105, y, { align: 'center' });
  doc.text("Please contact us for any payment queries.", 105, y + 4, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, y + 8, { align: 'center' });

  doc.save(`Invoice-${orderId}.pdf`);
};
