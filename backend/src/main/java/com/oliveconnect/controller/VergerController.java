package com.oliveconnect.controller;

import com.oliveconnect.dto.VergerRequest;
import com.oliveconnect.dto.VergerResponse;
import com.oliveconnect.service.VergerService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Endpoints F1.1 - gestion des vergers (M3 Jahha #1).
 * <p>
 * Le proprietaire est deduit du jeton OAuth2 : il n'est jamais accepte dans
 * le corps de requete. Un agriculteur ne voit et ne modifie que ses vergers.
 */
@RestController
@RequestMapping("/api/vergers")
@Tag(name = "F1.1 Vergers", description = "Creation, consultation et modification des vergers d'un agriculteur")
public class VergerController {

    private final VergerService vergerService;

    public VergerController(VergerService vergerService) {
        this.vergerService = vergerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('AGRICULTEUR')")
    @Operation(summary = "Creer un verger", description = "Enregistre un verger pour l'agriculteur authentifie. "
            + "Le proprietaire est deduit du jeton. Exemple : nom 'Verger Sfax Nord', "
            + "superficie 12.5 ha, variete Chemlali, localisation [10.76, 34.74] (longitude, latitude).")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "201", description = "Verger cree")
    @ApiResponse(responseCode = "400", description = "Donnees invalides (superficie negative, coordonnees hors bornes)")
    @ApiResponse(responseCode = "403", description = "Role agriculteur requis ou email non verifie")
    public VergerResponse creer(@io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Verger a creer",
            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = VergerRequest.class),
                    examples = @ExampleObject(value = "{\"nom\":\"Verger Sfax Nord\",\"superficieHa\":12.5,"
                            + "\"variete\":\"Chemlali\",\"localisation\":{\"longitude\":10.76,\"latitude\":34.74},"
                            + "\"maturite\":80}"))) @Valid @RequestBody VergerRequest request) {
        return vergerService.creer(request);
    }

    @GetMapping
    @Operation(summary = "Lister les vergers", description = "Renvoie les vergers de l'agriculteur authentifie ; "
            + "un administrateur recoit tous les vergers.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Liste des vergers")
    public List<VergerResponse> lister() {
        return vergerService.lister();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter un verger", description = "Reserve au proprietaire du verger et a l'administrateur.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Verger trouve")
    @ApiResponse(responseCode = "403", description = "Verger d'un autre agriculteur")
    @ApiResponse(responseCode = "404", description = "Verger introuvable")
    public VergerResponse consulter(@Parameter(description = "Identifiant du verger (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c")
                                    @PathVariable("id") String id) {
        return vergerService.consulter(objectId(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un verger", description = "Mise a jour complete par le proprietaire ou un administrateur. "
            + "Exemple : passage de la maturite de 80 a 90 % apres une mesure.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Verger mis a jour")
    @ApiResponse(responseCode = "400", description = "Donnees invalides")
    @ApiResponse(responseCode = "403", description = "Verger d'un autre agriculteur")
    @ApiResponse(responseCode = "404", description = "Verger introuvable")
    public VergerResponse modifier(@Parameter(description = "Identifiant du verger (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b0c")
                                   @PathVariable("id") String id,
                                   @io.swagger.v3.oas.annotations.parameters.RequestBody(
                                           description = "Nouvelles valeurs du verger",
                                           content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                                                   schema = @Schema(implementation = VergerRequest.class),
                                                   examples = @ExampleObject(value = "{\"nom\":\"Verger Sfax Nord\",\"superficieHa\":12.5,"
                                                           + "\"variete\":\"Chemlali\",\"localisation\":{\"longitude\":10.76,\"latitude\":34.74},"
                                                           + "\"maturite\":90}"))) @Valid @RequestBody VergerRequest request) {
        return vergerService.modifier(objectId(id), request);
    }

    private ObjectId objectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant invalide");
        }
        return new ObjectId(id);
    }
}