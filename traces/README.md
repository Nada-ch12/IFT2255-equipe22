# Traces d'enquête

Sessions exportées du prototype de référence *Mon cheminement* et captures d'écran, séparées par personne.

**Convention de nommage** (fiche d'assemblage) : `Pn_<scénario>_S<semaine sur 2 chiffres>`.
Une capture et l'export pris au même moment de la même simulation portent le même nom (`.png` ↔ `.json`).

| Dossier | Personne | Thème | État |
|---|---|---|---|
| `P1/` | Nada Chiki | Cours, préalables, retrait, clôture, parcours réel | Captures et exports déposés (voir `P1/README.md`) |
| `P2/` | Ismail Mohib | Encadrants et traitement des demandes | Captures et exports déposés (voir `P2/README.md`) |
| `P3/` | Hamza Khalil | Préférences et planification multi-sessions | Exports déposés (`json/`) |
| `P4/` | Mohamed Driss | Contraintes : crédits, charge, temps plein, stages, concours, calendrier | Captures et exports déposés |

## P4 — correspondance captures / exports

Trois simulations distinctes, jouées le 29 septembre 2026 par un script de test automatisé (Playwright + Microsoft Edge ; voir la section « Outils d'assistance » du README principal).

| Profil | Scénario | Semaine | Capture | Export |
|---|---|---|---|---|
| 30 h (Logiciel, Données et IA ; 6/2/3) | Profil initial | S00 | `P4_Profil30h_S00.png` | `P4_Profil30h_S01.json` |
| 30 h | Plafond atteint, avertissement non bloquant | S02 | `P4_Plafond30h_S02_avant.png`, `..._carte.png` | `P4_Plafond30h_S02_avant.json` |
| 30 h | Plafond dépassé (25/18 cr.) | S03 | `P4_Plafond30h_S03_apres.png` | `P4_Plafond30h_S03_apres.json` |
| 30 h | Avant retrait (après le 6 nov.) | S11 | `P4_TempsPlein30h_S11_avant.png`, `..._plan.png` | `P4_TempsPlein30h_S11_avant.json` |
| 30 h | Après retraits : 7/12 cr., sans alerte | S11 | `P4_TempsPlein30h_S11_apres.png` | `P4_TempsPlein30h_S11_apres.json` |
| 8 h (Robotique, Énergie ; 2/2/3) | Charge 32 h pour 8 h | S04 | `P4_Charge8h_S04.png` | `P4_Charge8h_S04.json` |
| 40 h (Systèmes et réseaux, Techno. et société ; 3/0/3) | Fiche concours sans date | S03 | `P4_Concours40h_S03_fiche.png` | (dans `P4_Stage40h_S05_avant.json`) |
| 40 h | Stage refusé, cases Séminaire libres | S05 | `P4_Stage40h_S05_avant.png`, `..._plan.png` | `P4_Stage40h_S05_avant.json` |
| 40 h | Calendrier sans concours | S05 | `P4_Calendrier40h_S05.png` | — |
| 40 h | Case Projet ajoutée : stage accessible | S05 | `P4_Stage40h_S05_apres.png` | `P4_Stage40h_S05_apres.json` |
| 40 h | Stage confirmé dans la case Projet | S06 | `P4_Stage40h_S06_confirme.png` | `P4_Stage40h_S06_confirme.json` |
