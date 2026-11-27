package com.oliveconnect.model;

import com.oliveconnect.model.enums.StatutAffectation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Affectation d'une ressource a une tournee sur un creneau. Collection : affectations.
 * debut doit etre strictement anterieur a fin.
 * Chevauchement de deux creneaux : debutA < finB && debutB < finA.
 * Index compose : idx_affectations_ressource_creneau (cree par Sof, M1.4).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "affectations")
@CompoundIndex(name = "idx_affectations_ressource_creneau", def = "{'ressourceId': 1, 'debut': 1, 'fin': 1}")
public class Affectation {

    @Id
    private ObjectId id;

    private Instant debut;

    private Instant fin;

    private StatutAffectation statut;

    private ObjectId tourneeId;

    private ObjectId ressourceId;
}