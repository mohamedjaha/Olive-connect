# OliveConnect — Transformation UML V3 vers MongoDB

**Milestone 1 — tâche 3 | Base `oliveconnect` | État : schéma local audité, à relire en équipe**

## 1. Objectif et sources

Ce document décrit la transformation du modèle métier en onze collections MongoDB, les choix d’imbrication et de références, les types BSON et les contraintes de persistance. Il sert de contrat de travail pour les futures entités Spring Data MongoDB.

Sources : `milestones.md` (M1, M2–M9), `projetolive.md` (§6–8), `architecture.md` (§7), `class-diagram-v3.puml`, `uml-v3-notes.md`, résultats mongosh de l’audit et de la migration locale. Le retrait de `googleSub` a été demandé après la rédaction des fichiers UML V3 : le modèle retenu ici n’en comporte pas. L’authentification Google OIDC reste prévue en M2 ; la stratégie d’identification du compte n’est pas fixée ici.

## 2. Règles générales de transformation

| Concept UML | Représentation MongoDB | Justification |
|---|---|---|
| Classe métier principale | Collection de documents | Entité identifiable et consultable indépendamment. |
| `id : String` | `_id : ObjectId` | Identifiant natif MongoDB ; conversion en chaîne dans l’API si nécessaire. |
| Association vers une entité | Champ `...Id : ObjectId` | Évite la duplication de l’entité référencée ; lecture séparée ou agrégation `$lookup` selon le besoin. |
| Association plusieurs-à-plusieurs Utilisateur–Pressoir | Tableau `responsablesIds` d’ObjectId dans `pressoirs` | Permet plusieurs responsables par pressoir et plusieurs pressoirs par responsable sans collection supplémentaire. |
| Composition / objet secondaire | Objet ou tableau de sous-documents imbriqués | Cycle de vie lié au document parent ; lecture et modification du parent possibles en une opération. |
| `String`, `Boolean` | BSON string, bool | Correspondance directe. |
| `Integer` | BSON int (Int32) | Utilisé pour `ordre` d’une étape. |
| `Double` | BSON double, int ou long admis par les validateurs | Les entiers et décimaux sont acceptés pour les mesures numériques ; conversion vers les types Java prévue au mapping. |
| `Instant` | BSON date | Instant enregistré en UTC, précision à la milliseconde. |
| `LocalDate` | BSON date | Convention retenue : minuit UTC pour la date civile, conversion explicite à la lecture/écriture Java pour éviter un décalage de jour. |
| Énumération | Chaîne appartenant aux valeurs autorisées | Lisibilité et validation par `enum`. |
| Multiplicité `[0..1]` | Champ facultatif, absent s’il n’est pas renseigné | Pas de valeur inventée ; les validateurs actuels n’acceptent pas nécessairement `null`. |
| Multiplicité `[0..*]` | Tableau, éventuellement vide | Pour les collections imbriquées, le tableau lui-même est requis dans le schéma actuel. |
| Attribut dérivé `/...` | Calcul dans le backend | Évite la duplication et les incohérences de données calculées. |

Les noms de champs utilisent `camelCase`, les noms de collections sont en minuscules, avec un underscore si nécessaire. Les références sont des ObjectId simples, pas des DBRef. L’API peut exposer des identifiants sous forme de chaînes ; les entités et repositories doivent préserver leur type BSON en base.

### Localisation

`Localisation` est imbriquée au format GeoJSON Point dans les documents concernés, sans collection distincte. Exemple de valeur :

```json
{"type":"Point","coordinates":[10.76,34.74]}
```

Ordre : longitude puis latitude. Longitude comprise entre -180 et 180, latitude entre -90 et 90. Le tableau contient exactement deux coordonnées. Les unités des données métier sont explicites : hectares (`superficieHa`), kilogrammes (`...Kg`), pourcentages de maturité et d’avancement (0–100).

## 3. Correspondance entre les classes et les collections

Dans les tableaux ci-dessous, `_id` est l’identifiant de chaque document. Les champs facultatifs sont absents par défaut lorsqu’ils ne sont pas renseignés. Les métadonnées supplémentaires déjà présentes sont décrites séparément au §6.

