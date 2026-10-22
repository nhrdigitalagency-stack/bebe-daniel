import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Images,
  ChevronDown,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useEventSettings } from '../../context/EventSettingsContext';
import {
  buildContactWhatsappMessage,
  buildWhatsappUrl,
  copyTextToClipboard,
} from '../../services/whatsappService';

export const MemoriesFaqContactSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config, albumStatus } = useEventSettings();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact / Wishes form state
  const [senderName, setSenderName] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [contactErrorKey, setContactErrorKey] = useState<string | null>(null);
  const [contactCopied, setContactCopied] = useState(false);

  const faqItems = t('faq.items', { returnObjects: true }) as Array<{
    q: string;
    a: string;
  }>;

  const isAfterCeremony =
    albumStatus.galleryOpen ||
    albumStatus.submissionsOpen ||
    Boolean(config.eventStart && new Date(config.eventStart).getTime() <= Date.now());

  const validateContact = (): boolean => {
    if (!senderName.trim()) {
      setContactErrorKey('contact.errors.nameRequired');
      return false;
    }
    if (!senderMessage.trim()) {
      setContactErrorKey('contact.errors.messageRequired');
      return false;
    }
    setContactErrorKey(null);
    return true;
  };

  const handleContactWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContact()) return;

    const text = buildContactWhatsappMessage(
      { senderName, message: senderMessage },
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

  const handleCopyContact = async () => {
    if (!validateContact()) return;
    const text = buildContactWhatsappMessage(
      { senderName, message: senderMessage },
      i18n.language
    );
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setContactCopied(true);
      setTimeout(() => setContactCopied(false), 3500);
    }
  };

  return (
    <div className="bg-[#FFFFFF]">
      {/* Section 1: Souvenirs Preview (#souvenirs) */}
      <section
        id="souvenirs"
        className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#FFCCE5]"
      >
        <div className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-8 sm:p-12 lg:p-16 text-center max-w-4xl mx-auto space-y-6">
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide">
            {t('memoriesPreview.kicker')}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('memoriesPreview.title')}
          </h2>
          <p className="text-base sm:text-lg text-[#75666E] max-w-2xl mx-auto leading-relaxed">
            {isAfterCeremony
              ? t('memoriesPreview.afterEvent')
              : t('memoriesPreview.beforeEvent')}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              to="/souvenirs"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm sm:text-base font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Images className="w-4 h-4 shrink-0" />
              <span>{t('memoriesPreview.viewGalleryCta')}</span>
            </Link>

            <Link
              to="/partager-des-photos"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFFFFF] hover:bg-[#FFE5F2] text-[#392B33] text-sm sm:text-base font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Camera className="w-4 h-4 shrink-0 text-[#FF007F]" />
              <span>{t('memoriesPreview.addPhotosCta')}</span>
            </Link>
          </div>

          <p className="text-xs text-[#75666E] pt-2">
            {t('memoriesPreview.privacyBadge')}
          </p>
        </div>
      </section>

      {/* Section 2: FAQ Accordion (#faq) */}
      <section
        id="faq"
        className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#FFCCE5] space-y-10"
      >
        <div className="text-center space-y-3">
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide">
            {t('faq.kicker')}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('faq.title')}
          </h2>
        </div>

        <div className="space-y-3">
          {Array.isArray(faqItems) &&
            faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const panelId = `faq-panel-${idx}`;
              const btnId = `faq-btn-${idx}`;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#FFCCE5] bg-[#FFF5FA] overflow-hidden"
                >
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 text-base font-medium text-[#392B33] hover:bg-[#FFE5F2]/50 transition-colors cursor-pointer"
                  >
                    <span className="font-display text-xl font-semibold">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#FF007F] shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="px-6 pb-5 pt-1 text-sm sm:text-base text-[#75666E] leading-relaxed border-t border-[#FFCCE5]/60 bg-white"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>

      {/* Section 3: Contact & Wishes (#contact) */}
      <section
        id="contact"
        className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="text-center space-y-3">
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide">
            {t('contact.kicker')}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('contact.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#75666E]">
            {t('contact.description')}
          </p>
        </div>

        <form
          onSubmit={handleContactWhatsapp}
          noValidate
          className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="contact-name"
              className="block text-sm font-medium text-[#392B33]"
            >
              {t('contact.senderNameLabel')}
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                if (contactErrorKey) setContactErrorKey(null);
              }}
              placeholder={t('contact.senderNamePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-white text-[#392B33] text-sm focus:outline-2 focus:outline-[#FF007F]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="contact-message"
              className="block text-sm font-medium text-[#392B33]"
            >
              {t('contact.senderMessageLabel')}
            </label>
            <textarea
              id="contact-message"
              rows={3}
              required
              value={senderMessage}
              onChange={(e) => {
                setSenderMessage(e.target.value);
                if (contactErrorKey) setContactErrorKey(null);
              }}
              placeholder={t('contact.senderMessagePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-white text-[#392B33] text-sm focus:outline-2 focus:outline-[#FF007F]"
            />
          </div>

          {contactErrorKey && (
            <div
              role="alert"
              className="rounded-xl bg-[#FFE5F2] border border-[#FF007F]/40 p-3 flex items-center gap-2 text-xs sm:text-sm text-[#392B33]"
            >
              <AlertCircle className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span>{t(contactErrorKey)}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{t('contact.sendWhatsappCta')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyContact}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#FFCCE5] bg-white hover:bg-[#FFE5F2] text-[#392B33] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {contactCopied ? (
                <Check className="w-4 h-4 text-[#FF007F] shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-[#FF007F] shrink-0" />
              )}
              <span>{t('contact.copyMessageCta')}</span>
            </button>
          </div>

          <p className="text-xs text-[#75666E] text-center pt-1">
            {t('contact.directPhoneLabel')} {config.whatsappDisplayNumber}
          </p>
        </form>
      </section>
    </div>
  );
};
