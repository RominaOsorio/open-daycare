create type public.post_type as enum (
  'meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement'
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id),
  room_id uuid references public.rooms(id) on delete set null,
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (post_id, child_id)
);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

create index posts_published_at_idx on public.posts (published_at desc);
create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index post_children_child_id_idx on public.post_children (child_id);
create index post_photos_post_id_idx on public.post_photos (post_id, position);
