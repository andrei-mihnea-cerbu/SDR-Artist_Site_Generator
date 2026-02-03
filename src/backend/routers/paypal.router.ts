import express, { Request, Response } from 'express';
import { Config } from '../utils/config';
import { HttpClient } from '../utils/http-client';

const router = express.Router();
const config = new Config();

// HTTP client for calling the NestJS API
const httpClient = new HttpClient(config.get('API_URL'), {
  'Content-Type': 'application/json',
  'X-AUTH-KEY': config.get('TRUSTED_CLIENT_AUTH_TOKEN'),
});

// ------------------------------------------------------
// CREATE DONATION ORDER (PROXY → NEST API)
// ------------------------------------------------------
router.post('/donate/create', async (req: Request, res: Response) => {
  const { amount, artistName, currency } = req.body;

  const host = req.get('host');
  if (!host) {
    return res.status(400).json({ error: 'Missing host header' });
  }

  if (!amount || !artistName || !currency) {
    return res
      .status(400)
      .json({ error: 'Amount, artistName and currency are required.' });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Invalid donation amount' });
  }

  try {
    const response = await httpClient.post('/paypal/donate/create', {
      amount: numericAmount,
      artistName,
      currency,
      host,
    });

    return res.status(response.status).json(response.body);
  } catch (err: any) {
    console.error('[Donate/Create] API error:', err);
    return res.status(500).json({
      error: 'Failed to create donation order',
    });
  }
});

// ------------------------------------------------------
// CAPTURE DONATION (PROXY → NEST API)
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
    const response = await httpClient.post('/paypal/donate/capture', {
      orderId,
      message,
      host,
    });

    return res.status(response.status).json(response.body);
  } catch (err: any) {
    console.error('[Donate/Capture] API error:', err);
    return res.status(500).json({
      error: 'Failed to capture donation',
    });
  }
});

export default router;
