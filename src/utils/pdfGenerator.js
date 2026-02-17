// PDF Invoice Generator for Order Confirmations
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF invoice for an order
 * @param {object} orderData - Order data
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoicePDF = async (orderData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks = [];

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - Company Logo & Info
      doc
        .fontSize(28)
        .fillColor('#1e3a8a')
        .text('Recycle My Device', 50, 50, { align: 'left' })
        .fontSize(10)
        .fillColor('#6b7280')
        .text('Making the world greener, one device at a time', 50, 85)
        .moveDown(0.5);

      // Invoice Title
      doc
        .fontSize(24)
        .fillColor('#1e3a8a')
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`Order #${orderData.orderNumber}`, 400, 80, { align: 'right' })
        .text(`Date: ${new Date(orderData.createdAt).toLocaleDateString('en-GB')}`, 400, 95, { align: 'right' });

      // Draw header line
      doc
        .moveTo(50, 130)
        .lineTo(545, 130)
        .strokeColor('#e5e7eb')
        .lineWidth(2)
        .stroke();

      // Customer Information Section
      doc
        .fontSize(12)
        .fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .text('CUSTOMER DETAILS', 50, 150);

      doc
        .fontSize(10)
        .fillColor('#374151')
        .font('Helvetica')
        .text(`Name: ${orderData.customerName}`, 50, 170)
        .text(`Email: ${orderData.customerEmail}`, 50, 185)
        .text(`Phone: ${orderData.customerPhone}`, 50, 200);

      if (orderData.address) {
        doc.text(`Address: ${orderData.address}`, 50, 215);
        if (orderData.city) doc.text(`City: ${orderData.city}`, 50, 230);
        if (orderData.postcode) doc.text(`Postcode: ${orderData.postcode}`, 50, 245);
      }

      // Order Details Section
      doc
        .fontSize(12)
        .fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .text('ORDER DETAILS', 50, 280);

      // Table Header
      const tableTop = 310;
      doc
        .fontSize(10)
        .fillColor('#ffffff')
        .rect(50, tableTop, 495, 25)
        .fillAndStroke('#1e3a8a', '#1e3a8a');

      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('Device', 60, tableTop + 8, { width: 200 })
        .text('Condition', 270, tableTop + 8, { width: 100 })
        .text('Storage', 380, tableTop + 8, { width: 80 })
        .text('Amount', 470, tableTop + 8, { width: 65, align: 'right' });

      // Table Row
      const rowTop = tableTop + 30;
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(orderData.deviceName || 'Device', 60, rowTop, { width: 200 })
        .text(orderData.deviceCondition || '-', 270, rowTop, { width: 100 })
        .text(orderData.storage || '-', 380, rowTop, { width: 80 })
        .fillColor('#10b981')
        .font('Helvetica-Bold')
        .text(`£${parseFloat(orderData.amount || 0).toFixed(2)}`, 470, rowTop, { width: 65, align: 'right' });

      // Draw row border
      doc
        .moveTo(50, rowTop + 20)
        .lineTo(545, rowTop + 20)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      // Total Section
      const totalTop = rowTop + 40;
      doc
        .fontSize(12)
        .fillColor('#374151')
        .font('Helvetica-Bold')
        .text('TOTAL AMOUNT:', 350, totalTop)
        .fontSize(16)
        .fillColor('#10b981')
        .text(`£${parseFloat(orderData.amount || 0).toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });

      // Status Badge
      const statusTop = totalTop + 40;
      const statusColor = orderData.status === 'completed' ? '#10b981' :
                         orderData.status === 'processing' ? '#f59e0b' :
                         orderData.paymentStatus === 'paid' ? '#3b82f6' : '#6b7280';

      doc
        .fontSize(10)
        .fillColor(statusColor)
        .font('Helvetica-Bold')
        .text(`Status: ${(orderData.status || 'pending').toUpperCase()}`, 50, statusTop)
        .fillColor(orderData.paymentStatus === 'paid' ? '#10b981' : '#f59e0b')
        .text(`Payment: ${(orderData.paymentStatus || 'pending').toUpperCase()}`, 50, statusTop + 20);

      // Next Steps Section
      doc
        .fontSize(12)
        .fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .text('WHAT HAPPENS NEXT?', 50, statusTop + 60);

      const stepsTop = statusTop + 85;
      doc
        .fontSize(10)
        .fillColor('#374151')
        .font('Helvetica')
        .text('1. You will receive a shipping label via email shortly', 70, stepsTop)
        .text('2. Pack your device securely in the box', 70, stepsTop + 20)
        .text('3. Ship your device using the provided label', 70, stepsTop + 40)
        .text('4. Once received and verified, payment will be processed', 70, stepsTop + 60);

      // Footer
      const footerTop = 720;
      doc
        .moveTo(50, footerTop)
        .lineTo(545, footerTop)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .font('Helvetica')
        .text('Questions? Contact us at support@recyclemydevice.com', 50, footerTop + 15, { align: 'center' })
        .text(`© ${new Date().getFullYear()} Recycle My Device. All rights reserved.`, 50, footerTop + 30, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Save PDF to file system (optional - for testing)
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - File path
 */
const savePDFToFile = async (pdfBuffer, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.join(__dirname, '../../temp/invoices');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);
      resolve(filePath);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  savePDFToFile,
};