| Classe UML | Collection | Champs métier stockés (hors `_id`) et références |
|---|---|---|
| Utilisateur | `users` | `nom`, `prenom`, `email`, `telephone` (facultatif), `role`, `actif`. |
| Verger | `vergers` | `nom`, `superficieHa`, `variete`, `localisation`, `maturite` (facultatif), `statut`, `proprietaireId`. |
| DemandeRecolte | `demandes` | `type`, `dateSouhaitee`, `dateCreation`, `statut`, `motif` (facultatif), `agriculteurId`, `vergerId`. |
| Alerte | `alertes` | `type`, `description`, `dateCreation`, `localisation`, `statut`, `historique[]`, `auteurId`, `vergerId`. |
| Tournee | `tournees` | `dateDebut`, `dateFin`, `statut`, `chefEquipeId`, `etapes[]`. L’avancement global est dérivé. |
| Ressource | `ressources` | `nom`, `categorie`, `etat`, `indisponibilites[]`. |
| Affectation | `affectations` | `debut`, `fin`, `statut`, `tourneeId`, `ressourceId`. |
| Pressoir | `pressoirs` | `nom`, `localisation`, `capaciteTotaleKg`, `responsablesIds[]`. La capacité disponible est dérivée. |
| Reception | `receptions` | `statut`, `pressoirId` ; `poidsPrevuKg`, `poidsKg`, `qualite`, `dateReception`, `origine`, `tourneeId`, `responsableId` facultatifs selon le statut et les règles métier. |
| Notification | `notifications` | `type`, `message`, `dateCreation`, `lu`, `objetId`, `destinataireId`. |
| MesureExterne | `mesures_externes` | `source`, `type`, `valeur`, `unite`, `dateMesure` ; `localisation`, `vergerId`, `pressoirId` conditionnels selon le type. |

### Objets secondaires : imbrication (embedding)

| Objet | Emplacement | Champs et contraintes |
|---|---|---|
| `EtapeCollecte` | `tournees.etapes[]` | `vergerId`, `ordre` (int ≥ 1), `avancement` (0–100), `quantiteRecolteeKg` (≥ 0) ; `demandeId`, `dateDebutReelle`, `dateFinReelle` facultatifs. Au moins une étape par tournée. |
| `TraitementAlerte` | `alertes.historique[]` | `auteurId`, `date`, `ancienStatut`, `nouveauStatut` ; `commentaire` facultatif. Historique éventuellement vide. |
| `Creneau` | `ressources.indisponibilites[]` | `debut`, `fin` ; début strictement antérieur à fin. Tableau éventuellement vide. |
| `Localisation` | `vergers`, `alertes`, `pressoirs`, `mesures_externes` | GeoJSON Point ; obligatoire dans les trois premières collections, conditionnelle dans la dernière. |

Une étape appartient à une seule tournée, un créneau d’indisponibilité à une ressource et un traitement à une alerte. Ces objets n’ont pas de collection propre ni d’identifiant indépendant dans le schéma actuel. L’historique est conservé avec son alerte ; si sa croissance devient importante, le modèle pourra être réévalué, sans créer de nouvelle collection maintenant.

## 4. Transformation des 18 associations UML

Les associations `1` sont représentées par une référence requise ; les associations `0..1` par une référence facultative, éventuellement requise par une règle métier. Le côté `0..*` est obtenu en recherchant les documents référents, sauf composition et tableau explicitement imbriqué.

| # | Association et cardinalités UML | Transformation MongoDB |
|---:|---|---|
| 1 | Utilisateur `1` — `0..*` Verger | `vergers.proprietaireId → users._id` |
| 2 | Utilisateur `1` — `0..*` DemandeRecolte | `demandes.agriculteurId → users._id` |
| 3 | Utilisateur `1` — `0..*` Alerte | `alertes.auteurId → users._id` |
| 4 | Utilisateur `1` — `0..*` Notification | `notifications.destinataireId → users._id` |
| 5 | Utilisateur `1` — `0..*` Tournee | `tournees.chefEquipeId → users._id` |
| 6 | Verger `1` — `0..*` DemandeRecolte | `demandes.vergerId → vergers._id` |
| 7 | Verger `1` — `0..*` Alerte | `alertes.vergerId → vergers._id` |
| 8 | Tournee `1` — composition — `1..*` EtapeCollecte | `tournees.etapes[]`, au moins un objet |
| 9 | Verger `1` — `0..*` EtapeCollecte | `tournees.etapes[].vergerId → vergers._id` |
| 10 | DemandeRecolte `0..1` — `0..*` EtapeCollecte | `tournees.etapes[].demandeId → demandes._id` (facultatif) |
| 11 | Tournee `1` — `0..*` Affectation | `affectations.tourneeId → tournees._id` |
| 12 | Ressource `1` — `0..*` Affectation | `affectations.ressourceId → ressources._id` |
| 13 | Tournee `0..1` — `0..*` Reception | `receptions.tourneeId → tournees._id` (facultatif) |
| 14 | Pressoir `1` — `0..*` Reception | `receptions.pressoirId → pressoirs._id` |
| 15 | Utilisateur `0..*` — `0..*` Pressoir | `pressoirs.responsablesIds[] → users._id` ; tableau sans doublons |
| 16 | Utilisateur `0..1` — `0..*` Reception | `receptions.responsableId → users._id` (requis si confirmée) |
| 17 | Verger `0..1` — `0..*` MesureExterne | `mesures_externes.vergerId → vergers._id` (requis pour maturité) |
| 18 | Pressoir `0..1` — `0..*` MesureExterne | `mesures_externes.pressoirId → pressoirs._id` (requis pour capacité) |

