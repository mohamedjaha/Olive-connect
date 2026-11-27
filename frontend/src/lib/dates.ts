/** Date du jour au format `YYYY-MM-DD`, en heure locale. */
export function aujourdHui(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

/** Date et heure locales au format attendu par `datetime-local`. */
export function maintenantLocal(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
