// M2 : migration non destructive pour une base M1 deja initialisee.
(function () {
    if (db.getName() !== "oliveconnect") {
        throw new Error("Selectionner la base oliveconnect");
    }
    if (!db.getCollectionNames().includes("users")) {
        throw new Error("La collection users doit deja exister");
    }
    print(db.users.createIndex({email: 1}, {unique: true, name: "idx_users_email_unique"}));
})();