Deux liens complémentaires, déjà présents dans le schéma : `alertes.historique[].auteurId → users._id` et `notifications.objetId`, dont la collection cible dépend du type de notification.

Les affectations sont référencées et non imbriquées : elles sont consultées par tournée, par ressource et par créneau, notamment pour la détection des conflits. Les réceptions, demandes, alertes, notifications et mesures sont également autonomes car elles possèdent leur propre cycle de vie ou leurs propres requêtes. Aucune liste inverse de références n’est dupliquée dans `users`, `vergers`, `tournees` ou `ressources`.

## 5. Énumérations actuellement utilisées

| Type | Valeurs stockées | Statut de conception |
|---|---|---|
| Role | VISITEUR, AGRICULTEUR, RESPONSABLE_COLLECTE, CHEF_EQUIPE, RESPONSABLE_LOGISTIQUE, RESPONSABLE_PRESSOIR, ADMIN | M2 |
| TypeDemande | PLANIFIEE, URGENTE | F1.2 / M3 |
| StatutDemande | NOUVELLE, PLANIFIEE, EN_COURS, TERMINEE, ANNULEE | M3 |
| TypeAlerte | MATURITE, PROBLEME | F2.1 / M4 |
| StatutAlerte | NOUVELLE, EN_COURS, TRAITEE | M4 |
| CategorieRessource | OUVRIER, TRACTEUR, BENNE, MATERIEL | M6 |
| StatutVerger | DISPONIBLE, COLLECTE_PLANIFIEE, EN_COLLECTE, RECOLTE | Choix de conception existant |
| StatutTournee | PLANIFIEE, EN_COURS, TERMINEE, ANNULEE | Choix de conception existant |
| EtatRessource | OPERATIONNELLE, EN_MAINTENANCE, HORS_SERVICE | Choix de conception existant |
| StatutAffectation | RESERVEE, EN_COURS, TERMINEE, ANNULEE | Choix de conception existant |
| StatutReception | EN_ATTENTE, CONFIRMEE, ANNULEE | Choix de conception existant |
| QualiteOlive | BONNE, MOYENNE, MAUVAISE | Choix de conception existant |
| TypeNotification | COLLECTE_PLANIFIEE, ALERTE_CREEE, TOURNEE_AFFECTEE, RECEPTION_CONFIRMEE | Correspond aux événements M5 |
| TypeMesure | TEMPERATURE, HUMIDITE, PRECIPITATION, MATURITE, CAPACITE_PRESSOIR | Choix de conception existant pour les sources dynamiques |

Les valeurs proposées dans les notes UML ne doivent pas être présentées comme imposées par l’énoncé. Les validateurs MongoDB vérifient les valeurs, mais pas les transitions d’état entre documents ou entre deux versions d’un document.

### Cible de `Notification.objetId`

| Type | Collection cible |
|---|---|
| COLLECTE_PLANIFIEE | `demandes` |
| ALERTE_CREEE | `alertes` |
| TOURNEE_AFFECTEE | `tournees` |
| RECEPTION_CONFIRMEE | `receptions` |

La valeur initiale `lu = false` est une convention UML à appliquer à la création de la notification dans le backend ; le validateur exige un booléen, mais n’attribue pas de valeur par défaut.

## 6. Écarts conservés après l’audit et la migration

La migration a préservé les données existantes. Les champs suivants sont facultatifs et ne sont pas des attributs métier requis par l’UML V3 :

