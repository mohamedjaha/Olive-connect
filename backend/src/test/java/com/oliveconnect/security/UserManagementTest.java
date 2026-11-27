package com.oliveconnect.security;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.repository.UtilisateurRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.data.mongodb.uri=mongodb://127.0.0.1:27017/oliveconnect_m2_test",
        "spring.data.mongodb.database=oliveconnect_m2_test",
        "spring.data.mongodb.auto-index-creation=false"
})
@AutoConfigureMockMvc
class UserManagementTest {
    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository repository;
    @Autowired MongoTemplate mongo;
    private final List<String> emails = new ArrayList<>();
    private Utilisateur a, b, admin;
    private boolean baseVerifiee;

    @BeforeEach
    void preparer() {
        assertEquals("oliveconnect_m2_test", mongo.getDb().getName());
        assertTrue(mongo.collectionExists("users"), "Executer init-db.js sur la base de test");
        baseVerifiee = true;
        a = creer(Role.AGRICULTEUR, true);
        b = creer(Role.AGRICULTEUR, true);
        admin = creer(Role.ADMIN, true);
    }

    @AfterEach
    void nettoyer() {
        if (baseVerifiee) {
            for (String email : emails) {
                repository.findByEmail(email).ifPresent(repository::delete);
            }
        }
    }

    private String nouvelEmail() {
        String email = "m2-" + UUID.randomUUID() + "@example.com";
        emails.add(email);
        return email;
    }

    private Utilisateur creer(Role role, boolean actif) {
        return repository.insert(Utilisateur.builder().nom("Test").prenom("M2")
                .email(nouvelEmail()).role(role).actif(actif).build());
    }

    private JwtRequestPostProcessor jeton(String email, Role role, boolean verifie) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role.name()))
                .jwt(j -> j.claim("email", email).claim("email_verified", verifie));
    }

    @Test
    void repositoryEtIndexUnique() {
        assertEquals(a.getId(), repository.findByEmail(a.getEmail()).orElseThrow().getId());
        assertTrue(repository.findByRole(Role.AGRICULTEUR).stream()
                .anyMatch(u -> u.getId().equals(a.getId())));
        assertThrows(DuplicateKeyException.class, () -> repository.insert(
                Utilisateur.builder().nom("Doublon").prenom("Test").email(a.getEmail())
                        .role(Role.VISITEUR).actif(true).build()));
    }

    @Test
    void inscriptionEtDoublon() throws Exception {
        String email = nouvelEmail();
        String json = "{\"nom\":\"Test\",\"prenom\":\"Inscription\"}";
        mvc.perform(post("/api/users/register").with(jeton(email, Role.VISITEUR, true))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("VISITEUR"));
        assertEquals(Role.VISITEUR, repository.findByEmail(email).orElseThrow().getRole());
        mvc.perform(post("/api/users/register").with(jeton(email, Role.VISITEUR, true))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void profilPersonnelEtIsolationEntreAgriculteurs() throws Exception {
        mvc.perform(get("/api/users/me").with(jeton(a.getEmail(), Role.AGRICULTEUR, true)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(a.getId().toHexString()));
        mvc.perform(get("/api/users/" + a.getId().toHexString())
                        .with(jeton(a.getEmail(), Role.AGRICULTEUR, true)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/users/" + b.getId().toHexString())
                        .with(jeton(a.getEmail(), Role.AGRICULTEUR, true)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users/" + a.getId().toHexString())
                        .with(jeton(b.getEmail(), Role.AGRICULTEUR, true)))
                .andExpect(status().isForbidden());
    }

    @Test
    void roleReserveAuxAdministrateurs() throws Exception {
        String url = "/api/users/" + b.getId().toHexString() + "/role";
        String json = "{\"role\":\"RESPONSABLE_COLLECTE\"}";
        mvc.perform(patch(url).with(jeton(a.getEmail(), Role.AGRICULTEUR, true))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isForbidden());
        assertEquals(Role.AGRICULTEUR, repository.findById(b.getId()).orElseThrow().getRole());
        mvc.perform(patch(url).with(jeton(admin.getEmail(), Role.ADMIN, true))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("RESPONSABLE_COLLECTE"));
        assertEquals(Role.RESPONSABLE_COLLECTE, repository.findById(b.getId()).orElseThrow().getRole());
    }

    @Test
    void sansJetonEmailNonVerifieEtCompteInactif() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").with(jeton(a.getEmail(), Role.AGRICULTEUR, false)))
                .andExpect(status().isForbidden());
        Utilisateur inactif = creer(Role.AGRICULTEUR, false);
        mvc.perform(get("/api/users/me").with(jeton(inactif.getEmail(), Role.AGRICULTEUR, true)))
                .andExpect(status().isForbidden());
    }

    @Test
    void inscriptionNePermetPasDeChoisirAdmin() throws Exception {
        String email = nouvelEmail();
        mvc.perform(post("/api/users/register").with(jeton(email, Role.VISITEUR, true))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nom\":\"Test\",\"prenom\":\"M2\",\"role\":\"ADMIN\"}"))
                .andExpect(result -> assertTrue(result.getResponse().getStatus() == 400
                        || result.getResponse().getStatus() == 201));
        repository.findByEmail(email).ifPresent(u -> assertEquals(Role.VISITEUR, u.getRole()));
    }
}
