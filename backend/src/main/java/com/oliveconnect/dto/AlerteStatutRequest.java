package com.oliveconnect.dto;

import com.oliveconnect.model.enums.StatutAlerte;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps de requete pour le traitement d'une alerte (F2.2).
 * Transition autorisee par AlerteService : NOUVELLE -> EN_COURS -> TRAITEE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Changement de statut d'une alerte")
public class AlerteStatutRequest {

    @NotNull(message = "Le nouveau statut est obligatoire")
    @Schema(description = "Nouveau statut de l'alerte", example = "EN_COURS", requiredMode = Schema.RequiredMode.REQUIRED)
    private StatutAlerte statut;

    @Schema(description = "Commentaire de traitement (facultatif)", example = "Equipe envoyee sur place")
    private String commentaire;
}