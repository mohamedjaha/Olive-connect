package com.oliveconnect.model;

import com.oliveconnect.model.enums.CategorieRessource;
import com.oliveconnect.model.enums.EtatRessource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/**
 * Ressource mobilisable (ouvrier, tracteur, benne, materiel). Collection : ressources.
 * Les indisponibilites sont imbriquees (ressources.indisponibilites[]) : tableau eventuellement vide.
 * La disponibilite est calculee a partir de l'etat, des indisponibilites et des affectations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ressources")
public class Ressource {

    @Id
    private ObjectId id;

    private String nom;

    private CategorieRessource categorie;

    private EtatRessource etat;

    private List<Creneau> indisponibilites;
}