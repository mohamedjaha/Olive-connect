/** Fabrique de jetons JWT pour les tests (signature non vérifiée côté client). */

function base64url(valeur: string): string {
  const octets = new TextEncoder().encode(valeur);
  let binaire = '';
  octets.forEach((octet) => {
    binaire += String.fromCharCode(octet);
  });
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fabriquerJeton(charge: Record<string, unknown>): string {
  const entete = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const corps = base64url(JSON.stringify(charge));
  return `${entete}.${corps}.signature-de-test`;
}

/** Jeton d'identité Google valide, surchargeable champ par champ. */
export function jetonValide(surcharge: Record<string, unknown> = {}): string {
  return fabriquerJeton({
    sub: 'google-123',
    email: 'fedi@oliveconnect.tn',
    email_verified: true,
    name: 'Fedi Hassine',
    given_name: 'Fedi',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...surcharge,
  });
}

/** Jeton déjà expiré. */
export function jetonExpire(): string {
  return jetonValide({ exp: Math.floor(Date.now() / 1000) - 60 });
}
