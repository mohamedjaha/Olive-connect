package com.oliveconnect.controller;

import com.oliveconnect.model.DemandeRecolte;
import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.Verger;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.model.enums.StatutDemande;
import com.oliveconnect.repository.DemandeRecolteRepository;
import com.oliveconnect.repository.UtilisateurRepository;
import com.oliveconnect.repository.VergerRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'integration F1 - vergers et demandes de recolte (M3 Jahha #1-4).
 * <p>
 * Verifient la propriete (un agriculteur ne voit et ne modifie que ses
 * donnees), la coherence verger/agriculteur des demandes et le cycle de vie
 * NOUVELLE -> PLANIFIEE -> EN_COURS -> TERMINEE / ANNULEE avec refus de
 * modification et d'annulation apres demarrage (F1.4).
 */
@SpringBootTest(properties = {
        "spring.data.mongodb.uri=mongodb://127.0.0.1:27017/oliveconnect_m3_test",
        "spring.data.mongodb.database=oliveconnect_m3_test",
        "spring.data.mongodb.auto-index-creation=false"
})
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class F1VergersCollectesTest {

    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository utilisateurRepository;
    @Autowired VergerRepository vergerRepository;
    @Autowired DemandeRecolteRepository demandeRecolteRepository;
    @Autowired MongoTemplate mongo;

    private Utilisateur agriculteurA;
    private Utilisateur agriculteurB;
    private Utilisateur responsable;
    private Utilisateur chefEquipe;
    private Utilisateur admin;

    @BeforeAll
    void preparerBase() {
        assertEquals("oliveconnect_m3_test", mongo.getDb().getName());
        mongo.getDb().drop();
        agriculteurA = creerUtilisateur(Role.AGRICULTEUR);
        agriculteurB = creerUtilisateur(Role.AGRICULTEUR);
        responsable = creerUtilisateur(Role.RESPONSABLE_COLLECTE);
        chefEquipe = creerUtilisateur(Role.CHEF_EQUIPE);
        admin = creerUtilisateur(Role.ADMIN);
    }

    @BeforeEach
    void reinitialiserDonnees() {
        demandeRecolteRepository.deleteAll();
        vergerRepository.deleteAll();
        creerVerger("Verger A 1", agriculteurA);
        creerVerger("Verger A 2", agriculteurA);
        creerVerger("Verger B 1", agriculteurB);
    }

    @AfterAll
    void nettoyerBase() {
        mongo.getDb().drop();
    }

    private Utilisateur creerUtilisateur(Role role) {
        return utilisateurRepository.insert(Utilisateur.builder().nom("Test").prenom("M3")
                .email("m3-" + UUID.randomUUID() + "@example.com").role(role).actif(true).build());
    }

    private Verger creerVerger(String nom, Utilisateur proprietaire) {
        return vergerRepository.insert(Verger.builder().nom(nom).superficieHa(10.0)
                .variete("Chemlali")
                .localisation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(10.76, 34.74))
                .proprietaireId(proprietaire.getId()).build());
    }

    private DemandeRecolte creerDemande(Utilisateur agriculteur, Verger verger, StatutDemande statut) {
        return demandeRecolteRepository.insert(DemandeRecolte.builder()
                .type(com.oliveconnect.model.enums.TypeDemande.PLANIFIEE)
                .dateSouhaitee(java.time.LocalDate.of(2026, 12, 15))
                .dateCreation(java.time.Instant.now())
                .statut(statut)
                .motif("Test")
                .agriculteurId(agriculteur.getId())
                .vergerId(verger.getId())
                .build());
    }

    private JwtRequestPostProcessor jeton(Utilisateur utilisateur) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + utilisateur.getRole().name()))
                .jwt(j -> j.claim("email", utilisateur.getEmail()).claim("email_verified", true));
    }

    private String vergerJson(String nom, double superficie, double longitude, double latitude) {
        return "{\"nom\":\"" + nom + "\",\"superficieHa\":" + superficie
                + ",\"variete\":\"Chemlali\",\"localisation\":{\"longitude\":" + longitude
                + ",\"latitude\":" + latitude + "}}";
    }

    // ---------- F1.1 Vergers ----------

    @Test
    void creerVerger_valideEtProprietaireDeduitDuJeton() throws Exception {
        mvc.perform(post("/api/vergers").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(vergerJson("Verger Sfax Nord", 12.5, 10.76, 34.74)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Verger Sfax Nord"))
                .andExpect(jsonPath("$.proprietaireId").value(agriculteurA.getId().toHexString()))
                .andExpect(jsonPath("$.statut").value("DISPONIBLE"))
                .andExpect(jsonPath("$.localisation.longitude").value(10.76))
                .andExpect(jsonPath("$.localisation.latitude").value(34.74));

        assertEquals(4, vergerRepository.findAll().size());
    }

    @Test
    void creerVerger_donneesInvalides_refusees() throws Exception {
        mvc.perform(post("/api/vergers").with(jeton(agriculteurA))
                .contentType(MediaType.APPLICATION_JSON).content(vergerJson("Negatif", -5, 10.76, 34.74)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/vergers").with(jeton(agriculteurA))
                .contentType(MediaType.APPLICATION_JSON).content(vergerJson("Longitude fausse", 5, 200, 34.74)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/vergers").with(jeton(agriculteurA))
                .contentType(MediaType.APPLICATION_JSON).content(vergerJson("Latitude fausse", 5, 10.76, 95)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/vergers").with(jeton(agriculteurA))
                .contentType(MediaType.APPLICATION_JSON).content("{\"superficieHa\":5,\"variete\":\"Chemlali\","
                        + "\"localisation\":{\"longitude\":10.76,\"latitude\":34.74}}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/vergers").with(jeton(agriculteurA))
                .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Sans localisation\",\"superficieHa\":5,"
                        + "\"variete\":\"Chemlali\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(3, vergerRepository.findAll().size());
    }

    @Test
    void listerVergers_proprietaireVoitSeulementLesSiens() throws Exception {
        mvc.perform(get("/api/vergers").with(jeton(agriculteurA))).andExpect(status().isOk())
                .andExpect(jsonPath("$[?( @.nom=='Verger A 1')]").exists())
                .andExpect(jsonPath("$[?( @.nom=='Verger A 2')]").exists())
                .andExpect(jsonPath("$[?( @.nom=='Verger B 1')]").doesNotExist());
        mvc.perform(get("/api/vergers").with(jeton(agriculteurB))).andExpect(status().isOk())
                .andExpect(jsonPath("$[?( @.nom=='Verger B 1')]").exists())
                .andExpect(jsonPath("$[?( @.nom=='Verger A 1')]").doesNotExist());
    }

    @Test
    void consulterVerger_donneesPriveesRefusees() throws Exception {
        String id = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow().getId().toHexString();
        mvc.perform(get("/api/vergers/" + id).with(jeton(agriculteurA))).andExpect(status().isOk());
        mvc.perform(get("/api/vergers/" + id).with(jeton(agriculteurB))).andExpect(status().isForbidden());
        mvc.perform(get("/api/vergers/" + id).with(jeton(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/vergers/" + id)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/vergers/000000000000000000000000").with(jeton(agriculteurA)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/vergers/identifiant-invalide").with(jeton(agriculteurA)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void modifierVerger_parLeProprietaireSeulement() throws Exception {
        Verger a2 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 2")).findFirst().orElseThrow();
        String id = a2.getId().toHexString();
        mvc.perform(put("/api/vergers/" + id).with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vergerJson("Verger A 2 agrandi", 14.0, 10.80, 34.80)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.superficieHa").value(14.0))
                .andExpect(jsonPath("$.maturite").isEmpty());
        mvc.perform(put("/api/vergers/" + id).with(jeton(agriculteurB))
                        .contentType(MediaType.APPLICATION_JSON).content(vergerJson("Pirate", 1.0, 10.0, 34.0)))
                .andExpect(status().isForbidden());
        assertEquals("Verger A 2 agrandi", vergerRepository.findById(a2.getId()).orElseThrow().getNom());
    }

    // ---------- F1.2 Demandes de recolte ----------

    @Test
    void declarerDemande_vergerDuProprietaire() throws Exception {
        String vergerId = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow().getId().toHexString();
        String json = "{\"type\":\"PLANIFIEE\",\"dateSouhaitee\":\"2026-12-15\","
                + "\"motif\":\"Maturite optimale\",\"vergerId\":\"" + vergerId + "\"}";
        mvc.perform(post("/api/demandes").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("NOUVELLE"))
                .andExpect(jsonPath("$.type").value("PLANIFIEE"))
                .andExpect(jsonPath("$.agriculteurId").value(agriculteurA.getId().toHexString()))
                .andExpect(jsonPath("$.vergerId").value(vergerId))
                .andExpect(jsonPath("$.dateCreation").isNotEmpty());
        assertEquals(StatutDemande.NOUVELLE, demandeRecolteRepository.findAll().get(0).getStatut());
    }

    @Test
    void declarerDemande_vergerAutrui_refusee() throws Exception {
        String vergerB = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger B 1")).findFirst().orElseThrow().getId().toHexString();
        mvc.perform(post("/api/demandes").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-20\",\"vergerId\":\"" + vergerB + "\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/demandes").with(jeton(chefEquipe))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-20\",\"vergerId\":\"" + vergerB + "\"}"))
                .andExpect(status().isForbidden());
        String vergerA = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow().getId().toHexString();
        mvc.perform(post("/api/demandes").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-20\",\"vergerId\":\"identifiant-invalide\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/demandes").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-20\",\"vergerId\":\"" + vergerA + "\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void declarerDemande_datePassee_ouInconnue_refusee() throws Exception {
        String vergerId = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow().getId().toHexString();
        mvc.perform(post("/api/demandes").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2020-01-01\",\"vergerId\":\"" + vergerId + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/demandes").with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-20\",\"vergerId\":\"identifiant-invalide\"}"))
                .andExpect(status().isBadRequest());
        assertTrue(demandeRecolteRepository.findAll().isEmpty());
    }

    // ---------- Visibilite des demandes ----------

    @Test
    void listerDemandes_selonRole() throws Exception {
        Verger a1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow();
        Verger b1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger B 1")).findFirst().orElseThrow();
        creerDemande(agriculteurA, a1, StatutDemande.NOUVELLE);
        creerDemande(agriculteurB, b1, StatutDemande.NOUVELLE);

        mvc.perform(get("/api/demandes").with(jeton(agriculteurA))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].agriculteurId").value(agriculteurA.getId().toHexString()));
        mvc.perform(get("/api/demandes").with(jeton(agriculteurB))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].agriculteurId").value(agriculteurB.getId().toHexString()));
        mvc.perform(get("/api/demandes").with(jeton(responsable))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/demandes").with(jeton(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void consulterDemande_parRole() throws Exception {
        Verger a1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow();
        DemandeRecolte demande = creerDemande(agriculteurA, a1, StatutDemande.NOUVELLE);
        String id = demande.getId().toHexString();

        mvc.perform(get("/api/demandes/" + id).with(jeton(agriculteurA))).andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("NOUVELLE"));
        mvc.perform(get("/api/demandes/" + id).with(jeton(responsable))).andExpect(status().isOk());
        mvc.perform(get("/api/demandes/" + id).with(jeton(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/demandes/" + id).with(jeton(agriculteurB))).andExpect(status().isForbidden());
        mvc.perform(get("/api/demandes/" + id).with(jeton(chefEquipe))).andExpect(status().isForbidden());
    }

    // ---------- F1.4 Cycle de vie des demandes ----------

    @Test
    void cycleDeVieComplet() throws Exception {
        Verger a1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow();
        DemandeRecolte demande = creerDemande(agriculteurA, a1, StatutDemande.NOUVELLE);
        String id = demande.getId().toHexString();

        mvc.perform(put("/api/demandes/" + id + "/planifier").with(jeton(responsable)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("PLANIFIEE"));
        mvc.perform(put("/api/demandes/" + id + "/planifier").with(jeton(responsable)))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id + "/demarrer").with(jeton(responsable)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("EN_COURS"));
        mvc.perform(put("/api/demandes/" + id + "/demarrer").with(jeton(responsable)))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id + "/terminer").with(jeton(chefEquipe)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("TERMINEE"));
        mvc.perform(put("/api/demandes/" + id + "/terminer").with(jeton(chefEquipe)))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id + "/planifier").with(jeton(responsable)))
                .andExpect(status().isConflict());
    }

    @Test
    void transitionRefuseeSelonStatutCourant() throws Exception {
        Verger a1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow();
        DemandeRecolte nouvelle = creerDemande(agriculteurA, a1, StatutDemande.NOUVELLE);
        String id = nouvelle.getId().toHexString();
        mvc.perform(put("/api/demandes/" + id + "/demarrer").with(jeton(responsable)))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id + "/terminer").with(jeton(responsable)))
                .andExpect(status().isConflict());

        DemandeRecolte planifiee = creerDemande(agriculteurA, a1, StatutDemande.PLANIFIEE);
        String id2 = planifiee.getId().toHexString();
        mvc.perform(put("/api/demandes/" + id2 + "/terminer").with(jeton(responsable)))
                .andExpect(status().isConflict());

        mvc.perform(put("/api/demandes/" + id + "/planifier").with(jeton(agriculteurA)))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/demandes/" + id + "/demarrer").with(jeton(agriculteurA)))
                .andExpect(status().isForbidden());
    }

    @Test
    void modifierEtAnnuler_avantPuisApresDemarrage() throws Exception {
        Verger a1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow();
        DemandeRecolte demande = creerDemande(agriculteurA, a1, StatutDemande.NOUVELLE);
        String id = demande.getId().toHexString();
        String nouvelleDate = "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-10\","
                + "\"motif\":\"Avance de maturite\",\"vergerId\":\"" + a1.getId().toHexString() + "\"}";

        // Avant demarrage : modification et annulation possibles.
        mvc.perform(put("/api/demandes/" + id).with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(nouvelleDate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("URGENTE"))
                .andExpect(jsonPath("$.motif").value("Avance de maturite"));
        mvc.perform(put("/api/demandes/" + id).with(jeton(agriculteurB))
                        .contentType(MediaType.APPLICATION_JSON).content(nouvelleDate))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/demandes/" + id).with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content(nouvelleDate))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/demandes/" + id + "/annuler").with(jeton(agriculteurA)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("ANNULEE"));
        mvc.perform(put("/api/demandes/" + id).with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(nouvelleDate))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id + "/annuler").with(jeton(agriculteurA)))
                .andExpect(status().isConflict());

        // Apres demarrage : modification et annulation refusees.
        DemandeRecolte enCours = creerDemande(agriculteurA, a1, StatutDemande.PLANIFIEE);
        String id2 = enCours.getId().toHexString();
        mvc.perform(put("/api/demandes/" + id2 + "/demarrer").with(jeton(responsable))).andExpect(status().isOk());
        mvc.perform(put("/api/demandes/" + id2).with(jeton(agriculteurA))
                        .contentType(MediaType.APPLICATION_JSON).content(nouvelleDate))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id2 + "/annuler").with(jeton(agriculteurA)))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/demandes/" + id2 + "/annuler").with(jeton(responsable)))
                .andExpect(status().isConflict());
    }

    @Test
    void annulationParResponsableAvantDemarrage() throws Exception {
        Verger a1 = vergerRepository.findAll().stream()
                .filter(v -> v.getNom().equals("Verger A 1")).findFirst().orElseThrow();
        DemandeRecolte demande = creerDemande(agriculteurA, a1, StatutDemande.PLANIFIEE);
        String id = demande.getId().toHexString();
        mvc.perform(put("/api/demandes/" + id + "/annuler").with(jeton(responsable)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("ANNULEE"));
        mvc.perform(put("/api/demandes/" + id + "/annuler").with(jeton(chefEquipe)))
                .andExpect(status().isForbidden());
    }
}