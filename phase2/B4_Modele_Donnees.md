# B4 — Modèle de données

Ce modèle classe les données de la plateforme selon leur rôle, indique où chaque donnée conservée est stockée, et rattache chaque regroupement à un composant de B1. Les noms de classes sont ceux de B2.

## 1. Les trois familles de données

| Famille | Définition (pour notre projet) | Durée de vie |
|---|---|---|
| **Échange** | Données qui circulent entre deux parties : application ↔ API, API ↔ Planifium, fichiers importés, courriels. | Le temps d'une requête ou d'un import. |
| **Préservation** | Données conservées d'une visite à l'autre : état, historique, copies datées des sources. | Persistantes. |
| **Présentation** | Données calculées ou mises en forme pour l'écran : badges, compteurs, messages. | Le temps de l'affichage ; recalculées à chaque fois. |

## 2. Données d'échange

| Donnée | Entre | Format | Composant B1 |
|---|---|---|---|
| Requête de demande `{activiteId}` → réponse `{demandeId, etat, resultatsRegles[]}` | Application web ↔ API | JSON / HTTPS | Routeur REST, Service Demandes |
| Aperçu de retrait `{creditsApres, frais, sousSeuilTempsPlein, demarches[]}` | API → Application web | JSON / HTTPS | Service Échéances et retraits |
| Réponse d'un encadrant `{demandeId, accepte, conditions, echeance}` | Application web → API | JSON / HTTPS | Service Demandes |
| Jeton d'identité | Fournisseur d'identité → Application web → API | OpenID Connect (JWT) | Contrôle d'accès |
| Réponse Planifium d'un cours : `requirements`, `status`, `updated_at`, `capacity`, `enrolled` | API Planifium → Client Planifium | JSON (REST) | Client Planifium |
| Relevé de notes, calendrier | Fichier → Importeur | Fichier importé | Importeur de fichiers |
| Alerte urgente | API → Service de courriel | SMTP | Service Notifications |
| Export d'horaire | API → étudiant | iCalendar (ICS) | Service Plan |

## 3. Données de préservation (conservées d'une visite à l'autre)

