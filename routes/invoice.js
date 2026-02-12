const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const Rental = require("../models/Rental");
const Vehicle = require("../models/Vehicle");
const Customer = require("../models/Customer");

router.get("/:id", async (req, res) => {
  try {
    // Fetch rental with customer + vehicle
    const rental = await Rental.findById(req.params.id)
      .populate("customer")
      .populate("vehicle");

    if (!rental) return res.status(404).send("Rental not found");

    // Create invoice folder if missing
    const invoiceDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

    const filePath = path.join(invoiceDir, `invoice-${rental._id}.pdf`);

    // Create PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(22).text("Vehicle Rental Invoice", { underline: true });
    doc.moveDown();

    doc.fontSize(14).text(`Invoice ID: ${rental._id}`);
    doc.text(`Customer: ${rental.customer ? rental.customer.name : "N/A"}`);
    doc.text(`Vehicle: ${rental.vehicle ? rental.vehicle.model : "N/A"}`);
    doc.text(`Start Date: ${rental.startDate}`);
    doc.text(`End Date: ${rental.endDate}`);
    doc.text(`Total Amount: ₹${rental.totalAmount}`);
    doc.end();

    // Send PDF to browser
    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate invoice");
  }
});

module.exports = router;
