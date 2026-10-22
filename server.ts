import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSanityClient, SanityClient } from '@sanity/client';

dotenv.config();

const PORT = 3000;

// -----------------------------------------------------------------------------
// SANITY CONFIGURATION (Primary Backend — Project 2t3zh0hq / Org oh314dkvd)
// -----------------------------------------------------------------------------
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || '2t3zh0hq';
const SANITY_ORGANIZATION_ID = process.env.SANITY_ORGANIZATION_ID || 'oh314dkvd';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || '2024-01-01';
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN || '';

const isSanityConfigured = Boolean(
  SANITY_PROJECT_ID && SANITY_DATASET && SANITY_API_TOKEN && SANITY_API_TOKEN.length > 20
);

const sanityClient: SanityClient | null = isSanityConfigured
  ? createSanityClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      token: SANITY_API_TOKEN,
      useCdn: false,
    })
  : null;

// -----------------------------------------------------------------------------
// OPTIONAL SUPABASE CONFIGURATION (Secondary / Fallback)
// -----------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'daniel-memories-private';
const FAMILY_INVITE_CODE_SECRET = process.env.FAMILY_INVITE_CODE_SECRET || 'DANIEL2026';
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || 'DANIEL2026';
const SIGNED_URL_TTL_SECONDS = Math.max(
  60,
  Math.min(3600, Number(process.env.SIGNED_URL_TTL_SECONDS || 900))
);

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_SERVICE_ROLE_KEY &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_SERVICE_ROLE_KEY.length > 20
);

const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Per-process secret used to sign short-lived verified tokens
const TOKEN_HMAC_SECRET =
  process.env.TOKEN_HMAC_SECRET ||
  crypto
    .createHash('sha256')
    .update(`daniel-secret:${SANITY_API_TOKEN || 'local'}:${ADMIN_ACCESS_CODE}`)
    .digest('hex');

interface RateRecord {
  count: number;
  resetAt: number;
}
const memoryRateLimits = new Map<string, RateRecord>();

function hashIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp =
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : '') ||
    req.socket.remoteAddress ||
    'unknown';
  return crypto.createHash('sha256').update(`${rawIp}:${TOKEN_HMAC_SECRET}`).digest('hex');
}

function checkRateLimit(
  ipHash: string,
  action: string,
  maxPerWindow: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = `${ipHash}:${action}`;
  const existing = memoryRateLimits.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= maxPerWindow) {
    return false;
  }
  existing.count += 1;
  return true;
}

function createSignedRoleToken(role: 'family' | 'admin', email = 'marie.joseph@famille-daniel.cm'): string {
  const expiresAt = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
  const payload = `${role}:${expiresAt}:${email}`;
  const sig = crypto.createHmac('sha256', TOKEN_HMAC_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

function verifySignedRoleToken(
  token: string | undefined,
  expectedRole: 'family' | 'admin'
): { valid: boolean; email?: string } {
  if (!token || !token.includes('.')) return { valid: false };
  const [encodedPayload, providedSig] = token.split('.');
  if (!encodedPayload || !providedSig) return { valid: false };
  try {
    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_HMAC_SECRET)
      .update(payload)
      .digest('hex');
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false };
    }
    const [role, expiresStr, email] = payload.split(':');
    const expiresAt = Number(expiresStr);
    if (role !== expectedRole || Number.isNaN(expiresAt) || Date.now() >= expiresAt) {
      return { valid: false };
    }
    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}

function hashFamilyCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHash('sha256').update(`daniel-family-salt:${normalized}`).digest('hex');
}

function safeCompareStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Inspects file magic bytes on the server to prevent MIME spoofing.
 */
function detectServerMagicMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Removes APP1 (EXIF/XMP/GPS) and COM comment segments from JPEG binary buffers on the server.
 */
