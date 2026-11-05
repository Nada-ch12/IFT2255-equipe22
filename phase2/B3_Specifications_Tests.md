# B3 — Spécifications de tests (BROUILLON à retravailler par l'équipe)

22 cas de test (l'énoncé demande de 15 à 25). Ils couvrent les **cas nominaux (N)**, les **cas limites (L)** et les **cas d'échec (É)**. L'automatisation n'est pas demandée.

> ⚠️ Les valeurs de Planifium ci-dessous (exigences, `updated_at`, places) sont des **données de test préparées** au format de l'API. Avant la remise, vérifier au moins les préalables de IFT1025 dans Planifium (`GET /courses/IFT1025/prerequisites`).

---

## 1. Critères d'acceptation par exigence

| Exigence | Critère d'acceptation vérifiable | Tests |
|---|---|---|
| E1 Offre commune | Le catalogue affiche cours **et** offres des organisations dans une même liste ; chaque activité montre type, crédits, charge, disponibilité et provenance ; une valeur absente s'affiche « inconnue ». | T01, T02 |
| E2 Suggestions expliquées | Chaque suggestion affiche au moins un critère qui l'explique ; modifier un intérêt change l'ordre des suggestions. | T03 |
| E3 Préalables | Le résultat est l'un de trois : satisfait, non satisfait, impossible à vérifier. Un relevé absent ou une exigence `manual` ne donne **jamais** « satisfait ». | T04, T05, T06 |
| E4 Contraintes avant modification | Avant l'envoi, le plafond est calculé **avec les demandes en attente** ; un dépassement est affiché et la demande n'est pas envoyée sans décision de l'étudiant. | T07, T08 |
| E5 Catégories et blocs | Chaque activité indique la catégorie à laquelle elle contribue ; les exigences restantes sont calculées par catégorie. | T09 |
| E6 États des demandes | Une demande suit uniquement les transitions du modèle d'états ; la date et l'interlocuteur du dernier changement sont affichés ; les crédits ne sont « en cours » qu'à l'état CONFIRMEE. | T10, T11, T12 |
| E7 Dates utiles | Une date inconnue s'affiche « date non publiée » ; un rappel est créé 7 jours avant une échéance connue, une seule fois. | T13 |
| E8 Retrait expliqué | Les conséquences connues (crédits, frais, temps plein) sont affichées **avant** la confirmation ; annuler ne modifie rien. | T14 |
| E9 Seuil de temps plein | Passer sous 12 crédits affiche un avertissement et une ressource à contacter, sans annoncer une perte d'aide financière. | T15 |
| E10 Types de crédits | Acquis, en cours et planifiés sont affichés séparément ; une intention ne change que les planifiés. | T16 |
| E11 Intentions à réexaminer | Un changement détecté par la synchronisation marque l'intention « à réexaminer », avec la session et le motif ; elle n'est pas supprimée. | T17 |
| E12 Effets des appréciations | Une appréciation ne modifie jamais la disponibilité déclarée sans l'accord de l'étudiant. | T18 |
| E13 Alternatives et conseil | Une activité inaccessible affiche au moins une alternative connue ou un interlocuteur. | T19 |
| E14 Bilan final | Le bilan classe chaque élément en satisfait, incomplet ou incertain. | T20 |
| R5 Autorisation *(révision)* | Un utilisateur ne peut agir que sur ses propres données, selon la matrice des droits. | T21 |
| R6 Synchronisation *(révision)* | Les places affichées portent la date de la copie Planifium. | T02, T22 |

---

## 2. Jeux de données

Ils reprennent les profils utilisés pendant l'enquête de la phase 1.

| Jeu | Contenu |
|---|---|
| **JD-30** « Profil 30 h » | Étudiant `E30`, disponibilité 30 h/sem, programme avec plafond de 18 crédits et seuil de temps plein à 12 ; relevé importé le 2026-09-02 : IFT1015 réussi. |
| **JD-8** « Profil 8 h » | Étudiant `E8`, disponibilité 8 h/sem, plafond de 15 crédits ; **aucun relevé importé**. |
| **JD-40** « Profil 40 h » | Étudiant `E40`, 40 h/sem ; plan avec une case « Séminaires, concours ou stages » libre. |
| **PL-COURS** (copies Planifium) | IFT1025 : 3 cr, `requirements` = IFT1015, `status: "exact"`, `updated_at` 2026-10-20. IFT3395 : 3 cr, `status: "manual"`. STT1700 : 3 cr, aucune exigence. IFT2255 : 3 cr, `capacity` 120, `enrolled` 120. |
| **ORG** (offres) | Projet « Données et IA » (3 cr, 8 h, encadrant `ENC-A`) ; Stage « Fondation Arpent » (6 cr, 16 h, organisation `ORG-1`) ; Stage « Coopérative Volta » (6 cr, échéance de réponse 2026-11-10). |
| **CAL** (calendrier importé) | Abandon avec frais : date connue ; concours « Sprint de design » : **aucune date**. |

---

## 3. Cas de test

### T01 — Catalogue commun (N) · E1
- **Objectif :** vérifier que cours et offres apparaissent ensemble avec leurs informations.
- **Préconditions :** PL-COURS et ORG chargés ; JD-30 connecté.
- **Données :** IFT1025, STT1700, projet « Données et IA » ; la charge de STT1700 est absente.
- **Étapes :** 1. Ouvrir le catalogue. 2. Filtrer sur « toutes les activités ».
- **Résultat attendu :** les 3 activités sont dans la même liste, avec type, crédits et provenance (« Planifium, copie du 2026-10-20 » ou « organisation ») ; la charge de STT1700 s'affiche « inconnue ».

### T02 — Planifium indisponible (É) · E1, R6
- **Objectif :** vérifier que le catalogue reste utilisable avec la dernière copie quand la source ne répond pas.
- **Préconditions :** une copie de IFT1025 datée du 2026-10-20 existe ; Planifium ne répond pas (délai dépassé).
- **Données :** PL-COURS.
- **Étapes :** 1. Lancer la synchronisation. 2. Ouvrir la fiche de IFT1025.
- **Résultat attendu :** aucune erreur pour l'étudiant ; la fiche affiche « données du 2026-10-20, à vérifier » ; la copie n'est ni effacée ni remplacée.

### T03 — Suggestions expliquées (N) · E2
- **Objectif :** vérifier qu'une suggestion est expliquée et suit les intérêts.
- **Préconditions :** JD-30, intérêt « données » sélectionné.
- **Données :** ORG, PL-COURS.
- **Étapes :** 1. Ouvrir les suggestions. 2. Remplacer l'intérêt « données » par « robotique ». 3. Rouvrir les suggestions.
- **Résultat attendu :** à l'étape 1, chaque suggestion affiche au moins un critère (ex. « correspond à votre intérêt : données ») ; à l'étape 3, l'ordre des suggestions a changé.

### T04 — Préalable satisfait (N) · E3
- **Objectif :** vérifier qu'un préalable réussi permet la demande.
- **Préconditions :** JD-30 (IFT1015 réussi) ; case Cours libre.
- **Données :** IFT1025 (exigence IFT1015, `exact`).
- **Étapes :** 1. Demander IFT1025.
- **Résultat attendu :** `ReglePrealables` → SATISFAIT ; la demande est créée à l'état EN_ATTENTE.

### T05 — Préalable manquant (É) · E3
- **Objectif :** vérifier qu'un préalable non réussi bloque la demande (cas IFT1025 observé en phase 1).
- **Préconditions :** relevé de JD-30 modifié pour ne contenir que MAT1978.
- **Données :** IFT1025.
- **Étapes :** 1. Demander IFT1025.
- **Résultat attendu :** NON_SATISFAIT, message « préalable manquant : IFT1015 » ; **aucune demande n'est créée** ; au moins une alternative est proposée (lien avec E13).

### T06 — Préalable impossible à vérifier (L) · E3
- **Objectif :** vérifier qu'une donnée manquante ne devient pas une validation.
- **Préconditions :** JD-8 (aucun relevé) ; puis JD-30.
- **Données :** IFT1025 pour JD-8 ; IFT3395 (`status: "manual"`) pour JD-30.
- **Étapes :** 1. JD-8 demande IFT1025. 2. JD-30 demande IFT3395.
- **Résultat attendu :** dans les deux cas, le résultat est INCONNU et l'avertissement « préalable impossible à vérifier » s'affiche ; la demande peut être envoyée, mais le résultat n'est **jamais** affiché « satisfait ».

### T07 — Exactement au plafond (L) · E4
- **Objectif :** vérifier qu'atteindre le plafond n'est pas un dépassement.
- **Préconditions :** JD-30 ; 15 crédits confirmés ; aucune demande en attente.
- **Données :** STT1700 (3 cr).
- **Étapes :** 1. Demander STT1700.
- **Résultat attendu :** 15 + 3 = 18 = plafond → `ReglePlafondCredits` SATISFAIT ; demande EN_ATTENTE ; aucun avertissement de plafond.

### T08 — Dépassement avec demandes en attente (É) · E4
- **Objectif :** vérifier que les demandes en attente comptent dans le plafond (correction de l'observation 25/18).
- **Préconditions :** JD-30 ; 15 crédits confirmés + IFT1025 (3 cr) EN_ATTENTE.
- **Données :** STT1700 (3 cr).
- **Étapes :** 1. Demander STT1700. 2. Choisir « garder en brouillon ».
- **Résultat attendu :** l'étape 1 affiche « 21 crédits sur un plafond de 18 (dont 3 en attente) » et **aucune demande n'est envoyée** ; à l'étape 2, un brouillon est enregistré, la contrainte reste visible et le statut « brouillon » est affiché.

### T09 — Catégorie d'un stage (N) · E5
- **Objectif :** vérifier qu'un stage compte dans la catégorie annoncée (cas Fondation Arpent, phase 1).
- **Préconditions :** JD-40 ; case « Séminaires, concours ou stages » libre ; aucune case Projet.
- **Données :** Stage « Fondation Arpent ».
- **Étapes :** 1. Ouvrir la fiche du stage. 2. Demander le stage.
- **Résultat attendu :** le bouton « Demander » est actif ; la fiche indique « contribue à : Séminaires, concours ou stages » ; les exigences restantes de cette catégorie passent de 3 à 2 dès que la demande est confirmée.

### T10 — Cycle complet d'une demande (N) · E6
- **Objectif :** vérifier les états et le moment où les crédits sont comptés.
- **Préconditions :** JD-30 ; projet « Données et IA » demandé (EN_ATTENTE).
- **Données :** ORG, encadrant `ENC-A`.
- **Étapes :** 1. `ENC-A` accepte. 2. L'étudiant ouvre ses demandes. 3. L'étudiant accepte l'offre.
- **Résultat attendu :** après l'étape 1, l'état est OFFRE_RECUE et les crédits restent « en demande » ; l'étape 2 affiche la date du changement et « interlocuteur : ENC-A » ; après l'étape 3, l'état est CONFIRMEE et les 3 crédits passent « en cours » ; 3 `ChangementEtat` sont enregistrés.

### T11 — Expiration, sans doublon de notification (É) · E6, R7
- **Objectif :** vérifier l'expiration automatique et l'absence de doublon.
- **Préconditions :** demande au stage « Coopérative Volta » EN_ATTENTE, échéance de réponse 2026-11-10.
- **Données :** horloge de test fixée au 2026-11-11 à 01 h.
- **Étapes :** 1. Lancer le planificateur. 2. Le relancer une seconde fois.
- **Résultat attendu :** l'état est EXPIREE ; l'étudiant a **exactement une** notification « demande expirée » (même clé unique) ; la seconde exécution ne change rien.

### T12 — Transition interdite (É) · E6
- **Objectif :** vérifier qu'une demande ne peut pas sauter l'offre.
- **Préconditions :** une demande EN_ATTENTE.
- **Données :** appel `transitionner(CONFIRMEE, "E30")`.
- **Étapes :** 1. Appeler la transition directement (test unitaire de `Demande`).
- **Résultat attendu :** la transition est refusée (erreur « transition interdite ») ; l'état reste EN_ATTENTE ; aucun `ChangementEtat` n'est créé.

### T13 — Échéances : inconnue, J-7, J-8 (L) · E7
- **Objectif :** vérifier l'affichage des dates et la limite du rappel.
- **Préconditions :** CAL importé ; échéance d'abandon le 2026-11-15.
- **Données :** horloge à J-8 (2026-11-07), puis à J-7 (2026-11-08).
- **Étapes :** 1. Ouvrir la fiche du concours « Sprint de design ». 2. Lancer le planificateur à J-8. 3. Le lancer à J-7.
- **Résultat attendu :** étape 1 : « date non publiée » et la personne à contacter ; étape 2 : aucun rappel ; étape 3 : un rappel « échéance dans 7 jours » avec ses conséquences.

### T14 — Retrait expliqué puis annulé (N) · E8
- **Objectif :** vérifier que les conséquences sont présentées avant toute modification.
- **Préconditions :** JD-30 ; 15 crédits confirmés ; date d'abandon avec frais dépassée.
- **Données :** retrait de STT1700 (3 cr).
- **Étapes :** 1. Demander le retrait. 2. Lire l'écran de confirmation. 3. Cliquer « Annuler ».
- **Résultat attendu :** l'étape 2 affiche « 12 crédits après le retrait », « abandon avec frais (source : calendrier) » et les démarches au Registrariat ; après l'étape 3, le plan est identique (15 crédits, STT1700 CONFIRMEE).

### T15 — Seuil de temps plein, limite exacte (L) · E9
- **Objectif :** vérifier l'avertissement au bon seuil.
- **Préconditions :** JD-30, seuil de 12 crédits.
- **Données :** cas A : 15 → 12 crédits ; cas B : 12 → 9 crédits.
- **Étapes :** 1. Simuler le retrait du cas A. 2. Simuler le retrait du cas B.
- **Résultat attendu :** cas A : aucun avertissement de temps plein (12 n'est pas sous 12) ; cas B : « votre plan passerait sous le seuil de temps plein (9 sur 12) », avec une ressource à contacter ; **aucun** message n'annonce une perte d'aide financière.

### T16 — Intention future et crédits (N) · E10
- **Objectif :** vérifier que l'intention ne change que les crédits planifiés.
- **Préconditions :** JD-30 : acquis 3, en cours 15, planifiés 0.
- **Données :** intention IFT3395 pour l'été 2027.
- **Étapes :** 1. Planifier l'intention. 2. Consulter les compteurs.
- **Résultat attendu :** acquis 3, en cours 15, planifiés 3 ; le total « 21 » est affiché comme « projection ».

### T17 — Réexamen après synchronisation (N/L) · E11
- **Objectif :** vérifier qu'un changement marque l'intention sans la supprimer, et seulement pour la bonne session.
- **Préconditions :** intention IFT3395 pour l'été 2027.
- **Données :** cas A : la nouvelle copie Planifium n'offre plus IFT3395 à l'été 2027 ; cas B : IFT3395 est seulement complet à l'automne 2026.
- **Étapes :** 1. Synchroniser avec le cas A. 2. Remettre l'intention, puis synchroniser avec le cas B.
- **Résultat attendu :** cas A : l'intention est conservée, marquée « à réexaminer — été 2027 — n'est plus offert » et une notification est créée ; cas B : l'intention **n'est pas** marquée (une indisponibilité actuelle ne s'étend pas aux sessions futures).

### T18 — Appréciation sans effet caché (É) · E12
- **Objectif :** vérifier qu'une appréciation ne modifie pas la disponibilité en silence.
- **Préconditions :** JD-30, disponibilité 30 h.
- **Données :** appréciation 1/5 sur le projet « Données et IA ».
- **Étapes :** 1. Enregistrer l'appréciation. 2. Ouvrir le profil. 3. Refuser le changement proposé.
- **Résultat attendu :** une explication de l'effet sur les suggestions s'affiche ; la disponibilité est toujours de 30 h ; un éventuel changement proposé n'est appliqué qu'après acceptation (refusé ici, donc rien ne change).

### T19 — Alternatives à une activité complète (N) · E13
- **Objectif :** vérifier qu'une activité inaccessible propose une suite.
- **Préconditions :** JD-30.
- **Données :** IFT2255 (`enrolled` 120 = `capacity` 120), autre section connue sur un autre campus.
- **Étapes :** 1. Ouvrir IFT2255.
- **Résultat attendu :** « complet (copie du 2026-10-20) » ; au moins une alternative (autre section, autre campus ou autre session) et un interlocuteur sont affichés ; aucune équivalence non validée n'est présentée comme acquise.

### T20 — Bilan de fin de période (N) · E14
- **Objectif :** vérifier le classement du bilan.
- **Préconditions :** JD-30 en fin de session : 2 activités CONFIRMEE, 1 demande EN_ATTENTE, 1 intention « à réexaminer », 1 préalable INCONNU.
- **Données :** fin de session simulée.
- **Étapes :** 1. Demander le bilan.
- **Résultat attendu :** satisfaits = 2 activités ; incomplets = la demande en attente et les exigences restantes ; incertains = l'intention à réexaminer et le préalable inconnu.

### T21 — Autorisation refusée (É) · R5
- **Objectif :** vérifier la matrice des droits.
- **Préconditions :** demande au projet de `ENC-A` ; un autre encadrant `ENC-B` est connecté.
- **Données :** jetons valides de `ENC-B` et de `E30`.
- **Étapes :** 1. `ENC-B` tente de répondre à la demande. 2. `E30` tente de modifier le plafond du programme.
- **Résultat attendu :** les deux actions sont refusées (HTTP 403) ; la demande et la règle sont inchangées ; les deux tentatives sont journalisées.

### T22 — Places datées après synchronisation (L) · R6, E1
- **Objectif :** vérifier que les places sont affichées comme un instantané.
- **Préconditions :** la copie de IFT1025 indique 10 places libres au 2026-10-20.
- **Données :** nouvelle réponse Planifium : `enrolled` = `capacity`, `updated_at` 2026-11-03.
- **Étapes :** 1. Synchroniser. 2. Ouvrir IFT1025.
- **Résultat attendu :** « 0 place libre selon les données du 2026-11-03 » ; la copie précédente est remplacée et l'historique garde l'ancienne date.

---

## 4. Couverture

| Type | Tests |
|---|---|
| Nominal | T01, T03, T04, T09, T10, T14, T16, T17, T19, T20 |
| Limite | T06, T07, T13, T15, T17, T22 |
| Échec | T02, T05, T08, T11, T12, T18, T21 |

Toutes les exigences E1 à E14 ont au moins un test. Les révisions R5 (autorisation), R6 (synchronisation) et R7 (notifications) sont aussi testées.
