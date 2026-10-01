# Cheminement — Plateforme de planification des études

**IFT2255 — Génie logiciel · Automne 2026 · Équipe 22 · Phase 1 (analyse, exigences et conception)**

## À quoi sert le projet

Choisir ses cours ne se limite pas au répertoire : une personne étudiante doit aussi composer avec des projets supervisés, des stages, des séminaires et des concours, des places limitées, des préalables, des plafonds de crédits, un seuil de temps plein et des dates limites qui se découvrent souvent trop tard.

À partir de l'analyse du prototype de référence *Mon cheminement*, nous concevons une plateforme qui :
- rassemble l'offre éparpillée (O1) et l'explique selon le profil de la personne (O2) ;
- rend les contraintes visibles **avant** la décision : crédits, charge, temps plein, préalables, catégories (O3) ;
- tient compte du temps : états des demandes, places, échéances (O4) ;
- permet de planifier plusieurs sessions sans confondre intention et réservation (O5) ;
- indique les alternatives et les bons interlocuteurs quand une activité est inaccessible (O6).

Ce dépôt contient le **prototype démonstratif** de notre solution, les **sources des diagrammes** (A1, A2, A3), les **traces d'enquête** et le **rapport**.

## Contenu du dépôt

| Dossier | Contenu |
|---|---|
| `prototype/` | Application web du système visé (HTML/CSS/JavaScript, aucune dépendance) et ses tests |
| `diagrammes/A1/` | Diagramme de cas d'utilisation (source et image) |
| `diagrammes/A2/` | Cinq diagrammes d'activités (sources Visual Paradigm `.vpp` et images) |
| `diagrammes/A3/` | Modèle C4, niveaux 1 et 2 (sources Visual Paradigm et images) |
| `traces/P1` à `traces/P4/` | Sessions exportées (JSON) et captures du prototype de référence, par personne |
| `rapport/` | Rapport d'analyse et de conception (PDF remis) |

## État d'avancement

Le prototype n'est pas évalué pour son étendue fonctionnelle : il rend **observables** nos décisions de conception. Chaque comportement est rattaché à une exigence du rapport (E1 à E14).

### Ce qui fonctionne

| Fonctionnalité | Exigence | Observation qui la justifie (prototype de référence) |
|---|---|---|
| Profil : jusqu'à 3 intérêts, programme, disponibilité, façon d'apprendre, cours déjà réussis | E2 | — |
| Catalogue commun : cours, projets, laboratoires, stages, séminaires, concours, avec provenance | E1 | Offre de six types dans le prototype |
| Suggestions classées avec leurs **raisons** affichées | E2 | Effet des préférences peu lisible ; un curseur sans effet visible (P3) |
| **Impact avant décision** : crédits, charge, temps plein, plafond, bloc, hors intérêts ; plafond bloquant, charge soumise à confirmation expresse | E4 | Dépassements acceptés sans blocage (P4 : 25/18 cr., 32/8 h) |
| **Préalables** : satisfait / non satisfait / impossible à vérifier ; dérogation mentionnée | E3 | IFT1025 confirmé sans préalable (P1) |
| Cases par catégorie ; raison et action corrective quand une demande est impossible | E5 | Stage refusé malgré des cases « stages » libres (P4) |
| **États des demandes** horodatés et sourcés : demandée, offerte, confirmée, refusée (motif obligatoire), expirée, annulée | E6 | Attente, offre, confirmation, expiration (P2) |
| Échéances datées et sourcées, alerte 7 jours avant | E7 | Concours sans date, absents du calendrier (P4) |
| **Retrait expliqué** : conséquences calculées avant la décision, confirmation obligatoire, annulation possible, refus après la date d'abandon | E8 | Retrait immédiat, sans confirmation, après le 6 nov. (P4) |
| **Alerte de passage sous le temps plein**, sans annoncer de conséquence non vérifiée | E9 | 28 → 7 cr. sans explication (P4) |
| Crédits **acquis / en cours / planifiés** affichés séparément ; projection | E10 | Intention comptée dans le cumul (P3) |
| Intentions futures « aucune place réservée », signalées **à réévaluer** si l'offre change | E11 | Intention maintenue malgré une offre complète (P3) |
| Appréciations : effet sur le classement seulement, jamais sur la disponibilité | E12 | Une appréciation baissait la disponibilité, donc le plafond (P4) |
| **Alternatives** et interlocuteur quand une offre est complète | E13 | Offre « complet » sans alternative affichée ; parcours réel de P1 résolu grâce au SAFIR |
| **Bilan de fin de période** : satisfait, incomplet, incertain | E14 | Aucun bilan à la semaine 15 (P1) |
| Export HTML (lisible) et JSON, avec légende des états | E6, E10 | — |

