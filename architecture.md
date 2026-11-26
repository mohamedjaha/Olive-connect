25/11/2026 19:31 

Markdown Live Preview 

 

# **Architecture du projet OliveConnect** 

**Document de conception initiale — 25 novembre 2026 Projet :** gestion de la collecte des olives dans une coopérative **Équipe :** trois étudiants 

Ce document présente une proposition cohérente avec le PRD actuel et l’énoncé. Les choix non encore décidés sont signalés comme tels. Ce n’est pas encore le diagramme de classes ni le schéma final de la base. 

## **1. Vision globale** 

OliveConnect est une application web qui relie les agriculteurs, les responsables et les équipes de terrain. Son architecture comporte : 

Une **interface web** utilisée depuis un ordinateur ou un téléphone. 

- Une **API Spring Boot** qui vérifie les droits et applique les règles métier. 

- Une **base NoSQL** qui conserve les données du projet. 

- Des **sources externes simulées** qui fournissent des données de référence et des données dynamiques. 

- Des outils de **supervision** pour visualiser les métriques et les traces. 

https://markdownlivepreview.com 

1/9 



<!-- Start of picture text -->
25/11/2026 19:31 Markdown Live Preview<br><br>Utilisateurs<br>Sources<br>Interface React<br>simulées JSON<br>et Tailwind<br>ou CSV<br>= =<br>Requêtes HTTPS et<br>Imports périodiques validés<br>réponses JSON<br>API Spring Boot Authentification et jetons<br>Base NoSQL Métriques et traces Validation des jetons<br>Supervision Fournisseur<br>d’identité OIDC<br>Exemple :  l’agriculteur saisit son verger → React envoie les données à l’API → Spring Boot vérifie les droits et les champs → la<br>base enregistre le verger → l’API renvoie une réponse à l’interface.<br><!-- End of picture text -->

https://markdownlivepreview.com 

2/9 

25/11/2026 19:31 

Markdown Live Preview 

**2. Technologies** 

 

|**Composant**|**Choix ou situation actuelle**|**Rôle**|
|---|---|---|
|Frontend|**React et Tailwind CSS**|Interfaces, formulaires, carte et adaptation aux<br>téléphones.|
|Backend|**Spring Boot**|API REST et règles métier.|
|Build backend|**Maven**|Gestion des dépendances, compilation et packaging.|
|Persistance|**Spring Data**, adapté au SGBD retenu|Accès à la base depuis les repositories.|
|Base de données|**NoSQL, choix à faire**|MongoDB et Cassandra sont des possibilités ; le<br>schéma dépendra du choix.|
|Authentification|**OAuth 2.0 / OpenID Connect**,<br>fournisseur à choisir|Connexion, identité et jetons ; l’API applique les droits<br>par rôle.|
|Notifications|**Événements Spring + persistance en**<br>**base**|Déclencher et conserver les notifications internes.|
|Supervision|**Grafana et Jaeger**|Visualisation des métriques et consultation des traces.|
|Carte|Bibliothèque à choisir|Affichage interactif des vergers.|
|Serveur web /<br>hébergement|Choix et configuration à définir plus<br>tard|L’énoncé impose un déploiement sur un serveur web<br>accessible à distance.|



## **3. Frontend : interface utilisateur** 

Le frontend est une application **React** mise en forme avec **Tailwind CSS** . Il communique avec l’API au moyen de requêtes HTTP et reçoit généralement des réponses JSON. 

L’interface doit rester simple pour un public pouvant être âgé : textes lisibles, bons contrastes, grands boutons, messages clairs et peu d’étapes pour les opérations courantes. Elle doit aussi fonctionner sur téléphone. 

https://markdownlivepreview.com 

3/9 

25/11/2026 19:31 

Markdown Live Preview 

**Pages principales proposées** 

 

|**Espace / page**|**Contenu principal**|
|---|---|
|Accueil public|Présentation et accès à la carte publique.|
|Connexion / inscription|Authentification et demande d’inscription.|
|Mes vergers|Liste, ajout et consultation des vergers de l’agriculteur.|
|Récoltes|Déclaration d’une demande et suivi de son état.|
|Alertes|Création et traitement des signalements.|
|Tournées|Planification, calendrier et suivi terrain.|
|Ressources|Ouvriers, tracteurs, bennes et matériel ; disponibilités et affectations.|
|Pressoirs et réceptions|Capacité, réception, poids et qualité.|
|Carte interactive|Localisation et informations autorisées sur les vergers.|
|Notifications|Messages non lus et historique selon les règles retenues.|
|Administration / espace interne|Comptes, droits et enrichissement des données selon le profil.|



L’interface adapte les menus au rôle ; **l’API vérifie également les droits** , car masquer un bouton ne suffit pas à protéger les données. 

https://markdownlivepreview.com 

4/9 

25/11/2026 19:31 

Markdown Live Preview 

 

## **4. Backend : architecture en couches** 

