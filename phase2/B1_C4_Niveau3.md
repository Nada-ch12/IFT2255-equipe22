# B1 — Modèle C4 niveau 3

Figure : `diagrammes/B1-C4-Niveau3.png`, C4 niveau 3 de l'API REST et des connecteurs d'import.

## 1. Conteneur décomposé et justification

Nous décomposons l'**API REST**, et plus brièvement les **Connecteurs d'import**.

Pourquoi c'est l'API qui porte la logique de planification :

1. **Les règles ne doivent pas pouvoir être contournées.** L'application web tourne dans le navigateur de l'utilisateur : on ne peut pas lui faire confiance pour appliquer le plafond de crédits ou les préalables. Dans le prototype de la phase 1, ces règles étaient dans `rules.js`, côté navigateur, et les essais ont montré des dépassements (25/18 crédits) qui n'étaient pas bloqués.
2. **La planification a besoin de toutes les données en même temps** : le relevé, le plan, les demandes en attente, les copies de Planifium et les règles versionnées. Seule l'API a accès à la base et aux connecteurs.
3. **Plusieurs déclencheurs utilisent la même logique** : l'étudiant (application web), l'encadrant (réponse à une demande) et le planificateur (expiration, synchronisation). Placer les règles dans l'API garantit un seul comportement pour tous (pas de règle dupliquée).
4. **Les connecteurs restent à part**, parce que Planifium est une source que nous ne contrôlons pas : lente, parfois indisponible, avec des données incomplètes. Si Planifium tombe, l'API continue de fonctionner avec la dernière copie datée.

## 2. Composants et responsabilités

| Composant | Responsabilité (une phrase) | Exigences |
|---|---|---|
| Routeur REST | Reçoit chaque requête HTTP et la dirige vers le bon service. | — |
| Contrôle d'accès | Vérifie le jeton et applique la matrice des droits par rôle et par propriétaire. | R5 (révision) |
| Service Profil et suggestions | Gère le profil, les préférences, les appréciations et explique les suggestions. | E2, E12 |
| Service Catalogue | Réunit les cours copiés de Planifium et les offres des organisations en un catalogue commun. | E1, E13 |
| Service Plan | Gère le plan de session, les intentions futures et les compteurs de crédits séparés. | E4, E10, E11 |
| Moteur de règles du programme | Évalue préalables, plafond, charge, blocs et temps plein avec un résultat à trois valeurs. | E3, E4, E5, E9 |
| Service Demandes | Fait évoluer chaque demande selon le modèle d'états et garde son historique. | E6 |
| Service Échéances et retraits | Fournit les dates utiles et calcule les conséquences d'un retrait. | E7, E8 |
| Service Notifications | Crée une notification par événement, sans doublon, et envoie les urgentes par courriel. | E6, E7, E11 |
| Service Synchronisation | Compare les nouvelles copies aux anciennes et lance le réexamen des plans touchés. | E11 |
| Service Bilan | Produit le bilan de fin de période : satisfait, incomplet, incertain. | E14 |
| Dépôts de données | Lit et écrit les entités et leur historique dans la base. | — |
| Client Planifium *(connecteurs)* | Appelle Planifium et traduit ses réponses en copies datées avec leur statut. | E1, E3 |
| Importeur de fichiers *(connecteurs)* | Lit le relevé et le calendrier, vérifie leur format et note leur provenance. | E3, E7 |

Toutes les relations du diagramme ont une étiquette (verbe + ce qui circule).

## 3. Matrice de traçabilité des cinq flux A2

<!-- INCLURE B1_Matrice_tracabilite.md -->

## 4. Correspondance composants ↔ classes de B2

| Composant B1 | Classes B2 (vue principale) | Classes B2 (annexe) |
|---|---|---|
| Contrôle d'accès | — | ControleAcces, Utilisateur, Role |
| Service Profil et suggestions | Etudiant | ServiceSuggestions, Appreciation |
| Service Catalogue | Activite, Cours, OffreActivite | — |
| Service Plan | PlanSession, Intention | Case, CompteurCredits |
| Moteur de règles du programme | Programme, RegleProgramme, ReglePlafondCredits, ReglePrealables, RegleBloc, MoteurRegles | RegleChargeHebdo, RegleTempsPlein, ResultatRegle |
| Service Demandes | Demande, ServiceDemandes | ChangementEtat |
| Service Échéances et retraits | — | Echeance, ServiceEcheancesRetraits |
| Service Notifications | — | Notification, ServiceNotifications |
| Service Synchronisation | — | ServiceSynchronisation, RapportSynchro *(utilise CopiePlanifium sans la posséder)* |
| Service Bilan | — | ServiceBilan, Bilan |
| Client Planifium (connecteurs) | ClientPlanifium | CopiePlanifium *(produite et enregistrée par le Client Planifium)* |
| Dépôts de données | — | (une interface de dépôt par entité, non dessinée) |

> À faire en équipe : vérifier que **chaque nom** ci-dessus est identique dans B1, B2, B3 et B4.
