# Révisions des artefacts de la phase 1

L'énoncé de la phase 2 demande de signaler chaque révision des artefacts de la phase 1, avec la raison qui la motive. Les révisions viennent de deux sources : l'évaluation de la phase 1 (correctrice : Roxana Pena Mendieta) et ce que la conception de la phase 2 a révélé.

## Tableau des révisions

| # | Artefact | Révision | Raison |
|---|----------|----------|--------|
| R1 | A1 – Fiches 1 et 3 | La Fiche 1 se termine maintenant sur une demande enregistrée « en attente » ; la confirmation relève de la Fiche 3. | Retour de la correctrice : la Fiche 1 annonçait « demandé puis confirmé », alors que A2.1 se termine sur « en attente ». |
| R2 | A1 – Acteurs | Ajout d'une matrice des droits : qui peut lire, créer ou modifier chaque donnée. | Retour : les droits des acteurs qui modifient des données institutionnelles ou publient des offres n'étaient pas assez précis. |
| R3 | A2.1, A2.2 | A2.1 et A2.2 sont redessinés avec les noms d'états du modèle unique ; « annulée » (offre refusée par l'étudiant) devient « déclinée ». | Retour : A2.1 devait être aligné avec la Fiche 1. En conception, nous avons vu que « annulée » désignait deux situations différentes. |
| R4 | Modèle d'états | Un seul diagramme d'états d'une demande, utilisé dans A1, A2, B1, B2, B3 et B4. | Retour : « cohérence du modèle d'états ». |
| R5 | A3 – C4 niveaux 1 et 2 | Ajout de l'authentification (fournisseur d'identité de l'Université) et de l'autorisation (contrôle d'accès dans l'API). | Retour : absentes de l'architecture cible. |
| R6 | A3 – C4 niveau 2 | Stratégie de synchronisation définie pour chaque source ; la source externe a toujours raison. | Retour : stratégie non définie. Planifium est en plus une source imparfaite (voir ci-dessous). |
| R7 | A3 – C4 niveaux 1 et 2 | Mécanisme des notifications : création, stockage sans doublon, affichage dans l'application et courriel. | Retour : mécanisme réel pas clair. |
| R8 | Exigences, A2.3, A2.5 | Les règles utilisées pour la démonstration sont vérifiées auprès des sources officielles ; chacune est marquée validée, corrigée ou hypothèse. | Retour : valider ces règles avant la phase suivante. |

---

## R1 — Fiches 1 et 3 corrigées

**Fiche 1 — Demander une activité**

- **But :** Soumettre une demande pour obtenir une place dans une activité (cours, projet, stage, séminaire) offerte pendant la session en cours.
- **Acteur principal :** personne étudiante.
- **Déclencheur :** l'étudiant clique sur « Demander » sur la carte d'une offre.
- **Préconditions :** l'étudiant est authentifié ; une case du plan correspond au type d'activité ; l'activité a au moins une place libre selon la dernière synchronisation.
- **Postcondition (succès) :** La demande est enregistrée au statut « en attente » et peut ensuite évoluer selon la réponse du tiers (Fiche 3). Les crédits et la charge s'affichent « en demande », sans être comptés comme confirmés.
- **Postcondition (échec) :** la demande n'est pas enregistrée et l'étudiant voit le motif (contrainte bloquante, case indisponible, places épuisées).
- **Dépendances :** inclut « Vérifier les contraintes du programme » (Fiche 2).

L'ancienne postcondition (« la demande passe à demandé puis à confirmé ») mélangeait deux cas d'utilisation. La confirmation dépend d'un tiers : elle n'est donc pas un résultat de la Fiche 1.

**Fiche 3 — Recevoir une réponse à une demande** (postconditions ajustées pour suivre la Fiche 1)

