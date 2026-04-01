-- Reload PostgREST schema cache to pick up recently added columns
NOTIFY pgrst, 'reload schema';
