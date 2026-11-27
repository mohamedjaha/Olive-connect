package com.oliveconnect.model;

import com.oliveconnect.model.enums.StatutDemande;
import com.oliveconnect.model.enums.TypeDemande;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Demande de recolte declaree par un agriculteur. Collection : demandes.
 * dateSouhaitee est une date civile stockee a minuit UTC (convention M1).
 * Champ facultatif : motif.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "demandes")
public class DemandeRecolte {

    @Id
    private ObjectId id;

    private TypeDemande type;

    private LocalDate dateSouhaitee;

    private Instant dateCreation;

    private StatutDemande statut;

    private String motif;

    private ObjectId agriculteurId;

    private ObjectId vergerId;
}