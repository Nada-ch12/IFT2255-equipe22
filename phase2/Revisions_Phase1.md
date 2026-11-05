# Révisions de la phase 1 — Équipe 22

> L'énoncé de la phase 2 demande de **signaler chaque révision dans le rapport, avec sa raison**.
> Ce document donne (1) le tableau des révisions à mettre dans le rapport et (2) le texte corrigé, prêt à coller.
> Source : `correction_Equipe22.md` (Roxana Pena Mendieta, 29 oct.).

---

## 0. Tableau des révisions (à mettre tel quel au début du rapport de la phase 2)

| # | Artefact | Révision | Raison |
|---|----------|----------|--------|
| R1 | A1 – Fiche 1 | Nouveau but et nouvelle postcondition de succès : la demande est enregistrée « en attente » ; la confirmation relève de la Fiche 3. | Retour de la correctrice ; la fiche contredisait A2.1, qui se termine sur « en attente ». |
| R2 | A1 – Acteurs | Ajout d'une matrice des droits par acteur (qui peut créer, modifier ou seulement lire chaque donnée). | Retour : les droits des acteurs qui modifient les données institutionnelles ou publient des offres n'étaient pas assez précis. |
| R3 | A2.1 / A2.2 | Vérification de l'alignement avec la Fiche 1 : A2.1 se termine sur « en attente », A2.2 couvre la suite (offre, confirmation, expiration). | Retour : incohérence du modèle d'états entre A1 et A2. |
| R4 | Modèle d'états | Une seule liste d'états pour une demande, utilisée partout (A1, A2, C4, B2, B3). | Retour : « cohérence du modèle d'états ». |
| R5 | A3 – C4 N1 et N2 | Ajout de l'authentification et de l'autorisation (fournisseur d'identité, contrôle des rôles dans l'API). | Retour : manquait dans l'architecture cible. |
| R6 | A3 – C4 N2 | Stratégie de synchronisation des données, définie pour chaque source. | Retour : stratégie non définie. |
| R7 | A3 – C4 N2 | Mécanisme réel des notifications : où elles sont créées, stockées et envoyées. | Retour : mécanisme pas clair. |
| R8 | Exigences / A2 | Les règles utilisées seulement pour la démonstration sont listées avec leur source officielle et leur statut (validée / à valider). | Retour : valider ces règles avant la phase suivante. |

---

## R1 — Fiche 1, version corrigée

**Fiche 1 — Demander une activité**

- **But :** Soumettre une demande pour obtenir une place dans une activité (cours, projet, stage, séminaire) offerte pendant la session en cours.
- **Acteur principal :** personne étudiante.
- **Déclencheur :** l'étudiant clique sur « Demander » sur la carte d'une offre.
- **Préconditions :** l'étudiant est authentifié ; une case du plan correspond au type d'activité ; l'activité a au moins une place libre selon la dernière synchronisation.
- **Postcondition (succès) :** La demande est enregistrée au statut « en attente » et peut ensuite évoluer selon la réponse du tiers (voir Fiche 3). Les crédits et la charge s'affichent comme « en demande », sans être comptés comme confirmés.
- **Postcondition (échec) :** la demande n'est pas enregistrée et l'étudiant voit le motif (contrainte bloquante, case indisponible, places épuisées).
- **Dépendances :** inclut « Vérifier les contraintes du programme » (Fiche 2). La suite de la demande (offre, confirmation, refus, expiration) relève de la Fiche 3.

> Changement par rapport à la phase 1 : l'ancienne postcondition (« la demande passe à demandé puis à confirmé ») mélangeait deux cas d'utilisation. La confirmation dépend d'un tiers ; elle n'est donc pas un résultat de la Fiche 1.

