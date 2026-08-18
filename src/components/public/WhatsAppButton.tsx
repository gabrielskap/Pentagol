import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStoreConfig } from '../../contexts/StoreConfigContext';

interface WhatsAppButtonProps {
  mensagem?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ mensagem }) => {
  const { config } = useStoreConfig();

  if (!config?.whatsapp) return null;

  const phoneClean = config.whatsapp.replace(/\D/g, '');
  const msgDefault = mensagem || `Olá, Pentagol! Gostaria de mais informações sobre os artigos esportivos.`;
  const whatsappUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msgDefault)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3 sm:p-3.5 rounded-full shadow-2xl flex items-center justify-center group transition-all duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
      title="Atendimento via WhatsApp - Pentagol"
      aria-label="Atendimento via WhatsApp"
    >
      <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-xs font-bold font-pg-display uppercase tracking-wider">
        Fale no WhatsApp
      </span>
    </a>
  );
};