| Classe conservée (B2) | Où | Ce qui est gardé | Composant B1 |
|---|---|---|---|
| Etudiant, Appreciation | **Serveur** (PostgreSQL) | Profil, disponibilité, préférences, appréciations | Service Profil et suggestions |
| Relevé importé | **Serveur** (PostgreSQL) + **fichier** d'origine sur le serveur | Cours réussis, date d'import, fichier source pour la provenance | Importeur de fichiers |
| PlanSession, Case, Intention | **Serveur** | Plan, brouillon, intentions, marque « à réexaminer » | Service Plan |
| Demande, ChangementEtat | **Serveur** | État courant et **historique complet** des transitions (date, auteur) | Service Demandes |
| OffreActivite | **Serveur** | Offres publiées par les organisations (la plateforme est leur source de vérité) | Service Catalogue |
| Programme, RegleProgramme | **Serveur** | Règles **versionnées** (qui les a changées et quand) | Moteur de règles du programme |
| **CopiePlanifium** (copies des réponses de l'API) | **Serveur** | JSON brut, `updated_at` de Planifium, date d'import, statut d'analyse, marque « à vérifier » ; la copie précédente est gardée pour la comparaison | Client Planifium (produit et enregistre) ; utilisée par Service Synchronisation (compare) et Service Catalogue (affiche la date) |
| Echeance | **Serveur** | Dates importées du calendrier, avec leur source | Service Échéances et retraits |
| Notification | **Serveur** | Destinataire, événement, clé unique (anti-doublon), lue / non lue | Service Notifications |
| Utilisateur, journal | **Serveur** | Rôle de chaque compte ; journal des écritures et des refus | Contrôle d'accès |
| Jeton de session | **Navigateur** (cookie `HttpOnly`) | Identité de la session seulement, jamais de données métier | Contrôle d'accès |
| Préférences d'affichage (filtre, onglet) | **Navigateur** (`localStorage`) | Confort d'affichage uniquement ; leur perte est sans conséquence | Application web |

**Aucune donnée métier (plan, demandes, règles) n'est conservée dans le navigateur.** C'est un changement par rapport au prototype de la phase 1, qui gardait tout dans le `localStorage` : vider le navigateur effaçait le plan, et deux appareils montraient deux plans différents.

**Les copies Planifium ne sont jamais envoyées telles quelles au navigateur.** L'API les traduit d'abord en données de présentation, avec leur date.

**Toutes les données de préservation passent par les Dépôts de données**, sauf les copies et les fichiers importés, que les connecteurs écrivent directement (relations « Copies datées » et « Relevés, dates, provenance » de B1).

## 4. Données de présentation (calculées, jamais stockées)

| Donnée affichée | Calculée à partir de | Composant B1 |
|---|---|---|
| Badge d'état d'une demande (« en attente », « offre à accepter avant le… ») | Demande, ChangementEtat | Service Demandes |
| Compteurs acquis / en cours / en demande / planifiés, et « projection » | PlanSession, Intention, relevé | Service Plan |
| Résultat d'une règle (✓ satisfait, ✗ non satisfait, ? impossible à vérifier) | ResultatRegle | Moteur de règles du programme |
| « Données du 2026-10-20, à vérifier » | CopiePlanifium (`updated_at`, statut) | Service Catalogue |
| « date non publiée » | Echeance sans date | Service Échéances et retraits |
| Explication d'une suggestion | Profil + critères de classement | Service Profil et suggestions |
| Bilan satisfait / incomplet / incertain | Plan, demandes, intentions, règles | Service Bilan |

## 5. Parcours de deux données importantes, de la source à l'affichage

Figure : `diagrammes/B4-Parcours_Donnees.png` (en bleu l'échange, en vert la préservation, en orange la présentation).

### Parcours 1 — Les préalables d'un cours (IFT1025)

1. **Source (échange)** : Planifium renvoie pour IFT1025 `requirements` (`any( IFT1015, IFT1016 )`, texte « IFT1015 ou IFT1016 »), `status: "exact"` et un `schedules` vide *(Client Planifium)*.
2. **Préservation** : le Client Planifium enregistre une `CopiePlanifium` (JSON brut, date d'import, statut). Si `status` vaut `manual`, la copie est marquée « à vérifier » *(Client Planifium → base de données)*.
3. **Traitement** : quand l'étudiant demande IFT1025, `ReglePrealables` compare les exigences au relevé importé → `ResultatRegle` = SATISFAIT, NON_SATISFAIT ou INCONNU *(Moteur de règles du programme)*.
4. **Échange** : l'API renvoie `{regle: "Préalables", statut: "INCONNU", message, source: "Planifium, 2026-10-20"}` *(Routeur REST)*.
5. **Présentation** : la carte affiche « ? Préalable impossible à vérifier — données du 2026-10-20 » *(Application web)*.

Une exigence non comprise par Planifium, ou un relevé absent, arrive à l'écran comme « ? », jamais comme « ✓ ». C'est la correction de l'observation IFT1025 de la phase 1.

### Parcours 2 — L'état d'une demande (projet « Données et IA »)

1. **Source (échange)** : l'étudiant clique sur « Demander » → `POST /demandes {activiteId}` avec son jeton *(Application web → Routeur REST → Contrôle d'accès)*.
2. **Traitement** : le Service Demandes fait vérifier les contraintes par le Moteur de règles, puis crée la `Demande` à l'état EN_ATTENTE *(Service Demandes)*.
3. **Préservation** : la base enregistre `Demande` et un `ChangementEtat` (→ EN_ATTENTE, date, auteur) *(Dépôts de données)*.
4. **Événement** : l'encadrant accepte → OFFRE_RECUE ; le Service Notifications enregistre une `Notification` (clé `demande-42-OFFRE_RECUE`) et envoie un courriel *(Service Notifications)*.
5. **Présentation** : le plan affiche « Offre reçue de ENC-A le 2026-11-05 — à accepter avant le 2026-11-12 » ; les crédits restent « en demande » jusqu'à CONFIRMEE *(Application web)*.

### Parcours complémentaire — Les places disponibles et le réexamen d'une intention

`capacity` et `enrolled` d'une section (champ `schedules`) → `CopiePlanifium` → `Cours.placesDisponibles()` → « 0 place selon les données du 2026-11-03 ». La date est toujours affichée, puisque Planifium précise que les places peuvent avoir changé depuis `updated_at`. Quand `schedules` est vide (cas réel de IFT1025, IFT2255, IFT3395 et STT1700 au 2026-11-10), l'écran affiche « aucun horaire publié » : l'absence de données n'est ni « complet » ni « offert ».

**Réexamen d'une intention future (E11).** Lors de la synchronisation, `ServiceSynchronisation.comparer()` compare l'ancienne et la nouvelle `CopiePlanifium` d'un cours. Si l'offre visée par une `Intention` a changé (par exemple, le cours n'est plus offert à la session visée), le Service Plan appelle `Intention.marquerAReexaminer(motif)` : l'attribut `aReexaminer` passe à vrai et `motifReexamen` est renseigné, **sans supprimer l'intention** (préservation, serveur). Une notification est créée, et l'écran du plan affiche « à réexaminer — automne 2027 — n'est plus offert » (présentation). Une copie sans horaire publié n'est pas un changement : l'intention reste « planifiée » (voir B3, T17).
