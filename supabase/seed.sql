insert into public.guilds (guild_id, slug, name, description, source_url)
values
  ('curated-base-builders', 'base-builders', 'Base Builders', 'Curated placeholder for Base builder role analysis.', 'https://guild.xyz')
on conflict (guild_id) do nothing;
