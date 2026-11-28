package com.oliveconnect.repository;

import com.oliveconnect.model.DemandeRecolte;
import com.oliveconnect.model.enums.StatutDemande;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acces a la collection demandes (M3 - Sof #2).
 * <p>
 * Requetes :
 * - findByAgriculteurId : les demandes declarees par un agriculteur ;
 * - findByVergerId : les demandes concernant un verger ;
 * - findByStatut : les demandes d'un statut donne (file du responsable de
 *   collecte, demandes NOUVELLE a examiner).
 */
@Repository
public interface DemandeRecolteRepository extends MongoRepository<DemandeRecolte, ObjectId> {

    List<DemandeRecolte> findByAgriculteurId(ObjectId agriculteurId);

    List<DemandeRecolte> findByVergerId(ObjectId vergerId);

    List<DemandeRecolte> findByStatut(StatutDemande statut);
}