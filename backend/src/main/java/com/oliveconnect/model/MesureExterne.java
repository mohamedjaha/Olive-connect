package com.oliveconnect.model;

import com.oliveconnect.model.enums.TypeMesure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Mesure issue d'une source externe (meteo, maturite, capacite). Collection : mesures_externes.
 * Rattachements conditionnels selon le type :
 * - TEMPERATURE / HUMIDITE / PRECIPITATION : localisation requise, verger facultatif, pas de pressoir ;
 * - MATURITE : verger requis, pas de pressoir ;
 * - CAPACITE_PRESSOIR : pressoir requis, pas de verger.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mesures_externes")
public class MesureExterne {

    @Id
    private ObjectId id;

    private String source;

    private TypeMesure type;

    private Double valeur;

    private String unite;

    private Instant dateMesure;

    private GeoJsonPoint localisation;

    private ObjectId vergerId;

    private ObjectId pressoirId;
}