package com.oliveconnect.controller;

import com.jayway.jsonpath.JsonPath;
import com.oliveconnect.model.DemandeRecolte;
import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.Verger;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.model.enums.StatutDemande;
import com.oliveconnect.repository.DemandeRecolteRepository;
import com.oliveconnect.repository.UtilisateurRepository;
import com.oliveconnect.repository.VergerRepository;
import com.mongodb.client.model.IndexOptions;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Parcours nominal F1 complet (M3 - Sof #3) : l'agriculteur cree son verger,
 * declare une recolte, le responsable de collecte voit la demande.
 * <p>
 * Enchaine aussi les couches M2 (inscription Google puis attribution de role
 * par un administrateur) et verifie les requetes des repositories M3
 * (findByProprietaireId, findByAgriculteurId, findByVergerId, findByStatut,
 * recherche geospatiale sur l'index 2dsphere).
 */
@SpringBootTest(properties = {
        "spring.data.mongodb.uri=mongodb://127.0.0.1:27017/oliveconnect_m3_test",
        "spring.data.mongodb.database=oliveconnect_m3_test",
        "spring.data.mongodb.auto-index-creation=false"
})
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ParcoursNominalF1Test {

    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository utilisateurRepository;
    @Autowired VergerRepository vergerRepository;
    @Autowired DemandeRecolteRepository demandeRecolteRepository;
    @Autowired MongoTemplate mongo;

    private Utilisateur admin;

    @BeforeAll
    void preparerBase() {
        assertEquals("oliveconnect_m3_test", mongo.getDb().getName());
        mongo.getDb().drop();
        // Index geospatial comme en M1.4 (data/init-db.js) : requis par findByLocalisationNear.
        mongo.getDb().getCollection("vergers").createIndex(
                new Document("localisation", "2dsphere"),
                new IndexOptions().name("idx_vergers_localisation"));
        admin = utilisateurRepository.insert(Utilisateur.builder().nom("Admin").prenom("Parcours")
                .email("parcours-admin-" + UUID.randomUUID() + "@example.com").role(Role.ADMIN).actif(true).build());
    }

    @AfterAll
    void nettoyerBase() {
        mongo.getDb().drop();
    }

    @Test
    void parcoursNominal_agriculteurCreeVergerDeclareRecolteResponsableVoit() throws Exception {
        // 1. L'agriculteur demande un compte via Google (M2, inscription).
        String emailAgriculteur = "parcours-agri-" + UUID.randomUUID() + "@example.com";
        mvc.perform(post("/api/users/register").with(jeton(emailAgriculteur, Role.VISITEUR))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Ben Ali\",\"prenom\":\"Ahmed\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("VISITEUR"));
        Utilisateur agriculteur = utilisateurRepository.findByEmail(emailAgriculteur).orElseThrow();

        // 2. Un administrateur attribue le role AGRICULTEUR.
        mvc.perform(patch("/api/users/" + agriculteur.getId().toHexString() + "/role")
                        .with(jeton(admin.getEmail(), Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"AGRICULTEUR\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("AGRICULTEUR"));

        // 3. L'agriculteur cree son verger (F1.1).
        String vergerJson = "{\"nom\":\"Verger Parcours\",\"superficieHa\":8.5,\"variete\":\"Chetoui\","
                + "\"localisation\":{\"longitude\":10.76,\"latitude\":34.74}}";
        String corpsVerger = mvc.perform(post("/api/vergers").with(jeton(emailAgriculteur, Role.AGRICULTEUR))
                        .contentType(MediaType.APPLICATION_JSON).content(vergerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.proprietaireId").value(agriculteur.getId().toHexString()))
                .andReturn().getResponse().getContentAsString();
        String vergerId = JsonPath.parse(corpsVerger).read("$.id");

        // 4. Inscription puis habilitation du responsable de collecte (M2).
        String emailResponsable = "parcours-resp-" + UUID.randomUUID() + "@example.com";
        mvc.perform(post("/api/users/register").with(jeton(emailResponsable, Role.VISITEUR))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Trabelsi\",\"prenom\":\"Sami\"}"))
                .andExpect(status().isCreated());
        Utilisateur responsable = utilisateurRepository.findByEmail(emailResponsable).orElseThrow();
        mvc.perform(patch("/api/users/" + responsable.getId().toHexString() + "/role")
                        .with(jeton(admin.getEmail(), Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"RESPONSABLE_COLLECTE\"}"))
                .andExpect(status().isOk());

        // 5. L'agriculteur declare une recolte sur son verger (F1.2).
        mvc.perform(post("/api/demandes").with(jeton(emailAgriculteur, Role.AGRICULTEUR))
                        .contentType(MediaType.APPLICATION_JSON).content(
                                "{\"type\":\"PLANIFIEE\",\"dateSouhaitee\":\"2026-12-22\","
                                        + "\"motif\":\"Parcours nominal complet\",\"vergerId\":\"" + vergerId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("NOUVELLE"))
                .andExpect(jsonPath("$.agriculteurId").value(agriculteur.getId().toHexString()))
                .andExpect(jsonPath("$.vergerId").value(vergerId));

        // 6. Le responsable de collecte voit la demande.
        mvc.perform(get("/api/demandes").with(jeton(emailResponsable, Role.RESPONSABLE_COLLECTE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].agriculteurId").value(agriculteur.getId().toHexString()))
                .andExpect(jsonPath("$[0].vergerId").value(vergerId));
        mvc.perform(get("/api/demandes").with(jeton(emailAgriculteur, Role.AGRICULTEUR)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        // 7. Requetes des repositories M3 sur les donnees du parcours.
        ObjectId agriculteurId = agriculteur.getId();
        List<Verger> vergersDuProprietaire = vergerRepository.findByProprietaireId(agriculteurId);
        assertEquals(1, vergersDuProprietaire.size());
        assertEquals("Verger Parcours", vergersDuProprietaire.get(0).getNom());

        List<DemandeRecolte> demandesDeLAgriculteur = demandeRecolteRepository.findByAgriculteurId(agriculteurId);
        assertEquals(1, demandesDeLAgriculteur.size());
        assertEquals(demandesDeLAgriculteur.get(0).getId(),
                demandeRecolteRepository.findByVergerId(new ObjectId(vergerId)).get(0).getId());
        assertEquals(1, demandeRecolteRepository.findByStatut(StatutDemande.NOUVELLE).size());
        assertEquals(0, demandeRecolteRepository.findByStatut(StatutDemande.TERMINEE).size());
    }

    @Test
    void rechercheGeospatiale_vergersAutourDeSfax() {
        creerVerger("Verger Sfax centre", 10.76, 34.74);
        creerVerger("Verger Sfax nord", 10.80, 34.80);
        creerVerger("Verger El Hamma", 10.06, 34.08);
        creerVerger("Verger lointain", 2.3522, 48.8566);

        GeoJsonPoint sfax = new GeoJsonPoint(10.76, 34.74);
        List<Verger> proches = vergerRepository.findByLocalisationNear(sfax, new Distance(50, Metrics.KILOMETERS));
        assertEquals(2, proches.size());
        assertEquals("Verger Sfax centre", proches.get(0).getNom(), "du plus proche au plus lointain");
        assertEquals("Verger Sfax nord", proches.get(1).getNom());

        List<Verger> prochesKm = vergerRepository.findByLocalisationNear(sfax, new Distance(100, Metrics.KILOMETERS));
        assertEquals(3, prochesKm.size());

        List<Verger> paris = vergerRepository.findByLocalisationNear(
                new GeoJsonPoint(2.3522, 48.8566), new Distance(50, Metrics.KILOMETERS));
        assertEquals(1, paris.size());
        assertEquals("Verger lointain", paris.get(0).getNom());
    }

    private Verger creerVerger(String nom, double longitude, double latitude) {
        return vergerRepository.insert(Verger.builder().nom(nom).superficieHa(5.0)
                .variete("Chemlali").statut(com.oliveconnect.model.enums.StatutVerger.DISPONIBLE)
                .localisation(new GeoJsonPoint(longitude, latitude))
                .proprietaireId(admin.getId()).build());
    }

    private JwtRequestPostProcessor jeton(String email, Role role) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role.name()))
                .jwt(j -> j.claim("email", email).claim("email_verified", true));
    }
}