-- Rollback di emergenza di 20261017000000_harden_rls.sql.
-- Ripristina lo stato precedente (INSICURO): usare solo se l'app si rompe
-- e poi riapplicare la migrazione corretta il prima possibile.
BEGIN;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, public;

ALTER VIEW public.vista_clienti  RESET (security_invoker);
ALTER VIEW public.vista_barbieri RESET (security_invoker);

DROP POLICY IF EXISTS "leggi proprio profilo" ON public.profili;
CREATE POLICY "leggi proprio profilo"    ON public.profili FOR SELECT USING (auth.uid() = id);
CREATE POLICY "aggiorna proprio profilo" ON public.profili FOR UPDATE USING (auth.uid() = id);

GRANT EXECUTE ON FUNCTION public.handle_new_user()      TO public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_role(text)  TO public, authenticated;

COMMIT;
