package com.oliveconnect.service;

import com.oliveconnect.dto.LocalisationDto;
import com.oliveconnect.dto.VergerRequest;
import com.oliveconnect.dto.VergerResponse;
import com.oliveconnect.model.Verger;
import com.oliveconnect.model.enums.StatutVerger;
import com.oliveconnect.repository.UtilisateurRepository;
import com.oliveconnect.repository.VergerRepository;
import com.oliveconnect.security.UtilisateurAuthentifie;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Gestion des vergers (F1.1, M3 Jahha #2).
 * <p>
 * Regles metier :
 * - un verger appartient a un agriculteur : il n'est visible et modifiable
 *   que par son proprietaire (un ADMIN supervise l'ensemble) ;
 * - superficie >= 0 et coordonnees valides (longitude [-180, 180],
 *   latitude [-90, 90]) : la validation du DTO est completee par un controle
 *   service, la verification MongoDB ne remplacant pas la regle backend
 *   (contrat uml-to-mongodb.md §9).
 */
@Service
public class VergerService {

    private final VergerRepository vergerRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurAuthentifie utilisateurAuthentifie;

    public VergerService(VergerRepository vergerRepository,
                         UtilisateurRepository utilisateurRepository,
                         UtilisateurAuthentifie utilisateurAuthentifie) {
        this.vergerRepository = vergerRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.utilisateurAuthentifie = utilisateurAuthentifie;
    }

    public VergerResponse creer(VergerRequest request) {
        ObjectId proprietaireId = utilisateurAuthentifie.identifiant(utilisateurRepository);
        localisationValide(request.getLocalisation());

        Verger verger = Verger.builder()
                .nom(request.getNom().trim())
                .superficieHa(request.getSuperficieHa())
                .variete(request.getVariete().trim())
                .localisation(point(request.getLocalisation()))
                .maturite(request.getMaturite())
                .statut(request.getStatut() != null ? request.getStatut() : StatutVerger.DISPONIBLE)
                .proprietaireId(proprietaireId)
                .build();
        return toResponse(vergerRepository.insert(verger));
    }

    /**
     * Liste des vergers : les siens pour un agriculteur, tous pour un ADMIN.
     */
    public List<VergerResponse> lister() {
        ObjectId proprietaireId = utilisateurAuthentifie.identifiant(utilisateurRepository);
        List<Verger> vergers = utilisateurAuthentifie.aLeRole("ADMIN")
                ? vergerRepository.findAll()
                : vergerRepository.findByProprietaireId(proprietaireId);
        return vergers.stream().map(this::toResponse).toList();
    }

    public VergerResponse consulter(ObjectId vergerId) {
        Verger verger = charger(vergerId);
        if (!peutConsulter(verger)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verger d'un autre agriculteur");
        }
        return toResponse(verger);
    }

    public VergerResponse modifier(ObjectId vergerId, VergerRequest request) {
        Verger verger = charger(vergerId);
        if (!peutModifier(verger)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verger d'un autre agriculteur");
        }
        localisationValide(request.getLocalisation());
        if (request.getSuperficieHa() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La superficie doit etre positive ou nulle");
        }
        if (request.getMaturite() != null
                && (request.getMaturite() < 0 || request.getMaturite() > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La maturite doit etre entre 0 et 100");
        }

        verger.setNom(request.getNom().trim());
        verger.setSuperficieHa(request.getSuperficieHa());
        verger.setVariete(request.getVariete().trim());
        verger.setLocalisation(point(request.getLocalisation()));
        verger.setMaturite(request.getMaturite());
        if (request.getStatut() != null) {
            verger.setStatut(request.getStatut());
        }
        return toResponse(vergerRepository.save(verger));
    }

    private Verger charger(ObjectId vergerId) {
        return vergerRepository.findById(vergerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verger introuvable"));
    }

    private boolean peutConsulter(Verger verger) {
        return utilisateurAuthentifie.aLeRole("ADMIN") || estProprietaire(verger);
    }

    private boolean peutModifier(Verger verger) {
        return utilisateurAuthentifie.aLeRole("ADMIN") || estProprietaire(verger);
    }

    private boolean estProprietaire(Verger verger) {
        ObjectId identifiant = utilisateurAuthentifie.identifiant(utilisateurRepository);
        return verger.getProprietaireId() != null && verger.getProprietaireId().equals(identifiant);
    }

    private void localisationValide(LocalisationDto localisation) {
        if (localisation == null || localisation.getLongitude() == null || localisation.getLatitude() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les coordonnees GPS sont obligatoires");
        }
        double longitude = localisation.getLongitude();
        double latitude = localisation.getLatitude();
        if (longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Longitude entre -180 et 180 degres");
        }
        if (latitude < -90 || latitude > 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Latitude entre -90 et 90 degres");
        }
    }

    private GeoJsonPoint point(LocalisationDto localisation) {
        return new GeoJsonPoint(localisation.getLongitude(), localisation.getLatitude());
    }

    private VergerResponse toResponse(Verger verger) {
        LocalisationDto localisation = null;
        if (verger.getLocalisation() != null) {
            localisation = LocalisationDto.builder()
                    .longitude(verger.getLocalisation().getX())
                    .latitude(verger.getLocalisation().getY())
                    .build();
        }
        return VergerResponse.builder()
                .id(verger.getId().toHexString())
                .nom(verger.getNom())
                .superficieHa(verger.getSuperficieHa())
                .variete(verger.getVariete())
                .localisation(localisation)
                .maturite(verger.getMaturite())
                .statut(verger.getStatut())
                .proprietaireId(verger.getProprietaireId() != null ? verger.getProprietaireId().toHexString() : null)
                .build();
    }
}