| Collections | Champ | Traitement |
|---|---|---|
| `users`, `tournees`, `affectations`, `receptions` | `dateCreation` | Métadonnée technique facultative. |
| `tournees`, `receptions` | `commentaire` | Ancien champ facultatif, non exigé pour les futures entités. |
| `pressoirs` | `statut` | Ancien champ facultatif (`OPERATIONNEL`, `EN_MAINTENANCE`, `FERME` si présent). Ne pas en déduire une nouvelle fonctionnalité obligatoire. |
| `notifications` | `dateLecture` | Facultatif ; s’il est présent, `lu` doit être vrai. |
| `mesures_externes` | `dateImport` | Facultatif ; s’il est présent, `dateMesure ≤ dateImport`. |

`dateCreation` reste obligatoire lorsqu’elle fait partie du modèle UML (`demandes`, `alertes`, `notifications`). Le champ `googleSub` n’est pas ajouté ; `prenom` est obligatoire, `superficieHa` remplace `superficie`, `maturite` est facultative. Les champs supplémentaires ne sont pas interdits par un `additionalProperties: false` global : le schéma actuel n’est donc pas une liste fermée de propriétés. Éviter toute suppression ou réécriture involontaire de champs existants par le mapping Java.

## 7. Contraintes de validation et règles métier

Les validateurs utilisent `$jsonSchema` pour les champs requis, types, bornes et énumérations ; des expressions et conditions complètent le schéma. Après migration, les validateurs modifiés sont configurés en mode `strict` / `error`.

| Domaine | Validation MongoDB actuelle | Contrôles backend à prévoir |
|---|---|---|
| Utilisateurs | Types, rôles, format de l’email, prénom obligatoire | Identité OIDC, unicité de l’email si retenue, droits et désactivation. Aucun index unique d’email n’a encore été créé. |
| Vergers / demandes / alertes | Superficie ≥ 0, coordonnées, maturité facultative 0–100, types, statuts | Propriété et autorisation, cohérence verger/agriculteur, transitions, historique, notifications. |
| Tournées | `dateDebut < dateFin`, au moins une étape, ordre ≥ 1, quantités ≥ 0, avancement 0–100 | Chef d’équipe autorisé, demande et verger cohérents, ordre des étapes, dates réelles, transitions. |
| Ressources / affectations | `debut < fin` pour les créneaux et affectations | Disponibilité, état, absence de chevauchements, concurrence, cohérence avec tournée. |
| Pressoirs / réceptions | Capacité totale ≥ 0 ; poids présents strictement positifs ; tournée ou origine requise ; poids prévu requis si EN_ATTENTE ; poids réel, qualité, date et responsable requis si CONFIRMEE | Responsable habilité pour ce pressoir, capacité disponible, déroulement de la tournée, transitions. |
| Notifications | Destinataire et objet de type ObjectId, `lu` booléen, condition de `dateLecture` | Valeur initiale false, existence et type de l’objet, accès du destinataire. |
| Mesures externes | Unités, plages, références conditionnelles, date d’import facultative, pas de double rattachement | Import, validation des fichiers, références existantes, journalisation, fraîcheur et interprétation des mesures. |

### Mesures externes : règles appliquées par la migration

| Type | Unité | Valeur | Rattachement |
|---|---|---|---|
| TEMPERATURE | °C | Numérique (négative autorisée par le validateur) | Localisation requise ; verger facultatif ; pas de pressoir |
| HUMIDITE | % | 0–100 | Localisation requise ; verger facultatif ; pas de pressoir |
| PRECIPITATION | mm | ≥ 0 | Localisation requise ; verger facultatif ; pas de pressoir |
| MATURITE | % | 0–100 | Verger requis ; localisation facultative ; pas de pressoir |
| CAPACITE_PRESSOIR | kg | ≥ 0 | Pressoir requis ; localisation facultative ; pas de verger |

M9 mentionne le rejet des valeurs négatives à l’import. L’exception pour les températures négatives est un choix de conception physiquement cohérent à formaliser en équipe. L’interdiction de `dateMesure > dateImport` si la date d’import existe suppose des observations et non des prévisions ; la prise en charge de prévisions n’est pas définie.

### Attributs dérivés

