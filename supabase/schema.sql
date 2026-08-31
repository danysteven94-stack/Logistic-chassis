-- ============================================================
-- DEKA GROUP - CHASSIS INVOICE MANAGER
-- Schéma Supabase complet (tables + RLS + triggers)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('admin', 'modpass');
create type chassis_status as enum ('available', 'in', 'out');

-- ------------------------------------------------------------
-- USERS (profil lié à auth.users)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'modpass',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CLIENTS
-- ------------------------------------------------------------
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CHASSIS
-- ------------------------------------------------------------
create table public.chassis (
  id uuid primary key default uuid_generate_v4(),
  chassis_number text not null unique,
  type text,
  status chassis_status not null default 'available',
  date_in date,
  date_out date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_chassis_number on public.chassis (chassis_number);
create index idx_chassis_status on public.chassis (status);

-- ------------------------------------------------------------
-- INVOICE NUMBER SEQUENCE (format DKN-YYYY-00001)
-- ------------------------------------------------------------
create table public.invoice_sequences (
  year int primary key,
  last_number int not null default 0
);

create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
as $$
declare
  cur_year int := extract(year from now());
  next_num int;
  result text;
begin
  insert into public.invoice_sequences (year, last_number)
  values (cur_year, 1)
  on conflict (year) do update set last_number = public.invoice_sequences.last_number + 1
  returning last_number into next_num;

  result := 'DKN-' || cur_year || '-' || lpad(next_num::text, 5, '0');
  return result;
end;
$$;

-- ------------------------------------------------------------
-- INVOICES
-- ------------------------------------------------------------
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique default public.generate_invoice_number(),
  client_id uuid not null references public.clients(id),
  invoice_date date not null default current_date,
  total_in int not null default 0,
  total_out int not null default 0,
  balance int not null default 0,
  status text not null default 'active', -- active / printed
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);
create index idx_invoices_number on public.invoices (invoice_number);
create index idx_invoices_client on public.invoices (client_id);

-- ------------------------------------------------------------
-- INVOICE ITEMS
-- ------------------------------------------------------------
create table public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  chassis_id uuid references public.chassis(id),
  chassis_number text not null,
  description text,
  in_qty int not null default 0,
  out_qty int not null default 0,
  observation text,
  created_at timestamptz not null default now()
);
create index idx_items_invoice on public.invoice_items (invoice_id);

-- ------------------------------------------------------------
-- ACTIVITY LOGS (audit - non modifiable / non supprimable)
-- ------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  date timestamptz not null default now()
);
create index idx_logs_date on public.activity_logs (date desc);

-- ------------------------------------------------------------
-- TRIGGERS: recalcul automatique des totaux de facture
-- ------------------------------------------------------------
create or replace function public.recalc_invoice_totals()
returns trigger
language plpgsql
as $$
declare
  inv_id uuid;
  sum_in int;
  sum_out int;
begin
  inv_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(in_qty),0), coalesce(sum(out_qty),0)
  into sum_in, sum_out
  from public.invoice_items
  where invoice_id = inv_id;

  update public.invoices
  set total_in = sum_in,
      total_out = sum_out,
      balance = sum_in - sum_out,
      updated_at = now()
  where id = inv_id;

  return null;
end;
$$;

create trigger trg_recalc_totals_ins
after insert or update or delete on public.invoice_items
for each row execute function public.recalc_invoice_totals();

-- ------------------------------------------------------------
-- TRIGGER: mise à jour du statut chassis selon IN/OUT de facture
-- ------------------------------------------------------------
create or replace function public.update_chassis_status()
returns trigger
language plpgsql
as $$
begin
  if new.chassis_id is not null then
    if new.in_qty > 0 then
      update public.chassis
      set status = 'in', date_in = current_date, updated_at = now()
      where id = new.chassis_id;
    elsif new.out_qty > 0 then
      update public.chassis
      set status = 'out', date_out = current_date, updated_at = now()
      where id = new.chassis_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_update_chassis_status
after insert or update on public.invoice_items
for each row execute function public.update_chassis_status();

-- ------------------------------------------------------------
-- HELPER: rôle de l'utilisateur courant
-- ------------------------------------------------------------
create or replace function public.current_user_role()
returns user_role
language sql
security definer
stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.chassis enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.activity_logs enable row level security;

-- USERS: tout utilisateur connecté peut lire; seul admin gère
create policy "users_select" on public.users for select
  using (auth.uid() is not null);
create policy "users_insert_admin" on public.users for insert
  with check (public.current_user_role() = 'admin');
create policy "users_delete_admin" on public.users for delete
  using (public.current_user_role() = 'admin');
create policy "users_update_admin" on public.users for update
  using (public.current_user_role() = 'admin');

-- CLIENTS: admin + modpass peuvent lire/créer/modifier ; suppression admin seulement
create policy "clients_select" on public.clients for select
  using (auth.uid() is not null);
create policy "clients_insert" on public.clients for insert
  with check (auth.uid() is not null);
create policy "clients_update" on public.clients for update
  using (auth.uid() is not null);
create policy "clients_delete_admin" on public.clients for delete
  using (public.current_user_role() = 'admin');

-- CHASSIS: idem
create policy "chassis_select" on public.chassis for select
  using (auth.uid() is not null);
create policy "chassis_insert" on public.chassis for insert
  with check (auth.uid() is not null);
create policy "chassis_update" on public.chassis for update
  using (auth.uid() is not null);
create policy "chassis_delete_admin" on public.chassis for delete
  using (public.current_user_role() = 'admin');

-- INVOICES: admin + modpass lisent/créent/modifient ; suppression admin seulement
create policy "invoices_select" on public.invoices for select
  using (auth.uid() is not null);
create policy "invoices_insert" on public.invoices for insert
  with check (auth.uid() is not null);
create policy "invoices_update" on public.invoices for update
  using (auth.uid() is not null);
create policy "invoices_delete_admin" on public.invoices for delete
  using (public.current_user_role() = 'admin');

-- INVOICE ITEMS: suit la même logique que invoices
create policy "items_select" on public.invoice_items for select
  using (auth.uid() is not null);
create policy "items_insert" on public.invoice_items for insert
  with check (auth.uid() is not null);
create policy "items_update" on public.invoice_items for update
  using (auth.uid() is not null);
create policy "items_delete_admin" on public.invoice_items for delete
  using (public.current_user_role() = 'admin');

-- ACTIVITY LOGS: lecture pour tous les connectés, insertion pour tous,
-- AUCUNE politique update/delete => impossible de modifier ou supprimer un log.
create policy "logs_select" on public.activity_logs for select
  using (auth.uid() is not null);
create policy "logs_insert" on public.activity_logs for insert
  with check (auth.uid() is not null);

-- ------------------------------------------------------------
-- Auto-créer un profil public.users à l'inscription (fallback)
-- (la création d'utilisateurs se fait normalement via l'admin/API)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email, 'modpass')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
