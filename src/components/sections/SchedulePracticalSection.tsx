import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Heart,
  Info,
  CalendarPlus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEventSettings } from '../../context/EventSettingsContext';
import { downloadIcsFile } from '../../services/calendarService';

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SchedulePracticalSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config } = useEventSettings();

  const activeLocale = i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR';

  const formattedDate = React.useMemo(() => {
    if (!config.eventStart) return null;
    const d = new Date(config.eventStart);
    if (Number.isNaN(d.getTime())) return null;
    try {
      return new Intl.DateTimeFormat(activeLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...(config.timeZone ? { timeZone: config.timeZone } : {}),
      }).format(d);
    } catch {
      return new Intl.DateTimeFormat(activeLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
  }, [config.eventStart, config.timeZone, activeLocale]);

  const formattedTime = React.useMemo(() => {
    if (!config.eventStart) return null;
    const start = new Date(config.eventStart);
    if (Number.isNaN(start.getTime())) return null;

    const formatTime = (date: Date) => {
      try {
        return new Intl.DateTimeFormat(activeLocale, {
          hour: '2-digit',
          minute: '2-digit',
          ...(config.timeZone ? { timeZone: config.timeZone } : {}),
        }).format(date);
      } catch {
        return new Intl.DateTimeFormat(activeLocale, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }
    };

    const startStr = formatTime(start);
    if (config.eventEnd) {
      const end = new Date(config.eventEnd);
      if (!Number.isNaN(end.getTime()) && end > start) {
        return `${startStr} – ${formatTime(end)}`;
      }
    }
    return startStr;
  }, [config.eventStart, config.eventEnd, config.timeZone, activeLocale]);

  const hasDirections = Boolean(
    (config.mapsUrl && config.mapsUrl.trim().length > 0) ||
      (config.address && config.address.trim().length > 0)
  );

  const directionsHref = React.useMemo(() => {
    if (config.mapsUrl && config.mapsUrl.trim().length > 0) {
      return config.mapsUrl.trim();
    }
    if (config.address && config.address.trim().length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        config.address.trim()
      )}`;
    }
    return '';
  }, [config.mapsUrl, config.address]);

  const canDownloadCalendar = Boolean(formattedDate && config.eventStart);

  const handleDownloadIcs = () => {
    if (!config.eventStart) return;
    const locationParts = [config.venueName, config.address]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');

    downloadIcsFile({
      title: t('practical.calendarEventTitle'),
      description: t('practical.calendarEventDescription'),
      location: locationParts || undefined,
      startIso: config.eventStart,
      endIso: config.eventEnd,
      timeZone: config.timeZone,
      url: config.siteUrl || window.location.origin,
    });
  };

  const hasConfirmedScheduleTimes = config.schedule.some(
    (step) => step.time && step.time.trim().length > 0
  );

  return (
    <div className="bg-[#FFF5FA] border-b border-[#FFCCE5] overflow-hidden">
      {/* Part 1: Schedule (#programme) */}
      <section id="programme" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
              {t('schedule.kicker')}
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
              style={{ textWrap: 'balance' }}
            >
              {t('schedule.title')}
            </h2>
            {!hasConfirmedScheduleTimes && (
              <p className="text-xs sm:text-sm text-[#75666E]">
                {t('schedule.unconfirmedNotice')} · {t('schedule.unconfirmedSubtext')}
              </p>
            )}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.12 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {config.schedule.map((item, idx) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.65, ease: EASE_OUT_EXPO },
                  },
                }}
                whileHover={{ y: -5, transition: { duration: 0.22 } }}
                className="rounded-2xl bg-[#FFFFFF] border border-[#FFCCE5] p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#75666E] tabular-nums">
                    <span className="font-semibold text-[#FF007F] px-2.5 py-0.5 rounded-md bg-[#FFE5F2]">
                      0{idx + 1}
                    </span>
                    <span className="font-medium">
                      {item.time && item.time.trim().length > 0
                        ? item.time
                        : t('practical.toBeConfirmed')}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[#392B33]">
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-sm text-[#75666E] leading-relaxed">
                    {t(item.descriptionKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Part 2: Practical Information (#infos-pratiques) */}
      <section
        id="infos-pratiques"
        className="py-16 sm:py-24 border-t border-[#FFCCE5] bg-[#FFFFFF]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
              {t('practical.kicker')}
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]"
              style={{ textWrap: 'balance' }}
            >
              {t('practical.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#75666E]">
              {t('practical.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Date Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
              }}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.dateLabel')}
                </span>
              </div>
              <p className="font-display text-2xl font-semibold text-[#392B33] capitalize">
                {formattedDate || t('practical.toBeConfirmed')}
              </p>
            </motion.div>

            {/* Time Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
              }}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <Clock className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.timeLabel')}
                </span>
              </div>
              <p className="font-display text-2xl font-semibold text-[#392B33] tabular-nums">
                {formattedTime || t('practical.toBeConfirmed')}
              </p>
            </motion.div>

            {/* Venue & Address Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
              }}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <MapPin className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.venueLabel')} & {t('practical.addressLabel')}
                </span>
              </div>
              <p className="font-display text-2xl font-semibold text-[#392B33]">
                {config.venueName?.trim() || 'Domicile de Marie et Joseph'}
              </p>
              <p className="text-sm font-medium text-[#FF007F]">
                {config.address?.trim() || 'Yaoundé, Simbock'}
              </p>
            </motion.div>

            {/* Dress Code Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
              }}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <Heart className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.dressCodeLabel')}
                </span>
              </div>
              <p className="font-display text-xl font-semibold text-[#392B33]">
                {config.dressCode?.trim() || t('practical.toBeConfirmed')}
              </p>
            </motion.div>

            {/* Access Notes Card */}
            {config.accessNotes && config.accessNotes.trim().length > 0 && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
                }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2 sm:col-span-2 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2.5 text-[#FF007F]">
                  <Info className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                    {t('practical.accessLabel')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-[#392B33] leading-relaxed">
                  {config.accessNotes}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons: Directions & .ICS Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2"
          >
            {hasDirections ? (
              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>{t('practical.openDirections')}</span>
              </motion.a>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#75666E] text-sm font-medium opacity-70 cursor-not-allowed"
              >
                <Navigation className="w-4 h-4 shrink-0 text-[#FF80BF]" />
                <span>{t('practical.directionsUnavailable')}</span>
              </button>
            )}

            {canDownloadCalendar ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadIcs}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] hover:bg-[#FFE5F2] text-[#392B33] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <CalendarPlus className="w-4 h-4 shrink-0 text-[#FF007F]" />
                <span>{t('practical.addToCalendar')}</span>
              </motion.button>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#75666E] text-sm font-medium opacity-70 cursor-not-allowed"
              >
                <CalendarPlus className="w-4 h-4 shrink-0 text-[#FF80BF]" />
                <span>{t('practical.calendarUnavailable')}</span>
              </button>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};
