package com.oliveconnect.service;

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
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.data.mongodb.uri=mongodb://127.0.0.1:27017/oliveconnect_m4_test",
        "spring.data.mongodb.database=oliveconnect_m4_test",
        "spring.data.mongodb.auto-index-creation=false"
})
class AlerteServiceTest {
    private static final String BASE_TEST = "oliveconnect_m4_test";
    @Autowired AlerteService service;
    @Autowired AlerteRepository alertes;
    @Autowired VergerRepository vergers;
    @Autowired UtilisateurRepository users;
    @Autowired MongoTemplate mongo;

    private final List<ObjectId> utilisateursCrees = new ArrayList<>();
    private final List<ObjectId> vergersCrees = new ArrayList<>();
    private final List<ObjectId> alertesCreees = new ArrayList<>();
    private Utilisateur a, b, responsable;
    private Verger vergerA, vergerB;

    @BeforeEach
    void preparer() {
        assertEquals(BASE_TEST, mongo.getDb().getName());
        for (String nom : List.of("users", "vergers", "alertes")) {
            Document info = mongo.getDb().listCollections()
                    .filter(new Document("name", nom)).first();
            assertNotNull(info, "Initialiser la base M4 avec init-db.js : " + nom);
            assertTrue(info.get("options", Document.class).containsKey("validator"),
                    "Validateur absent : " + nom);
        }
        assertTrue(mongo.getCollection("alertes").listIndexes().into(new ArrayList<>()).stream()
                .anyMatch(i -> "2dsphere".equals(i.get("key", Document.class).get("localisation"))),
                "Index geospatial absent");
        a = utilisateur(Role.AGRICULTEUR, true);
        b = utilisateur(Role.AGRICULTEUR, true);
        responsable = utilisateur(Role.RESPONSABLE_COLLECTE, true);
        vergerA = verger(a, 10.76, 34.74);
        vergerB = verger(b, 2.35, 48.85);
    }

    @AfterEach
    void nettoyer() {
        SecurityContextHolder.clearContext();
        // Ne jamais supprimer une base ni des documents preexistants.
        if (!BASE_TEST.equals(mongo.getDb().getName())) return;
        alertesCreees.forEach(alertes::deleteById);
        vergersCrees.forEach(vergers::deleteById);
        utilisateursCrees.forEach(users::deleteById);
    }

    private Utilisateur utilisateur(Role role, boolean actif) {
        ObjectId id = new ObjectId();
        Utilisateur u = users.insert(Utilisateur.builder().id(id).nom("Test").prenom("M4")
                .email("m4-" + UUID.randomUUID() + "@example.com").role(role).actif(actif).build());
        utilisateursCrees.add(id);
        return u;
    }

    private Verger verger(Utilisateur proprietaire, double lon, double lat) {
        ObjectId id = new ObjectId();
        Verger v = vergers.insert(Verger.builder().id(id).nom("Verger M4").superficieHa(5.0)
                .variete("Chemlali").statut(StatutVerger.DISPONIBLE)
                .localisation(new GeoJsonPoint(lon, lat)).proprietaireId(proprietaire.getId()).build());
        vergersCrees.add(id);
        return v;
    }

