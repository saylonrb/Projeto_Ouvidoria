# 🏛️ Plataforma de Ouvidoria Inteligente Municipal

> Sistema web completo para Ouvidoria Pública com IA integrada para triagem, deduplicação e roteamento automático de demandas cidadãs.

## ✨ Funcionalidades Principais

- **Chatbot conversacional** (estilo WhatsApp) para registro de demandas
- **IA de triagem e deduplicação** via Google Gemini (com fallback heurístico)
- **Rastreamento estilo "encomenda"** com timeline visual
- **Painel administrativo completo** com dashboard analítico
- **Mapa de calor** de demandas por bairro
- **Acessibilidade WCAG 2.1 AA** (alto contraste, zoom de fonte, navegação por teclado)
- **LGPD compliant** e proteção robusta contra ataques (IDOR, XSS, SQLi, CSRF)

## 🗂️ Estrutura do Projeto

```
projeto_Ouvidoria/
├── frontend/          # React 18 + Vite
├── backend/           # Node.js + Express + Prisma
├── docker-compose.yml # PostgreSQL + Redis
├── .env.example       # Template de variáveis de ambiente
└── README.md
```

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose
- (Opcional) Chave da API Google Gemini

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 2. Subir o banco de dados

```bash
docker-compose up -d
```

### 3. Instalar dependências e rodar o backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 4. Instalar dependências e rodar o frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Acessar

| Serviço | URL |
|---|---|
| Frontend (Cidadão) | http://localhost:5173 |
| Frontend (Admin) | http://localhost:5173/admin |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |

### 👤 Credenciais Padrão (Seed)

| Perfil | Email | Senha |
|---|---|---|
| Super Admin | admin@ouvidoria.gov.br | Admin@123456 |
| Gestor Obras | gestor.obras@ouvidoria.gov.br | Gestor@123 |
| Atendente | atendente@ouvidoria.gov.br | Atend@123 |

## 🤖 IA de Deduplicação

O sistema usa um modelo em duas camadas:

1. **Google Gemini API** (primária): NLP avançado para extração de intenção, categoria e localização
2. **Fallback Heurístico** (secundário): Keyword matching + TF-IDF quando a API falha ou timeout

Configurável via variáveis de ambiente no `.env`.

## 🔒 Segurança

- JWT com HttpOnly Cookies (Refresh Token)
- Rate Limiting por IP e por usuário
- Validação Zod em 100% das rotas
- Prisma ORM (proteção SQLi)
- Helmet.js (headers HTTP seguros)
- Sanitização XSS
- Prevenção IDOR
- Trilha de auditoria completa

## 📚 Documentação da API

Acesse `http://localhost:3001/api/docs` para a documentação interativa Swagger/OpenAPI.

## 🗃️ Perfis de Acesso (RBAC)

| Role | Permissões |
|---|---|
| `CITIZEN` | Abrir demanda, rastrear, ver FAQ |
| `ATTENDANT` | Atualizar status, responder demandas |
| `SECTOR_MANAGER` | Gerenciar demandas do setor, relatórios |
| `SUPER_ADMIN` | Acesso total ao sistema |

## 🏗️ Stack Técnica

**Frontend**: React 18, Vite, React Router v6, Recharts  
**Backend**: Node.js 20, Express.js, Prisma ORM, Zod, JWT  
**Banco**: PostgreSQL 16 (ACID, migrations, índices)  
**Cache**: Redis  
**IA**: Google Gemini 1.5 Flash + Fallback Heurístico  
