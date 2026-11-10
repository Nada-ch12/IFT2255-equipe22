# Introduction

La phase 1 a produit une analyse de la planification des études et un premier modèle de la solution : des exigences E1 à E14 rattachées aux objectifs O1 à O6, des cas d'utilisation (A1), cinq flux d'activités (A2) et une architecture C4 de niveaux 1 et 2 (A3).

La phase 2 passe de l'analyse à la conception. Ce rapport présente :

- **les révisions des artefacts de la phase 1** : les corrections demandées lors de l'évaluation et celles que la conception a révélées, chacune avec sa raison ;
- **B1**, le modèle C4 de niveau 3, avec la matrice de traçabilité des cinq flux A2 ;
- **B2**, le diagramme de classes et ses écarts avec le modèle du domaine ;
- **B3**, les spécifications de tests et leurs critères d'acceptation ;
- **B4**, le modèle de données ;
- **la défense de nos principaux choix**, puis la déclaration de l'usage des outils d'IA et la répartition du travail.

Un fil conducteur traverse tous les artefacts : **la plateforme dépend de sources qu'elle ne contrôle pas.** L'API Planifium ne comprend pas tous les textes d'exigences, ses places sont un instantané daté, et le calendrier ou le relevé peuvent être absents. Notre conception ne transforme jamais une information manquante en validation : elle la conserve avec sa date et sa provenance, et l'affiche comme incertaine.

Les sources des diagrammes (PlantUML), les fichiers de travail et le prototype de la phase 1 sont dans le dépôt : https://github.com/Nada-ch12/IFT2255-equipe22
