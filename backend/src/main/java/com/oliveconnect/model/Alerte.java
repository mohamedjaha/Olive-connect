package com.oliveconnect.model;

import com.oliveconnect.model.enums.StatutAlerte;
import com.oliveconnect.model.enums.TypeAlerte;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Alerte terrain signalee par un utilisateur. Collection : alertes.
 * La localisation est imbriquee au format GeoJSON Point.
 * L'historique des traitements est imbrique (historique[]) et peut etre vide.
 * Index textuel : idx_alertes_description (cree par Sof, M1.4).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alertes")
@CompoundIndex(name = "idx_alertes_description", def = "{'description': 'text'}")
public class Alerte {

    @Id
    private ObjectId id;

    private TypeAlerte type;

    private String description;

    private Instant dateCreation;

    private GeoJsonPoint localisation;

    private StatutAlerte statut;

    private List<TraitementAlerte> historique;

    private ObjectId auteurId;

    private ObjectId vergerId;
}