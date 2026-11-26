25/11/2026 19:17 

Markdown Live Preview 

 

# **PRD - OliveConnect** 

#### **Document de définition du produit** 

**Version :** 1.1 - proposition de travail **Projet :** plateforme de gestion intelligente de la collecte des olives **Équipe :** 3 étudiants - 2ème année ingénieur informatique **Modules :** Bases de données massives, Technologie de développement J2EE, Administration des serveurs Web **Source :** énoncé du projet OliveConnect, année universitaire 2026-2027. 

Ce document distingue les exigences de l’énoncé et les propositions à valider en équipe. Il sert de référence à la conception, au développement, aux tests et à la démonstration. 

## **1. Vision et problème** 

Une coopérative oléicole de la région de Sfax doit coordonner les agriculteurs, les équipes de récolte, les ressources et les pressoirs. Les informations dispersées compliquent la planification, le traitement des alertes et le suivi des collectes. 

**Vision :** une plateforme web commune permettant de déclarer, planifier et suivre les collectes, en tenant compte de la maturité des olives et des ressources disponibles. 

### **Objectifs** 

- Centraliser les données des vergers et des récoltes. 

- Réagir rapidement aux alertes terrain. 

- Éviter les affectations concurrentes d’une même ressource. 

- Suivre les tournées, les quantités récoltées et la réception au pressoir. 

- Offrir un accès adapté à chaque rôle et utilisable sur téléphone. 

## **2. Périmètre et choix fonctionnels** 

Le groupe choisit **les quatre premières fonctionnalités de l’énoncé** : 

1. Plateforme de gestion des collectes et des vergers. 

2. Module de gestion des alertes terrain. 

3. Système de gestion des ressources. 

4. Carte interactive des vergers et de leurs rendements. 

**Hors du périmètre choisi :** le tableau de bord des performances, cinquième fonctionnalité. Il n’est pas prévu comme module autonome. Les informations nécessaires au suivi opérationnel, les quantités et les données de rendement disponibles restent enregistrées ; la carte doit pouvoir présenter les rendements disponibles. Une valeur absente est indiquée comme « non renseignée », jamais inventée. 

La réception au pressoir, la sécurité, les imports, l’intranet, le déploiement, les sauvegardes et la supervision restent dans le périmètre : ils sont demandés par l’énoncé même si le tableau de bord n’est pas retenu. 

https://markdownlivepreview.com 

1/7 

25/11/2026 19:17 

Markdown Live Preview 

 

## **3. Acteurs et droits prévus** 

|**Acteur**|**Responsabilités et accès prévus**|
|---|---|
|Visiteur|Informations générales, carte publique avec données non sensibles, demande d’inscription.|
|Agriculteur|Gestion de ses vergers, déclaration de récoltes, alertes, consultation des notifications et suivi de<br>ses collectes.|
|Responsable de collecte|Examen des demandes, traitement des alertes et planification des tournées.|
|Chef d’équipe|Consultation des tournées affectées, suivi terrain, avancement et quantités.|
|Responsable logistique|Gestion des ouvriers et équipements, disponibilités et calendrier des ressources.|
|Responsable du pressoir|Capacité disponible, confirmation de réception, poids et qualité.|
|Administrateur|Comptes, rôles, paramètres, imports et supervision.|
|Systèmes externes<br>simulés|Fourniture de référentiels et de données dynamiques JSON/CSV ou services simulés.|



**Règle de sécurité :** chaque agriculteur ne voit que ses données privées ; les responsables n’accèdent qu’aux données nécessaires à leur rôle. Les contrôles sont appliqués par l’API. Le contenu exact de la carte publique doit être validé avant développement. 

## **4. Parcours principal** 

1. L’agriculteur ajoute son verger, puis déclare une récolte planifiée ou urgente, ou signale la maturité. 

2. Le responsable de collecte consulte la demande et les alertes. 

3. Il planifie une tournée en tenant compte de la maturité, de la disponibilité des ouvriers, tracteurs et bennes et de la capacité du pressoir. 

4. L’agriculteur est notifié et peut consulter, modifier ou annuler la collecte avant son démarrage, selon les règles de validation cidessous. 

5. Le chef d’équipe démarre la tournée et met à jour l’avancement et les quantités. 

6. Le responsable du pressoir confirme la réception, enregistre le poids et la qualité et met à jour la capacité disponible. 

## **5. Exigences fonctionnelles et critères d’acceptation** 

Les identifiants facilitent le suivi. Les modalités marquées « proposition » sont à valider avec le groupe et, si nécessaire, l’enseignant. 

https://markdownlivepreview.com 

2/7 

25/11/2026 19:17 

Markdown Live Preview 

 

### **F1 - Gestion des vergers et collectes** 

