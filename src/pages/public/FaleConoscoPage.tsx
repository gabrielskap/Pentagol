import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useStoreConfig } from '../../contexts/StoreConfigContext';

export const FaleConoscoPage: React.FC = () => {
  const { config } = useStoreConfig();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
    setNome('');
    setEmail('');
    setAssunto('');
    setMensagem('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-pg-petrol text-white p-4 shadow-sm">
        <h1 className="font-pg-display text-2xl tracking-wider uppercase">FALE CONOSCO / ATENDIMENTO</h1>
        <p className="text-xs text-gray-200 mt-1">Estamos à disposição para dúvidas sobre produtos, entregas e pedidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-pg-display text-lg text-gray-800 border-b pb-2 uppercase">ENVIE UMA MENSAGEM</h3>

          {enviado && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3">
              Sua mensagem foi enviada com sucesso! Responderemos em breve.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Seu Nome *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Seu E-mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Assunto *</label>
              <input
                type="text"
                required
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Mensagem *</label>
              <textarea
                required
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <button
              type="submit"
              className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs px-5 py-2.5 shadow"
            >
              ENVIAR MENSAGEM
            </button>
          </form>
        </div>

        {/* Informações de Contato */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-pg-display text-lg text-gray-800 border-b pb-2 uppercase">CONTATOS DA LOJA</h3>

          <div className="space-y-4 text-xs text-gray-700">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-pg-red flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-gray-900">Endereço da Loja Física:</strong>
                <p>Belo Horizonte / MG - Brasil</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-pg-red flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-gray-900">Telefones:</strong>
                <p>Telefone: {config.telefone}</p>
                <p>WhatsApp: {config.whatsapp}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-pg-red flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-gray-900">Atendimento por E-mail:</strong>
                <p>{config.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
