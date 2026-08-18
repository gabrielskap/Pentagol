import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getAll } from '../../lib/db';
import { cepService, freteService } from '../../services';
import { Frete, Produto, Variacao } from '../../types';

export const CarrinhoPage: React.FC = () => {
  const { cliente, logado } = useAuth();
  const {
    itens,
    subtotal,
    desconto,
    cupom,
    frete,
    total,
    isUpdating,
    removerItem,
    atualizarQuantidade,
    trocarVariacao,
    aplicarCupom,
    removerCupom,
    selecionarFrete,
    mesclarCarrinhoAoLogar,
  } = useCart();

  const navigate = useNavigate();

  // Merge cart when user logs in
  useEffect(() => {
    if (logado && cliente) {
      mesclarCarrinhoAoLogar(cliente.id);
    }
  }, [logado, cliente]);

  // Coupon state
  const [codigoCupomInput, setCodigoCupomInput] = useState('');
  const [mensagemCupom, setMensagemCupom] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null
  );

  // Shipping state
  const [cepFreteInput, setCepFreteInput] = useState('');
  const [opcoesFrete, setOpcoesFrete] = useState<Frete[]>([]);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  // Inline delete confirmation state (variacaoId -> boolean)
  const [confirmarRemocaoId, setConfirmarRemocaoId] = useState<string | null>(null);

  // Load all current DB variations for stock alerts and size switching
  const todasVariacoes = getAll<Variacao>('variacoes');
  const todosProdutos = getAll<Produto>('produtos');

  // Stock alerts check
  const temAlertaEstoque = itens.some((item) => {
    const vAtual = todasVariacoes.find((v) => v.id === item.variacaoId);
    return !vAtual || !vAtual.ativo || vAtual.estoque < item.quantidade;
  });

  // Handle Coupon Submit
  const handleAplicarCupom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoCupomInput.trim()) return;
    const res = aplicarCupom(codigoCupomInput);
    if (res.sucesso) {
      setMensagemCupom({ tipo: 'ok', texto: res.mensagem });
      setCodigoCupomInput('');
    } else {
      setMensagemCupom({ tipo: 'erro', texto: res.mensagem });
    }
  };

  // Mask CEP input
  const handleCepInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    if (val.length > 5) {
      val = `${val.substring(0, 5)}-${val.substring(5)}`;
    }
    setCepFreteInput(val);
  };

  // Handle Freight Calculation
  const handleCalcularFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroFrete(null);

    const cleanCep = cepFreteInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setErroFrete('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setCalculandoFrete(true);
    try {
      await cepService.consultarCep(cleanCep);
      const pesoTotal = itens.reduce((s, i) => s + i.pesoKg * i.quantidade, 0);
      const res = await freteService.calcularFrete(cleanCep, pesoTotal, subtotal);
      setOpcoesFrete(res);
      if (res.length > 0) {
        selecionarFrete(res[0]);
      }
    } catch (err: any) {
      setErroFrete(err.message || 'Erro ao calcular o frete.');
    } finally {
      setCalculandoFrete(false);
    }
  };

  // Proceed to checkout
  const handleFinalizarCompra = () => {
    if (temAlertaEstoque) return;

    if (!logado) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  // Render Empty State
  if (itens.length === 0) {
    return (
      <div className="space-y-8 pb-12 font-body">
        {/* PROGRESS BAR AT TOP */}
        <div className="bg-white border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-pg-display uppercase font-bold">
            <span className="text-pg-red flex items-center space-x-1 border-b-2 border-pg-red pb-1">
              <span>1. Carrinho</span>
            </span>
            <span className="text-gray-300">&gt;</span>
            <span className="text-gray-400">2. Identificação</span>
            <span className="text-gray-300">&gt;</span>
            <span className="text-gray-400">3. Entrega</span>
            <span className="text-gray-300">&gt;</span>
            <span className="text-gray-400">4. Pagamento</span>
          </div>
        </div>

        {/* EMPTY STATE BOX */}
        <div className="bg-white border border-gray-200 p-12 text-center shadow-xs space-y-6 max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <div>
            <h2 className="font-pg-display text-2xl font-bold uppercase text-pg-ink">
              SEU CARRINHO ESTÁ VAZIO
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Você ainda não adicionou nenhum artigo esportivo ao seu carrinho. Explore nossas categorias abaixo e aproveite o desconto de 5% no PIX!
            </p>
          </div>

          {/* QUICK CATEGORY BUTTONS */}
          <div className="space-y-2 pt-2">
            <p className="font-pg-display text-xs text-gray-700 uppercase font-bold">
              MODALIDADES MAIS BUSCADAS:
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {[
                { label: 'FUTEBOL', slug: 'futebol' },
                { label: 'VÔLEI', slug: 'volei' },
                { label: 'BASQUETE', slug: 'basquete' },
                { label: 'NATAÇÃO', slug: 'natacao' },
                { label: 'ACADEMIA E TREINO', slug: 'academia-e-treino' },
                { label: 'VER TODOS OS PRODUTOS', slug: 'produtos' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categoria/${cat.slug}`}
                  className="bg-gray-100 hover:bg-pg-petrol hover:text-white text-gray-800 font-pg-display text-xs uppercase font-bold px-3.5 py-2 transition-colors border border-gray-200"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-body select-none">
      {/* PROGRESS BAR AT TOP */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto text-xs font-pg-display uppercase font-bold">
          <span className="text-pg-red flex items-center space-x-1 border-b-2 border-pg-red pb-1">
            <span>1. Carrinho</span>
          </span>
          <span className="text-gray-300">&gt;</span>
          <span className="text-gray-400">2. Identificação</span>
          <span className="text-gray-300">&gt;</span>
          <span className="text-gray-400">3. Entrega</span>
          <span className="text-gray-300">&gt;</span>
          <span className="text-gray-400">4. Pagamento</span>
        </div>
      </div>

      {/* HEADER BAR */}
      <div className="bg-pg-petrol text-white p-4 shadow-xs flex items-center justify-between">
        <h1 className="font-pg-display text-xl sm:text-2xl font-bold tracking-wide uppercase italic">
          CARRINHO DE COMPRAS
        </h1>
        <div className="flex items-center space-x-2">
          {isUpdating && (
            <span className="text-[11px] bg-pg-yellow text-pg-ink px-2 py-0.5 font-bold animate-pulse flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>recalculando...</span>
            </span>
          )}
          <span className="text-xs font-bold bg-black/30 px-3 py-1 font-mono">
            {itens.length} item(ns)
          </span>
        </div>
      </div>

      {/* STOCK ALERT BANNER IF APPLICABLE */}
      {temAlertaEstoque && (
        <div className="bg-amber-50 border-2 border-pg-orange p-4 flex items-start space-x-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-pg-orange shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold uppercase font-pg-display text-sm text-pg-orange">
              Atenção: Estoque Alterado
            </p>
            <p>
              Um ou mais itens no seu carrinho sofreram alteração de estoque. Por favor, ajuste as quantidades ou altere o tamanho dos itens destacados para prosseguir com a compra.
            </p>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ITEM TABLE & PROMOTIONS (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 shadow-xs divide-y divide-gray-200 overflow-hidden">
            {/* TABLE HEADER (DESKTOP) */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 p-3 bg-gray-50 text-[11px] font-pg-display uppercase font-bold text-gray-600 border-b border-gray-200">
              <div className="col-span-6">Produto / Variação</div>
              <div className="col-span-2 text-center">Qtd.</div>
              <div className="col-span-2 text-right">Preço Unit.</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* ITEM ROWS */}
            {itens.map((item) => {
              const vAtual = todasVariacoes.find((v) => v.id === item.variacaoId);
              const pAtual = todosProdutos.find((p) => p.id === item.produtoId);

              const estoqueDisponivel = vAtual ? vAtual.estoque : 0;
              const ehIndisponivel = !vAtual || !vAtual.ativo || estoqueDisponivel < item.quantidade;

              // Available variations for size selector dropdown inside cart
              const variacoesDoProduto = pAtual
                ? todasVariacoes.filter((v) => v.produtoId === pAtual.id && v.ativo)
                : [];

              return (
                <div
                  key={item.variacaoId}
                  className={`p-4 transition-colors ${
                    ehIndisponivel ? 'bg-amber-50/60 border-l-4 border-l-pg-orange' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    
                    {/* PROD DETAILS & SIZE SELECTOR (COL 6) */}
                    <div className="sm:col-span-6 flex items-start space-x-3">
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain border border-gray-200 bg-gray-50 p-1 shrink-0"
                      />

                      <div className="space-y-1 text-xs min-w-0 flex-1">
                        <Link
                          to={`/produto/${item.produtoId}`}
                          className="font-pg-display text-xs sm:text-sm font-bold text-gray-900 uppercase hover:text-pg-red line-clamp-2 leading-snug"
                        >
                          {item.nome}
                        </Link>

                        <p className="text-[11px] font-mono text-gray-500">
                          Ref: <span className="font-bold text-gray-700">{item.sku}</span>
                        </p>

                        {/* SELECTOR PARA TROCAR O TAMANHO DENTRO DO CARRINHO */}
                        {variacoesDoProduto.length > 0 && (
                          <div className="pt-1 flex items-center space-x-1.5 flex-wrap">
                            <label className="text-[10px] font-bold text-gray-600 uppercase shrink-0">
                              Tamanho:
                            </label>
                            <select
                              value={item.variacaoId}
                              onChange={(e) => {
                                const novaVar = variacoesDoProduto.find((v) => v.id === e.target.value);
                                if (novaVar && pAtual) {
                                  const novoPreco = pAtual.precoBase + (novaVar.precoAdicional || 0);
                                  trocarVariacao(item.variacaoId, novaVar, novoPreco);
                                }
                              }}
                              className="bg-white border border-gray-300 text-[11px] font-mono py-1 px-2 focus:outline-none focus:border-pg-red font-bold text-gray-800"
                            >
                              {variacoesDoProduto.map((v) => (
                                <option
                                  key={v.id}
                                  value={v.id}
                                  disabled={v.estoque <= 0}
                                >
                                  {v.tamanho || v.sku} {v.estoque <= 0 ? '(Esgotado)' : `(${v.estoque} un.)`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* STOCK WARNING NOTICE FOR ITEM */}
                        {ehIndisponivel && (
                          <p className="text-[11px] font-bold text-pg-orange flex items-center space-x-1 pt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {estoqueDisponivel <= 0
                                ? 'Item sem estoque!'
                                : `Restam apenas ${estoqueDisponivel} unidades disponíveis!`}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* QUANTITY STEPPER (COL 2) */}
                    <div className="sm:col-span-2 flex flex-col items-center justify-center space-y-1">
                      <div className="flex items-center border border-gray-300 bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => atualizarQuantidade(item.variacaoId, item.quantidade - 1)}
                          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                          title="Diminuir quantidade"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-mono font-bold w-9 text-center">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantidade >= estoqueDisponivel}
                          onClick={() => atualizarQuantidade(item.variacaoId, item.quantidade + 1)}
                          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-30 disabled:hover:bg-white"
                          title={item.quantidade >= estoqueDisponivel ? 'Estoque máximo atingido' : 'Aumentar quantidade'}
                        >
                          +
                        </button>
                      </div>

                      {item.quantidade >= estoqueDisponivel && estoqueDisponivel > 0 && (
                        <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">
                          Restam apenas {estoqueDisponivel} un.
                        </span>
                      )}
                    </div>

                    {/* UNIT PRICE (COL 2) */}
                    <div className="sm:col-span-2 text-right text-xs">
                      <span className="text-gray-500 block text-[10px] sm:hidden">Preço Unit.:</span>
                      <span className="font-mono text-gray-700">
                        R$ {item.precoUnit.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* LINE SUBTOTAL & DELETE ACTION (COL 2) */}
                    <div className="sm:col-span-2 flex items-center justify-end space-x-3 text-right">
                      <div>
                        <span className="text-gray-500 block text-[10px] sm:hidden">Subtotal:</span>
                        <span className="font-body text-sm font-extrabold text-pg-red block">
                          R$ {(item.precoUnit * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                        {isUpdating && (
                          <span className="text-[9px] text-pg-petrol font-bold animate-pulse block">
                            atualizando...
                          </span>
                        )}
                      </div>

                      {/* INLINE DELETE CONFIRMATION BUTTON */}
                      {confirmarRemocaoId === item.variacaoId ? (
                        <div className="flex items-center space-x-1 bg-red-50 border border-pg-red p-1 text-[10px]">
                          <span className="font-bold text-pg-red">Remover?</span>
                          <button
                            type="button"
                            onClick={() => {
                              removerItem(item.variacaoId);
                              setConfirmarRemocaoId(null);
                            }}
                            className="bg-pg-red text-white font-bold px-1.5 py-0.5 uppercase hover:bg-opacity-90"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmarRemocaoId(null)}
                            className="bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 uppercase hover:bg-gray-300"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmarRemocaoId(item.variacaoId)}
                          className="text-gray-400 hover:text-pg-red p-1.5 transition-colors"
                          title="Remover produto do carrinho"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* LOWER COUPON & FREIGHT BLOCKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* COUPON INPUT */}
            <div className="bg-white border border-gray-200 p-4 space-y-3 shadow-xs">
              <h3 className="font-pg-display text-xs font-bold text-gray-800 uppercase">
                Cupom de Desconto
              </h3>
              {cupom ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 block">{cupom.codigo}</span>
                    <span className="text-emerald-700 text-[11px]">{cupom.percentual}% de desconto aplicado</span>
                  </div>
                  <button
                    type="button"
                    onClick={removerCupom}
                    className="text-pg-red font-bold text-xs underline hover:text-opacity-80"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAplicarCupom} className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="CÓDIGO DO CUPOM"
                      value={codigoCupomInput}
                      onChange={(e) => setCodigoCupomInput(e.target.value.toUpperCase())}
                      className="w-full bg-gray-50 border border-gray-300 px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-pg-red"
                    />
                    <button
                      type="submit"
                      className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 shrink-0"
                    >
                      APLICAR
                    </button>
                  </div>
                  {mensagemCupom && (
                    <p
                      className={`text-[11px] font-bold ${
                        mensagemCupom.tipo === 'ok' ? 'text-emerald-600' : 'text-pg-red'
                      }`}
                    >
                      {mensagemCupom.texto}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* FREIGHT ESTIMATE */}
            <div className="bg-white border border-gray-200 p-4 space-y-3 shadow-xs">
              <h3 className="font-pg-display text-xs font-bold text-gray-800 uppercase flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-pg-petrol" />
                <span>Simular Frete por CEP</span>
              </h3>
              <form onSubmit={handleCalcularFrete} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="00000-000"
                  value={cepFreteInput}
                  onChange={handleCepInput}
                  maxLength={9}
                  className="w-full bg-gray-50 border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-pg-red"
                />
                <button
                  type="submit"
                  disabled={calculandoFrete}
                  className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs font-bold uppercase px-4 py-2 shrink-0"
                >
                  {calculandoFrete ? 'CALCULANDO...' : 'CALCULAR'}
                </button>
              </form>

              {erroFrete && <p className="text-[11px] text-pg-red font-bold">{erroFrete}</p>}

              {opcoesFrete.length > 0 && (
                <div className="space-y-1.5 text-xs pt-1">
                  {opcoesFrete.map((f) => (
                    <label
                      key={f.servico}
                      className={`flex items-center justify-between p-2 border cursor-pointer transition-colors ${
                        frete?.servico === f.servico
                          ? 'border-pg-red bg-red-50/40'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="frete_carrinho_opcao"
                          checked={frete?.servico === f.servico}
                          onChange={() => selecionarFrete(f)}
                          className="text-pg-red focus:ring-pg-red"
                        />
                        <span className="font-bold text-gray-800">
                          {f.transportadora} ({f.prazoDias}d)
                        </span>
                      </div>
                      <span className="font-body text-xs font-bold text-pg-red">
                        {f.valor === 0 ? 'GRÁTIS' : `R$ ${f.valor.toFixed(2).replace('.', ',')}`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-5">
            <h2 className="font-pg-display text-lg font-bold italic uppercase text-pg-ink border-b-2 border-pg-red pb-2">
              RESUMO DA COMPRA
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal dos produtos:</span>
                <span className="font-mono text-gray-900 font-bold">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {desconto > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto (Cupom):</span>
                  <span className="font-mono">- R$ {desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 font-medium">
                <span>Frete ({frete ? frete.servico : 'a calcular'}):</span>
                <span className="font-mono text-gray-900 font-bold">
                  {frete ? (frete.valor === 0 ? 'GRÁTIS' : `R$ ${frete.valor.toFixed(2).replace('.', ',')}`) : 'R$ 0,00'}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="font-pg-display text-base font-bold text-gray-900 uppercase">
                  TOTAL:
                </span>
                <div className="text-right">
                  <span className="font-body text-2xl font-extrabold text-pg-red block">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                  {isUpdating && (
                    <span className="text-[10px] text-pg-petrol font-bold animate-pulse block">
                      atualizando...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PIX DISCOUNT CALLOUT */}
            <div className="bg-gray-50 border border-gray-200 p-3 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-pg-ink">
                <QrCode className="w-4 h-4 text-pg-red shrink-0" />
                <span>PAGAMENTO EXCLUSIVO VIA PIX</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Aprovação instantânea de pagamento com emissão de NF-e via ERP SupraSoft.
              </p>
            </div>

            {/* CHECKOUT BUTTON */}
            <button
              type="button"
              disabled={temAlertaEstoque}
              onClick={handleFinalizarCompra}
              className={`w-full font-pg-display text-sm font-bold uppercase py-4 px-6 shadow-md transition-all flex items-center justify-center space-x-2 ${
                temAlertaEstoque
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-pg-red hover:bg-opacity-95 text-white tracking-wider'
              }`}
            >
              <span>FINALIZAR COMPRA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {temAlertaEstoque && (
              <p className="text-[11px] text-pg-orange text-center font-bold">
                Ajuste os itens em destaque para habilitar a finalização da compra.
              </p>
            )}

            <div className="text-center pt-1">
              <Link
                to="/"
                className="text-xs font-pg-display text-pg-petrol hover:text-pg-red font-bold uppercase underline"
              >
                &larr; Continuar Comprando
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
