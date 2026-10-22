import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { useEventSettings } from '../context/EventSettingsContext';
import {
  ValidatedPhotoAsset,
  validateAndProcessImage,
  computeFileFingerprint,
} from '../services/imageValidationService';
import {
  getSavedFamilyToken,
  verifyFamilyInvitationCode,
} from '../services/albumApiService';
import { LottieIllustration } from '../components/ui/LottieIllustration';

type FileUploadState = 'ready' | 'uploading' | 'success' | 'error';

interface UploadQueueItem {
  asset: ValidatedPhotoAsset;
  status: FileUploadState;
}

export const SharePhotosPage: React.FC = () => {
  const { t } = useTranslation();
  const { config, albumStatus, loadingStatus } = useEventSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [familyCode, setFamilyCode] = useState('');
  const [codeVerified, setCodeVerified] = useState<boolean>(() =>
    Boolean(getSavedFamilyToken())
  );
  const [verifyingCode, setVerifyingCode] = useState(false);

  const [contributorName, setContributorName] = useState('');
  const [caption, setCaption] = useState('');
  const [displayNameConsent, setDisplayNameConsent] = useState(true);
  const [publicationConsent, setPublicationConsent] = useState(false);

  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [allSucceeded, setAllSucceeded] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const maxFiles = albumStatus.maxFilesPerSubmission || config.uploadLimits.maxFilesPerSubmission;
  const maxSizeMb = albumStatus.maxFileSizeMb || config.uploadLimits.maxFileSizeMb;

  // Add noindex meta directive on upload page
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

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => URL.revokeObjectURL(item.asset.previewUrl));
    };
  }, [queue]);

  const handleVerifyCode = async () => {
    if (!familyCode.trim()) {
      setErrorBanner(t('upload.errors.codeRequired'));
      return;
    }
    setVerifyingCode(true);
    setErrorBanner(null);
    try {
      const res = await verifyFamilyInvitationCode(familyCode.trim());
      if (res.valid) {
        setCodeVerified(true);
      } else {
        setErrorBanner(t('upload.errors.codeInvalid'));
      }
    } catch {
      setErrorBanner(t('upload.errors.codeInvalid'));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleIncomingFiles = async (fileList: FileList | File[]) => {
    setErrorBanner(null);
    setAllSucceeded(false);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    if (queue.length + incoming.length > maxFiles) {
      setErrorBanner(t('upload.errors.tooManyFiles', { max: maxFiles }));
      return;
    }

    setProcessingFiles(true);
    const existingFingerprints = new Set(queue.map((q) => q.asset.fingerprint));
    const newItems: UploadQueueItem[] = [];

    for (const rawFile of incoming) {
      const fp = computeFileFingerprint(rawFile);
      if (existingFingerprints.has(fp)) {
        setErrorBanner(t('upload.errors.duplicateFile', { name: rawFile.name }));
        continue;
      }

      const validation = await validateAndProcessImage(rawFile, maxSizeMb);
      if (!validation.ok) {
        if (validation.reason === 'heic') {
          setErrorBanner(t('upload.errors.heicRejected', { name: rawFile.name }));
        } else if (validation.reason === 'tooLarge') {
          setErrorBanner(
            t('upload.errors.fileTooLarge', { name: rawFile.name, max: maxSizeMb })
          );
        } else if (validation.reason === 'dimensionsTooLarge') {
          setErrorBanner(
            t('upload.errors.imageDimensionsTooLarge', { name: rawFile.name })
          );
        } else {
          setErrorBanner(
            t('upload.errors.unsupportedFormat', { name: rawFile.name })
          );
        }
        continue;
      }

      existingFingerprints.add(fp);
      newItems.push({ asset: validation.asset, status: 'ready' });
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
    }
    setProcessingFiles(false);
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((i) => i.asset.id === id);
      if (target) URL.revokeObjectURL(target.asset.previewUrl);
      return prev.filter((i) => i.asset.id !== id);
    });
  };

  const executeUpload = async (itemsToUpload: UploadQueueItem[]) => {
    if (!albumStatus.backendConfigured) {
      setErrorBanner(t('upload.errors.serverNotConfigured'));
      return;
    }
    if (!contributorName.trim()) {
      setErrorBanner(t('upload.errors.nameRequired'));
      return;
    }
    if (!publicationConsent) {
      setErrorBanner(t('upload.errors.consentRequired'));
      return;
    }
    if (itemsToUpload.length === 0) {
      setErrorBanner(t('upload.errors.noFiles'));
      return;
    }

    // Verify family code first if required and not yet verified
    let token = getSavedFamilyToken();
    if (albumStatus.requireFamilyCodeForUpload && !token) {
      if (!familyCode.trim()) {
        setErrorBanner(t('upload.errors.codeRequired'));
        return;
      }
      const verified = await verifyFamilyInvitationCode(familyCode.trim());
      if (!verified.valid || !verified.familyToken) {
        setErrorBanner(t('upload.errors.codeInvalid'));
        return;
      }
      token = verified.familyToken;
      setCodeVerified(true);
    }

    setSubmitting(true);
    setErrorBanner(null);
    setFailedCount(0);

    // Mark target items as uploading
    const targetIds = new Set(itemsToUpload.map((i) => i.asset.id));
    setQueue((prev) =>
      prev.map((item) =>
        targetIds.has(item.asset.id) ? { ...item, status: 'uploading' } : item
      )
    );

    const formData = new FormData();
    formData.append('contributorName', contributorName.trim());
    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }
    formData.append('displayNameConsent', String(displayNameConsent));
    formData.append('publicationConsent', String(publicationConsent));

    itemsToUpload.forEach((item) => {
      formData.append('photos', item.asset.cleanedFile);
      formData.append('thumbnails', item.asset.thumbnailFile);
    });

    try {
      const response = await fetch('/api/album/upload', {
        method: 'POST',
        headers: token ? { 'x-family-token': token } : {},
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setQueue((prev) =>
          prev.map((item) =>
            targetIds.has(item.asset.id) ? { ...item, status: 'error' } : item
          )
        );
        setErrorBanner(data.error || t('upload.errors.serverNotConfigured'));
        setSubmitting(false);
        return;
      }

      const failedIdxSet = new Set<number>(
        Array.isArray(data.failedIndices) ? data.failedIndices : []
      );
      const idToStatus = new Map<string, FileUploadState>();
      itemsToUpload.forEach((item, idx) => {
        idToStatus.set(item.asset.id, failedIdxSet.has(idx) ? 'error' : 'success');
      });

      setQueue((prev) =>
        prev.map((item) => {
          const nextState = idToStatus.get(item.asset.id);
          return nextState ? { ...item, status: nextState } : item;
        })
      );

      if (failedIdxSet.size > 0) {
        setFailedCount(failedIdxSet.size);
      } else {
        setAllSucceeded(true);
      }
    } catch {
      setQueue((prev) =>
        prev.map((item) =>
          targetIds.has(item.asset.id) ? { ...item, status: 'error' } : item
        )
      );
      setErrorBanner(t('upload.errors.serverNotConfigured'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pendingItems = queue.filter((i) => i.status !== 'success');
    await executeUpload(pendingItems);
  };

  const handleRetryFailed = async () => {
    const failedItems = queue.filter((i) => i.status === 'error');
    await executeUpload(failedItems);
  };

  const canInteractWithForm =
    albumStatus.backendConfigured && albumStatus.submissionsOpen;

  return (
    <main className="min-h-[75vh] pt-24 pb-16 sm:pt-28 sm:pb-20 bg-[#FFF5FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/souvenirs"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#75666E] hover:text-[#392B33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF007F]" />
            <span>{t('upload.backToGallery')}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LottieIllustration variant="wavingBear" className="w-16 h-16" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#FF007F] tracking-wide">
            {t('upload.kicker')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('upload.title')}
          </h1>
          <p className="text-sm sm:text-base text-[#75666E] max-w-xl mx-auto leading-relaxed">
            {t('upload.subtitle')}
          </p>
        </div>

        {/* Honest Status Banner if backend is not yet connected */}
        {!loadingStatus && !albumStatus.backendConfigured && (
          <div
            role="status"
            className="rounded-3xl bg-[#FFFFFF] border border-[#FFCCE5] p-6 sm:p-8 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFE5F2] text-[#FF007F] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                {t('upload.notConfiguredBannerTitle')}
              </h2>
              <p className="text-sm text-[#75666E] leading-relaxed">
                {t('upload.notConfiguredBannerBody')}
              </p>
            </div>
          </div>
        )}

        {/* Honest Status Banner if Submissions are closed */}
        {!loadingStatus &&
          albumStatus.backendConfigured &&
          !albumStatus.submissionsOpen && (
            <div
              role="status"
              className="rounded-3xl bg-[#FFFFFF] border border-[#FFCCE5] p-6 sm:p-8 flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFE5F2] text-[#FF007F] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                  {t('upload.closedBannerTitle')}
                </h2>
                <p className="text-sm text-[#75666E] leading-relaxed">
                  {t('upload.closedBannerBody')}
                </p>
              </div>
            </div>
          )}

        {/* Upload Form */}
        <form
          onSubmit={handleFormSubmit}
          noValidate
          className={`rounded-3xl bg-[#FFFFFF] border border-[#FFCCE5] p-6 sm:p-10 space-y-6 shadow-sm ${
            !canInteractWithForm ? 'opacity-65 pointer-events-none select-none' : ''
          }`}
        >
          {/* Family Invitation Code Verification */}
          {albumStatus.requireFamilyCodeForUpload && (
            <div className="space-y-2 pb-4 border-b border-[#FFCCE5]">
              <label
                htmlFor="upload-family-code"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('upload.familyCodeLabel')}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="upload-family-code"
                  type="password"
                  value={familyCode}
                  disabled={codeVerified}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  placeholder={t('upload.familyCodePlaceholder')}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm text-[#392B33] focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
                />
                {codeVerified ? (
                  <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FFE5F2] text-xs font-semibold text-[#392B33]">
                    <CheckCircle2 className="w-4 h-4 text-[#FF007F]" />
                    <span>{t('upload.codeVerifiedBadge')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifyingCode}
                    className="px-5 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] hover:bg-[#FFE5F2] text-sm font-medium text-[#392B33] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t('upload.verifyCodeCta')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Contributor Name & Optional Caption */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label
                htmlFor="upload-contributor"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('upload.contributorNameLabel')}
              </label>
              <input
                id="upload-contributor"
                type="text"
                required
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder={t('upload.contributorNamePlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm text-[#392B33] focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="upload-caption"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('upload.captionLabel')}
              </label>
              <input
                id="upload-caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t('upload.captionPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-sm text-[#392B33] focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>
          </div>

          {/* Drag & Drop + Mobile File Selector */}
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleIncomingFiles(e.dataTransfer.files);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#FF007F] bg-[#FFE5F2]/40'
                  : 'border-[#FFCCE5] bg-[#FFF5FA]'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-[#FF007F] mx-auto mb-3" />
              <p className="text-sm sm:text-base font-medium text-[#392B33]">
                {t('upload.dropzoneTitle')}
              </p>
              <p className="text-xs text-[#75666E] mt-1">
                {t('upload.dropzoneSpecs', {
                  maxFiles,
                  maxSize: maxSizeMb,
                })}
              </p>

              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleIncomingFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="sr-only"
                  id="photo-file-input"
                />
                <label
                  htmlFor="photo-file-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  <span>{t('upload.selectFilesButton')}</span>
                </label>
              </div>
            </div>

            <p className="text-xs text-[#75666E] leading-relaxed">
              {t('upload.heicNotice')}
            </p>
          </div>

          {/* Preview Grid with Per-File Status */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-[#75666E] tabular-nums">
                <span>
                  {t('upload.selectedCount', {
                    count: queue.length,
                    max: maxFiles,
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {queue.map((item) => (
                  <div
                    key={item.asset.id}
                    className="rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-[#FFE5F2]">
                      <img
                        src={item.asset.previewUrl}
                        alt={item.asset.originalName}
                        className="w-full h-full object-cover"
                      />
                      {item.status !== 'uploading' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQueueItem(item.asset.id)}
                          aria-label={t('upload.removeFile')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#392B33]/75 hover:bg-[#392B33] text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="p-2.5 text-xs flex items-center justify-between gap-2">
                      <span className="truncate text-[#392B33] font-medium">
                        {item.asset.originalName}
                      </span>
                      <span
                        className={`shrink-0 font-semibold ${
                          item.status === 'success'
                            ? 'text-[#FF007F]'
                            : item.status === 'error'
                            ? 'text-red-700'
                            : 'text-[#75666E]'
                        }`}
                      >
                        {t(`upload.status.${item.status}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consent Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-[#FFCCE5]">
            <label className="flex items-start gap-3 text-sm text-[#392B33] cursor-pointer">
              <input
                type="checkbox"
                checked={displayNameConsent}
                onChange={(e) => setDisplayNameConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#FF007F] rounded"
              />
              <span>{t('upload.displayNameConsentLabel')}</span>
            </label>

            <label className="flex items-start gap-3 text-sm text-[#392B33] cursor-pointer">
              <input
                type="checkbox"
                required
                checked={publicationConsent}
                onChange={(e) => setPublicationConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#FF007F] rounded"
              />
              <span className="font-medium">
                {t('upload.publicationConsentLabel')}
              </span>
            </label>

            <p className="text-xs text-[#75666E] leading-relaxed pt-1">
              {t('upload.rightsReminder')}
            </p>
          </div>

          {/* Error & Success Feedback */}
          {errorBanner && (
            <div
              role="alert"
              className="rounded-xl bg-[#FFE5F2] border border-[#FF007F]/40 p-3.5 flex items-center gap-2.5 text-xs sm:text-sm text-[#392B33]"
            >
              <AlertCircle className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          {failedCount > 0 && (
            <div
              role="alert"
              className="rounded-xl bg-[#FFE5F2] border border-[#FF007F]/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#392B33]"
            >
              <span>{t('upload.partialErrorMessage', { failed: failedCount })}</span>
              <button
                type="button"
                onClick={handleRetryFailed}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF007F] text-white text-xs font-medium cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('upload.retryFailedButton')}</span>
              </button>
            </div>
          )}

          {allSucceeded && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl bg-[#FFE5F2]/70 border border-[#FF007F]/40 p-4 flex items-center gap-3 text-sm font-medium text-[#392B33]"
            >
              <CheckCircle2 className="w-5 h-5 text-[#FF007F] shrink-0" />
              <span>{t('upload.successMessage')}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || processingFiles || !canInteractWithForm}
            className="w-full py-3.5 px-6 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] disabled:opacity-60 text-white text-sm sm:text-base font-medium transition-colors cursor-pointer"
          >
            {submitting ? t('upload.uploadingButton') : t('upload.submitButton')}
          </button>
        </form>
      </div>
    </main>
  );
};
