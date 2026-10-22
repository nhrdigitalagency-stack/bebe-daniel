import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './i18n';
import { EventSettingsProvider } from './context/EventSettingsContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { MemoriesGalleryPage } from './pages/MemoriesGalleryPage';
import { SharePhotosPage } from './pages/SharePhotosPage';
import { AdminPage } from './pages/AdminPage';
import { PrivacyPage } from './pages/PrivacyPage';

const ScrollManager: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
};

export default function App() {
  return (
    <EventSettingsProvider>
      <BrowserRouter>
        <ScrollManager />
        <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#392B33] overflow-x-hidden">
          <Header />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/souvenirs" element={<MemoriesGalleryPage />} />
              <Route path="/partager-des-photos" element={<SharePhotosPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/confidentialite" element={<PrivacyPage />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </EventSettingsProvider>
  );
}