**À ajuster aussi dans la Fiche 3** (pour que les deux fiches se suivent) :
- **Postcondition (succès) :** la demande passe à « offre reçue », puis à « confirmée » quand l'étudiant accepte l'offre ; crédits et charge sont alors comptés comme confirmés.
- **Postcondition (échec) :** la demande passe à « refusée » (avec le motif) ou à « expirée » (sans réponse avant l'échéance) ; l'étudiant est notifié.

---

## R2 — Matrice des droits des acteurs (à ajouter dans 5.1.1)

Principe : **la plateforme ne modifie jamais une donnée institutionnelle.** Les données du Registrariat, du répertoire des cours et du calendrier sont des **copies en lecture seule**, avec leur provenance et leur date d'import.

| Donnée | Personne étudiante | Personne qui encadre | Laboratoires / organisations | Conseil de programme | Connecteurs d'import |
|---|---|---|---|---|---|
| Profil et relevé importé | Lire et modifier **le sien** (import du relevé) | — | — | — | Écrire (import) |
| Plan, intentions | Créer, modifier **le sien** | — | — | — | — |
| Demande | Créer, annuler **la sienne** | Lire et répondre aux demandes **qui lui sont adressées** | Lire et répondre aux demandes **sur ses offres** | Lire (statistiques) | — |
| Offre (projet, stage, poste) | Lire | Créer, modifier, fermer **ses** offres | Créer, modifier, fermer **ses** offres | Lire ; retirer une offre non conforme | — |
| Règles du programme (préalables, plafond, blocs) | Lire seulement | Lire | Lire | **Seul à créer et modifier** ; chaque modification est datée et versionnée | — |
| Cours, préalables, dates officielles | Lire | Lire | Lire | Lire | **Seuls à écrire** (copie de la source) |
| Statut officiel d'inscription | Lire | — | — | — | Lire au Registrariat ; jamais écrit par la plateforme |

Règles complémentaires :
- Les comptes des laboratoires et organisations externes sont créés sur invitation, validée par le conseil de programme.
- Chaque action d'écriture enregistre qui l'a faite et quand (journal).
- Une donnée institutionnelle qui semble fausse n'est pas corrigée dans la plateforme : elle est signalée, et l'étudiant est orienté vers la source (Registrariat, répertoire).

---

## R3 et R4 — Modèle d'états d'une demande (une seule version pour tout le rapport)

```
en attente ──► offre reçue ──► confirmée
    │               │
    │               └──► déclinée (l'étudiant refuse l'offre)
    ├──► refusée   (le tiers refuse)
    ├──► expirée   (pas de réponse avant l'échéance)
    └──► annulée   (l'étudiant retire sa demande)
```

| Artefact | Ce qu'il couvre | État de fin |
|---|---|---|
| Fiche 1 / A2.1 | Soumettre la demande après vérification des contraintes | « en attente » |
| Fiche 3 / A2.2 | Réponse du tiers et décision de l'étudiant | « confirmée », « refusée », « expirée » ou « déclinée » |
| Fiche 5 / A2.3 | Retrait d'une activité confirmée | activité retirée |

**Vérification faite :** le texte de A2.1 se termine déjà sur « demande enregistrée au statut en attente » et le texte de A2.2 commence à « en attente » : ils sont maintenant alignés avec la nouvelle Fiche 1.
**À vérifier dans Visual Paradigm :** que le **diagramme** A2.1 (`A2__FLUX-1.vpp`) et le diagramme A2.2 utilisent exactement ces noms d'états (pas « demandé », pas « confirmé » dans A2.1). Le mot « annulée » dans A2.2 (offre refusée par l'étudiant) devient « déclinée » pour ne pas le confondre avec une annulation par l'étudiant.

---

## R5 — Authentification et autorisation (C4)

**Niveau 1 :** ajouter un système externe **« Fournisseur d'identité de l'Université »** (connexion unique, SSO).
Relation : *Plateforme → Fournisseur d'identité : vérifie l'identité de l'utilisateur (OpenID Connect / HTTPS).*

**Niveau 2 :**
- L'**application web** redirige l'utilisateur vers le fournisseur d'identité, puis reçoit un jeton de session.
- L'**API REST** contient le contrôle d'accès : à chaque requête, elle vérifie le jeton (**authentification**), puis le rôle et la propriété de la donnée selon la matrice R2 (**autorisation**). Exemple : un encadrant ne peut répondre qu'aux demandes qui lui sont adressées.
- La **base de données** conserve les rôles de chaque compte et le journal des actions.
- Les comptes externes (organisations) se connectent par un compte invité, créé selon R2.

Relation à ajouter : *Application web → Fournisseur d'identité : connexion de l'utilisateur (OpenID Connect).*

> Pour la phase 2 : ce contrôle d'accès devient un **composant nommé** dans le C4 niveau 3 de l'API (B1) et une classe dans B2.

---

## R6 — Stratégie de synchronisation des données

Principe : **la source externe a toujours raison.** La plateforme garde une copie locale, datée, et l'affiche avec sa provenance. Si la source ne répond pas, la plateforme utilise la dernière copie et l'indique (« données du 3 nov. »).

