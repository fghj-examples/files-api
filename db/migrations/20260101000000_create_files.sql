-- migrate:up
create table files (
  id           uuid primary key default gen_random_uuid(),
  -- null owner = a sample from the seed, visible to everyone
  owner_id     text,
  name         text        not null,
  content_type text        not null,
  size         bigint      not null,
  object_key   text        not null unique,
  thumb_key    text,
  status       text        not null default 'pending'
               check (status in ('pending', 'ready')),
  created_at   timestamptz not null default now()
);

create index files_owner_idx on files (owner_id, created_at desc);

-- migrate:down
drop table files;
