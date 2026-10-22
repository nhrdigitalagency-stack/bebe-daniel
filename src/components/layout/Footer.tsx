import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Share2, Check, MessageCircle } from 'lucide-react';
import { eventConfig } from '../../config/eventConfig';
import { buildWhatsappUrl, copyTextToClipboard } from '../../services/whatsappService';
import { setAppLanguage } from '../../i18n';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'fr';

  const handleJump = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShareInvitation = async () => {
    const shareUrl = eventConfig.siteUrl || window.location.origin;
    const shareTitle = 'Bienvenue au voir bb du bébé Daniel';
    const shareText = `Bienvenue au voir bb du bébé Daniel — ${shareUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: 'Bienvenue au voir bb du bébé Daniel',
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    const ok = await copyTextToClipboard(shareText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    }
  };

  const directWhatsappHref = buildWhatsappUrl(
    currentLang === 'en'
      ? 'Hello, regarding Meet Baby Daniel:'
      : 'Bonjour, concernant le Voir bébé de Daniel :'
  );

  return (
    <footer className="bg-[#FFF5FA] border-t border-[#FFCCE5] text-[#392B33]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#FFCCE5]">
          <div className="md:col-span-5 space-y-3">
            <p className="font-display text-2xl sm:text-3xl font-semibold text-[#392B33]">
              {t('footer.signature')}
            </p>
            <p className="text-sm text-[#75666E] max-w-md leading-relaxed">
              {t('footer.eventSubtitle')}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShareInvitation}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FFCCE5] bg-white text-xs font-medium text-[#392B33] hover:bg-[#FFE5F2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FF007F]" />
                    <span>{t('nav.linkCopied')}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#FF007F]" />
                    <span>{t('nav.shareInvitation')}</span>
                  </>
                )}
              </button>

              <a
                href={directWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FFCCE5] bg-white text-xs font-medium text-[#392B33] hover:bg-[#FFE5F2] transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#FF007F]" />
                <span>{eventConfig.whatsappDisplayNumber}</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h2 className="text-xs font-semibold tracking-wide text-[#75666E]">
              {t('footer.usefulLinks')}
            </h2>
            <ul className="grid grid-cols-2 gap-2 text-sm text-[#75666E]">
              <li>
                <button
                  type="button"
                  onClick={() => handleJump('invitation')}
                  className="hover:text-[#FF007F] transition-colors cursor-pointer"
                >
                  {t('nav.invitation')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJump('programme')}
                  className="hover:text-[#FF007F] transition-colors cursor-pointer"
                >
                  {t('nav.schedule')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJump('infos-pratiques')}
                  className="hover:text-[#FF007F] transition-colors cursor-pointer"
                >
                  {t('nav.practical')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJump('confirmation')}
                  className="hover:text-[#FF007F] transition-colors cursor-pointer"
                >
                  {t('nav.rsvpCta')}
                </button>
              </li>
              <li>
                <Link to="/souvenirs" className="hover:text-[#FF007F] transition-colors">
                  {t('nav.memories')}
                </Link>
              </li>
              <li>
                <Link to="/partager-des-photos" className="hover:text-[#FF007F] transition-colors">
                  {t('nav.sharePhotos')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <div className="flex flex-col space-y-2 text-sm text-[#75666E]">
              <Link
                to="/confidentialite"
                className="hover:text-[#FF007F] transition-colors font-medium text-[#392B33]"
              >
                {t('footer.privacyLink')}
              </Link>
              <Link to="/admin" className="hover:text-[#FF007F] transition-colors">
                {t('footer.adminLink')}
              </Link>
            </div>

            <div className="pt-2">
              <div
                role="group"
                aria-label={t('nav.switchLanguage')}
                className="inline-flex items-center p-0.5 rounded-lg bg-white border border-[#FFCCE5]"
              >
                <button
                  type="button"
                  onClick={() => setAppLanguage('fr')}
                  aria-pressed={currentLang === 'fr'}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    currentLang === 'fr'
                      ? 'bg-[#FF007F] text-white'
                      : 'text-[#75666E] hover:text-[#392B33]'
                  }`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => setAppLanguage('en')}
                  aria-pressed={currentLang === 'en'}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    currentLang === 'en'
                      ? 'bg-[#FF007F] text-white'
                      : 'text-[#75666E] hover:text-[#392B33]'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#75666E]">
          <p>{t('meta.eventName')} · {t('meta.signature')}</p>
          <p>{t('memoriesPreview.privacyBadge')}</p>
        </div>
      </div>
    </footer>
  );
};