||Model / Entity<br>et DTO||
|---|---|---|
|Objets mét|Données échangées<br>ier<br>Fronten|d React|
||Controller|Objets persistés|
||Service<br>Repository /<br>DAO Spring Data<br>Base NoSQL||
|**Couche**|**Rôle**|**Exemple**|
|**Controller**|Reçoit les requêtes API, valide les paramètres<br>d’entrée et renvoie les réponses.<br>`VergerC`<br>création|`ontroller`reçoit une demande de<br>de verger.|
|**Service**|Contient les règles métier et coordonne les<br>opérations.<br>`Tournee`<br>une affe|`Service`vérifie les disponibilités avant<br>ctation.|
|**Repository /**<br>**DAO**|Accède à la base par l’API Spring Data choisie.<br>`VergerR`<br>agricult|`epository`recherche les vergers d’un<br>eur.|
|**Model / Entity**|Représente les concepts du domaine et les données<br>persistées.<br>`Verger`|,<br>`Tournee` ,<br>`Alerte` .|
|**DTO**|Objet d’échange avec le frontend lorsque nécessaire.<br>`Creatio`<br>accepté|`nVergerRequest`contient les champs<br>s par l’API.|



https://markdownlivepreview.com 

5/9 

25/11/2026 19:31 

Markdown Live Preview 

 

### **Organisation possible du code backend** 

```
backend/
├── pom.xml
└── src/main/java/.../oliveconnect/
    ├── controller/
    ├── service/
    ├── repository/
    ├── model/
    ├── dto/
    ├── security/
    ├── notification/
    ├── integration/
    └── config/
```

Cette structure est indicative : les noms et le découpage final seront définis par l’équipe. 

## **5. Modules fonctionnels** 

Les quatre premières fonctionnalités de l’énoncé sont retenues. La réception au pressoir et les services transversaux sont conservés dans le parcours général. 

|**Module**|**Responsabilités principales**|
|---|---|
|**Vergers et collectes**|Gérer les vergers, déclarer les récoltes planifiées ou urgentes et suivre les demandes.|
|**Alertes terrain**|Signaler la maturité ou un problème, transmettre l’information et suivre son traitement.|
|**Ressources et tournées**|Gérer les équipements et ouvriers, vérifier leurs disponibilités et les affecter.|
|**Carte interactive**|Afficher les vergers, leur maturité, leur variété et leur statut selon les droits.|
|**Pressoirs et réceptions**|Gérer plusieurs pressoirs, leurs capacités disponibles et les réceptions.|
|**Comptes et sécurité**|Gérer les identités et vérifier les droits des acteurs.|
|**Notifications et imports**|Conserver les notifications et charger les deux sources simulées.|



Le tableau de bord des performances, cinquième fonctionnalité de l’énoncé, n’est pas retenu comme module autonome. Les données de rendement disponibles peuvent être affichées sur la carte, avec leur définition et leur période clairement indiquées. 

## **6. Parcours d’une demande de collecte** 

1. L’agriculteur se connecte et déclare une récolte pour son verger. 

2. Le frontend transmet la demande à l’API. 

3. Le backend vérifie l’identité, les droits et la validité des données, puis enregistre la demande. 

4. Le responsable de collecte examine la demande et planifie une tournée en tenant compte de la maturité et des ressources disponibles. 

5. La collecte prévue est communiquée à l’agriculteur via une notification conservée en base. 

6. Le chef d’équipe met à jour l’avancement et les quantités récoltées. 

7. Le responsable du pressoir concerné confirme la réception et saisit le poids et la qualité. 

Avant le démarrage, l’agriculteur peut consulter, modifier ou annuler la collecte selon l’énoncé. Les champs modifiables, la procédure d’annulation et ses effets sur une tournée avec plusieurs vergers sont à préciser. Après démarrage, le PRD propose un refus de ces actions par l’API. 

https://markdownlivepreview.com 

6/9 

25/11/2026 19:31 

Markdown Live Preview 

 

## **7. Base NoSQL et modèle métier initial** 

### **Objets principaux** 

|**Objet**|**Rôle et liens principaux**|
|---|---|
|Utilisateur|Identité, coordonnées utiles et rôle.|
|Verger|Propriétaire, superficie, variété, localisation, maturité et statut.|
|Demande de récolte|Agriculteur, verger, caractère planifié ou urgent, date et statut.|
|Alerte|Auteur, verger, catégorie, description et état de traitement.|
|Tournée|Créneau, vergers, chef d’équipe, ressources et avancement.|
|Ressource et<br>affectation|Ouvrier ou équipement ; lien à une tournée sur un créneau.|
|Pressoir et réception|Un pressoir possède une capacité ; chaque réception est liée au pressoir concerné et contient<br>notamment le poids et la qualité.|
|Notification|Destinataire, message, date et statut lu ou non lu.|
|Mesure externe|Source, date, type et valeur validée.|



Le modèle doit prendre en charge **plusieurs pressoirs** . Le détail de l’association entre tournée, transport et pressoir est à fixer lors de la conception. 

### **Schéma et accès aux données** 

Le choix entre MongoDB, Cassandra ou un autre SGBD NoSQL n’est pas encore arrêté. Il faudra ensuite définir et justifier : 

- Les collections ou tables propres au SGBD choisi. 

- La transformation du diagramme de classes vers le schéma NoSQL. 

- Les liens, l’imbrication ou les références selon les possibilités du SGBD. 

- Les index et, lorsque c’est applicable, les clés de partitionnement. Les requêtes courantes et le choix de l’API Spring Data. 

Le diagramme de classes, le schéma NoSQL et l’API doivent représenter les mêmes données et relations. 

## **8. Authentification et droits** 

Le frontend utilise un fournisseur d’identité **OpenID Connect** fondé sur OAuth 2.0. Il obtient les informations de connexion et transmet un jeton d’accès à l’API. L’API valide ce jeton et contrôle le rôle et l’accès aux données demandées. 

https://markdownlivepreview.com 

7/9 

 

|25/11/2026 19:31|Markdown Live Preview|
|---|---|
|**Acteur**|**Accès attendu**|
|Visiteur|Informations générales et données publiques de la carte.|
|Agriculteur|Ses propres vergers, demandes, alertes et notifications.|
|Responsable de collecte|Demandes, alertes et planification nécessaires à sa mission.|
|Chef d’équipe|Tournées affectées et suivi terrain autorisé.|
|Responsable logistique|Ressources, calendrier et affectations autorisées.|
|Responsable du pressoir|Capacité et réceptions relevant de son périmètre.|
|Administrateur|Comptes, rôles, paramétrage et supervision autorisés.|



Le fournisseur d’identité, les opérations exactes de chaque rôle et les données visibles publiquement restent à définir. 

## **9. Notifications** 

### **Fonctionnement proposé** 

1. Une action métier a lieu, par exemple la planification d’une collecte. 

2. Un service Spring publie un événement interne. 

3. Un écouteur traite cet événement et enregistre une notification dans la base NoSQL. 

4. Le frontend consulte les notifications non lues à la connexion ou au chargement de la page. 

5. L’utilisateur consulte le message et peut le marquer comme lu. 

La notification reste disponible même si le destinataire était déconnecté au moment de sa création. Les événements Spring en mémoire ne garantissent pas à eux seuls la livraison en cas de panne : la gestion des erreurs et de la persistance devra être définie selon la base choisie. 

**Suivi en temps réel :** l’énoncé le demande pour les alertes. La seule consultation à la connexion ne suffit pas lorsque l’utilisateur est déjà sur la page. Une actualisation périodique ou une solution push reste à choisir ; son délai devra être adapté aux alertes et vérifié. 

## **10. Sources de données et espace interne** 

Deux sources sont **simulées** : 

- **Source de référence :** vergers, parcelles, variétés d’olives, ressources et pressoirs. 

- **Source dynamique :** météo, maturité et capacité disponible des pressoirs. 

Elles peuvent être des fichiers JSON/CSV ou des services simulés. Le backend les lit automatiquement à une fréquence à définir, contrôle les valeurs et signale les données invalides avant leur enregistrement. 

L’ **espace intranet** est une partie interne et protégée de l’application. Les personnes autorisées y complètent manuellement les informations relatives aux vergers, aux équipements et aux tournées. 

## **11. Déploiement, sauvegardes et supervision** 

L’énoncé demande un déploiement sur serveur web permettant un accès à distance. Le serveur précis et sa configuration seront décidés plus tard. L’API, la base et le fournisseur d’identité doivent être configurés pour communiquer dans cet environnement. 

**Sauvegardes :** sauvegarder régulièrement la base et tester la restauration. 

https://markdownlivepreview.com 

8/9 

25/11/2026 19:31 

Markdown Live Preview 

 

- **Grafana :** visualiser les métriques collectées (par exemple disponibilité et consommation de ressources). Une source de métriques et la collecte correspondante sont nécessaires. 

- **Jaeger :** consulter les traces des requêtes ; une instrumentation et une collecte des traces sont nécessaires. 

- **Documentation :** décrire le déploiement, la configuration du serveur, les utilisateurs, les droits, les sauvegardes et la supervision. L’énoncé mentionne aussi le suivi des logs et du cache. 

## **12. Points à clarifier avant la conception détaillée** 

Choix du SGBD NoSQL et conception du schéma. 

- Fournisseur d’identité, matrice détaillée des droits et données publiques de la carte. 

- Statuts des demandes et tournées, règles précises de modification et d’annulation. 

- Mécanisme d’actualisation des alertes et délai acceptable. 

- Périmètre de l’outil d’approvisionnement demandé dans l’énoncé. 

- Définition du rendement affiché sur la carte et données nécessaires. 

- Choix du serveur d’hébergement et modalités de collecte des métriques et traces. 

**Sources :** énoncé OliveConnect fourni et PRD OliveConnect, version 1.1. 

https://markdownlivepreview.com 

9/9 

