import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Config } from './config';
import { Artist } from '../interfaces/artist';
import { Description } from '../interfaces/description';
import { Shop } from '../interfaces/shop';
import { Social } from '../interfaces/social';
import { HttpClient } from './http-client';

// --- DB Row Interfaces ---
interface ArtistRow {
  id: string;
  name: string;
  type: string;
  website: string | null;
  webmail_url: string;
  webmail_email: string;
  webmail_password: string;
  logos: string;
  favicons: string;
}

interface DescriptionRow {
  id: string;
  artistId: string;
  description: string;
  imageGallery: string;
}

interface SocialRow {
  id: string;
  artistId: string;
  name: string;
  description: string;
  url: string;
}

interface LatestReleasesRow {
  artistId: string;
  youtube: string | null;
  spotify: string | null;
}

interface LatestReleasesApiDto {
  youtube?: object;
  spotify?: object;
}

export class LocalDatabase {
  private static instance: LocalDatabase;
  private db: Database.Database;
  private config: Config;
  private http: HttpClient;
  private syncIntervalMs: number;
  private syncing = false;
  private readyPromise?: Promise<void>;

  private constructor() {
    this.config = new Config();
    this.syncIntervalMs = parseInt(
      this.config.get('DATABASE_SYNC_INTERVAL_MS'),
      10
    );

    const dbPath = this.config.get('DATABASE_PATH');
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '');

    this.db = new Database(dbPath);

