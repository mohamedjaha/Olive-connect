package com.oliveconnect.config;

import com.mongodb.ConnectionString;
import org.springframework.beans.factory.annotation.Value;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "com.oliveconnect.repository")
public class MongoConfig {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Bean
    public MongoClient mongoClient() {
        return MongoClients.create(mongoUri);
    }

    @Bean
    public MongoTemplate mongoTemplate(
            MongoClient mongoClient,
            @Value("${spring.data.mongodb.uri}") String mongoUri) {

        String database = new ConnectionString(mongoUri).getDatabase();

        if (database == null || database.isBlank()) {
            throw new IllegalArgumentException(
                    "Nom de la base MongoDB obligatoire");
        }

        return new MongoTemplate(mongoClient, database);
}
}