- **Postcondition (succès) :** la demande passe à « offre reçue », puis à « confirmée » quand l'étudiant accepte l'offre ; crédits et charge sont alors comptés comme confirmés.
- **Postcondition (échec) :** la demande passe à « refusée » (avec le motif), à « expirée » (pas de réponse avant l'échéance) ou à « déclinée » (l'étudiant refuse l'offre) ; l'étudiant est notifié.

---

## R2 — Matrice des droits des acteurs

Principe : **la plateforme ne modifie jamais une donnée institutionnelle.** Les données du Registrariat, du répertoire des cours et du calendrier sont des copies en lecture seule, avec leur provenance et leur date d'import.

| Donnée | Personne étudiante | Personne qui encadre | Laboratoires / organisations | Conseil de programme | Connecteurs d'import |
|---|---|---|---|---|---|
| Profil et relevé importé | Lire et modifier **le sien** | — | — | — | Écrire (import) |
| Plan, intentions | Créer, modifier **le sien** | — | — | — | — |
| Demande | Créer, annuler **la sienne** | Répondre aux demandes **qui lui sont adressées** | Répondre aux demandes **sur ses offres** | Lire (statistiques) | — |
| Offre (projet, stage, poste) | Lire | Créer, modifier, fermer **ses** offres | Créer, modifier, fermer **ses** offres | Lire ; retirer une offre non conforme | — |
| Règles du programme | Lire | Lire | Lire | **Seul à créer et modifier** ; chaque modification est datée et versionnée | — |
| Cours, exigences, dates officielles | Lire | Lire | Lire | Lire | **Seuls à écrire** (copie de la source) |
| Statut officiel d'inscription | Lire | — | — | — | Lire ; jamais écrit par la plateforme |

- Les comptes des organisations externes sont créés sur invitation, validée par le conseil de programme.
- Chaque écriture est journalisée (qui, quand).
- Une donnée institutionnelle qui semble fausse n'est pas corrigée dans la plateforme : elle est signalée, et l'étudiant est orienté vers la source.

---

## R3 et R4 — Modèle d'états unique et flux A2.1 / A2.2 redessinés

Figure : `diagrammes/Etats_Demande.png`, modèle d'états d'une demande.

| Artefact | Ce qu'il couvre | État de fin |
|---|---|---|
| Fiche 1 / A2.1 | Soumettre la demande après vérification des contraintes | EN_ATTENTE |
| Fiche 3 / A2.2 | Réponse du tiers et décision de l'étudiant | CONFIRMEE, REFUSEE, EXPIREE ou DECLINEE |
| Fiche 5 / A2.3 | Retrait d'une activité confirmée | RETIREE |

Figures : `diagrammes/A2-1_revise.png` et `diagrammes/A2-2_revise.png`.

Dans A2.1, un préalable « impossible à vérifier » (exigence non analysée par Planifium ou relevé absent) produit un avertissement, et jamais une validation. C'est la correction de l'observation IFT1025 de la phase 1 (S5).

---

## R5 — Authentification et autorisation

- **Niveau 1 :** nouveau système externe, le **fournisseur d'identité de l'Université** (connexion unique).
- **Niveau 2 :** l'application web redirige l'utilisateur vers le fournisseur d'identité et reçoit un jeton. À chaque requête, l'API vérifie le jeton (**authentification**), puis le rôle et le propriétaire de la donnée selon la matrice R2 (**autorisation**). Exemple : un encadrant ne peut répondre qu'aux demandes qui lui sont adressées.
- Les rôles et le journal des actions sont conservés dans la base de données.
- En phase 2, ce mécanisme devient le composant **Contrôle d'accès** (B1) et les classes `ControleAcces` et `Utilisateur` (B2).

Figures : `diagrammes/A3-C4-Niveau1_revise.png` et `diagrammes/A3-C4-Niveau2_revise.png`.

---

## R6 — Stratégie de synchronisation des données

Principe : **la source externe a toujours raison.** La plateforme garde une copie locale datée et l'affiche avec sa provenance. Si la source ne répond pas, la plateforme utilise la dernière copie et le dit (« données du 3 nov. »).

| Source | Données | Comment | Quand | Si la source est indisponible ou incomplète |
|---|---|---|---|---|
| API Planifium (répertoire des cours) | Cours, exigences (`requirements`), horaires, places | Lecture par le Client Planifium (*pull*) | Chaque nuit (planificateur) et sur demande | Dernière copie gardée et marquée « à vérifier » ; une exigence non analysée donne « inconnu », jamais « satisfait » |
| Registrariat | Relevé de notes | Fichier importé par l'étudiant | Quand l'étudiant le décide | Le relevé reste daté de son import |
| Calendrier universitaire | Dates officielles, dates d'abandon | Import de fichier | Début de session, puis chaque semaine | Une date absente s'affiche « date non publiée » |
| Offres des organisations | Places, périodes | Saisie dans la plateforme | En temps réel | La plateforme est la source de vérité |

Quand une synchronisation détecte un changement (cours retiré, offre complète), le Service Synchronisation marque les intentions touchées « à réexaminer » et crée une notification (A2.4, Fiche 10).

**Ce que le guide de l'API (section « Limites à connaître ») dit de Planifium, et notre réponse :**
- environ 90 % des textes d'exigences sont compris (`status: "exact"`) ; les autres sont `manual` ou non interprétés, et certaines conditions donnent `unknown` → résultat INCONNU, jamais SATISFAIT (E3) ;
- `prerequisite_courses` ne distingue pas le « et » du « ou » → nous utilisons `requirements` ;
- les places (`enrolled`, `capacity`) sont un instantané daté par `updated_at` → la date est toujours affichée ;
- Planifium ne gère pas les inscriptions → une confirmation dans la plateforme n'est pas une inscription officielle ;
- aucun quota ni garantie de disponibilité n'est décrit → délai maximal d'appel et repli sur la dernière copie.

---

## R7 — Mécanisme des notifications

1. **Création :** le Service Demandes crée une notification à chaque changement d'état (offre reçue, refus, expiration). Le Service Synchronisation en crée une à chaque changement d'offre, et le Service Échéances et retraits crée les rappels 7 jours avant une échéance, à l'appel du planificateur.
2. **Stockage :** chaque notification est enregistrée dans la base (destinataire, événement, clé unique, lue / non lue). La clé unique empêche les doublons quand le planificateur repasse.
3. **Livraison :** dans l'application (notifications non lues affichées à l'ouverture, puis rechargées régulièrement) et par courriel, via le service de courriel de l'Université, pour les événements urgents (offre à accepter, échéance proche, expiration).
4. **Ce qui n'est pas promis :** pas de notification instantanée (*push*). Dans le prototype, seul l'affichage dans l'application existe ; le courriel est conçu, pas réalisé.

