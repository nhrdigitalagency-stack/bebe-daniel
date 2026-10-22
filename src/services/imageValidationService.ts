/**
 * Service de validation d'images, détection des octets magiques (JPEG, PNG, WebP, HEIC),
 * re-encodage Canvas pour corriger l'orientation EXIF et retirer les métadonnées GPS/EXIF,
 * et génération de miniatures côté client avant transfert sécurisé.
 */

export type DetectedImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'unknown';

export interface ValidatedPhotoAsset {
  id: string;
  originalName: string;
  fingerprint: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  cleanedFile: File;
  thumbnailFile: File;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_DIMENSION_PX = 8000;
const MAX_CLEANED_DIMENSION_PX = 2400;
const THUMBNAIL_MAX_PX = 640;

export async function inspectFileMagicBytes(file: File): Promise<DetectedImageFormat> {
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 12) return 'unknown';

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  // ISO Base Media File Format (ftyp) used by HEIC / HEIF / AVIF
  if (
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70    // p
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) {
      return 'image/heic';
    }
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif')) {
    return 'image/heic';
  }

  return 'unknown';
}

export function computeFileFingerprint(file: File): string {
  return `${file.name.toLowerCase()}__${file.size}__${file.lastModified}`;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('DecodeError'));
    };
    img.src = url;
  });
}

function renderToCanvasBlob(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  outputType: 'image/jpeg' | 'image/webp',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('CanvasContextUnavailable'));
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('BlobEncodingFailed'));
          return;
        }
        resolve(blob);
      },
      outputType,
      quality
    );
  });
}

/**
 * Valide un fichier image, vérifie ses dimensions, corrige l'orientation via le décodage
 * navigateur moderne, supprime toutes les métadonnées EXIF/GPS en ré-encodant sur un Canvas propre,
 * et génère sa miniature optimisée.
 */
export async function validateAndProcessImage(
  file: File,
  maxFileSizeMb: number
): Promise<
  | { ok: true; asset: ValidatedPhotoAsset }
  | {
      ok: false;
      reason: 'heic' | 'unsupported' | 'tooLarge' | 'dimensionsTooLarge';
    }
> {
  const format = await inspectFileMagicBytes(file);

  if (format === 'image/heic') {
    return { ok: false, reason: 'heic' };
  }

  if (format === 'unknown') {
    return { ok: false, reason: 'unsupported' };
  }

  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, reason: 'tooLarge' };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImageElement(file);
  } catch {
    return { ok: false, reason: 'unsupported' };
  }

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  if (
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    naturalWidth > MAX_DIMENSION_PX ||
    naturalHeight > MAX_DIMENSION_PX
  ) {
    return { ok: false, reason: 'dimensionsTooLarge' };
  }

  // Scale down main image if larger than 2400px while preserving aspect ratio (also strips EXIF/GPS)
  const mainScale = Math.min(1, MAX_CLEANED_DIMENSION_PX / Math.max(naturalWidth, naturalHeight));
  const cleanedWidth = Math.max(1, Math.round(naturalWidth * mainScale));
  const cleanedHeight = Math.max(1, Math.round(naturalHeight * mainScale));

  // Scale down for thumbnail (max 640px)
  const thumbScale = Math.min(1, THUMBNAIL_MAX_PX / Math.max(naturalWidth, naturalHeight));
  const thumbWidth = Math.max(1, Math.round(naturalWidth * thumbScale));
  const thumbHeight = Math.max(1, Math.round(naturalHeight * thumbScale));

  const randomToken = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const cleanedBlob = await renderToCanvasBlob(img, cleanedWidth, cleanedHeight, 'image/jpeg', 0.9);
  const thumbBlob = await renderToCanvasBlob(img, thumbWidth, thumbHeight, 'image/jpeg', 0.82);

  const cleanedFile = new File([cleanedBlob], `${randomToken}.jpg`, { type: 'image/jpeg' });
  const thumbnailFile = new File([thumbBlob], `${randomToken}_thumb.jpg`, { type: 'image/jpeg' });
  const previewUrl = URL.createObjectURL(thumbBlob);

  return {
    ok: true,
    asset: {
      id: randomToken,
      originalName: file.name,
      fingerprint: computeFileFingerprint(file),
      mimeType: 'image/jpeg',
      cleanedFile,
      thumbnailFile,
      previewUrl,
      width: cleanedWidth,
      height: cleanedHeight,
      sizeBytes: cleanedFile.size,
    },
  };
}
