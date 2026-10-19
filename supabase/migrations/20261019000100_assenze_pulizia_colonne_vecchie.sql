-- Da applicare DOPO il deploy del backend che usa la tabella assenze.
-- Svuota le vecchie colonne (i dati sono già stati copiati da 20261019000000_assenze_multiple.sql),
-- così nessun valore vecchio resta in giro (es. /api/barbieri/:sede_id filtra ancora su assente).
UPDATE public.barbieri SET assente = false, motivo_assenza = NULL
WHERE motivo_assenza IS NOT NULL OR assente;
