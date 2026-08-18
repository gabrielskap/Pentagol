import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { useStoreConfig } from '../../contexts/StoreConfigContext';
import { ConfigLoja } from '../../types';

export const AdminConfiguracoesPage: React.FC = () => {
  const { config, atualizarConfig, restaurarDadosDemonstracao } = useStoreConfig();

  // Form State
  const [nomeLoja, setNomeLoja] = useState(config.nomeLoja || 'PENTAGOL Esportes');
  const [cnpj, setCnpj] = useState(config.cnpj || '12.345.678/0001-90');
  const [telefone, setTelefone] = useState(config.telefone || '+55 31 3429 1800');
  const [whatsapp, setWhatsapp] = useState(config.whatsapp || '+55 31 99876 5432');
  const [email, setEmail] = useState(config.email || 'atendimento@pentagol.com.br');
  const [endereco, setEndereco] = useState(config.endereco || 'Rua Tupis, 450 - Centro');
  const [cidade, setCidade] = useState(config.cidade || 'Belo Horizonte');
  const [uf, setUf] = useState(config.uf || 'MG');
  const [cepOrigem, setCepOrigem] = useState(config.cepOrigem || '30110-000');
  const [prazoAdicionalDias, setPrazoAdicionalDias] = useState<number>(
    config.prazoAdicionalDias || 2
  );

  // Financial & Pix
  const [descontoPixPorcentagem, setDescontoPixPorcentagem] = useState<number>(
    config.descontoPixPorcentagem || 5
  );
  const [chavePixDefault, setChavePixDefault] = useState(
    config.chavePixDefault || '12345678000190'
  );
  const [pixExpiracaoMinutos, setPixExpiracaoMinutos] = useState<number>(
    config.pixExpiracaoMinutos || 30
  );

  // Automatic Coupon & Shipping
  const [cupomAutomaticoAtivo, setCupomAutomaticoAtivo] = useState(
    config.cupomAutomaticoAtivo ?? true
  );
  const [valorMinimoCupomAutomatico, setValorMinimoCupomAutomatico] = useState<number>(
    config.valorMinimoCupomAutomatico || 100
  );
  const [percentualCupomAutomatico, setPercentualCupomAutomatico] = useState<number>(
    config.percentualCupomAutomatico || 5
  );
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState<number>(
    config.freteGratisAcimaDe || 299.9
  );
  const [textoTopo, setTextoTopo] = useState(
    config.textoTopo ||
      'PENTAGOL - Artigos Esportivos em Belo Horizonte/MG | Pagamento facilitado no PIX'
  );

  // Demo / Prod Mode Toggles
  const [modoServicos, setModoServicos] = useState(
    config.modoServicos || {
      viacep: 'demo',
      correios: 'demo',
      pix: 'demo',
      erp: 'demo',
      nfe: 'demo',
    }
  );

  const [salvoFeedback, setSalvoFeedback] = useState(false);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();

    const novaConfig: ConfigLoja = {
      ...config,
      nomeLoja,
      cnpj,
      telefone,
      whatsapp,
      email,
      endereco,
      cidade,
      uf,
      cepOrigem,
      prazoAdicionalDias: Number(prazoAdicionalDias),
      descontoPixPorcentagem: Number(descontoPixPorcentagem),
      chavePixDefault,
      pixExpiracaoMinutos: Number(pixExpiracaoMinutos),
      cupomAutomaticoAtivo,
      valorMinimoCupomAutomatico: Number(valorMinimoCupomAutomatico),
      percentualCupomAutomatico: Number(percentualCupomAutomatico),
      freteGratisAcimaDe: Number(freteGratisAcimaDe),
      textoTopo,
      modoServicos,
    };

    atualizarConfig(novaConfig);
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 3000);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'Atenção: Deseja restaurar todos os dados do banco local para os valores originais de demonstração Pentagol?'
      )
    ) {
      restaurarDadosDemonstracao();
      alert('Dados de demonstração restaurados!');
      window.location.reload();
    }
  };

  const numWhatsAppClean = whatsapp.replace(/\D/g, '');

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            CONFIGURAÇÕES GERAIS DA LOJA
          </h1>
          <p className="text-xs text-gray-500">
            Ajuste dados institucionais, regras de frete, PIX, cupom automático e modo das integrações
          </p>
        </div>

        {salvoFeedback && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 font-bold animate-pulse">
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSalvar} className="space-y-6 text-xs">
        {/* 1. INSTITUCIONAL & CONTATO */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
            1. INSTITUCIONAL, CONTATO & ATENDIMENTO
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nome Fantasia da Loja *</label>
              <input
                type="text"
                required
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">CNPJ (para NF-e SEFAZ) *</label>
              <input
                type="text"
                required
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full border border-gray-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">E-mail de Atendimento *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Telefone Fixo SAC *</label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">WhatsApp de Atendimento *</label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">CEP de Origem (Logística) *</label>
              <input
                type="text"
                required
                value={cepOrigem}
                onChange={(e) => setCepOrigem(e.target.value)}
                className="w-full border border-gray-300 p-2 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Endereço da Sede/Loja Física *</label>
              <input
                type="text"
                required
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Cidade / UF *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Belo Horizonte"
                  className="w-2/3 border border-gray-300 p-2 font-body"
                />
                <input
                  type="text"
                  required
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  placeholder="MG"
                  className="w-1/3 border border-gray-300 p-2 font-mono uppercase text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. REGRAS DE FRETE & CUPOM AUTOMÁTICO */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
            2. LOGÍSTICA & VENDAS AUTOMÁTICAS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Prazo Adicional de Expedição (dias úteis)
              </label>
              <input
                type="number"
                min="0"
                value={prazoAdicionalDias}
                onChange={(e) => setPrazoAdicionalDias(parseInt(e.target.value))}
                className="w-full border border-gray-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Valor para Frete Grátis (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={freteGratisAcimaDe}
                onChange={(e) => setFreteGratisAcimaDe(parseFloat(e.target.value))}
                className="w-full border border-gray-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Tempo de Expiração do PIX (minutos)
              </label>
              <input
                type="number"
                min="5"
                value={pixExpiracaoMinutos}
                onChange={(e) => setPixExpiracaoMinutos(parseInt(e.target.value))}
                className="w-full border border-gray-300 p-2 font-mono"
              />
            </div>

            <div className="sm:col-span-3 border-t pt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cupomAuto"
                  checked={cupomAutomaticoAtivo}
                  onChange={(e) => setCupomAutomaticoAtivo(e.target.checked)}
                  className="w-4 h-4 text-pg-red cursor-pointer"
                />
                <label htmlFor="cupomAuto" className="font-bold text-gray-800 cursor-pointer">
                  Ativar Cupom de Desconto Automático no Carrinho
                </label>
              </div>

              {cupomAutomaticoAtivo && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 border">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Valor Mínimo do Pedido para Cupom (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorMinimoCupomAutomatico}
                      onChange={(e) =>
                        setValorMinimoCupomAutomatico(parseFloat(e.target.value))
                      }
                      className="w-full border border-gray-300 p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Percentual de Desconto Automático (%)
                    </label>
                    <input
                      type="number"
                      value={percentualCupomAutomatico}
                      onChange={(e) =>
                        setPercentualCupomAutomatico(parseFloat(e.target.value))
                      }
                      className="w-full border border-gray-300 p-2 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-gray-700 block mb-1">
                Texto da Faixa de Alertas do Topo (Announcement Bar)
              </label>
              <input
                type="text"
                value={textoTopo}
                onChange={(e) => setTextoTopo(e.target.value)}
                className="w-full border border-gray-300 p-2 font-body"
              />
            </div>
          </div>
        </div>

        {/* 3. PREVIEW DO WIDGET FLUTUANTE DO WHATSAPP */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-3">
          <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase flex items-center space-x-1.5">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>PRÉ-VISUALIZAÇÃO DO WIDGET FLUTUANTE DO WHATSAPP</span>
          </h3>

          <div className="bg-gray-100 p-6 border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-gray-800">Botão Flutuante do Cliente:</p>
              <p className="text-gray-500 text-xs">
                Exibido no canto inferior do site público para atendimento direto pelo SAC.
              </p>
              <p className="text-xs font-mono text-emerald-800 font-bold">
                Número configurado: {whatsapp}
              </p>
            </div>

            {/* PREVIEW DO BOTÃO */}
            <a
              href={`https://wa.me/55${numWhatsAppClean}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-3 rounded-full shadow-lg inline-flex items-center space-x-2 transition-transform hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 fill-white" />
              <span className="text-xs font-pg-display uppercase">Fale com a Pentagol</span>
            </a>
          </div>
        </div>

        {/* 4. CHAVEAMENTO MODO DEMO / PRODUÇÃO DAS INTEGRAÇÕES */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-pg-petrol" />
            <span>MODO DE OPERAÇÃO DAS INTEGRAÇÕES (DEMO VS PRODUÇÃO)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'ViaCEP (Endereços)', key: 'viacep' },
              { label: 'Correios (Frete & Rastreio)', key: 'correios' },
              { label: 'Pix Banco Central', key: 'pix' },
              { label: 'SupraSoft ERP', key: 'erp' },
              { label: 'Emissor NF-e SEFAZ', key: 'nfe' },
            ].map((serv) => (
              <div key={serv.key} className="bg-gray-50 p-3 border space-y-1.5">
                <label className="font-bold text-gray-800 block">{serv.label}</label>
                <select
                  value={(modoServicos as any)[serv.key] || 'demo'}
                  onChange={(e) =>
                    setModoServicos({
                      ...modoServicos,
                      [serv.key]: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 p-1.5 font-body text-xs"
                >
                  <option value="demo">Modo Demonstração (Simulado)</option>
                  <option value="prod">Modo Produção (API Real)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÕES DE SALVAR / RESET */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs flex justify-between items-center">
          <button
            type="button"
            onClick={handleResetDemo}
            className="bg-gray-800 hover:bg-black text-white font-pg-display text-xs px-4 py-2.5 flex items-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RESTAURAR BANCO MOCK DEMO</span>
          </button>

          <button
            type="submit"
            className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-sm px-6 py-2.5 shadow-xs flex items-center space-x-1.5 uppercase tracking-tight"
          >
            <Save className="w-4 h-4" />
            <span>SALVAR CONFIGURAÇÕES</span>
          </button>
        </div>
      </form>
    </div>
  );
};
