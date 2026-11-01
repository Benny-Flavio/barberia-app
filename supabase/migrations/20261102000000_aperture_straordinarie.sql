-- =====================================================================
-- Aperture straordinarie: una SINGOLA data di chiusura (domenica o lunedì) resa prenotabile
-- =====================================================================
-- Ogni riga sblocca esattamente una data per una sede: non esistono regole ricorrenti, quindi
-- tutte le altre domeniche e gli altri lunedì restano chiusi.
--   data        la data specifica (deve essere domenica o lunedì: gli altri giorni sono già aperti)
--   sede_id     la sede che apre
--   ora_inizio / ora_fine  fascia prenotabile di quel giorno
--   barbieri    id dei barbieri in servizio quel giorno (i turni settimanali non coprono dom/lun)
--   comunicazione_id  l'eventuale avviso inviato ai clienti
-- Gestite solo dal titolare tramite il backend; nessun permesso alle API pubbliche.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.aperture_straordinarie (
    id               bigserial PRIMARY KEY,
    data             date NOT NULL,
    sede_id          integer NOT NULL REFERENCES public.sedi(id) ON DELETE CASCADE,
    ora_inizio       time NOT NULL,
    ora_fine         time NOT NULL,
    barbieri         integer[] NOT NULL,
    comunicazione_id bigint REFERENCES public.comunicazioni(id) ON DELETE SET NULL,
    creata_da        uuid,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT aperture_una_per_sede_e_data UNIQUE (data, sede_id),
    CONSTRAINT aperture_solo_giorni_di_chiusura CHECK (extract(dow FROM data) IN (0, 1)),
    CONSTRAINT aperture_orario_valido CHECK (ora_fine > ora_inizio),
    CONSTRAINT aperture_con_barbieri CHECK (cardinality(barbieri) > 0)
);

CREATE INDEX IF NOT EXISTS aperture_straordinarie_data_idx ON public.aperture_straordinarie (data);

ALTER TABLE public.aperture_straordinarie ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.aperture_straordinarie FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.aperture_straordinarie_id_seq FROM anon, authenticated;

COMMIT;
