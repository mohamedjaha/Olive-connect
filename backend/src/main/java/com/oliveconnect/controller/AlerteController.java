package com.oliveconnect.controller;

import com.oliveconnect.dto.AlerteRequest;
import com.oliveconnect.dto.AlerteResponse;
import com.oliveconnect.dto.AlerteStatutRequest;
import com.oliveconnect.service.AlerteService;
import com.oliveconnect.model.enums.StatutAlerte;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Endpoints F2 - alertes terrain (M4 Jahha #1-2).
 * <p>
 * L'agriculteur signale une alerte sur un de ses vergers (le service
 * verifie la propriete). Le responsable de collecte consulte les alertes
 * et les traite : NOUVELLE -> EN_COURS -> TRAITEE, chaque transition
 * alimentant l'historique imbrique.
 */
@RestController
@RequestMapping("/api/alertes")
@Tag(name = "F2 Alertes terrain", description = "Signalement et traitement des alertes des agriculteurs")
public class AlerteController {

    private final AlerteService alerteService;

    public AlerteController(AlerteService alerteService) {
        this.alerteService = alerteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('AGRICULTEUR')")
    @Operation(summary = "Signaler une alerte", description = "Cree une alerte NOUVELLE sur un verger de "
            + "l'agriculteur authentifie. Sans position GPS fournie, celle du verger est reutilisee. "
            + "Exemple : type MATURITE, description 'Maturite atteinte sur la partie nord'.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "201", description = "Alerte cree au statut NOUVELLE")
    @ApiResponse(responseCode = "400", description = "Données invalides (type, description, coordonnees)")
    @ApiResponse(responseCode = "403", description = "Role agriculteur requis ou verger d'un autre agriculteur")
    public AlerteResponse creer(@io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Alerte a signaler",
            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = AlerteRequest.class),
                    examples = @ExampleObject(value = "{\"type\":\"MATURITE\","
                            + "\"description\":\"Maturite atteinte sur la partie nord du verger\","
                            + "\"vergerId\":\"674a1f2e8c4b5d6e7f8a9b0c\","
                            + "\"localisation\":{\"longitude\":10.76,\"latitude\":34.74}}"))) @Valid @RequestBody AlerteRequest request) {
        GeoJsonPoint localisation = request.getLocalisation() == null ? null
                : new GeoJsonPoint(request.getLocalisation().getLongitude(), request.getLocalisation().getLatitude());
        return AlerteResponse.of(alerteService.creer(
                objectId(request.getVergerId()),
                request.getType(),
                request.getDescription(),
                localisation));
    }

    @GetMapping
    @Operation(summary = "Lister les alertes", description = "Selon le role : l'agriculteur voit ses propres "
            + "alertes ; le responsable de collecte et l'administrateur voient toutes les alertes, filtrables "
            + "par statut et par verger. Exemples : ?statut=NOUVELLE pour la file a traiter, "
            + "?vergerId=674a1f2e8c4b5d6e7f8a9b0c pour l'historique d'un verger.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Liste des alertes visibles par l'appelant")
    @ApiResponse(responseCode = "400", description = "Statut ou identifiant invalide")
    @ApiResponse(responseCode = "403", description = "Role sans acces aux alertes")
    public List<AlerteResponse> lister(
            @Parameter(description = "Filtre par statut (NOUVELLE, EN_COURS, TRAITEE)", example = "NOUVELLE")
            @RequestParam(value = "statut", required = false) String statut,
            @Parameter(description = "Filtre par verger (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c")
            @RequestParam(value = "vergerId", required = false) String vergerId) {
        StatutAlerte filtreStatut = statut == null || statut.isBlank() ? null : statut(statut);
        ObjectId filtreVerger = vergerId == null || vergerId.isBlank() ? null : objectId(vergerId);
        return alerteService.lister(filtreStatut, filtreVerger).stream().map(AlerteResponse::of).toList();
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasRole('RESPONSABLE_COLLECTE')")
    @Operation(summary = "Traiter une alerte", description = "Change le statut d'une alerte par le responsable de "
            + "collecte. Transitions autorisees : NOUVELLE -> EN_COURS puis EN_COURS -> TRAITEE (409 sinon). "
            + "Chaque traitement est ajoute a l'historique avec son commentaire.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Statut mis a jour")
    @ApiResponse(responseCode = "400", description = "Statut obligatoire")
    @ApiResponse(responseCode = "403", description = "Role responsable de collecte requis")
    @ApiResponse(responseCode = "404", description = "Alerte introuvable")
    @ApiResponse(responseCode = "409", description = "Transition de statut interdite")
    public AlerteResponse changerStatut(@Parameter(description = "Identifiant de l'alerte (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                         @PathVariable("id") String id,
                                         @io.swagger.v3.oas.annotations.parameters.RequestBody(
                                                 description = "Nouveau statut et commentaire",
                                                 content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                                                         schema = @Schema(implementation = AlerteStatutRequest.class),
                                                         examples = @ExampleObject(value = "{\"statut\":\"EN_COURS\","
                                                                 + "\"commentaire\":\"Equipe envoyee sur place\"}"))) @Valid @RequestBody AlerteStatutRequest request) {
        return AlerteResponse.of(alerteService.changerStatut(objectId(id), request.getStatut(), request.getCommentaire()));
    }

    private StatutAlerte statut(String valeur) {
        try {
            return StatutAlerte.valueOf(valeur);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut d'alerte inconnu : " + valeur);
        }
    }

    private ObjectId objectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant invalide");
        }
        return new ObjectId(id);
    }
}