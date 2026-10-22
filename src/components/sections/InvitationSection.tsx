import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Users, Camera, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useEventSettings } from '../../context/EventSettingsContext';
import { LottieIllustration } from '../ui/LottieIllustration';

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

  const cards = [
    {
      key: 'meet',
      icon: Heart,
      index: t('invitation.cards.meet.index'),
      description: t('invitation.cards.meet.description'),
    },
    {
      key: 'family',
      icon: Users,
      index: t('invitation.cards.family.index'),
      description: t('invitation.cards.family.description'),
    },
    {
      key: 'memories',
      icon: Camera,
      index: t('invitation.cards.memories.index'),
      description: t('invitation.cards.memories.description'),
    },
  ];

  return (
    <section
      id="invitation"
      className="py-16 sm:py-24 bg-[#FFFFFF] border-b border-[#FFCCE5] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          className="max-w-3xl mx-auto text-center space-y-5"
        >
          <div className="flex justify-center">
            <LottieIllustration variant="sleepingCloud" className="w-16 h-16" />
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#FF007F] tracking-wide uppercase">
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
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.14 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <motion.article
                key={card.key}
                variants={{
                  hidden: { opacity: 0, y: 26 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
                  },
                }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FFE5F2] flex items-center justify-center text-[#FF007F]">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[#392B33]">
                    {card.index}
                  </h3>
                  <p className="text-sm sm:text-base text-[#75666E] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          className="rounded-2xl bg-[#FFF5FA] border border-[#FFCCE5] p-6 sm:p-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6 shadow-xs"
        >
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
        </motion.div>
      </div>
    </section>
  );
};
