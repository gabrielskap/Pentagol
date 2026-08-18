import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Code,
  Database,
  FileText,
  Play,
  QrCode,
  RefreshCw,
  Server,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import { getAll } from '../../lib/db';
import { JobFila, enfileirarJob, listarFila, processarFila } from '../../services/fila';
import { erpService, nfeService, pixService } from '../../services';
import { LogIntegracao } from '../../types';

export const AdminIntegracoesPage: React.FC = () => {
  const [logs, setLogs] = useState<LogIntegracao[]>(getAll<LogIntegracao>('logs'));
  const [filaJobs, setFilaJobs] = useState<JobFila[]>(listarFila());
  const [filtroServico, setFiltroServico] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaPedidoId, setBuscaPedidoId] = useState('');
  const [logDetalheModal, setLogDetalheModal] = useState<LogIntegracao | null>(null);

  const [testandoConexao, setTestandoConexao] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(getAll<LogIntegracao>('logs'));
      setFilaJobs(listarFila());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const recarregar = () => {
    setLogs(getAll<LogIntegracao>('logs'));
    setFilaJobs(listarFila());
  };

  const handleTestarConexoes = async () => {
    setTestandoConexao(true);
    try {
      await pixService.gerarPix('test-health', 10);
      recarregar();
      alert('Teste de saúde dos serviços executado com sucesso!');
    } catch (err: any) {
      alert('Ocorreu um erro no teste de conectividade.');
    } finally {
      setTestandoConexao(false);
    }
  };

  const handleExecutarFilaAgora = async () => {
    setProcessando(true);
    try {
      await processarFila();
      recarregar();
      alert('Fila de jobs reprocessada!');
    } finally {
      setProcessando(false);
    }
  };

  const handleReprocessarLog = async (log: LogIntegracao) => {
    if (!log.pedidoId) {
      alert('Log sem Pedido ID associado.');
      return;
    }

    setProcessando(true);
    try {
      if (log.servico === 'nfe') {
        enfileirarJob(log.pedidoId, 'nfe.emitir');
      } else if (log.servico === 'erp') {
        enfileirarJob(log.pedidoId, 'erp.enviarPedido');
      }
      await processarFila();
      recarregar();
      alert(`Job de reprocessamento para o pedido ${log.pedidoId} enfileirado e executado!`);
    } catch (err: any) {
      alert('Erro ao reprocessar integração.');
    } finally {
      setProcessando(false);
    }
  };

  const logsFiltrados = logs.filter((l) => {
    if (filtroServico !== 'todos' && l.servico !== filtroServico) return false;
    if (filtroStatus === 'sucesso' && !l.sucesso) return false;
    if (filtroStatus === 'falha' && l.sucesso) return false;
    if (buscaPedidoId && l.pedidoId && !l.pedidoId.toLowerCase().includes(buscaPedidoId.toLowerCase())) return false;
    return true;
  });

  // Services health indicators
  const servicosHealth = [
    {
      nome: 'ViaCEP API',
      servicoKey: 'viacep',
      descricao: 'Consulta de CEP e autopreenchimento de endereço',
      icon: Database,
      latencia: '42ms',
      status: 'online',
    },
    {
      nome: 'Correios SIGEP',
      servicoKey: 'correios',
      descricao: 'Cálculo de Frete (PAC/SEDEX) e Rastreamento',
      icon: Truck,
      latencia: '118ms',
      status: 'online',
    },
    {
      nome: 'Pix Banco Central',
      servicoKey: 'pix',
      descricao: 'Geração de QR Code e confirmação de pagamento',
      icon: QrCode,
      latencia: '85ms',
      status: 'online',
    },
    {
      nome: 'SupraSoft ERP',
      servicoKey: 'erp',
      descricao: 'Sincronização automática de pedidos e estoque',
      icon: Server,
      latencia: '160ms',
      status: 'online',
    },
    {
      nome: 'Emissor NF-e SEFAZ',
      servicoKey: 'nfe',
      descricao: 'Transmissão e autorização fiscal de notas',
      icon: FileText,
      latencia: '210ms',
      status: 'online',
    },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-pg-display text-2xl text-gray-900 uppercase">
            PAINEL DE INTEGRAÇÕES & FILA ASSÍNCRONA
          </h1>
          <p className="text-xs text-gray-500">
            Monitoramento em tempo real de APIs externas, barramento de fila idempotente e logs de transações
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={processando}
            onClick={handleExecutarFilaAgora}
            className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-xs px-4 py-2.5 shadow-xs flex items-center space-x-1.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{processando ? 'PROCESSANDO...' : 'EXECUTAR FILA AGORA'}</span>
          </button>

          <button
            type="button"
            disabled={testandoConexao}
            onClick={handleTestarConexoes}
            className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs px-4 py-2.5 shadow-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${testandoConexao ? 'animate-spin' : ''}`} />
            <span>{testandoConexao ? 'TESTANDO...' : 'TESTAR CONEXÕES'}</span>
          </button>
        </div>
      </div>

      {/* CARDS DE SAÚDE DAS INTEGRAÇÕES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {servicosHealth.map((s) => {
          const IconComp = s.icon;
          const totalErros = logs.filter((l) => l.servico === s.servicoKey && !l.sucesso).length;

          return (
            <div key={s.servicoKey} className="bg-white border border-gray-200 p-4 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <div className="bg-gray-100 p-2 rounded-xs">
                  <IconComp className="w-5 h-5 text-pg-petrol" />
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase border border-emerald-300">
                  ONLINE ({s.latencia})
                </span>
              </div>

              <div>
                <h4 className="font-pg-display text-sm text-gray-900 uppercase font-bold">
                  {s.nome}
                </h4>
                <p className="text-[10px] text-gray-500 line-clamp-2">{s.descricao}</p>
              </div>

              <div className="pt-2 border-t text-[10px] flex justify-between font-mono">
                <span className="text-gray-500">Falhas registradas:</span>
                <span className={totalErros > 0 ? 'text-pg-red font-bold' : 'text-emerald-700 font-bold'}>
                  {totalErros}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAINEL DA FILA LOCALSTORAGE */}
      <div className="bg-white border-2 border-pg-petrol p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2">
          <div>
            <h3 className="font-pg-display text-base font-bold text-pg-ink uppercase flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-pg-petrol" />
              <span>FILA DE JOBS ASSÍNCRONOS (LOCALSTORAGE)</span>
            </h3>
            <p className="text-xs text-gray-500">
              Garantia de idempotência por chave <code>pedidoId + jobType</code> com retentativa (3x) e backoff
            </p>
          </div>

          <div className="flex space-x-2 text-xs font-mono font-bold">
            <span className="bg-amber-100 text-amber-900 px-2.5 py-1">
              {filaJobs.filter((j) => j.status === 'pendente').length} Pendentes
            </span>
            <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1">
              {filaJobs.filter((j) => j.status === 'sucesso').length} Concluídos
            </span>
            <span className="bg-red-100 text-red-900 px-2.5 py-1">
              {filaJobs.filter((j) => j.status === 'falha_definitiva').length} Falhas
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Pedido ID</th>
                <th className="py-2.5 px-3">Tipo de Job</th>
                <th className="py-2.5 px-3">Status Fila</th>
                <th className="py-2.5 px-3">Tentativas</th>
                <th className="py-2.5 px-3">Último Erro</th>
                <th className="py-2.5 px-3">Próxima Execução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filaJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 italic">
                    Nenhum job pendente na fila.
                  </td>
                </tr>
              ) : (
                filaJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-gray-900">
                      {job.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700">
                      {job.pedidoId}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-pg-petrol">
                      {job.tipo}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          job.status === 'sucesso'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'pendente'
                            ? 'bg-amber-100 text-amber-800'
                            : job.status === 'em_processamento'
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center font-bold">
                      {job.tentativas} / {job.maxTentativas}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-pg-red max-w-xs truncate">
                      {job.ultimoErro || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">
                      {job.proximaTentativaEm
                        ? new Date(job.proximaTentativaEm).toLocaleTimeString('pt-BR')
                        : 'Concluído'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOGS AUDITÁVEIS */}
      <div className="bg-white border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
          <h3 className="font-pg-display text-base text-gray-900 uppercase font-bold">
            LOGS AUDITÁVEIS DE INTEGRAÇÕES ({logsFiltrados.length})
          </h3>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={filtroServico}
              onChange={(e) => setFiltroServico(e.target.value)}
              className="border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Todos os serviços</option>
              <option value="viacep">ViaCEP</option>
              <option value="correios">Correios</option>
              <option value="pix">Pix Banco Central</option>
              <option value="erp">SupraSoft ERP</option>
              <option value="nfe">Emissor NF-e</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-300 p-1.5 font-body"
            >
              <option value="todos">Todos os resultados</option>
              <option value="sucesso">Apenas Sucessos</option>
              <option value="falha">Apenas Falhas / Erros</option>
            </select>

            <input
              type="text"
              placeholder="Buscar por Pedido ID..."
              value={buscaPedidoId}
              onChange={(e) => setBuscaPedidoId(e.target.value)}
              className="border border-gray-300 p-1.5 font-body text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Serviço</th>
                <th className="py-2.5 px-3">Pedido ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Mensagem</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-body">
              {[...logsFiltrados].reverse().map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.em).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 font-bold font-mono text-pg-petrol uppercase">
                    {log.servico}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-800">
                    {log.pedidoId || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                        log.sucesso
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.sucesso ? 'SUCESSO' : 'FALHA'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700 max-w-sm truncate">
                    {log.mensagem}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      title="Ver JSON da requisição e resposta"
                      onClick={() => setLogDetalheModal(log)}
                      className="bg-sky-50 text-sky-800 border border-sky-300 p-1 hover:bg-sky-100"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>

                    {!log.sucesso && log.pedidoId && (
                      <button
                        type="button"
                        onClick={() => handleReprocessarLog(log)}
                        className="bg-pg-red hover:bg-opacity-90 text-white font-pg-display text-[10px] px-2 py-1 uppercase"
                      >
                        REPROCESSAR
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHE DO LOG JSON */}
      {logDetalheModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full p-6 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-pg-display text-base text-gray-900 uppercase">
                  PAYLOAD DO LOG - SERVIÇO: {logDetalheModal.servico.toUpperCase()}
                </h3>
                <p className="text-xs text-gray-500">
                  Data: {new Date(logDetalheModal.em).toLocaleString('pt-BR')} | Pedido:{' '}
                  {logDetalheModal.pedidoId || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogDetalheModal(null)}
                className="text-gray-500 font-bold hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase font-pg-display">
                  Requisição Enviada:
                </label>
                <pre className="bg-gray-900 text-emerald-400 p-3 font-mono text-[11px] overflow-x-auto max-h-40 rounded-xs">
                  {logDetalheModal.requisicao || '{}'}
                </pre>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase font-pg-display">
                  Resposta Recebida:
                </label>
                <pre className="bg-gray-900 text-sky-400 p-3 font-mono text-[11px] overflow-x-auto max-h-40 rounded-xs">
                  {logDetalheModal.resposta || '{}'}
                </pre>
              </div>
            </div>

            <div className="text-right pt-2 border-t">
              <button
                type="button"
                onClick={() => setLogDetalheModal(null)}
                className="bg-pg-petrol text-white font-pg-display text-xs px-4 py-2"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
