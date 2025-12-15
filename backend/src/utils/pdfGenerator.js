import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import axios from "axios";

export const generateTicketPDF = async (ticket, event) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 0 });
            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            const primaryColor = event.branding?.primaryColor || "#4f46e5";
            const secondaryColor = event.branding?.secondaryColor || "#ffffff";

            // --- Header Section ---
            doc.rect(0, 0, doc.page.width, 160).fill(primaryColor);

            // Logo (if available)
            if (event.branding?.logoUrl) {
                try {
                    const response = await axios.get(event.branding.logoUrl, { responseType: "arraybuffer" });
                    const logoBuffer = Buffer.from(response.data, "binary");
                    doc.image(logoBuffer, 50, 40, { fit: [80, 80] });
                } catch (err) {
                    console.error("Failed to load logo for PDF:", err.message);
                }
            }

            // Event Title
            doc.fillColor(secondaryColor)
                .fontSize(28)
                .font("Helvetica-Bold")
                .text(event.title, 150, 50, { width: 400, align: "left" });

            // Event Category
            doc.fontSize(12)
                .font("Helvetica")
                .text(event.category.toUpperCase(), 150, 90, { width: 400, align: "left" });

            // --- Ticket Details Section ---
            doc.fillColor("black").font("Helvetica");

            const startY = 200;
            const col1X = 50;
            const col2X = 300;

            // Ticket Type & Holder
            doc.fontSize(10).text("TICKET TYPE", col1X, startY);
            doc.fontSize(18).font("Helvetica-Bold").text(ticket.ticketType.name, col1X, startY + 15);

            doc.fontSize(10).font("Helvetica").text("HOLDER NAME", col2X, startY);
            doc.fontSize(18).font("Helvetica-Bold").text(ticket.holderName, col2X, startY + 15);

            // Date & Time
            const row2Y = startY + 60;
            doc.fontSize(10).font("Helvetica").text("DATE", col1X, row2Y);
            doc.fontSize(14).font("Helvetica-Bold").text(new Date(event.date).toLocaleDateString(), col1X, row2Y + 15);

            doc.fontSize(10).font("Helvetica").text("TIME", col2X, row2Y);
            doc.fontSize(14).font("Helvetica-Bold").text(event.time, col2X, row2Y + 15);

            // Venue
            const row3Y = row2Y + 60;
            doc.fontSize(10).font("Helvetica").text("VENUE", col1X, row3Y);
            doc.fontSize(14).font("Helvetica-Bold").text(`${event.venue}, ${event.city}`, col1X, row3Y + 15, { width: 500 });

            // Ticket ID
            const row4Y = row3Y + 60;
            doc.fontSize(10).font("Helvetica").text("TICKET ID", col1X, row4Y);
            doc.fontSize(14).font("Helvetica-Courier").text(ticket.uniqueTicketId, col1X, row4Y + 15);

            // --- QR Code Section ---
            const qrY = row4Y + 60;
            try {
                const qrBuffer = await QRCode.toBuffer(ticket.uniqueTicketId, { width: 150, margin: 1 });
                doc.image(qrBuffer, (doc.page.width - 150) / 2, qrY);
            } catch (err) {
                console.error("Failed to generate QR code for PDF:", err.message);
            }

            doc.fontSize(10).font("Helvetica").text("Scan this code at the entrance", 0, qrY + 160, { align: "center" });

            // Footer
            doc.fontSize(8).text("Powered by SkillConnect", 50, doc.page.height - 50, { align: "center", width: doc.page.width - 100 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
