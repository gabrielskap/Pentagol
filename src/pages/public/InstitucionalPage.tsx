import React from 'react';
import { useParams } from 'react-router-dom';

export const InstitucionalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  let titulo = 'INSTITUCIONAL PENTAGOL';
  let conteudo = (
    <p>A Pentagol Esportes é referência em artigos esportivos em Belo Horizonte - MG...</p>
  );

  if (slug === 'a-pentagol' || slug === 'sobre-a-loja') {
    titulo = 'SOBRE A PENTAGOL ESPORTES';
    conteudo = (
      <div className="space-y-3 text-xs leading-relaxed text-gray-700">
        <p>
          Fundada em Belo Horizonte / MG, a <strong>Pentagol Esportes</strong> é uma loja tradicional especializada na distribuição e varejo de materiais esportivos de alta performance e uso recreativo.
        </p>
        <p>
          Atendemos atletas, clubes, escolas, academias e entusiastas do esporte com uma ampla variedade de modalidades: Futebol (campo, society, futsal), Vôlei, Natação, Basquete, Artes Marciais, Corrida e Treino Funcional.
        </p>
        <p>
          Nossa operação física conta com estoque próprio e atendimento personalizado. Na loja virtual, garantimos processamento ágil via PIX com emissão fiscal automatizada pelo ERP SupraSoft e envio seguro via Correios.
        </p>
      </div>
    );
  } else if (slug === 'politica-de-privacidade') {
    titulo = 'POLÍTICA DE PRIVACIDADE';
    conteudo = (
      <div className="space-y-3 text-xs leading-relaxed text-gray-700">
        <p>
          A Pentagol Esportes respeita a privacidade e a proteção de dados de seus clientes, conforme prevê a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>
        <p>
          Os dados cadastrais (CPF, endereço, e-mail e telefone) são utilizados exclusivamente para emissão de Nota Fiscal Eletrônica (NF-e) e entrega de mercadorias.
        </p>
      </div>
    );
  } else if (slug === 'trocas-e-devolucoes') {
    titulo = 'POLÍTICA DE TROCAS E DEVOLUÇÕES';
    conteudo = (
      <div className="space-y-3 text-xs leading-relaxed text-gray-700">
        <p>
          Conforme o Código de Defesa do Consumidor, o cliente possui até 7 (sete) dias corridos após o recebimento do produto para solicitar a devolução por arrependimento.
        </p>
        <p>
          Para trocas por tamanho ou defeito de fabricação, entre em contato via WhatsApp ou e-mail munido da Nota Fiscal Eletrônica emitida pela Pentagol.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
      <h1 className="font-pg-display text-2xl text-pg-ink border-b border-pg-red pb-2 uppercase">
        {titulo}
      </h1>
      <div>{conteudo}</div>
    </div>
  );
};
