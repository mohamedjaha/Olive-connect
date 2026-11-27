package com.oliveconnect.security;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.repository.UtilisateurRepository;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Identite de l'appelant deduite du jeton Google OAuth2 (M2/M3).
 * <p>
 * Memes regles que UserService : jeton obligatoire, email Google verifie
 * obligatoire, compte enregistre et actif obligatoire pour agir.
 */
@Component
public class UtilisateurAuthentifie {

    /**
     * Email verifie porte par le jeton.
     */
    public String emailVerifie() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise");
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()
                || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email Google non verifie");
        }
        return email;
    }

    /**
     * Identifiant de l'utilisateur enregistre correspondant au jeton.
     */
    public ObjectId identifiant(UtilisateurRepository utilisateurRepository) {
        String email = emailVerifie();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Compte non enregistre"));
        if (!Boolean.TRUE.equals(utilisateur.getActif())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte desactive");
        }
        return utilisateur.getId();
    }

    /**
     * Indique si l'appelant porte l'autorite ROLE_<role>.
     */
    public boolean aLeRole(String role) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        String authority = "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }
}