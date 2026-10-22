import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Heart } from 'lucide-react';
import { useEventSettings } from '../../context/EventSettingsContext';
import { LottieIllustration } from '../ui/LottieIllustration';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const DEFAULT_EVENT_TARGET = '2026-11-01T14:00:00+01:00';

function calculateTimeLeft(eventStartIso: string | null): TimeLeft {
  const targetIso = eventStartIso || DEFAULT_EVENT_TARGET;
  const target = new Date(targetIso).getTime();
  const fallbackTarget = new Date(DEFAULT_EVENT_TARGET).getTime();
  const validTarget = Number.isNaN(target) ? fallbackTarget : target;

  const diff = validTarget - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: false };
}

export const CountdownSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config } = useEventSettings();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(config.eventStart)
  );

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(config.eventStart));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(config.eventStart));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.eventStart]);

  const isEnglish = i18n.language?.startsWith('en');

  const parentsDisplay =
    config.parentsNames && config.parentsNames.length > 0
      ? config.parentsNames.join(isEnglish ? ' & ' : ' et ')
      : isEnglish
      ? 'Marie & Joseph'
      : 'Marie et Joseph';

  return (
    <section
      id="compte-a-rebours"
      aria-label={t('countdown.title')}
      className="py-14 sm:py-20 bg-[#FFF5FA] border-b border-[#FFCCE5]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#FFCCE5] p-8 sm:p-12 text-center shadow-xs space-y-6">
          <div className="flex justify-center">
            <LottieIllustration variant="moonStars" className="w-14 h-14" />
          </div>

          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
              {isEnglish ? 'November 1st, 2026' : '1er novembre 2026'} · {parentsDisplay}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#392B33]">
              {t('countdown.title')}
            </h2>
          </div>

          {timeLeft.isPast ? (
            <div className="py-6 px-4 rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFE5F2] text-[#FF007F]">
                <Heart className="w-5 h-5 fill-[#FF007F]" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-semibold text-[#FF007F]">
                {isEnglish
                  ? 'Thank you for being part of this day'
                  : 'Merci d’avoir fait partie de cette journée'}
              </p>
              <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
                {t('countdown.pastEvent')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto pt-2">
              <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-5 sm:p-6">
                <div className="font-display text-4xl sm:text-5xl font-semibold text-[#FF007F] tabular-nums">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#75666E] mt-1.5">
                  {t('countdown.days')}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-5 sm:p-6">
                <div className="font-display text-4xl sm:text-5xl font-semibold text-[#FF007F] tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#75666E] mt-1.5">
                  {t('countdown.hours')}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-5 sm:p-6">
                <div className="font-display text-4xl sm:text-5xl font-semibold text-[#FF007F] tabular-nums">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#75666E] mt-1.5">
                  {t('countdown.minutes')}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-5 sm:p-6">
                <div className="font-display text-4xl sm:text-5xl font-semibold text-[#FF007F] tabular-nums">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#75666E] mt-1.5">
                  {t('countdown.seconds')}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#75666E] font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span>
                {isEnglish ? 'Sunday, November 1, 2026' : 'Dimanche 1er novembre 2026'}
              </span>
            </span>
            <span aria-hidden="true" className="text-[#FF007F]">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span>
                {config.venueName || 'Domicile de Marie et Joseph'} — {config.address || 'Yaoundé, Simbock'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
