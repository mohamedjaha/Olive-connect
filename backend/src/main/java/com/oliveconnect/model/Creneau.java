package com.oliveconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Creneau d'indisponibilite, imbrique dans Ressource (ressources.indisponibilites[]).
 * Le debut doit etre strictement anterieur a la fin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Creneau {

    private Instant debut;

    private Instant fin;
}