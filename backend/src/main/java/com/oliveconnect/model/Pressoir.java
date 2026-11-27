package com.oliveconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/**
 * Pressoir de la cooperative. Collection : pressoirs.
 * La localisation est imbriquee au format GeoJSON Point.
 * responsablesIds : identifiants des responsables du pressoir, sans doublons.
 * La capacite disponible est derivee (capaciteTotaleKg - somme des poidsPrevuKg
 * des receptions EN_ATTENTE) : calculee dans PressoirService, non persistee.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pressoirs")
public class Pressoir {

    @Id
    private ObjectId id;

    private String nom;

    private GeoJsonPoint localisation;

    private Double capaciteTotaleKg;

    private List<ObjectId> responsablesIds;
}