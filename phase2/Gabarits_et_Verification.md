# Gabarits et liste de vérification — Phase 2

## 1. Plan du rapport de la phase 2 (gabarit)

1. Page titre : équipe 22, membres, matricules, lien GitHub
2. **Révisions de la phase 1** : tableau R1 à R8 (révision + raison) → `Revisions_Phase1.md`
3. **B1 — C4 niveau 3**
   - Conteneur décomposé et justification
   - Diagramme
   - Tableau composant / responsabilité / exigences
   - Matrice de traçabilité des 5 flux A2
4. **B2 — Diagramme de classes**
   - Modèle du domaine (rappel)
   - Vue principale (15 classes au plus)
   - Classes absentes du domaine (au moins 3)
   - Écarts expliqués (au moins 2)
   - Où vivent les règles du programme
   - Correspondance classes ↔ composants B1
   - Annexe
5. **B3 — Spécifications de tests**
   - Critères d'acceptation par exigence
   - Jeux de données
   - 15 à 25 cas
   - Tableau de couverture
6. **B4 — Modèle de données**
   - Échange / préservation / présentation
   - Où est conservée chaque donnée (y compris les copies de Planifium)
   - Deux parcours de données
   - Rattachement aux composants B1
7. **Défense des choix** : les décisions importantes et ce qu'on a sacrifié
8. **Déclaration de l'usage de l'IA** (obligatoire)
9. Répartition du travail

## 2. Gabarit d'un cas de test (B3)

```
### Txx — <titre> (N / L / É) · <exigence>
- Objectif :
- Préconditions :
- Données :
- Étapes : 1. … 2. …
- Résultat attendu : (vérifiable : une valeur, un état, un message exact)
```

## 3. Gabarit de la déclaration de l'IA

| Outil | Usage | Artefacts touchés | Ce que l'équipe a vérifié ou modifié |
|---|---|---|---|
| Claude (Anthropic) | Brouillons des révisions de la phase 1 et des artefacts B1 à B4 ; rendu PlantUML des diagrammes | Tous | *À remplir par chaque membre : ce qui a été relu, changé ou refait* |
| PlantUML | Rendu des diagrammes à partir du code source | B1, B2, A2.1, C4 | — |

> L'énoncé interdit une conception ou des tests **purement générés**. Il faut donc que la dernière colonne montre un vrai travail de l'équipe (choix modifiés, tests ajoutés ou retirés, noms ajustés).

## 4. Liste de vérification de la cohérence (20 % de la note)

### Noms communs
- [ ] Les états d'une demande sont **identiques** partout : EN_ATTENTE, OFFRE_RECUE, CONFIRMEE, REFUSEE, EXPIREE, DECLINEE, ANNULEE, RETIREE (A1, A2, B1, B2, B3, B4).
- [ ] Les noms des composants de B1 = les noms des paquetages de B2 = les composants cités dans B4.
- [ ] Les noms des acteurs sont les mêmes qu'en phase 1 (A1 et C4 niveau 1).

### B1
- [ ] Chaque composant a **une phrase** de responsabilité.
- [ ] **Chaque relation** a une étiquette.
- [ ] Les 5 flux (A2.1 à A2.5) sont dans la matrice, d'un composant à l'autre.
- [ ] Le choix du conteneur décomposé est justifié.
- [ ] Le C4 niveau 3 est cohérent avec le C4 niveau 2 révisé (mêmes conteneurs et systèmes externes).

### B2
- [ ] 15 classes au plus dans la vue principale ; le reste en annexe.
- [ ] Types, signatures et multiplicités partout.
- [ ] Au moins 3 classes absentes du modèle du domaine, nommées dans le texte.
- [ ] Au moins 2 écarts expliqués (quoi + pourquoi).
- [ ] Plafond, préalables et blocs sont chacun dans une classe identifiable.
- [ ] Chaque classe correspond à un composant de B1.

### B3
- [ ] Entre 15 et 25 cas.
- [ ] Au moins un critère d'acceptation **vérifiable** pour chaque exigence E1 à E14.
- [ ] Chaque cas a : objectif, exigence, préconditions, données, étapes, résultat attendu.
- [ ] Il y a des cas nominaux, limites **et** d'échec.
- [ ] Les jeux de données sont décrits et réalistes.
- [ ] Les noms de classes ou d'états cités dans les tests existent dans B2.

### B4
- [ ] Chaque donnée est classée : échange, préservation ou présentation.
- [ ] Pour chaque classe conservée : où (navigateur, serveur, fichier).
- [ ] Les copies des réponses de Planifium sont traitées explicitement.
- [ ] Au moins 2 parcours de données, de la source à l'affichage.
- [ ] Chaque regroupement est rattaché à un composant de B1.

### Rapport
- [ ] Chaque révision de la phase 1 est signalée avec sa raison.
- [ ] Les diagrammes de la phase 1 sont mis à jour (A2.1, C4 niveaux 1 et 2).
- [ ] La déclaration de l'IA est présente et honnête.
- [ ] La question hebdomadaire a été posée avant le 10 novembre.
