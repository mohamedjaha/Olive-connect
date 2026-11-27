package com.oliveconnect.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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

    @Schema(description = "Longitude en degres decimaux", example = "10.76", minimum = "-180", maximum = "180")
    private Double longitude;

    @Schema(description = "Latitude en degres decimaux", example = "34.74", minimum = "-90", maximum = "90")
    private Double latitude;
}