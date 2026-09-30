/* Tests des règles et transitions du prototype (Node.js ≥ 18, aucune dépendance).
 * Lancement : node tests/run_tests.js */
var R = require("../js/rules.js");
var ok = 0, ko = 0;
function t(nom, cond, detail) { if (cond) { ok++; console.log("  ✔ " + nom); } else { ko++; console.log("  ✘ " + nom + (detail ? " — " + detail : "")); } }
function nouvelEtat(interets) { var s = R.etatInitial(); s.profil = { interets: interets || ["Logiciel", "Données et IA", "Gestion"], programmeId: "demo-a", disponibilite: 30, pratique: 50 }; return s; }
function regle(rs, id) { return rs.filter(function (r) { return r.id === id; })[0]; }

console.log("CU03 — impact avant décision (E4)");
var s = nouvelEtat();
var imp = R.impact(s, R.offre("ift1025"));
t("IFT1025 : crédits 0 → 3", imp.avant.credits === 0 && imp.apres.credits === 3);
t("IFT1025 : charge 0 → 6 h", imp.apres.heures === 6);
t("Temps plein reste « à compléter » (3/12)", regle(imp.reglesApres, "temps-plein").etat === "a-completer");
var impP = R.impact(s, R.offre("p-logiciel"));
t("Projet Lavoie : 6 crédits, 10 h", impP.apres.credits === 6 && impP.apres.heures === 10);

console.log("CU04 — dépôt et contrôle des cases (E4, E5)");
t("Dépôt IFT1025", R.deposer(s, "ift1025").ok);
t("Doublon refusé", !R.deposer(s, "ift1025").ok);
t("Dépôt IFT2255", R.deposer(s, "ift2255").ok);
t("Dépôt projet Lavoie", R.deposer(s, "p-logiciel").ok);
var p2 = R.peutDemander(s, R.offre("p-ia"));
t("Deuxième projet bloqué faute de case, raison explicite", !p2.ok && /Aucune case libre/.test(p2.raison) && p2.action === "projet");
var eng = R.totaux(s, R.ETATS_ENGAGES);
t("Engagé : 12 crédits, 22 h", eng.credits === 12 && eng.heures === 22, JSON.stringify(eng));
t("Temps plein atteint à 12 crédits (engagés)", regle(R.regles(s, eng), "temps-plein").etat === "ok");
var imp3 = R.impact(s, R.offre("ift1015"));
t("IFT1015 : 12 → 15 crédits, 22 → 28 h", imp3.apres.credits === 15 && imp3.apres.heures === 28);
R.deposer(s, "ift1015");
R.ajouterCase(s, "cours");
var imp4 = R.impact(s, R.offre("stt1700"));
t("STT1700 : 18 crédits (plafond non dépassé) mais 34 h > 30 : avertissement", imp4.bloquants.length === 0 && imp4.avertissements.some(function (r) { return r.id === "charge"; }));
var d4 = R.deposer(s, "stt1700");
t("Avertissement exige une confirmation expresse", !d4.ok && d4.aConfirmer === true);
t("Dépôt après confirmation", R.deposer(s, "stt1700", true).ok);
R.ajouterCase(s, "cours");
var imp5 = R.impact(s, R.offre("fina10200"));
t("FINA10200 : 21 crédits > 18 → bloquant", imp5.bloquants.some(function (r) { return r.id === "plafond"; }));
t("Dépôt bloqué au-delà du plafond", !R.deposer(s, "fina10200", true).ok);

console.log("Transitions et états des demandes (E6, A2.1, A2.2)");
R.avancerSemaine(s);
var d = function (id) { return s.demandes.filter(function (x) { return x.offreId === id; })[0]; };
t("Cours à inscription libre confirmé au pas suivant, avec source", d("ift1025").etat === "confirmee" && /simulée/.test(d("ift1025").historique[1].source));
t("Projet reste « demandée » sans réponse (pas de confirmation implicite)", d("p-logiciel").etat === "demandee");
t("Refus sans motif interdit", !R.repondre(s, d("p-logiciel").id, "refuser", "  ").ok);
t("Offre du responsable → « offerte »", R.repondre(s, d("p-logiciel").id, "offrir").ok && d("p-logiciel").etat === "offerte");
t("Acceptation → « confirmée »", R.accepterOffre(s, d("p-logiciel").id).ok && d("p-logiciel").etat === "confirmee");

