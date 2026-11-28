import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * État d'une liste filtrable, porté par l'URL.
 *
 * Les filtres et la page vivent dans les paramètres de recherche : changer un
 * filtre produit une seule requête (la clé de requête change), la page revient
 * à zéro, et un lien reste partageable. Aucun `refetch()` manuel.
 */
export function useListeFiltrable<F extends Record<string, string>>(
  filtresParDefaut: F,
  taille = 10,
) {
  const [parametresUrl, setParametresUrl] = useSearchParams();

  const filtres = Object.fromEntries(
    Object.keys(filtresParDefaut).map((cle) => [
      cle,
      parametresUrl.get(cle) ?? filtresParDefaut[cle],
    ]),
  ) as F;

  const page = Math.max(0, Number(parametresUrl.get('page') ?? 0) || 0);

  const definirFiltre = useCallback(
    (cle: keyof F, valeur: string) => {
      setParametresUrl(
        (precedents) => {
          const suivants = new URLSearchParams(precedents);
          if (valeur) suivants.set(String(cle), valeur);
          else suivants.delete(String(cle));
          suivants.delete('page');
          return suivants;
        },
        { replace: true },
      );
    },
    [setParametresUrl],
  );

  const definirPage = useCallback(
    (valeur: number) => {
      setParametresUrl(
        (precedents) => {
          const suivants = new URLSearchParams(precedents);
          if (valeur <= 0) suivants.delete('page');
          else suivants.set('page', String(valeur));
          return suivants;
        },
        { replace: true },
      );
    },
    [setParametresUrl],
  );

  return { filtres, page, taille, definirFiltre, definirPage };
}
