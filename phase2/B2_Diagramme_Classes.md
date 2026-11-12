# B2 — Diagramme de classes

Diagrammes :
- `diagrammes/B2-Modele_Domaine.png`, le modèle du domaine (concepts du problème) qui sert de point de comparaison ;
- `diagrammes/B2-Classes_Principal.png`, la **vue principale (15 classes)** ;
- `diagrammes/B2-Classes_Annexe.png`, l'annexe (énumérations et classes complémentaires), rangée dans les mêmes paquetages que la vue principale, c'est-à-dire les composants de B1.

**Décisions de nommage validées en équipe (6 nov.) :**
- le composant s'appelle « Service Échéances et retraits » partout ; sa classe de service est `ServiceEcheancesRetraits` ;
- `CopiePlanifium` appartient aux **Connecteurs d'import** : le `ClientPlanifium` la produit et l'enregistre. Le `ServiceSynchronisation` la compare et le Service Catalogue lit sa date ; aucun des deux ne la possède.

Les paquetages du diagramme portent **le nom des composants de B1** : chaque classe se retrouve donc dans un composant.

## 1. Les 15 classes de la vue principale

| Classe | Rôle | Composant B1 |
|---|---|---|
| Etudiant | Profil, disponibilité et relevé connu de la personne. | Service Profil et suggestions |
| Activite *(abstraite)* | Ce qui est commun à toute activité : crédits, charge, provenance. | Service Catalogue |
| Cours | Cours copié de Planifium, avec ses exigences brutes et leur statut d'analyse. | Service Catalogue |
| OffreActivite | Projet, stage, poste ou séminaire publié par une organisation. | Service Catalogue |
| PlanSession | Plan d'une session : ses demandes et son état de brouillon ; ses crédits sont dans `CompteurCredits` (annexe). | Service Plan |
| Intention | Activité (`Activite`) visée pour une session future, qui peut être « à réexaminer ». | Service Plan |
| Programme | Programme suivi et version de ses règles. | Moteur de règles |
| RegleProgramme *(abstraite)* | Contrat commun : `evaluer()` renvoie un résultat à trois valeurs. | Moteur de règles |
| ReglePlafondCredits | Règle du plafond de crédits par session. | Moteur de règles |
| ReglePrealables | Règle des préalables, à partir des exigences copiées de Planifium. | Moteur de règles |
| RegleBloc | Règle d'un bloc : crédits minimum et maximum sur une liste de sigles. | Moteur de règles |
| MoteurRegles | Applique toutes les règles actives et dit si le résultat est bloquant. | Moteur de règles |
| Demande | Une demande et son état ; toute transition passe par `transitionner()`. | Service Demandes |
| ServiceDemandes | Soumet, fait répondre, fait accepter et fait expirer les demandes. | Service Demandes |
| ClientPlanifium | Adaptateur qui appelle Planifium et produit des copies datées. | Client Planifium (connecteurs) |

