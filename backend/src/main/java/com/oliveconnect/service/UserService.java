package com.oliveconnect.service;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.repository.UtilisateurRepository;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private final UtilisateurRepository utilisateurRepository;

    public UserService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    public Utilisateur inscrire(String nom, String prenom, String telephone) {
        String email = emailAuthentifie();
        if (nom == null || nom.isBlank() || prenom == null || prenom.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom et prenom obligatoires");
        }
        if (utilisateurRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Utilisateur deja inscrit");
        }
        Utilisateur utilisateur = Utilisateur.builder()
                .nom(nom.trim()).prenom(prenom.trim()).email(email)
                .telephone(telephone == null || telephone.isBlank() ? null : telephone.trim())
                .role(Role.VISITEUR).actif(true).build();
        try {
            return utilisateurRepository.insert(utilisateur);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Utilisateur deja inscrit");
        }
    }

    public Utilisateur consulterProfil() {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailAuthentifie())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        if (!Boolean.TRUE.equals(utilisateur.getActif())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte desactive");
        }
        return utilisateur;
    }

    // Controle de propriete : aucun acces au profil d'un autre utilisateur.
    public Utilisateur consulterProfil(ObjectId utilisateurId) {
        Utilisateur utilisateur = consulterProfil();
        if (!utilisateur.getId().equals(utilisateurId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces a un autre profil interdit");
        }
        return utilisateur;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Utilisateur attribuerRole(ObjectId utilisateurId, Role nouveauRole) {
        Utilisateur administrateur = consulterProfil();
        if (administrateur.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Operation reservee aux administrateurs");
        }
        if (utilisateurId == null || nouveauRole == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant et role obligatoires");
        }
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        utilisateur.setRole(nouveauRole);
        return utilisateurRepository.save(utilisateur);
    }

    private String emailAuthentifie() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise");
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()
                || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email Google non verifie");
        }
        return email;
    }
}
