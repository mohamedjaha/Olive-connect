package com.oliveconnect.repository;

import com.oliveconnect.model.DemandeRecolte;
import com.oliveconnect.model.enums.StatutDemande;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acces a la collection demandes.
 * <p>
 * Interface minimale requise par les services F1 (M3 Jahha #3-4) : les
 * recherches par agriculteur, par verger et par statut alimentent les listes
 * filtrees et la coherence des references. Les requetes metier complementaires
 * (pagination, plages de dates, statistiques) sont completees par Sof dans le
 * cadre de DemandeRecolteRepository (M3).
 */
@Repository
public interface DemandeRecolteRepository extends MongoRepository<DemandeRecolte, ObjectId> {

    List<DemandeRecolte> findByAgriculteurId(ObjectId agriculteurId);

    List<DemandeRecolte> findByVergerId(ObjectId vergerId);

    List<DemandeRecolte> findByStatut(StatutDemande statut);
}