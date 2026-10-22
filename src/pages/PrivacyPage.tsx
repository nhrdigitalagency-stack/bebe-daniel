import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Shield,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useEventSettings } from '../context/EventSettingsContext';
import {
  buildPhotoRemovalWhatsappMessage,
  buildWhatsappUrl,
  copyTextToClipboard,
} from '../services/whatsappService';

export const PrivacyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config, albumStatus } = useEventSettings();
  const [searchParams] = useSearchParams();

  const [requesterName, setRequesterName] = useState('');
  const [photoRef, setPhotoRef] = useState(
    () => searchParams.get('photoRef') || ''
  );
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const paramRef = searchParams.get('photoRef');
    if (paramRef) {
      setPhotoRef(paramRef);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    if (!requesterName.trim() || !photoRef.trim()) {
      setFormError(t('contact.errors.nameRequired'));
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleRemovalWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const text = buildPhotoRemovalWhatsappMessage(
      { requesterName, photoRef, reason },
      i18n.language
    );
    const url = buildWhatsappUrl(text, config.whatsappNumber);

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRequest = async () => {
    if (!validateForm()) return;
    const text = buildPhotoRemovalWhatsappMessage(
      { requesterName, photoRef, reason },
      i18n.language
    );
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  const sectionKeys = [
    'purpose',
    'moderation',
    'technical',
    'storage',
    'limits',
  ] as const;

  return (
    <main className="min-h-[75vh] pt-24 pb-16 sm:pt-28 sm:pb-20 bg-[#FFFFFF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#75666E] hover:text-[#392B33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF007F]" />
            <span>{t('gallery.backHome')}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#FF007F]">
            <Shield className="w-4 h-4" />
            <span>{t('privacy.kicker')}</span>
          </div>
          <h1
            className="font-display text-3xl sm:text-5xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('privacy.title')}
          </h1>
          <p className="text-base sm:text-lg text-[#75666E] leading-relaxed">
            {t('privacy.subtitle')}
          </p>
        </div>

        {/* Notice Sections */}
        <div className="space-y-6">
          {sectionKeys.map((key) => (
            <section
              key={key}
              className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 space-y-2"
            >
              <h2 className="font-display text-2xl font-semibold text-[#392B33]">
                {t(`privacy.sections.${key}.title`)}
              </h2>
              <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
                {t(`privacy.sections.${key}.body`, {
                  retentionDays: albumStatus.retentionDays || 365,
                })}
              </p>
            </section>
          ))}
        </div>

        {/* Photo Removal Request Form */}
        <section className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-10 space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#392B33]">
              {t('privacy.removalForm.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#75666E]">
              {t('privacy.removalForm.description')}
            </p>
          </div>

          <form onSubmit={handleRemovalWhatsapp} noValidate className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label
                  htmlFor="removal-name"
                  className="block text-sm font-medium text-[#392B33]"
                >
                  {t('privacy.removalForm.requesterNameLabel')}
                </label>
                <input
                  id="removal-name"
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => {
                    setRequesterName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-white text-sm text-[#392B33] focus:outline-2 focus:outline-[#FF007F]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="removal-ref"
                  className="block text-sm font-medium text-[#392B33]"
                >
                  {t('privacy.removalForm.photoRefLabel')}
                </label>
                <input
                  id="removal-ref"
                  type="text"
                  required
                  value={photoRef}
                  onChange={(e) => {
                    setPhotoRef(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder={t('privacy.removalForm.photoRefPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-white text-sm text-[#392B33] focus:outline-2 focus:outline-[#FF007F]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="removal-reason"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('privacy.removalForm.reasonLabel')}
              </label>
              <textarea
                id="removal-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('privacy.removalForm.reasonPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-white text-sm text-[#392B33] focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-[#FFE5F2] p-3 flex items-center gap-2 text-xs text-[#392B33]"
              >
                <AlertCircle className="w-4 h-4 text-[#FF007F] shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{t('privacy.removalForm.submitWhatsapp')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRequest}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#FFCCE5] bg-white hover:bg-[#FFE5F2] text-[#392B33] text-sm font-medium transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#FF007F]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#FF007F]" />
                )}
                <span>{t('privacy.removalForm.copyRequest')}</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
