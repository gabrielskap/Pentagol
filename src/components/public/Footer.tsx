import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, QrCode, RefreshCw, ShieldCheck, Lock, Terminal } from 'lucide-react';
import { useStoreConfig } from '../../contexts/StoreConfigContext';
import { DemoPanelModal } from '../DemoPanelModal';

export const Footer: React.FC = () => {
  const { config, restaurarDadosDemonstracao } = useStoreConfig();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleRestoreData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração da loja? Todas as alterações locais serão redefinidas.')) {
      restaurarDadosDemonstracao();
      alert('Dados de demonstração restaurados com sucesso!');
    }
  };

  return (
    <footer className="bg-gray-800 text-gray-200 text-sm font-body mt-12 border-t-4 border-pg-red">
      {/* Upper Info Banner */}
      <div className="bg-gray-900 border-b border-gray-700 py-6 px-4">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <QrCode className="w-8 h-8 text-pg-yellow flex-shrink-0" />
            <div>
              <h4 className="font-pg-display text-white text-sm">PAGAMENTO VIA PIX</h4>
              <p className="text-xs text-gray-400">Processamento instantâneo com até 5% de desconto</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start space-x-3">
            <ShieldCheck className="w-8 h-8 text-pg-yellow flex-shrink-0" />
            <div>
              <h4 className="font-pg-display text-white text-sm">NF-E ERP SUPRASOFT</h4>
              <p className="text-xs text-gray-400">Emissão fiscal automática e garantia de procedência</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start space-x-3">
            <MapPin className="w-8 h-8 text-pg-yellow flex-shrink-0" />
            <div>
              <h4 className="font-pg-display text-white text-sm">LOJA DE BELO HORIZONTE / MG</h4>
              <p className="text-xs text-gray-400">Envio para todo o Brasil via Correios (PAC/SEDEX)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-[1200px] mx-auto py-10 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Col 1: Sobre */}
        <div>
          <h3 className="font-pg-display text-white text-lg mb-3 tracking-wider">A PENTAGOL</h3>
          <p className="text-xs text-gray-300 leading-relaxed mb-4">
            A Pentagol é a sua loja tradicional de artigos esportivos em Belo Horizonte/MG. Atendemos futebol, vôlei, natação, academia, basquete e muito mais com as principais marcas do mercado.
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p><strong>Telefone:</strong> {config.telefone}</p>
            <p><strong>WhatsApp:</strong> {config.whatsapp}</p>
            <p><strong>E-mail:</strong> {config.email}</p>
          </div>
        </div>

        {/* Col 2: Modalidades */}
        <div>
          <h3 className="font-pg-display text-white text-lg mb-3 tracking-wider">MODALIDADES</h3>
          <ul className="space-y-1.5 text-xs text-gray-300">
            <li><Link to="/categoria/futebol" className="hover:text-white hover:underline">Futebol</Link></li>
            <li><Link to="/categoria/volei" className="hover:text-white hover:underline">Vôlei</Link></li>
            <li><Link to="/categoria/natacao" className="hover:text-white hover:underline">Natação</Link></li>
            <li><Link to="/categoria/academia-e-treino" className="hover:text-white hover:underline">Academia e Treino</Link></li>
            <li><Link to="/categoria/basquete" className="hover:text-white hover:underline">Basquete</Link></li>
            <li><Link to="/categoria/artes-marciais" className="hover:text-white hover:underline">Artes Marciais</Link></li>
          </ul>
        </div>

        {/* Col 3: Marcas & Informações */}
        <div>
          <h3 className="font-pg-display text-white text-lg mb-3 tracking-wider">INSTITUCIONAL</h3>
          <ul className="space-y-1.5 text-xs text-gray-300">
            <li><Link to="/institucional/a-pentagol" className="hover:text-white hover:underline">Sobre a Loja</Link></li>
            <li><Link to="/institucional/politica-de-privacidade" className="hover:text-white hover:underline">Política de Privacidade</Link></li>
            <li><Link to="/institucional/trocas-e-devolucoes" className="hover:text-white hover:underline">Trocas e Devoluções</Link></li>
            <li><Link to="/fale-conosco" className="hover:text-white hover:underline">Atendimento ao Cliente</Link></li>
            <li><Link to="/admin/login" className="text-pg-yellow hover:underline flex items-center space-x-1 mt-2">
              <Lock className="w-3.5 h-3.5 inline" />
              <span>Painel Administrativo</span>
            </Link></li>
          </ul>
        </div>

        {/* Col 4: Marcas & Demo Reset */}
        <div>
          <h3 className="font-pg-display text-white text-lg mb-3 tracking-wider">MARCAS PARCEIRAS</h3>
          <p className="text-xs text-gray-400 mb-4">
            Finta, Hammerhead, Spalding, Topper, Wilson.
          </p>

          <div className="bg-gray-900 border border-gray-700 p-3 rounded-none mt-2 space-y-2">
            <p className="text-xs font-semibold text-gray-300">Ambiente de Demonstração</p>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="w-full bg-pg-orange hover:bg-pg-orange-dark text-white font-pg-display text-xs py-2 px-3 flex items-center justify-center space-x-2 transition-colors focus-visible:ring-2 focus-visible:ring-pg-yellow"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>PAINEL DE DEMO & SIMULADORES</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreData}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-pg-display text-[11px] py-1.5 px-3 flex items-center justify-center space-x-2 transition-colors focus-visible:ring-2 focus-visible:ring-pg-yellow"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESTAURAR SEED ORIGINAL</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-900 py-4 px-4 text-center text-xs text-gray-500 border-t border-gray-800">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 PENTAGOL Esportes - Belo Horizonte / MG. Todos os direitos reservados.</p>
          <div className="flex items-center space-x-4 text-[11px] text-gray-400">
            <span>Integração ERP SupraSoft & PIX Banco Central</span>
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-pg-yellow hover:underline"
            >
              [Painel Demo]
            </button>
          </div>
        </div>
      </div>

      <DemoPanelModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </footer>
  );
};

