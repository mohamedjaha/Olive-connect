package com.oliveconnect.model;

import com.oliveconnect.model.enums.StatutTournee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Tournee de collecte dirigee par un chef d'equipe. Collection : tournees.
 * Les etapes sont imbriquees (tournees.etapes[]) : au moins une etape par tournee.
 * dateDebut doit etre anterieure a dateFin.
 * L'avancement global est derive (moyenne des avancements des etapes) : non persiste.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tournees")
public class Tournee {

    @Id
    private ObjectId id;

    private Instant dateDebut;

    private Instant dateFin;

    private StatutTournee statut;

    private ObjectId chefEquipeId;

    private List<EtapeCollecte> etapes;
}