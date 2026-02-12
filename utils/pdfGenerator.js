const PDFDocument = require('pdfkit');

async function generateInvoicePDF(rental, res) {
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${rental.rental_id}.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text('VEHICLE RENTAL INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text('Vehicle Rental Management System', { align: 'center' });
  doc.text('123 Rental Street, City, State 12345', { align: 'center' });
  doc.text('Phone: (123) 456-7890 | Email: info@vehiclerental.com', { align: 'center' });
  doc.moveDown(2);

  // Invoice Details
  doc.fontSize(12).text(`Invoice Number: ${rental.rental_id}`, 50, 150);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 170);
  doc.text(`Status: ${rental.status}`, 50, 190);

  // Customer Details
  doc.fontSize(14).text('CUSTOMER DETAILS', 50, 230);
  doc.fontSize(11)
    .text(`Name: ${rental.customer_id.name}`, 50, 250)
    .text(`Email: ${rental.customer_id.email}`, 50, 270)
    .text(`Phone: ${rental.customer_id.phone}`, 50, 290)
    .text(`Address: ${rental.customer_id.address}`, 50, 310);

  // Vehicle Details
  doc.fontSize(14).text('VEHICLE DETAILS', 50, 350);
  doc.fontSize(11)
    .text(`Vehicle ID: ${rental.vehicle_id.vehicle_id}`, 50, 370)
    .text(`Brand: ${rental.vehicle_id.brand}`, 50, 390)
    .text(`Model: ${rental.vehicle_id.model}`, 50, 410)
    .text(`Fuel Type: ${rental.vehicle_id.fuel}`, 50, 430)
    .text(`Daily Rate: ₹${rental.vehicle_id.daily_rate}`, 50, 450);

  // Rental Period
  doc.fontSize(14).text('RENTAL PERIOD', 50, 490);
  doc.fontSize(11)
    .text(`Start Date: ${rental.start_date.toLocaleDateString()}`, 50, 510)
    .text(`End Date: ${rental.end_date.toLocaleDateString()}`, 50, 530);

  const days = Math.ceil((rental.end_date - rental.start_date) / (1000 * 60 * 60 * 24));
  doc.text(`Total Days: ${days}`, 50, 550);

  // Payment Details Section
  doc.fontSize(14).text('PAYMENT DETAILS', 50, 590);

  // Table Header
  const tableTop = 610;
  doc.fontSize(11)
    .text('Description', 50, tableTop, { width: 250 })
    .text('Days', 300, tableTop, { width: 100 })
    .text('Rate (₹)', 400, tableTop, { width: 100 })
    .text('Amount (₹)', 480, tableTop, { width: 100 });

  doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

  // Table Row
  doc.fontSize(10)
    .text('Vehicle Rental', 50, tableTop + 30, { width: 250 })
    .text(days.toString(), 300, tableTop + 30, { width: 100 })
    .text(`₹${rental.vehicle_id.daily_rate}`, 400, tableTop + 30, { width: 100 })
    .text(`₹${rental.total_amount}`, 480, tableTop + 30, { width: 100 });

  doc.moveTo(50, tableTop + 50).lineTo(550, tableTop + 50).stroke();

  // Final Total
  doc.fontSize(14)
    .text('TOTAL AMOUNT:', 350, tableTop + 70)
    .text(`₹${rental.total_amount}`, 480, tableTop + 70);

  // Footer
  doc.fontSize(10)
    .text('Thank you for choosing our service!', 50, 720, { align: 'center' })
    .text('For any queries, please contact us.', 50, 735, { align: 'center' });

  doc.end();
}

module.exports = { generateInvoicePDF };
