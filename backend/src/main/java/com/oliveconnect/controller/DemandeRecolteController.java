package com.oliveconnect.controller;

import com.oliveconnect.dto.DemandeRecolteRequest;
import com.oliveconnect.dto.DemandeRecolteResponse;
import com.oliveconnect.service.DemandeRecolteService;
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
 * Endpoints F1.2 / F1.4 / F1.5 - demandes de recolte (M3 Jahha #3-4).
 * <p>
 * L'agriculteur declare une recolte planifiee ou urgente sur un de ses
 * vergers (l'identite et le verger sont deduits du jeton). Le responsable
 * de collecte examine la demande, puis le cycle de vie progresse :
 * NOUVELLE -> PLANIFIEE -> EN_COURS -> TERMINEE (ou ANNULEE avant demarrage).
 */
@RestController
@RequestMapping("/api/demandes")
@Tag(name = "F1.2 Demandes de recolte", description = "Declaration, suivi, modification et annulation des demandes de recolte")
public class DemandeRecolteController {

    private final DemandeRecolteService demandeRecolteService;

    public DemandeRecolteController(DemandeRecolteService demandeRecolteService) {
        this.demandeRecolteService = demandeRecolteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('AGRICULTEUR')")
    @Operation(summary = "Declarer une recolte", description = "Enregistre une demande NOUVELLE pour un verger de "
            + "l'agriculteur authentifie. Exemple : recolte planifiee le 2026-12-15, motif 'Maturite optimale'.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "201", description = "Demande enregistree au statut NOUVELLE")
    @ApiResponse(responseCode = "400", description = "Données invalides (type, date passee, verger inexistant)")
    @ApiResponse(responseCode = "403", description = "Verger d'un autre agriculteur ou role agriculteur requis")
    public DemandeRecolteResponse creer(@io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Demande de recolte a declarer",
            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = DemandeRecolteRequest.class),
                    examples = @ExampleObject(value = "{\"type\":\"PLANIFIEE\",\"dateSouhaitee\":\"2026-12-15\","
                            + "\"motif\":\"Maturite optimale apres fortes chaleurs\","
                            + "\"vergerId\":\"674a1f2e8c4b5d6e7f8a9b0c\"}"))) @Valid @RequestBody DemandeRecolteRequest request) {
        return demandeRecolteService.creer(request);
    }

    @GetMapping
    @Operation(summary = "Lister les demandes", description = "L'agriculteur voit ses demandes ; le responsable de "
            + "collecte et l'administrateur voient toutes les demandes.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Liste des demandes")
    public List<DemandeRecolteResponse> lister() {
        return demandeRecolteService.lister();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter une demande", description = "Reserve a l'agriculteur concerne, au responsable de "
            + "collecte et a l'administrateur.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Demande trouvee")
    @ApiResponse(responseCode = "403", description = "Demande d'un autre agriculteur")
    @ApiResponse(responseCode = "404", description = "Demande introuvable")
    public DemandeRecolteResponse consulter(@Parameter(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                            @PathVariable("id") String id) {
        return demandeRecolteService.consulter(objectId(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une demande", description = "Modification par l'agriculteur avant demarrage : type, "
            + "date souhaitee et motif. Apres demarrage l'API refuse (409).")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Demande modifiee")
    @ApiResponse(responseCode = "403", description = "Demande d'un autre agriculteur")
    @ApiResponse(responseCode = "409", description = "Modification impossible : collecte en cours ou terminee")
    public DemandeRecolteResponse modifier(@Parameter(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                           @PathVariable("id") String id,
                                           @io.swagger.v3.oas.annotations.parameters.RequestBody(
                                                   description = "Nouvelles valeurs (type, date souhaitée, motif)",
                                                   content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                                                           schema = @Schema(implementation = DemandeRecolteRequest.class),
                                                           examples = @ExampleObject(value = "{\"type\":\"URGENTE\",\"dateSouhaitee\":\"2026-12-10\","
                                                                   + "\"motif\":\"Avance de la maturite\","
                                                                   + "\"vergerId\":\"674a1f2e8c4b5d6e7f8a9b0c\"}"))) @Valid @RequestBody DemandeRecolteRequest request) {
        return demandeRecolteService.modifier(objectId(id), request);
    }

    @PutMapping("/{id}/annuler")
    @Operation(summary = "Annuler une demande", description = "Annulation par l'agriculteur avant demarrage (statut "
            + "ANNULEE). Le responsable de collecte peut aussi annuler. Apres demarrage l'API refuse (409).")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Demande annulee")
    @ApiResponse(responseCode = "403", description = "Demande d'un autre agriculteur")
    @ApiResponse(responseCode = "409", description = "Annulation impossible : collecte en cours ou terminee")
    public DemandeRecolteResponse annuler(@Parameter(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                          @PathVariable("id") String id) {
        return demandeRecolteService.annuler(objectId(id));
    }

    @PutMapping("/{id}/planifier")
    @PreAuthorize("hasAnyRole('RESPONSABLE_COLLECTE', 'ADMIN')")
    @Operation(summary = "Planifier une demande", description = "Transition NOUVELLE -> PLANIFIEE par le responsable "
            + "de collecte apres examen de la demande (F1.3).")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Demande planifiee")
    @ApiResponse(responseCode = "409", description = "Transition refusee selon le statut courant")
    public DemandeRecolteResponse planifier(@Parameter(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                             @PathVariable("id") String id) {
        return demandeRecolteService.planifier(objectId(id));
    }

    @PutMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyRole('RESPONSABLE_COLLECTE', 'CHEF_EQUIPE', 'ADMIN')")
    @Operation(summary = "Demarrer la collecte", description = "Transition PLANIFIEE -> EN_COURS. Apres ce "
            + "demarrage, modification et annulation sont refusees par l'API.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Collecte en cours")
    @ApiResponse(responseCode = "409", description = "Transition refusee selon le statut courant")
    public DemandeRecolteResponse demarrer(@Parameter(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                           @PathVariable("id") String id) {
        return demandeRecolteService.demarrer(objectId(id));
    }

    @PutMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('RESPONSABLE_COLLECTE', 'CHEF_EQUIPE', 'ADMIN')")
    @Operation(summary = "Terminer la collecte", description = "Transition EN_COURS -> TERMINEE.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "200", description = "Collecte terminee")
    @ApiResponse(responseCode = "409", description = "Transition refusee selon le statut courant")
    public DemandeRecolteResponse terminer(@Parameter(description = "Identifiant de la demande (ObjectId)", example = "674a1f2e8c4b5d6e7f8a9b10")
                                           @PathVariable("id") String id) {
        return demandeRecolteService.terminer(objectId(id));
    }

    private ObjectId objectId(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identifiant invalide");
        }
        return new ObjectId(id);
    }
}