package com.oliveconnect.security;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.repository.UtilisateurRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Convertit un JWT Google OIDC en authentication Spring Security.
 * <p>
 * Les jetons Google ne portent pas de roles applicatifs : ils contiennent
 * l'identite (email, sub, hd, ...). Le role est recherche dans la collection
 * users par email (M1, Sof) et converti en autorite ROLE_<ROLE>.
 * <p>
 * Regles :
 * - email manquant : juge non identifie, aucune autorite ;
 * - email present mais utilisateur absent de la base : role VISITEUR par
 *   defaut (moindre privilege ; l'inscription et l'affectation des roles
 *   sont realisees via UserService, M2 Sof).
 */
@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String EMAIL_CLAIM = "email";
    private static final String SUB_CLAIM = "sub";
    private static final String ROLE_PREFIX = "ROLE_";

    private final UtilisateurRepository utilisateurRepository;

    public JwtAuthConverter(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        return new JwtAuthenticationToken(jwt, authorities);
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        String email = jwt.getClaim(EMAIL_CLAIM);
        if (email == null || email.isBlank()) {
            email = jwt.getClaim(SUB_CLAIM);
        }
        if (email == null || email.isBlank()) {
            return List.of();
        }

        Optional<Utilisateur> utilisateur = utilisateurRepository.findByEmail(email);
        Role role = utilisateur.map(Utilisateur::getRole).orElse(Role.VISITEUR);
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(ROLE_PREFIX + role.name()));

        return authorities;
    }
}