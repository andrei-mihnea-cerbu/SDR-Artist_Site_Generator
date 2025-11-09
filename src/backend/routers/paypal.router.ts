import express, { Request, Response } from 'express';
import * as paypal from '@paypal/checkout-server-sdk';
import { Config } from '../utils/config';
import { EmailService } from '../utils/email-service';
import { LocalDatabase } from '../utils/local-database';

const router = express.Router();

const config = new Config();
const paypalEnvironment = new paypal.core.LiveEnvironment(
  config.get('PAYPAL_CLIENT_ID'),
  config.get('PAYPAL_SECRET')
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);
const db = LocalDatabase.getInstance();

router.post('/donate/create', async (req: Request, res: Response) => {
  const { amount, artistName, currency } = req.body;
  const host = `https://${req.get('host')}`;

  if (!amount || !artistName) {
    res.status(400).json({ error: 'Amount and artistName are required.' });
    return;
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    res.status(400).json({ error: 'Invalid donation amount' });
    return;
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
    res.status(200).json(order.result);
  } catch (err) {
    console.error('Error creating PayPal donation order:', err);
    res.status(500).json({ error: 'Failed to create donation order.' });
  }
});

router.post('/donate/capture', async (req: Request, res: Response) => {
  const { orderId, message } = req.body; // ✅ message included

  let host = req.get('host') || '';
  host = host
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  if (!orderId) {
    res.status(400).json({ error: 'Missing orderId' });
    return;
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

    try {
      const artist = db.getArtistByWebsite(host);

      if (!artist) {
        throw new Error(`No artist found for website: ${host}`);
      }

      const emailService = new EmailService();

      await emailService.notifyDonation(
        artist,
        donorName,
        donorEmail,
        amount,
        currency,
        message
      );
    } catch (err) {
      console.error('[Donate] Failed to send donation info email:', err);
    } finally {
      res.json(result);
      return;
    }
  } catch (err) {
    console.error('Capture failed:', err);
    res.status(500).json({ error: 'Capture failed' });
  }
});

export default router;
