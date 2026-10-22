import React, { useEffect, useRef, useState } from 'react';
import { Lottie, LottieHandle } from 'lottie-react';
import { BabyLottieVariant, LOTTIE_MAP } from '../../assets/lotties/babyLotties';

interface LottieIllustrationProps {
  variant: BabyLottieVariant;
  className?: string;
  label?: string;
}

export const LottieIllustration: React.FC<LottieIllustrationProps> = ({
  variant,
  className = 'w-16 h-16',
  label,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lottieRef = useRef<LottieHandle | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!lottieRef.current) return;
    if (prefersReducedMotion || !isVisible) {
      lottieRef.current.pause();
    } else {
      lottieRef.current.play();
    }
  }, [prefersReducedMotion, isVisible]);

  const animationData = LOTTIE_MAP[variant];

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center justify-center select-none ${className}`}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={!label}
    >
      {animationData ? (
        <Lottie
          lottieRef={lottieRef}
          src={animationData}
          loop={!prefersReducedMotion}
          autoplay={!prefersReducedMotion && isVisible}
          className="w-full h-full"
        />
      ) : null}
    </div>
  );
};
