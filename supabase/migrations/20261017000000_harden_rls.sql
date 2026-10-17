-- =====================================================================
-- Hardening RLS / grants per la produzione
-- =====================================================================
-- Architettura: il frontend usa la chiave publishable SOLO per
--   1) supabase.auth.*                       (login / OTP)
--   2) SELECT sul proprio record di profili  (redirect per ruolo)
--   3) RPC check_user_role                   (flusso di login)
-- Tutto il resto (prenotazioni, slot, notifiche, agenda admin) passa dal
-- backend Express, che si connette come ruolo `postgres` (bypassa la RLS)
-- e applica i controlli di autorizzazione lato server.
--
-- Quindi i ruoli API `anon` e `authenticated` ricevono il minimo
-- indispensabile: RLS attiva ovunque, nessuna policy = accesso negato.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. RLS attiva su tutte le tabelle (già attiva, ribadita per idempotenza)
-- ---------------------------------------------------------------------
ALTER TABLE public.barbieri        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clienti         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifiche       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prenotazioni    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profili         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedi            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servizi         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turni_rotazione ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. Viste: giravano come `postgres` (security definer implicito) e
--    quindi IGNORAVANO la RLS di profili. Con la chiave publishable
--    chiunque poteva leggere nome/cognome/telefono di tutti gli utenti
--    e, essendo viste aggiornabili, anche fare UPDATE su profili
--    (es. ruolo = 'admin'). Non sono usate né dal frontend né dal backend.
-- ---------------------------------------------------------------------
ALTER VIEW public.vista_clienti  SET (security_invoker = true);
ALTER VIEW public.vista_barbieri SET (security_invoker = true);
REVOKE ALL ON public.vista_clienti, public.vista_barbieri FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Grant: Supabase concede di default ALL (incluso TRUNCATE, che non
--    è soggetto a RLS) ad anon/authenticated. Li togliamo tutti e
--    ridiamo solo ciò che il frontend usa davvero.
-- ---------------------------------------------------------------------
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT ON public.profili TO authenticated;

-- Le tabelle create in futuro dal ruolo postgres non saranno più
-- esposte automaticamente all'API.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, public;

-- ---------------------------------------------------------------------
-- 4. profili: un utente legge SOLO il proprio record.
--    La vecchia policy UPDATE (auth.uid() = id, senza limiti sulle
--    colonne) permetteva a un cliente di impostarsi ruolo = 'admin'
--    e ottenere l'accesso all'agenda admin. Le modifiche al profilo
--    passano già dal backend (PATCH /api/auth/profilo).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "aggiorna proprio profilo" ON public.profili;
DROP POLICY IF EXISTS "leggi proprio profilo"    ON public.profili;

CREATE POLICY "leggi proprio profilo" ON public.profili
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ---------------------------------------------------------------------
-- 5. Trigger di registrazione: il ruolo veniva letto da
--    raw_user_meta_data, che il client controlla. Chiunque poteva
--    registrarsi con data: { ruolo: 'admin' }. Ora ogni nuovo utente
--    è 'cliente'; gli admin si promuovono a mano dal backend/dashboard.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profili (id, nome, cognome, telefono, ruolo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    'cliente'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- check_user_role serve al flusso di login (utente non ancora autenticato)
REVOKE EXECUTE ON FUNCTION public.check_user_role(text) FROM public, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_user_role(text) TO anon;

COMMIT;
