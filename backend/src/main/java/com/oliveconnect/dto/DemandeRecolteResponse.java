package com.oliveconnect.dto;

import com.oliveconnect.model.enums.StatutDemande;
import com.oliveconnect.model.enums.TypeDemande;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Reponse API pour une demande de recolte (F1.2, F1.4, F1.5).
 * Les identifiants sont exposes sous forme de chaines (ObjectId en base).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Demande de recolte renvoyee par l'API")
public class DemandeRecolteResponse {

    @Schema(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
    private String id;

    @Schema(description = "Caractere de la demande", example = "PLANIFIEE")
    private TypeDemande type;

    @Schema(description = "Date souhaitee de récolte", example = "2026-12-15")
    private LocalDate dateSouhaitee;

    @Schema(description = "Date de creation de la demande (UTC)", example = "2026-11-27T18:00:00Z")
    private Instant dateCreation;

    @Schema(description = "Statut courant de la demande", example = "NOUVELLE")
    private StatutDemande statut;

    @Schema(description = "Motif de la demande", example = "Maturite optimale après fortes chaleurs")
    private String motif;

    @Schema(description = "Identifiant du verger concerne (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c")
    private String vergerId;

    @Schema(description = "Identifiant de l'agriculteur (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0d")
    private String agriculteurId;
}