function stripJpegExifServerSide(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }
  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // SOI FF D8
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      chunks.push(buffer.subarray(offset));
      break;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(buffer.subarray(offset));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    if (offset + 4 > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }
    const isExifOrComment = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isExifOrComment) {
      chunks.push(buffer.subarray(offset, offset + 2 + segmentLength));
    }
    offset += 2 + segmentLength;
  }

  return Buffer.concat(chunks);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
    files: 20,
  },
});

const SANITY_SETTINGS_DOC_ID = 'danielEventSettings';

interface SanityEventSettingsDoc {
  _id: string;
  _type: 'danielEventSettings';
  galleryOpen: boolean;
  submissionsOpen: boolean;
  submissionsCloseAt: string | null;
  requireFamilyCodeForGallery: boolean;
  requireFamilyCodeForUpload: boolean;
  familyCodeHash: string;
  maxFilesPerSubmission: number;
  maxFileSizeMb: number;
  retentionDays: number;
  parentsNames: string[];
  eventStart: string | null;
  eventEnd: string | null;
  timeZone: string | null;
  venueName: string;
  address: string;
  mapsUrl: string;
  dressCode: string;
  accessNotes: string;
  portraitUrl: string;
  updatedAt?: string;
}

const DEFAULT_SANITY_SETTINGS: SanityEventSettingsDoc = {
  _id: SANITY_SETTINGS_DOC_ID,
  _type: 'danielEventSettings',
  galleryOpen: true,
  submissionsOpen: true,
  submissionsCloseAt: null,
  requireFamilyCodeForGallery: false,
  requireFamilyCodeForUpload: false,
  familyCodeHash: hashFamilyCode(FAMILY_INVITE_CODE_SECRET),
  maxFilesPerSubmission: 10,
  maxFileSizeMb: 10,
  retentionDays: 365,
  parentsNames: ['Marie', 'Joseph'],
  eventStart: '2026-11-01T14:00:00+01:00',
  eventEnd: '2026-11-01T19:00:00+01:00',
  timeZone: 'Africa/Douala',
  venueName: 'Domicile de Marie et Joseph',
  address: 'Yaoundé, Simbock',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Simbock+Yaounde+Cameroun',
  dressCode: 'Élégance douce (touches de blanc et rose bienvenues)',
  accessNotes:
    'Domicile familial de Marie et Joseph à Yaoundé, quartier Simbock. Contactez-nous sur WhatsApp en cas de besoin pour le guidage.',
  portraitUrl: '/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png',
};

async function getOrSeedSanitySettings(): Promise<SanityEventSettingsDoc> {
  if (!sanityClient) return DEFAULT_SANITY_SETTINGS;
  try {
    const existing = await sanityClient.getDocument<SanityEventSettingsDoc>(SANITY_SETTINGS_DOC_ID);
    if (existing) {
      const needsPatch =
        !existing.parentsNames ||
        existing.parentsNames.length === 0 ||
        !existing.eventStart ||
        !existing.venueName ||
        existing.address !== 'Yaoundé, Simbock';

      if (needsPatch) {
        const patched = await sanityClient
          .patch(SANITY_SETTINGS_DOC_ID)
          .set({
            parentsNames:
              existing.parentsNames && existing.parentsNames.length > 0
                ? existing.parentsNames
                : ['Marie', 'Joseph'],
            eventStart: existing.eventStart || '2026-11-01T14:00:00+01:00',
            eventEnd: existing.eventEnd || '2026-11-01T19:00:00+01:00',
            timeZone: existing.timeZone || 'Africa/Douala',
            venueName: existing.venueName || 'Domicile de Marie et Joseph',
            address: 'Yaoundé, Simbock',
            mapsUrl:
              existing.mapsUrl ||
              'https://www.google.com/maps/search/?api=1&query=Simbock+Yaounde+Cameroun',
          })
          .commit<SanityEventSettingsDoc>();
        return patched;
      }
      return existing;
    }

    const created = await sanityClient.createIfNotExists<SanityEventSettingsDoc>(
      DEFAULT_SANITY_SETTINGS
    );
    return created;
  } catch (err) {
    console.error('Sanity settings fetch/seed error:', err);
    return DEFAULT_SANITY_SETTINGS;
  }
}

