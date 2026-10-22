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
import { useEventSettings } from '../../context/EventSettingsContext';
import { downloadIcsFile } from '../../services/calendarService';

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
    <div className="bg-[#FFF5FA] border-b border-[#FFCCE5]">
      {/* Part 1: Schedule (#programme) */}
      <section id="programme" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.schedule.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#FFFFFF] border border-[#FFCCE5] p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#75666E] tabular-nums">
                    <span className="font-semibold text-[#FF007F]">
                      0{idx + 1}
                    </span>
                    <span>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Part 2: Practical Information (#infos-pratiques) */}
      <section
        id="infos-pratiques"
        className="py-16 sm:py-24 border-t border-[#FFCCE5] bg-[#FFFFFF]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Card */}
            <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.dateLabel')}
                </span>
              </div>
              <p className="font-display text-2xl font-semibold text-[#392B33] capitalize">
                {formattedDate || t('practical.toBeConfirmed')}
              </p>
            </div>

            {/* Time Card */}
            <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <Clock className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.timeLabel')}
                </span>
              </div>
              <p className="font-display text-2xl font-semibold text-[#392B33] tabular-nums">
                {formattedTime || t('practical.toBeConfirmed')}
              </p>
            </div>

            {/* Venue & Address Card */}
            <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2">
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
            </div>

            {/* Optional Dress Code Card */}
            <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2">
              <div className="flex items-center gap-2.5 text-[#FF007F]">
                <Heart className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                  {t('practical.dressCodeLabel')}
                </span>
              </div>
              <p className="font-display text-xl font-semibold text-[#392B33]">
                {config.dressCode?.trim() || t('practical.toBeConfirmed')}
              </p>
            </div>

            {/* Optional Access Notes Card */}
            {config.accessNotes && config.accessNotes.trim().length > 0 && (
              <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 space-y-2 sm:col-span-2">
                <div className="flex items-center gap-2.5 text-[#FF007F]">
                  <Info className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold tracking-wide text-[#75666E]">
                    {t('practical.accessLabel')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-[#392B33] leading-relaxed">
                  {config.accessNotes}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons: Directions & .ICS Calendar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2">
            {hasDirections ? (
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>{t('practical.openDirections')}</span>
              </a>
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
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] hover:bg-[#FFE5F2] text-[#392B33] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <CalendarPlus className="w-4 h-4 shrink-0 text-[#FF007F]" />
                <span>{t('practical.addToCalendar')}</span>
              </button>
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
          </div>
        </div>
      </section>
    </div>
  );
};
