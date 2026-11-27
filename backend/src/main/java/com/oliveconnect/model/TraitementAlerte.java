package com.oliveconnect.model;

import com.oliveconnect.model.enums.StatutAlerte;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;

import java.time.Instant;

/**
 * Traitement d'une alerte, imbrique dans Alerte (alertes.historique[]).
 * L'historique est conserve avec son alerte et peut etre vide.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TraitementAlerte {

    private ObjectId auteurId;

    private Instant date;

    private StatutAlerte ancienStatut;

    private StatutAlerte nouveauStatut;

    private String commentaire;
}