import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Users, Camera, MapPin } from 'lucide-react';
import { useEventSettings } from '../../context/EventSettingsContext';
import { LottieIllustration } from '../ui/LottieIllustration';

export const InvitationSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { config } = useEventSettings();

  const isEnglish = i18n.language?.startsWith('en');

  const parentsDisplay =
    Array.isArray(config.parentsNames) &&
    config.parentsNames.filter((n) => n.trim().length > 0).length > 0
      ? config.parentsNames.join(isEnglish ? ' & ' : ' et ')
      : isEnglish
      ? 'Marie & Joseph'
      : 'Marie et Joseph';

  return (
    <section
      id="invitation"
      className="py-16 sm:py-24 bg-[#FFFFFF] border-b border-[#FFCCE5]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="flex justify-center">
            <LottieIllustration variant="sleepingCloud" className="w-16 h-16" />
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide">
            {t('invitation.kicker')}
          </p>

          <h2
            className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#392B33] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {t('invitation.title')}
          </h2>

          <p className="text-base sm:text-lg text-[#75666E] leading-relaxed">
            {t('invitation.body')}
          </p>

          <div className="pt-2 space-y-2">
            <p className="font-display italic text-2xl sm:text-3xl text-[#392B33]">
              {t('invitation.parentsPrefix')}{' '}
              <span className="font-semibold text-[#FF007F]">
                {parentsDisplay}
              </span>
            </p>
            <p className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-[#75666E]">
              <MapPin className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span>
                {config.venueName || 'Domicile de Marie et Joseph'} · Yaoundé, Simbock
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <article className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 flex flex-col justify-between space-y-4 transition-transform duration-150 hover:-translate-y-0.5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE5F2] flex items-center justify-center text-[#FF007F]">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#392B33]">
                {t('invitation.cards.meet.index')}
              </h3>
              <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
                {t('invitation.cards.meet.description')}
              </p>
            </div>
          </article>

          <article className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 flex flex-col justify-between space-y-4 transition-transform duration-150 hover:-translate-y-0.5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE5F2] flex items-center justify-center text-[#FF007F]">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#392B33]">
                {t('invitation.cards.family.index')}
              </h3>
              <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
                {t('invitation.cards.family.description')}
              </p>
            </div>
          </article>

          <article className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 flex flex-col justify-between space-y-4 transition-transform duration-150 hover:-translate-y-0.5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE5F2] flex items-center justify-center text-[#FF007F]">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#392B33]">
                {t('invitation.cards.memories.index')}
              </h3>
              <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
                {t('invitation.cards.memories.description')}
              </p>
            </div>
          </article>
        </div>

        <div className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            <LottieIllustration variant="babyMobile" className="w-20 h-20" />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="font-display text-2xl font-semibold text-[#392B33]">
              {t('invitation.whatIsTitle')}
            </h3>
            <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
              {t('invitation.whatIsBody')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
