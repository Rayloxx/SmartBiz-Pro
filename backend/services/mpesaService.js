const axios = require('axios');
const db = require('../config/db');

// Environment variables
const DARAJA_CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY || 'test_key';
const DARAJA_CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET || 'test_secret';
const DARAJA_PASSKEY = process.env.DARAJA_PASSKEY || 'test_passkey';
const DARAJA_SHORTCODE = process.env.DARAJA_SHORTCODE || '174379';
const DARAJA_ENV = process.env.DARAJA_ENV || 'sandbox';

async function getAccessToken() {
    if (DARAJA_CONSUMER_KEY === 'test_key') {
        return 'simulated_mpesa_token';
    }

    const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');
    const url = DARAJA_ENV === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    try {
        const response = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to get M-Pesa access token', error.response?.data || error.message);
        throw new Error('M-Pesa Authentication Failed');
    }
}

async function initiateSTKPush(phone_number, amount, reference = 'SmartBiz') {
    // Format phone to 254...
    let formattedPhone = phone_number.replace(/\s+/g, '').replace('+', '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
        formattedPhone = '254' + formattedPhone;
    }

    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');
    const callbackUrl = `${process.env.APP_URL || 'https://smartbiz-pro.local'}/api/mpesa/callback`;

    const payload = {
        BusinessShortCode: DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(Number(amount)),
        PartyA: formattedPhone,
        PartyB: DARAJA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: reference,
        TransactionDesc: 'Payment for SmartBiz System Invoice'
    };

    if (DARAJA_CONSUMER_KEY === 'test_key') {
        // Simulated response for development
        return {
            simulated: true,
            message: 'STK Push simulated successfully for ' + formattedPhone,
            CheckoutRequestID: 'ws_CO_' + timestamp,
            ResponseCode: '0'
        };
    }

    const pushUrl = DARAJA_ENV === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    try {
        const response = await axios.post(pushUrl, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data; // Includes CheckoutRequestID
    } catch (error) {
        console.error('STK Push Request Failed', error.response?.data || error.message);
        throw new Error('M-Pesa STK Push Failed');
    }
}

async function checkTransactionStatus(checkoutRequestId) {
    if (DARAJA_CONSUMER_KEY === '') {
        return {
            ResponseCode: '0',
            ResultCode: '0',
            ResultDesc: 'The service request is processed successfully.'
        };
    }

    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
        BusinessShortCode: DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
    };

    const statusUrl = DARAJA_ENV === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
        : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    try {
        const response = await axios.post(statusUrl, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('M-Pesa Status Query Failed:', error.response?.data || error.message);
        throw new Error('M-Pesa Status Query Failed');
    }
}

async function handleCallback(callbackData) {
    if (!callbackData || !callbackData.Body || !callbackData.Body.stkCallback) {
        throw new Error("Invalid callback payload format");
    }

    const { ResultCode, ResultDesc, CallbackMetadata } = callbackData.Body.stkCallback;

    if (ResultCode !== 0) {
        console.log(`M-Pesa Payment Failed/Cancelled: ${ResultDesc}`);
        return { success: false, reason: ResultDesc };
    }

    const mpesaCode = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    const amount = Number(CallbackMetadata.Item.find(i => i.Name === 'Amount')?.Value);
    const phone = CallbackMetadata.Item.find(i => i.Name === 'PhoneNumber')?.Value;

    // Log in database
    await db.query(
        "INSERT INTO mpesa_transactions (transaction_code, amount, phone, status) VALUES ($1, $2, $3, 'RECEIVED')",
        [mpesaCode, amount, String(phone)]
    );

    return {
        success: true,
        mpesaCode,
        amount,
        phone
    };
}

module.exports = {
    getAccessToken,
    initiateSTKPush,
    checkTransactionStatus,
    handleCallback
};
