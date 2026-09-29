/**
 * Compara un término de búsqueda (case-insensitive) contra uno o más valores.
 * Soporta strings, arrays de strings y valores nulos/indefinidos, para
 * estandarizar el filtrado de listados (hallazgos, proyectos, etc.).
 */
export function matchesSearchTerm(
  term: string,
  ...values: Array<string | undefined | null | Array<string | undefined | null>>
): boolean {
  const normalizedTerm = term.toLowerCase();
  return values.some(value => {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.some(v => !!v && v.toLowerCase().includes(normalizedTerm));
    }
    return value.toLowerCase().includes(normalizedTerm);
  });
}
