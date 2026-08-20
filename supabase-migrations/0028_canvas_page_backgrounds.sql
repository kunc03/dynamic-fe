-- Migration 0028: Per-Page Canvas Backgrounds
-- Menyimpan background (warna/gambar) per page_key alih-alih hanya 1 background global

create table if not exists public.canvas_page_backgrounds (
  page_key text primary key,
  bg_mode text not null default 'color' check (bg_mode in ('color', 'image')),
  bg_color text default null,
  bg_image text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.canvas_page_backgrounds enable row level security;

create policy "canvas_page_backgrounds_select_all" on public.canvas_page_backgrounds for select using (true);
create policy "canvas_page_backgrounds_no_direct_write" on public.canvas_page_backgrounds for all using (false) with check (false);

-- RPC simpan background per page_key (SECURITY DEFINER, cek is_admin)
create or replace function public.save_page_background (p_page_key text, p_bg jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: requires admin' using errcode = '42501';
  end if;

  insert into public.canvas_page_backgrounds (page_key, bg_mode, bg_color, bg_image, updated_at)
  values (
    p_page_key,
    coalesce(p_bg ->> 'mode', p_bg ->> 'bg_mode', 'color'),
    nullif(coalesce(p_bg ->> 'color', p_bg ->> 'bg_color'), ''),
    nullif(coalesce(p_bg ->> 'imageDataUrl', p_bg ->> 'bg_image'), ''),
    now()
  )
  on conflict (page_key) do update set
    bg_mode = coalesce(p_bg ->> 'mode', p_bg ->> 'bg_mode', 'color'),
    bg_color = nullif(coalesce(p_bg ->> 'color', p_bg ->> 'bg_color'), ''),
    bg_image = nullif(coalesce(p_bg ->> 'imageDataUrl', p_bg ->> 'bg_image'), ''),
    updated_at = now();

  -- Jika home, sinkronkan juga ke site_settings untuk fallback lama
  if p_page_key = 'home' then
    update public.site_settings
    set content_bg_mode = coalesce(p_bg ->> 'mode', p_bg ->> 'bg_mode', 'color'),
        content_bg_color = nullif(coalesce(p_bg ->> 'color', p_bg ->> 'bg_color'), ''),
        content_bg_image = nullif(coalesce(p_bg ->> 'imageDataUrl', p_bg ->> 'bg_image'), '')
    where id = 1;
  end if;

  update public.site_settings set config_version = config_version + 1 where id = 1;
end;
$$;

grant execute on function public.save_page_background to authenticated;
