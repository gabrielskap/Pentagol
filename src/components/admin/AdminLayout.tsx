import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Box,
  ChevronRight,
  FolderTree,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Ticket,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { getAll } from '../../lib/db';
import { Pedido, Produto } from '../../types';
import PentagolLogo from '../PentagolLogo';

export const AdminLayout: React.FC = () => {
  const { usuarioAdmin, logoutAdmin, logado, isOperador } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertasCount, setAlertasCount] = useState(0);

  // Global search state
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<{
    pedidos: Pedido[];
    produtos: Produto[];
  }>({ pedidos: [], produtos: [] });
  const [showBuscaResults, setShowBuscaResults] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Guard: if not logged in, redirect to login
  useEffect(() => {
    if (!logado && location.pathname !== '/admin/login') {
      navigate('/admin/login', { replace: true });
    }
  }, [logado, location.pathname, navigate]);

  // Monitor rejected NF-e orders for topbar bell indicator
  useEffect(() => {
    const checarAlertas = () => {
      const pedidos = getAll<Pedido>('pedidos');
      const rejeitados = pedidos.filter((p) => p.nf?.status === 'rejeitada');
      setAlertasCount(rejeitados.length);
    };

    checarAlertas();
    const interval = setInterval(checarAlertas, 3000);
    return () => clearInterval(interval);
  }, []);

  // Global search logic
  useEffect(() => {
    const termo = buscaGlobal.trim().toLowerCase();
    if (termo.length < 2) {
      setResultadosBusca({ pedidos: [], produtos: [] });
      setShowBuscaResults(false);
      return;
    }

    const todosPedidos = getAll<Pedido>('pedidos');
    const todosProdutos = getAll<Produto>('produtos');

    const pedEncontrados = todosPedidos.filter(
      (p) =>
        p.numero.toLowerCase().includes(termo) ||
        p.snapshotCliente.cpf.replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
        p.snapshotCliente.nomeCompleto.toLowerCase().includes(termo) ||
        p.snapshotCliente.email.toLowerCase().includes(termo)
    );

    const prodEncontrados = todosProdutos.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.referencia.toLowerCase().includes(termo) ||
        p.marca.toLowerCase().includes(termo)
    );

    setResultadosBusca({
      pedidos: pedEncontrados.slice(0, 5),
      produtos: prodEncontrados.slice(0, 5),
    });
    setShowBuscaResults(true);
  }, [buscaGlobal]);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true, apenasAdmin: false },
    { label: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag, apenasAdmin: false },
    { label: 'Produtos', path: '/admin/produtos', icon: Box, apenasAdmin: false },
    { label: 'Categorias', path: '/admin/categorias', icon: FolderTree, apenasAdmin: false },
    { label: 'Cupons', path: '/admin/cupons', icon: Ticket, apenasAdmin: false },
    { label: 'Vitrine (Banners)', path: '/admin/vitrine', icon: BarChart3, apenasAdmin: false },
    { label: 'Clientes', path: '/admin/clientes', icon: Users, apenasAdmin: false },
    { label: 'Integrações (Logs)', path: '/admin/integracoes', icon: Wrench, apenasAdmin: true },
    { label: 'Configurações', path: '/admin/configuracoes', icon: Settings, apenasAdmin: true },
  ];

  if (!logado) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pg-surface flex font-body text-gray-800">
      
      {/* FIXED SIDEBAR DESKTOP (240px, pg.petrol #082229) */}
      <aside className="hidden lg:flex flex-col w-[240px] lg:fixed lg:top-0 lg:bottom-0 lg:left-0 bg-[#082229] text-white border-r border-gray-800 z-30 custom-scrollbar-dark">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <Link to="/admin" className="block">
            <PentagolLogo priority className="h-14 w-auto" />
            <span className="text-[10px] block mt-1.5 font-normal tracking-wider text-gray-300 uppercase">Painel Administrativo</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar-dark">
          {navItems.map((item) => {
            const desabilitado = isOperador && item.apenasAdmin;
            return (
              <NavLink
                key={item.path}
                to={desabilitado ? '#' : item.path}
                end={item.exact}
                onClick={(e) => {
                  if (desabilitado) {
                    e.preventDefault();
                    alert('Acesso restrito: seu perfil de Operador não tem acesso a esta área.');
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 font-medium text-xs uppercase tracking-wider transition-colors ${
                    desabilitado
                      ? 'text-gray-500 cursor-not-allowed opacity-60'
                      : isActive && !desabilitado
                      ? 'bg-pg-red text-white font-bold'
                      : 'text-gray-300 hover:bg-[#0e3039] hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {desabilitado && (
                  <span className="ml-auto text-[9px] bg-gray-800 text-gray-400 px-1 py-0.5 uppercase">
                    Admin
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center space-x-2 text-xs text-gray-300 hover:text-white py-1 transition-colors"
          >
            <Globe className="w-4 h-4 text-pg-orange" />
            <span>Ver Loja Principal</span>
          </Link>

          {usuarioAdmin && (
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-white truncate w-32">{usuarioAdmin.nome}</p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 uppercase mt-0.5 ${
                  usuarioAdmin.perfil === 'admin' ? 'bg-pg-red text-white' : 'bg-amber-500 text-black'
                }`}>
                  {usuarioAdmin.perfil}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logoutAdmin();
                  navigate('/admin/login');
                }}
                className="text-gray-400 hover:text-pg-red p-1 transition-colors"
                title="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER FOR ADMIN */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#082229] text-white z-40 flex items-center justify-between px-4 border-b border-gray-800">
        <Link to="/admin" className="flex items-center space-x-2">
          <PentagolLogo priority className="h-10 w-auto" />
          <span className="font-pg-display text-xl text-white">ADMIN</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-white hover:bg-[#0e3039]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 flex justify-start pt-14">
          <div className="w-[240px] bg-[#082229] h-full p-4 flex flex-col justify-between">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const desabilitado = isOperador && item.apenasAdmin;
                return (
                  <NavLink
                    key={item.path}
                    to={desabilitado ? '#' : item.path}
                    end={item.exact}
                    onClick={(e) => {
                      if (desabilitado) {
                        e.preventDefault();
                        alert('Acesso restrito ao perfil Administrador.');
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 text-xs font-medium uppercase tracking-wider ${
                        desabilitado
                          ? 'text-gray-500 cursor-not-allowed'
                          : isActive
                          ? 'bg-pg-red text-white'
                          : 'text-gray-300 hover:bg-[#0e3039]'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-gray-800 space-y-2">
              <Link
                to="/"
                className="flex items-center space-x-2 text-xs text-gray-300 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Globe className="w-4 h-4" />
                <span>Voltar para a Loja</span>
              </Link>
              {usuarioAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    logoutAdmin();
                    setMobileMenuOpen(false);
                    navigate('/admin/login');
                  }}
                  className="flex items-center space-x-2 text-xs text-pg-red hover:underline"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair ({usuarioAdmin.nome})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 lg:pl-[240px]">
        
        {/* TOPBAR DESKTOP */}
        <header className="hidden lg:flex h-14 bg-white border-b border-gray-200 items-center justify-between px-6 z-20 sticky top-0">
          
          {/* BUSCA GLOBAL */}
          <div className="relative w-full max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Busca global (N° pedido, CPF, e-mail ou SKU de produto)..."
                value={buscaGlobal}
                onChange={(e) => setBuscaGlobal(e.target.value)}
                onFocus={() => {
                  if (buscaGlobal.trim().length >= 2) setShowBuscaResults(true);
                }}
                className="w-full bg-gray-50 border border-gray-300 pl-9 pr-8 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-pg-red font-body"
              />
              {buscaGlobal && (
                <button
                  type="button"
                  onClick={() => {
                    setBuscaGlobal('');
                    setShowBuscaResults(false);
                  }}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* RESULTS POPUP */}
            {showBuscaResults && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-xl mt-1 z-50 p-3 space-y-3 max-h-96 overflow-y-auto text-xs">
                
                {/* PEDIDOS */}
                <div>
                  <p className="font-bold text-gray-400 uppercase text-[10px] border-b pb-1 mb-1">
                    Pedidos ({resultadosBusca.pedidos.length})
                  </p>
                  {resultadosBusca.pedidos.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic py-1">Nenhum pedido encontrado</p>
                  ) : (
                    <div className="space-y-1">
                      {resultadosBusca.pedidos.map((ped) => (
                        <Link
                          key={ped.id}
                          to={`/admin/pedidos/${ped.id}`}
                          onClick={() => setShowBuscaResults(false)}
                          className="block p-1.5 hover:bg-gray-100 rounded-none border-b border-gray-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-pg-red">{ped.numero}</span>
                            <span className="text-gray-700 font-medium ml-2">{ped.snapshotCliente.nomeCompleto}</span>
                            <span className="text-gray-400 text-[10px] block">CPF: {ped.snapshotCliente.cpf}</span>
                          </div>
                          <span className="font-bold text-gray-900 font-mono">
                            R$ {ped.total.toFixed(2).replace('.', ',')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* PRODUTOS */}
                <div>
                  <p className="font-bold text-gray-400 uppercase text-[10px] border-b pb-1 mb-1">
                    Produtos ({resultadosBusca.produtos.length})
                  </p>
                  {resultadosBusca.produtos.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic py-1">Nenhum produto encontrado</p>
                  ) : (
                    <div className="space-y-1">
                      {resultadosBusca.produtos.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/admin/produtos/${prod.id}`}
                          onClick={() => setShowBuscaResults(false)}
                          className="block p-1.5 hover:bg-gray-100 rounded-none border-b border-gray-100 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <img src={prod.imagens[0]} alt="" className="w-7 h-7 object-contain border" />
                            <div>
                              <span className="font-bold text-gray-800 uppercase block">{prod.nome}</span>
                              <span className="text-gray-500 font-mono text-[10px]">Ref: {prod.referencia}</span>
                            </div>
                          </div>
                          <span className="font-bold text-pg-petrol font-mono">
                            R$ {prod.precoBase.toFixed(2).replace('.', ',')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          <div className="flex items-center space-x-5 text-xs">
            {/* FISCAL ALERTS BELL BUTTON */}
            <Link
              to="/admin/pedidos?filtro=pendencias_fiscais"
              className="relative p-2 text-gray-600 hover:text-pg-red transition-colors flex items-center space-x-1"
              title={
                alertasCount > 0
                  ? `${alertasCount} pendência(s) fiscal(is) de NF-e`
                  : 'Nenhuma pendência fiscal'
              }
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {alertasCount > 0 && (
                <span className="absolute top-0 right-0 bg-pg-red text-white font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                  {alertasCount}
                </span>
              )}
            </Link>

            {usuarioAdmin && (
              <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
                <span className="text-gray-800 font-bold">{usuarioAdmin.nome}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                  usuarioAdmin.perfil === 'admin' ? 'bg-pg-red text-white' : 'bg-amber-100 text-amber-900'
                }`}>
                  {usuarioAdmin.perfil}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT ROUTE */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-pg-surface">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