---

## R8 — Validation des règles utilisées pour la démonstration

| Règle | Où | Source consultée | Statut |
|---|---|---|---|
| Temps plein = minimum 12 crédits par trimestre | A2.3, E9 | Règlement du baccalauréat en informatique, art. 6.3 (admission.umontreal.ca) | **Validée** |
| Plafond de 18 crédits par trimestre | Fiche 2, A2.1 | Même article 6.3 (« maximum de 18 crédits par trimestre ») | **Validée** pour le bacc en informatique ; le plafond est un paramètre de `Programme`, puisqu'il varie selon le programme |
| Plafond de 15 crédits du profil 8 h | Prototype | Aucune source universitaire | **Corrigée** : retirée. Le plafond vient du programme ; l'écart entre la charge et la disponibilité devient un avertissement séparé (`RegleChargeHebdo`) |
| Abandon avec frais après le 16 septembre | A2.3 | Calendrier universitaire A26 et Centre étudiant | **Corrigée / paramétrée** : les dates exactes varient par cours au Centre étudiant (cours intensifs ou trimestriels) ; elles sont donc traitées comme des paramètres importés (`Echeance`) et non comme des constantes fixes |
| Retrait refusé après le 6 novembre, orientation vers le Registrariat | A2.3 | Calendrier universitaire A26 et Centre étudiant | **Corrigée / paramétrée** : les dates exactes varient par cours au Centre étudiant (cours intensifs ou trimestriels) ; elles sont donc traitées comme des paramètres importés (`Echeance`) et non comme des constantes fixes |
| Alerte 7 jours avant une échéance | A2.5 | — | **Choix de conception** de l'équipe, présenté comme tel |
| Délai d'expiration d'une demande | A2.2 | Aucune règle observée (Coopérative Volta, sem. 10) | **Paramètre** : chaque demande porte son `echeanceReponse` ; aucune durée uniforme supposée |
| Préalable de IFT1025 | Fiche 2, A2.1, B3 | Réponse réelle de l'API Planifium (vérifiée le 2026-11-10) | **Corrigée** : « IFT1015 ou IFT1016 » (`any`), et non IFT1015 seul. Les préalables de IFT3395, IFT2255 et STT1700 ont aussi été vérifiés (B3) |