console.log("Expiration (règle de démonstration)");
var s2 = nouvelEtat(); R.deposer(s2, "p-ia");
for (var i = 0; i < R.EXPIRATION_DEMANDE_SEMAINES; i++) R.avancerSemaine(s2);
t("Demande à approbation expirée après " + R.EXPIRATION_DEMANDE_SEMAINES + " semaines", s2.demandes[0].etat === "expiree");
t("Case libérée après expiration", R.caseLibre(s2, R.offre("p-ia")) !== null);

console.log("Offre devenue complète (E13)");
var s3 = nouvelEtat(["Économie"]);
R.avancerSemaine(s3); R.avancerSemaine(s3);
t("Kessel complet en semaine 3", s3.places["lab-kessel"] === 0);
var pk = R.peutDemander(s3, R.offre("lab-kessel"));
t("Demande refusée avec raison « Complet »", !pk.ok && pk.complet === true);
t("IFT2015 et Stage Arpent publiés en semaine 3", R.offresVisibles(s3).some(function (o) { return o.id === "ift2015"; }) && R.offresVisibles(s3).some(function (o) { return o.id === "stage-arpent"; }));

console.log("Échéances et retrait (E7, E8, A2.3)");
var s4 = nouvelEtat(); R.deposer(s4, "ift1025"); R.avancerSemaine(s4);
var dd = s4.demandes[0];
t("Semaine 2 : retrait sans frais", R.regleRetrait(s4).mode === "sans-frais");
R.avancerSemaine(s4); R.avancerSemaine(s4);
t("Semaine 4 : abandon avec frais", R.regleRetrait(s4).mode === "avec-frais");
var r1 = R.retirer(s4, dd.id);
t("Abandon avec frais exige confirmation", !r1.ok && r1.aConfirmer);
t("Demande de nouveau cours refusée après la date de modification", !R.peutDemander(s4, R.offre("ift2255")).ok);
while (s4.semaine < 11) R.avancerSemaine(s4);
t("Semaine 11 : retrait refusé (6 nov. passé)", R.regleRetrait(s4).mode === "refuse" && !R.retirer(s4, dd.id, true).ok);
var s5 = nouvelEtat(); s5.semaine = 3;
t("Semaine 3 : alerte pour le 16 sept.", R.alertes(s5).some(function (e) { return e.id === "modif"; }));

console.log("Intentions futures (E10, E11, A2.4)");
var s6 = nouvelEtat();
t("Intention Hiver 2027", R.ajouterIntention(s6, "H27", "ift3395").ok);
t("Aucune case Projet à l'hiver : intention refusée avec action", !R.ajouterIntention(s6, "H27", "p-ia").ok);
t("Une intention ne compte pas dans les crédits de session", R.totaux(s6, R.ETATS_ENGAGES).credits === 0);
R.modifierCases(s6, "H27", "cours", -3);
t("Réduction des cases : intention signalée en surplus, non supprimée", s6.intentions.length === 1 && s6.intentions[0].etat === "a-reevaluer");
R.modifierCases(s6, "H27", "cours", +1);
t("Rétablissement : intention redevient normale", s6.intentions[0].etat === "intention");
R.simulerRetraitFutur(s6, "ift3395");
t("Offre future retirée → intention à réévaluer", s6.intentions[0].etat === "a-reevaluer");
var tc = R.totalCasesFutures(nouvelEtat());
t("16 cases au total sur quatre sessions par défaut", tc.total === 16);

console.log("Suggestions et appréciations (E2, CU09)");
var s7 = nouvelEtat(); var sug = R.suggestions(s7);
t("Première suggestion liée à l'intérêt principal", sug[0].offre.interet === "Logiciel" && /principal/.test(sug[0].raisons[0]));
R.deposer(s7, "stt1700"); R.avancerSemaine(s7);
var avant = R.suggestions(s7).filter(function (x) { return x.offre.id === "ift3395"; })[0].score;
t("Appréciation positive enregistrée", R.apprecier(s7, "stt1700", 1).ok);
var apres = R.suggestions(s7).filter(function (x) { return x.offre.id === "ift3395"; })[0];
t("Score Données et IA augmenté avec raison visible", apres.score === avant + 1 && apres.raisons.some(function (r) { return /appréciations/.test(r); }));

console.log("Export (E6, E10)");
var ex = R.exporter(s);
t("Export contient légende, activités et avertissement", ex.legende && ex.activites.length >= 5 && /aucune place officielle/i.test(ex.avertissement));

