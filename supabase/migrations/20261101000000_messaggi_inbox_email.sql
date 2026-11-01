-- =====================================================================
-- Messaggi come inbox: tipo di messaggio, comunicazioni dello staff, tracciamento email
-- =====================================================================
-- notifiche diventa l'inbox del cliente (in-app + email):
--   tipo              'cancellazione' | 'ripristino' (automatici, assenze/permessi dei barbieri),
--                     'comunicazione' (messaggio manuale dello staff), 'info' (generico/legacy)
--   titolo            oggetto breve mostrato in app e usato come oggetto dell'email
--   comunicazione_id  la comunicazione dello staff da cui nasce il messaggio (una riga per cliente,
--                     così ognuno ha il proprio stato "letto")
--   email_inviata_at / email_errore  esito dell'invio email (NULL/NULL = non inviata)
-- comunicazioni conserva il messaggio originale inviato dallo staff.
-- Tutto additivo: il backend precedente continua a funzionare (tipo prende il default 'info').
-- Accesso solo dal backend (ruolo postgres), come le altre tabelle: nessun permesso alle API pubbliche.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.comunicazioni (
    id          bigserial PRIMARY KEY,
    titolo      text NOT NULL CHECK (char_length(titolo) BETWEEN 1 AND 120),
    messaggio   text NOT NULL CHECK (char_length(messaggio) BETWEEN 1 AND 2000),
    sede_id     integer REFERENCES public.sedi(id) ON DELETE SET NULL,  -- NULL = tutte le sedi
    inviata_da  uuid,                                                   -- profilo dello staff
    destinatari integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comunicazioni ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.comunicazioni FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.comunicazioni_id_seq FROM anon, authenticated;

ALTER TABLE public.notifiche
    ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'info',
    ADD COLUMN IF NOT EXISTS titolo text,
    ADD COLUMN IF NOT EXISTS comunicazione_id bigint REFERENCES public.comunicazioni(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS email_inviata_at timestamptz,
    ADD COLUMN IF NOT EXISTS email_errore text;

ALTER TABLE public.notifiche DROP CONSTRAINT IF EXISTS notifiche_tipo_check;
ALTER TABLE public.notifiche ADD CONSTRAINT notifiche_tipo_check
    CHECK (tipo IN ('info', 'cancellazione', 'ripristino', 'comunicazione'));

-- Messaggi già esistenti: tipo e titolo ricavati dal testo fisso generato dal backend
UPDATE public.notifiche SET tipo = 'cancellazione', titolo = 'Appuntamento cancellato'
 WHERE tipo = 'info' AND messaggio LIKE 'Ci scusiamo per il disagio.%';
UPDATE public.notifiche SET tipo = 'ripristino', titolo = 'Appuntamento ripristinato'
 WHERE tipo = 'info' AND messaggio LIKE 'Buone notizie!%';

-- Inbox del cliente: ultimi messaggi in ordine di data
CREATE INDEX IF NOT EXISTS notifiche_cliente_created_idx
    ON public.notifiche (cliente_uuid, created_at DESC);

COMMIT;
