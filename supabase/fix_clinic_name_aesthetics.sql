-- Fix clinic name spelling: Esthetics -> Aesthetics
-- Run in Supabase Dashboard -> SQL Editor

update public.clinic_settings
set
  name = replace(name, 'Esthetics', 'Aesthetics'),
  updated_at = now()
where name like '%Esthetics%';

update public.clinic_settings
set
  name = 'Skin Spectrum Aesthetics',
  updated_at = now()
where name in (
  'SkinSpectrum Esthetics',
  'SkinSpectrum Aesthetics',
  'Skin Spectrum Esthetics'
);

alter table public.clinic_settings
  alter column name set default 'Skin Spectrum Aesthetics';

select id, name, updated_at
from public.clinic_settings
order by created_at asc;
