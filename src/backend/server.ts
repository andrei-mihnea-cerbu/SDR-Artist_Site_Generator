import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import { Readable } from 'stream';

import paypalRouter from './routers/paypal.router';

import { SeoHelper } from './utils/seo-helper';
import { Config } from './utils/config';
import { LocalDatabase } from './utils/local-database';

dotenv.config();

const config = new Config();
const db = LocalDatabase.getInstance();

const app = express();
app.use(express.json());

// 📁 Paths and constants
const INDEX_HTML_PATH = config.get('INDEX_HTML_PATH');
const MAINTENANCE_HTML_PATH = config.get('MAINTENANCE_HTML_PATH');
const API_URL = config.get('API_URL');

// 🔒 CORS setup
function wildcardToRegex(domain: string): RegExp[] {
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseEscaped = clean.replace(/\./g, '\\.');
  return [
    new RegExp(`^https://${baseEscaped}$`, 'i'),
    new RegExp(`^https://www\\.${baseEscaped}$`, 'i'),
    new RegExp(`^https://[a-zA-Z0-9-]+\\.${baseEscaped}$`, 'i'),
    new RegExp(`^https://www\\.[a-zA-Z0-9-]+\\.${baseEscaped}$`, 'i'),
  ];
}

const corsAllowedRegex: RegExp[] = config
  .get('CORS_ALLOWED')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .flatMap(wildcardToRegex);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const match = corsAllowedRegex.find((regex) => regex.test(origin));
      if (match) {
        return callback(null, true);
      } else {
        console.error(`❌ CORS blocked: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: '*',
  })
);

app.use((_, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(compression());
app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'views'));

app.use('/assets', express.static(config.get('ASSETS_DIR')));
app.use(
  '/static',
  (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && corsAllowedRegex.some((regex) => regex.test(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    next();
  },
  express.static(config.get('STATIC_DIR'))
);

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// 🤖 Robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = `https://${req.hostname}`;
  res.type('text/plain');
  res.render('robots', { baseUrl });
});

// 💳 PayPal API routes
app.use('/api/paypal', paypalRouter);

// 🧠 Artist info endpoint
app.get('/info', async (req: Request, res: Response) => {
  let host = req.get('host') || '';
  host = host
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  if (!host) {
    res.status(400).json({ error: 'Missing host header' });
    return;
  }

  try {
    const artist = db.getArtistByWebsite(host);
    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    const socials = db.getSocials(artist.id);
    if (!socials || socials.length === 0) {
      res.status(404).json({ error: 'Artist socials not found' });
      return;
    }

    const latestReleases = db.getLatestReleases(artist.id);
    if (!latestReleases) {
      res.status(404).json({ error: 'Latest releases not found' });
      return;
    }

    res.status(200).json({ artist, socials, latestReleases });
  } catch (error) {
    console.error('❌ Failed to get artist info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/proxy-image', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("Missing 'url' parameter");

    const upstream = await fetch(url);

    if (!upstream.ok) {
      console.error(
        'Proxy fetch failed:',
        upstream.status,
        upstream.statusText
      );
      return res.status(500).send('Image fetch failed');
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Convert WHATWG stream → Node stream and pipe it
    const nodeStream = Readable.fromWeb(upstream.body as any);

    nodeStream.pipe(res);
  } catch (err) {
    console.error('❌ Proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

// 🌍 Catch-all for artist websites (SEO + content)
app.get(/.*/, async (req: Request, res: Response) => {
  let host = req.get('host') || '';

  host = host
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  const artist = db.getArtistByWebsite(host);
  if (!artist) {
    console.warn(`❌ No artist found for host: ${host}`);
    res.sendStatus(404);
    return;
  }

  if (artist.isActive === false) {
    console.warn(
      `⚠️ Artist ${artist.name} is marked as inactive. Serving maintenance page.`
    );
    res.sendStatus(503);
    return;
  }

  const artistSocials = db.getSocials(artist.id);
  if (!artistSocials || artistSocials.length === 0) {
    console.warn(`❌ No socials found for artist: ${artist.name}`);
    res.sendStatus(404);
    return;
  }

  const seo = new SeoHelper({
    siteName: artist.name,
    rootTitle: artist.name,
    defaultPageTitle: 'Welcome',
    indexHtmlPath: INDEX_HTML_PATH,
    maintenanceHtmlPath: MAINTENANCE_HTML_PATH,
    faviconUrl: artist.hasFavicon
      ? `${API_URL}/artists/${artist.id}/photo?type=favicon`
      : `/static/favicon.ico`,
    isServerDown: config.get('SERVER_MAINTENANCE_MODE') === 'true',
  });

  const url = `https://${req.get('host')}${req.originalUrl}`;

  const imageUrl = encodeURI(
    `${API_URL}/artists/${artist.id}/photo?type=avatar`
  );

  let description = `Welcome to ${artist.name}'s official website`;
  let customTitleSegment = '';

  if (req.path === '/donation') {
    const formattedTitle = 'Support Portal';
    description = `Support ${artist.name} by using the official ${formattedTitle}.`;
    customTitleSegment = formattedTitle;
  } else if (req.path !== '/') {
    const formattedTitle = seo.formatTitle(req.path.split('/')[1] || '');
    description = `Explore '${formattedTitle}' page on ${artist.name}.`;
    customTitleSegment = formattedTitle;
  }

  const html = await seo.renderHtml({
    path: req.path,
    url,
    description,
    imageUrl,
    customTitleSegment,
  });

  res.send(html);
});

// 🚀 Server startup
async function start() {
  await db.ready();

  const PORT = parseInt(config.get('PORT'));
  const HOST = config.get('HOST');

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running at http://${HOST}:${PORT}`);
  });
}

start();
