import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';

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

// 🪣 S3 Bucket Base URL
const S3_BASE_URL = config.get('S3_PUBLIC_BASE_URL');

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

    const description = db.getDescription(artist.id);
    if (!description) {
      res.status(404).json({ error: 'Artist description not found' });
      return;
    }

    const socials = db.getSocials(artist.id);
    if (!socials || socials.length === 0) {
      res.status(404).json({ error: 'Artist socials not found' });
      return;
    }

    res.status(200).json({ artist, description, socials });
  } catch (error) {
    console.error('❌ Failed to get artist info:', error);
    res.status(500).json({ error: 'Internal server error' });
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

  const artistDescription = db.getDescription(artist.id);
  if (!artistDescription) {
    console.warn(`❌ No description found for artist: ${artist.name}`);
    res.sendStatus(404);
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
    faviconUrl:
      artist.favicons.length > 0
        ? `${S3_BASE_URL}/${artist.favicons[0]}`
        : `/static/favicon.ico`,
    isServerDown: config.get('SERVER_MAINTENANCE_MODE') === 'true',
  });

  const url = `https://${req.get('host')}${req.originalUrl}`;

  // 🧠 Use S3 bucket for artist images (with fallback to local)
  const encodedPath = encodeURI(artistDescription.imageGallery[0]);
  const imageUrl = `${S3_BASE_URL}/${encodedPath}`;

  let description = `Welcome to ${artist.name}'s official website`;
  let customTitleSegment = '';

  const refMatch = req.path.match(/^\/ref\/([^/]+)\/?$/);

  if (req.path === '/donate') {
    const formattedTitle = seo.formatTitle('donate');
    description = `Support ${artist.name} by donating with PayPal. Your contribution helps us create more amazing content.`;
    customTitleSegment = `${formattedTitle} to ${artist.name}`;
  } else if (refMatch) {
    const fullPath = `https://${host}${req.path}`;
    const matchedSocial = artistSocials.find(
      (social) => social.url.toLowerCase() === fullPath.toLowerCase()
    );

    if (matchedSocial) {
      const formattedTitle = seo.formatTitle(matchedSocial.name);
      description = `Check out ${artist.name}'s ${matchedSocial.name} profile.`;
      customTitleSegment = formattedTitle;
    } else {
      description = `${artist.name} doesn't seem to have a profile by that name.`;
      customTitleSegment = 'Unknown Reference';
    }
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
