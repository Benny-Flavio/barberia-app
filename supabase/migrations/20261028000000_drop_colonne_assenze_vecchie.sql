-- =====================================================================
-- Eliminazione delle vecchie colonne di assenza/permesso singolo
-- =====================================================================
-- Sostituite dalla tabella assenze (20261019000000_assenze_multiple.sql), dati già
-- migrati e colonne svuotate (20261019000100_assenze_pulizia_colonne_vecchie.sql).
-- Verificato prima dell'esecuzione: nessun riferimento nel backend né nel frontend,
-- nessuna vista/funzione/trigger/indice/policy/cron job dipendente, colonne vuote.
-- =====================================================================

BEGIN;

ALTER TABLE public.barbieri DROP COLUMN IF EXISTS assente;
ALTER TABLE public.barbieri DROP COLUMN IF EXISTS motivo_assenza;

COMMIT;
