import { eventConfig } from '../config/eventConfig';
import i18n from '../i18n';

export type AttendanceStatus = 'yes' | 'no' | 'maybe';

export interface RsvpPayload {
  firstName: string;
  lastName?: string;
  attendance: AttendanceStatus;
  additionalAdults?: number;
  childrenCount?: number;
  dietaryPreferences?: string;
  message?: string;
}

export interface ContactPayload {
  senderName: string;
  message: string;
}

export interface PhotoRemovalPayload {
  requesterName: string;
  photoRef: string;
  reason?: string;
}

/**
 * Construit le message de confirmation de présence dans la langue active,
 * en supprimant proprement toutes les lignes facultatives vides.
 */
export function buildRsvpWhatsappMessage(payload: RsvpPayload, lng?: string): string {
  const activeLng = lng || i18n.language || eventConfig.defaultLocale;
  const t = (key: string) => i18n.t(key, { lng: activeLng });

  const attendanceLabelMap: Record<AttendanceStatus, string> = {
    yes: t('rsvp.attendanceValueYes'),
    no: t('rsvp.attendanceValueNo'),
    maybe: t('rsvp.attendanceValueMaybe'),
  };

  const lines: string[] = [
    t('rsvp.whatsappTemplate.intro'),
    '',
    `${t('rsvp.whatsappTemplate.firstName')} : ${payload.firstName.trim()}`,
  ];

  if (payload.lastName && payload.lastName.trim().length > 0) {
    lines.push(`${t('rsvp.whatsappTemplate.lastName')} : ${payload.lastName.trim()}`);
  }

  lines.push(`${t('rsvp.whatsappTemplate.attendance')} : ${attendanceLabelMap[payload.attendance]}`);

  if (payload.attendance !== 'no') {
    if (typeof payload.additionalAdults === 'number' && payload.additionalAdults >= 0) {
      lines.push(`${t('rsvp.whatsappTemplate.adults')} : ${payload.additionalAdults}`);
    }
    if (typeof payload.childrenCount === 'number' && payload.childrenCount >= 0) {
      lines.push(`${t('rsvp.whatsappTemplate.children')} : ${payload.childrenCount}`);
    }
    if (payload.dietaryPreferences && payload.dietaryPreferences.trim().length > 0) {
      lines.push(`${t('rsvp.whatsappTemplate.dietary')} : ${payload.dietaryPreferences.trim()}`);
    }
  }

  if (payload.message && payload.message.trim().length > 0) {
    lines.push(`${t('rsvp.whatsappTemplate.message')} : ${payload.message.trim()}`);
  }

  return lines.join('\n');
}

export function buildContactWhatsappMessage(payload: ContactPayload, lng?: string): string {
  const activeLng = lng || i18n.language || eventConfig.defaultLocale;
  const t = (key: string) => i18n.t(key, { lng: activeLng });

  const lines: string[] = [
    t('contact.whatsappHeader'),
    '',
    `${t('rsvp.whatsappTemplate.firstName')} : ${payload.senderName.trim()}`,
    `${t('rsvp.whatsappTemplate.message')} : ${payload.message.trim()}`,
  ];

  return lines.join('\n');
}

export function buildPhotoRemovalWhatsappMessage(payload: PhotoRemovalPayload, lng?: string): string {
  const activeLng = lng || i18n.language || eventConfig.defaultLocale;
  const t = (key: string) => i18n.t(key, { lng: activeLng });

  const lines: string[] = [
    t('privacy.removalForm.whatsappIntro'),
    '',
    `${t('rsvp.whatsappTemplate.firstName')} : ${payload.requesterName.trim()}`,
    `Réf. photo : ${payload.photoRef.trim()}`,
  ];

  if (payload.reason && payload.reason.trim().length > 0) {
    lines.push(`${t('rsvp.whatsappTemplate.message')} : ${payload.reason.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Génère l'URL officielle https://wa.me/33753049353?text={messageEncode}
 */
export function buildWhatsappUrl(message: string, phone = eventConfig.whatsappNumber): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
