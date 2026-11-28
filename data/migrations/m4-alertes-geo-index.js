// OliveConnect - Migration M4
// Index geospatial des alertes

if (!db.getCollectionNames().includes("alertes")) {
    throw new Error("Collection alertes inexistante");
}

db.alertes.createIndex(
    { localisation: "2dsphere" },
    { name: "idx_alertes_localisation" }
);

print("Migration M4 terminee");