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
import { motion, AnimatePresence } from 'motion/react';
import { useEventSettings } from '../../context/EventSettingsContext';
import {
  buildContactWhatsappMessage,
  buildWhatsappUrl,
  copyTextToClipboard,
} from '../../services/whatsappService';

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
    <div className="bg-[#FFFFFF] overflow-hidden">
      {/* Section 1: Souvenirs Preview (#souvenirs) */}
      <section
        id="souvenirs"
        className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#FFCCE5]"
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          className="rounded-3xl bg-[#FFF5FA] border border-[#FFCCE5] p-8 sm:p-12 lg:p-16 text-center max-w-4xl mx-auto space-y-6 shadow-xs"
        >
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
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
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm sm:text-base font-semibold transition-all hover:-translate-y-0.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Images className="w-4 h-4 shrink-0" />
              <span>{t('memoriesPreview.viewGalleryCta')}</span>
            </Link>

            <Link
              to="/partager-des-photos"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFFFFF] hover:bg-[#FFE5F2] text-[#392B33] text-sm sm:text-base font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <Camera className="w-4 h-4 shrink-0 text-[#FF007F]" />
              <span>{t('memoriesPreview.addPhotosCta')}</span>
            </Link>
          </div>

          <p className="text-xs text-[#75666E] pt-2">
            {t('memoriesPreview.privacyBadge')}
          </p>
        </motion.div>
      </section>

      {/* Section 2: FAQ Accordion (#faq) */}
      <section
        id="faq"
        className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#FFCCE5] space-y-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="text-center space-y-3"
        >
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
            {t('faq.kicker')}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('faq.title')}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {Array.isArray(faqItems) &&
            faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const panelId = `faq-panel-${idx}`;
              const btnId = `faq-btn-${idx}`;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.06, ease: EASE_OUT_EXPO }}
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
                      className={`w-5 h-5 text-[#FF007F] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-[#FFCCE5]/60 bg-white"
                      >
                        <div className="px-6 pb-5 pt-3 text-sm sm:text-base text-[#75666E] leading-relaxed">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
        </div>
      </section>

      {/* Section 3: Contact & Wishes (#contact) */}
      <section
        id="contact"
        className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="text-center space-y-3"
        >
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
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
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          onSubmit={handleContactWhatsapp}
          noValidate
          className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 space-y-5 shadow-xs"
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
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{t('contact.sendWhatsappCta')}</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCopyContact}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#FFCCE5] bg-white hover:bg-[#FFE5F2] text-[#392B33] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {contactCopied ? (
                <Check className="w-4 h-4 text-[#FF007F] shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-[#FF007F] shrink-0" />
              )}
              <span>{t('contact.copyMessageCta')}</span>
            </motion.button>
          </div>

          <p className="text-xs text-[#75666E] text-center pt-1">
            {t('contact.directPhoneLabel')} {config.whatsappDisplayNumber}
          </p>
        </motion.form>
      </section>
    </div>
  );
};
