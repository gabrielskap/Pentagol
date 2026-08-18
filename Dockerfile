# Estágio 1: Build da aplicação Frontend React/Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Suporte a variáveis de ambiente em tempo de build (se necessário)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copia apenas os arquivos de dependências para aproveitar o cache do Docker
COPY package.json package-lock.json ./

# Instala as dependências de forma limpa
RUN npm ci

# Copia o restante do código fonte
COPY . .

# Executa a compilação do Vite (gera os arquivos estáticos na pasta /app/dist)
RUN npm run build

# Estágio 2: Servidor Nginx otimizado para produção
FROM nginx:alpine

# Copia a configuração customizada do Nginx com suporte a SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos compilados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 (porta padrão HTTP do Easypanel)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
