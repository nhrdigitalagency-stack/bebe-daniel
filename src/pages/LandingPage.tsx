import React from 'react';
import { Hero } from '../components/sections/Hero';
import { InvitationSection } from '../components/sections/InvitationSection';
import { SchedulePracticalSection } from '../components/sections/SchedulePracticalSection';
import { RsvpSection } from '../components/sections/RsvpSection';
import { MemoriesFaqContactSection } from '../components/sections/MemoriesFaqContactSection';

export const LandingPage: React.FC = () => {
  return (
    <main>
      <Hero />
      <InvitationSection />
      <SchedulePracticalSection />
      <RsvpSection />
      <MemoriesFaqContactSection />
    </main>
  );
};
