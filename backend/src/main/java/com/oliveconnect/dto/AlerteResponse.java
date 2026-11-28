package com.oliveconnect.dto;

import com.oliveconnect.model.Alerte;
import com.oliveconnect.model.TraitementAlerte;
import com.oliveconnect.model.enums.StatutAlerte;
import com.oliveconnect.model.enums.TypeAlerte;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Reponse API pour une alerte terrain (F2).
 * Les identifiants sont exposes sous forme de chaines (ObjectId en base).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Alerte terrain renvoyee par l'API")
public class AlerteResponse {

    @Schema(description = "Identifiant de l'alerte (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
    private String id;

    @Schema(description = "Type d'alerte", example = "MATURITE")
    private TypeAlerte type;

    @Schema(description = "Description de l'alerte", example = "Maturite atteinte sur la partie nord du verger")
    private String description;

    @Schema(description = "Date de creation (UTC)", example = "2026-11-28T09:00:00Z")
    private Instant dateCreation;

    @Schema(description = "Position GPS du signalement")
    private LocalisationDto localisation;

    @Schema(description = "Statut courant de l'alerte", example = "NOUVELLE")
    private StatutAlerte statut;

    @Schema(description = "Identifiant du verger concerne (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c")
    private String vergerId;

    @Schema(description = "Identifiant de l'auteur (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0d")
    private String auteurId;

    @Schema(description = "Historique des traitements imbrique (du plus ancien au plus recent)")
    private List<TraitementReponse> historique;

    /** Traitement d'alerte expose par l'API. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Traitement d'une alerte (entree de l'historique)")
    public static class TraitementReponse {

        @Schema(description = "Identifiant de l'auteur du traitement (ObjectId)")
        private String auteurId;

        @Schema(description = "Date du traitement (UTC)")
        private Instant date;

        @Schema(description = "Statut avant le traitement")
        private StatutAlerte ancienStatut;

        @Schema(description = "Statut apres le traitement")
        private StatutAlerte nouveauStatut;

        @Schema(description = "Commentaire de traitement")
        private String commentaire;
    }

    static TraitementReponse traitement(TraitementAlerte traitement) {
        return TraitementReponse.builder()
                .auteurId(traitement.getAuteurId() != null ? traitement.getAuteurId().toHexString() : null)
                .date(traitement.getDate())
                .ancienStatut(traitement.getAncienStatut())
                .nouveauStatut(traitement.getNouveauStatut())
                .commentaire(traitement.getCommentaire())
                .build();
    }

    public static AlerteResponse of(Alerte alerte) {
        LocalisationDto localisation = null;
        if (alerte.getLocalisation() != null) {
            localisation = LocalisationDto.builder()
                    .longitude(alerte.getLocalisation().getX())
                    .latitude(alerte.getLocalisation().getY())
                    .build();
        }
        List<TraitementReponse> historique = alerte.getHistorique() == null ? List.of()
                : alerte.getHistorique().stream().map(AlerteResponse::traitement).toList();
        return AlerteResponse.builder()
                .id(alerte.getId().toHexString())
                .type(alerte.getType())
                .description(alerte.getDescription())
                .dateCreation(alerte.getDateCreation())
                .localisation(localisation)
                .statut(alerte.getStatut())
                .vergerId(alerte.getVergerId() != null ? alerte.getVergerId().toHexString() : null)
                .auteurId(alerte.getAuteurId() != null ? alerte.getAuteurId().toHexString() : null)
                .historique(historique)
                .build();
    }
}