- `Tournee./avancement` : calcul à partir des avancements de ses étapes. La moyenne arithmétique des étapes est une proposition des notes UML, pas une formule imposée. Aucune valeur globale n’est stockée.
- `Pressoir./capaciteDisponibleKg` : M7 prévoit `capaciteTotaleKg − somme des poidsPrevuKg des réceptions EN_ATTENTE`. Calcul à réaliser dans `PressoirService`. L’articulation avec les réceptions confirmées et la capacité disponible importée reste à définir ; une mesure externe ne doit pas écraser automatiquement la capacité totale.
- Disponibilité d’une ressource : calcul d’après son état, ses indisponibilités et ses affectations actives. Pour deux créneaux, chevauchement si `debutA < finB && debutB < finA` (bornes contiguës non chevauchantes). L’index facilite la recherche mais n’empêche pas les conflits ; M6 prévoit un contrôle concurrent à implémenter.

## 8. Index créés et testés (M1.4)

| Collection | Nom | Clé | Usage |
|---|---|---|---|
| `vergers` | `idx_vergers_localisation` | `{localisation: "2dsphere"}` | Recherche géographique (`$near`) et carte. |
| `affectations` | `idx_affectations_ressource_creneau` | `{ressourceId: 1, debut: 1, fin: 1}` | Recherche par ressource et chevauchement de créneaux. |
| `alertes` | `idx_alertes_description` | `{description: "text"}` | Recherche textuelle (`$text`), langue française choisie. |

Chaque collection possède également son index automatique `_id_`. Total constaté : 14 index (11 automatiques, 3 personnalisés). L’index `2dsphere` d’`alertes` est prévu en M4 ; les autres index seront examinés selon les requêtes et jalons concernés.

## 9. Intégrité référentielle et état des tests locaux

MongoDB ne garantit pas automatiquement l’existence des documents référencés par les ObjectId. Un contrôle applicatif est nécessaire lors des créations, modifications et suppressions des documents liés. Les rôles, les autorisations, les transitions et la cohérence entre références doivent être vérifiés côté service ; la validation de structure ne les remplace pas.

Résultats rapportés après migration :

| Indicateur | Résultat |
|---|---:|
| Collections existantes | 11 |
| Documents de test | 21 |
| Documents invalides au regard des validateurs | 0 |
| Références vérifiées dans les données de test | 19 |
| Références invalides signalées | 0 |
| Index personnalisés créés et testés | 3 |
| Index au total | 14 |

La vérification des 19 références porte sur les instances présentes, pas sur le nombre d’associations du diagramme (18). Certains liens facultatifs ou tableaux vides ne possèdent pas encore d’instance de test. Les requêtes géographique, de chevauchement et textuelle ont renvoyé les documents attendus. Le test de concurrence et les tests négatifs de tous les validateurs n’ont pas encore été réalisés.

Limite connue du jeu de test : une réception est confirmée le 15 décembre 2026 et une notification de confirmation existe, alors que la tournée associée est encore PLANIFIEE et sa quantité récoltée vaut 0. Le scénario est fictif et valide structurellement, mais ne constitue pas un parcours métier nominal complet. La maturité externe (85 %) et la valeur du verger (80 %) ne sont pas encore synchronisées par un service. Les données externes de test existent en base ; cela ne prouve pas que `dynamic.json` a été importé automatiquement.

Une sauvegarde Extended JSON des documents, validateurs et index a été enregistrée avant migration sur la machine de développement (`oliveconnect-backup-m1.json`). Ce fichier local n’a pas fait l’objet d’un test de restauration et ne remplace pas la procédure de sauvegarde de M10.

## 10. Consignes pour le passage à Spring Data MongoDB

Les futures classes principales seront associées aux onze collections par `@Document` avec les noms existants. Le mapping de `_id`, des références ObjectId, des dates civiles UTC, de GeoJSON, des types numériques et des champs facultatifs doit être vérifié lors de l’implémentation. `EtapeCollecte`, `Creneau`, `TraitementAlerte` et `Localisation` seront représentés par des objets imbriqués, sans collection supplémentaire. Les enums doivent reprendre les chaînes acceptées en base. Les attributs dérivés ne doivent pas être persistés comme de nouvelles données indépendantes.

Aucune nouvelle collection, fonctionnalité ou contrainte métier supplémentaire n’est introduite par ce document. Les choix non imposés et les incohérences de test sont signalés pour relecture avant fusion. M1.5 (`reference.json` et `dynamic.json`) reste à réaliser ; la conception d’API, le mapping Java et les tests métier sont à coordonner avec le backend.
