-- =====================================================================
-- Orari delle sedi e turni dei barbieri programmabili da una data futura
-- =====================================================================
-- Ogni modifica crea una VERSIONE con una data di inizio validità (valido_dal):
--   in un giorno D vale la versione con il valido_dal più recente <= D.
-- Le tabelle *_versioni dicono quali versioni esistono, anche quando una versione non ha righe
-- (settimana tutta chiusa / barbiere sempre a riposo); le righe orari/turni appartengono a una versione.
-- Orari e turni attuali diventano la versione '2000-01-01' (valida da sempre): nulla cambia per i clienti.
-- Compatibile con il backend precedente: finché esiste solo la versione 2000-01-01 il suo
-- comportamento resta identico (le nuove righe prendono valido_dal di default).
-- Nuove sedi e nuovi barbieri ricevono automaticamente la loro versione iniziale (trigger).
-- =====================================================================

BEGIN;

-- ── Orari delle sedi ──
CREATE TABLE IF NOT EXISTS public.orari_sedi_versioni (
    sede_id    integer NOT NULL REFERENCES public.sedi(id) ON DELETE CASCADE,
    valido_dal date NOT NULL,
    creata_il  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (sede_id, valido_dal)
);
INSERT INTO public.orari_sedi_versioni (sede_id, valido_dal)
SELECT id, DATE '2000-01-01' FROM public.sedi ON CONFLICT DO NOTHING;

ALTER TABLE public.orari_sedi ADD COLUMN IF NOT EXISTS valido_dal date NOT NULL DEFAULT DATE '2000-01-01';
ALTER TABLE public.orari_sedi DROP CONSTRAINT IF EXISTS orari_sedi_pkey;
ALTER TABLE public.orari_sedi ADD PRIMARY KEY (sede_id, valido_dal, giorno_settimana, ora_inizio);
ALTER TABLE public.orari_sedi DROP CONSTRAINT IF EXISTS orari_sedi_versione_fkey;
ALTER TABLE public.orari_sedi ADD CONSTRAINT orari_sedi_versione_fkey
    FOREIGN KEY (sede_id, valido_dal) REFERENCES public.orari_sedi_versioni (sede_id, valido_dal) ON DELETE CASCADE;

-- ── Turni dei barbieri ──
CREATE TABLE IF NOT EXISTS public.turni_versioni (
    barbiere_id integer NOT NULL REFERENCES public.barbieri(id) ON DELETE CASCADE,
    valido_dal  date NOT NULL,
    creata_il   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (barbiere_id, valido_dal)
);
INSERT INTO public.turni_versioni (barbiere_id, valido_dal)
SELECT id, DATE '2000-01-01' FROM public.barbieri ON CONFLICT DO NOTHING;

ALTER TABLE public.turni_rotazione ADD COLUMN IF NOT EXISTS valido_dal date NOT NULL DEFAULT DATE '2000-01-01';
DROP INDEX IF EXISTS public.turni_un_turno_per_giorno;
CREATE UNIQUE INDEX turni_un_turno_per_giorno ON public.turni_rotazione (barbiere_id, valido_dal, giorno_settimana);
ALTER TABLE public.turni_rotazione DROP CONSTRAINT IF EXISTS turni_rotazione_versione_fkey;
ALTER TABLE public.turni_rotazione ADD CONSTRAINT turni_rotazione_versione_fkey
    FOREIGN KEY (barbiere_id, valido_dal) REFERENCES public.turni_versioni (barbiere_id, valido_dal) ON DELETE CASCADE;

-- ── Versione iniziale per sedi e barbieri nuovi ──
CREATE OR REPLACE FUNCTION public.crea_versione_iniziale_orari() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.orari_sedi_versioni (sede_id, valido_dal) VALUES (NEW.id, DATE '2000-01-01') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.crea_versione_iniziale_turni() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.turni_versioni (barbiere_id, valido_dal) VALUES (NEW.id, DATE '2000-01-01') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sedi_versione_iniziale ON public.sedi;
CREATE TRIGGER sedi_versione_iniziale AFTER INSERT ON public.sedi
    FOR EACH ROW EXECUTE FUNCTION public.crea_versione_iniziale_orari();
DROP TRIGGER IF EXISTS barbieri_versione_iniziale ON public.barbieri;
CREATE TRIGGER barbieri_versione_iniziale AFTER INSERT ON public.barbieri
    FOR EACH ROW EXECUTE FUNCTION public.crea_versione_iniziale_turni();
REVOKE EXECUTE ON FUNCTION public.crea_versione_iniziale_orari() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crea_versione_iniziale_turni() FROM public, anon, authenticated;

ALTER TABLE public.orari_sedi_versioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turni_versioni ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orari_sedi_versioni, public.turni_versioni FROM anon, authenticated;

COMMIT;