|**ID**|**Exigence**|**Critère d’acceptation**|
|---|---|---|
|F1.1|L’agriculteur crée et consulte ses vergers : nom,<br>localisation, superficie, variété et informations<br>pertinentes.|Un verger valide est enregistré et visible par son propriétaire<br>; les données privées d’autrui sont refusées.|
|F1.2|L’agriculteur déclare une récolte planifiée ou<br>urgente avec verger, date souhaitée et motif<br>éventuel.|La demande est enregistrée et visible par le responsable de<br>collecte.|
|F1.3|Le responsable examine la demande et organise<br>une tournée.|La tournée contient au minimum une date, un ou plusieurs<br>vergers, un chef d’équipe et les ressources affectées.|
|F1.4|Le système informe l’agriculteur et lui permet de<br>consulter, modifier ou annuler avant le démarrage.|Une notification est visible. Avant le démarrage, la<br>modification ou l’annulation est possible ; après le<br>démarrage, l’API la refuse.|
|F1.5|Le chef d’équipe suit le statut et les quantités<br>récoltées.|Une mise à jour valide est enregistrée et consultable par les<br>profils autorisés.|
|F1.6|Le pressoir gère sa capacité et la réception.|Le responsable peut enregistrer une capacité, confirmer une<br>réception et saisir poids et qualité.|
|**Règle**<br>démarr<br>suppre<br>**Propos**<br>respon<br>collect<br>champ<br>**- Ale**<br>**ID**|**à clarifier :**l’énoncé autorise la consultation, la modifica<br>age est une règle cohérente avec cette limite. Une ann<br>ssion de l’historique.<br>**ition à valider :**l’agriculteur peut modifier la date souh<br>sable est informé et vérifie l’effet sur la planification. Si<br>e ne doit pas supprimer toute la tournée ni libérer auto<br>s modifiables et la procédure exacte restent à confirme<br>**rtes terrain**<br>**Exigence**|tion et l’annulation**avant le démarrage**; le refus après<br>ulation signifie un changement de statut, pas nécessairement une<br>aitée ou le motif de sa demande, ou demander son annulation. L<br>une tournée concerne plusieurs vergers, l’annulation d’une<br>matiquement les ressources nécessaires aux autres vergers. Les<br>r.<br>**Critère d’acceptation**|
|F2.1|L’agriculteur signale la maturité ou un<br>problème avec verger, type, description et<br>localisation.|L’alerte est enregistrée et apparaît dans la liste du responsable.|
|F2.2|La géolocalisation automatique est proposée.|Si l’utilisateur refuse ou si elle échoue, il peut renseigner une<br>position manuellement.|
|F2.3|Le responsable consulte et traite les alertes.|Le statut et l’historique de traitement sont accessibles aux profils<br>autorisés.|
|F2.4|Les notifications sont conservées et présentées<br>aux destinataires autorisés.|Une notification non lue est retrouvée à la connexion ou au<br>chargement de la page, même si l’utilisateur était absent lors de<br>sa création.|



**Règle à clarifier :** l’énoncé autorise la consultation, la modification et l’annulation **avant le démarrage** ; le refus après démarrage est une règle cohérente avec cette limite. Une annulation signifie un changement de statut, pas nécessairement une suppression de l’historique. 

**Proposition à valider :** l’agriculteur peut modifier la date souhaitée ou le motif de sa demande, ou demander son annulation. Le responsable est informé et vérifie l’effet sur la planification. Si une tournée concerne plusieurs vergers, l’annulation d’une collecte ne doit pas supprimer toute la tournée ni libérer automatiquement les ressources nécessaires aux autres vergers. Les champs modifiables et la procédure exacte restent à confirmer. 

### **F2 - Alertes terrain** 

**Affichage :** lecture des notifications à la connexion ou au chargement de page ; un polling léger toutes les cinq minutes ou un mécanisme push peut être ajouté. Ce délai ne garantit pas le suivi en temps réel demandé dans l’énoncé : le groupe doit choisir et tester un délai adapté. États proposés pour une alerte : nouvelle, en cours, traitée. 

https://markdownlivepreview.com 

3/7 

25/11/2026 19:17 

Markdown Live Preview 

**F3 - Ressources et tournées** 

 

|**ID**|**Exigence**|**Critère d’acceptation**|
|---|---|---|
|F3.1|Le responsable logistique gère ouvriers,<br>tracteurs, bennes, filets et vibrateurs.|Il peut créer, consulter et modifier une ressource et son état.|
|F3.2|Les ressources sont affectées à une tournée<br>sur un créneau.|L’affectation est visible dans la tournée et le calendrier par<br>ressource.|
|F3.3|Le système contrôle les disponibilités.|Une affectation pour une ressource déjà réservée sur un créneau<br>qui se chevauche est refusée avec un message clair.|



### **F4 - Carte interactive** 

