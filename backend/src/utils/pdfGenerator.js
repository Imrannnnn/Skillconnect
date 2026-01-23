import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import axios from "axios";

export const generateTicketPDF = async (ticket, event) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 0,
                info: {
                    Title: `Ticket - ${event.title}`,
                    Author: 'SkillConnect'
                }
            });
            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            // Colors
            const emerald = "#10b981";
            const darkEmerald = "#064e3b";
            const lightEmerald = "#ecfdf5";
            const grey = "#64748b";
            const black = "#1e293b";

            // --- Background & Border ---
            doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8fafc");

            // Ticket Card background
            const cardX = 50;
            const cardY = 50;
            const cardWidth = doc.page.width - 100;
            let cardHeight = 600;

            if (event.branding?.backgroundImageUrl) {
                cardHeight = 750;
            }

            doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 20).fill("white");

            // Top Emerald Accent
            doc.path(`M ${cardX + 20} ${cardY} L ${cardX + cardWidth - 20} ${cardY} Q ${cardX + cardWidth} ${cardY} ${cardX + cardWidth} ${cardY + 20} L ${cardX + cardWidth} ${cardY + 40} L ${cardX} ${cardY + 40} L ${cardX} ${cardY + 20} Q ${cardX} ${cardY} ${cardX + 20} ${cardY} Z`).fill(emerald);

            let contentY = cardY + 70;

            // --- Flyer Image ---
            if (event.branding?.backgroundImageUrl) {
                try {
                    const response = await axios.get(event.branding.backgroundImageUrl, { responseType: 'arraybuffer' });
                    const flyerBuffer = Buffer.from(response.data);

                    // Display flyer at the top of the card
                    const flyerHeight = 150;
                    doc.save();
                    // Clip to rounded top corners
                    doc.roundedRect(cardX, cardY, cardWidth, flyerHeight + 20, 20).clip();
                    doc.image(flyerBuffer, cardX, cardY, { width: cardWidth, height: flyerHeight + 20, align: 'center', valign: 'center' });
                    doc.restore();

                    contentY = cardY + flyerHeight + 40;
                } catch (err) {
                    console.error("Failed to include flyer in PDF:", err.message);
                }
            }

            // --- Header Content ---
            // Event Title
            doc.fillColor(black)
                .fontSize(24)
                .font("Helvetica-Bold")
                .text(event.title, cardX + 40, contentY, { width: cardWidth - 80, align: "center" });

            // Ticket Type Badge
            const badgeWidth = 120;
            const badgeHeight = 25;
            const badgeX = cardX + (cardWidth - badgeWidth) / 2;
            const badgeY = contentY + 40;

            doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 12).fill(lightEmerald);
            doc.fillColor(darkEmerald)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(ticket.ticketType.name.toUpperCase(), badgeX, badgeY + 7, { width: badgeWidth, align: "center" });

            // --- Details Section ---
            const startY = contentY + 90;
            const col1X = cardX + 60;
            const col2X = cardX + (cardWidth / 2) + 20;

            // Helper to draw detail
            const drawDetail = (label, value, x, y) => {
                doc.fillColor(grey).fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), x, y);
                doc.fillColor(black).fontSize(12).font("Helvetica-Bold").text(value, x, y + 15);
            };

            // Date & Time
            drawDetail("Date", new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }), col1X, startY);
            drawDetail("Time", event.time, col2X, startY);

            // Venue & Ticket Holder
            const row2Y = startY + 60;
            drawDetail("Venue", event.venue, col1X, row2Y);
            drawDetail("Guest", ticket.holderName, col2X, row2Y);

            // Location
            const row3Y = row2Y + 60;
            drawDetail("Location", event.city, col1X, row3Y);
            drawDetail("Ticket ID", ticket.uniqueTicketId, col2X, row3Y);

            // --- Divider ---
            const dividerY = row3Y + 60;
            doc.moveTo(cardX + 40, dividerY)
                .lineTo(cardX + cardWidth - 40, dividerY)
                .dash(5, { space: 5 })
                .strokeColor("#e2e8f0")
                .stroke();

            // --- QR Code Section ---
            const qrSize = 120;
            const qrX = cardX + (cardWidth - qrSize) / 2;
            const qrY = dividerY + 30;

            try {
                const qrBuffer = await QRCode.toBuffer(ticket.uniqueTicketId, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#064e3b',
                        light: '#ffffff'
                    }
                });
                doc.image(qrBuffer, qrX, qrY, { width: qrSize });
            } catch (err) {
                console.error("Failed to generate QR code for PDF:", err.message);
            }

            doc.fillColor(grey)
                .fontSize(8)
                .font("Helvetica")
                .text("Scan this code at the entrance for check-in", cardX, qrY + qrSize + 15, { align: "center", width: cardWidth });

            // --- Footer ---
            doc.fillColor(grey)
                .fontSize(8)
                .text("This is a digital ticket. Please present it on your mobile device or bring a printed copy.", cardX, cardY + cardHeight - 50, { align: "center", width: cardWidth });

            doc.fillColor(emerald)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("SkillConnect", 0, cardY + cardHeight + 15, { align: "center", width: doc.page.width });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
