create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (name) values
  ('Guardería Sala Soles'),
  ('Jardín de Nube Azul'),
  ('Guardería Estrellitas'),
  ('Pequeños Exploradores');

alter table public.daycares add column address text;

update public.daycares set address = case name
  when 'Guardería Sala Soles' then 'Av. Los Pinos 1234, Santiago'
  when 'Jardín de Nube Azul' then 'Calle Primavera 456, Providencia'
  when 'Guardería Estrellitas' then 'Los Alerces 789, Ñuñoa'
  when 'Pequeños Exploradores' then 'Camino Real 321, Las Condes'
end;
