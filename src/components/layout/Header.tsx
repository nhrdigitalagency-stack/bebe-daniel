import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Share2, Check } from 'lucide-react';
import { setAppLanguage } from '../../i18n';
import { eventConfig } from '../../config/eventConfig';
import { copyTextToClipboard } from '../../services/whatsappService';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'fr';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleSectionLink = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShare = async () => {
    const shareUrl = eventConfig.siteUrl || window.location.origin;
    const shareTitle = t('meta.eventName');
    const shareText = `${t('meta.eventName')} — ${t('meta.signature')}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to copy
      }
    }

    const copied = await copyTextToClipboard(shareUrl);
    if (copied) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2600);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/75 backdrop-blur-md border-b border-[#FFCCE5]/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Clean Typographic Brand Wordmark (No insignia/icon) */}
        <Link
          to="/"
          className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-[#392B33] hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm"
        >
          {eventConfig.babyName}
        </Link>

        {/* Zone 2: Classic Horizontal Desktop Navigation */}
        <nav
          aria-label="Navigation principale"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#392B33]"
        >
          <button
            type="button"
            onClick={() => handleSectionLink('accueil')}
            className="hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm"
          >
            {t('nav.home')}
          </button>
          <button
            type="button"
            onClick={() => handleSectionLink('invitation')}
            className="hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm"
          >
            {t('nav.invitation')}
          </button>
          <button
            type="button"
            onClick={() => handleSectionLink('programme')}
            className="hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm"
          >
            {t('nav.schedule')}
          </button>
          <button
            type="button"
            onClick={() => handleSectionLink('infos-pratiques')}
            className="hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm"
          >
            {t('nav.practical')}
          </button>
          <Link
            to="/souvenirs"
            className={`hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm ${
              location.pathname === '/souvenirs' ? 'text-[#FF007F] font-semibold' : ''
            }`}
          >
            {t('nav.memories')}
          </Link>
          <Link
            to="/partager-des-photos"
            className={`hover:text-[#FF007F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F] rounded-sm ${
              location.pathname === '/partager-des-photos' ? 'text-[#FF007F] font-semibold' : ''
            }`}
          >
            {t('nav.sharePhotos')}
          </Link>
        </nav>

        {/* Zone 3: Language Switcher & Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Segmented Language Control FR / EN */}
          <div
            role="group"
            aria-label={t('nav.switchLanguage')}
            className="inline-flex items-center p-0.5 rounded-lg bg-white/80 border border-[#FFCCE5]"
          >
            <button
              type="button"
              onClick={() => setAppLanguage('fr')}
              aria-pressed={currentLang === 'fr'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                currentLang === 'fr'
                  ? 'bg-[#FF007F] text-white'
                  : 'text-[#75666E] hover:text-[#392B33]'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setAppLanguage('en')}
              aria-pressed={currentLang === 'en'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                currentLang === 'en'
                  ? 'bg-[#FF007F] text-white'
                  : 'text-[#75666E] hover:text-[#392B33]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSectionLink('confirmation')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#FF007F] hover:bg-[#D9006C] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF007F]"
          >
            {t('nav.rsvpCta')}
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#FFCCE5] bg-white/85 text-[#392B33] hover:bg-[#FFE5F2] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF007F]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden bg-white/95 backdrop-blur-md border-b border-[#FFCCE5] px-4 pt-3 pb-6 space-y-3 shadow-sm"
        >
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleSectionLink('accueil')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#392B33] hover:bg-[#FFF5FA]"
            >
              {t('nav.home')}
            </button>
            <button
              type="button"
              onClick={() => handleSectionLink('invitation')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#392B33] hover:bg-[#FFF5FA]"
            >
              {t('nav.invitation')}
            </button>
            <button
              type="button"
              onClick={() => handleSectionLink('programme')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#392B33] hover:bg-[#FFF5FA]"
            >
              {t('nav.schedule')}
            </button>
            <button
              type="button"
              onClick={() => handleSectionLink('infos-pratiques')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#392B33] hover:bg-[#FFF5FA]"
            >
              {t('nav.practical')}
            </button>
            <Link
              to="/souvenirs"
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#392B33] hover:bg-[#FFF5FA]"
            >
              {t('nav.memories')}
            </Link>
            <Link
              to="/partager-des-photos"
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#392B33] hover:bg-[#FFF5FA]"
            >
              {t('nav.sharePhotos')}
            </Link>
          </div>

          <div className="pt-2 border-t border-[#FFCCE5] flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => handleSectionLink('confirmation')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FF007F] text-white text-sm font-semibold text-center hover:bg-[#D9006C] transition-colors"
            >
              {t('nav.rsvpCta')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2.5 px-4 rounded-xl border border-[#FFCCE5] bg-[#FFF5FA] text-[#392B33] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#FFE5F2] transition-colors"
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4 text-[#FF007F]" />
                  <span>{t('nav.linkCopied')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#FF007F]" />
                  <span>{t('nav.shareInvitation')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
