package com.oliveconnect.repository;

import com.oliveconnect.model.Verger;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acces a la collection vergers.
 * <p>
 * Interface minimale requise par les services F1 (M3 Jahha #2) : la liste des
 * vergers d'un proprietaire alimente le controle de propriete et l'endpoint
 * GET /api/vergers. Les requetes metier complementaires (geospatial near,
 * tris, filtres) sont completees par Sof dans le cadre de VergerRepository (M3).
 */
@Repository
public interface VergerRepository extends MongoRepository<Verger, ObjectId> {

    List<Verger> findByProprietaireId(ObjectId proprietaireId);
}