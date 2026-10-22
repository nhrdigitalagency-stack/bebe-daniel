import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Check,
  X,
  Trash2,
  Edit3,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useEventSettings } from '../context/EventSettingsContext';
import { AVAILABLE_STUDIO_PORTRAITS } from '../config/eventConfig';

const ADMIN_TOKEN_STORAGE_KEY = 'daniel_sanity_admin_token';

interface AdminPhotoRow {
  id: string;
  submissionId: string;
  thumbnailUrl: string;
  fullUrl: string;
  caption: string;
  contributorName: string;
  displayNameConsent: boolean;
  status: 'pending' | 'approved' | 'rejected';
  fileSizeBytes: number;
  submittedAt: string;
}

interface AdminSettingsState {
  galleryOpen: boolean;
  submissionsOpen: boolean;
  submissionsCloseAt: string;
  requireFamilyCodeForGallery: boolean;
  requireFamilyCodeForUpload: boolean;
  hasFamilyCodeConfigured: boolean;
  retentionDays: number;
  newFamilyCode: string;
  parentsNamesInput: string;
  eventStart: string;
  eventEnd: string;
  timeZone: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  dressCode: string;
  accessNotes: string;
  portraitUrl: string;
}

export const AdminPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { albumStatus, refreshStatus } = useEventSettings();

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState('Marie & Joseph');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'pending' | 'approved' | 'rejected' | 'settings'
  >('pending');
  const [photos, setPhotos] = useState<AdminPhotoRow[]>([]);
  const [settings, setSettings] = useState<AdminSettingsState>({
    galleryOpen: true,
    submissionsOpen: true,
    submissionsCloseAt: '',
    requireFamilyCodeForGallery: false,
    requireFamilyCodeForUpload: false,
    hasFamilyCodeConfigured: true,
    retentionDays: 365,
    newFamilyCode: '',
    parentsNamesInput: 'Marie, Joseph',
    eventStart: '2026-11-01T14:00',
    eventEnd: '2026-11-01T19:00',
    timeZone: 'Africa/Douala',
    venueName: 'Domicile de Marie et Joseph',
    address: 'Quartier Simbock, Yaoundé, Cameroun',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Simbock+Yaounde+Cameroun',
    dressCode: 'Élégance douce (touches de blanc et rose bienvenues)',
    accessNotes: '',
    portraitUrl: '/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png',
  });

  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedBanner, setSettingsSavedBanner] = useState(false);

  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const created = !robotsMeta;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');
    return () => {
      if (created && robotsMeta?.parentNode) {
        robotsMeta.parentNode.removeChild(robotsMeta);
      }
    };
  }, []);

  const loadDashboard = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAccessToken(null);
          try {
            window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          } catch {
            // Ignore
          }
          setAuthError('Session expirée ou non autorisée.');
        }
        return;
      }
      const data = await res.json();
      setPhotos(data.photos || []);
      if (data.settings) {
        const s = data.settings;
        setSettings({
          galleryOpen: Boolean(s.galleryOpen),
          submissionsOpen: Boolean(s.submissionsOpen),
          submissionsCloseAt: s.submissionsCloseAt
            ? s.submissionsCloseAt.slice(0, 16)
            : '',
          requireFamilyCodeForGallery: Boolean(s.requireFamilyCodeForGallery),
          requireFamilyCodeForUpload: Boolean(s.requireFamilyCodeForUpload),
          hasFamilyCodeConfigured: Boolean(s.hasFamilyCodeConfigured),
          retentionDays: s.retentionDays || 365,
          newFamilyCode: '',
          parentsNamesInput: Array.isArray(s.parentsNames)
            ? s.parentsNames.join(', ')
            : 'Marie, Joseph',
          eventStart: s.eventStart ? s.eventStart.slice(0, 16) : '2026-11-01T14:00',
          eventEnd: s.eventEnd ? s.eventEnd.slice(0, 16) : '2026-11-01T19:00',
          timeZone: s.timeZone || 'Africa/Douala',
          venueName: s.venueName || 'Domicile de Marie et Joseph',
          address: s.address || 'Quartier Simbock, Yaoundé, Cameroun',
          mapsUrl: s.mapsUrl || '',
          dressCode: s.dressCode || '',
          accessNotes: s.accessNotes || '',
          portraitUrl: s.portraitUrl || '',
        });
      }
    } catch {
      // Ignore network error
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadDashboard(accessToken);
    }
  }, [accessToken, loadDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Identifiants invalides');
      } else {
        try {
          window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, data.token);
        } catch {
          // Ignore
        }
        setAccessToken(data.token);
        setPassword('');
      }
    } catch {
      setAuthError('Erreur de connexion au serveur');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setAccessToken(null);
  };

  const handleModerate = async (
    photoId: string,
    status: 'approved' | 'rejected'
  ) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/photos/${photoId}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, status } : p))
      );
    }
  };

  const handleSaveCaption = async (photoId: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/photos/${photoId}/caption`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ caption: captionDraft }),
    });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, caption: captionDraft.trim() } : p
        )
      );
      setEditingCaptionId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/admin/photos/${photoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setConfirmDeleteId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSavingSettings(true);
    setSettingsSavedBanner(false);

    const parentsNames = settings.parentsNamesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        galleryOpen: settings.galleryOpen,
        submissionsOpen: settings.submissionsOpen,
        submissionsCloseAt: settings.submissionsCloseAt || null,
        requireFamilyCodeForGallery: settings.requireFamilyCodeForGallery,
        requireFamilyCodeForUpload: settings.requireFamilyCodeForUpload,
        retentionDays: settings.retentionDays,
        newFamilyCode: settings.newFamilyCode,
        parentsNames,
        eventStart: settings.eventStart || null,
        eventEnd: settings.eventEnd || null,
        timeZone: settings.timeZone,
        venueName: settings.venueName,
        address: settings.address,
        mapsUrl: settings.mapsUrl,
        dressCode: settings.dressCode,
        accessNotes: settings.accessNotes,
        portraitUrl: settings.portraitUrl,
      }),
    });

    setSavingSettings(false);
    if (res.ok) {
      setSettings((prev) => ({ ...prev, newFamilyCode: '' }));
      setSettingsSavedBanner(true);
      await refreshStatus();
      setTimeout(() => setSettingsSavedBanner(false), 4000);
    }
  };

  const pendingPhotos = photos.filter((p) => p.status === 'pending');
  const approvedPhotos = photos.filter((p) => p.status === 'approved');
  const rejectedPhotos = photos.filter((p) => p.status === 'rejected');

  const isEn = i18n.language?.startsWith('en');

  return (
    <main className="min-h-[75vh] pt-24 pb-16 sm:pt-28 sm:pb-20 bg-[#FFF5FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFCCE5] pb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#FF007F] tracking-wide">
              {t('admin.kicker')} · Sanity (2t3zh0hq)
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]">
              {t('admin.title')}
            </h1>
            <p className="text-sm text-[#75666E]">{t('admin.subtitle')}</p>
          </div>

          {accessToken && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-white hover:bg-[#FFE5F2] text-xs font-medium text-[#392B33] cursor-pointer self-start"
            >
              <LogOut className="w-4 h-4 text-[#FF007F]" />
              <span>{t('admin.logoutButton')}</span>
            </button>
          )}
        </div>

        {/* If Backend is not configured */}
        {!albumStatus.backendConfigured && (
          <div className="rounded-3xl bg-white border border-[#FFCCE5] p-8 max-w-2xl mx-auto space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-[#FFE5F2] text-[#FF007F] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#392B33]">
              {t('admin.notConfiguredTitle')}
            </h2>
            <p className="text-sm text-[#75666E] leading-relaxed">
              {t('admin.notConfiguredBody')}
            </p>
          </div>
        )}

        {/* Login Form for Marie & Joseph */}
        {albumStatus.backendConfigured && !accessToken && (
          <form
            onSubmit={handleLogin}
            className="rounded-3xl bg-white border border-[#FFCCE5] p-8 max-w-md mx-auto space-y-5 shadow-sm"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFE5F2] text-[#FF007F] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                {t('admin.loginTitle')}
              </h2>
              <p className="text-xs text-[#75666E]">
                {t('admin.loginSubtitle')} (Code initial : DANIEL2026)
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-[#392B33]"
              >
                Parents
              </label>
              <input
                id="admin-email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm text-[#392B33] focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('admin.passwordLabel')}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="DANIEL2026"
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm text-[#392B33] focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>

            {authError && (
              <div
                role="alert"
                className="rounded-xl bg-[#FFE5F2] p-3 flex items-center gap-2 text-xs text-[#392B33]"
              >
                <AlertCircle className="w-4 h-4 text-[#FF007F] shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {authLoading ? t('admin.loggingIn') : t('admin.loginButton')}
            </button>
          </form>
        )}

        {/* Authenticated Admin Workspace */}
        {accessToken && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#FFCCE5]">
              {(
                [
                  {
                    id: 'pending',
                    label: t('admin.tabs.pending', { count: pendingPhotos.length }),
                  },
                  {
                    id: 'approved',
                    label: t('admin.tabs.approved', { count: approvedPhotos.length }),
                  },
                  {
                    id: 'rejected',
                    label: t('admin.tabs.rejected', { count: rejectedPhotos.length }),
                  },
                  { id: 'settings', label: t('admin.tabs.settings') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[#FF007F] text-white'
                      : 'text-[#75666E] hover:text-[#392B33]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Moderation Grid */}
            {activeTab !== 'settings' && (
              <div>
                {(() => {
                  const list =
                    activeTab === 'pending'
                      ? pendingPhotos
                      : activeTab === 'approved'
                      ? approvedPhotos
                      : rejectedPhotos;

                  if (list.length === 0) {
                    return (
                      <div className="rounded-2xl bg-white border border-[#FFCCE5] p-10 text-center text-sm text-[#75666E]">
                        {t('admin.emptyState')}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {list.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-2xl bg-white border border-[#FFCCE5] overflow-hidden flex flex-col justify-between"
                        >
                          <div className="aspect-[4/3] bg-[#FFE5F2]">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.caption || item.contributorName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="text-xs text-[#75666E] flex items-center justify-between">
                              <span className="font-semibold text-[#392B33]">
                                {item.contributorName}
                              </span>
                              <span>
                                {Math.round(item.fileSizeBytes / 1024)} Ko
                              </span>
                            </div>

                            {editingCaptionId === item.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={captionDraft}
                                  onChange={(e) => setCaptionDraft(e.target.value)}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#FFCCE5] text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveCaption(item.id)}
                                  className="px-3 py-1.5 rounded-lg bg-[#FF007F] text-white text-xs font-medium cursor-pointer"
                                >
                                  {t('admin.actions.saveCaption')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-[#392B33]">
                                  {item.caption || '—'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCaptionId(item.id);
                                    setCaptionDraft(item.caption || '');
                                  }}
                                  aria-label={t('admin.actions.editCaption')}
                                  className="p-1 text-[#75666E] hover:text-[#392B33] cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <div className="pt-2 border-t border-[#FFCCE5] flex flex-wrap items-center gap-2">
                              {item.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleModerate(item.id, 'approved')}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF007F] text-white text-xs font-medium cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{t('admin.actions.approve')}</span>
                                </button>
                              )}

                              {item.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleModerate(item.id, 'rejected')}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] text-xs font-medium cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>{t('admin.actions.reject')}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                aria-label={t('admin.actions.delete')}
                                className="p-2 rounded-xl border border-[#FFCCE5] text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Settings & Ceremony Customization Tab */}
            {activeTab === 'settings' && (
              <form
                onSubmit={handleSaveSettings}
                className="rounded-3xl bg-white border border-[#FFCCE5] p-6 sm:p-10 space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                    {t('admin.settings.albumStatusTitle')}
                  </h2>

                  <label className="flex items-center gap-3 text-sm text-[#392B33] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.galleryOpen}
                      onChange={(e) =>
                        setSettings({ ...settings, galleryOpen: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#FF007F]"
                    />
                    <span>{t('admin.settings.galleryOpenLabel')}</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#392B33] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.submissionsOpen}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          submissionsOpen: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#FF007F]"
                    />
                    <span>{t('admin.settings.submissionsOpenLabel')}</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#392B33] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireFamilyCodeForGallery}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          requireFamilyCodeForGallery: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#FF007F]"
                    />
                    <span>{t('admin.settings.requireCodeGalleryLabel')}</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#392B33] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireFamilyCodeForUpload}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          requireFamilyCodeForUpload: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#FF007F]"
                    />
                    <span>{t('admin.settings.requireCodeUploadLabel')}</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.closeDateLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.submissionsCloseAt}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            submissionsCloseAt: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.retentionDaysLabel')}
                      </label>
                      <input
                        type="number"
                        min={30}
                        value={settings.retentionDays}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            retentionDays: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-[#FFCCE5]">
                  <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                    {t('admin.settings.familyCodeSectionTitle')}
                  </h2>
                  <div className="space-y-2 max-w-md">
                    <label className="block text-sm font-medium text-[#392B33]">
                      {t('admin.settings.newFamilyCodeLabel')}
                    </label>
                    <input
                      type="password"
                      value={settings.newFamilyCode}
                      onChange={(e) =>
                        setSettings({ ...settings, newFamilyCode: e.target.value })
                      }
                      placeholder={t('admin.settings.newFamilyCodePlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-5 pt-6 border-t border-[#FFCCE5]">
                  <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                    {t('admin.settings.eventDetailsSectionTitle')}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.parentsNamesLabel')}
                      </label>
                      <input
                        type="text"
                        value={settings.parentsNamesInput}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            parentsNamesInput: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.timeZoneLabel')}
                      </label>
                      <input
                        type="text"
                        value={settings.timeZone}
                        onChange={(e) =>
                          setSettings({ ...settings, timeZone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.eventStartLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.eventStart}
                        onChange={(e) =>
                          setSettings({ ...settings, eventStart: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.eventEndLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.eventEnd}
                        onChange={(e) =>
                          setSettings({ ...settings, eventEnd: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.venueNameLabel')}
                      </label>
                      <input
                        type="text"
                        value={settings.venueName}
                        onChange={(e) =>
                          setSettings({ ...settings, venueName: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.addressLabel')}
                      </label>
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) =>
                          setSettings({ ...settings, address: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.mapsUrlLabel')}
                      </label>
                      <input
                        type="url"
                        value={settings.mapsUrl}
                        onChange={(e) =>
                          setSettings({ ...settings, mapsUrl: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#392B33]">
                        {t('admin.settings.dressCodeLabel')}
                      </label>
                      <input
                        type="text"
                        value={settings.dressCode}
                        onChange={(e) =>
                          setSettings({ ...settings, dressCode: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                      />
                    </div>
                  </div>

                  {/* Hero Portrait Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#392B33]">
                      {t('admin.settings.portraitUrlLabel')}
                    </label>
                    <div className="flex flex-wrap gap-2 pb-2">
                      {AVAILABLE_STUDIO_PORTRAITS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setSettings({ ...settings, portraitUrl: preset.url })
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                            settings.portraitUrl === preset.url
                              ? 'bg-[#FFE5F2] border-[#FF007F] text-[#392B33]'
                              : 'bg-[#FFF5FA] border-[#FFCCE5] text-[#75666E]'
                          }`}
                        >
                          <span>{isEn ? preset.labelEn : preset.labelFr}</span>
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={settings.portraitUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, portraitUrl: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm"
                    />
                  </div>
                </div>

                {settingsSavedBanner && (
                  <div
                    role="status"
                    className="rounded-xl bg-[#FFE5F2] p-3.5 text-sm font-medium text-[#392B33]"
                  >
                    {t('admin.settings.settingsSaved')}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-3 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {savingSettings
                    ? t('admin.settings.savingSettings')
                    : t('admin.settings.saveSettingsButton')}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Permanent Photo Deletion */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#392B33]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="rounded-2xl bg-white border border-[#FFCCE5] p-6 max-w-md w-full space-y-4 shadow-lg">
            <h3 className="font-display text-2xl font-semibold text-[#392B33]">
              {t('admin.actions.confirmDeleteTitle')}
            </h3>
            <p className="text-sm text-[#75666E]">
              {t('admin.actions.confirmDeleteBody')}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-[#FFCCE5] text-sm font-medium text-[#392B33] cursor-pointer"
              >
                {t('admin.actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeletePhoto(confirmDeleteId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium cursor-pointer"
              >
                {t('admin.actions.confirmDeleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
