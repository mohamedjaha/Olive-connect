package com.oliveconnect.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Sondes de verification de la securite par role (M2).
 * <p>
 * Elles servent de matrice d'acces pendant la mise en place de
 * l'authentification Google OAuth2 et de la securite method-level.
 * Les endpoints metier arrivent a partir du M3 (VergerController, ...).
 */
@RestController
@RequestMapping("/api/test")
@Tag(name = "Securite (tests de role)", description = "Endpoints de verification des acces par role - M2")
public class TestController {

    @GetMapping("/me")
    @Operation(summary = "Profil de l'utilisateur authentifie", description = "Accessible a tout utilisateur authentifie, quel que soit son role.")
    @SecurityRequirement(name = "bearerAuth")
    public Map<String, Object> me(Authentication authentication, @AuthenticationPrincipal Jwt jwt) {
        List<String> authorities = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
        return Map.of(
            "subject", jwt.getSubject(),
            "email", jwt.getClaimAsString("email"),
            "authorities", authorities
        );
    }

    @GetMapping("/any-role")
    @Operation(summary = "Endpoint authentifie multi-role", description = "Accessible a tout utilisateur authentifie.")
    public Map<String, Object> anyRole(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "message", "Any authenticated user can access this",
            "subject", jwt.getSubject()
        );
    }

    @GetMapping("/agriculteur")
    @PreAuthorize("hasRole('AGRICULTEUR')")
    @Operation(summary = "Espace agriculteur", description = "Reserve au role AGRICULTEUR. Les autres roles recoivent 403.")
    public Map<String, Object> agriculteur(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("espace", "AGRICULTEUR", "subject", jwt.getSubject());
    }

    @GetMapping("/responsable-collecte")
    @PreAuthorize("hasRole('RESPONSABLE_COLLECTE')")
    @Operation(summary = "Espace responsable de collecte", description = "Reserve au role RESPONSABLE_COLLECTE.")
    public Map<String, Object> responsableCollecte(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("espace", "RESPONSABLE_COLLECTE", "subject", jwt.getSubject());
    }

    @GetMapping("/chef-equipe")
    @PreAuthorize("hasRole('CHEF_EQUIPE')")
    @Operation(summary = "Espace chef d'equipe", description = "Reserve au role CHEF_EQUIPE.")
    public Map<String, Object> chefEquipe(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("espace", "CHEF_EQUIPE", "subject", jwt.getSubject());
    }

    @GetMapping("/pressoir")
    @PreAuthorize("hasRole('RESPONSABLE_PRESSOIR')")
    @Operation(summary = "Espace responsable pressoir", description = "Reserve au role RESPONSABLE_PRESSOIR.")
    public Map<String, Object> responsablePressoir(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("espace", "RESPONSABLE_PRESSOIR", "subject", jwt.getSubject());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Espace administrateur", description = "Reserve au role ADMIN.")
    public Map<String, Object> admin(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("espace", "ADMIN", "subject", jwt.getSubject());
    }
}