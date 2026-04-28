const axios = require('axios');
const db = require('../config/db');
const crypto = require('crypto');

// ETIMS configuration - normally from env or database
const KRA_API_BASE = process.env.KRA_API_BASE || 'https://etims-api.kra.go.ke';
const KRA_SIMULATOR = process.env.KRA_SIMULATOR !== 'false'; // Default to true if not specified

// E-TIMS uses payload signatures and specific JSON structures
async function generateInvoicePayload(saleId, businessId) {
    // Standard structure that maps a sale to an eTIMS invoice
    const saleResult = await db.query(
        'SELECT * FROM sale_transactions WHERE id = $1 AND business_id = $2',
        [saleId, businessId]
    );

    if (saleResult.rows.length === 0) {
        throw new Error('Sale not found');
    }
    const sale = saleResult.rows[0];

    const itemsResult = await db.query(
        'SELECT s.*, p.name as product_name, p.tax_code FROM sales s JOIN products p ON s.product_id = p.id WHERE s.transaction_id = $1',
        [saleId]
    );

    // KRA required field mapping (simplified representation of TIMS Type C payload)
    const payload = {
        invoiceNo: `INV-${saleId}-${Date.now()}`,
        date: new Date().toISOString(),
        cashier: sale.cashier_id || 'System',
        buyerName: "Walk-in Customer",
        buyerPin: "", // Optional for B2C
        totalAmount: Number(sale.total_amount),
        taxDetails: {
            taxableAmount: Number(sale.total_amount) / 1.16, // Assume 16% VAT broadly for this demo
            vatAmount: Number(sale.total_amount) - (Number(sale.total_amount) / 1.16),
            taxRate: 16
        },
        items: itemsResult.rows.map(item => ({
            itemName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.subtotal,
            taxCode: item.tax_code || 'A' // A is typically 16% VAT
        }))
    };

    return payload;
}

// Signs the payload securely
function signPayload(payload) {
    // In actual TIMS this involves a private key and a specific hashing algorithm
    const payloadString = JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
    return hash;
}

async function sendInvoiceToKRA(saleId, businessId) {
    const payload = await generateInvoicePayload(saleId, businessId);
    const signature = signPayload(payload);

    if (KRA_SIMULATOR) {
        // Return simulated success
        const controlNumber = `KRA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        try {
            // Log locally to simulate storage
            await db.query(
                "UPDATE sale_transactions SET kra_receipt_no = $1 WHERE id = $2",
                [controlNumber, saleId]
            );
        } catch(e) {
            console.log("Column kra_receipt_no might not exist yet, ignoring in simulator");
        }

        return {
            success: true,
            receiptNumber: controlNumber,
            message: 'Successfully generated KRA receipt in Simulator mode.',
            payload
        };
    }

    try {
        const response = await axios.post(`${KRA_API_BASE}/invoice/submit`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature,
                'Authorization': `Bearer ${process.env.KRA_TOKEN}`
            }
        });

        if (response.data.success) {
             const controlNumber = response.data.receiptNumber;
             try {
                await db.query(
                    "UPDATE sale_transactions SET kra_receipt_no = $1 WHERE id = $2",
                    [controlNumber, saleId]
                );
             } catch(e) {}
             
            return response.data;
        } else {
            throw new Error(response.data.errorMessage || 'eTIMS rejection');
        }

    } catch (error) {
        console.error("KRA submission failed", error.message);
        throw new Error('Failed to send invoice to KRA eTIMS');
    }
}

module.exports = {
    generateInvoicePayload,
    sendInvoiceToKRA
};
