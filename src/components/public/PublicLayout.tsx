import React from 'react';
import { Outlet } from 'react-router-dom';
import { BackToTopButton } from './BackToTopButton';
import { Footer } from './Footer';
import { Header } from './Header';
import { WhatsAppButton } from './WhatsAppButton';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5] font-body text-gray-800">
      <Header />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <BackToTopButton />
    </div>
  );
};
