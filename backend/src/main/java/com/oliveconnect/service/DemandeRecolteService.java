package com.oliveconnect.service;

import com.oliveconnect.dto.DemandeRecolteRequest;
import com.oliveconnect.dto.DemandeRecolteResponse;
import com.oliveconnect.model.DemandeRecolte;
import com.oliveconnect.model.Verger;
import com.oliveconnect.model.enums.StatutDemande;
import com.oliveconnect.repository.DemandeRecolteRepository;
import com.oliveconnect.repository.UtilisateurRepository;
import com.oliveconnect.repository.VergerRepository;
import com.oliveconnect.security.UtilisateurAuthentifie;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Gestion des demandes de recolte (F1.2, F1.4, F1.5 ; M3 Jahha #3-4).
 * <p>
 * Regles metier (contrat projetolive.md) :
 * - une demande appartient a un agriculteur et concerne un de SES vergers ;
 * - cycle de vie : NOUVELLE -> PLANIFIEE -> EN_COURS -> TERMINEE, avec
 *   ANNULEE possible tant que la collecte n'est pas demarree ;
 * - modification et annulation refuses apres le demarrage (EN_COURS) ;
 * - l'agriculteur consulte, modifie ou annule sa demande avant le demarrage ;
 *   le responsable de collecte examine les demandes (F1.3).
 */
@Service
public class DemandeRecolteService {

    /** Statuts dans lesquels une demande peut encore etre modifiee ou annulee. */
    private static final Set<StatutDemande> STATUTS_AVANT_DEMARRAGE =
            Set.of(StatutDemande.NOUVELLE, StatutDemande.PLANIFIEE);

    private final DemandeRecolteRepository demandeRecolteRepository;
    private final VergerRepository vergerRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurAuthentifie utilisateurAuthentifie;

    public DemandeRecolteService(DemandeRecolteRepository demandeRecolteRepository,
                                 VergerRepository vergerRepository,
                                 UtilisateurRepository utilisateurRepository,
                                 UtilisateurAuthentifie utilisateurAuthentifie) {
        this.demandeRecolteRepository = demandeRecolteRepository;
        this.vergerRepository = vergerRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.utilisateurAuthentifie = utilisateurAuthentifie;
    }

    public DemandeRecolteResponse creer(DemandeRecolteRequest request) {
        ObjectId agriculteurId = utilisateurAuthentifie.identifiant(utilisateurRepository);
        ObjectId vergerId = objectId(request.getVergerId());
        Verger verger = chargerVerger(vergerId);
        if (!verger.getProprietaireId().equals(agriculteurId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Ce verger appartient a un autre agriculteur");
        }

        DemandeRecolte demande = DemandeRecolte.builder()
                .type(request.getType())
                .dateSouhaitee(request.getDateSouhaitee())
                .dateCreation(Instant.now())
                .statut(StatutDemande.NOUVELLE)
                .motif(request.getMotif())
                .agriculteurId(agriculteurId)
                .vergerId(vergerId)
                .build();
        return toResponse(demandeRecolteRepository.insert(demande));
    }

    /**
     * Liste des demandes : les siennes pour un agriculteur, toutes pour le
     * responsable de collecte et l'administrateur.
     */
    public List<DemandeRecolteResponse> lister() {
        ObjectId identifiant = utilisateurAuthentifie.identifiant(utilisateurRepository);
        List<DemandeRecolte> demandes =
                utilisateurAuthentifie.aLeRole("ADMIN") || utilisateurAuthentifie.aLeRole("RESPONSABLE_COLLECTE")
                        ? demandeRecolteRepository.findAll()
                        : demandeRecolteRepository.findByAgriculteurId(identifiant);
        return demandes.stream().map(this::toResponse).toList();
    }

    public DemandeRecolteResponse consulter(ObjectId demandeId) {
        DemandeRecolte demande = charger(demandeId);
        if (!peutConsulter(demande)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Demande d'un autre agriculteur");
        }
        return toResponse(demande);
    }

    /**
     * Modification par l'agriculteur (type, date souhaitee ou motif)
     * uniquement avant le demarrage de la collecte.
     */
    public DemandeRecolteResponse modifier(ObjectId demandeId, DemandeRecolteRequest request) {
        DemandeRecolte demande = charger(demandeId);
        if (!demande.getAgriculteurId().equals(utilisateurAuthentifie.identifiant(utilisateurRepository))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Demande d'un autre agriculteur");
        }
        verifierAvantDemarrage(demande, "modification");

        demande.setType(request.getType());
        demande.setDateSouhaitee(request.getDateSouhaitee());
        demande.setMotif(request.getMotif());
        return toResponse(demandeRecolteRepository.save(demande));
    }

    /**
     * Annulation par l'agriculteur avant le demarrage ; le responsable de
     * collecte peut aussi annuler une demande qu'il examine. Refus apres
     * demarrage (EN_COURS) conformement a F1.4.
     */
    public DemandeRecolteResponse annuler(ObjectId demandeId) {
        DemandeRecolte demande = charger(demandeId);
        ObjectId identifiant = utilisateurAuthentifie.identifiant(utilisateurRepository);
        boolean parAgriculteur = demande.getAgriculteurId().equals(identifiant);
        boolean parResponsable = utilisateurAuthentifie.aLeRole("ADMIN")
                || utilisateurAuthentifie.aLeRole("RESPONSABLE_COLLECTE");
        if (!parAgriculteur && !parResponsable) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Demande d'un autre agriculteur");
        }
        verifierAvantDemarrage(demande, "annulation");
        return appliquerStatut(demande, StatutDemande.ANNULEE);
    }

    /**
     * Transition NOUVELLE -> PLANIFIEE : le responsable de collecte organise
     * la collecte (examen de la demande, F1.3).
     */
    public DemandeRecolteResponse planifier(ObjectId demandeId) {
        DemandeRecolte demande = charger(demandeId);
        verifierTransition(demande, StatutDemande.NOUVELLE, StatutDemande.PLANIFIEE);
        return appliquerStatut(demande, StatutDemande.PLANIFIEE);
    }

    /** Transition PLANIFIEE -> EN_COURS : demarrage de la collecte. */
    public DemandeRecolteResponse demarrer(ObjectId demandeId) {
        DemandeRecolte demande = charger(demandeId);
        verifierTransition(demande, StatutDemande.PLANIFIEE, StatutDemande.EN_COURS);
        return appliquerStatut(demande, StatutDemande.EN_COURS);
    }

    /** Transition EN_COURS -> TERMINEE : fin de collecte. */
    public DemandeRecolteResponse terminer(ObjectId demandeId) {
        DemandeRecolte demande = charger(demandeId);
        verifierTransition(demande, StatutDemande.EN_COURS, StatutDemande.TERMINEE);
        return appliquerStatut(demande, StatutDemande.TERMINEE);
    }

    private DemandeRecolte charger(ObjectId demandeId) {
        return demandeRecolteRepository.findById(demandeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Demande de recolte introuvable"));
    }

    private Verger chargerVerger(ObjectId vergerId) {
        return vergerRepository.findById(vergerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verger introuvable"));
    }

    private boolean peutConsulter(DemandeRecolte demande) {
        ObjectId identifiant = utilisateurAuthentifie.identifiant(utilisateurRepository);
        return demande.getAgriculteurId().equals(identifiant)
                || utilisateurAuthentifie.aLeRole("ADMIN")
                || utilisateurAuthentifie.aLeRole("RESPONSABLE_COLLECTE");
    }

    /**
     * Modification et annulation refusees des que la collecte est en cours :
     * l'API refuse l'operation apres demarrage (F1.4).
     */
    private void verifierAvantDemarrage(DemandeRecolte demande, String operation) {
        if (!STATUTS_AVANT_DEMARRAGE.contains(demande.getStatut())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    operation + " impossible : la collecte est " + libelle(demande.getStatut()));
        }
    }

    private void verifierTransition(DemandeRecolte demande, StatutDemande attendu, StatutDemande cible) {
        if (demande.getStatut() != attendu) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Transition " + libelle(attendu) + " -> " + libelle(cible)
                            + " refusee : la demande est " + libelle(demande.getStatut()));
        }
    }

    private DemandeRecolteResponse appliquerStatut(DemandeRecolte demande, StatutDemande statut) {
        demande.setStatut(statut);
        return toResponse(demandeRecolteRepository.save(demande));
    }

    private String libelle(StatutDemande statut) {
        return switch (statut) {
            case NOUVELLE -> "nouvelle";
            case PLANIFIEE -> "planifiee";
            case EN_COURS -> "en cours (demarree)";
            case TERMINEE -> "terminee";
            case ANNULEE -> "annulee";
        };
    }

    private ObjectId objectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant de verger invalide");
        }
        return new ObjectId(id);
    }

    private DemandeRecolteResponse toResponse(DemandeRecolte demande) {
        return DemandeRecolteResponse.builder()
                .id(demande.getId().toHexString())
                .type(demande.getType())
                .dateSouhaitee(demande.getDateSouhaitee())
                .dateCreation(demande.getDateCreation())
                .statut(demande.getStatut())
                .motif(demande.getMotif())
                .vergerId(demande.getVergerId() != null ? demande.getVergerId().toHexString() : null)
                .agriculteurId(demande.getAgriculteurId() != null ? demande.getAgriculteurId().toHexString() : null)
                .build();
    }
}