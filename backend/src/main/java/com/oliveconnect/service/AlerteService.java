package com.oliveconnect.service;

import com.oliveconnect.model.Alerte;
import com.oliveconnect.model.Verger;
import com.oliveconnect.model.TraitementAlerte;
import com.oliveconnect.model.enums.StatutAlerte;
import com.oliveconnect.model.enums.TypeAlerte;
import com.oliveconnect.repository.AlerteRepository;
import com.oliveconnect.repository.VergerRepository;
import com.oliveconnect.repository.UtilisateurRepository;
import com.oliveconnect.security.UtilisateurAuthentifie;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlerteService {

    private final AlerteRepository alerteRepository;
    private final VergerRepository vergerRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurAuthentifie authentifie;
    private final MongoTemplate mongoTemplate;

    public AlerteService(
            AlerteRepository alerteRepository,
            VergerRepository vergerRepository,
            UtilisateurRepository utilisateurRepository,
            UtilisateurAuthentifie authentifie,
            MongoTemplate mongoTemplate) {

        this.alerteRepository = alerteRepository;
        this.vergerRepository = vergerRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.authentifie = authentifie;
        this.mongoTemplate = mongoTemplate;
    }

    // 1. Creation d'une alerte

    public Alerte creer(
            ObjectId vergerId,
            TypeAlerte type,
            String description,
            GeoJsonPoint localisation) {

        ObjectId auteurId =
                authentifie.identifiant(utilisateurRepository);

        exigerRole("AGRICULTEUR");

        if (vergerId == null || type == null
                || description == null
                || description.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Verger, type et description obligatoires");
        }

        Verger verger = vergerRepository.findById(vergerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Verger introuvable"));

        if (!auteurId.equals(verger.getProprietaireId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Ce verger ne vous appartient pas");
        }

        // Reutiliser la position du verger si necessaire

        GeoJsonPoint position = localisation != null
                ? localisation : verger.getLocalisation();

        verifierLocalisation(position);

        Alerte alerte = Alerte.builder()
                .auteurId(auteurId)
                .vergerId(vergerId)
                .type(type)
                .description(description.trim())
                .localisation(position)
                .dateCreation(Instant.now())
                .statut(StatutAlerte.NOUVELLE)
                .historique(new ArrayList<>())
                .build();

        return alerteRepository.save(alerte);
    }

    // 2. Consultation et filtrage des alertes

    public List<Alerte> lister(
            StatutAlerte statut,
            ObjectId vergerId) {

        ObjectId utilisateurId =
                authentifie.identifiant(utilisateurRepository);

        List<Alerte> alertes;

        if (authentifie.aLeRole("AGRICULTEUR")) {

            alertes = alerteRepository
                    .findByAuteurId(utilisateurId);

        } else if (
                authentifie.aLeRole("RESPONSABLE_COLLECTE")
                || authentifie.aLeRole("ADMIN")) {

            if (vergerId != null) {
                alertes = alerteRepository
                        .findByVergerId(vergerId);

            } else if (statut != null) {
                alertes = alerteRepository
                        .findByStatut(statut);

            } else {
                alertes = alerteRepository.findAll();
            }

        } else {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acces aux alertes interdit");
        }

        return alertes.stream()
                .filter(a -> statut == null
                        || a.getStatut() == statut)
                .filter(a -> vergerId == null
                        || vergerId.equals(a.getVergerId()))
                .toList();
    }

    // 3. Traitement et changement de statut

    public Alerte changerStatut(
            ObjectId alerteId,
            StatutAlerte nouveauStatut,
            String commentaire) {

        ObjectId responsableId =
                authentifie.identifiant(utilisateurRepository);

        exigerRole("RESPONSABLE_COLLECTE");

        if (alerteId == null || nouveauStatut == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identifiant et statut obligatoires");
        }

        Alerte alerte = alerteRepository.findById(alerteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Alerte introuvable"));

        StatutAlerte ancienStatut = alerte.getStatut();

        boolean transitionValide =
                (ancienStatut == StatutAlerte.NOUVELLE
                        && nouveauStatut == StatutAlerte.EN_COURS)
                ||
                (ancienStatut == StatutAlerte.EN_COURS
                        && nouveauStatut == StatutAlerte.TRAITEE);

        if (!transitionValide) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transition de statut interdite");
        }

        TraitementAlerte traitement =
                TraitementAlerte.builder()
                        .auteurId(responsableId)
                        .date(Instant.now())
                        .ancienStatut(ancienStatut)
                        .nouveauStatut(nouveauStatut)
                        .commentaire(
                                commentaire == null
                                        || commentaire.isBlank()
                                        ? null : commentaire.trim())
                        .build();

        // Mise a jour atomique du statut et de l'historique

        Query query = new Query(
                Criteria.where("_id").is(alerteId)
                        .and("statut").is(ancienStatut));

        Update update = new Update()
                .set("statut", nouveauStatut)
                .push("historique", traitement);

        Alerte resultat = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                Alerte.class);

        if (resultat == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Alerte modifiee simultanement");
        }

        return resultat;
    }

    // 4. Verification du role

    private void exigerRole(String role) {

        if (!authentifie.aLeRole(role)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Role non autorise");
        }
    }

    // 5. Validation des coordonnees GPS

    private void verifierLocalisation(GeoJsonPoint point) {

        if (point == null
                || !Double.isFinite(point.getX())
                || !Double.isFinite(point.getY())
                || point.getX() < -180
                || point.getX() > 180
                || point.getY() < -90
                || point.getY() > 90) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Coordonnees GPS invalides");
        }
    }
}