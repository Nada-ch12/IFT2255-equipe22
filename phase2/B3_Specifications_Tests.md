# B3 — Spécifications de tests

Cette section contient 24 cas de test, avec des cas nominaux (N), limites (L) et d'échec (É).

> **Source des données.** IFT1025, IFT3395, IFT2255 et STT1700 proviennent des réponses réelles de l'API Planifium (vérifiées le 2026-11-10). L'API ne publie aucun horaire pour ces cours : les horaires, les places et les trois cours TST-… sont des données de test préparées au format du guide. La date « données du … » est la date d'import de la copie.

---

## 1. Critères d'acceptation par exigence

| Exigence | Critère d'acceptation vérifiable | Tests |
|---|---|---|
| E1 Offre commune | Le catalogue affiche cours **et** offres des organisations dans une même liste ; chaque activité montre type, crédits, charge, disponibilité et provenance ; une valeur absente s'affiche « inconnue ». | T01, T02 |
| E2 Suggestions expliquées | Chaque suggestion affiche au moins un critère qui l'explique ; modifier un intérêt change l'ordre ; **chaque curseur de préférence a un effet visible ou indique qu'il n'en a pas**. | T03, T22 |
| E3 Préalables | Le résultat est l'un de trois : satisfait, non satisfait, impossible à vérifier. Un relevé absent ou une condition `manual` ne donne **jamais** « satisfait » ni « non satisfait ». | T04, T05, T06 |
| E4 Contraintes avant modification | Avant l'envoi, le plafond est calculé **avec les demandes en attente** ; un dépassement est affiché et la demande n'est pas envoyée sans décision de l'étudiant. | T07, T08 |
| E5 Catégories et blocs | Chaque activité indique la catégorie à laquelle elle contribue ; les exigences restantes sont calculées par catégorie. | T09 |
| E6 États des demandes | Une demande suit uniquement les transitions du modèle d'états ; la date et l'interlocuteur du dernier changement sont affichés ; les crédits ne sont « en cours » qu'à l'état CONFIRMEE. | T10, T11, T12 |
| E7 Dates utiles | Une date inconnue s'affiche « date non publiée » ; un rappel est créé 7 jours avant une échéance connue, une seule fois. | T13 |
| E8 Retrait expliqué | Les conséquences connues (crédits, frais, temps plein) sont affichées **avant** la confirmation ; annuler ne modifie rien. | T14 |
| E9 Seuil de temps plein | Passer sous 12 crédits affiche un avertissement et une ressource à contacter, sans annoncer une perte d'aide financière. | T15 |
| E10 Types de crédits | Acquis, en cours et planifiés sont affichés séparément ; une intention ne change que les planifiés. | T16 |
| E11 Intentions à réexaminer | Un changement détecté par la synchronisation marque l'intention « à réexaminer », avec la session et le motif ; elle n'est pas supprimée ; l'absence de données n'est pas un changement. | T17 |
| E12 Effets des appréciations | Une appréciation ne modifie jamais la disponibilité déclarée sans l'accord de l'étudiant ; **son effet sur les suggestions est expliqué au moment où il se produit**. | T18, T23 |
| E13 Alternatives et conseil | Une activité inaccessible affiche au moins une alternative connue ou un interlocuteur. | T05, T19 |
| E14 Bilan final | Le bilan classe chaque élément en satisfait, incomplet ou incertain. | T20 |
| R5 Authentification et autorisation *(révision)* | Sans jeton valide, l'API refuse (401) ; un utilisateur ne peut agir que sur ses propres données, selon la matrice des droits (403). | T21, T24 |
| R6 Synchronisation *(révision)* | Les places et les cours affichés portent la date de la copie Planifium. | T02, T19 |

---

## 2. Jeux de données

Ils reprennent les profils utilisés pendant l'enquête de la phase 1.

