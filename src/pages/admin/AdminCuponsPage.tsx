import React, { useState } from 'react';
import { Copy, Plus, Share2, Ticket, Trash2 } from 'lucide-react';
import { deleteRecord, getAll, upsert } from '../../lib/db';
import { Cupom, Pedido } from '../../types';

export const AdminCuponsPage: React.FC = () => {
  const [cupons, setCupons] = useState<Cupom[]>(getAll<Cupom>('cupons'));
  const pedidos = getAll<Pedido>('pedidos');

  // Form State
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [percentual, setPercentual] = useState<number>(10);
  const [valorMinimo, setValorMinimo] = useState<number>(100);
  const [validadeInicio, setValidadeInicio] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [validadeFim, setValidadeFim] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [usosMaximos, setUsosMaximos] = useState<number>(100);
  const [automatico, setAutomatico] = useState<boolean>(false);
  const [copiadoTexto, setCopiadoTexto] = useState<string | null>(null);

  const recarregarCupons = () => {
    setCupons(getAll<Cupom>('cupons'));
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();

    const codigoFormatted = codigo.toUpperCase().replace(/\s+/g, '');
    if (!codigoFormatted) {
      alert('Informe o código do cupom.');
      return;
    }

    // Check duplicate code
    const duplicado = cupons.find((c) => c.codigo.toUpperCase() === codigoFormatted);
    if (duplicado) {
      alert(`O cupom ${codigoFormatted} já está cadastrado.`);
      return;
    }

    // Validate dates
    const dataInicio = new Date(validadeInicio);
    const dataFim = new Date(validadeFim);
    if (dataFim <= dataInicio) {
      alert('A data de fim da validade deve ser maior que a data de início.');
      return;
    }

    const novo: Cupom = {
      id: `cupom-${Date.now()}`,
      codigo: codigoFormatted,
      descricao: descricao || `${percentual}% de desconto no site`,
      percentual: Number(percentual),
      valorMinimoPedido: Number(valorMinimo),
      automatico,
      validadeInicio: new Date(validadeInicio).toISOString(),
      validadeFim: new Date(validadeFim + 'T23:59:59').toISOString(),
      usosMaximos: Number(usosMaximos),
      usos: 0,
      ativo: true,
    };

    upsert('cupons', novo);
    recarregarCupons();

    // Reset Form
    setCodigo('');
    setDescricao('');
    setPercentual(10);
    setValorMinimo(100);
    alert('Cupom de desconto criado com sucesso!');
  };

  const handleToggleAtivo = (cupom: Cupom) => {
    const atualizado = { ...cupom, ativo: !cupom.ativo };
    upsert('cupons', atualizado);
    recarregarCupons();
  };

  const handleExcluir = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      deleteRecord('cupons', id);
      recarregarCupons();
    }
  };

  const handleCopiarTextoRedes = (cupom: Cupom) => {
    const texto = `🔥 DESCONTO ESPECIAL PENTAGOL! Use o cupom ${cupom.codigo} e garanta ${cupom.percentual}% OFF no seu pedido! Acesse pentagol.com.br e aproveite! ⚽🔥`;
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(cupom.id);
    setTimeout(() => setCopiadoTexto(null), 2500);
  };

  const calcularStatusCupom = (c: Cupom) => {
    if (!c.ativo) {
      return { label: 'Inativo', class: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
    const agora = new Date().getTime();
    const inicio = new Date(c.validadeInicio).getTime();
    const fim = new Date(c.validadeFim).getTime();

    if (agora < inicio) {
      return { label: 'Agendado', class: 'bg-sky-100 text-sky-800 border-sky-300' };
    }
    if (agora > fim) {
      return { label: 'Expirado', class: 'bg-red-100 text-red-800 border-red-300' };
    }
    if (c.usosMaximos && c.usos >= c.usosMaximos) {
      return { label: 'Esgotado', class: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    return { label: 'Ativo', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  // Compute total discount given by each coupon across all orders
  const calcularTotalDescontoPorCupom = (codigoCupom: string) => {
    return pedidos
      .filter((p) => p.cupomCodigo?.toUpperCase() === codigoCupom.toUpperCase())
      .reduce((acc, p) => acc + (p.descontoCupom || 0), 0);
  };

  return (
    <div className="space-y-6 font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs">
        <h1 className="font-pg-display text-2xl text-gray-900 uppercase">GESTÃO DE CUPONS DE DESCONTO</h1>
        <p className="text-xs text-gray-500">
          Crie promoções, cupons de primeira compra, cupons automáticos e acompanhe o uso e métricas de conversão
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM NOVO CUPOM */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs space-y-4">
          <h3 className="font-pg-display text-base text-gray-800 border-b pb-2 uppercase flex items-center space-x-1.5">
            <Ticket className="w-4 h-4 text-pg-red" />
            <span>CADASTRAR NOVO CUPOM</span>
          </h3>

          <form onSubmit={handleCadastrar} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Código do Cupom *</label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                placeholder="Ex: PENTAGOL10"
                className="w-full border border-gray-300 p-2 font-mono uppercase font-bold focus:outline-none focus:border-pg-red"
              />
              <span className="text-[10px] text-gray-400">Em caixa alta sem espaços.</span>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Descrição Comercial</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: 10% OFF na primeira compra em todo o site"
                className="w-full border border-gray-300 p-2 font-body focus:outline-none focus:border-pg-red"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Desconto (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={percentual}
                  onChange={(e) => setPercentual(parseFloat(e.target.value))}
                  className="w-full border border-gray-300 p-2 font-mono focus:outline-none focus:border-pg-red"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Valor Mín. Pedido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(parseFloat(e.target.value))}
                  className="w-full border border-gray-300 p-2 font-mono focus:outline-none focus:border-pg-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Validade Início *</label>
                <input
                  type="date"
                  required
                  value={validadeInicio}
                  onChange={(e) => setValidadeInicio(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-body"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Validade Fim *</label>
                <input
                  type="date"
                  required
                  value={validadeFim}
                  onChange={(e) => setValidadeFim(e.target.value)}
                  className="w-full border border-gray-300 p-2 font-body"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Limite Total de Usos</label>
              <input
                type="number"
                min="1"
                value={usosMaximos}
                onChange={(e) => setUsosMaximos(parseInt(e.target.value))}
                className="w-full border border-gray-300 p-2 font-mono"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="automatico"
                checked={automatico}
                onChange={(e) => setAutomatico(e.target.checked)}
                className="w-4 h-4 text-pg-red focus:ring-0 rounded-none cursor-pointer"
              />
              <label htmlFor="automatico" className="text-xs text-gray-700 cursor-pointer">
                Aplicar automaticamente no checkout acima do valor mínimo
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-xs py-2.5 px-3 shadow flex items-center justify-center space-x-1 uppercase tracking-tight"
            >
              <Plus className="w-4 h-4" />
              <span>CRIAR CUPOM</span>
            </button>
          </form>
        </div>

        {/* LISTA DE CUPONS */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-5 shadow-xs overflow-x-auto">
          <h3 className="font-pg-display text-base text-gray-800 border-b pb-3 uppercase mb-3">
            CUPONS CADASTRADOS ({cupons.length})
          </h3>

          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Desconto</th>
                <th className="py-2.5 px-3">Período Validade</th>
                <th className="py-2.5 px-3">Usos / Limite</th>
                <th className="py-2.5 px-3">Total Descontado</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-body">
              {cupons.map((c) => {
                const statusInfo = calcularStatusCupom(c);
                const totalDesconto = calcularTotalDescontoPorCupom(c.codigo);

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-pg-red">
                      {c.codigo}
                      {c.automatico && (
                        <span className="block text-[9px] text-sky-700 font-bold font-body uppercase">
                          (Automático)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      {c.percentual}% OFF
                      {c.valorMinimoPedido ? (
                        <span className="block text-[10px] text-gray-500 font-normal">
                          Mín. R$ {c.valorMinimoPedido.toFixed(2)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-gray-600 whitespace-nowrap">
                      {new Date(c.validadeInicio).toLocaleDateString('pt-BR')} até{' '}
                      {new Date(c.validadeFim).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-700 whitespace-nowrap">
                      {c.usos} / {c.usosMaximos || '∞'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800 whitespace-nowrap">
                      R$ {totalDesconto.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        title="Copiar texto formatado para Redes Sociais"
                        onClick={() => handleCopiarTextoRedes(c)}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-200 p-1 hover:bg-indigo-100 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title={c.ativo ? 'Desativar' : 'Ativar'}
                        onClick={() => handleToggleAtivo(c)}
                        className={`px-2 py-1 text-[10px] font-pg-display uppercase border font-bold ${
                          c.ativo
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {c.ativo ? 'PAUSAR' : 'ATIVAR'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluir(c.id)}
                        className="bg-pg-red text-white p-1 hover:bg-opacity-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {copiadoTexto === c.id && (
                        <span className="block text-[9px] text-emerald-700 font-bold mt-0.5">
                          Texto copiado!
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {cupons.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-body">
              Nenhum cupom cadastrado até o momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
