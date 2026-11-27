package com.oliveconnect.dto;

import com.oliveconnect.model.enums.StatutVerger;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reponse API pour un verger (F1.1).
 * Les identifiants sont exposes sous forme de chaines (ObjectId en base).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Verger renvoye par l'API")
public class VergerResponse {

    @Schema(description = "Identifiant du verger (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c")
    private String id;

    @Schema(description = "Nom du verger", example = "Verger Sfax Nord")
    private String nom;

    @Schema(description = "Superficie en hectares", example = "12.5")
    private Double superficieHa;

    @Schema(description = "Variete d'olives", example = "Chemlali")
    private String variete;

    @Schema(description = "Coordonnees GPS du verger")
    private LocalisationDto localisation;

    @Schema(description = "Maturite en pourcentage, 'non renseignee' si absente", example = "80")
    private Double maturite;

    @Schema(description = "Statut du verger", example = "DISPONIBLE")
    private StatutVerger statut;

    @Schema(description = "Identifiant du proprietaire (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0d")
    private String proprietaireId;
}