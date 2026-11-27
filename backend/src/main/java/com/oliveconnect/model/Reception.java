package com.oliveconnect.model;

import com.oliveconnect.model.enums.QualiteOlive;
import com.oliveconnect.model.enums.StatutReception;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Reception d'olives dans un pressoir. Collection : receptions.
 * Champs facultatifs selon le statut :
 * - poidsPrevuKg : requis si EN_ATTENTE ;
 * - poidsKg, qualite, dateReception, responsableId : requis si CONFIRMEE.
 * tourneeId et origine sont facultatifs (au moins un des deux est attendu).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "receptions")
public class Reception {

    @Id
    private ObjectId id;

    private StatutReception statut;

    private ObjectId pressoirId;

    private Double poidsPrevuKg;

    private Double poidsKg;

    private QualiteOlive qualite;

    private Instant dateReception;

    private String origine;

    private ObjectId tourneeId;

    private ObjectId responsableId;
}