### Ce qui est simulé

Le prototype fonctionne **hors connexion, sans serveur** : tout s'exécute dans le navigateur.
- **Données fictives** : catalogue, places, préalables et seuils de programme sont des valeurs de démonstration (préalables et dates à valider au répertoire et au calendrier officiels).
- **Tiers simulés** : réponses de la scolarité (inscription libre) et des responsables (onglet « Vue responsable »), évolution des places, horloge (bouton « Avancer d'une semaine »).
- **Règles de démonstration** : expiration d'une demande après 3 semaines, d'une offre après 1 semaine ; retrait sans frais jusqu'au 16 sept., avec frais jusqu'au 6 nov., refusé ensuite. Ces règles ne reproduisent pas un règlement officiel vérifié.

### Ce qui reste à faire (phases suivantes)

- Architecture cible du C4 niveau 2 (voir ci-dessous) : API REST, base de données, planificateur, connecteurs d'import, authentification.
- Import réel du relevé de notes et du catalogue ; règles de programme versionnées réelles.
- Onglet « Personnes et lieux » (disponibilité des encadrants) et version anglaise.

### Architecture visée (C4 niveau 2) et prototype

Le prototype ne met **pas** en œuvre les technologies du C4 niveau 2 : il en simule la logique dans le navigateur, pour être lancé sans installation. L'écart est volontaire.

| Conteneur du C4 niveau 2 | Technologie visée | Dans le prototype |
|---|---|---|
| Application web | React | `index.html`, `js/app.js` (JavaScript sans cadriciel) |
| API REST | Node.js, Express | `js/rules.js` : règles et transitions d'état, en logique pure testable sous Node (réutilisable côté serveur) |
| Base de données | PostgreSQL | Stockage local du navigateur (`localStorage`), repli en mémoire |
| Planificateur | cron | Bouton « Avancer d'une semaine » : expirations, places, alertes |
| Connecteurs d'import | Node.js | Données fictives de `js/data.js` (catalogue, préalables, calendrier) |
| Registrariat, répertoire des cours, calendrier universitaire | Systèmes externes | Simulés ; provenance affichée sur chaque donnée |

## Installer et lancer le prototype

**Prérequis** : un navigateur récent (Chrome, Edge ou Firefox). Aucune installation, aucune dépendance.

```bash
git clone https://github.com/Nada-ch12/IFT2255-equipe22.git
cd IFT2255-equipe22/prototype
```

Puis **ouvrir `prototype/index.html`** dans le navigateur (double-clic). Ou, avec un serveur local :

```bash
python -m http.server 8000
```

et ouvrir <http://localhost:8000>. Le bouton « Réinitialiser la démo » efface l'état, conservé dans le stockage local du navigateur.

### Tests

```bash
cd prototype
node tests/run_tests.js
```

Node.js 18 ou plus : **65 tests** des règles et transitions (65 réussis avec Node 22.16).

Scénario complet dans un vrai navigateur (facultatif) :

```bash
pip install playwright
python tests/e2e_scenario.py
```

**21 vérifications** (21 réussies ; utilise Chromium ou, à défaut, Microsoft Edge).

### Scénario de démonstration (environ 5 minutes)

1. Profil : choisir Logiciel (principal), Données et IA, Gestion ; indiquer éventuellement « IFT1015 » dans les cours réussis ; **Commencer la planification**.
2. **Offres** : ouvrir « Voir l'impact et demander » sur IFT1025, puis sur le projet supervisé Logiciel ; comparer avant / après ; lire les préalables ; déposer.
3. Déposer IFT2255 et IFT1015 ; ajouter une case Cours ; ouvrir l'impact de STT1700 : charge 34 h > 30 h, **confirmation expresse** exigée. FINA10200 serait **bloqué** (plafond).
4. **Avancer d'une semaine** : les cours sont confirmés (scolarité simulée), le projet reste « Demandée ».
5. **Vue responsable** : un refus sans motif est impossible ; « Offrir une place », puis **Mes demandes** : accepter l'offre.
6. **Mes demandes → Retirer** : les conséquences (crédits, charge, temps plein, règle de date, démarche) s'affichent **avant** la décision ; annuler ou confirmer.
7. **Sessions futures** : déposer IFT3395 à l'hiver 2027 : « aucune place réservée » ; les crédits planifiés apparaissent à part dans le plan.
8. Avancer jusqu'à la semaine 3 : alerte du 16 sept. ; filtre Laboratoire : Kessel complet, avec **alternatives et interlocuteur**.
9. **Bilan**, puis **Exporter** (HTML et JSON).

## Équipe et répartition du travail

| Membre | Matricule | Analyse du prototype (phase 1) | Production après la réunion |
|---|---|---|---|
| Nada Chiki | 20261599 | P1 — cours, préalables, retrait, clôture, parcours réel ; diagramme A2.1 | Modèle C4 (A3), niveaux 1 et 2 |
| Ismail Mohib | 20274803 | P2 — encadrants et traitement des demandes ; diagramme A2.2 | Base du rapport, diagrammes A2 (Visual Paradigm), prototype initial |
| Hamza Khalil | 20259237 | P3 — préférences et planification multi-sessions ; diagramme A2.4 | Assemblage du rapport PDF et intégration des diagrammes A1, A2, A3 |
| Mohamed Driss | 20205703 | P4 — contraintes (crédits, charge, temps plein, stages, concours, calendrier) ; diagramme A2.3 | Prototype (adaptation au rapport final), dépôt GitHub, README, traces, release |

Parties communes, faites en réunion : A1, A2.5, tableau exigences–objectifs, questions au conseiller, sources.

## Outils d'assistance logicielle utilisés

Déclarés conformément à l'énoncé. L'enquête (manipulation du prototype, parcours réels, questions au conseiller) relève de l'équipe ; les outils ont servi à structurer, coder et rédiger.

| Outil | Utilisé par | Pour quelles parties |
|---|---|---|
| **ChatGPT (OpenAI)** et **Claude (Anthropic, Sonnet 5.5)**, 29–30 sept. 2026 | Ismail Mohib | Code initial du prototype et de ses tests ; base de rédaction du rapport ; organisation et reformulation des résultats de ses tests (demandes, encadrants) ; résumé des observations et vérification de leur cohérence avec les captures et exports ; aide à la structure des diagrammes A1, A2, A3 (idées de flux, cohérence avec le rapport) ; raccourcissement de textes. Faits par lui et l'équipe : tests du prototype, captures et exports, décisions de conception, réalisation et vérification finales des diagrammes, questions au conseiller et autres sources d'enquête |
| **Claude (Anthropic, Claude Code)** | Mohamed Driss | Exploration guidée du prototype de référence ; scripts de test automatisés (Playwright) ayant rejoué les simulations P4 et produit les captures et exports de `traces/P4/` ; adaptation du prototype au rapport final (E3, E8, E9, E10, E12, E13, E14) et nouveaux tests ; rédaction de ce README et des blocs P4 ; corrections du diagramme A2.3 dans Visual Paradigm |
| **Playwright + Microsoft Edge** | Mohamed Driss | Rejeu automatisé des scénarios P4 (captures et exports) ; test de bout en bout du prototype |
| **Visual Paradigm** | Équipe | Diagrammes A1, A2, A3 |
| Autres outils | [à compléter par chaque membre] | |