    private void connecter(Utilisateur u, boolean verifie) {
        Jwt jwt = Jwt.withTokenValue("test-m4").header("alg", "RS256")
                .claim("sub", u.getId().toHexString()).claim("email", u.getEmail())
                .claim("email_verified", verifie).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,
                List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()))));
    }

    private Alerte creer(Utilisateur u, Verger v, TypeAlerte type, GeoJsonPoint point) {
        connecter(u, true);
        Alerte alerte = service.creer(v.getId(), type, "Alerte de test M4", point);
        alertesCreees.add(alerte.getId());
        return alerte;
    }

    private void refuser(HttpStatus statut, org.junit.jupiter.api.function.Executable action) {
        assertEquals(statut, assertThrows(ResponseStatusException.class, action).getStatusCode());
    }

    @Test
    void creationEtAssociationAuVerger() {
        Alerte x = creer(a, vergerA, TypeAlerte.MATURITE, null);
        Alerte lue = alertes.findById(x.getId()).orElseThrow();
        assertEquals(a.getId(), lue.getAuteurId());
        assertEquals(vergerA.getId(), lue.getVergerId());
        assertEquals(TypeAlerte.MATURITE, lue.getType());
        assertEquals(StatutAlerte.NOUVELLE, lue.getStatut());
        assertEquals(10.76, lue.getLocalisation().getX(), 0.000001);
        assertEquals(34.74, lue.getLocalisation().getY(), 0.000001);
        assertNotNull(lue.getDateCreation());
        assertTrue(lue.getHistorique().isEmpty());
    }

    @Test
    void creationRefuseeSiVergerAutruiOuDonneesInvalides() {
        connecter(a, true);
        refuser(HttpStatus.FORBIDDEN, () -> service.creer(vergerB.getId(), TypeAlerte.PROBLEME, "Test", null));
        refuser(HttpStatus.BAD_REQUEST, () -> service.creer(vergerA.getId(), TypeAlerte.PROBLEME, " ", null));
        refuser(HttpStatus.BAD_REQUEST, () -> service.creer(vergerA.getId(), TypeAlerte.PROBLEME, "Test", new GeoJsonPoint(181, 34)));
        refuser(HttpStatus.NOT_FOUND, () -> service.creer(new ObjectId(), TypeAlerte.PROBLEME, "Test", null));
    }

    @Test
    void consultationSelonRoleEtFiltres() {
        Alerte x = creer(a, vergerA, TypeAlerte.MATURITE, null);
        Alerte y = creer(b, vergerB, TypeAlerte.PROBLEME, null);
        connecter(a, true);
        assertEquals(List.of(x.getId()), service.lister(null, null).stream().map(Alerte::getId).toList());
        assertTrue(service.lister(null, vergerB.getId()).isEmpty());
        connecter(responsable, true);
        List<ObjectId> ids = service.lister(StatutAlerte.NOUVELLE, null).stream().map(Alerte::getId).toList();
        assertTrue(ids.containsAll(List.of(x.getId(), y.getId())));
        assertEquals(List.of(y.getId()), service.lister(StatutAlerte.NOUVELLE, vergerB.getId()).stream().map(Alerte::getId).toList());
        assertTrue(service.lister(StatutAlerte.TRAITEE, vergerA.getId()).isEmpty());
    }

    @Test
    void rechercheGeospatialeEtRequetesRepository() {
        Alerte x = creer(a, vergerA, TypeAlerte.MATURITE, new GeoJsonPoint(10.76, 34.74));
        Alerte y = creer(b, vergerB, TypeAlerte.PROBLEME, new GeoJsonPoint(2.35, 48.85));
        List<ObjectId> proches = alertes.findByLocalisationNear(new GeoJsonPoint(10.76, 34.74),
                new Distance(5, Metrics.KILOMETERS)).stream().map(Alerte::getId).toList();
        assertTrue(proches.contains(x.getId()));
        assertFalse(proches.contains(y.getId()));
        assertTrue(alertes.findByStatut(StatutAlerte.NOUVELLE).stream().anyMatch(t -> t.getId().equals(x.getId())));
        assertEquals(List.of(y.getId()), alertes.findByVergerId(vergerB.getId()).stream().map(Alerte::getId).toList());
    }

    @Test
    void cycleDeVieEtHistoriquePersistant() {
        Alerte x = creer(a, vergerA, TypeAlerte.MATURITE, null);
        connecter(responsable, true);
        assertEquals(StatutAlerte.EN_COURS, service.changerStatut(x.getId(), StatutAlerte.EN_COURS, "Prise en charge").getStatut());
        assertEquals(StatutAlerte.TRAITEE, service.changerStatut(x.getId(), StatutAlerte.TRAITEE, null).getStatut());
        Alerte lue = alertes.findById(x.getId()).orElseThrow();
        assertEquals(StatutAlerte.TRAITEE, lue.getStatut());
        assertEquals(2, lue.getHistorique().size());
        var premier = lue.getHistorique().get(0);
        var second = lue.getHistorique().get(1);
        assertEquals(responsable.getId(), premier.getAuteurId());
        assertEquals(responsable.getId(), second.getAuteurId());
        assertEquals(StatutAlerte.NOUVELLE, premier.getAncienStatut());
        assertEquals(StatutAlerte.EN_COURS, premier.getNouveauStatut());
        assertEquals(StatutAlerte.EN_COURS, second.getAncienStatut());
        assertEquals(StatutAlerte.TRAITEE, second.getNouveauStatut());
        assertEquals("Prise en charge", premier.getCommentaire());
        assertNotNull(premier.getDate());
        assertNotNull(second.getDate());
    }

    @Test
    void traitementRefuseSelonRoleOuTransition() {
        Alerte x = creer(a, vergerA, TypeAlerte.PROBLEME, null);
        refuser(HttpStatus.FORBIDDEN, () -> service.changerStatut(x.getId(), StatutAlerte.EN_COURS, null));
        connecter(responsable, true);
        refuser(HttpStatus.CONFLICT, () -> service.changerStatut(x.getId(), StatutAlerte.TRAITEE, null));
        service.changerStatut(x.getId(), StatutAlerte.EN_COURS, "Debut");
        refuser(HttpStatus.CONFLICT, () -> service.changerStatut(x.getId(), StatutAlerte.NOUVELLE, null));
        refuser(HttpStatus.CONFLICT, () -> service.changerStatut(x.getId(), StatutAlerte.EN_COURS, null));
        Alerte lue = alertes.findById(x.getId()).orElseThrow();
        assertEquals(StatutAlerte.EN_COURS, lue.getStatut());
        assertEquals(1, lue.getHistorique().size());
    }

    @Test
    void authentificationEtCompteActifObligatoires() {
        SecurityContextHolder.clearContext();
        refuser(HttpStatus.UNAUTHORIZED, () -> service.lister(null, null));
        connecter(a, false);
        refuser(HttpStatus.FORBIDDEN, () -> service.lister(null, null));
        connecter(utilisateur(Role.AGRICULTEUR, false), true);
        refuser(HttpStatus.FORBIDDEN, () -> service.lister(null, null));
    }
}
