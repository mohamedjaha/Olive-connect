package com.oliveconnect.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Localisation exposee par l'API : longitude puis latitude (GeoJSON Point en base).
 * Convention M1 : longitude entre -180 et 180, latitude entre -90 et 90.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Coordonnees geographiques (longitude, latitude)")
public class LocalisationDto {

    @NotNull(message = "La longitude est obligatoire")
    @DecimalMin(value = "-180", message = "Longitude entre -180 et 180 degres")
    @DecimalMax(value = "180", message = "Longitude entre -180 et 180 degres")
    @Schema(description = "Longitude en degres decimaux", example = "10.76", minimum = "-180", maximum = "180",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private Double longitude;

    @NotNull(message = "La latitude est obligatoire")
    @DecimalMin(value = "-90", message = "Latitude entre -90 et 90 degres")
    @DecimalMax(value = "90", message = "Latitude entre -90 et 90 degres")
    @Schema(description = "Latitude en degres decimaux", example = "34.74", minimum = "-90", maximum = "90",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private Double latitude;
}