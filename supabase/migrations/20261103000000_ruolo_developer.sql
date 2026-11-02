-- =====================================================================
-- Ruolo 'developer' (sopra super_admin)
-- =====================================================================
-- Gerarchia dei ruoli (profili.ruolo):
--   developer    tutto ciò che può fare il titolare + area "Titolare" della dashboard
--                (comunicazioni a tutti i clienti e aperture straordinarie), riservata a lui
--   super_admin  titolare: agenda di tutti, assenze/permessi di tutto lo staff
--   admin        barbiere: agenda di tutti, assenze/permessi solo propri
--   cliente
-- Gli account developer si creano a mano (Auth > Add user, poi UPDATE profili SET ruolo = 'developer'):
-- nessuna credenziale in questa migrazione.
-- =====================================================================

BEGIN;

ALTER TABLE public.profili DROP CONSTRAINT IF EXISTS profili_ruolo_check;
ALTER TABLE public.profili ADD CONSTRAINT profili_ruolo_check
    CHECK (ruolo IN ('cliente', 'admin', 'super_admin', 'developer'));

-- Collegare un account a un barbiere non deve declassare né il titolare né un developer
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
  -- Non declassa un titolare o un developer
  UPDATE public.profili SET ruolo = 'admin' WHERE id = v_id AND ruolo NOT IN ('super_admin', 'developer');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.collega_account_barbiere(text, integer) FROM public, anon, authenticated;

COMMIT;
