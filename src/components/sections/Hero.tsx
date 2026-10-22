import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarHeart, MapPin, Calendar, Heart } from 'lucide-react';
import { useEventSettings } from '../../context/EventSettingsContext';

export const Hero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config } = useEventSettings();
  const [heroImgError, setHeroImgError] = useState(false);

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

  return (
    <section
      id="accueil"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#291522] border-b border-[#FFCCE5] pt-24 pb-16"
    >
      {/* Full-Screen Hero Image ("Tendresse maternelle en rose pastel") */}
      <div className="absolute inset-0 select-none overflow-hidden" aria-hidden="true">
        {!heroImgError && activeHeroImage ? (
          <img
            src={activeHeroImage}
            alt={t('hero.portraitAlt')}
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className="w-full h-full object-cover object-center scale-[1.01] transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-[#392B33]" />
        )}

        {/* Color Overlay: #F4B6CB tint at 20% opacity + Balanced Scrim for Full-Screen Readability */}
        <div
          className="absolute inset-0 bg-[#F4B6CB]/20"
          style={{ backgroundColor: 'rgba(244, 182, 203, 0.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#24111D]/55 via-[#24111D]/45 to-[#24111D]/70" />
      </div>

      {/* Full-Screen Editorial Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-center space-y-6 text-white">
        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-base font-semibold text-[#FFB3D9] tracking-wide uppercase">
          <span>{t('hero.kicker')}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 text-white">
            <Heart className="w-4 h-4 text-[#FF007F] fill-[#FF007F]" />
            <span>{parentsDisplay}</span>
          </span>
        </div>

        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-semibold text-white leading-[1.04] tracking-tight drop-shadow-md"
          style={{ textWrap: 'balance' }}
        >
          {t('hero.title')}
        </h1>

        <p className="font-display italic text-2xl sm:text-3xl lg:text-4xl text-[#FFB3D9] font-medium drop-shadow-xs">
          « {t('hero.subtitle')} »
        </p>

        <p className="text-base sm:text-xl text-white/95 leading-relaxed max-w-3xl mx-auto drop-shadow-xs">
          {t('hero.description')}
        </p>

        {/* Event Date & Location Line: 1er novembre 2026 · Domicile de Marie et Joseph — Yaoundé, Simbock */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:text-base text-white font-semibold drop-shadow-xs">
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF007F] shrink-0" />
            <span>{dateDisplay}</span>
          </span>
          <span aria-hidden="true" className="text-[#FF80BF] hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF007F] shrink-0" />
            <span>
              {config.venueName || 'Domicile de Marie et Joseph'} — {locationDisplay}
            </span>
          </span>
        </div>

        {/* Full-Screen Hero Call-to-Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToSection('confirmation')}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#FF007F] hover:bg-[#D9006C] text-white text-sm sm:text-base font-semibold transition-all duration-150 shadow-lg cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <CalendarHeart className="w-5 h-5 shrink-0" />
            <span>{t('hero.primaryCta')}</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('invitation')}
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/45 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-sm sm:text-base font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span>{t('hero.secondaryCta')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
