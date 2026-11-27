package com.oliveconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

/**
 * Etape d'une tournee, imbriquee dans Tournee (tournees.etapes[]).
 * Au moins une etape par tournee.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtapeCollecte {

    private ObjectId vergerId;

    private Integer ordre;

    private Double avancement;

    private Double quantiteRecolteeKg;

    private ObjectId demandeId;

    private Instant dateDebutReelle;

    private Instant dateFinReelle;
}