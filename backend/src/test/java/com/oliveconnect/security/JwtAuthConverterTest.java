package com.oliveconnect.security;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires du convertisseur JWT Google -> authorities Spring Security (M2 Jahha #2).
 * Les jetons Google ne contiennent pas de roles : le role vient de la collection users.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthConverterTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private Jwt jwtAvecEmail(String email) {
        return Jwt.withTokenValue("token")
            .header("alg", "none")
            .claim("email", email)
            .claim("sub", "google-sub-123")
            .build();
    }

    private Jwt jwtSansEmail(String sub) {
        return Jwt.withTokenValue("token")
            .header("alg", "none")
            .claim("sub", sub)
            .build();
    }

    private List<String> authorities(Jwt jwt) {
        JwtAuthConverter converter = new JwtAuthConverter(utilisateurRepository);
        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);
        return token.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
    }

    @Test
    void emailConnu_roleDeLaBaseUtilise() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("agriculteur@olive.tn");
        utilisateur.setRole(Role.AGRICULTEUR);
        when(utilisateurRepository.findByEmail("agriculteur@olive.tn")).thenReturn(Optional.of(utilisateur));

        List<String> authorities = authorities(jwtAvecEmail("agriculteur@olive.tn"));

        assertEquals(List.of("ROLE_AGRICULTEUR"), authorities);
    }

    @Test
    void emailInconnu_roleVisiteurParDefaut() {
        when(utilisateurRepository.findByEmail("inconnu@olive.tn")).thenReturn(Optional.empty());

        List<String> authorities = authorities(jwtAvecEmail("inconnu@olive.tn"));

        assertEquals(List.of("ROLE_VISITEUR"), authorities);
    }

    @Test
    void sansEmail_rechercheParSub() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("par-sub@olive.tn");
        utilisateur.setRole(Role.ADMIN);
        when(utilisateurRepository.findByEmail("google-sub-123")).thenReturn(Optional.of(utilisateur));

        List<String> authorities = authorities(jwtSansEmail("google-sub-123"));

        assertEquals(List.of("ROLE_ADMIN"), authorities);
    }

    @Test
    void sansEmailNiSansSub_aucuneAutorite() {
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "none")
            .claim("hd", "olive.tn")
            .build();

        assertTrue(authorities(jwt).isEmpty());
    }
}