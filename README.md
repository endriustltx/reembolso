# 🟠 Portal de Reembolso — Gate7

Sistema completo de gestão de reembolsos, banco de horas e NOC para a Gate7.

## ✅ Funcionalidades

### Para Técnicos
- Login seguro com e-mail e senha
- Lançamento de **Km / Combustível** com múltiplos destinos
- Lançamento de **Horas** (vão para banco de horas)
- Lançamento de **NOC** (pagamento de R$ 175,00/dia — separado do banco de horas)
- Lançamento de **Alimentação** com nota fiscal obrigatória
- Upload de **Notas Fiscais** (PDF, JPG, PNG)
- Visualizar apenas seus próprios registros

### Para Administradores
- **Dashboard** com gráficos e resumo de todos os colaboradores
- **Aprovar/Rejeitar** lançamentos de qualquer técnico
- **Banco de Horas** consolidado por colaborador
- **Relatório Mensal** com exportação CSV
- **Gestão de Colaboradores** (criar, ativar/desativar)
- Visualizar todas as **Notas Fiscais**

---

## 🗄️ Banco de Dados — Supabase (PostgreSQL)

### 1. Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Preencha: nome do projeto (ex: `gate7-reembolso`), senha do banco, região (`South America (São Paulo)`)
4. Aguarde a criação (~2 minutos)

### 2. Executar o Schema

1. No painel do Supabase, acesse **SQL Editor**
2. Cole todo o conteúdo do arquivo `supabase_schema.sql`
3. Clique em **Run**

### 3. Criar o Storage Bucket

1. Acesse **Storage** no painel
2. Clique em **New Bucket**
3. Nome: `notas-fiscais`
4. Marque **Private** (acesso autenticado)
5. Clique em **Save**

Adicione esta policy no bucket (no SQL Editor):
```sql
CREATE POLICY "Autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notas-fiscais' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Autenticados podem ver suas NFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notas-fiscais' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Criar o primeiro usuário ADM

No SQL Editor do Supabase, execute:
```sql
-- Crie o usuário via Authentication > Users > Invite User
-- Depois atualize o role para ADM:
UPDATE public.profiles 
SET role = 'adm', nome = 'Administrador Gate7'
WHERE email = 'seu-email@gate7.com.br';
```

Ou crie diretamente em **Authentication > Users > Add User**.

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Passos

```bash
# 1. Clone ou extraia o projeto
cd gate7-portal

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 4. Execute em desenvolvimento
npm run dev
# Acesse: http://localhost:5173

# 5. Build para produção
npm run build
```

### Variáveis de ambiente (.env)

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

Encontre essas credenciais em: **Supabase > Settings > API**

---

## ☁️ Deploy Gratuito — Vercel

1. Suba o código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Configure as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
4. Clique em **Deploy**

URL gerada: `https://gate7-reembolso.vercel.app` (personalizável)

---

## 📁 Estrutura do Projeto

```
gate7-portal/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Navegação lateral
│   │   ├── UI.jsx               # Componentes reutilizáveis
│   │   └── NovoLancamentoModal.jsx  # Modal de novo lançamento
│   ├── hooks/
│   │   └── useAuth.jsx          # Contexto de autenticação
│   ├── lib/
│   │   └── supabase.js          # Cliente Supabase + upload NF
│   ├── pages/
│   │   ├── LoginPage.jsx        # Tela de login
│   │   ├── DashboardPage.jsx    # Dashboard ADM
│   │   ├── MeusLancamentosPage.jsx  # Lançamentos (técnico + ADM)
│   │   ├── BancoHorasPage.jsx   # Banco de horas e NOC
│   │   ├── NotasFiscaisPage.jsx # Notas fiscais
│   │   ├── RelatorioPage.jsx    # Relatório mensal + CSV
│   │   └── ColaboradoresPage.jsx    # Gestão de usuários
│   ├── App.jsx                  # Roteamento principal
│   ├── main.jsx                 # Entry point
│   └── index.css                # Estilos globais Gate7
├── supabase_schema.sql          # Schema completo do banco
├── .env.example                 # Template de variáveis
└── package.json
```

---

## 🔐 Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- Técnicos só veem seus próprios dados — garantido no banco de dados
- Notas fiscais com acesso privado por usuário
- Autenticação via Supabase Auth (JWT)

---

## 📊 Regras de Negócio

| Tipo | Destino | Valor |
|------|---------|-------|
| Horas Normais | Banco de Horas | Acumulado (sem pagamento imediato) |
| NOC | Pagamento | R$ 175,00 por dia trabalhado |
| Combustível | Reembolso | Baseado nos km e NF |
| Alimentação | Reembolso | Valor da NF (obrigatória) |

---

*Portal de Reembolso Gate7 — desenvolvido com React + Supabase*