console.log("Configuration des seuils par programme (E4)");
var s8 = nouvelEtat(); s8.profil.programmeId = "demo-b";
t("Programme B : temps plein à 9 crédits", /^9 crédits/.test(regle(R.regles(s8, R.totaux(s8, R.ETATS_ENGAGES)), "temps-plein").libelle));

console.log("Préalables (E3)");
var s9 = nouvelEtat();
t("Sans cours réussis déclarés : préalables « impossibles à vérifier »", R.prealables(s9, R.offre("ift1025")).statut === "inconnu");
t("« Impossible à vérifier » affiché mais non bloquant", R.deposer(s9, "ift1025").ok);
var s10 = nouvelEtat(); s10.profil.coursReussis = ["IFT1015"];
t("IFT1015 réussi : préalable d'IFT1025 satisfait", R.prealables(s10, R.offre("ift1025")).statut === "satisfait");
var pre2255 = R.prealables(s10, R.offre("ift2255"));
t("IFT1025 non réussi : préalable d'IFT2255 non satisfait, dérogation mentionnée", pre2255.statut === "non-satisfait" && /dérogation/.test(pre2255.texte));
var d2255 = R.deposer(s10, "ift2255");
t("Préalable non satisfait : dépôt seulement après confirmation expresse", !d2255.ok && d2255.aConfirmer && d2255.avertissements.some(function (r) { return r.id === "prealables"; }));
t("Dépôt possible après confirmation (dérogation à demander)", R.deposer(s10, "ift2255", true).ok);

console.log("Retrait expliqué et temps plein (E8, E9, A2.3)");
var s11 = nouvelEtat();
["ift1025", "ift2255", "ift1015"].forEach(function (id) { R.deposer(s11, id); });
R.ajouterCase(s11, "cours"); R.deposer(s11, "stt1700");
R.avancerSemaine(s11);
t("12 crédits confirmés : temps plein atteint", R.totaux(s11, ["confirmee"]).credits === 12);
var dRet = s11.demandes[0], c1 = R.retirer(s11, dRet.id);
t("Retrait sans frais : confirmation toujours exigée", !c1.ok && c1.aConfirmer === true);
t("Conséquences affichées avant la décision : 12 → 9 crédits", c1.consequences.avant.credits === 12 && c1.consequences.apres.credits === 9);
t("Alerte de passage sous le temps plein, sans annoncer de conséquence non vérifiée", c1.consequences.passeSousTempsPlein && /dépendent de votre situation/.test(c1.consequences.alerteTempsPlein));
t("Démarche officielle distincte du retrait local", /registrariat/.test(c1.consequences.demarche));
t("Sans confirmation, rien n'est modifié", dRet.etat === "confirmee");
t("Retrait après confirmation", R.retirer(s11, dRet.id, true).ok && dRet.etat === "annulee");

console.log("Types de crédits (E10)");
var s12 = nouvelEtat(); s12.profil.coursReussis = ["IFT1015", "IFT1025"];
R.ajouterIntention(s12, "H27", "ift3395");
var cp = R.creditsParType(s12);
t("Acquis 6, en cours 0, planifiés 3 : l'intention ne touche que les crédits planifiés", cp.acquis === 6 && cp.enCours === 0 && cp.planifies === 3);

console.log("Appréciations sans effet sur la disponibilité (E12)");
var s13 = nouvelEtat(); R.deposer(s13, "stt1700"); R.avancerSemaine(s13);
R.apprecier(s13, "stt1700", -1);
t("Appréciation négative : disponibilité déclarée inchangée", s13.profil.disponibilite === 30);

console.log("Alternatives et interlocuteur (E13)");
var s14 = nouvelEtat(); s14.places["p-logiciel"] = 0;
var alt = R.alternatives(s14, R.offre("p-logiciel"));
t("Offre complète : alternatives proposées, liées au même intérêt d'abord", alt.offres.length > 0 && alt.offres[0].interet === "Logiciel");
t("Interlocuteur indiqué", /Prof. Lavoie/.test(alt.interlocuteur));

console.log("Bilan de fin de période (E14)");
var b = R.bilan(s11);
t("Bilan : activités confirmées listées", b.confirmees.length === 3);
t("Bilan : temps plein incomplet signalé", b.regles.some(function (r) { return /temps plein/.test(r.libelle) && r.statut === "incomplet"; }));
while (s11.semaine < 15) R.avancerSemaine(s11);
t("Semaine 15 : bilan marqué comme terminé", R.bilan(s11).terminee === true);

console.log("\n" + ok + " réussi(s), " + ko + " échoué(s)");
process.exit(ko ? 1 : 0);
