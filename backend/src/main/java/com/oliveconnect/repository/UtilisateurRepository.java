package com.oliveconnect.repository;

import com.oliveconnect.model.Utilisateur;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acces a la collection users.
 * <p>
 * Interface minimale requise par l'authentification (M2 Jahha #2) :
 * la recherche par email permet de retrouver le role de l'utilisateur.
 * Les methodes metier (findByRole, save explicite, etc.) sont completees
 * par Sof dans le cadre de UserRepository / UserService (M2).
 */
@Repository
public interface UtilisateurRepository extends MongoRepository<Utilisateur, ObjectId> {

    Optional<Utilisateur> findByEmail(String email);
}