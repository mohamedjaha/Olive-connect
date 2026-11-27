package com.oliveconnect.dto;

import com.oliveconnect.model.enums.TypeDemande;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Corps de requete pour la declaration d'une recolte (F1.2).
 * L'agriculteur est deduit du jeton OAuth2 : il n'est pas accepte dans la requete.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Declaration d'une demande de recolte")
public class DemandeRecolteRequest {

    @NotNull(message = "Le type de demande est obligatoire")
    @Schema(description = "Caractere de la demande", example = "PLANIFIEE", requiredMode = Schema.RequiredMode.REQUIRED)
    private TypeDemande type;

    @NotNull(message = "La date souhaitee est obligatoire")
    @FutureOrPresent(message = "La date souhaitee doit etre aujourd'hui ou dans le futur")
    @Schema(description = "Date souhaitée de récolte", example = "2026-12-15", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate dateSouhaitee;

    @Schema(description = "Motif de la demande (facultatif)", example = "Maturite optimale après fortes chaleurs")
    private String motif;

    @NotBlank(message = "Le verger concerne est obligatoire")
    @Schema(description = "Identifiant du verger concerne (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c", requiredMode = Schema.RequiredMode.REQUIRED)
    private String vergerId;
}