    this.http = new HttpClient(this.config.get('API_URL'), {
      Authorization: `Bearer ${this.config.get('TRUSTED_CLIENT_AUTH_TOKEN')}`,
    });
  }

  public static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  // --- INITIALIZATION ---
  public async ready(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = (async () => {
      console.log('[LocalDB] Initializing...');
      this.createTables();
      await this.fetchAndStoreAll();
      this.startSyncSchedule();
      console.log('[LocalDB] Ready ✓');
    })();

    return this.readyPromise;
  }

  // --- TABLE CREATION ---
  private createTables() {
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS artists (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        website TEXT,
        webmail_url TEXT,
        webmail_email TEXT,
        webmail_password TEXT,
        logos TEXT,
        favicons TEXT
      )
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS descriptions (
        id TEXT PRIMARY KEY,
        artistId TEXT,
        description TEXT,
        imageGallery TEXT
      )
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS shops (
        id TEXT PRIMARY KEY,
        artistId TEXT,
        name TEXT,
        website TEXT,
        imageGallery TEXT,
        shopFeed TEXT
      )
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS socials (
        id TEXT PRIMARY KEY,
        artistId TEXT,
        name TEXT,
        description TEXT,
        url TEXT
      )
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS latest_releases (
        artistId TEXT PRIMARY KEY,
        youtube TEXT,
        spotify TEXT
      )
    `
      )
      .run();
  }

  // --- MAIN SYNC ---
  private async fetchAndStoreAll() {
    console.log('[LocalDB] Sync started…');

    try {
      const artistsRes = await this.http.get<Artist[]>('/artists');
      const artists = artistsRes.status === 200 ? artistsRes.body : [];

      if (!artists.length) return;

      this.db.prepare('DELETE FROM artists').run();
      this.db.prepare('DELETE FROM descriptions').run();
      this.db.prepare('DELETE FROM socials').run();
      this.db.prepare('DELETE FROM shops').run();
      this.db.prepare('DELETE FROM latest_releases').run();

      for (const artist of artists) {
        this.upsertArtist(artist);

        const [descRes, socialsRes, shopRes, latestRes] = await Promise.all([
          this.http.get<Description>(`/descriptions?artistId=${artist.id}`),
          this.http.get<Social[]>(`/socials?artistId=${artist.id}`),
          this.http.get<Shop>(`/shops?artistId=${artist.id}`),
          this.http.get<LatestReleasesApiDto>(
            `/music-platforms?latest=true&artistId=${artist.id}`
          ),
        ]);

        const tx = this.db.transaction(() => {
          if (descRes.status === 200 && descRes.body)
            this.upsertDescription(descRes.body);

          for (const s of socialsRes.body || [])
            this.upsertSocial(s, artist.id);

          if (shopRes.status === 200 && shopRes.body)
            this.upsertShop(shopRes.body);

          if (latestRes.status === 200 && latestRes.body)
            this.upsertLatestReleases(artist.id, latestRes.body);
        });

        tx();
      }

      console.log('[LocalDB] Sync completed ✓');
    } catch (err: any) {
      console.warn('[LocalDB] Sync failed:', err.message);
    }
  }

  // --- SYNC SCHEDULER ---
  private startSyncSchedule() {
    const run = async () => {
      if (this.syncing) return;
      this.syncing = true;
      await this.fetchAndStoreAll();
      this.syncing = false;
      setTimeout(run, this.syncIntervalMs);
    };
    setTimeout(run, this.syncIntervalMs);
  }

  // --- UPSERT HELPERS ---
  private upsertArtist(artist: Artist) {
    this.db
      .prepare(
        `
      INSERT INTO artists (
        id, name, type, website,
        webmail_url, webmail_email, webmail_password,
        logos, favicons
      )
      VALUES (
        @id, @name, @type, @website,
        @webmail_url, @webmail_email, @webmail_password,
        @logos, @favicons
      )
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        type=excluded.type,
        website=excluded.website,
        webmail_url=excluded.webmail_url,
        webmail_email=excluded.webmail_email,
        webmail_password=excluded.webmail_password,
        logos=excluded.logos,
        favicons=excluded.favicons
    `
      )
      .run({
        ...artist,
        website: artist.website ?? null,
        webmail_url: artist.webmail?.url || '',
        webmail_email: artist.webmail?.email || '',
        webmail_password: artist.webmail?.password || '',
        logos: JSON.stringify(artist.logos),
        favicons: JSON.stringify(artist.favicons),
      });
  }

  private upsertDescription(desc: Description) {
    this.db
      .prepare(
        `
      INSERT INTO descriptions (id, artistId, description, imageGallery)
      VALUES (@id, @artistId, @description, @imageGallery)
      ON CONFLICT(id) DO UPDATE SET
        description=excluded.description,
        imageGallery=excluded.imageGallery
    `
      )
      .run({
        ...desc,
        imageGallery: JSON.stringify(desc.imageGallery),
      });
  }

  private upsertShop(shop: Shop) {
    this.db
      .prepare(
        `
      INSERT INTO shops (id, artistId, name, website, imageGallery, shopFeed)
      VALUES (@id, @artistId, @name, @website, @imageGallery, @shopFeed)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        website=excluded.website,
        imageGallery=excluded.imageGallery,
        shopFeed=excluded.shopFeed
    `
      )
      .run({
        ...shop,
        imageGallery: JSON.stringify(shop.imageGallery),
      });
  }

  private upsertSocial(social: Social, artistId: string) {
    this.db
      .prepare(
        `
      INSERT INTO socials (id, artistId, name, description, url)
      VALUES (@id, @artistId, @name, @description, @url)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        description=excluded.description,
        url=excluded.url
    `
      )
      .run({ ...social, artistId });
  }

  private upsertLatestReleases(artistId: string, latest: LatestReleasesApiDto) {
    this.db
      .prepare(
        `
      INSERT INTO latest_releases (artistId, youtube, spotify)
      VALUES (@artistId, @youtube, @spotify)
      ON CONFLICT(artistId) DO UPDATE SET
        youtube=excluded.youtube,
        spotify=excluded.spotify
    `
      )
      .run({
        artistId,
        youtube:
          latest.youtube !== undefined ? JSON.stringify(latest.youtube) : null,
        spotify:
          latest.spotify !== undefined ? JSON.stringify(latest.spotify) : null,
      });
  }

  // --- QUERY HELPERS ---
  public getArtistByWebsite(host: string): Artist | null {
    const clean = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const row = this.db
      .prepare(
        `
      SELECT * FROM artists
      WHERE website IS NOT NULL
      AND website LIKE ?
    `
      )
      .get(`%${clean}%`) as ArtistRow | undefined;

    if (!row) return null;

    const artist: Artist = {
      id: row.id,
      name: row.name,
      type: row.type as any,
      webmail: {
        url: row.webmail_url,
        email: row.webmail_email,
        password: row.webmail_password,
      },
      logos: JSON.parse(row.logos || '[]'),
      favicons: JSON.parse(row.favicons || '[]'),
    };

    if (row.website) artist.website = row.website;

    return artist;
  }

  public getDescription(artistId: string): Description | null {
    const row = this.db
      .prepare(`SELECT * FROM descriptions WHERE artistId = ?`)
      .get(artistId) as DescriptionRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      artistId: row.artistId,
      description: row.description,
      imageGallery: JSON.parse(row.imageGallery || '[]'),
    };
  }

  public getSocials(artistId: string): Social[] {
    const rows = this.db
      .prepare(`SELECT * FROM socials WHERE artistId = ?`)
      .all(artistId) as SocialRow[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      url: r.url,
    }));
  }

  public getLatestReleases(artistId: string) {
    const row = this.db
      .prepare(`SELECT * FROM latest_releases WHERE artistId = ?`)
      .get(artistId) as LatestReleasesRow | undefined;

    if (!row) return null;

    return {
      youtube: row.youtube ? JSON.parse(row.youtube) : null,
      spotify: row.spotify ? JSON.parse(row.spotify) : null,
    };
  }

  public getAllArtists(): Artist[] {
    const rows = this.db.prepare(`SELECT * FROM artists`).all() as ArtistRow[];

    return rows.map((row) => {
      const artist: Artist = {
        id: row.id,
        name: row.name,
        type: row.type as any,
        webmail: {
          url: row.webmail_url,
          email: row.webmail_email,
          password: row.webmail_password,
        },
        logos: JSON.parse(row.logos || '[]'),
        favicons: JSON.parse(row.favicons || '[]'),
      };

      if (row.website) artist.website = row.website;

      return artist;
    });
  }
}
