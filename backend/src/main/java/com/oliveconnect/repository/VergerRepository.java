package com.oliveconnect.repository;

import com.oliveconnect.model.Verger;
import org.bson.types.ObjectId;
import org.springframework.data.geo.Distance;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acces a la collection vergers (M3 - Sof #1).
 * <p>
 * Requetes :
 * - findByProprietaireId : les vergers d'un agriculteur (controle de
 *   propriete F1.1 et liste GET /api/vergers) ;
 * - findByLocalisationNear : recherche geospatiale autour d'un point
 *   (index 2dsphere idx_vergers_localisation, cree en M1.4), du plus proche
 *   au plus lointain. Alimente la carte (M8).
 */
@Repository
public interface VergerRepository extends MongoRepository<Verger, ObjectId> {

    List<Verger> findByProprietaireId(ObjectId proprietaireId);

    List<Verger> findByLocalisationNear(GeoJsonPoint point, Distance distance);
}