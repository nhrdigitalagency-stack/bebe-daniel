import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Copy, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEventSettings } from '../../context/EventSettingsContext';
import {
  AttendanceStatus,
  buildRsvpWhatsappMessage,
  buildWhatsappUrl,
  copyTextToClipboard,
} from '../../services/whatsappService';
import { LottieIllustration } from '../ui/LottieIllustration';

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const RsvpSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config } = useEventSettings();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [attendance, setAttendance] = useState<AttendanceStatus>('yes');
  const [additionalAdults, setAdditionalAdults] = useState<number>(0);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [message, setMessage] = useState('');

  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [openedFeedback, setOpenedFeedback] = useState(false);

  const maxAdults = config.rsvpLimits.maxAdditionalAdults;
  const maxChildren = config.rsvpLimits.maxChildren;

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      setErrorKey('rsvp.errors.firstNameRequired');
      return false;
    }
    if (attendance !== 'no') {
      if (additionalAdults < 0 || additionalAdults > maxAdults) {
        setErrorKey('rsvp.errors.adultsLimit');
        return false;
      }
      if (childrenCount < 0 || childrenCount > maxChildren) {
        setErrorKey('rsvp.errors.childrenLimit');
        return false;
      }
    }
    setErrorKey(null);
    return true;
  };

  const getPreparedMessage = (): string => {
    return buildRsvpWhatsappMessage(
      {
        firstName,
        lastName,
        attendance,
        additionalAdults: attendance !== 'no' ? additionalAdults : undefined,
        childrenCount: attendance !== 'no' ? childrenCount : undefined,
        dietaryPreferences: attendance !== 'no' ? dietaryPreferences : undefined,
        message,
      },
      i18n.language
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const text = getPreparedMessage();
    const url = buildWhatsappUrl(text, config.whatsappNumber);

    setOpenedFeedback(true);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyFallback = async () => {
    if (!validateForm()) return;
    const text = getPreparedMessage();
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 4000);
    }
  };

  return (
    <section
      id="confirmation"
      className="py-16 sm:py-24 bg-[#FFF5FA] border-b border-[#FFCCE5] overflow-hidden"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="text-center space-y-3"
        >
          <div className="flex justify-center">
            <LottieIllustration variant="subtleHearts" className="w-14 h-14" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
            {t('rsvp.kicker')}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
            style={{ textWrap: 'balance' }}
          >
            {t('rsvp.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#75666E] max-w-xl mx-auto">
            {t('rsvp.subtitle')}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl bg-[#FFFFFF] border border-[#FFCCE5] p-6 sm:p-10 space-y-6 shadow-sm"
        >
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label
                htmlFor="rsvp-first-name"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('rsvp.firstNameLabel')}
              </label>
              <input
                id="rsvp-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errorKey) setErrorKey(null);
                }}
                placeholder={t('rsvp.firstNamePlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] placeholder:text-[#75666E]/60 text-sm focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="rsvp-last-name"
                className="block text-sm font-medium text-[#392B33]"
              >
                {t('rsvp.lastNameLabel')}
              </label>
              <input
                id="rsvp-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('rsvp.lastNamePlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] placeholder:text-[#75666E]/60 text-sm focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
              />
            </div>
          </div>

          {/* Attendance Selector: Oui / Non / Peut-être */}
          <fieldset className="space-y-2.5">
            <legend className="block text-sm font-medium text-[#392B33]">
              {t('rsvp.attendanceLabel')}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { value: 'yes', labelKey: 'rsvp.attendanceYes' },
                  { value: 'no', labelKey: 'rsvp.attendanceNo' },
                  { value: 'maybe', labelKey: 'rsvp.attendanceMaybe' },
                ] as const
              ).map((option) => {
                const isSelected = attendance === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setAttendance(option.value)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#FFE5F2] border-[#FF007F] text-[#392B33] font-semibold'
                        : 'bg-[#FFF5FA] border-[#FFCCE5] text-[#75666E] hover:text-[#392B33] hover:bg-[#FFE5F2]/50'
                    }`}
                  >
                    {t(option.labelKey)}
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          {/* Conditional Guest Counts & Dietary Preferences */}
          <AnimatePresence initial={false}>
            {attendance !== 'no' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-6 pt-2 border-t border-[#FFCCE5]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="rsvp-adults"
                        className="block text-sm font-medium text-[#392B33]"
                      >
                        {t('rsvp.additionalAdultsLabel')}
                      </label>
                      <select
                        id="rsvp-adults"
                        value={additionalAdults}
                        onChange={(e) => setAdditionalAdults(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] text-sm focus:bg-white focus:outline-2 focus:outline-[#FF007F] tabular-nums"
                      >
                        {Array.from({ length: maxAdults + 1 }, (_, i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="rsvp-children"
                        className="block text-sm font-medium text-[#392B33]"
                      >
                        {t('rsvp.childrenLabel')}
                      </label>
                      <select
                        id="rsvp-children"
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] text-sm focus:bg-white focus:outline-2 focus:outline-[#FF007F] tabular-nums"
                      >
                        {Array.from({ length: maxChildren + 1 }, (_, i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="rsvp-dietary"
                      className="block text-sm font-medium text-[#392B33]"
                    >
                      {t('rsvp.dietaryLabel')}
                    </label>
                    <input
                      id="rsvp-dietary"
                      type="text"
                      value={dietaryPreferences}
                      onChange={(e) => setDietaryPreferences(e.target.value)}
                      placeholder={t('rsvp.dietaryPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] placeholder:text-[#75666E]/60 text-sm focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message for Parents */}
          <div className="space-y-2">
            <label
              htmlFor="rsvp-message"
              className="block text-sm font-medium text-[#392B33]"
            >
              {t('rsvp.messageLabel')}
            </label>
            <textarea
              id="rsvp-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('rsvp.messagePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] placeholder:text-[#75666E]/60 text-sm focus:bg-white focus:outline-2 focus:outline-[#FF007F]"
            />
          </div>

          {/* Validation Error Alert */}
          {errorKey && (
            <div
              role="alert"
              className="rounded-xl bg-[#FFE5F2] border border-[#FF007F]/40 p-3.5 flex items-center gap-2.5 text-xs sm:text-sm text-[#392B33]"
            >
              <AlertCircle className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span>
                {t(errorKey, {
                  max:
                    errorKey === 'rsvp.errors.adultsLimit' ? maxAdults : maxChildren,
                })}
              </span>
            </div>
          )}

          {/* Honest Status Banner when WhatsApp is opened or copied */}
          {openedFeedback && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-[#FFF5FA] border border-[#FFCCE5] p-3.5 text-xs sm:text-sm text-[#392B33]"
            >
              {t('rsvp.openedInfo')}
            </div>
          )}

          {copiedFeedback && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-[#FFE5F2]/60 border border-[#FF80BF] p-3.5 text-xs sm:text-sm text-[#392B33]"
            >
              {t('rsvp.copiedSuccess', { phone: config.whatsappDisplayNumber })}
            </div>
          )}

          {/* Actions: Primary WhatsApp Button & Backup Copy Button */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{t('rsvp.submitWhatsapp')}</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCopyFallback}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] hover:bg-[#FFE5F2] text-[#392B33] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedFeedback ? (
                  <Check className="w-4 h-4 text-[#FF007F] shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-[#FF007F] shrink-0" />
                )}
                <span>{t('rsvp.copyFallbackButton')}</span>
              </motion.button>
            </div>

            <p className="text-xs text-[#75666E] text-center leading-relaxed">
              {t('rsvp.whatsappDisclaimer')}
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
};
