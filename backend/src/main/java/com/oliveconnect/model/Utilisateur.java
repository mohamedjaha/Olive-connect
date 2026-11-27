package com.oliveconnect.model;

import com.oliveconnect.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Utilisateur de l'application. Collection : users.
 * Champ facultatif : telephone (absent s'il n'est pas renseigne).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class Utilisateur {

    @Id
    private ObjectId id;

    private String nom;

    private String prenom;

    private String email;

    private String telephone;

    private Role role;

    @Field("actif")
    private Boolean actif;
}