| Source | Données | Comment | Quand | Si la source est indisponible ou incomplète |
|---|---|---|---|---|
| Répertoire des cours (API Planifium, `https://planifium-api.onrender.com/api/v1`) | Cours, exigences (`requirements`), horaires et places | Lecture par les connecteurs (tirage, *pull*) | Chaque nuit, déclenché par le planificateur ; aussi sur demande | Dernière copie gardée et marquée « à vérifier » ; un préalable absent reste « inconnu », jamais « satisfait » |
| Registrariat | Relevé de notes | Import d'un fichier par l'étudiant | Quand l'étudiant le décide | Le relevé reste à la date de son import, affichée |
| Calendrier universitaire | Dates officielles, dates d'abandon | Import de fichier | Au début de la session, puis vérification chaque semaine | Une date absente est affichée « date non publiée » |
| Offres des organisations | Places, périodes | Saisies directement dans la plateforme | En temps réel | La plateforme est la source de vérité |

Quand une synchronisation détecte un changement (cours retiré, offre complète), l'API **réexamine les intentions et les plans** touchés et crée une notification (lien avec A2.4 et la Fiche 10).

Ce que le guide de l'API du cours (section « Limites à connaître ») dit de Planifium, et comment on en tient compte :
- environ 90 % des textes d'exigences sont compris (`status: "exact"`) ; les autres sont `manual` ou non interprétés, et certaines conditions donnent `unknown` → la plateforme affiche « impossible à vérifier », jamais « satisfait » (E3) ;
- `prerequisite_courses` ne distingue pas le « et » du « ou » → on utilise `requirements` ;
- les places (`enrolled`, `capacity`) sont un instantané daté par `updated_at` → on affiche toujours la date ;
- Planifium ne gère pas les inscriptions → une confirmation dans la plateforme n'est pas une inscription officielle ;
- aucun quota ni garantie de disponibilité n'est décrit → délai maximal d'appel et repli sur la dernière copie.

Diagrammes révisés : `diagrammes/A3-C4-Niveau1_revise.png` et `diagrammes/A3-C4-Niveau2_revise.png` (R5, R6, R7) ; `diagrammes/A2-1_revise.png` et `diagrammes/Etats_Demande.png` (R3, R4).

---

## R7 — Mécanisme des notifications

1. **Création :** l'API crée une notification à chaque changement d'état d'une demande (offre reçue, refus, expiration) et à chaque changement détecté par la synchronisation. Le planificateur crée les rappels d'échéance (7 jours avant) et fait expirer les demandes.
2. **Stockage :** chaque notification est enregistrée dans la base (destinataire, événement, date, lue / non lue). Un même événement ne crée qu'une notification (pas de doublon si le planificateur repasse).
3. **Livraison :**
   - **dans l'application** : l'application web affiche les notifications non lues à l'ouverture et les recharge régulièrement ;
   - **par courriel** : l'API envoie un courriel par le **service de courriel de l'Université** (nouveau système externe au niveau 1) pour les événements urgents (offre à accepter, échéance proche, expiration).
4. **Ce qui n'est pas promis :** pas de notification instantanée (*push*). Le prototype ne fait que l'affichage dans l'application ; le courriel reste conçu, pas réalisé.

Relations à ajouter au niveau 2 : *API → Service de courriel : envoie les alertes (SMTP)* ; *Planificateur → API : crée les rappels d'échéance*.

---

## R8 — Règles utilisées seulement pour la démonstration (à valider)

| Règle utilisée | Où | Source officielle à consulter | Statut |
|---|---|---|---|
| Plafond de crédits par session (18 en profil 30 h, 15 en profil 8 h) | Prototype, Fiche 2, A2.1 | Règlement des études de premier cycle UdeM | À valider : la règle qui lie plafond et disponibilité n'est pas établie |
| Temps plein = 12 crédits ou plus | A2.3, règle affichée | Règlement des études ; Aide financière | À valider |
| Abandon avec frais après le 16 septembre | A2.3 | Calendrier universitaire A26 | À valider (date et libellé « avec / sans frais ») |
| Retrait refusé après le 6 novembre, orientation vers le Registrariat | A2.3 | Calendrier universitaire A26 | À valider |
| Alerte 7 jours avant une échéance | A2.5, planificateur | Choix de conception de l'équipe | Choix de conception : à présenter comme tel, pas comme une règle de l'Université |
| Délai d'expiration d'une demande sans réponse | A2.2, planificateur | Aucune règle observée (Coopérative Volta, sem. 10) | Paramètre configurable ; aucune durée fixe supposée |
| Préalables de IFT1025 et autres cours testés | Fiche 2, A2.1 | Répertoire des cours / API Planifium | À valider avec la source |

Pour chaque ligne, noter dans le rapport : **validée** (avec le lien vers la source) ou **hypothèse** (et pourquoi).