**Où vivent les règles du programme** (exigence de l'énoncé) : plafond → `ReglePlafondCredits` ; préalables → `ReglePrealables` ; blocs → `RegleBloc`. En annexe : `RegleChargeHebdo` et `RegleTempsPlein`. Ajouter une règle ne demande qu'une nouvelle sous-classe de `RegleProgramme` ; ni `MoteurRegles` ni `ServiceDemandes` ne changent.

## 2. Classes absentes du modèle du domaine (au moins 3)

| Classe | Pourquoi elle n'existe pas dans le domaine | Pourquoi la conception en a besoin |
|---|---|---|
| **MoteurRegles** | Dans le domaine, on parle de « règles », pas d'un objet qui les applique. | Un seul point d'entrée pour évaluer un ajout ou un retrait ; utilisé par le Service Demandes, le Service Plan et le planificateur (même comportement partout). |
| **ServiceDemandes** | Le domaine décrit la demande, pas l'orchestration de son cycle de vie. | Coordonne la vérification des règles, le changement d'état, l'historique et la notification. |
| **ClientPlanifium** | Planifium est un choix technique : le domaine parle seulement d'un « répertoire des cours ». | Isole une source imparfaite (lente, incomplète, datée). Si l'API change, une seule classe change. |
| *(annexe)* ResultatRegle, CopiePlanifium, Notification, ControleAcces | Ce sont des objets techniques de conception. | Résultat à trois valeurs, copie datée, notification sans doublon, autorisation. |

## 3. Écarts entre le modèle du domaine et la conception

### Écart 1 — Gestion des données externes

Dans la phase 1, nous avions prévu de récupérer les cours et leurs préalables depuis un répertoire externe, avec des connecteurs d'import. Dans notre conception, nous avons précisé cette gestion avec `ClientPlanifium`, qui possède la méthode `lireCours()`, et `CopiePlanifium`, qui conserve les données récupérées. Les attributs `aVerifier` et `statutAnalyse` permettent de signaler les informations qui nécessitent encore une vérification.

### Écart 2 — Évaluation des règles du programme

Dans la phase 1, nous avions prévu de vérifier les contraintes du programme, comme les préalables, le plafond de crédits et la charge de travail, sans préciser leur mécanisme d'évaluation interne. Dans notre conception, nous avons introduit `MoteurRegles`, qui utilise plusieurs règles spécialisées héritant de `RegleProgramme`. Sa méthode `evaluerAjout()` retourne une liste de `ResultatRegle`, ce qui permet de connaître séparément le résultat de chaque vérification.

## 4. Choix de conception à défendre

### Choix 1 — Isoler la communication avec Planifium

Nous avons choisi de passer par `ClientPlanifium` et de conserver une copie des données dans `CopiePlanifium`, plutôt que d'appeler l'API à chaque consultation. Cela permet d'utiliser les informations déjà récupérées lorsque Planifium est lent ou indisponible. Le compromis est que ces données peuvent devenir périmées, d'où les attributs `aVerifier` et `statutAnalyse`.

### Choix 2 — Utiliser des règles spécialisées

Nous avons choisi de séparer les règles dans plusieurs classes plutôt que de mettre toutes les vérifications dans une seule grosse méthode. Les classes `ReglePrealables`, `ReglePlafondCredits` et `RegleBloc` héritent de `RegleProgramme` et utilisent la méthode `evaluer()`, ce qui permet au moteur de traiter différentes contraintes. Cette organisation facilite les modifications et l'ajout de nouvelles règles, mais elle demande de gérer davantage de classes.

### Choix 3 — Séparer les demandes du plan de session

Nous avons choisi de garder `Demande` séparée de `PlanSession`, plutôt que de mettre directement les états des demandes dans le plan. La méthode `transitionner()` permet de faire évoluer une demande, tandis que `ChangementEtat` conserve l'historique de ses différents états. Cela facilite le suivi des réponses des tiers, mais demande de maintenir la cohérence entre les demandes et le plan lorsqu'une demande change d'état.

## 5. À vérifier par l'équipe

- [ ] Les noms des paquetages sont identiques aux noms des composants de B1.
- [ ] Les multiplicités sont correctes (ex. un `Etudiant` a-t-il un seul `Programme` ? Cas du double programme).
- [ ] Les énumérations sont en annexe : décider si on les compte dans les 15 (sinon, c'est une bonne question à poser au correcteur).
- [x] Diagrammes refaits dans Visual Paradigm.


## 6. Déclaration d'utilisation de l'intelligence artificielle

Pour la partie B2, j'ai utilisé ChatGPT (OpenAI) et Claude (Anthropic) comme outils d'assistance. Claude m'a accompagné dans la préparation et la correction d'un brouillon PlantUML, ainsi que dans la réalisation du diagramme de classes dans Visual Paradigm. Il m'a également aidé à vérifier la cohérence UML et les explications de mes choix de conception. ChatGPT m'a aidé à comparer les diagrammes avec les documents de la phase 1, à vérifier certaines classes et relations UML et à reformuler les justifications écrites.

Les décisions de conception retenues sont celles de notre équipe. J'ai utilisé ces outils pour comprendre, vérifier et améliorer la présentation de mon travail, puis relire et adapter les explications en fonction de nos diagrammes et des besoins du projet.
