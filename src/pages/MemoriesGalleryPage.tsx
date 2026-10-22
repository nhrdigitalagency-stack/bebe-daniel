import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Lock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
  RefreshCw,
  Flag,
} from 'lucide-react';
import { useEventSettings } from '../context/EventSettingsContext';
import {
  fetchApprovedGalleryPhotos,
  GalleryPhotoItem,
  verifyFamilyInvitationCode,
} from '../services/albumApiService';
import { LottieIllustration } from '../components/ui/LottieIllustration';

export const MemoriesGalleryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { albumStatus, loadingStatus } = useEventSettings();

  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [needsFamilyCode, setNeedsFamilyCode] = useState(false);

  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [codeErrorKey, setCodeErrorKey] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Set noindex meta tag while viewing private family gallery
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

  const loadGalleryPage = useCallback(
    async (targetPage: number, append = false) => {
      if (!albumStatus.backendConfigured || !albumStatus.galleryOpen) return;
      setLoadingPhotos(true);
      setLoadError(false);

      try {
        const res = await fetchApprovedGalleryPhotos(targetPage, 12);
        if (res.requireFamilyCode) {
          setNeedsFamilyCode(true);
          setLoadingPhotos(false);
          return;
        }
        setNeedsFamilyCode(false);
        setTotal(res.total);
        setPhotos((prev) => (append ? [...prev, ...res.photos] : res.photos));
      } catch {
        setLoadError(true);
      } finally {
        setLoadingPhotos(false);
      }
    },
    [albumStatus.backendConfigured, albumStatus.galleryOpen]
  );

  useEffect(() => {
    if (!loadingStatus && albumStatus.backendConfigured && albumStatus.galleryOpen) {
      loadGalleryPage(1, false);
    }
  }, [loadingStatus, albumStatus.backendConfigured, albumStatus.galleryOpen, loadGalleryPage]);

  const handleUnlockGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyCodeInput.trim()) {
      setCodeErrorKey('upload.errors.codeRequired');
      return;
    }
    setVerifyingCode(true);
    setCodeErrorKey(null);
    try {
      const result = await verifyFamilyInvitationCode(familyCodeInput.trim());
      if (!result.valid) {
        setCodeErrorKey('upload.errors.codeInvalid');
      } else {
        setNeedsFamilyCode(false);
        setPage(1);
        await loadGalleryPage(1, false);
      }
    } catch {
      setCodeErrorKey('upload.errors.codeInvalid');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % photos.length : null
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + photos.length) % photos.length : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, photos.length]);

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;
  const activeLocale = i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR';

  return (
    <main className="min-h-[75vh] pt-24 pb-16 sm:pt-28 sm:pb-20 bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Bar Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#75666E] hover:text-[#392B33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF007F]" />
            <span>{t('gallery.backHome')}</span>
          </Link>

          <Link
            to="/partager-des-photos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>{t('gallery.addPhotosCta')}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="flex justify-center">
            <LottieIllustration variant="sleepingCloud" className="w-16 h-16" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#FF007F] tracking-wide">
            {t('gallery.kicker')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('gallery.title')}
          </h1>
          <p className="text-base sm:text-lg text-[#75666E]">
            {albumStatus.galleryOpen
              ? t('gallery.afterCeremony')
              : t('gallery.beforeOpening')}
          </p>
        </div>

        {/* State 1: Backend not configured yet */}
        {!loadingStatus && !albumStatus.backendConfigured && (
          <div className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-8 sm:p-12 max-w-2xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE5F2] text-[#FF007F] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#392B33]">
              {t('gallery.backendNotConfiguredTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
              {t('gallery.backendNotConfiguredBody')}
            </p>
          </div>
        )}

        {/* State 2: Backend configured, but gallery not opened by parents yet */}
        {!loadingStatus && albumStatus.backendConfigured && !albumStatus.galleryOpen && (
          <div className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-8 sm:p-12 max-w-2xl mx-auto text-center space-y-4">
            <LottieIllustration variant="moonStars" className="w-16 h-16 mx-auto" />
            <h2 className="font-display text-2xl font-semibold text-[#392B33]">
              {t('gallery.closedNoticeTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
              {t('gallery.closedNoticeBody')}
            </p>
          </div>
        )}

        {/* State 3: Family code required */}
        {albumStatus.backendConfigured && albumStatus.galleryOpen && needsFamilyCode && (
          <form
            onSubmit={handleUnlockGallery}
            className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-8 sm:p-10 max-w-md mx-auto space-y-5"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FFE5F2] text-[#FF007F] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                {t('gallery.familyCodeTitle')}
              </h2>
              <p className="text-sm text-[#75666E]">
                {t('gallery.familyCodeDescription')}
              </p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="gallery-family-code"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('gallery.familyCodeLabel')}
              </label>
              <input
                id="gallery-family-code"
                type="password"
                value={familyCodeInput}
                onChange={(e) => {
                  setFamilyCodeInput(e.target.value);
                  if (codeErrorKey) setCodeErrorKey(null);
                }}
                placeholder={t('gallery.familyCodePlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-white text-sm text-[#392B33] focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>

            {codeErrorKey && (
              <p role="alert" className="text-xs text-[#FF007F] font-medium">
                {t(codeErrorKey)}
              </p>
            )}

            <button
              type="submit"
              disabled={verifyingCode}
              className="w-full py-3 px-5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {t('gallery.unlockGalleryCta')}
            </button>
          </form>
        )}

        {/* State 4: Gallery Open & Unlocked */}
        {albumStatus.backendConfigured && albumStatus.galleryOpen && !needsFamilyCode && (
          <div className="space-y-8">
            {loadingPhotos && photos.length === 0 ? (
              <div
                role="status"
                className="py-16 text-center text-sm text-[#75666E]"
              >
                {t('gallery.loading')}
              </div>
            ) : loadError ? (
              <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-8 text-center space-y-4 max-w-lg mx-auto">
                <p className="text-sm text-[#392B33]">{t('gallery.errorLoading')}</p>
                <button
                  type="button"
                  onClick={() => loadGalleryPage(1, false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF007F] text-white text-xs font-medium cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('gallery.retry')}</span>
                </button>
              </div>
            ) : photos.length === 0 ? (
              <div className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-10 text-center max-w-xl mx-auto space-y-4">
                <p className="text-sm sm:text-base text-[#75666E]">
                  {t('gallery.emptyApproved')}
                </p>
                <Link
                  to="/partager-des-photos"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-medium transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('gallery.addPhotosCta')}</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo, index) => (
                    <article
                      key={photo.id}
                      className="group rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] overflow-hidden flex flex-col justify-between"
                    >
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFE5F2] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF007F]"
                      >
                        <img
                          src={photo.thumbnailUrl}
                          alt={photo.caption || t('gallery.title')}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </button>

                      <div className="p-4 space-y-1.5">
                        {photo.caption && (
                          <p className="text-sm text-[#392B33] leading-snug">
                            {photo.caption}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-[#75666E]">
                          <span>
                            {photo.contributorName
                              ? t('gallery.sharedBy', { name: photo.contributorName })
                              : t('gallery.anonymousContributor')}
                          </span>
                          <span>
                            {new Intl.DateTimeFormat(activeLocale, {
                              day: 'numeric',
                              month: 'short',
                            }).format(new Date(photo.submittedAt))}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {photos.length < total && (
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      disabled={loadingPhotos}
                      onClick={() => {
                        const next = page + 1;
                        setPage(next);
                        loadGalleryPage(next, true);
                      }}
                      className="px-6 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] hover:bg-[#FFE5F2] text-sm font-medium text-[#392B33] transition-colors cursor-pointer"
                    >
                      {loadingPhotos ? t('gallery.loading') : t('gallery.loadMore')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Respectful Screen Capture & Removal Notice */}
        <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#75666E]">
          <p className="leading-relaxed max-w-3xl">
            {t('gallery.screenCaptureNotice')}
          </p>
          <Link
            to="/confidentialite"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#FFCCE5] bg-white text-[#392B33] font-medium hover:bg-[#FFE5F2] transition-colors whitespace-nowrap shrink-0"
          >
            <Flag className="w-3.5 h-3.5 text-[#FF007F]" />
            <span>{t('gallery.requestRemovalCta')}</span>
          </Link>
        </div>
      </div>

      {/* Accessible Fullscreen Lightbox */}
      {activePhoto && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('gallery.title')}
          className="fixed inset-0 z-50 bg-[#392B33]/92 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6"
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-xs sm:text-sm tabular-nums">
              {t('gallery.lightbox.counter', {
                current: lightboxIndex + 1,
                total: photos.length,
              })}
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label={t('gallery.lightbox.close')}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
                }
                aria-label={t('gallery.lightbox.previous')}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={activePhoto.fullUrl}
              alt={activePhoto.caption || t('gallery.title')}
              referrerPolicy="no-referrer"
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[75vh] max-w-full object-contain rounded-xl select-none"
            />

            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                aria-label={t('gallery.lightbox.next')}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="max-w-3xl mx-auto w-full rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
            <div className="text-center sm:text-left">
              {activePhoto.caption && (
                <p className="text-sm font-medium">{activePhoto.caption}</p>
              )}
              <p className="text-xs text-white/80">
                {activePhoto.contributorName
                  ? t('gallery.sharedBy', { name: activePhoto.contributorName })
                  : t('gallery.anonymousContributor')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const refId = activePhoto.id.slice(0, 8);
                setLightboxIndex(null);
                navigate(`/confidentialite?photoRef=${encodeURIComponent(refId)}`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t('gallery.lightbox.requestRemovalThisPhoto')}</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
