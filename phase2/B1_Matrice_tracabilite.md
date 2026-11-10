# B1 — Matrice de traçabilité des cinq flux A2

## Convention de lecture

- **App** = conteneur Application web (React) ; **Routeur** = composant Routeur REST de l'API ; **Accès** = composant Contrôle d'accès (middleware Express).
- Les flèches `→` indiquent la succession logique des responsabilités. Elles ne signifient pas toutes un appel direct : une vérification peut retourner son résultat au composant appelant.
- Les opérations protégées passent par le middleware **Contrôle d'accès**, même lorsque son intervention est indiquée une seule fois en début de parcours.
- Les décisions et variantes proviennent des flux A2 du rapport de phase 1 ; cette matrice décrit la **conception visée**, et non le comportement actuellement implémenté dans le prototype.
- Les opérations de persistance métier sont réalisées par **Dépôts de données → Base de données (PostgreSQL)**. Les copies de Planifium sont produites par **Client Planifium**.

## Matrice principale

| Flux A2 | Déclencheur et étapes métier | Parcours principal dans B1 | Cas alternatifs et responsables | Données / résultat |
|---|---|---|---|---|
| **A2.1 — Ajouter une activité après vérification des contraintes** | L'étudiant choisit une activité ; le système vérifie les préalables, le plafond de crédits et la charge, puis soumet la demande autorisée. | **App → Routeur → Accès → Service Demandes → Moteur de règles du programme ↔ Service Catalogue → Service Demandes → Service Plan → Dépôts de données → PostgreSQL.** Le Service Demandes peut publier un événement vers **Service Notifications**. | **NON_SATISFAIT** : blocage et explication, sans demande enregistrée. **INCONNU** (condition absente/non analysable) : ne pas traiter comme satisfait ; afficher l'incertitude ou réclamer une vérification. L'étudiant peut modifier/annuler son choix. | Activité, préalables, relevé, crédits demandés/confirmés, résultat de règle, état de la demande. |
| **A2.2 — Demander une place et répondre à une offre** | Demande transmise ; encadrant répond ; offre reçue ; étudiant accepte ; statut confirmé. | **Étudiant/encadrant : App → Routeur → Accès → Service Demandes → Service Plan**, puis **Service Demandes → Dépôts de données → PostgreSQL** et **Service Demandes → Service Notifications**. Pour l'acceptation, **Service Demandes → Moteur de règles** si les contraintes doivent être recontrôlées. | **Refus** : Service Demandes passe à refusée et notifie. **Expiration** : Planificateur → Routeur → Accès → Service Demandes (expirée) → Service Notifications. **Offre déclinée** : état annulé ; pas de confirmation. Transition refusée si illégale par `Demande.transitionner()`. | Statut et historique d'une demande, interlocuteur, échéance de réponse, notification, crédits confirmés distincts des demandes en attente. |
| **A2.3 — Retirer une activité en comprenant les conséquences** | L'étudiant demande un aperçu ; le système consulte dates/frais, calcule crédits et temps plein ; l'étudiant confirme ou annule. | **App → Routeur → Accès → Service Plan → Service Échéances et retraits** ; en parallèle logique **Service Plan → Moteur de règles du programme**. L'aperçu revient à l'**App**. Après confirmation autorisée : **App → Routeur → Accès → Service Plan → Dépôts de données → PostgreSQL** ; si la demande doit changer d'état, **Routeur → Service Demandes → Dépôts de données**. | **Annulation** : aucune écriture. **Après le 16 septembre** : montrer frais et conséquences connus avant confirmation. **Après le 6 novembre**, selon la règle visée de la phase 1 : refuser le retrait et orienter vers le Registrariat. **Date/frais inconnus** : le signaler, sans prétendre « sans frais ». | Date limite, conséquences financières connues, crédits/charge/temps plein après retrait, confirmation explicite, statut et historique. |
| **A2.4 — Réexaminer une intention pour une session future** | L'étudiant enregistre une intention distincte d'une inscription ; une synchronisation ultérieure découvre un changement d'offre. | **Création : App → Routeur → Accès → Service Plan → Moteur de règles / Service Catalogue (selon besoin) → Service Plan → Dépôts de données → PostgreSQL.** **Réexamen : Planificateur → Routeur → Accès → Service Synchronisation → Client Planifium → API Planifium** ; **Client Planifium → PostgreSQL** (copies datées), puis **Service Synchronisation → Service Plan** (intention à réexaminer). | Offre retirée, pleine ou données incertaines : marquer **à réexaminer** et prévenir l'étudiant via **Service Notifications** (relation `sync → notif` à ajouter si cette variante est modélisée comme appel direct). Une intention ne devient pas automatiquement confirmée. | Session visée, disponibilité, date/provenance de copie, statut de l'intention, notification de changement. |
| **A2.5 — Consulter ses échéances** | L'étudiant consulte ses dates ; le système distingue dates connues, dépassées et non publiées ; des rappels sont déclenchés. | **Consultation : App → Routeur → Accès → Service Échéances et retraits** (dates conservées provenant de **Importeur de fichiers → PostgreSQL**) → **App**. **Rappels : Planificateur → Routeur → Accès → Service Échéances et retraits → Service Notifications → Service de courriel** (si alerte urgente). | **Date non publiée** : afficher « inconnue/non publiée », sans inventer de date. **Date dépassée** : signaler l'échéance et les possibilités pertinentes. **Rappel J−7** uniquement si la date est connue et le rappel applicable ; éviter les doublons. | Date, source/provenance, état connu/inconnu/dépassé, rappel et notification. |

## Vérification de cohérence avec le diagramme C4 niveau 3

La version actuelle du diagramme B1 comporte les relations nécessaires aux cinq flux, notamment : `dem → regles`, `regles → cata`, `dem → plan`, `plan → ech`, `plan → regles`, `dem → notif`, `sync → plan`, `sync → cliP`, `sync → notif`, `ech → depots`, `ech → notif`, `notif → depots`, `depots → db`, ainsi que les liens avec les systèmes externes (Planifium, Registrariat, fournisseur d'identité et service de courriel).

**Précisions de lecture :**

- Les parcours ci-dessus sont **logiques** : un résultat peut revenir au service appelant sans qu'une deuxième flèche inverse soit dessinée.
- Le contrôle d'accès est appliqué via un middleware Express aux opérations protégées avant leur exécution, y compris pour les opérations déclenchées par le planificateur.
- Les changements d'état de `Demande` sont persistés par les dépôts ; `Service Plan` maintient des compteurs distincts pour les demandes et les confirmations.
- La consultation des informations importées peut impliquer la base de données, sans que chaque lecture soit dessinée individuellement dans cette vue C4 de niveau 3.
- Les traitements de refus, d'annulation ou d'information inconnue sont documentés comme des branches métier, pas comme des composants supplémentaires.

## Correspondance avec le rapport de phase 1

- A2.1 : exigences/préalables, plafond et charge ; contrainte inconnue non validée.
- A2.2 : attente, offre, acceptation, refus ou expiration, avec tiers et historique.
- A2.3 : conséquences avant décision, annulation possible, limites selon dates et statut de temps plein.
- A2.4 : intention future distincte, réexamen si l'offre change ou disparaît.
- A2.5 : dates officielles ou inconnues, échéance dépassée et alerte sept jours avant lorsque possible.

*Document de revue à valider avec le diagramme et les choix de l'équipe ; ne pas le présenter comme une implémentation testée.*
