import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAll } from '../../lib/db';
import { Pedido } from '../../types';

export const MeusPedidosPage: React.FC = () => {
  const { cliente, logado } = useAuth();

  if (!logado || !cliente) {
    return (
      <div className="bg-white p-8 text-center border">
        <p className="font-pg-display text-lg text-pg-red mb-2">VOCÊ NÃO ESTÁ LOGADO</p>
        <Link to="/login" className="inline-block bg-pg-petrol text-white px-4 py-2 text-xs font-pg-display">
          IR PARA O LOGIN
        </Link>
      </div>
    );
  }

  const pedidos = getAll<Pedido>('pedidos').filter((p) => p.clienteId === cliente.id || p.snapshotCliente.email === cliente.email);

  return (
    <div className="space-y-6">
      <div className="bg-pg-petrol text-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="font-pg-display text-2xl tracking-wider uppercase">MEUS PEDIDOS</h1>
        <span className="text-xs text-gray-200">{pedidos.length} pedido(s)</span>
      </div>

      <div className="space-y-4">
        {pedidos.map((ped) => (
          <div key={ped.id} className="bg-white border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-pg-display text-base text-gray-900">
                  PEDIDO #{ped.numero}
                </span>
                <span className="bg-pg-yellow text-pg-ink text-[10px] font-bold px-2 py-0.5 uppercase">
                  {ped.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Realizado em {new Date(ped.criadoEm).toLocaleDateString('pt-BR')} | Total: <strong className="text-gray-800">R$ {ped.total.toFixed(2).replace('.', ',')}</strong>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {ped.itens.length} produto(s) • Entrega via {ped.frete.servico}
              </p>
            </div>

            <Link
              to={`/pedido/${ped.numero}`}
              className="bg-pg-petrol hover:bg-opacity-90 text-white font-pg-display text-xs px-4 py-2 flex items-center space-x-1 whitespace-nowrap"
            >
              <span>VER DETALHES & PIX</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="bg-white border p-12 text-center text-gray-500 space-y-2">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-pg-display text-lg">NENHUM PEDIDO ENCONTRADO</p>
            <p className="text-xs">Você ainda não realizou compras em nossa loja virtual.</p>
          </div>
        )}
      </div>
    </div>
  );
};
