// Spaziature ridotte solo su smartphone. Le regole stanno in app/+html.tsx in una media query CSS:
// la pagina è pre-renderizzata al build (senza schermo), quindi un valore calcolato in JS con la
// larghezza dello schermo cambierebbe dopo l'idratazione; il CSS invece vale da subito.
// Uso: <View style={...} {...compatto("header")} />  →  attributo data-compatto="header"
export type Compatto = "home" | "header" | "indietro";

export const compatto = (tipo: Compatto) => ({ dataSet: { compatto: tipo } }) as any;