async function seedInitialSanityGalleryIfNeeded() {
  if (!sanityClient) return;
  try {
    const count = await sanityClient.fetch<number>(`count(*[_type == "danielPhoto"])`);
    if (count > 0) return;

    const initialPhotos = [
      {
        _id: 'daniel-initial-photo-1',
        _type: 'danielPhoto',
        submissionId: 'initial-family-seed',
        thumbnailUrl: '/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png',
        fullUrl: '/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png',
        caption: 'Tendresse maternelle autour de bébé Daniel',
        contributorName: 'Marie & Joseph',
        displayNameConsent: true,
        status: 'approved',
        fileSizeBytes: 420000,
        submittedAt: new Date().toISOString(),
      },
      {
        _id: 'daniel-initial-photo-2',
        _type: 'danielPhoto',
        submissionId: 'initial-family-seed',
        thumbnailUrl: '/assets/aistudio/Portrait_de_b_b__dans_un_cocon_rose_28a4c365.png',
        fullUrl: '/assets/aistudio/Portrait_de_b_b__dans_un_cocon_rose_28a4c365.png',
        caption: 'Doux cocon entouré de ses peluches',
        contributorName: 'Marie & Joseph',
        displayNameConsent: true,
        status: 'approved',
        fileSizeBytes: 380000,
        submittedAt: new Date(Date.now() - 60000).toISOString(),
      },
      {
        _id: 'daniel-initial-photo-3',
        _type: 'danielPhoto',
        submissionId: 'initial-family-seed',
        thumbnailUrl: '/assets/aistudio/56c735b127f9b726afd50a77fa3d44f4_150b67cd.jpg',
        fullUrl: '/assets/aistudio/56c735b127f9b726afd50a77fa3d44f4_150b67cd.jpg',
        caption: 'Premiers instants de douceur',
        contributorName: 'Marie & Joseph',
        displayNameConsent: true,
        status: 'approved',
        fileSizeBytes: 310000,
        submittedAt: new Date(Date.now() - 120000).toISOString(),
      },
    ];

    for (const doc of initialPhotos) {
      await sanityClient.createIfNotExists(doc);
    }
  } catch (err) {
    console.error('Initial Sanity gallery seed warning:', err);
  }
}

async function requireVerifiedAdmin(
  req: Request,
  res: Response
): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing administrator authorization token' });
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();

  // 1. Check Sanity / Server HMAC Admin Token
  const roleCheck = verifySignedRoleToken(token, 'admin');
  if (roleCheck.valid) {
    return {
      userId: 'parents-marie-joseph',
      email: roleCheck.email || 'Marie & Joseph (Sanity Admin)',
    };
  }

  // 2. Fallback: Check Supabase Auth token if configured
  if (supabaseAdmin) {
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (!userErr && userData?.user) {
      const { data: adminRecord } = await supabaseAdmin
        .from('admin_users')
        .select('user_id, email')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (adminRecord) {
        return { userId: adminRecord.user_id, email: adminRecord.email };
      }
    }
  }

  res.status(401).json({ error: 'Invalid or expired administrator session' });
  return null;
}

