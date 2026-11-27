package com.oliveconnect.controller;

import com.oliveconnect.model.Utilisateur;
import com.oliveconnect.model.enums.Role;
import com.oliveconnect.service.UserService;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Profil inscrire(@RequestBody Inscription demande) {
        return Profil.of(userService.inscrire(demande.nom(), demande.prenom(), demande.telephone()));
    }

    @GetMapping("/me")
    public Profil monProfil() {
        return Profil.of(userService.consulterProfil());
    }

    @GetMapping("/{id}")
    public Profil profil(@PathVariable("id") String id) {
        return Profil.of(userService.consulterProfil(objectId(id)));
    }

    @PatchMapping("/{id}/role")
    public Profil attribuerRole(@PathVariable("id") String id, @RequestBody AttributionRole demande) {
        return Profil.of(userService.attribuerRole(objectId(id), demande.role()));
    }

    private ObjectId objectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant invalide");
        }
        return new ObjectId(id);
    }

    // DTOs HTTP : pas de role ni d'email fournis par le formulaire d'inscription.
    public record Inscription(String nom, String prenom, String telephone) {}
    public record AttributionRole(Role role) {}
    public record Profil(String id, String nom, String prenom, String email,
                         String telephone, Role role, Boolean actif) {
        static Profil of(Utilisateur u) {
            return new Profil(u.getId().toHexString(), u.getNom(), u.getPrenom(),
                    u.getEmail(), u.getTelephone(), u.getRole(), u.getActif());
        }
    }
}
