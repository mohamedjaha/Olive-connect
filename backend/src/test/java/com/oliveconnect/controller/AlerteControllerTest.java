package com.oliveconnect.controller;

import com.oliveconnect.model.Alerte;
import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.Verger;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.model.enums.StatutAlerte;
import com.oliveconnect.model.enums.StatutVerger;
import com.oliveconnect.model.enums.TypeAlerte;
import com.oliveconnect.repository.AlerteRepository;
import com.oliveconnect.repository.UtilisateurRepository;
import com.oliveconnect.repository.VergerRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'integration F2 - endpoints des alertes terrain (M4 Jahha #1-2).
 * <p>
 * Crivent les endpoints sur les regles d'AlerteService (M4 Sof #3) :
 * signalement par l'agriculteur sur son verger, consultation filtree par
 * role, cycle de vie NOUVELLE -> EN_COURS -> TRAITEE avec historique.
 * La base oliveconnect_m4_test doit etre initialisee (init-db.js puis
 * migration m4-alertes-geo-index.js), voir UserManagementTest.
 */
@SpringBootTest(properties = {
        "spring.data.mongodb.uri=mongodb://127.0.0.1:27017/oliveconnect_m4_test",
        "spring.data.mongodb.database=oliveconnect_m4_test",
        "spring.data.mongodb.auto-index-creation=false"
})
@AutoConfigureMockMvc
class AlerteControllerTest {

    @Autowired MockMvc mvc;
    @Autowired AlerteRepository alerteRepository;
    @Autowired VergerRepository vergerRepository;
    @Autowired UtilisateurRepository utilisateurRepository;
    @Autowired MongoTemplate mongo;

    private final List<Utilisateur> utilisateurs = new ArrayList<>();
    private final List<Verger> vergers = new ArrayList<>();
    private final List<Alerte> alertes = new ArrayList<>();

    private Utilisateur agriculteur;
    private Utilisateur autreAgriculteur;
    private Utilisateur responsable;
    private Verger verger;

    @BeforeEach
    void preparer() {
        assertEquals("oliveconnect_m4_test", mongo.getDb().getName());
        agriculteur = utilisateur(Role.AGRICULTEUR);
        autreAgriculteur = utilisateur(Role.AGRICULTEUR);
        responsable = utilisateur(Role.RESPONSABLE_COLLECTE);
        verger = verger(agriculteur, 10.76, 34.74);
        utilisateur(Role.CHEF_EQUIPE);
    }

    @AfterEach
    void nettoyer() {
        alertes.forEach(alerteRepository::delete);
        vergers.forEach(vergerRepository::delete);
        utilisateurs.forEach(utilisateurRepository::delete);
    }

    private Utilisateur utilisateur(Role role) {
        Utilisateur cree = utilisateurRepository.insert(Utilisateur.builder().nom("Test").prenom("M4")
                .email("m4-http-" + UUID.randomUUID() + "@example.com").role(role).actif(true).build());
        utilisateurs.add(cree);
        return cree;
    }

    private Verger verger(Utilisateur proprietaire, double longitude, double latitude) {
        Verger cree = vergerRepository.insert(Verger.builder().nom("Verger M4").superficieHa(5.0)
                .variete("Chemlali").statut(StatutVerger.DISPONIBLE)
                .localisation(new GeoJsonPoint(longitude, latitude))
                .proprietaireId(proprietaire.getId()).build());
        vergers.add(cree);
        return cree;
    }

    private String idDepuis(String json) {
        return com.jayway.jsonpath.JsonPath.parse(json).read("$.id");
    }

