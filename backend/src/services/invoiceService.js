import PDFDocument from "pdfkit";

/**
 * Generates a PDF invoice buffer.
 * @param {Object} data Invoice data { user, product, reference, amount, currency, date }
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 50 });
            const buffers = [];

            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => {
                resolve(Buffer.concat(buffers));
            });

            const { user, product, reference, amount, currency, date } = data;

            // Header
            doc.fillColor("#444444")
                .fontSize(20)
                .text("INVOICE", 110, 57)
                .fontSize(10)
                .text("SkillConnect", 200, 50, { align: "right" })
                .text("support@skillconnect.com", 200, 65, { align: "right" })
                .moveDown();

            // Separator
            doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, 90).lineTo(550, 90).stroke();

            // Customer Details
            doc.fontSize(10).text(`Invoiced To:`, 50, 110)
                .font("Helvetica-Bold").text(user.name, 50, 125)
                .font("Helvetica").text(user.email, 50, 140)
                .moveDown();

            // Invoice Details
            doc.text(`Invoice Number: ${reference}`, 400, 110)
                .text(`Invoice Date: ${new Date(date).toLocaleDateString()}`, 400, 125)
                .text(`Balance Due: $0.00 (Paid)`, 400, 140)
                .moveDown();

            // Table Header
            const invoiceTableTop = 180;
            doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, invoiceTableTop).lineTo(550, invoiceTableTop).stroke();
            doc.font("Helvetica-Bold")
                .text("Item", 50, invoiceTableTop + 5)
                .text("Description", 150, invoiceTableTop + 5)
                .text("Unit Cost", 280, invoiceTableTop + 5, { width: 90, align: "right" })
                .text("Quantity", 370, invoiceTableTop + 5, { width: 90, align: "right" })
                .text("Line Total", 470, invoiceTableTop + 5, { width: 90, align: "right" });
            doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, invoiceTableTop + 20).lineTo(550, invoiceTableTop + 20).stroke();

            // Item Row
            const itemY = invoiceTableTop + 30;
            doc.font("Helvetica")
                .text(product.name, 50, itemY)
                .text("Digital Product", 150, itemY)
                .text(`${currency} ${amount.toLocaleString()}`, 280, itemY, { width: 90, align: "right" })
                .text("1", 370, itemY, { width: 90, align: "right" })
                .text(`${currency} ${amount.toLocaleString()}`, 470, itemY, { width: 90, align: "right" });

            doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, itemY + 20).lineTo(550, itemY + 20).stroke();

            // Summary
            const subtotalY = itemY + 40;
            doc.font("Helvetica-Bold")
                .text("Total Paid", 370, subtotalY, { width: 90, align: "right" })
                .text(`${currency} ${amount.toLocaleString()}`, 470, subtotalY, { width: 90, align: "right" });

            // Footer
            doc.fontSize(10).text("Thank you for your business.", 50, 700, { align: "center", width: 500 });

            doc.end();
        } catch (e) {
            reject(e);
        }
    });
};
