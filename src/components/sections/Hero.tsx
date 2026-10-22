import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarHeart, MapPin, Calendar, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEventSettings } from '../../context/EventSettingsContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const DEFAULT_HERO_EVENT_DATE = '2026-11-01T14:00:00+01:00';

function calculateHeroCountdown(eventStartIso: string | null): TimeLeft {
  const targetIso = eventStartIso || DEFAULT_HERO_EVENT_DATE;
  const parsed = new Date(targetIso).getTime();
  const target = Number.isNaN(parsed)
    ? new Date(DEFAULT_HERO_EVENT_DATE).getTime()
    : parsed;

  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const Hero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config } = useEventSettings();
  const [heroImgError, setHeroImgError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateHeroCountdown(config.eventStart)
  );

  useEffect(() => {
    setTimeLeft(calculateHeroCountdown(config.eventStart));
    const timer = setInterval(() => {
      setTimeLeft(calculateHeroCountdown(config.eventStart));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.eventStart]);

  const activeHeroImage =
    config.portraitUrl ||
    config.heroBackdropUrl ||
    '/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png';

  const isEnglish = i18n.language?.startsWith('en');

  const parentsDisplay =
    config.parentsNames && config.parentsNames.length > 0
      ? config.parentsNames.join(isEnglish ? ' & ' : ' et ')
      : isEnglish
      ? 'Marie & Joseph'
      : 'Marie et Joseph';

  const dateDisplay = isEnglish ? 'November 1, 2026' : '1er novembre 2026';
  const locationDisplay = config.address || 'Yaoundé, Simbock';

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const countdownUnits = [
    {
      key: 'days',
      value: timeLeft.days,
      label: isEnglish ? 'Days' : 'Jours',
    },
    {
      key: 'hours',
      value: timeLeft.hours,
      label: isEnglish ? 'Hours' : 'Heures',
    },
    {
      key: 'minutes',
      value: timeLeft.minutes,
      label: 'Minutes',
    },
    {
      key: 'seconds',
      value: timeLeft.seconds,
      label: isEnglish ? 'Seconds' : 'Secondes',
    },
  ];

  return (
    <section
      id="accueil"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#291522] border-b border-[#FFCCE5] pt-24 pb-16"
    >
      {/* Full-Screen Hero Image with Slow Ken Burns Motion */}
      <div className="absolute inset-0 select-none overflow-hidden" aria-hidden="true">
        {!heroImgError && activeHeroImage ? (
          <motion.img
            src={activeHeroImage}
            alt={t('hero.portraitAlt')}
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            initial={{ scale: 1.07 }}
            animate={{ scale: 1 }}
            transition={{ duration: 14, ease: EASE_OUT_EXPO }}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-[#392B33]" />
        )}

        {/* Required Color Overlay: #F4B6CB at 20% opacity */}
        <div
          className="absolute inset-0 bg-[#F4B6CB]/20"
          style={{ backgroundColor: 'rgba(244, 182, 203, 0.2)' }}
        />
        {/* Subtle Editorial Scrim for Full-Screen Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#24111D]/55 via-[#24111D]/45 to-[#24111D]/72" />
      </div>

      {/* Full-Screen Editorial Hero Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.12,
              delayChildren: 0.1,
            },
          },
        }}
        className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-center space-y-6 text-white"
      >
        {/* Top Kicker & Parents */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
          }}
          className="inline-flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-base font-semibold text-[#FFB3D9] tracking-wide uppercase"
        >
          <span>{t('hero.kicker')}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 text-white">
            <Heart className="w-4 h-4 text-[#FF007F] fill-[#FF007F]" />
            <span>{parentsDisplay}</span>
          </span>
        </motion.div>

        {/* Main Hero Title */}
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE_OUT_EXPO } },
          }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-semibold text-white leading-[1.04] tracking-tight drop-shadow-md"
          style={{ textWrap: 'balance' }}
        >
          {t('hero.title')}
        </motion.h1>

        {/* Signature Subtitle */}
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE_OUT_EXPO } },
          }}
          className="font-display italic text-2xl sm:text-3xl lg:text-4xl text-[#FFB3D9] font-medium drop-shadow-xs"
        >
          « {t('hero.subtitle')} »
        </motion.p>

        {/* Countdown Section directly under the Hero Title (1er novembre 2026) */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.96, y: 18 },
            visible: {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.8, ease: EASE_OUT_EXPO },
            },
          }}
          className="py-2"
          aria-live="polite"
        >
          {timeLeft.isPast ? (
            <div className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white/18 backdrop-blur-md border border-white/35 shadow-lg">
              <Heart className="w-5 h-5 text-[#FF007F] fill-[#FF007F] shrink-0" />
              <span className="font-display text-2xl sm:text-3xl font-semibold text-white">
                {isEnglish ? 'Thank you for sharing this moment' : 'Merci de partager ce moment'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {countdownUnits.map((unit) => (
                <motion.div
                  key={unit.key}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="rounded-2xl bg-white/16 backdrop-blur-md border border-white/35 px-4 py-3.5 sm:py-4 shadow-lg"
                >
                  <div className="font-display text-3xl sm:text-5xl font-semibold text-white tabular-nums leading-none">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={unit.value}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="inline-block"
                      >
                        {String(unit.value).padStart(2, '0')}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#FFB3D9] mt-1.5">
                    {unit.label}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Description */}
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE_OUT_EXPO } },
          }}
          className="text-base sm:text-xl text-white/95 leading-relaxed max-w-3xl mx-auto drop-shadow-xs"
        >
          {t('hero.description')}
        </motion.p>

        {/* Event Date & Location Line: 1er novembre 2026 · Domicile de Marie et Joseph — Yaoundé, Simbock */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
          }}
          className="pt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:text-base text-white font-semibold drop-shadow-xs"
        >
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF007F] shrink-0" />
            <span>{dateDisplay}</span>
          </span>
          <span aria-hidden="true" className="text-[#FF80BF] hidden sm:inline">
            ·
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF007F] shrink-0" />
            <span>
              {config.venueName || 'Domicile de Marie et Joseph'} — {locationDisplay}
            </span>
          </span>
        </motion.div>

        {/* Call-to-Action Buttons */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE_OUT_EXPO } },
          }}
          className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollToSection('confirmation')}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm sm:text-base font-semibold transition-colors duration-150 shadow-lg cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <CalendarHeart className="w-5 h-5 shrink-0" />
            <span>{t('hero.primaryCta')}</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollToSection('invitation')}
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/45 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-sm sm:text-base font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span>{t('hero.secondaryCta')}</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
