-- Migration 0029: Per-Page Header & Footer Visibility
-- Menambahkan kolom header_visible dan footer_visible per page_key

alter table public.canvas_page_backgrounds
  add column if not exists header_visible boolean not null default true,
  add column if not exists footer_visible boolean not null default true;

-- Update RPC save_page_background agar menerima header_visible & footer_visible
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

  insert into public.canvas_page_backgrounds (
    page_key,
    bg_mode,
    bg_color,
    bg_image,
    header_visible,
    footer_visible,
    updated_at
  )
  values (
    p_page_key,
    coalesce(p_bg ->> 'mode', p_bg ->> 'bg_mode', 'color'),
    nullif(coalesce(p_bg ->> 'color', p_bg ->> 'bg_color'), ''),
    nullif(coalesce(p_bg ->> 'imageDataUrl', p_bg ->> 'bg_image'), ''),
    coalesce((p_bg ->> 'headerVisible')::boolean, (p_bg ->> 'header_visible')::boolean, true),
    coalesce((p_bg ->> 'footerVisible')::boolean, (p_bg ->> 'footer_visible')::boolean, true),
    now()
  )
  on conflict (page_key) do update set
    bg_mode = coalesce(p_bg ->> 'mode', p_bg ->> 'bg_mode', 'color'),
    bg_color = nullif(coalesce(p_bg ->> 'color', p_bg ->> 'bg_color'), ''),
    bg_image = nullif(coalesce(p_bg ->> 'imageDataUrl', p_bg ->> 'bg_image'), ''),
    header_visible = coalesce((p_bg ->> 'headerVisible')::boolean, (p_bg ->> 'header_visible')::boolean, canvas_page_backgrounds.header_visible),
    footer_visible = coalesce((p_bg ->> 'footerVisible')::boolean, (p_bg ->> 'footer_visible')::boolean, canvas_page_backgrounds.footer_visible),
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
