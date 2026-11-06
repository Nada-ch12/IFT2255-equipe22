# B2 — Diagramme de classes (BROUILLON à retravailler par l'équipe)

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
| PlanSession | Plan d'une session : demandes, crédits en demande et confirmés, brouillon. | Service Plan |
| Intention | Activité visée pour une session future, qui peut être « à réexaminer ». | Service Plan |
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

## 3. Écarts entre le modèle du domaine et la conception (au moins 2)

**Écart 1 — « Offre du tiers » n'est plus une classe : c'est un état de la Demande.**
Dans le domaine, la demande et l'offre sont deux concepts. Dans la conception, l'offre devient l'état `OFFRE_RECUE` de `Demande`, avec son échéance (`echeanceReponse`).
*Raison :* deux objets à garder synchronisés produiraient exactement l'incohérence relevée par la correctrice (A1 ≠ A2). Avec une seule machine à états (`diagrammes/Etats_Demande.png`), une demande ne peut pas être « confirmée » et « en attente » en même temps.

**Écart 2 — « Règle du programme » (un texte) devient une hiérarchie de classes à résultat à trois valeurs.**
Dans le domaine, une règle est une description. Dans la conception, c'est une classe abstraite `RegleProgramme` avec une sous-classe par règle, et chaque évaluation renvoie `SATISFAIT`, `NON_SATISFAIT` ou `INCONNU`.
*Raison :* Planifium ne comprend entièrement qu'environ 90 % des textes d'exigences (`status: "exact"`). Les autres sont `manual` ou non interprétés, et certaines conditions (permission, moyenne non fournie) donnent `unknown`. Un booléen obligerait à transformer « inconnu » en « satisfait », ce que l'exigence E3 interdit (c'était l'erreur observée avec IFT1025).

**Écart 3 — Projet, Stage, Séminaire et Concours fusionnent en `OffreActivite`.**
Dans le domaine, ce sont quatre concepts. Dans la conception, c'est une classe avec un attribut `type : TypeActivite`.
*Raison :* ils ont le même comportement (publier, fermer, recevoir des demandes) ; seules les données changent. Le cours reste à part, parce qu'il vient de Planifium et a des exigences.

**Écart 4 — Le cours ne « possède » pas ses préalables : il garde une copie datée.**
Dans le domaine, `Cours` a des préalables. Dans la conception, `Cours` garde `exigencesBrutes`, `statutAnalyse` et `copieDu`.
*Raison :* la source de vérité est le répertoire, et l'instantané Planifium peut avoir changé (`updated_at`). Afficher la date de la copie évite de présenter une donnée périmée comme sûre.

## 4. Choix de conception à défendre (section « défense des choix », 15 %)

- **Patron Stratégie** pour les règles (`RegleProgramme`) : chaque règle se teste seule (voir B3).
- **Patron Adaptateur** pour Planifium (`ClientPlanifium`) : le reste du système ne connaît pas le format JSON de Planifium.
- **Toute transition d'état passe par `Demande.transitionner()`**, qui refuse les transitions interdites et crée un `ChangementEtat` (historique, exigence E6 : date et interlocuteur du dernier changement).
- **`PlanSession.creditsTotaux(inclureDemandes)`** : les demandes en attente comptent dans la vérification du plafond (correction de l'observation 25/18 crédits), mais ne sont jamais affichées comme confirmées.

## 5. À vérifier par l'équipe

- [ ] Les noms des paquetages sont identiques aux noms des composants de B1.
- [ ] Les multiplicités sont correctes (ex. un `Etudiant` a-t-il un seul `Programme` ? Cas du double programme).
- [ ] Les énumérations sont en annexe : décider si on les compte dans les 15 (sinon, c'est une bonne question à poser au correcteur).
- [ ] Refaire le diagramme dans Visual Paradigm si l'équipe préfère ce rendu.