|**ID**|**Exigence**|**Critère d’acceptation**|
|---|---|---|
|F4.1|Afficher les vergers géolocalisés sur une<br>carte.|Un verger avec coordonnées valides apparaît au bon emplacement.|
|F4.2|Présenter variété, maturité, statut et<br>rendement disponible.|Un clic sur le marqueur montre les données autorisées et une<br>légende explique les couleurs.|
|F4.3|Proposer une carte publique et des<br>informations selon le rôle.|Le visiteur ne voit pas les données privées ; les utilisateurs<br>connectés voient les données permises.|
|F4.4|Faciliter l’utilisation sur téléphone.|La carte et ses contrôles restent utilisables sur petit écran.|



## **6. Règles métier et données** 

Une demande appartient à un agriculteur et concerne un de ses vergers. 

- Une tournée peut concerner plusieurs vergers : son modèle doit conserver le lien vers chacun et permettre le suivi par verger. 

- Les dates de début et de fin d’une affectation sont obligatoires ; une fin doit être postérieure au début. Deux créneaux se chevauchent si début A < fin B et début B < fin A. 

- La disponibilité doit être vérifiée lors de la création et de la modification de l’affectation. Le groupe doit prévoir une protection contre les demandes simultanées et tester ce cas. 

- Poids, quantités, superficie et capacité doivent être valides et non négatifs ; les unités sont explicites. 

- Le rendement affiché doit avoir une définition claire ; proposition : kg récoltés par hectare, avec source et période. Ne pas confondre avec la quantité totale récoltée. 

- Seuls les profils autorisés modifient les informations ; les transitions de statut sont vérifiées côté backend. 

https://markdownlivepreview.com 

4/7 

25/11/2026 19:17 

Markdown Live Preview 

 

## **7. Modèle métier initial** 

|**Objet**|**Données ou liens principaux**|
|---|---|
|Utilisateur|Identifiant, nom, coordonnées utiles et rôle.|
|Verger|Propriétaire, nom, superficie, variété, localisation, maturité et statut.|
|Demande de<br>récolte|Agriculteur, verger, caractère planifié ou urgent, date souhaitée, statut et motif si utile.|
|Alerte|Verger, auteur, catégorie (maturité ou problème), description, date et statut ; position du verger<br>réutilisée sauf besoin d’une position différente.|
|Tournée|Créneau, vergers, chef d’équipe, ressources, état et avancement.|
|Ressource /<br>affectation|Ressource identifiée par catégorie (ouvrier, tracteur, benne ou matériel) ; tournée et créneau<br>d’affectation. La disponibilité est calculée à partir des affectations et des éventuelles indisponibilités.|
|Pressoir /<br>réception|Capacité disponible ; tournée ou origine, poids, qualité et date de réception.|
|Notification|Destinataire, message, date, statut de lecture et objet concerné.|
|Données<br>externes|Source, date, type de mesure et valeur validée.|



Ce modèle est un point de départ : les cardinalités, champs et statuts seront finalisés dans le diagramme de classes et le schéma NoSQL. Les catégories de ressource et d’alerte restent à valider ; elles servent à distinguer les besoins de traitement. Le caractère planifié ou urgent distingue les demandes de récolte. 

## **8. Exigences techniques** 

### **Architecture** 

- **Frontend :** React et Tailwind CSS ; interface responsive, minimaliste et adaptée aux personnes âgées : texte lisible, contraste suffisant, boutons de grande taille, navigation simple et messages explicites. 

- **Backend :** API Spring Boot ; build Maven ; couches Controller, Service, DAO/Repository et Entity/Model, avec injection de dépendances. 

- **Base :** SGBD NoSQL à choisir et justifier. MongoDB avec Spring Data MongoDB est une proposition, pas une décision imposée ; Cassandra est également admise par l’énoncé. La modélisation, l’API de persistance et les requêtes dépendent du choix final. **Authentification et autorisation :** OAuth 2.0 et contrôle des rôles au niveau de l’API. Pour l’identité et la connexion, prévoir OpenID Connect avec un fournisseur d’identité ; le fournisseur et la correspondance entre ses rôles et ceux de l’application restent à choisir. 

### **Modélisation et persistance** 

Le rapport doit présenter le diagramme de classes, les règles de transformation vers le schéma NoSQL, les choix de structuration et de références ou d’imbrication selon le SGBD, les clés de partitionnement si applicables, les index adaptés aux requêtes, ainsi que la justification de l’API de persistance. Les champs de l’API et de la base doivent rester cohérents avec le modèle. 

### **Notifications dans Spring Boot** 

Lorsqu’un événement métier se produit, un service Spring publie un événement interne ; un écouteur crée une notification dans la base NoSQL. La notification contient notamment le destinataire, le message, la date et le statut lu/non lu. À la connexion ou au chargement de la page, l’API renvoie les notifications non lues ; l’utilisateur peut les marquer comme lues. 

