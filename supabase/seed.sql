-- Sample data for local development/demo purposes.
-- Run in the Supabase SQL Editor after schema.sql. Safe to re-run --
-- clears existing operating_tables rows first so you don't get duplicates.
--
-- RLS on operating_tables only grants SELECT to authenticated users (see
-- schema.sql), so the app itself can never write here with the anon key --
-- seeding/managing tables is an admin action, done here or from a future
-- admin tool, never from client code.

delete from public.operating_tables;

insert into public.operating_tables (type, variant, min_stake, max_stake, capacity, active_players) values
  ('standard', '8_ball', 10, 100, 2, 0),
  ('standard', '9_ball', 20, 200, 2, 1),
  ('special', 'classic', 50, 500, 2, 0),
  ('tournament', '8_ball', 100, 1000, 8, 3);
