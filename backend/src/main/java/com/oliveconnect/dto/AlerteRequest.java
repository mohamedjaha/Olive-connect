package com.oliveconnect.dto;

import com.oliveconnect.model.enums.TypeAlerte;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps de requete pour le signalement d'une alerte terrain (F2.1).
 * L'auteur est deduit du jeton OAuth2 et le verger doit lui appartenir.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Signalement d'une alerte terrain")
public class AlerteRequest {

    @NotNull(message = "Le type d'alerte est obligatoire")
    @Schema(description = "Type d'alerte", example = "MATURITE", requiredMode = Schema.RequiredMode.REQUIRED)
    private TypeAlerte type;

    @NotBlank(message = "La description est obligatoire")
    @Schema(description = "Description de l'alerte", example = "Maturite atteinte sur la partie nord du verger",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String description;

    @NotBlank(message = "Le verger concerne est obligatoire")
    @Schema(description = "Identifiant du verger concerne (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String vergerId;

    @Valid
    @Schema(description = "Position GPS du signalement (facultative : la position du verger est reutilisee si absente)")
    private LocalisationDto localisation;
}