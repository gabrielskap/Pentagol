# Pentagol Esportes — Plataforma de E-Commerce & Painel Administrativo

Plataforma de e-commerce completa para a tradicional loja de artigos esportivos **Pentagol Esportes** em Belo Horizonte/MG, incluindo loja pública responsiva e painel administrativo de gestão.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn

### Passos para Instalação e Execução

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build

# 4. Executar em modo de produção
npm run start
```

O aplicativo estará rodando em `http://localhost:3000`.

---

## 🗺️ Mapa de Rotas do Sistema

### 🌐 Rotas Públicas (Loja)
- `/` — Página Inicial (Banners Hero, Categorias, Vitrines Destaques/Lançamentos/Promoções)
- `/categoria/:slug` — Listagem de Produtos por Categoria (Filtros por Modalidade, Marca, Preço, Tamanho e Ordenação)
- `/produto/:id` — Detalhes do Produto (Galeria de imagens, variações de Tamanho/Cor, cálculo de frete ao vivo ViaCEP, Breadcrumb, JSON-LD)
- `/busca` — Busca Global de Produtos (Filtros avançados e estado vazio com sugestões)
- `/carrinho` — Carrinho de Compras (Gestão de quantidade, cupom de desconto, cálculo de frete, regra de frete grátis)
- `/checkout` — Finalização do Pedido (Identificação/Cadastro, Endereço ViaCEP, Resumo fixo mobile, emissão Pix)
- `/pedido/:id` — Confirmação e Acompanhamento do Pedido (QRCode Pix em tempo real, Copia e Cola, Linha do tempo)
- `/meus-pedidos` — Histórico de Pedidos do Cliente
- `/minha-conta` — Cadastro do Cliente e Gestão de Endereços
- `/login` / `/cadastro` / `/recuperar-senha` / `/redefinir-senha` — Autenticação do Cliente
- `/institucional/:slug` — Páginas Institucionais (Sobre a Loja, Política de Privacidade, Trocas e Devoluções)
- `/fale-conosco` — Formulário de Contato e Localização da Loja BH

### 🔒 Rotas Administrativas (`/admin`)
- `/admin/login` — Autenticação do Usuário Admin/Operador (Com credenciais demo em tela)
- `/admin` — Dashboard Administrativo (Métricas de Vendas, Gráficos Recharts, Alertas de Estoque e Integrações)
- `/admin/pedidos` — Gestão Completa de Pedidos (Filtros por status Pix/NF, Exportação CSV, Detalhe `/admin/pedidos/:id` com Logs ERP/Sefaz e reprocessamento)
- `/admin/produtos` — Cadastro e Edição de Produtos (Variações de tamanho/cor, estoque, fotos, dimensões para frete)
- `/admin/categorias` — Gestão da Árvore de Categorias e Destaques da Home
- `/admin/cupons` — Gestão de Cupons de Desconto (Percentual, Valor Mínimo, Validade, Limite de Usos)
- `/admin/vitrine` — Gestão CMS da Home (Banners Hero, Faixas Promocionais, Blocos de Destaque)
- `/admin/clientes` — Base de Clientes Cadastrados (Histórico de compras e exportação CSV)
- `/admin/integracoes` — Monitoramento em Tempo Real das Filas e Webhooks (SupraSoft ERP, Sefaz NF-e, Pix Banco Central)
- `/admin/configuracoes` — Configurações Gerais da Loja (Chave Pix, Desconto Pix %, Prazos, Mudar para modo Produção/Demo)

---

## ⚡ O que é Real vs. O que é Simulado (Mock)

| Funcionalidade | Status | Descrição |
| :--- | :--- | :--- |
| **Consulta de CEP (ViaCEP)** | 🟢 **REAL** | Integração direta com a API pública `viacep.com.br` para preenchimento automático de endereço. |
| **Validação de CPF** | 🟢 **REAL** | Algoritmo oficial de verificação de dígitos verificadores de CPF (módulo 11). |
| **Persistência de Dados** | 🟢 **REAL** | Armazenamento local reativo via LocalStorage com barramento de eventos customizados (`pentagol:db-updated`). |
| **Geração de QR Code Pix** | 🟢 **REAL** | Geração dinâmica do QR Code via `api.qrserver.com` com payload e chave Pix. |
| **Regras de Negócio e Cálculos** | 🟢 **REAL** | Subtotal, cupom progressivo, desconto Pix %, frete por peso/dimensões e regras de frete grátis. |
| **Webservice Correios (PAC/SEDEX)** | 🟡 **SIMULADO** | Cálculo baseado na tabela oficial de peso/UF por cubagem. |
| **Integração ERP SupraSoft** | 🟡 **SIMULADO** | Fila assíncrona persistida com retentativas, idempotência e geração de ID externo mock. |
| **Emissão de NF-e (Sefaz)** | 🟡 **SIMULADO** | Processamento assíncrono pós-pagamento com geração de chave de acesso de 44 dígitos e DANFE simulado. |
| **Webhook de Confirm. Pix** | 🟡 **SIMULADO** | Callback acionado via temporizador automático (30s) ou manualmente no Painel Demo. |

---

## 🔌 Especificação dos Endpoints do Backend Requeridos

Abaixo está a documentação técnica dos contratos em JSON que a API backend deve implementar para substituição dos serviços simulados em ambiente de produção:

