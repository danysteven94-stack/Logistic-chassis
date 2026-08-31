-- ============================================================
-- DEKA GROUP - Seed des chassis DKN-001 à DKN-015
-- À exécuter APRÈS schema.sql dans le SQL Editor de Supabase
-- ============================================================

insert into public.chassis (chassis_number, type, status)
select
  'DKN-' || lpad(n::text, 3, '0'),
  null,
  'available'
from generate_series(1, 15) as n
on conflict (chassis_number) do nothing;
