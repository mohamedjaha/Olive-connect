package com.oliveconnect.repository;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.enums.Role;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acces a la collection users.
 * Recherche et persistance des utilisateurs.
 */
@Repository
public interface UtilisateurRepository
        extends MongoRepository<Utilisateur, ObjectId> {

    Optional<Utilisateur> findByEmail(String email);

    List<Utilisateur> findByRole(Role role);
}