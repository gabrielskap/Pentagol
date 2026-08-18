import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bold,
  Box,
  Check,
  FileText,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { getAll, upsert } from '../../lib/db';
import { Categoria, Produto, Variacao } from '../../types';

export const AdminProdutoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdicao = Boolean(id && id !== 'novo');

  const categorias = getAll<Categoria>('categorias');

  // Active tab state
  const [abaAtiva, setAbaAtiva] = useState<
    'dados' | 'fotos' | 'variacoes' | 'logistica' | 'categorias'
  >('dados');

  // Form Fields State
  const [referencia, setReferencia] = useState('');
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoBase, setPrecoBase] = useState<number>(0);
  const [custoEstimado, setCustoEstimado] = useState<number>(0);

  // Logistics Fields (Mandatory for shipping)
  const [pesoKg, setPesoKg] = useState<number>(0.5);
  const [alturaCm, setAlturaCm] = useState<number>(10);
  const [larguraCm, setLarguraCm] = useState<number>(20);
  const [comprimentoCm, setComprimentoCm] = useState<number>(30);

  // Flags
  const [novidade, setNovidade] = useState(true);
  const [destaque, setDestaque] = useState(true);
  const [ativo, setAtivo] = useState(true);

  // Images State (Base64 or URLs)
  const [imagens, setImagens] = useState<string[]>([]);
  const [imagemInput, setImagemInput] = useState('');

  // Variations State
  const [variacoesLocais, setVariacoesLocais] = useState<Partial<Variacao>[]>([]);

  // Categories & Target Public State
  const [categoriaIdsSel, setCategoriaIdsSel] = useState<string[]>(['cat-futebol']);
  const [modalidadesSel, setModalidadesSel] = useState<string[]>(['Futebol']);

  // Error message state
  const [erroValidacao, setErroValidacao] = useState('');

  useEffect(() => {
    if (isEdicao && id) {
      const prod = getAll<Produto>('produtos').find((p) => p.id === id);
      if (prod) {
        setReferencia(prod.referencia);
        setNome(prod.nome);
        setMarca(prod.marca);
        setDescricao(prod.descricao);
        setPrecoBase(prod.precoBase);
        setPesoKg(prod.pesoKg || 0.5);
        setAlturaCm(prod.alturaCm || 10);
        setLarguraCm(prod.larguraCm || 20);
        setComprimentoCm(prod.comprimentoCm || 30);
        setNovidade(prod.novidade);
        setDestaque(prod.destaque);
        setAtivo(prod.ativo);
        setImagens(prod.imagens || []);
        setCategoriaIdsSel(prod.categoriaIds || []);
        setModalidadesSel(prod.modalidades || []);

        const vars = getAll<Variacao>('variacoes').filter((v) => v.produtoId === id);
        setVariacoesLocais(vars);
      }
    } else {
      // Default initial state for new products
      setImagens([
        'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop',
      ]);
      setVariacoesLocais([
        {
          id: `var-new-1`,
          sku: 'SKU-FIN-38',
          tamanho: '38',
          cor: 'Preto/Amarelo',
          estoque: 10,
          precoAdicional: 0,
          ativo: true,
        },
        {
          id: `var-new-2`,
          sku: 'SKU-FIN-39',
          tamanho: '39',
          cor: 'Preto/Amarelo',
          estoque: 15,
          precoAdicional: 0,
          ativo: true,
        },
      ]);
    }
  }, [id, isEdicao]);

  // Image Upload Handler (FileReader -> Base64)
  // TODO: Substituir por upload em storage/s3 no backend em produção
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setImagens((prev) => [...prev, base64Url]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlImagem = () => {
    if (!imagemInput.trim()) return;
    setImagens((prev) => [...prev, imagemInput.trim()]);
    setImagemInput('');
  };

  const handleMoverImagem = (index: number, direcao: 'esquerda' | 'direita') => {
    const novoArr = [...imagens];
    const targetIdx = direcao === 'esquerda' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= novoArr.length) return;
    const temp = novoArr[index];
    novoArr[index] = novoArr[targetIdx];
    novoArr[targetIdx] = temp;
    setImagens(novoArr);
  };

  const handleRemoverImagem = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDefinirFotoPrincipal = (index: number) => {
    if (index === 0) return;
    const item = imagens[index];
    const restantes = imagens.filter((_, i) => i !== index);
    setImagens([item, ...restantes]);
  };

  // Rich Text Editor Helpers
  const aplicarFormatacaoDescricao = (prefixo: string, sufixo: string = '') => {
    setDescricao((prev) => `${prev} ${prefixo}texto${sufixo} `);
  };

  // Variations Helpers
  const handleAddVariacao = () => {
    const refPai = referencia || 'REF';
    setVariacoesLocais((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sku: `${refPai}-${prev.length + 1}`,
        tamanho: 'G',
        cor: 'Padrão',
        estoque: 10,
        precoAdicional: 0,
        ativo: true,
      },
    ]);
  };

  const handleGerarVariacoesGrade = (tipo: 'calcados' | 'vestuario') => {
    const refPai = referencia.trim() || 'SKU';
    let grade: string[] = [];

    if (tipo === 'calcados') {
      grade = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
    } else {
      grade = ['P', 'M', 'G', 'GG', 'XG'];
    }

    const novas = grade.map((tam, idx) => ({
      id: `var-grade-${Date.now()}-${idx}`,
      sku: `${refPai}-${tam}`,
      tamanho: tam,
      cor: 'Padrão',
      estoque: 10,
      precoAdicional: 0,
      ativo: true,
    }));

    setVariacoesLocais(novas);
  };

  // Check duplicate SKUs in variations
  const skusUsados = variacoesLocais.map((v) => v.sku?.trim().toUpperCase());
  const temSkuDuplicado = skusUsados.some(
    (sku, idx) => sku && skusUsados.indexOf(sku) !== idx
  );

  // Form Submission Validation & Save
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao('');

    if (!nome.trim()) {
      setErroValidacao('O Nome do Produto é obrigatório.');
      setAbaAtiva('dados');
      return;
    }

    if (!referencia.trim()) {
      setErroValidacao('O Código de Referência (SKU Pai) é obrigatório.');
      setAbaAtiva('dados');
      return;
    }

    if (precoBase <= 0) {
      setErroValidacao('O Preço Base de Venda deve ser maior que R$ 0,00.');
      setAbaAtiva('dados');
      return;
    }

    // LOGISTICS VALIDATION MANDATORY FOR SHIPPING
    if (!pesoKg || pesoKg <= 0 || !alturaCm || alturaCm <= 0 || !larguraCm || larguraCm <= 0 || !comprimentoCm || comprimentoCm <= 0) {
      setErroValidacao(
        'Peso e dimensões (altura, largura, comprimento) são obrigatórios para o cálculo de frete nos Correios.'
      );
      setAbaAtiva('logistica');
      return;
    }

    if (temSkuDuplicado) {
      setErroValidacao('Existem SKUs duplicados na tabela de variações. Altere os SKUs repetidos.');
      setAbaAtiva('variacoes');
      return;
    }

    const produtoId = isEdicao && id ? id : `prod-${Date.now()}`;

    const novoProduto: Produto = {
      id: produtoId,
      referencia: referencia.trim().toUpperCase(),
      nome: nome.trim(),
      marca: marca.trim() || 'Pentagol',
      categoriaIds: categoriaIdsSel.length > 0 ? categoriaIdsSel : ['cat-futebol'],
      modalidades: modalidadesSel.length > 0 ? modalidadesSel : ['Futebol'],
      descricao: descricao.trim(),
      precoBase: Number(precoBase),
      pesoKg: Number(pesoKg),
      alturaCm: Number(alturaCm),
      larguraCm: Number(larguraCm),
      comprimentoCm: Number(comprimentoCm),
      imagens:
        imagens.length > 0
          ? imagens
          : ['https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop'],
      novidade,
      destaque,
      ativo,
      criadoEm: new Date().toISOString(),
    };

    upsert('produtos', novoProduto);

    // Save variations to database
    variacoesLocais.forEach((v) => {
      const varCompleta: Variacao = {
        id: v.id || `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        produtoId: produtoId,
        sku: (v.sku || `${novoProduto.referencia}-VAR`).trim().toUpperCase(),
        tamanho: v.tamanho || 'U',
        cor: v.cor || 'Padrão',
        estoque: Number(v.estoque || 0),
        precoAdicional: Number(v.precoAdicional || 0),
        ativo: v.ativo ?? true,
      };
      upsert('variacoes', varCompleta);
    });

    alert('Produto e tabela de variações salvos com sucesso!');
    navigate('/admin/produtos');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            {isEdicao ? 'EDITAR CADASTRO DE PRODUTO' : 'CADASTRAR NOVO PRODUTO'}
          </h1>
          <p className="text-xs text-gray-500">
            Preencha os dados básicos, galeria de fotos, gerador de SKUs/estoque e dimensões fiscais para Correios
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/produtos')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-pg-display text-xs px-3.5 py-2 shadow-xs"
        >
          VOLTAR À LISTA
        </button>
      </div>

      {/* ERROR ALERT */}
      {erroValidacao && (
        <div className="bg-red-50 border-2 border-pg-red p-4 text-xs text-pg-red font-bold flex items-center space-x-2 animate-bounce">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{erroValidacao}</span>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="bg-white border border-gray-200 shadow-xs">
        <div className="flex flex-wrap border-b border-gray-200 text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => setAbaAtiva('dados')}
            className={`px-5 py-3 flex items-center space-x-2 transition-colors ${
              abaAtiva === 'dados'
                ? 'border-b-2 border-pg-red bg-red-50 text-pg-red'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Dados Básicos</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('fotos')}
            className={`px-5 py-3 flex items-center space-x-2 transition-colors ${
              abaAtiva === 'fotos'
                ? 'border-b-2 border-pg-red bg-red-50 text-pg-red'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Fotos ({imagens.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('variacoes')}
            className={`px-5 py-3 flex items-center space-x-2 transition-colors ${
              abaAtiva === 'variacoes'
                ? 'border-b-2 border-pg-red bg-red-50 text-pg-red'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3. Variações & SKUs ({variacoesLocais.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('logistica')}
            className={`px-5 py-3 flex items-center space-x-2 transition-colors ${
              abaAtiva === 'logistica'
                ? 'border-b-2 border-pg-red bg-red-50 text-pg-red'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>4. Logística (Correios)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('categorias')}
            className={`px-5 py-3 flex items-center space-x-2 transition-colors ${
              abaAtiva === 'categorias'
                ? 'border-b-2 border-pg-red bg-red-50 text-pg-red'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>5. Categorias & Público</span>
          </button>
        </div>

        <form onSubmit={handleSalvar} className="p-6 text-xs space-y-6">
          
          {/* ABA 1: DADOS BÁSICOS */}
          {abaAtiva === 'dados' && (
            <div className="space-y-4">
              <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
                INFORMAÇÕES BÁSICAS DO PRODUTO
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Código de Referência (SKU Pai) *
                  </label>
                  <input
                    type="text"
                    required
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ex: FIN-SOC-001"
                    className="w-full border border-gray-300 p-2 font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Chuteira Finta Society Couro Legítimo"
                    className="w-full border border-gray-300 p-2 font-body"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Marca / Fabricante *</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Finta, Topper, Hammerhead..."
                    className="w-full border border-gray-300 p-2 font-body"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Preço Venda Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precoBase}
                    onChange={(e) => setPrecoBase(parseFloat(e.target.value))}
                    className="w-full border border-gray-300 p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={custoEstimado}
                    onChange={(e) => setCustoEstimado(parseFloat(e.target.value))}
                    className="w-full border border-gray-300 p-2 font-mono"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO COM EDITOR SIMPLES */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-700">Descrição Detalhada do Produto *</label>
                  <div className="flex items-center space-x-1 bg-gray-100 p-1 border">
                    <button
                      type="button"
                      onClick={() => aplicarFormatacaoDescricao('**', '**')}
                      className="p-1 hover:bg-gray-200"
                      title="Negrito"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarFormatacaoDescricao('*', '*')}
                      className="p-1 hover:bg-gray-200"
                      title="Itálico"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarFormatacaoDescricao('\n- ')}
                      className="p-1 hover:bg-gray-200"
                      title="Lista com marcadores"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  required
                  rows={5}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Escreva a descrição comercial do produto, características do material e recomendações..."
                  className="w-full border border-gray-300 p-2.5 font-body leading-relaxed"
                />
              </div>

              {/* FLAGS DE VISIBILIDADE */}
              <div className="bg-gray-50 p-4 border border-gray-200 flex flex-wrap gap-6 font-bold">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="text-pg-red focus:ring-pg-red"
                  />
                  <span>Produto Ativo na Loja</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={destaque}
                    onChange={(e) => setDestaque(e.target.checked)}
                    className="text-pg-red focus:ring-pg-red"
                  />
                  <span>Exibir na Vitrine "Destaques"</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novidade}
                    onChange={(e) => setNovidade(e.target.checked)}
                    className="text-pg-red focus:ring-pg-red"
                  />
                  <span>Selo "Novidade"</span>
                </label>
              </div>

            </div>
          )}

          {/* ABA 2: FOTOS */}
          {abaAtiva === 'fotos' && (
            <div className="space-y-4">
              <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
                GALERIA DE IMAGENS DO PRODUTO
              </h3>

              {/* UPLOAD FILE / DRAG & DROP AREA */}
              <div className="border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50 space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <p className="font-bold text-gray-700">Arraste fotos ou clique para selecionar do computador</p>
                <p className="text-[11px] text-gray-500">
                  Formatos aceitos: JPG, PNG, WEBP. Convertido automaticamente para Base64 no banco local.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="upload-fotos-input"
                />
                <label
                  htmlFor="upload-fotos-input"
                  className="inline-block bg-[#082229] text-white font-pg-display text-xs px-4 py-2 cursor-pointer hover:bg-opacity-90"
                >
                  SELECIONAR ARQUIVOS DA MÁQUINA
                </label>
              </div>

              {/* URL ALTERNATIVA */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ou cole a URL direta da imagem (ex: https://images.unsplash.com/...)"
                  value={imagemInput}
                  onChange={(e) => setImagemInput(e.target.value)}
                  className="flex-1 border border-gray-300 p-2 font-body"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImagem}
                  className="bg-pg-red text-white font-pg-display px-4 py-2 hover:bg-opacity-90"
                >
                  + ADICIONAR URL
                </button>
              </div>

              {/* GRID DE FOTOS COM REORDENAÇÃO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {imagens.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`relative border p-2 bg-white shadow-xs space-y-2 ${
                      idx === 0 ? 'border-2 border-pg-red' : 'border-gray-200'
                    }`}
                  >
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-pg-red text-white text-[9px] font-bold px-1.5 py-0.5 uppercase z-10">
                        Foto Principal
                      </span>
                    )}

                    <div className="h-36 flex items-center justify-center overflow-hidden bg-gray-50">
                      <img src={imgUrl} alt={`Foto ${idx + 1}`} className="max-h-full object-contain" />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleDefinirFotoPrincipal(idx)}
                        disabled={idx === 0}
                        className={`font-bold ${
                          idx === 0 ? 'text-gray-400' : 'text-pg-petrol hover:underline'
                        }`}
                      >
                        {idx === 0 ? 'Principal' : 'Tornar Capa'}
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleMoverImagem(idx, 'esquerda')}
                          disabled={idx === 0}
                          className="p-1 border bg-gray-100 hover:bg-gray-200 disabled:opacity-30"
                          title="Mover para esquerda"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoverImagem(idx, 'direita')}
                          disabled={idx === imagens.length - 1}
                          className="p-1 border bg-gray-100 hover:bg-gray-200 disabled:opacity-30"
                          title="Mover para direita"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverImagem(idx)}
                          className="p-1 bg-pg-red text-white hover:bg-opacity-90"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ABA 3: VARIAÇÕES E SKUS */}
          {abaAtiva === 'variacoes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                <div>
                  <h3 className="font-pg-display text-base text-gray-900 uppercase">
                    TABELA DE VARIAÇÕES, SKUS E ESTOQUE FÍSICO
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Cadastre cada opção de tamanho/numeração com seu SKU único e estoque individual
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGerarVariacoesGrade('calcados')}
                    className="bg-gray-800 text-white font-pg-display text-[11px] px-3 py-1.5 hover:bg-gray-900"
                  >
                    + GRADE CALÇADOS (35 AO 44)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGerarVariacoesGrade('vestuario')}
                    className="bg-gray-800 text-white font-pg-display text-[11px] px-3 py-1.5 hover:bg-gray-900"
                  >
                    + GRADE VESTUÁRIO (P AO XG)
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVariacao}
                    className="bg-pg-red text-white font-pg-display text-[11px] px-3 py-1.5 hover:bg-opacity-90 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>LINHA INDIVIDUAL</span>
                  </button>
                </div>
              </div>

              {temSkuDuplicado && (
                <div className="bg-red-50 border border-red-300 p-3 text-pg-red text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Atenção: Existem SKUs duplicados na tabela. Cada variação deve ter um SKU único!</span>
                </div>
              )}

              <div className="space-y-2">
                {variacoesLocais.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 p-3 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                  >
                    <div>
                      <label className="font-bold text-gray-600 block mb-0.5 text-[10px]">SKU Variação *</label>
                      <input
                        type="text"
                        required
                        value={v.sku || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariacoesLocais((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                          );
                        }}
                        className="w-full border border-gray-300 p-1.5 font-mono text-xs uppercase"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-600 block mb-0.5 text-[10px]">Tamanho / Numeração</label>
                      <input
                        type="text"
                        value={v.tamanho || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariacoesLocais((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, tamanho: val } : item))
                          );
                        }}
                        placeholder="Ex: 38, G, 5..."
                        className="w-full border border-gray-300 p-1.5 text-xs font-body"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-600 block mb-0.5 text-[10px]">Cor / Acabamento</label>
                      <input
                        type="text"
                        value={v.cor || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariacoesLocais((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, cor: val } : item))
                          );
                        }}
                        placeholder="Ex: Preto/Amarelo"
                        className="w-full border border-gray-300 p-1.5 text-xs font-body"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-600 block mb-0.5 text-[10px]">Estoque Físico (un.)</label>
                      <input
                        type="number"
                        min="0"
                        value={v.estoque ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setVariacoesLocais((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, estoque: val } : item))
                          );
                        }}
                        className="w-full border border-gray-300 p-1.5 font-mono font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-600 block mb-0.5 text-[10px]">Preço Adicional (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.precoAdicional ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setVariacoesLocais((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, precoAdicional: val } : item))
                          );
                        }}
                        className="w-full border border-gray-300 p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() =>
                          setVariacoesLocais((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="bg-pg-red text-white p-1.5 hover:bg-opacity-90"
                        title="Remover variação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ABA 4: LOGÍSTICA CORREIOS */}
          {abaAtiva === 'logistica' && (
            <div className="space-y-4">
              <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
                PESO E DIMENSÕES PARA CÁLCULO DE FRETE (PAC / SEDEX)
              </h3>
              
              <div className="bg-amber-50 border border-amber-300 p-3 text-amber-900 text-xs font-bold space-y-1">
                <p>⚠️ OBRIGATÓRIO PARA O FRETE:</p>
                <p className="font-normal text-[11px]">
                  Os Correios e transportadoras exigem peso e dimensões mínimas para calcular o valor e o prazo de entrega.
                  Valores zerados impedem a exibição do frete ao cliente no checkout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Peso Embalado (Kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={pesoKg}
                    onChange={(e) => setPesoKg(parseFloat(e.target.value))}
                    className="w-full border border-gray-300 p-2 font-mono font-bold"
                  />
                  <span className="text-[10px] text-gray-400">Ex: 0.75 para 750 gramas</span>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Altura da Caixa (cm) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(parseInt(e.target.value))}
                    className="w-full border border-gray-300 p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Largura da Caixa (cm) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={larguraCm}
                    onChange={(e) => setLarguraCm(parseInt(e.target.value))}
                    className="w-full border border-gray-300 p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Comprimento da Caixa (cm) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={comprimentoCm}
                    onChange={(e) => setComprimentoCm(parseInt(e.target.value))}
                    className="w-full border border-gray-300 p-2 font-mono font-bold"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ABA 5: CATEGORIAS E PÚBLICO */}
          {abaAtiva === 'categorias' && (
            <div className="space-y-4">
              <h3 className="font-pg-display text-base text-gray-900 border-b pb-2 uppercase">
                VINCULAÇÃO DE CATEGORIAS E MODALIDADES ESPORTIVAS
              </h3>

              <div>
                <label className="font-bold text-gray-700 block mb-2">Selecione as Categorias Pertencentes:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 border">
                  {categorias.map((cat) => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={categoriaIdsSel.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoriaIdsSel((prev) => [...prev, cat.id]);
                          } else {
                            setCategoriaIdsSel((prev) => prev.filter((cid) => cid !== cat.id));
                          }
                        }}
                        className="text-pg-red focus:ring-pg-red"
                      />
                      <span>{cat.nome} ({cat.tipo})</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* RODAPÉ E BOTÃO SALVAR */}
          <div className="border-t pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/admin/produtos')}
              className="bg-gray-200 text-gray-800 font-pg-display text-xs px-4 py-2 hover:bg-gray-300"
            >
              CANCELAR
            </button>

            <button
              type="submit"
              className="bg-pg-red hover:bg-opacity-95 text-white font-pg-display text-sm px-6 py-2.5 shadow-md flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>SALVAR PRODUTO NO BANCO</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
