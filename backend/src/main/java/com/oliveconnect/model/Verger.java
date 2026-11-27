package com.oliveconnect.model;

import com.oliveconnect.model.enums.StatutVerger;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Verger d'un agriculteur. Collection : vergers.
 * La localisation est imbriquee au format GeoJSON Point (longitude, latitude).
 * Index 2dsphere : idx_vergers_localisation (cree par Sof, M1.4).
 * Champ facultatif : maturite (0-100).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vergers")
public class Verger {

    @Id
    private ObjectId id;

    private String nom;

    private Double superficieHa;

    private String variete;

    @GeoSpatialIndexed(name = "idx_vergers_localisation", type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint localisation;

    private Double maturite;

    private StatutVerger statut;

    private ObjectId proprietaireId;
}