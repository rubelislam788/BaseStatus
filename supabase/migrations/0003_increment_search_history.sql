create or replace function public.increment_search_history(
  target_address citext,
  target_wallet_id uuid,
  target_source text default 'public'
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.search_history(address, wallet_id, source, search_count, last_searched_at)
  values (target_address, target_wallet_id, target_source, 1, now())
  on conflict (address, source)
  do update set
    wallet_id = excluded.wallet_id,
    search_count = public.search_history.search_count + 1,
    last_searched_at = now(),
    updated_at = now();
end;
$$;