| Jeu | Contenu |
|---|---|
| **JD-30** « Profil 30 h » | Étudiant `E30`, disponibilité 30 h/sem, programme avec plafond de 18 crédits et seuil de temps plein à 12 ; relevé importé le 2026-09-02 : IFT1015 réussi. Curseurs au milieu, intérêt principal « Logiciel ». |
| **JD-8** « Profil 8 h » | Étudiant `E8`, disponibilité 8 h/sem, plafond de 18 crédits ; **aucun relevé importé**. |
| **JD-40** « Profil 40 h » | Étudiant `E40`, 40 h/sem ; plan avec une case « Projet supervisé ou stage » libre (0 sur 1) et une case « Séminaires, concours ou stages » libre (0 sur 1). |
| **PL-COURS** (copies Planifium, format du guide) | **IFT1025** *(réponse réelle de l'API)* : « Programmation 2 », 3 cr, `requirement_text` « IFT1015 ou IFT1016 », `requirements.prerequisites` = `any( course IFT1015, course IFT1016 )`, `status: "exact"`, `equivalent_courses` et `unparsed` vides, `available_terms` automne, hiver et été, **`schedules` vide** ; copie importée le 2026-10-20. **IFT3395** *(réponse réelle)* : « Fondements de l'apprentissage machine », 3 cr, `status: "exact"`, exigence `all( IFT2125, MAT1600, any( MAT1978, all( MAT1720, STT1700 ) ) )`, équivalent IFT3390, offert **à l'automne seulement**, `schedules` vide. **IFT2255** *(réponse réelle)* : « Génie logiciel », 3 cr, `status: "exact"`, exigence IFT1025, offert automne et été, `schedules` vide. **STT1700** *(réponse réelle)* : « Introduction à la statistique », 3 cr, `status: "none"` (aucune exigence), `schedules` vide. **Cours de test** *(inventés, non Planifium)* : **TST-MAN** avec `status: "manual"` (« permission du professeur »), **TST-EQV** avec l'exigence « IFT1015 ou compétence équivalente » (`any` avec une condition `manual`), **TST-GPA** avec une moyenne minimale (`gpa` 3,0). **Horaires de test** : une section d'IFT2255 avec `capacity` 120, `enrolled` 120, `updated_at` 2026-10-20 ; l'API réelle ne publie aucun horaire pour ces cours. |
| **ORG** (offres) | Projet « Données et IA » (3 cr, 8 h, encadrant `ENC-A`) ; Stage « Fondation Arpent » (6 cr, 16 h, organisation `ORG-1`) ; Stage « Coopérative Volta » (6 cr, échéance de réponse 2026-11-10). |
| **CAL** (calendrier importé) | Abandon avec frais à partir du 2026-09-16 ; retrait refusé à partir du 2026-11-06 *(règle visée, à valider, voir R8)* ; échéance d'abandon le 2026-11-15 ; concours « Sprint de design » : **aucune date**. |

---

## 3. Cas de test

`ReglePrealables` évalue l'arbre `requirements` de la **copie datée** de Planifium, sans appeler l'API à chaque demande. La mention « même résultat que Planifium : `yes` / `no` / `unknown` » indique, à titre de repère, ce que donnerait l'évaluation de Planifium sur les mêmes données.

### T01 — Catalogue commun (N) · E1
- **Objectif :** vérifier que cours et offres apparaissent ensemble avec leurs informations.
- **Préconditions :** PL-COURS et ORG chargés ; JD-30 connecté.
- **Données :** IFT1025, STT1700, projet « Données et IA » ; la charge de STT1700 est absente.
- **Étapes :** 1. Ouvrir le catalogue. 2. Filtrer sur « toutes les activités ».
- **Résultat attendu :** les 3 activités sont dans la même liste, avec type, crédits et provenance (« Planifium, copie importée le 2026-10-20 » ou « organisation ») ; la charge de STT1700 s'affiche « inconnue » ; IFT1025 indique « aucun horaire publié » (son `schedules` est vide).

### T02 — Planifium indisponible (É) · E1, R6
- **Objectif :** vérifier que le catalogue reste utilisable avec la dernière copie quand la source ne répond pas.
- **Préconditions :** une copie de IFT1025 datée du 2026-10-20 existe ; Planifium ne répond pas (délai dépassé).
- **Données :** PL-COURS.
- **Étapes :** 1. Lancer la synchronisation. 2. Ouvrir la fiche de IFT1025.
- **Résultat attendu :** aucune erreur pour l'étudiant ; la fiche affiche « copie importée le 2026-10-20, à vérifier » ; la copie n'est ni effacée ni remplacée.

### T03 — Suggestions expliquées (N) · E2
- **Objectif :** vérifier qu'une suggestion est expliquée et suit les intérêts.
- **Préconditions :** JD-30, intérêt « données » sélectionné.
- **Données :** ORG, PL-COURS.
- **Étapes :** 1. Ouvrir les suggestions. 2. Remplacer l'intérêt « données » par « robotique ». 3. Rouvrir les suggestions.
- **Résultat attendu :** à l'étape 1, chaque suggestion affiche au moins un critère (ex. « correspond à votre intérêt : données ») ; à l'étape 3, l'ordre des suggestions a changé.

### T04 — Préalable satisfait (N) · E3
- **Objectif :** vérifier qu'un préalable réussi permet la demande.
- **Préconditions :** JD-30 (IFT1015 réussi) ; case Cours libre.
- **Données :** IFT1025 (`any` IFT1015 / IFT1016, `exact`).
- **Étapes :** 1. Demander IFT1025.
- **Résultat attendu :** `ReglePrealables` → SATISFAIT (même résultat que Planifium : `yes`) ; la demande est créée à l'état EN_ATTENTE ; les 3 crédits s'affichent « en demande ».

### T05 — Préalable manquant (É) · E3, E13
- **Objectif :** vérifier qu'un préalable non réussi bloque la demande (cas IFT1025 observé en phase 1).
- **Préconditions :** relevé de JD-30 modifié pour ne contenir que MAT1978.
- **Données :** cas A : IFT1025 ; cas B : IFT3395 (arbre imbriqué : `all( IFT2125, MAT1600, any( MAT1978, all( MAT1720, STT1700 ) ) )`), avec un relevé contenant IFT2125, MAT1600 et MAT1720.
- **Étapes :** 1. Cas A : demander IFT1025. 2. Cas B : demander IFT3395 ; puis ajouter STT1700 au relevé et recommencer.
- **Résultat attendu :** cas A : NON_SATISFAIT (même résultat que Planifium : `no`), message « préalable manquant : IFT1015 ou IFT1016 » tiré de `missing_courses` ; **aucune demande n'est créée** ; au moins une alternative est proposée. Cas B : NON_SATISFAIT, le message désigne la branche non satisfaite (MAT1978, ou STT1700 avec MAT1720) ; après l'ajout de STT1700, SATISFAIT.

### T06 — Préalable impossible à vérifier (L) · E3
- **Objectif :** vérifier qu'une donnée manquante ou non interprétable ne devient jamais une validation, ni un refus.
- **Préconditions :** JD-8 (aucun relevé) pour le cas A ; JD-30 pour les cas B, C et D.
- **Données :** cas A : IFT1025 ; cas B : cours de test TST-MAN (condition `manual`) ; cas C : cours de test TST-EQV (« IFT1015 ou compétence équivalente ») ; cas D : cours de test TST-GPA (moyenne minimale 3,0), sans moyenne fournie.
- **Étapes :**
  1. Cas A : JD-8 demande IFT1025.
  2. Cas B : JD-30 demande TST-MAN.
  3. Cas C : retirer IFT1015 du relevé de JD-30 et demander le cours du cas C ; puis remettre IFT1015 et recommencer.
  4. Cas D : JD-30 (aucune moyenne enregistrée) demande le cours du cas D.
- **Résultat attendu :**
  - Cas A : la plateforme (`Etudiant.estReleveComplet()` est faux) **ne traite pas l'absence de relevé comme une liste vide** (une liste vide donnerait « non » dans Planifium) ; résultat INCONNU, « relevé non importé : préalable impossible à vérifier » ; la demande peut être envoyée avec cet avertissement.
  - Cas B : INCONNU (même résultat que Planifium : `unknown`) ; le texte « permission du professeur » est affiché dans les points à vérifier (`to_verify`).
  - Cas C : sans IFT1015, INCONNU (et **non** NON_SATISFAIT) ; avec IFT1015, SATISFAIT.
  - Cas D : INCONNU, « moyenne non fournie : condition à vérifier » ; la plateforme n'invente pas de moyenne.
  - Dans aucun cas le résultat n'est affiché « satisfait » quand une information manque.

### T07 — Exactement au plafond (L) · E4
- **Objectif :** vérifier qu'atteindre le plafond n'est pas un dépassement.
- **Préconditions :** JD-30 ; 15 crédits confirmés ; aucune demande en attente.
- **Données :** STT1700 (3 cr).
- **Étapes :** 1. Demander STT1700.
- **Résultat attendu :** 15 + 3 = 18 = plafond → `ReglePlafondCredits` SATISFAIT ; STT1700 n'a aucune exigence (statut `none`), donc `ReglePrealables` ne bloque pas ; demande EN_ATTENTE ; aucun avertissement de plafond.

### T08 — Dépassement avec demandes en attente (É) · E4
- **Objectif :** vérifier que les demandes en attente comptent dans le plafond (correction de l'observation 25/18).
- **Préconditions :** JD-30 ; 15 crédits confirmés + IFT1025 (3 cr) EN_ATTENTE.
- **Données :** STT1700 (3 cr).
- **Étapes :** 1. Demander STT1700. 2. Choisir « garder en brouillon ».
- **Résultat attendu :** l'étape 1 affiche « 21 crédits sur un plafond de 18 (dont 3 en attente) » et **aucune demande n'est envoyée** ; à l'étape 2, un brouillon est enregistré **dans le plan** (ce n'est pas un état de `Demande`), la contrainte reste visible et le statut « brouillon » est affiché.

### T09 — Catégorie d'un stage (N) · E5
- **Objectif :** vérifier qu'un stage compte dans la catégorie annoncée (cas Fondation Arpent, phase 1).
- **Préconditions :** JD-40 ; case « Projet supervisé ou stage » libre (0 sur 1) ; case « Séminaires, concours ou stages » libre (0 sur 1).
- **Données :** Stage « Fondation Arpent ».
- **Étapes :** 1. Ouvrir la fiche du stage. 2. Demander le stage. 3. Faire confirmer la demande.
- **Résultat attendu :** le bouton « Demander » est actif ; la fiche indique « contribue à : Projet supervisé ou stage » ; après la confirmation, cette catégorie passe de « 0 sur 1 » à « 1 sur 1 » et la catégorie « Séminaires, concours ou stages » reste à « 0 sur 1 ».

### T10 — Cycle complet d'une demande (N) · E6
- **Objectif :** vérifier les états et le moment où les crédits sont comptés.
- **Préconditions :** JD-30 ; projet « Données et IA » demandé (EN_ATTENTE).
- **Données :** ORG, encadrant `ENC-A`.
- **Étapes :** 1. `ENC-A` accepte. 2. L'étudiant ouvre ses demandes. 3. L'étudiant accepte l'offre.
- **Résultat attendu :** après l'étape 1, l'état est OFFRE_RECUE et les crédits restent « en demande » ; l'étape 2 affiche la date du changement et « interlocuteur : ENC-A » ; après l'étape 3, l'état est CONFIRMEE et les 3 crédits passent « en cours » ; 3 `ChangementEtat` sont enregistrés au total (création, offre reçue, confirmée).

### T11 — Expiration, sans doublon de notification (É) · E6, R7
- **Objectif :** vérifier l'expiration automatique et l'absence de doublon.
- **Préconditions :** demande au stage « Coopérative Volta » EN_ATTENTE, échéance de réponse 2026-11-10.
- **Données :** horloge de test fixée au 2026-11-11 à 01 h.
- **Étapes :** 1. Lancer le planificateur. 2. Le relancer une seconde fois.
- **Résultat attendu :** l'état est EXPIREE ; l'étudiant a **exactement une** notification « demande expirée » (même clé unique) ; la seconde exécution ne change rien.

### T12 — Transition interdite (É) · E6
- **Objectif :** vérifier qu'une demande ne peut pas sauter l'offre.
- **Préconditions :** une demande EN_ATTENTE.
- **Données :** tentative de transition vers CONFIRMEE par un appel direct à `Demande.transitionner`.
- **Étapes :** 1. Appeler la transition directement (test unitaire de `Demande`).
- **Résultat attendu :** la transition est refusée (erreur « transition interdite ») ; l'état reste EN_ATTENTE ; aucun `ChangementEtat` n'est créé.

### T13 — Échéances : inconnue, J-8, J-7, répétition (L) · E7
- **Objectif :** vérifier l'affichage des dates et la limite du rappel.
- **Préconditions :** CAL importé ; échéance d'abandon le 2026-11-15.
- **Données :** horloge à J-8 (2026-11-07), puis à J-7 (2026-11-08).
- **Étapes :** 1. Ouvrir la fiche du concours « Sprint de design ». 2. Lancer le planificateur à J-8. 3. Le lancer à J-7. 4. Le relancer une seconde fois à J-7.
- **Résultat attendu :** étape 1 : « date non publiée » et la personne à contacter ; étape 2 : aucun rappel ; étape 3 : un rappel « échéance dans 7 jours » avec ses conséquences ; étape 4 : toujours **un seul** rappel.

### T14 — Retrait expliqué, annulé, puis refusé après le 6 novembre (N/L) · E8
- **Objectif :** vérifier que les conséquences sont présentées avant toute modification, et le comportement visé après la date limite.
- **Préconditions :** JD-30 ; 15 crédits confirmés ; STT1700 CONFIRMEE.
- **Données :** retrait de STT1700 (3 cr) ; cas A : horloge au 2026-10-15 (après l'abandon avec frais, avant le 6 novembre) ; cas B : horloge au 2026-11-09.
- **Étapes :** cas A : 1. Demander le retrait. 2. Lire l'écran de confirmation. 3. Cliquer « Annuler ». Cas B : 4. Demander le retrait.
- **Résultat attendu :** cas A, étape 2 : « 12 crédits après le retrait », « abandon avec frais (source : calendrier) » et les démarches au Registrariat ; après l'étape 3, le plan est identique (15 crédits, STT1700 CONFIRMEE). Cas B : le retrait est **refusé** et l'étudiant est orienté vers le Registrariat *(règle visée, à valider ; le prototype retirait sans confirmation)*.

### T15 — Seuil de temps plein, limite exacte (L) · E9
- **Objectif :** vérifier l'avertissement au bon seuil.
- **Préconditions :** JD-30, seuil de 12 crédits.
- **Données :** cas A : 15 → 12 crédits ; cas B : 12 → 9 crédits.
- **Étapes :** 1. Simuler le retrait du cas A. 2. Simuler le retrait du cas B.
- **Résultat attendu :** cas A : aucun avertissement de temps plein (12 n'est pas sous 12) ; cas B : « votre plan passerait sous le seuil de temps plein (9 sur 12) », avec une ressource à contacter ; **aucun** message n'annonce une perte d'aide financière.

### T16 — Intention future et crédits (N) · E10
- **Objectif :** vérifier que l'intention ne change que les crédits planifiés.
- **Préconditions :** JD-30 : acquis 3, en cours 15, planifiés 0.
- **Données :** intention IFT3395 pour l'automne 2027 (IFT3395 n'est offert qu'à l'automne).
- **Étapes :** 1. Planifier l'intention. 2. Consulter les compteurs.
- **Résultat attendu :** acquis 3, en cours 15, planifiés 3 ; le total « 21 » est affiché comme « projection ».

### T17 — Réexamen après synchronisation (N/L) · E11
- **Objectif :** vérifier qu'un changement marque l'intention sans la supprimer, seulement pour la bonne session, et que l'absence de données n'est pas un changement.
- **Préconditions :** intention IFT3395 pour l'automne 2027 ; la copie précédente (horaires de test) listait une section de IFT3395 à l'automne 2027.
- **Données :** cas A : la nouvelle copie ne liste plus de section de IFT3395 à l'automne 2027 ; cas B : IFT3395 est seulement complet à l'automne 2026 ; cas C : la nouvelle copie ne contient **aucun horaire** pour l'automne 2027 (offre pas encore publiée ; c'est l'état réel actuel de l'API, qui ne publie aucun horaire pour ces cours).
- **Étapes :** 1. Synchroniser avec le cas A. 2. Remettre l'intention, puis synchroniser avec le cas B. 3. Remettre l'intention, puis synchroniser avec le cas C.
- **Résultat attendu :** cas A : l'intention est conservée, marquée « à réexaminer — automne 2027 — n'est plus offert » et une notification est créée ; cas B : l'intention **n'est pas** marquée (une indisponibilité actuelle ne s'étend pas aux sessions futures) ; cas C : l'intention reste « planifiée », non marquée, avec la mention « offre non publiée » (aucune donnée n'est traitée comme un retrait).

### T18 — Appréciation sans effet caché (É) · E12
- **Objectif :** vérifier qu'une appréciation ne modifie pas la disponibilité en silence.
- **Préconditions :** JD-30, disponibilité 30 h.
- **Données :** appréciation « Peu pertinent » sur le projet « Données et IA ».
- **Étapes :** 1. Enregistrer l'appréciation. 2. Ouvrir le profil. 3. Refuser le changement proposé.
- **Résultat attendu :** une explication de l'effet sur les suggestions s'affiche ; la disponibilité est toujours de 30 h ; un éventuel changement proposé n'est appliqué qu'après acceptation (refusé ici, donc rien ne change).

### T19 — Alternatives à une activité complète (N) · E13
- **Objectif :** vérifier qu'une activité inaccessible propose une suite.
- **Préconditions :** JD-30.
- **Données :** IFT2255 (section avec `capacity` 120 et `enrolled` 120), autre section connue sur un autre campus.
- **Étapes :** 1. Ouvrir IFT2255. 2. Simuler une synchronisation où la section garde `enrolled` = `capacity` avec `updated_at` 2026-11-03, puis rouvrir IFT2255.
- **Résultat attendu :** étape 1 : « complet (copie du 2026-10-20) » ; au moins une alternative (autre section, autre campus ou autre session) et un interlocuteur sont affichés ; aucune équivalence non validée n'est présentée comme acquise. Étape 2 : « complet selon les données du 2026-11-03 » ; la date affichée a changé et l'historique garde l'ancienne copie.

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

### T22 — Chaque curseur a un effet, ou le dit (É) · E2
- **Objectif :** vérifier qu'aucun curseur de préférence n'est ignoré en silence (en phase 1, « Expérience de travail » n'avait aucun effet observable).
- **Préconditions :** JD-30 avec les trois curseurs (Concentration, Approche, Expérience de travail) au milieu ; au moins 6 activités dans ORG et PL-COURS, dont des stages et des projets.
- **Données :** suggestions de départ notées (ordre complet).
- **Étapes :** 1. Noter l'ordre des suggestions. 2. Mettre « Concentration » à « Se concentrer » et noter l'ordre. 3. Remettre au milieu, mettre « Approche » à « Pratique et appliqué » et noter l'ordre. 4. Remettre au milieu, mettre « Expérience de travail » à « Prioritaire » et noter l'ordre.
- **Résultat attendu :** pour **chacun** des trois curseurs, soit l'ordre change et un critère l'explique, soit un message indique que ce curseur n'a pas d'effet sur les suggestions actuelles et pourquoi. Un curseur sans changement **et** sans message est un échec du test. Avec « Expérience de travail » à « Prioritaire », les stages et projets passent avant les cours.

### T23 — Portée d'une appréciation « Peu pertinent » (N) · E12
- **Objectif :** vérifier qu'une appréciation sur une seule activité explique tout effet sur les autres (constat S11).
- **Préconditions :** JD-30 ; intérêt principal « Logiciel » ; IFT1025 suivi ; au moins 3 autres offres liées à « Logiciel » dans les suggestions.
- **Données :** appréciation « Peu pertinent » sur IFT1025, puis « Charge trop lourde » (seule) sur une autre activité suivie.
- **Étapes :** 1. Noter l'ordre. 2. Donner « Peu pertinent » à IFT1025. 3. Lire le message et noter l'ordre. 4. Donner « Charge trop lourde » seule à l'autre activité. 5. Lire le message et noter l'ordre.
- **Résultat attendu :** à l'étape 3, si les autres offres de « Logiciel » reculent, le message le dit explicitement (« les offres liées à Logiciel sont moins suggérées ») ; à l'étape 5, soit l'ordre change avec une explication, soit le message indique que cette appréciation n'a pas d'effet sur le classement. Aucun changement d'ordre sans explication.

### T24 — Authentification : jeton absent ou expiré (É) · R5
- **Objectif :** vérifier que l'API refuse toute requête non authentifiée.
- **Préconditions :** API démarrée ; plan de `E30` existant.
- **Données :** requête de lecture du plan de `E30` : sans jeton ; avec un jeton expiré ; avec un jeton valide.
- **Étapes :** 1. Envoyer la requête sans jeton. 2. L'envoyer avec le jeton expiré. 3. L'envoyer avec le jeton valide de `E30`.
- **Résultat attendu :** étapes 1 et 2 : HTTP 401, aucune donnée du plan dans la réponse, tentatives journalisées, l'application web renvoie l'utilisateur vers la connexion ; étape 3 : HTTP 200 avec le plan de `E30`.

---

## 4. Couverture

| Type | Tests |
|---|---|
| Nominal | T01, T03, T04, T09, T10, T14, T16, T17, T19, T20, T23 |
| Limite | T06, T07, T13, T14, T15, T17 |
| Échec | T02, T05, T08, T11, T12, T18, T21, T22, T24 |

T14 et T17 combinent deux types (ils sont comptés dans les deux lignes). Toutes les exigences E1 à E14 ont au moins un test. Les révisions R5 (authentification et autorisation), R6 (synchronisation) et R7 (notifications) sont aussi testées.
