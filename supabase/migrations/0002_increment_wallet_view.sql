create or replace function public.increment_wallet_view(target_wallet_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.wallet_views(wallet_id, view_count, last_viewed_at)
  values (target_wallet_id, 1, now())
  on conflict (wallet_id)
  do update set
    view_count = public.wallet_views.view_count + 1,
    last_viewed_at = now(),
    updated_at = now();
end;
$$;
