package com.oliveconnect.model;

import com.oliveconnect.model.enums.TypeNotification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Notification conservee en base et presentee au destinataire. Collection : notifications.
 * lu est initialise a false a la creation (convention a appliquer dans le backend).
 * La collection cible de objetId depend du type :
 * COLLECTE_PLANIFIEE -> demandes, ALERTE_CREEE -> alertes,
 * TOURNEE_AFFECTEE -> tournees, RECEPTION_CONFIRMEE -> receptions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private ObjectId id;

    private TypeNotification type;

    private String message;

    private Instant dateCreation;

    private Boolean lu;

    private ObjectId objetId;

    private ObjectId destinataireId;
}