### 1. Cálculo de Frete e Prazo
**POST** `/api/frete/calcular`
- **Request Body:**
```json
{
  "cepOrigem": "30110-000",
  "cepDestino": "30130-010",
  "itens": [
    {
      "sku": "FIN-SOC-001-M",
      "quantidade": 1,
      "pesoKg": 0.75,
      "alturaCm": 12,
      "larguraCm": 20,
      "comprimentoCm": 32,
      "precoUnit": 189.90
    }
  ]
}
```
- **Response Body (200 OK):**
```json
{
  "opcoes": [
    {
      "servico": "PAC",
      "valor": 18.90,
      "prazoDias": 5,
      "transportadora": "Correios"
    },
    {
      "servico": "SEDEX",
      "valor": 29.50,
      "prazoDias": 2,
      "transportadora": "Correios"
    }
  ]
}
```

---

### 2. Geração de Cobrança Pix
**POST** `/api/pix/cobranca`
- **Request Body:**
```json
{
  "pedidoId": "PG-2026-1001",
  "valorTotal": 189.90,
  "cliente": {
    "nomeCompleto": "Carlos Eduardo Silva",
    "cpf": "123.456.789-01",
    "email": "carlos.silva@gmail.com"
  },
  "expiracaoMinutos": 30
}
```
- **Response Body (200 OK):**
```json
{
  "txid": "PENTAGOLPIX20261001TXID",
  "qrCodeImagem": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=000201...",
  "copiaECola": "00020126360014BR.GOV.BCB.PIX0114+5531998765432520400005303986540510.00...",
  "expiraEm": "2026-08-18T10:30:00Z"
}
```

---

### 3. Webhook de Confirmação de Pagamento Pix
**POST** `/api/webhooks/pix`
- **Request Body (Recebido do PSP / Banco):**
```json
{
  "event": "pix.payment.confirmed",
  "txid": "PENTAGOLPIX20261001TXID",
  "valor": 189.90,
  "pagoEm": "2026-08-18T10:05:12Z",
  "pagador": {
    "nome": "Carlos Eduardo Silva",
    "cpf": "123.456.789-01"
  }
}
```
- **Response Body (200 OK):**
```json
{
  "recebido": true,
  "pedidoStatus": "pago",
  "processadoEm": "2026-08-18T10:05:13Z"
}
```

---

### 4. Envio de Pedido ao ERP SupraSoft
**POST** `/api/erp/pedidos`
- **Request Body:**
```json
{
  "referenciaPedido": "PG-2026-1001",
  "dataHora": "2026-08-18T10:00:00Z",
  "cliente": {
    "nome": "Carlos Eduardo Silva",
    "cpfCnpj": "12345678901",
    "email": "carlos.silva@gmail.com",
    "telefone": "31998112233",
    "endereco": {
      "logradouro": "Avenida Afonso Pena",
      "numero": "1000",
      "bairro": "Centro",
      "cidade": "Belo Horizonte",
      "uf": "MG",
      "cep": "30110000"
    }
  },
  "itens": [
    {
      "sku": "FIN-SOC-001-M",
      "descricao": "Chuteira Finta Society Couro Legítimo - M",
      "quantidade": 1,
      "precoUnitario": 189.90,
      "descontoRateado": 0.00
    }
  ],
  "valorFrete": 18.90,
  "valorTotal": 208.80,
  "formaPagamento": "PIX"
}
```
- **Response Body (200 OK):**
```json
{
  "sucesso": true,
  "idExternoSupraSoft": "ERP-SUPRA-9102",
  "mensagem": "Pedido integrado com sucesso no estoque ERP."
}
```

---

### 5. Emissão de Nota Fiscal Eletrônica (Sefaz NF-e)
**POST** `/api/nfe/emitir`
- **Request Body:**
```json
{
  "pedidoId": "PG-2026-1001",
  "idExternoErp": "ERP-SUPRA-9102",
  "cpfCliente": "12345678901",
  "valorNota": 208.80
}
```
- **Response Body (200 OK):**
```json
{
  "sucesso": true,
  "statusNfe": "emitida",
  "numeroNfe": "000.1001",
  "chaveAcesso": "312608123456780001995500100010011001234567",
  "danfeUrl": "https://nfe.sefaz.mg.gov.br/danfe/312608123456780001995500100010011001234567.pdf",
  "xmlUrl": "https://nfe.sefaz.mg.gov.br/xml/312608123456780001995500100010011001234567.xml"
}
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite, React Router v6
- **Estilização:** Tailwind CSS v4, Lucide React Icons, Motion Animation
- **Visualização de Dados:** Recharts (Gráficos do Admin)
- **Persistência Local:** Storage Engine reativo com CustomEvents

---

## 🐳 Deploy no Easypanel (via Dockerfile)

O projeto está configurado para deploy automatizado via Docker no **Easypanel**.

### Estrutura do Docker:
1. **Multi-stage Build (`Dockerfile`):**
   - **Stage 1:** Node.js 20 Alpine instala dependências (`npm ci`) e compila os arquivos com `npm run build`.
   - **Stage 2:** Nginx Alpine leve para servir a aplicação pronta para produção.
2. **Configuração Nginx (`nginx.conf`):**
   - Suporte nativo a Single Page Application (SPA / React Router) redirecionando rotas para `index.html`.
   - Compressão Gzip ativada.
   - Headers de cache otimizados para assets estáticos em `/assets/`.

### Passos no Painel do Easypanel:
1. Crie um novo serviço no Easypanel (tipo **App**).
2. Em **Source**, selecione **GitHub** e informe o repositório e branch (`main` ou `master`).
3. Em **Build**, escolha o método **Dockerfile**.
4. Defina a porta do contêiner (**Port**) como `80`.
5. Clique em **Deploy**.