https://markdownlivepreview.com 

5/7 

25/11/2026 19:17 

Markdown Live Preview 

L’idée Observer et la persistance sont conservées. Dans Spring Boot, utiliser les événements Spring ( `ApplicationEventPublisher` et `@EventListener` ) plutôt que les exemples CDI/JPA tels quels : CDI et `EntityManager` ne sont pas automatiquement la solution adaptée à Spring Boot et à une base NoSQL. Prévoir les transactions et la gestion des échecs d’enregistrement selon le SGBD retenu : un événement en mémoire ne garantit pas à lui seul la livraison après une panne. 

 

### **Sources et intranet** 

- **Fichier 1 : données de base** : exemples de vergers, ressources et pressoirs. 

- **Fichier 2 : données qui changent** : exemples de météo, de maturité et de capacité des pressoirs. 

- L’application lit régulièrement ces fichiers ou services simulés, vérifie les données et signale les erreurs. La fréquence reste à décider. 

**Intranet** : espace interne sécurisé de l’application où les personnes autorisées saisissent ou complètent les informations sur les vergers, équipements et tournées. 

## **9. Exigences non fonctionnelles** 

|**Domaine**|**Exigence et vérification**|
|---|---|
|Ergonomie|Design minimaliste pour un public âgé : texte et boutons lisibles, contraste suffisant, navigation simple<br>et adaptation au téléphone ; géolocalisation avec alternative manuelle.|
|Aide|Aide contextuelle permanente et visite guidée proposée aux nouveaux utilisateurs.|
|Performance|Plusieurs centaines de comptes et environ 100 connexions simultanées ; une carte ou recherche<br>dépassant 10 secondes est jugée non satisfaisante. Tester avec un jeu de données et une charge<br>représentatifs, documenter résultats et environnement.|
|Sécurité|Authentification, droits par profil, accès limité aux données privées, mots de passe protégés ; tester les<br>accès non autorisés.|
|Données|Validation des entrées et imports ; aucun double emploi sur les ressources.|
|Disponibilité et<br>supervision|Application accessible à distance ; Grafana pour visualiser les métriques et Jaeger pour les traces.<br>Prévoir la collecte des métriques et traces ainsi qu’une vérification de disponibilité.|
|Sauvegarde|Sauvegardes régulières de la base et procédure de restauration ; réaliser un test de restauration.|



https://markdownlivepreview.com 

6/7 

25/11/2026 19:17 

Markdown Live Preview 

 

## **10. Validation et tests** 

|**Scénario**|**Résultat attendu**|
|---|---|
|Parcours nominal complet|Une demande passe de l’interface à l’API, puis en base ; tournée, suivi et réception sont visibles.|
|Alerte géolocalisée|L’alerte apparaît automatiquement chez le responsable et son traitement informe l’agriculteur.|
|Accès non autorisé|Un agriculteur ne peut ni lire ni modifier les données privées d’un autre.|
|Chevauchement et<br>concurrence|Deux affectations simultanées de la même ressource sur le même créneau ne sont pas<br>acceptées.|
|Modification ou<br>annulation|Avant démarrage, l’agriculteur peut agir selon les champs et règles validés ; après démarrage,<br>l’API refuse modification et annulation.|
|Source invalide|Une valeur invalide est rejetée ou signalée ; les données valides sont traitées selon la politique<br>documentée.|
|Accès distant et<br>restauration|Le service est accessible depuis une autre machine autorisée et une sauvegarde peut être<br>restaurée.|
|Charge et affichage<br>mobile|Mesurer les temps de carte et de recherche avec charge représentative ; vérifier l’interface sur<br>téléphone.|



Les tests couvrent le frontend, l’API et la base, avec scénarios nominaux et alternatifs. Garder les résultats et captures utiles au rapport. 

## **11. Organisation proposée pour trois étudiants** 

|**Responsable principal**|**Tâches**|**Collaboration**|
|---|---|---|
|Étudiant 1 - Backend|API Spring Boot, règles métier, coordination<br>des contrats et sécurité.|Travaille avec les deux autres sur<br>l’intégration.|
|Étudiant 2 - Données|Schéma NoSQL, persistance, imports, validation<br>et sauvegardes.|Valide les modèles et requêtes avec le<br>backend.|
|Étudiant 3 - Frontend et|Interfaces, carte, connexion aux API et|Les autres aident au déploiement, aux tests|
|serveur|déploiement web.|et à la supervision.|



L’analyse, les diagrammes, les contrats d’API, la sécurité, les tests complets, le rapport et la démonstration sont partagés. Adapter les charges selon les compétences et l’avancement. 

https://markdownlivepreview.com 

7/7 

