package com.oliveconnect.dto;

import com.oliveconnect.model.enums.StatutVerger;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps de requete pour la creation et la modification d'un verger (F1.1).
 * Le proprietaire est deduit du jeton OAuth2 : il n'est pas accepte dans la requete.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Creation ou modification d'un verger")
public class VergerRequest {

    @NotBlank(message = "Le nom du verger est obligatoire")
    @Schema(description = "Nom du verger", example = "Verger Sfax Nord", requiredMode = Schema.RequiredMode.REQUIRED)
    private String nom;

    @NotNull(message = "La superficie est obligatoire")
    @PositiveOrZero(message = "La superficie doit etre positive ou nulle")
    @Schema(description = "Superficie en hectares", example = "12.5", requiredMode = Schema.RequiredMode.REQUIRED)
    private Double superficieHa;

    @NotBlank(message = "La variete est obligatoire")
    @Schema(description = "Variete d'olives", example = "Chemlali", requiredMode = Schema.RequiredMode.REQUIRED)
    private String variete;

    @NotNull(message = "La localisation est obligatoire")
    @Valid
    @Schema(description = "Coordonnees GPS du verger", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalisationDto localisation;

    @DecimalMin(value = "0", message = "La maturite doit etre au moins 0")
    @DecimalMax(value = "100", message = "La maturite doit etre au plus 100")
    @Schema(description = "Maturite en pourcentage (facultative)", example = "80")
    private Double maturite;

    @Schema(description = "Statut du verger (facultatif, DISPONIBLE par defaut)", example = "DISPONIBLE")
    private StatutVerger statut;
}