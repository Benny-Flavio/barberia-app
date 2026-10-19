-- =====================================================================
-- Assenze e permessi multipli per barbiere
-- =====================================================================
-- Prima: un solo JSON in barbieri.motivo_assenza (+ flag barbieri.assente),
-- quindi ogni nuovo permesso sovrascriveva il precedente.
-- Ora: tabella assenze, un record per ogni assenza/permesso.
--   tipo 'assente'  -> giornate intere da data_inizio a data_fine (NULL = senza fine)
--   tipo 'permesso' -> fascia [ora_inizio, ora_fine) nel giorno data_inizio (= data_fine)
-- La non-sovrapposizione tra record dello stesso barbiere è verificata dal backend.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.assenze (
  id          bigserial PRIMARY KEY,
  barbiere_id integer NOT NULL REFERENCES public.barbieri(id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('assente', 'permesso')),
  data_inizio date NOT NULL,
  data_fine   date,
  ora_inizio  time,
  ora_fine    time,
  motivo      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assenze_forma CHECK (
    (tipo = 'assente'
      AND ora_inizio IS NULL AND ora_fine IS NULL
      AND (data_fine IS NULL OR data_fine >= data_inizio))
    OR
    (tipo = 'permesso'
      AND ora_inizio IS NOT NULL AND ora_fine IS NOT NULL AND ora_fine > ora_inizio
      AND data_fine = data_inizio)
  )
);

CREATE INDEX IF NOT EXISTS assenze_barbiere_data_idx ON public.assenze (barbiere_id, data_inizio);

-- Solo il backend (ruolo postgres) accede alla tabella
ALTER TABLE public.assenze ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assenze FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.assenze_id_seq FROM anon, authenticated;

-- Prenotazione cancellata da un'assenza/permesso: serve per ripristinare esattamente
-- quelle prenotazioni se l'assenza viene annullata
ALTER TABLE public.prenotazioni
  ADD COLUMN IF NOT EXISTS cancellata_da_assenza bigint REFERENCES public.assenze(id) ON DELETE SET NULL;

-- Migrazione dal vecchio formato JSON
INSERT INTO public.assenze (barbiere_id, tipo, data_inizio, data_fine, ora_inizio, ora_fine, motivo)
SELECT b.id,
       'permesso',
       left(j->>'inizio', 10)::date,
       left(j->>'inizio', 10)::date,
       substr(j->>'inizio', 12, 5)::time,
       CASE WHEN substr(j->>'fine', 12, 5)::time > substr(j->>'inizio', 12, 5)::time
            THEN substr(j->>'fine', 12, 5)::time ELSE time '24:00' END,
       NULL
FROM public.barbieri b, LATERAL (SELECT b.motivo_assenza::jsonb AS j) x
WHERE b.motivo_assenza LIKE '{%' AND j->>'tipo' = 'permesso';

INSERT INTO public.assenze (barbiere_id, tipo, data_inizio, data_fine, motivo)
SELECT b.id,
       'assente',
       (j->>'inizio')::date,
       NULLIF(j->>'fine', '')::date,
       j->>'motivo'
FROM public.barbieri b, LATERAL (SELECT b.motivo_assenza::jsonb AS j) x
WHERE b.motivo_assenza LIKE '{%' AND j->>'tipo' = 'assente';

-- Le vecchie colonne vengono svuotate dalla migrazione successiva, DOPO il deploy del
-- nuovo backend (quello vecchio le legge ancora).
COMMENT ON COLUMN public.barbieri.assente IS 'DEPRECATA: usare la tabella assenze';
COMMENT ON COLUMN public.barbieri.motivo_assenza IS 'DEPRECATA: usare la tabella assenze';

COMMIT;
