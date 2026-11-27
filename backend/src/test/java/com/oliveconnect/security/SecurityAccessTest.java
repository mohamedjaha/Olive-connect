package com.oliveconnect.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'integration de la chaine de securite (M2 Jahha).
 * <p>
 * Verifient que :
 * - /api/public/** reste accessible sans jeton ;
 * - un jeton valide donne acces aux endpoints de son role ;
 * - un jeton sans le role requis recoit 403 (accès non autorise, ex. M2 Sof #4) ;
 * - un appel sans jeton sur un endpoint protege est refuse (401).
 * <p>
 * La creation automatique d'index est desactivee pour ne pas dependre de
 * MongoDB pendant les tests de securite.
 */
@SpringBootTest(properties = "spring.data.mongodb.auto-index-creation=false")
@AutoConfigureMockMvc
class SecurityAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @TestConfiguration
    static class NoopConfig {
    }

    private static SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor avecJeton(String... roles) {
        List<GrantedAuthority> authorities = java.util.Arrays.stream(roles)
            .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r))
            .toList();
        return SecurityMockMvcRequestPostProcessors.jwt()
            .authorities(authorities)
            .jwt(j -> j.claim("email", "agriculteur@olive.tn").claim("sub", "sub-123"));
    }

    @Test
    @DisplayName("Sans jeton : health public accessible, endpoint protege refuse")
    void sansJeton() throws Exception {
        mockMvc.perform(get("/api/public/health"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/test/any-role"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Agriculteur authentifie : acces a ses endpoints, 403 ailleurs")
    void agriculteurAccesRefuseHorsRole() throws Exception {
        mockMvc.perform(get("/api/test/me").with(avecJeton("AGRICULTEUR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("agriculteur@olive.tn"));

        mockMvc.perform(get("/api/test/agriculteur").with(avecJeton("AGRICULTEUR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.espace").value("AGRICULTEUR"));

        mockMvc.perform(get("/api/test/responsable-collecte").with(avecJeton("AGRICULTEUR")))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/test/admin").with(avecJeton("AGRICULTEUR")))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Responsable de collecte : acces a son espace, refuse sur agriculteur")
    void responsableCollecteHorsRole() throws Exception {
        mockMvc.perform(get("/api/test/responsable-collecte").with(avecJeton("RESPONSABLE_COLLECTE")))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/test/agriculteur").with(avecJeton("RESPONSABLE_COLLECTE")))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chef d'equipe, pressoir et admin : chaque role atteint son endpoint")
    void autresRoles() throws Exception {
        mockMvc.perform(get("/api/test/chef-equipe").with(avecJeton("CHEF_EQUIPE")))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/test/pressoir").with(avecJeton("RESPONSABLE_PRESSOIR")))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/test/admin").with(avecJeton("ADMIN")))
            .andExpect(status().isOk());
    }
}