async function startServer() {
  if (sanityClient) {
    await getOrSeedSanitySettings();
    await seedInitialSanityGalleryIfNeeded();
  }

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.startsWith('/souvenirs') ||
      req.path.startsWith('/partager-des-photos') ||
      req.path.startsWith('/admin') ||
      req.path.startsWith('/api/')
    ) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // ---------------------------------------------------------------------------
  // GET /api/album/public-status
  // Returns Sanity (or Supabase) live configuration
  // ---------------------------------------------------------------------------
  app.get('/api/album/public-status', async (_req: Request, res: Response) => {
    if (sanityClient) {
      const s = await getOrSeedSanitySettings();
      const now = new Date();
      const closeAt = s.submissionsCloseAt ? new Date(s.submissionsCloseAt) : null;
      const isSubmissionsCurrentlyOpen =
        Boolean(s.submissionsOpen) && (!closeAt || closeAt > now);

      res.json({
        backendConfigured: true,
        provider: 'sanity',
        sanityProjectId: SANITY_PROJECT_ID,
        sanityOrganizationId: SANITY_ORGANIZATION_ID,
        galleryOpen: Boolean(s.galleryOpen),
        submissionsOpen: isSubmissionsCurrentlyOpen,
        submissionsCloseAt: s.submissionsCloseAt || null,
        requireFamilyCodeForGallery: Boolean(s.requireFamilyCodeForGallery),
        requireFamilyCodeForUpload: Boolean(s.requireFamilyCodeForUpload),
        maxFilesPerSubmission: s.maxFilesPerSubmission || 10,
        maxFileSizeMb: s.maxFileSizeMb || 10,
        retentionDays: s.retentionDays || 365,
        customEventDetails: {
          parentsNames: s.parentsNames || ['Marie', 'Joseph'],
          eventStart: s.eventStart || '2026-11-01T14:00:00+01:00',
          eventEnd: s.eventEnd || '2026-11-01T19:00:00+01:00',
          timeZone: s.timeZone || 'Africa/Douala',
          venueName: s.venueName || 'Domicile de Marie et Joseph',
          address: s.address || 'Quartier Simbock, Yaoundé, Cameroun',
          mapsUrl:
            s.mapsUrl ||
            'https://www.google.com/maps/search/?api=1&query=Simbock+Yaounde+Cameroun',
          dressCode: s.dressCode || '',
          accessNotes: s.accessNotes || '',
          portraitUrl: s.portraitUrl || '',
        },
      });
      return;
    }

    res.json({
      backendConfigured: false,
      galleryOpen: false,
      submissionsOpen: false,
      submissionsCloseAt: null,
      requireFamilyCodeForGallery: false,
      requireFamilyCodeForUpload: true,
      maxFilesPerSubmission: 10,
      maxFileSizeMb: 10,
      retentionDays: 365,
      customEventDetails: null,
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/album/verify-code
  // ---------------------------------------------------------------------------
  app.post('/api/album/verify-code', async (req: Request, res: Response) => {
    const ipHash = hashIp(req);
    if (!checkRateLimit(ipHash, 'verify_code', 15, 15 * 60 * 1000)) {
      res.status(429).json({ error: 'Too many attempts. Please wait a few minutes.' });
      return;
    }

    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!code) {
      res.status(400).json({ error: 'Family code is required' });
      return;
    }

    const candidateHash = hashFamilyCode(code);
    let isValid = false;

    if (sanityClient) {
      const s = await getOrSeedSanitySettings();
      if (s.familyCodeHash) {
        isValid = safeCompareStrings(s.familyCodeHash, candidateHash);
      }
    }

    if (!isValid && FAMILY_INVITE_CODE_SECRET) {
      isValid = safeCompareStrings(
        hashFamilyCode(FAMILY_INVITE_CODE_SECRET),
        candidateHash
      );
    }

    if (!isValid) {
      res.status(401).json({ valid: false });
      return;
    }

    const familyToken = createSignedRoleToken('family');
    res.json({ valid: true, familyToken });
  });

  // ---------------------------------------------------------------------------
  // POST /api/admin/login
  // Server-verified administrator login for Marie & Joseph
  // ---------------------------------------------------------------------------
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    const ipHash = hashIp(req);
    if (!checkRateLimit(ipHash, 'admin_login', 10, 15 * 60 * 1000)) {
      res.status(429).json({ error: 'Trop de tentatives. Veuillez patienter.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    const email =
      typeof req.body?.email === 'string' && req.body.email.trim()
        ? req.body.email.trim()
        : 'Marie & Joseph';

    if (!password) {
      res.status(400).json({ error: 'Code ou mot de passe requis.' });
      return;
    }

    const candidateHash = hashFamilyCode(password);
    let isValid = safeCompareStrings(hashFamilyCode(ADMIN_ACCESS_CODE), candidateHash);

    if (!isValid && sanityClient) {
      const s = await getOrSeedSanitySettings();
      if (s.familyCodeHash) {
        isValid = safeCompareStrings(s.familyCodeHash, candidateHash);
      }
    }

    if (!isValid) {
      res.status(401).json({ error: 'Code administrateur incorrect.' });
      return;
    }

    const token = createSignedRoleToken('admin', email);
    res.json({ token, email });
  });

  // ---------------------------------------------------------------------------
  // GET /api/album/photos
  // Returns approved photos from Sanity
  // ---------------------------------------------------------------------------
  app.get('/api/album/photos', async (req: Request, res: Response) => {
    if (!sanityClient) {
      res.status(503).json({ backendConfigured: false, photos: [], total: 0 });
      return;
    }

    try {
      const settings = await getOrSeedSanitySettings();
      if (!settings.galleryOpen) {
        res.status(403).json({ error: 'Gallery is not open yet', galleryOpen: false });
        return;
      }

      if (settings.requireFamilyCodeForGallery) {
        const familyToken = req.headers['x-family-token'] as string | undefined;
        if (!verifySignedRoleToken(familyToken, 'family').valid) {
          res.status(401).json({ error: 'Family code required', requireFamilyCode: true });
          return;
        }
      }

      const page = Math.max(1, Number(req.query.page || 1));
      const pageSize = Math.min(24, Math.max(1, Number(req.query.pageSize || 12)));
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const [rows, total] = await Promise.all([
        sanityClient.fetch<
          Array<{
            _id: string;
            thumbnailUrl?: string;
            fullUrl?: string;
            caption?: string;
            contributorName?: string;
            displayNameConsent?: boolean;
            width?: number;
            height?: number;
            submittedAt?: string;
          }>
        >(
          `*[_type == "danielPhoto" && status == "approved"] | order(submittedAt desc) [$start...$end] {
            _id,
            "thumbnailUrl": coalesce(thumbnailAsset.asset->url, thumbnailUrl),
            "fullUrl": coalesce(imageAsset.asset->url, fullUrl),
            caption,
            contributorName,
            displayNameConsent,
            width,
            height,
            submittedAt
          }`,
          { start, end }
        ),
        sanityClient.fetch<number>(
          `count(*[_type == "danielPhoto" && status == "approved"])`
        ),
      ]);

      const formatted = (rows || [])
        .filter((r) => r.thumbnailUrl && r.fullUrl)
        .map((r) => ({
          id: r._id,
          thumbnailUrl: r.thumbnailUrl!,
          fullUrl: r.fullUrl!,
          caption: r.caption || null,
          contributorName: r.displayNameConsent ? r.contributorName || null : null,
          width: r.width || null,
          height: r.height || null,
          submittedAt: r.submittedAt || new Date().toISOString(),
        }));

      res.json({
        photos: formatted,
        total: total || 0,
        page,
        pageSize,
      });
    } catch (err) {
      console.error('Sanity gallery fetch error:', err);
      res.status(500).json({ error: 'Failed to load gallery from Sanity' });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /api/album/upload
  // Validates files, strips EXIF/GPS, uploads assets to Sanity, creates danielPhoto docs
  // ---------------------------------------------------------------------------
  app.post(
    '/api/album/upload',
    upload.fields([
      { name: 'photos', maxCount: 10 },
      { name: 'thumbnails', maxCount: 10 },
    ]),
    async (req: Request, res: Response) => {
      if (!sanityClient) {
        res.status(503).json({
          error: 'Le stockage Sanity n’est pas encore connecté.',
        });
        return;
      }

      const ipHash = hashIp(req);
      const maxPerHour = Number(process.env.UPLOAD_RATE_LIMIT_PER_HOUR || 30);
      if (!checkRateLimit(ipHash, 'upload_photo', maxPerHour, 60 * 60 * 1000)) {
        res.status(429).json({ error: 'Upload rate limit reached. Please try again later.' });
        return;
      }

      try {
        const settings = await getOrSeedSanitySettings();
        const now = new Date();
        const closeAt = settings.submissionsCloseAt
          ? new Date(settings.submissionsCloseAt)
          : null;
        const isOpen = Boolean(settings.submissionsOpen) && (!closeAt || closeAt > now);

        if (!isOpen) {
          res.status(403).json({ error: 'Photo submissions are currently closed.' });
          return;
        }

        if (settings.requireFamilyCodeForUpload) {
          const familyToken = req.headers['x-family-token'] as string | undefined;
          if (!verifySignedRoleToken(familyToken, 'family').valid) {
            res.status(401).json({ error: 'Invalid or expired family invitation code.' });
            return;
          }
        }

        const contributorName =
          typeof req.body?.contributorName === 'string'
            ? req.body.contributorName.trim().slice(0, 80)
            : '';
        const caption =
          typeof req.body?.caption === 'string' && req.body.caption.trim().length > 0
            ? req.body.caption.trim().slice(0, 300)
            : null;
        const displayNameConsent = req.body?.displayNameConsent === 'true';
        const publicationConsent = req.body?.publicationConsent === 'true';

        if (!contributorName) {
          res.status(400).json({ error: 'Contributor name is required.' });
          return;
        }
        if (!publicationConsent) {
          res.status(400).json({ error: 'Publication consent is required.' });
          return;
        }

        const filesMap = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const photoFiles = filesMap?.photos || [];
        const thumbFiles = filesMap?.thumbnails || [];

        if (photoFiles.length === 0) {
          res.status(400).json({ error: 'No photo files received.' });
          return;
        }

        const maxAllowed = settings.maxFilesPerSubmission || 10;
        if (photoFiles.length > maxAllowed) {
          res.status(400).json({ error: `Maximum ${maxAllowed} photos per submission.` });
          return;
        }

        const submissionId = crypto.randomUUID();
        await sanityClient.create({
          _type: 'danielPhotoSubmission',
          submissionId,
          contributorName,
          displayNameConsent,
          publicationConsent: true,
          defaultCaption: caption,
          filesCount: photoFiles.length,
          createdAt: new Date().toISOString(),
        });

        const uploadedIds: string[] = [];
        const failedIndices: number[] = [];

        for (let i = 0; i < photoFiles.length; i++) {
          const mainFile = photoFiles[i];
          const thumbFile = thumbFiles[i] || mainFile;

          const detectedMime = detectServerMagicMime(mainFile.buffer);
          const detectedThumbMime = detectServerMagicMime(thumbFile.buffer);

          if (!detectedMime || !detectedThumbMime) {
            failedIndices.push(i);
            continue;
          }

          // Server-side EXIF & GPS stripping
          const cleanedMainBuffer =
            detectedMime === 'image/jpeg'
              ? stripJpegExifServerSide(mainFile.buffer)
              : mainFile.buffer;
          const cleanedThumbBuffer =
            detectedThumbMime === 'image/jpeg'
              ? stripJpegExifServerSide(thumbFile.buffer)
              : thumbFile.buffer;

          const ext =
            detectedMime === 'image/png'
              ? 'png'
              : detectedMime === 'image/webp'
              ? 'webp'
              : 'jpg';
          const fileUuid = crypto.randomUUID();

          try {
            const [mainAsset, thumbAsset] = await Promise.all([
              sanityClient.assets.upload('image', cleanedMainBuffer, {
                filename: `daniel-${fileUuid}.${ext}`,
                contentType: detectedMime,
              }),
              sanityClient.assets.upload('image', cleanedThumbBuffer, {
                filename: `daniel-${fileUuid}_thumb.jpg`,
                contentType: detectedThumbMime,
              }),
            ]);

            const createdDoc = await sanityClient.create({
              _type: 'danielPhoto',
              submissionId,
              imageAsset: {
                _type: 'image',
                asset: { _type: 'reference', _ref: mainAsset._id },
              },
              thumbnailAsset: {
                _type: 'image',
                asset: { _type: 'reference', _ref: thumbAsset._id },
              },
              caption: caption || '',
              contributorName,
              displayNameConsent,
              mimeType: detectedMime,
              fileSizeBytes: cleanedMainBuffer.length,
              exifStripped: true,
              status: 'pending',
              submittedAt: new Date().toISOString(),
            });

            uploadedIds.push(createdDoc._id);
          } catch (uploadErr) {
            console.error('Sanity asset upload error:', uploadErr);
            failedIndices.push(i);
          }
        }

        if (uploadedIds.length === 0) {
          res.status(422).json({
            error: 'No valid photos could be saved.',
            failedIndices,
          });
          return;
        }

        res.status(201).json({
          submissionId,
          uploadedCount: uploadedIds.length,
          failedIndices,
        });
      } catch (err) {
        console.error('Unexpected upload error:', err);
        res.status(500).json({ error: 'Unexpected server error during upload.' });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // ADMIN ROUTES (Connected to Sanity)
  // ---------------------------------------------------------------------------
  app.get('/api/admin/dashboard', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin || !sanityClient) return;

    try {
      const [s, rows] = await Promise.all([
        getOrSeedSanitySettings(),
        sanityClient.fetch<
          Array<{
            _id: string;
            submissionId?: string;
            thumbnailUrl?: string;
            fullUrl?: string;
            caption?: string;
            contributorName?: string;
            displayNameConsent?: boolean;
            status: 'pending' | 'approved' | 'rejected';
            fileSizeBytes?: number;
            submittedAt?: string;
            moderatedAt?: string;
          }>
        >(
          `*[_type == "danielPhoto"] | order(submittedAt desc) [0...200] {
            _id,
            submissionId,
            "thumbnailUrl": coalesce(thumbnailAsset.asset->url, thumbnailUrl),
            "fullUrl": coalesce(imageAsset.asset->url, fullUrl),
            caption,
            contributorName,
            displayNameConsent,
            status,
            fileSizeBytes,
            submittedAt,
            moderatedAt
          }`
        ),
      ]);

      res.json({
        adminEmail: admin.email,
        photos: (rows || []).map((row) => ({
          id: row._id,
          submissionId: row.submissionId || '',
          thumbnailUrl: row.thumbnailUrl || '',
          fullUrl: row.fullUrl || '',
          caption: row.caption || '',
          contributorName: row.contributorName || '',
          displayNameConsent: Boolean(row.displayNameConsent),
          status: row.status || 'pending',
          fileSizeBytes: row.fileSizeBytes || 0,
          submittedAt: row.submittedAt || new Date().toISOString(),
          moderatedAt: row.moderatedAt || null,
        })),
        settings: {
          galleryOpen: Boolean(s.galleryOpen),
          submissionsOpen: Boolean(s.submissionsOpen),
          submissionsCloseAt: s.submissionsCloseAt || '',
          requireFamilyCodeForGallery: Boolean(s.requireFamilyCodeForGallery),
          requireFamilyCodeForUpload: Boolean(s.requireFamilyCodeForUpload),
          hasFamilyCodeConfigured: Boolean(s.familyCodeHash),
          maxFilesPerSubmission: s.maxFilesPerSubmission || 10,
          maxFileSizeMb: s.maxFileSizeMb || 10,
          retentionDays: s.retentionDays || 365,
          parentsNames: s.parentsNames || ['Marie', 'Joseph'],
          eventStart: s.eventStart || '2026-11-01T14:00:00+01:00',
          eventEnd: s.eventEnd || '2026-11-01T19:00:00+01:00',
          timeZone: s.timeZone || 'Africa/Douala',
          venueName: s.venueName || 'Domicile de Marie et Joseph',
          address: s.address || 'Quartier Simbock, Yaoundé, Cameroun',
          mapsUrl:
            s.mapsUrl ||
            'https://www.google.com/maps/search/?api=1&query=Simbock+Yaounde+Cameroun',
          dressCode: s.dressCode || '',
          accessNotes: s.accessNotes || '',
          portraitUrl: s.portraitUrl || '',
        },
      });
    } catch (err) {
      console.error('Admin dashboard error:', err);
      res.status(500).json({ error: 'Unable to load admin dashboard' });
    }
  });

  app.post('/api/admin/photos/:id/moderate', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin || !sanityClient) return;

    const photoId = req.params.id;
    const status = req.body?.status;
    if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
      res.status(400).json({ error: 'Invalid moderation status' });
      return;
    }

    try {
      await sanityClient
        .patch(photoId)
        .set({
          status,
          moderatedAt: new Date().toISOString(),
        })
        .commit();
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to update photo status in Sanity' });
    }
  });

  app.patch('/api/admin/photos/:id/caption', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin || !sanityClient) return;

    const photoId = req.params.id;
    const caption =
      typeof req.body?.caption === 'string' ? req.body.caption.trim().slice(0, 300) : '';

    try {
      await sanityClient.patch(photoId).set({ caption }).commit();
      res.json({ ok: true, caption });
    } catch {
      res.status(500).json({ error: 'Failed to update caption in Sanity' });
    }
  });

  app.delete('/api/admin/photos/:id', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin || !sanityClient) return;

    const photoId = req.params.id;
    try {
      const doc = await sanityClient.getDocument<{
        _id: string;
        imageAsset?: { asset?: { _ref?: string } };
        thumbnailAsset?: { asset?: { _ref?: string } };
      }>(photoId);

      await sanityClient.delete(photoId);

      const assetRefs = [
        doc?.imageAsset?.asset?._ref,
        doc?.thumbnailAsset?.asset?._ref,
      ].filter((ref): ref is string => Boolean(ref));

      for (const ref of assetRefs) {
        await sanityClient.delete(ref).catch(() => {});
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete photo from Sanity' });
    }
  });

  app.put('/api/admin/settings', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin || !sanityClient) return;

    const body = req.body || {};
    const patchData: Record<string, unknown> = {
      galleryOpen: Boolean(body.galleryOpen),
      submissionsOpen: Boolean(body.submissionsOpen),
      submissionsCloseAt: body.submissionsCloseAt
        ? new Date(body.submissionsCloseAt).toISOString()
        : null,
      requireFamilyCodeForGallery: Boolean(body.requireFamilyCodeForGallery),
      requireFamilyCodeForUpload: Boolean(body.requireFamilyCodeForUpload),
      retentionDays: Math.max(30, Number(body.retentionDays || 365)),
      parentsNames: Array.isArray(body.parentsNames)
        ? body.parentsNames.map((n: unknown) => String(n).trim()).filter(Boolean)
        : ['Marie', 'Joseph'],
      eventStart: body.eventStart ? new Date(body.eventStart).toISOString() : null,
      eventEnd: body.eventEnd ? new Date(body.eventEnd).toISOString() : null,
      timeZone:
        typeof body.timeZone === 'string' && body.timeZone.trim()
          ? body.timeZone.trim()
          : 'Africa/Douala',
      venueName: typeof body.venueName === 'string' ? body.venueName.trim() : '',
      address: typeof body.address === 'string' ? body.address.trim() : '',
      mapsUrl: typeof body.mapsUrl === 'string' ? body.mapsUrl.trim() : '',
      dressCode: typeof body.dressCode === 'string' ? body.dressCode.trim() : '',
      accessNotes: typeof body.accessNotes === 'string' ? body.accessNotes.trim() : '',
      portraitUrl: typeof body.portraitUrl === 'string' ? body.portraitUrl.trim() : '',
      updatedAt: new Date().toISOString(),
    };

    if (typeof body.newFamilyCode === 'string' && body.newFamilyCode.trim().length > 0) {
      patchData.familyCodeHash = hashFamilyCode(body.newFamilyCode);
    }

    try {
      await getOrSeedSanitySettings();
      await sanityClient.patch(SANITY_SETTINGS_DOC_ID).set(patchData).commit();
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to save settings in Sanity' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
