package com.oliveconnect.repository;

import com.oliveconnect.model.Alerte;
import com.oliveconnect.model.enums.StatutAlerte;
import org.bson.types.ObjectId;
import org.springframework.data.geo.Distance;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlerteRepository
        extends MongoRepository<Alerte, ObjectId> {

    List<Alerte> findByStatut(StatutAlerte statut);

    List<Alerte> findByVergerId(ObjectId vergerId);

    List<Alerte> findByAuteurId(ObjectId auteurId);

    List<Alerte> findByLocalisationNear(
            GeoJsonPoint point,
            Distance distance);
}