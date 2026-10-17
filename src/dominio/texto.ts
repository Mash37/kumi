// Para meter texto escrito por la gente dentro de HTML (informes en PDF) sin que se interprete como código.
export function escapar(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
