package com.oliveconnect.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oliveconnect.dto.DemandeRecolteRequest;
import com.oliveconnect.dto.DemandeRecolteResponse;
import com.oliveconnect.dto.LocalisationDto;
import com.oliveconnect.dto.VergerRequest;
import com.oliveconnect.dto.VergerResponse;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.core.jackson.ModelResolver;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.SpecVersion;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration OpenAPI.
 * <p>
 * Les schemas des objets d'echange F1 (vergers et collectes) sont publies des le M1
 * pour que le frontend puisse coder contre le contrat d'API. Les endpoints F1
 * arrivent au M3 et referenceront ces memes DTO.
 */
@Configuration
public class OpenApiConfig {

    private static final List<Class<?>> F1_DTOS = List.of(
            LocalisationDto.class,
            VergerRequest.class,
            VergerResponse.class,
            DemandeRecolteRequest.class,
            DemandeRecolteResponse.class);

    @Bean
    public OpenAPI oliveConnectOpenAPI() {
        SecurityScheme bearerAuth = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Jeton Google OAuth2/OIDC a transmettre dans l'en-tete Authorization: Bearer <jeton>");

        return new OpenAPI(SpecVersion.V30)
                .info(new Info()
                        .title("OliveConnect API")
                        .version("0.1.0")
                        .description("API de gestion de la collecte des olives - cooperative de Sfax"))
                .servers(List.of(new Server().url("/").description("Serveur local")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", bearerAuth));
    }

    @Bean
    public OpenApiCustomizer f1SchemaCustomizer(ObjectMapper objectMapper) {
        ModelResolver modelResolver = new ModelResolver(objectMapper);
        ModelConverters.getInstance().addConverter(modelResolver);
        return openApi -> {
            var existing = openApi.getComponents();
            var components = existing != null ? existing : new Components();
            if (existing == null) {
                openApi.setComponents(components);
            }
            for (Class<?> dtoClass : F1_DTOS) {
                var schemas = ModelConverters.getInstance().readAll(new AnnotatedType(dtoClass));
                schemas.forEach(components::addSchemas);
            }
        };
    }
}