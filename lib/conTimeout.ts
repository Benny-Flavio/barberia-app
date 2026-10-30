// Le chiamate dirette a Supabase non hanno un tempo massimo: se il servizio non risponde restano
// in attesa per sempre. conTimeout le fa fallire con ServizioNonRaggiungibile dopo `ms`.
export class ServizioNonRaggiungibile extends Error {
  constructor() {
    super("Servizio momentaneamente non raggiungibile");
  }
}

export const conTimeout = <T>(promessa: PromiseLike<T>, ms = 10000): Promise<T> =>
  new Promise<T>((risolvi, rifiuta) => {
    const timer = setTimeout(() => rifiuta(new ServizioNonRaggiungibile()), ms);
    Promise.resolve(promessa).then(
      (v) => { clearTimeout(timer); risolvi(v); },
      (e) => { clearTimeout(timer); rifiuta(e); },
    );
  });
