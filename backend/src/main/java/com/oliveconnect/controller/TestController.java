package com.oliveconnect.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/secured")
    @PreAuthorize("hasRole('AGRICULTEUR')")
    public Map<String, Object> secured(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "message", "Secured endpoint accessed successfully",
            "subject", jwt.getSubject(),
            "claims", jwt.getClaims()
        );
    }

    @GetMapping("/any-role")
    public Map<String, Object> anyRole(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "message", "Any authenticated user can access this",
            "subject", jwt.getSubject()
        );
    }
}