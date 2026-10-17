-- =====================================================================
-- Agenda per barbiere
-- =====================================================================
-- Ruoli staff (profili.ruolo):
--   super_admin  titolare: vede e gestisce l'agenda di tutti i barbieri
--   admin        barbiere: vede e gestisce SOLO la propria agenda, cioè il
--                barbiere con barbieri.profilo_id = il suo id utente.
--                Un admin non collegato a nessun barbiere non ha accesso.
--
-- Per dare l'accesso a un barbiere:
--   1. Supabase Dashboard > Authentication > Add user (email + password,
--      "Auto confirm"). Il trigger crea il profilo come 'cliente'.
--   2. Dal SQL editor:  SELECT public.collega_account_barbiere('email@...', <id barbiere>);
-- =====================================================================

BEGIN;

-- Un account può essere collegato a un solo barbiere
CREATE UNIQUE INDEX IF NOT EXISTS barbieri_profilo_id_key
  ON public.barbieri (profilo_id) WHERE profilo_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.collega_account_barbiere(p_email text, p_barbiere_id integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Nessun utente con email %', p_email;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.barbieri WHERE id = p_barbiere_id) THEN
    RAISE EXCEPTION 'Barbiere % inesistente', p_barbiere_id;
  END IF;

  UPDATE public.barbieri SET profilo_id = NULL WHERE profilo_id = v_id;
  UPDATE public.barbieri SET profilo_id = v_id WHERE id = p_barbiere_id;
  -- Non declassa un titolare
  UPDATE public.profili SET ruolo = 'admin' WHERE id = v_id AND ruolo <> 'super_admin';
END;
$function$;

-- Solo dal SQL editor / ruolo postgres, mai dall'API pubblica
REVOKE EXECUTE ON FUNCTION public.collega_account_barbiere(text, integer) FROM public, anon, authenticated;

COMMIT;
