-- ============================================================
-- PORTAL DE REEMBOLSO GATE7 — Schema Supabase (PostgreSQL)
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. TABELA DE PERFIS (vinculada ao auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null,
  role text not null check (role in ('adm', 'tecnico')),
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- 3. LANÇAMENTOS KM / COMBUSTÍVEL
create table public.lancamentos_km (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  data date not null,
  cliente text not null,
  tipo text not null check (tipo in ('ida', 'volta')),
  partida text not null,
  destino1 text not null,
  destino2 text,
  destino3 text,
  destino_final text,
  km_total numeric(8,2) not null default 0,
  valor_combustivel numeric(10,2),
  estacionamento numeric(10,2) default 0,
  observacao text,
  status text default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  criado_em timestamptz default now()
);

-- 4. LANÇAMENTOS DE HORAS
create table public.lancamentos_horas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  data date not null,
  cliente text not null,
  modalidade text not null check (modalidade in ('presencial','remoto')),
  hora_inicio time not null,
  hora_termino time not null,
  total_minutos integer generated always as (
    case
      when hora_termino > hora_inicio
        then extract(epoch from (hora_termino - hora_inicio))::integer / 60
      else extract(epoch from (hora_termino + interval '24 hours' - hora_inicio))::integer / 60
    end
  ) stored,
  chamado_numero text,
  observacao text,
  tipo text not null default 'normal' check (tipo in ('normal','noc')),
  status text default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  criado_em timestamptz default now()
);

-- 5. LANÇAMENTOS NOC (pagamento R$175/dia)
create table public.lancamentos_noc (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  data date not null,
  cliente text not null,
  hora_inicio time not null default '07:00',
  hora_termino time not null default '19:00',
  valor_dia numeric(10,2) not null default 175.00,
  autorizado_por text,
  observacao text,
  status text default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  criado_em timestamptz default now()
);

-- 6. LANÇAMENTOS DE ALIMENTAÇÃO
create table public.lancamentos_alimentacao (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  data date not null,
  cliente text not null,
  valor numeric(10,2) not null,
  descricao text,
  status text default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  criado_em timestamptz default now()
);

-- 7. NOTAS FISCAIS (vinculadas a qualquer lançamento)
create table public.notas_fiscais (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lancamento_tipo text not null check (lancamento_tipo in ('km','horas','noc','alimentacao')),
  lancamento_id uuid not null,
  nome_arquivo text not null,
  caminho_storage text not null,
  tamanho_bytes bigint,
  mime_type text,
  criado_em timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.lancamentos_km enable row level security;
alter table public.lancamentos_horas enable row level security;
alter table public.lancamentos_noc enable row level security;
alter table public.lancamentos_alimentacao enable row level security;
alter table public.notas_fiscais enable row level security;

-- Helper function: checar se é ADM
create or replace function public.is_adm()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'adm'
  );
$$ language sql security definer;

-- POLICIES: profiles
create policy "Usuário vê próprio perfil" on public.profiles
  for select using (id = auth.uid() or public.is_adm());

create policy "ADM pode atualizar perfis" on public.profiles
  for update using (public.is_adm());

create policy "ADM pode inserir perfis" on public.profiles
  for insert with check (public.is_adm());

-- POLICIES: lancamentos_km
create policy "Técnico vê próprios km" on public.lancamentos_km
  for select using (user_id = auth.uid() or public.is_adm());

create policy "Técnico insere próprio km" on public.lancamentos_km
  for insert with check (user_id = auth.uid());

create policy "Técnico edita próprio km pendente" on public.lancamentos_km
  for update using (user_id = auth.uid() and status = 'pendente' or public.is_adm());

create policy "ADM deleta km" on public.lancamentos_km
  for delete using (public.is_adm());

-- POLICIES: lancamentos_horas
create policy "Técnico vê próprias horas" on public.lancamentos_horas
  for select using (user_id = auth.uid() or public.is_adm());

create policy "Técnico insere horas" on public.lancamentos_horas
  for insert with check (user_id = auth.uid());

create policy "Técnico/ADM edita horas" on public.lancamentos_horas
  for update using (user_id = auth.uid() and status = 'pendente' or public.is_adm());

-- POLICIES: lancamentos_noc
create policy "Técnico vê próprio NOC" on public.lancamentos_noc
  for select using (user_id = auth.uid() or public.is_adm());

create policy "Técnico insere NOC" on public.lancamentos_noc
  for insert with check (user_id = auth.uid());

create policy "Técnico/ADM edita NOC" on public.lancamentos_noc
  for update using (user_id = auth.uid() and status = 'pendente' or public.is_adm());

-- POLICIES: lancamentos_alimentacao
create policy "Técnico vê própria alimentação" on public.lancamentos_alimentacao
  for select using (user_id = auth.uid() or public.is_adm());

create policy "Técnico insere alimentação" on public.lancamentos_alimentacao
  for insert with check (user_id = auth.uid());

create policy "Técnico/ADM edita alimentação" on public.lancamentos_alimentacao
  for update using (user_id = auth.uid() and status = 'pendente' or public.is_adm());

-- POLICIES: notas_fiscais
create policy "Técnico vê próprias NFs" on public.notas_fiscais
  for select using (user_id = auth.uid() or public.is_adm());

create policy "Técnico insere NF" on public.notas_fiscais
  for insert with check (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET para notas fiscais
-- ============================================================
-- Execute no dashboard Supabase > Storage > New Bucket
-- Nome: notas-fiscais | Private: true

-- ============================================================
-- TRIGGER: criar profile ao registrar usuário
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'tecnico')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VIEWS úteis para o dashboard
-- ============================================================

create or replace view public.resumo_colaboradores as
select
  p.id,
  p.nome,
  p.email,
  p.role,
  coalesce(sum(k.valor_combustivel), 0) as total_combustivel,
  coalesce(sum(k.estacionamento), 0) as total_estacionamento,
  coalesce(sum(n.valor_dia), 0) as total_noc,
  coalesce(sum(a.valor), 0) as total_alimentacao,
  coalesce((
    select sum(lh.total_minutos) from public.lancamentos_horas lh
    where lh.user_id = p.id and lh.tipo = 'normal' and lh.status = 'aprovado'
  ), 0) as banco_horas_minutos
from public.profiles p
left join public.lancamentos_km k on k.user_id = p.id and k.status = 'aprovado'
left join public.lancamentos_noc n on n.user_id = p.id and n.status = 'aprovado'
left join public.lancamentos_alimentacao a on a.user_id = p.id and a.status = 'aprovado'
where p.role = 'tecnico'
group by p.id, p.nome, p.email, p.role;

-- Permissão na view só para ADM
create policy "ADM acessa resumo" on public.profiles
  for select using (public.is_adm() or id = auth.uid());
