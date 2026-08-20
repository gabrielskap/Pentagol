import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { PublicLayout } from './components/public/PublicLayout';
import { AdminProvider } from './contexts/AdminContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritosProvider } from './contexts/FavoritosContext';
import { StoreConfigProvider } from './contexts/StoreConfigContext';

// Public Pages
import { BuscaPage } from './pages/public/BuscaPage';
import { CadastroPage } from './pages/public/CadastroPage';
import { CarrinhoPage } from './pages/public/CarrinhoPage';
import { CategoriaPage } from './pages/public/CategoriaPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { FaleConoscoPage } from './pages/public/FaleConoscoPage';
import { FavoritosPage } from './pages/public/FavoritosPage';
import { HomePage } from './pages/public/HomePage';
import { InstitucionalPage } from './pages/public/InstitucionalPage';
import { LoginPage } from './pages/public/LoginPage';
import { MeusPedidosPage } from './pages/public/MeusPedidosPage';
import { MinhaContaPage } from './pages/public/MinhaContaPage';
import { PedidoDetailPage } from './pages/public/PedidoDetailPage';
import { ProdutoDetailPage } from './pages/public/ProdutoDetailPage';
import { RecuperarSenhaPage } from './pages/public/RecuperarSenhaPage';
import { RedefinirSenhaPage } from './pages/public/RedefinirSenhaPage';

// Admin Pages
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';
import { AdminCategoriasPage } from './pages/admin/AdminCategoriasPage';
import { AdminClientesPage } from './pages/admin/AdminClientesPage';
import { AdminConfiguracoesPage } from './pages/admin/AdminConfiguracoesPage';
import { AdminConversationsPage } from './pages/admin/AdminConversationsPage';
import { AdminCuponsPage } from './pages/admin/AdminCuponsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFlowsPage } from './pages/admin/AdminFlowsPage';
import { AdminIntegracoesPage } from './pages/admin/AdminIntegracoesPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminPedidoDetailPage } from './pages/admin/AdminPedidoDetailPage';
import { AdminPedidosPage } from './pages/admin/AdminPedidosPage';
import { AdminProdutoFormPage } from './pages/admin/AdminProdutoFormPage';
import { AdminProdutosPage } from './pages/admin/AdminProdutosPage';
import { AdminVitrinePage } from './pages/admin/AdminVitrinePage';

import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <StoreConfigProvider>
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <FavoritosProvider>
              <HashRouter>
                <ScrollToTop />
                <Routes>
                  {/* PUBLIC STORE ROUTES */}
                  <Route path="/" element={<PublicLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="categoria/:slug" element={<CategoriaPage />} />
                    <Route path="busca" element={<BuscaPage />} />
                    <Route path="produto/:id" element={<ProdutoDetailPage />} />
                    <Route path="carrinho" element={<CarrinhoPage />} />
                    <Route path="favoritos" element={<FavoritosPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="pedido/:numero" element={<PedidoDetailPage />} />
                    <Route path="minha-conta" element={<MinhaContaPage />} />
                    <Route path="meus-pedidos" element={<MeusPedidosPage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="cadastro" element={<CadastroPage />} />
                    <Route path="recuperar-senha" element={<RecuperarSenhaPage />} />
                    <Route path="redefinir-senha" element={<RedefinirSenhaPage />} />
                    <Route path="institucional/:slug" element={<InstitucionalPage />} />
                    <Route path="fale-conosco" element={<FaleConoscoPage />} />
                  </Route>

                  {/* ADMIN LOGIN */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />

                  {/* ADMIN PROTECTED LAYOUT */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="produtos" element={<AdminProdutosPage />} />
                    <Route path="produtos/:id" element={<AdminProdutoFormPage />} />
                    <Route path="categorias" element={<AdminCategoriasPage />} />
                    <Route path="pedidos" element={<AdminPedidosPage />} />
                    <Route path="pedidos/:id" element={<AdminPedidoDetailPage />} />
                    <Route path="cupons" element={<AdminCuponsPage />} />
                    <Route path="vitrine" element={<AdminVitrinePage />} />
                    <Route path="clientes" element={<AdminClientesPage />} />
                    <Route path="conversations" element={<AdminConversationsPage />} />
                    <Route path="conversas" element={<AdminConversationsPage />} />
                    <Route path="flows" element={<AdminFlowsPage />} />
                    <Route path="campaigns" element={<AdminCampaignsPage />} />
                    <Route path="integracoes" element={<AdminIntegracoesPage />} />
                    <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
                  </Route>
                </Routes>
              </HashRouter>
            </FavoritosProvider>
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </StoreConfigProvider>
  );
}
