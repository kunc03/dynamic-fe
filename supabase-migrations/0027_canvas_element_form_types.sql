-- Migration 0027: Canvas Element Dynamic Form Types & Constraints
-- Memperbarui constraint dan RPC save_canvas_elements agar mendukung type 'form_input', 'button', 'text', 'image'

-- Hapus constraint type lama jika ada
alter table public.canvas_elements
  drop constraint if exists canvas_elements_type_check;

-- Pastikan kolom translations dan on_click_config tersedia
alter table public.canvas_elements
  add column if not exists translations jsonb not null default '{}'::jsonb,
  add column if not exists on_click_config jsonb default null;

-- Perbarui RPC save_canvas_elements
create or replace function public.save_canvas_elements (p_page_key text, p_elements jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: requires admin' using errcode = '42501';
  end if;

  delete from public.canvas_elements where page_key = p_page_key;

  insert into public.canvas_elements (
    id,
    page_key,
    type,
    content,
    content_en,
    content_ja,
    translations,
    pos_x,
    pos_y,
    width,
    height,
    z_index,
    font_size,
    color,
    font_preset_id,
    on_click_action,
    on_click_config
  )
  select
    coalesce(nullif(elem ->> 'id', '')::uuid, gen_random_uuid()),
    p_page_key,
    elem ->> 'type',
    coalesce(elem ->> 'content', ''),
    nullif(elem ->> 'contentEn', ''),
    nullif(elem ->> 'contentJa', ''),
    coalesce(elem -> 'translations', '{}'::jsonb),
    coalesce((elem ->> 'x')::numeric, 24),
    coalesce((elem ->> 'y')::numeric, 24),
    coalesce((elem ->> 'width')::numeric, 160),
    coalesce((elem ->> 'height')::numeric, 48),
    coalesce((elem ->> 'zIndex')::integer, 0),
    nullif(elem ->> 'fontSize', '')::integer,
    nullif(elem ->> 'color', ''),
    nullif(elem ->> 'fontPresetId', ''),
    nullif(elem ->> 'onClickAction', ''),
    case
      when elem ? 'onClickConfig' and elem -> 'onClickConfig' is not null and elem -> 'onClickConfig' != 'null'::jsonb
      then elem -> 'onClickConfig'
      else null
    end
  from jsonb_array_elements(p_elements) elem;

  update public.site_settings set config_version = config_version + 1 where id = 1;
end;
$$;

grant execute on function public.save_canvas_elements to authenticated;