    private JwtRequestPostProcessor jeton(Utilisateur utilisateur) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + utilisateur.getRole().name()))
                .jwt(j -> j.claim("email", utilisateur.getEmail()).claim("email_verified", true));
    }

    private String alerteJson(String type, String description, String vergerId, String localisation) {
        return "{\"type\":\"" + type + "\",\"description\":\"" + description + "\",\"vergerId\":\"" + vergerId + "\""
                + (localisation == null ? "" : ",\"localisation\":" + localisation) + "}";
    }

    // ---------- F2.1 Signalement ----------

    @Test
    void signalerAlerte_surSonVerger() throws Exception {
        String json = alerteJson("MATURITE", "Maturite atteinte sur la partie nord", verger.getId().toHexString(),
                "{\"longitude\":10.77,\"latitude\":34.75}");
        String corps = mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("MATURITE"))
                .andExpect(jsonPath("$.statut").value("NOUVELLE"))
                .andExpect(jsonPath("$.vergerId").value(verger.getId().toHexString()))
                .andExpect(jsonPath("$.auteurId").value(agriculteur.getId().toHexString()))
                .andExpect(jsonPath("$.localisation.longitude").value(10.77))
                .andExpect(jsonPath("$.historique").isEmpty())
                .andReturn().getResponse().getContentAsString();
        String id = idDepuis(corps);
        Alerte lue = alerteRepository.findById(new org.bson.types.ObjectId(id)).orElseThrow();
        assertEquals(StatutAlerte.NOUVELLE, lue.getStatut());
        assertTrue(lue.getHistorique().isEmpty());
        alertes.add(lue);
    }

    @Test
    void signalerAlerte_sansPosition_reutiliseCelleDuVerger() throws Exception {
        String json = alerteJson("PROBLEME", "Attaque de mouche", verger.getId().toHexString(), null);
        String corps = mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.localisation.longitude").value(10.76))
                .andExpect(jsonPath("$.localisation.latitude").value(34.74))
                .andReturn().getResponse().getContentAsString();
        alerteRepository.findById(new org.bson.types.ObjectId(idDepuis(corps))).ifPresent(alertes::add);
    }

    @Test
    void signalerAlerte_refusSelonProprieteRoleEtValidite() throws Exception {
        long alertesAvant = alerteRepository.findAll().size();
        String vergerAutrui = verger(autreAgriculteur, 10.80, 34.80).getId().toHexString();
        mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson("PROBLEME", "Pas mon verger", vergerAutrui, null)))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/alertes").with(jeton(utilisateurs.stream()
                        .filter(u -> u.getRole() == Role.CHEF_EQUIPE).findFirst().orElseThrow()))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson("PROBLEME", "Role non agriculteur", verger.getId().toHexString(), null)))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson("PROBLEME", " ", verger.getId().toHexString(), null)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson("PROBLEME", "Coordonnees fausses", verger.getId().toHexString(),
                                        "{\"longitude\":200,\"latitude\":34.75}")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson("PROBLEME", "Verger inconnu", "000000000000000000000000", null)))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson("PROBLEME", "Identifiant invalide", "pas-un-objectid", null)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/alertes").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"description\":\"Sans type\",\"vergerId\":\"" + verger.getId().toHexString() + "\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(alertesAvant, alerteRepository.findAll().size());
    }

    // ---------- Consultation par role ----------

    @Test
    void listerAlertes_selonRoleEtFiltres() throws Exception {
        String a = creerViaApi(agriculteur, verger, "MATURITE", "Alerte agriculteur");
        Verger vergerB = verger(autreAgriculteur, 10.80, 34.80);
        String b = creerViaApi(autreAgriculteur, vergerB, "PROBLEME", "Alerte autre agriculteur");

        mvc.perform(get("/api/alertes").with(jeton(agriculteur))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(a));
        mvc.perform(get("/api/alertes").with(jeton(autreAgriculteur))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(b));
        mvc.perform(get("/api/alertes").with(jeton(responsable))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/alertes?statut=NOUVELLE").with(jeton(responsable))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/alertes?statut=TRAITEE").with(jeton(responsable))).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/alertes?vergerId=" + verger.getId().toHexString()).with(jeton(responsable)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(a));
        mvc.perform(get("/api/alertes").with(jeton(utilisateurs.stream()
                        .filter(u -> u.getRole() == Role.CHEF_EQUIPE).findFirst().orElseThrow())))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/alertes?statut=INCONNU").with(jeton(responsable)))
                .andExpect(status().isBadRequest());
    }

    // ---------- F2.2 Traitement ----------

    @Test
    void cycleDeVieComplet_avecHistorique() throws Exception {
        String id = creerViaApi(agriculteur, verger, "MATURITE", "Alerte a traiter");

        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"statut\":\"EN_COURS\",\"commentaire\":\"Equipe envoyee sur place\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("EN_COURS"))
                .andExpect(jsonPath("$.historique.length()").value(1))
                .andExpect(jsonPath("$.historique[0].ancienStatut").value("NOUVELLE"))
                .andExpect(jsonPath("$.historique[0].nouveauStatut").value("EN_COURS"))
                .andExpect(jsonPath("$.historique[0].commentaire").value("Equipe envoyee sur place"))
                .andExpect(jsonPath("$.historique[0].auteurId").value(responsable.getId().toHexString()));

        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"TRAITEE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("TRAITEE"))
                .andExpect(jsonPath("$.historique.length()").value(2))
                .andExpect(jsonPath("$.historique[1].ancienStatut").value("EN_COURS"))
                .andExpect(jsonPath("$.historique[1].nouveauStatut").value("TRAITEE"));

        mvc.perform(get("/api/alertes").with(jeton(agriculteur))).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].statut").value("TRAITEE"))
                .andExpect(jsonPath("$[0].historique.length()").value(2));
    }

    @Test
    void traitement_refuseSelonRoleTransitionOuIdentifiant() throws Exception {
        String id = creerViaApi(agriculteur, verger, "PROBLEME", "Alerte sous controle");

        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(agriculteur))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"EN_COURS\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"TRAITEE\"}"))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"NOUVELLE\"}"))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/alertes/000000000000000000000000/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"EN_COURS\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"commentaire\":\"Sans statut\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"EN_COURS\",\"commentaire\":\"Debut\"}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"EN_COURS\"}"))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"TRAITEE\"}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"TRAITEE\"}"))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/alertes/" + id + "/statut").with(jeton(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statut\":\"EN_COURS\"}"))
                .andExpect(status().isConflict());
    }

    private String creerViaApi(Utilisateur auteur, Verger vergerCible, String type, String description) throws Exception {
        String corps = mvc.perform(post("/api/alertes").with(jeton(auteur))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                alerteJson(type, description, vergerCible.getId().toHexString(), null)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = idDepuis(corps);
        alerteRepository.findById(new org.bson.types.ObjectId(id)).ifPresent(alertes::add);
        return id;
    }
}