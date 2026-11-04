-- =====================================================================
-- Console Developer: orari delle sedi, vincolo sui turni, archivio operazioni
-- =====================================================================
-- orari_sedi       fasce di apertura standard per sede e giorno della settimana (0=dom … 6=sab).
--                  Più righe nello stesso giorno = più fasce (es. 09-12 e 15-19); nessuna riga = chiuso.
--                  Valori iniziali IDENTICI a quelli che erano scritti nel codice:
--                  mar/mer/ven/sab 09:00-12:00 e 15:00-19:00, gio 12:00-22:00, dom/lun chiuso.
-- turni_rotazione  un barbiere sta in una sola sede per giorno della settimana (vincolo unico)
-- developer_logs   archivio delle operazioni di sistema del developer (data, tipo azione, descrizione)
-- aperture_straordinarie: il giorno ora deve essere chiuso PER QUELLA SEDE secondo orari_sedi
--                  (controllo nel backend), non più per forza domenica o lunedì.
-- Tabelle solo per il backend: nessun permesso alle API pubbliche.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.orari_sedi (
    sede_id          integer NOT NULL REFERENCES public.sedi(id) ON DELETE CASCADE,
    giorno_settimana smallint NOT NULL CHECK (giorno_settimana BETWEEN 0 AND 6),
    ora_inizio       time NOT NULL,
    ora_fine         time NOT NULL,
    CONSTRAINT orari_sedi_fascia_valida CHECK (ora_fine > ora_inizio),
    PRIMARY KEY (sede_id, giorno_settimana, ora_inizio)
);
ALTER TABLE public.orari_sedi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orari_sedi FROM anon, authenticated;

INSERT INTO public.orari_sedi (sede_id, giorno_settimana, ora_inizio, ora_fine)
SELECT s.id, g, f.inizio::time, f.fine::time
FROM public.sedi s
CROSS JOIN (VALUES (2), (3), (5), (6)) AS giorni(g)
CROSS JOIN (VALUES ('09:00', '12:00'), ('15:00', '19:00')) AS f(inizio, fine)
ON CONFLICT DO NOTHING;
INSERT INTO public.orari_sedi (sede_id, giorno_settimana, ora_inizio, ora_fine)
SELECT s.id, 4, '12:00', '22:00' FROM public.sedi s
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS turni_un_turno_per_giorno
    ON public.turni_rotazione (barbiere_id, giorno_settimana);

CREATE TABLE IF NOT EXISTS public.developer_logs (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    utente_id   uuid,
    azione      text NOT NULL,
    descrizione text NOT NULL,
    dettagli    jsonb
);
CREATE INDEX IF NOT EXISTS developer_logs_created_idx ON public.developer_logs (created_at DESC);
ALTER TABLE public.developer_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.developer_logs FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.developer_logs_id_seq FROM anon, authenticated;

ALTER TABLE public.aperture_straordinarie DROP CONSTRAINT IF EXISTS aperture_solo_giorni_di_chiusura;

COMMIT;
