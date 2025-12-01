import express, { Request, Response } from 'express';
import * as paypal from '@paypal/checkout-server-sdk';
import { Config } from '../utils/config';
import { LocalDatabase } from '../utils/local-database';
import { HttpClient } from '../utils/http-client';

const router = express.Router();

const config = new Config();

// PayPal client
const paypalEnvironment = new paypal.core.LiveEnvironment(
  config.get('PAYPAL_CLIENT_ID'),
  config.get('PAYPAL_SECRET')
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

// Database
const db = LocalDatabase.getInstance();

// HTTP client for calling the NestJS email system
const httpClient = new HttpClient(config.get('API_URL'), {
  'Content-Type': 'application/json',
  'X-AUTH-KEY': config.get('TRUSTED_CLIENT_AUTH_TOKEN'),
});

// ------------------------------------------------------
// CREATE DONATION ORDER
// ------------------------------------------------------
router.post('/donate/create', async (req: Request, res: Response) => {
  const { amount, artistName, currency } = req.body;
  const host = `https://${req.get('host')}`;

  if (!amount || !artistName) {
    return res
      .status(400)
      .json({ error: 'Amount and artistName are required.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Invalid donation amount' });
  }

  const artistSlug = artistName.toLowerCase().replace(/\s+/g, '-');

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: `Donation to ${artistName}`,
        custom_id: `donation-${artistSlug}`,
        invoice_id: `donation-${artistSlug}-${Date.now()}`,
        amount: {
          currency_code: currency,
          value: numericAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: numericAmount.toFixed(2),
            },
            discount: { currency_code: currency, value: '0.00' },
            handling: { currency_code: currency, value: '0.00' },
            insurance: { currency_code: currency, value: '0.00' },
            shipping: { currency_code: currency, value: '0.00' },
            shipping_discount: { currency_code: currency, value: '0.00' },
            tax_total: { currency_code: currency, value: '0.00' },
          },
        },
        items: [
          {
            name: `Donation to ${artistName}`,
            quantity: '1',
            unit_amount: {
              currency_code: currency,
              value: numericAmount.toFixed(2),
            },
            category: 'DIGITAL_GOODS',
          },
        ],
      },
    ],
    application_context: {
      brand_name: `${artistName}'s Donation`,
      user_action: 'PAY_NOW',
      return_url: `${host}${config.get('PAYPAL_RETURN_URL')}`,
      cancel_url: `${host}${config.get('PAYPAL_CANCEL_URL')}`,
    },
  });

  try {
    const order = await paypalClient.execute(request);
    return res.status(200).json(order.result);
  } catch (err) {
    console.error('Error creating PayPal donation order:', err);
    return res.status(500).json({ error: 'Failed to create donation order.' });
  }
});

// ------------------------------------------------------
// CAPTURE DONATION + SEND EMAIL
// ------------------------------------------------------
router.post('/donate/capture', async (req: Request, res: Response) => {
  const { orderId, message } = req.body;

  let host = req.get('host') || '';
  host = host
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  try {
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
    const captureResponse = await paypalClient.execute(captureRequest);
    const result = captureResponse.result;

    const donorEmail = result?.payer?.email_address || '';
    const donorName = `${result?.payer?.name?.given_name || ''} ${
      result?.payer?.name?.surname || ''
    }`.trim();

    const capture = result?.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = parseFloat(capture?.amount?.value || '0');
    const currency = capture?.amount?.currency_code || 'USD';

    // ----------------------------------------
    // Lookup artist based on website hostname
    // ----------------------------------------
    try {
      const artist = db.getArtistByWebsite(host);

      if (!artist) {
        throw new Error(`No artist found for website: ${host}`);
      }

      // Build donation payload
      const payload: any = {
        artist: artist.name,
        artistEmail: artist.webmail.email,
        donorName,
        donorEmail,
        amount,
        currency,
      };

      // Add message only when non-empty
      if (message && message.trim() !== '') {
        payload.message = message.trim();
      }

      // ----------------------------------------
      // Send donation notification through NestJS email API
      // ----------------------------------------
      const emailResponse = await httpClient.post(
        '/emails/donation-notification',
        payload
      );

      if (emailResponse.status >= 300) {
        console.error('[Donate] Email API error:', emailResponse.body);
      }
    } catch (err) {
      console.error(
        '[Donate] Failed to send donation notification email:',
        err
      );
    }

    return res.json(result);
  } catch (err) {
    console.error('Capture failed:', err);
    return res.status(500).json({ error: 'Capture failed' });
  }
});

export default router;
