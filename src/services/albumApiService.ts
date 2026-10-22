import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isClientSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 20
);

export const supabaseBrowserClient: SupabaseClient | null = isClientSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const FAMILY_TOKEN_STORAGE_KEY = 'daniel_family_access_token';

export function getSavedFamilyToken(): string {
  try {
    return window.sessionStorage.getItem(FAMILY_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveFamilyToken(token: string) {
  try {
    window.sessionStorage.setItem(FAMILY_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export interface CustomEventDetails {
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
}

export interface PublicAlbumStatus {
  backendConfigured: boolean;
  galleryOpen: boolean;
  submissionsOpen: boolean;
  submissionsCloseAt: string | null;
  requireFamilyCodeForGallery: boolean;
  requireFamilyCodeForUpload: boolean;
  maxFilesPerSubmission: number;
  maxFileSizeMb: number;
  retentionDays: number;
  customEventDetails: CustomEventDetails | null;
}

export interface GalleryPhotoItem {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  caption: string | null;
  contributorName: string | null;
  width?: number | null;
  height?: number | null;
  submittedAt: string;
}

export async function fetchPublicAlbumStatus(): Promise<PublicAlbumStatus> {
  const response = await fetch('/api/album/public-status');
  if (!response.ok) {
    throw new Error('Failed to fetch public album status');
  }
  return response.json();
}

export async function verifyFamilyInvitationCode(
  code: string
): Promise<{ valid: boolean; familyToken?: string; rateLimited?: boolean }> {
  const response = await fetch('/api/album/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (response.status === 429) {
    return { valid: false, rateLimited: true };
  }
  if (!response.ok) {
    return { valid: false };
  }
  const data = await response.json();
  if (data.valid && data.familyToken) {
    saveFamilyToken(data.familyToken);
  }
  return data;
}

export async function fetchApprovedGalleryPhotos(
  page = 1,
  pageSize = 12
): Promise<{
  photos: GalleryPhotoItem[];
  total: number;
  requireFamilyCode?: boolean;
  galleryOpen?: boolean;
}> {
  const token = getSavedFamilyToken();
  const response = await fetch(`/api/album/photos?page=${page}&pageSize=${pageSize}`, {
    headers: token ? { 'x-family-token': token } : {},
  });

  if (response.status === 401) {
    return { photos: [], total: 0, requireFamilyCode: true, galleryOpen: true };
  }
  if (response.status === 403) {
    return { photos: [], total: 0, galleryOpen: false };
  }
  if (!response.ok) {
    throw new Error('Error loading approved photos');
  }

  const data = await response.json();
  return {
    photos: data.photos || [],
    total: data.total || 0,
    galleryOpen: true,
  };
}
