/* Données de DÉMONSTRATION — fictives.
 * Elles s'inspirent des types et valeurs relevés dans le prototype de référence
 * (relevés T01–T07 de la passation) mais ne sont PAS l'offre officielle actuelle.
 * Les dates du calendrier reprennent l'AFFICHAGE du prototype de référence (T07) :
 * elles n'ont pas été vérifiées auprès du calendrier institutionnel. */
(function (root) {
  var SOURCE_REF = "Démo — inspirée du relevé du prototype de référence (T01/T06)";
  var SOURCE_FICTIVE = "Démo — donnée inventée pour illustrer un cas";

  var PROGRAMMES = {
    "demo-a": { id: "demo-a", nom: "Programme A (fictif) — seuils du prototype de référence",
      creditsTotal: 90, tempsPlein: 12, plafond: 18, minCours: 3, minBloc: 2,
      maxHorsConcentration: 1, minProjetStage: 1, uniteProgramme: "DIRO",
      source: "Seuils affichés par le prototype de référence (T01) — à valider selon le programme réel" },
    "demo-b": { id: "demo-b", nom: "Programme B (fictif) — seuils différents pour montrer la configuration",
      creditsTotal: 90, tempsPlein: 9, plafond: 15, minCours: 2, minBloc: 1,
      maxHorsConcentration: 2, minProjetStage: 0, uniteProgramme: "DIRO",
      source: "Valeurs inventées pour démontrer des règles versionnées par programme" }
  };

  function o(id, type, code, titre, unite, resp, places, credits, heures, interet, extra) {
    var x = { id: id, type: type, code: code, titre: titre, unite: unite, responsable: resp,
      places: places, credits: credits, heures: heures, interet: interet,
      mode: (type === "Cours" || type === "Séminaire" || type === "Concours") ? "libre" : "approbation",
      source: SOURCE_REF, majSemaine: 1, ouvertureSemaine: 1 };
    for (var k in (extra || {})) x[k] = extra[k];
    return x;
  }

  var OFFRES = [
    o("ift1025", "Cours", "IFT1025", "Programmation 2", "DIRO", null, 38, 3, 6, "Logiciel"),
    o("ift2255", "Cours", "IFT2255", "Génie logiciel", "DIRO", null, 34, 3, 6, "Logiciel"),
    o("ift1015", "Cours", "IFT1015", "Programmation 1", "DIRO", null, 32, 3, 6, "Logiciel"),
    o("stt1700", "Cours", "STT1700", "Introduction à la statistique", "DIRO", null, 34, 3, 6, "Données et IA"),
    o("ift3395", "Cours", "IFT3395", "Fondements de l'apprentissage machine", "DIRO", null, 24, 3, 6, "Données et IA"),
    o("fina10200", "Cours", "FINA10200", "Finance", "HEC Montréal", null, 39, 3, 6, "Gestion"),
    o("mark10100", "Cours", "MARK10100", "Introduction au marketing", "HEC Montréal", null, 29, 3, 6, "Gestion"),
    o("phy1441", "Cours", "PHY1441", "Thermodynamique", "Département de physique", null, 40, 3, 6, "Énergie"),
    o("psy2065", "Cours", "PSY2065", "Processus cognitifs 1", "Département de psychologie", null, 37, 3, 6, "Psychologie"),
    o("p-logiciel", "Projet", "PROJ-LOG", "Projet supervisé Logiciel", "DIRO", "Prof. Lavoie", 2, 6, 10, "Logiciel"),
    o("p-ia", "Projet", "PROJ-IA", "Projet supervisé Données et IA", "DIRO", "Prof. Bhattacharya", 4, 6, 10, "Données et IA"),
    o("p-gestion", "Projet", "PROJ-GES", "Projet supervisé Gestion", "HEC Montréal", "Prof. Nasser", 2, 6, 10, "Gestion"),
    o("p-reseaux", "Projet", "PROJ-SR", "Projet supervisé Systèmes et réseaux", "DIRO", "Prof. Okonkwo", 4, 6, 10, "Systèmes et réseaux"),
    o("lab-kessel", "Laboratoire", "LAB-KES", "Assistanat de recherche, Laboratoire Kessel", "Département de sciences économiques", "Laboratoire Kessel", 2, 4, 12, "Économie",
      { placesParSemaine: { 2: 1, 3: 0 } }),
    o("sem-ling", "Séminaire", "SEM-LNG", "Groupe de lecture Linguistique", "Département de linguistique et de traduction", null, 8, 1, 2, "Linguistique"),
    o("concours-demo", "Concours", "CONC-DEMO", "Concours fictif de programmation d'équipe", "Organisateur fictif", null, 20, 0, 3, "Logiciel",
      { source: SOURCE_FICTIVE, echeanceExterne: "concours" }),
    o("ift2015", "Cours", "IFT2015", "Structures de données", "DIRO", null, 36, 3, 6, "Données et IA", { ouvertureSemaine: 3 }),
    o("stage-arpent", "Stage", "STG-ARP", "Stage · Fondation Arpent", "DIRO", "Fondation Arpent", 3, 6, 16, "Données et IA", { ouvertureSemaine: 3 })
  ];
  // Évolution scriptée des places (reprend la forme observée : 38 → 33 → 29 ; Kessel 2 → 1 → complet)
  OFFRES[0].placesParSemaine = { 2: 33, 3: 29 };

  // Préalables de DÉMONSTRATION (E3). Le prototype de référence n'en vérifie aucun (S5) ;
  // ces valeurs illustrent le contrôle et restent à valider au répertoire des cours.
  var SOURCE_PREALABLES = "Démo — préalables à valider au répertoire des cours";
  var PREALABLES = { ift1025: ["IFT1015"], ift2255: ["IFT1025"], ift2015: ["IFT1025"], ift3395: ["IFT2015", "STT1700"] };
  OFFRES.forEach(function (x) { if (PREALABLES[x.id]) { x.prealables = PREALABLES[x.id]; x.sourcePrealables = SOURCE_PREALABLES; } });

  var ECHEANCES = [
    { id: "rentree", date: "2026-09-01", fin: null, libelle: "Rentrée", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "fete-travail", date: "2026-09-07", fin: null, libelle: "Fête du Travail (congé)", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "modif", date: "2026-09-16", fin: null, libelle: "Date limite de modification ou d'annulation de choix de cours", portee: "retrait-sans-frais", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "jnvr", date: "2026-09-30", fin: null, libelle: "Journée nationale de la vérité et de la réconciliation", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "concours", date: "2026-10-09", fin: null, libelle: "Inscription au concours fictif de programmation", portee: "externe", source: "Donnée inventée (organisateur fictif) pour illustrer une échéance externe" },
    { id: "action-grace", date: "2026-10-12", fin: null, libelle: "Action de grâce (congé)", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "activites-libres", date: "2026-10-19", fin: "2026-10-25", libelle: "Période d'activités libres", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "abandon", date: "2026-11-06", fin: null, libelle: "Date limite d'abandon avec frais", portee: "abandon-avec-frais", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "fin", date: "2026-12-23", fin: null, libelle: "Fin du trimestre", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" },
    { id: "conges", date: "2026-12-24", fin: "2027-01-04", libelle: "Congés", portee: "information", source: "Affichage du prototype de référence (T07) — non vérifié" }
  ];

  var SESSIONS_FUTURES = [
    { id: "H27", nom: "Hiver 2027", cases: { cours: 3, projet: 0, activite: 1 } },
    { id: "E27", nom: "Été 2027", cases: { cours: 1, projet: 1, activite: 0 } },
    { id: "A27", nom: "Automne 2027", cases: { cours: 3, projet: 1, activite: 1 } }
  ];
  var OFFRES_FUTURES = ["ift2255", "ift3395", "stt1700", "ift2015", "p-ia", "p-logiciel", "sem-ling", "fina10200"];

  var DATA = { PROGRAMMES: PROGRAMMES, OFFRES: OFFRES, ECHEANCES: ECHEANCES,
    SESSIONS_FUTURES: SESSIONS_FUTURES, OFFRES_FUTURES: OFFRES_FUTURES,
    SEMAINE1_LUNDI: "2026-08-31", NB_SEMAINES: 15, INTERETS: ["Logiciel", "Données et IA", "Gestion", "Systèmes et réseaux", "Psychologie", "Linguistique", "Économie", "Énergie"] };
  if (typeof module !== "undefined" && module.exports) module.exports = DATA; else root.DEMO_DATA = DATA;
})(this);
