/* Module de règles et de transitions d'état — logique pure, sans DOM.
 * Correspond aux conteneurs « Service de règles », « Moteur de suggestions » et
 * « API applicative » du C4 niveau 2, exécutés localement pour la démonstration.
 * Les règles de retrait, d'expiration et de confirmation sont des RÈGLES DE DÉMONSTRATION
 * [PROPOSÉ] : elles ne reproduisent pas un règlement officiel vérifié. */
(function (root) {
  var D = (typeof module !== "undefined" && module.exports) ? require("./data.js") : root.DEMO_DATA;

  var ETATS_ENGAGES = ["demandee", "offerte", "confirmee"];
  var LIBELLES_ETAT = { vide: "Vide", demandee: "Demandée", offerte: "Offerte", confirmee: "Confirmée",
    refusee: "Refusée", expiree: "Expirée", annulee: "Annulée", declinee: "Déclinée" };
  var EXPIRATION_DEMANDE_SEMAINES = 3;   // règle de démonstration
  var EXPIRATION_OFFRE_SEMAINES = 1;     // règle de démonstration
  var SEUIL_ALERTE_JOURS = 7;

  function offre(id) { for (var i = 0; i < D.OFFRES.length; i++) if (D.OFFRES[i].id === id) return D.OFFRES[i]; return null; }
  function programme(state) { return D.PROGRAMMES[(state.profil && state.profil.programmeId) || "demo-a"]; }

  function lundiSemaine(w) { var d = new Date(D.SEMAINE1_LUNDI + "T12:00:00"); d.setDate(d.getDate() + 7 * (w - 1)); return d; }
  function isoDate(d) { return d.toISOString().slice(0, 10); }
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function fmtDate(iso) { var d = new Date(iso + "T12:00:00"); return d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear(); }
  function joursEntre(isoA, isoB) { return Math.round((new Date(isoB + "T12:00:00") - new Date(isoA + "T12:00:00")) / 86400000); }
  function aujourdHui(state) { return isoDate(lundiSemaine(state.semaine)); }

  function etatInitial() {
    var places = {};
    D.OFFRES.forEach(function (o) { places[o.id] = o.places; });
    return {
      version: 1, profil: null, semaine: 1,
      cases: [{ id: "c1", type: "cours" }, { id: "c2", type: "cours" }, { id: "c3", type: "cours" },
              { id: "c4", type: "projet" }, { id: "c5", type: "activite" }],
      demandes: [], places: places, intentions: [], appreciations: {}, journal: [],
      sessionsFutures: JSON.parse(JSON.stringify(D.SESSIONS_FUTURES)), retraitsFuturs: {}, seq: 1
    };
  }
  function nid(state, p) { state.seq = (state.seq || 1) + 1; return p + state.seq; }
  function log(state, texte, source) { state.journal.unshift({ semaine: state.semaine, texte: texte, source: source || "Simulation" }); }

  function typesCase(o) {
    if (o.type === "Cours") return ["cours"];
    if (o.type === "Projet" || o.type === "Laboratoire") return ["projet"];
    if (o.type === "Stage") return ["projet", "activite"];
    return ["activite"];
  }
  var NOM_CASE = { cours: "Cours", projet: "Projet, laboratoire ou stage", activite: "Séminaire, concours ou stage" };

  function demandeSurCase(state, caseId) {
    for (var i = 0; i < state.demandes.length; i++) {
      var d = state.demandes[i];
      if (d.caseId === caseId && ETATS_ENGAGES.indexOf(d.etat) >= 0) return d;
    }
    return null;
  }
  function caseLibre(state, o) {
    var types = typesCase(o);
    for (var i = 0; i < state.cases.length; i++) {
      var c = state.cases[i];
      if (types.indexOf(c.type) >= 0 && !demandeSurCase(state, c.id)) return c;
    }
    return null;
  }
  function ajouterCase(state, type) { var c = { id: nid(state, "c"), type: type }; state.cases.push(c); log(state, "Case ajoutée : " + NOM_CASE[type] + ".", "Action de la personne étudiante"); return c; }
  function retirerCase(state, caseId) {
    if (demandeSurCase(state, caseId)) return { ok: false, raison: "Cette case contient une demande ou une activité : annulez-la ou retirez-la d'abord." };
    state.cases = state.cases.filter(function (c) { return c.id !== caseId; });
    return { ok: true };
  }

  function offresVisibles(state) { return D.OFFRES.filter(function (o) { return o.ouvertureSemaine <= state.semaine; }); }

  function horsInterets(state, o) { return !state.profil || !o.interet || state.profil.interets.indexOf(o.interet) < 0; }
  function dansBloc(state, o) { return o.type === "Cours" && state.profil && o.interet === state.profil.interets[0]; }
  function projetStageProgramme(state, o) { return (o.type === "Projet" || o.type === "Laboratoire" || o.type === "Stage") && o.unite === programme(state).uniteProgramme; }

  function totaux(state, etats, supplement, exclureDemandeId) {
    var t = { credits: 0, heures: 0, cours: 0, bloc: 0, hors: 0, projetStage: 0, activites: [] };
    var ids = state.demandes.filter(function (d) { return etats.indexOf(d.etat) >= 0 && d.id !== exclureDemandeId; }).map(function (d) { return d.offreId; });
    if (supplement) ids.push(supplement.id);
    ids.forEach(function (id) {
      var o = offre(id); if (!o) return;
      t.credits += o.credits; t.heures += o.heures; t.activites.push(o.code);
      if (o.type === "Cours") t.cours++;
      if (dansBloc(state, o)) t.bloc++;
      if (horsInterets(state, o)) t.hors++;
      if (projetStageProgramme(state, o)) t.projetStage++;
    });
    return t;
  }

  function regles(state, t) {
    var p = programme(state), dispo = state.profil ? state.profil.disponibilite : 30;
    var principal = state.profil ? state.profil.interets[0] : "—";
    function min(id, lib, v, s, note) { return { id: id, libelle: lib, valeur: v, seuil: s, sens: "min", etat: v >= s ? "ok" : "a-completer", bloquant: false, note: note || "" }; }
    function max(id, lib, v, s, bloq, note) { return { id: id, libelle: lib, valeur: v, seuil: s, sens: "max", etat: v <= s ? "ok" : "depasse", bloquant: bloq && v > s, note: note || "" }; }
    return [
      min("cours", "Au moins " + p.minCours + " cours", t.cours, p.minCours),
      min("bloc", "Au moins " + p.minBloc + " cours du bloc " + principal, t.bloc, p.minBloc),
      min("temps-plein", p.tempsPlein + " crédits ou plus pour le temps plein", t.credits, p.tempsPlein,
          "Sous ce seuil, le statut à temps plein peut changer (aide financière) — conséquence à valider auprès d'une source officielle."),
      max("plafond", "Au plus " + p.plafond + " crédits", t.credits, p.plafond, true, "Règle de démonstration : le dépassement bloque la demande."),
      max("charge", "Charge de " + dispo + " h/sem ou moins (votre disponibilité)", t.heures, dispo, false, "Avertissement : la demande reste possible après confirmation expresse."),
      max("hors", "Au plus " + p.maxHorsConcentration + " activité hors de vos intérêts", t.hors, p.maxHorsConcentration, false, "Avertissement non bloquant."),
      min("projet", "Au moins " + p.minProjetStage + " projet ou stage dans le programme", t.projetStage, p.minProjetStage)
    ];
  }

  function echeanceAVenir(state, portee) {
    var today = aujourdHui(state);
    for (var i = 0; i < D.ECHEANCES.length; i++) { var e = D.ECHEANCES[i]; if (e.portee === portee) return e; }
    return null;
  }
  function statutEcheance(state, e) {
    var today = aujourdHui(state), fin = e.fin || e.date;
    var j = joursEntre(today, e.date), jf = joursEntre(today, fin);
    if (jf < 0) return { code: "passee", libelle: "Passée", jours: j };
    if (j <= 6 && jf >= 0) return { code: "proche", libelle: j <= 0 ? "En cours / aujourd'hui" : "Cette semaine (dans " + j + " j)", jours: j };
    return { code: "a-venir", libelle: "À venir (dans " + j + " j)", jours: j };
  }
  function alertes(state) {
    return D.ECHEANCES.filter(function (e) { var s = statutEcheance(state, e); return e.portee !== "information" && s.code !== "passee" && s.jours <= SEUIL_ALERTE_JOURS; });
  }

  function regleRetrait(state) {
    var today = aujourdHui(state), modif = echeanceAVenir(state, "retrait-sans-frais"), ab = echeanceAVenir(state, "abandon-avec-frais");
    if (joursEntre(today, modif.date) >= 0) return { mode: "sans-frais", echeance: modif, texte: "Retrait sans frais jusqu'au " + fmtDate(modif.date) + "." };
    if (joursEntre(today, ab.date) >= 0) return { mode: "avec-frais", echeance: ab, texte: "Date de modification passée (" + fmtDate(modif.date) + ") : abandon avec frais possible jusqu'au " + fmtDate(ab.date) + ". Les frais exacts sont à vérifier auprès du règlement." };
    return { mode: "refuse", echeance: ab, texte: "Date limite d'abandon passée (" + fmtDate(ab.date) + ") : retrait refusé. Consultez la personne ressource de votre programme." };
  }

  /* E3 — préalables : satisfait, non satisfait ou impossible à vérifier.
   * « Impossible à vérifier » n'est jamais présenté comme une admissibilité certaine. */
  function prealables(state, o) {
    if (!o.prealables || !o.prealables.length) return { statut: "aucun", manquants: [], texte: "" };
    var reussis = (state.profil && state.profil.coursReussis) || [];
    if (!reussis.length) return { statut: "inconnu", manquants: o.prealables.slice(),
      texte: "Préalables " + o.prealables.join(", ") + " : impossible à vérifier (aucun cours réussi déclaré dans le profil)." };
    var manq = o.prealables.filter(function (c) { return reussis.indexOf(c) < 0; });
    if (!manq.length) return { statut: "satisfait", manquants: [], texte: "Préalables satisfaits : " + o.prealables.join(", ") + "." };
    return { statut: "non-satisfait", manquants: manq,
      texte: "Préalable non satisfait : " + manq.join(", ") + ". Une dérogation peut être demandée au responsable du programme (décision humaine, hors système)." };
  }

  /* Vérifie si une demande est possible ; renvoie la raison et l'action corrective sinon (E5, E13). */
  function peutDemander(state, o) {
    if (!state.profil) return { ok: false, raison: "Configurez d'abord votre profil." };
    if (o.ouvertureSemaine > state.semaine) return { ok: false, raison: "Offre pas encore publiée." };
    for (var i = 0; i < state.demandes.length; i++) {
      var d = state.demandes[i];
      if (d.offreId === o.id && ETATS_ENGAGES.indexOf(d.etat) >= 0) return { ok: false, raison: "Déjà " + LIBELLES_ETAT[d.etat].toLowerCase() + " dans votre plan.", doublon: true };
    }
    if ((state.places[o.id] || 0) <= 0) return { ok: false, raison: "Complet : plus aucune place (mise à jour semaine " + state.semaine + ", source : " + o.source + ")." , complet: true };
    if (o.type === "Cours") {
      var modif = echeanceAVenir(state, "retrait-sans-frais");
      if (joursEntre(aujourdHui(state), modif.date) < 0) return { ok: false, raison: "La date limite de modification des choix de cours (" + fmtDate(modif.date) + ") est passée. Règle de démonstration à valider." };
    }
    if (!caseLibre(state, o)) {
      var types = typesCase(o).map(function (t) { return NOM_CASE[t]; }).join(" ou ");
      return { ok: false, raison: "Aucune case libre de type « " + types + " » dans votre plan. Une case = une place visée ; vous pouvez ajouter une case pour déposer une autre candidature.", action: typesCase(o)[0] };
    }
    return { ok: true };
  }

  /* CU03 — impact projeté avant toute décision (E4), préalables compris (E3). */
  function impact(state, o) {
    var avant = totaux(state, ETATS_ENGAGES), apres = totaux(state, ETATS_ENGAGES, o);
    var ra = regles(state, avant), rb = regles(state, apres);
    var bloquants = rb.filter(function (r) { return r.bloquant; });
    var avert = rb.filter(function (r) { return !r.bloquant && r.etat === "depasse"; });
    var pre = prealables(state, o);
    if (pre.statut === "non-satisfait") avert.push({ id: "prealables", libelle: pre.texte, valeur: pre.manquants.join(", "), seuil: "", sens: "", etat: "depasse", bloquant: false, note: "" });
    var lie = null;
    if (o.echeanceExterne) lie = D.ECHEANCES.filter(function (e) { return e.id === o.echeanceExterne; })[0];
    else if (o.type === "Cours") lie = echeanceAVenir(state, "retrait-sans-frais");
    return { avant: avant, apres: apres, reglesAvant: ra, reglesApres: rb, bloquants: bloquants, avertissements: avert, prealables: pre, echeanceLiee: lie };
  }

  /* CU04 — dépôt, avec revérification au moment du dépôt. */
  function deposer(state, offreId, confirmeAvertissements) {
    var o = offre(offreId), p = peutDemander(state, o);
    if (!p.ok) return { ok: false, raison: p.raison };
    var imp = impact(state, o);
    if (imp.bloquants.length) return { ok: false, raison: "Demande bloquée : " + imp.bloquants.map(function (r) { return r.libelle + " (projeté : " + r.valeur + ")"; }).join(" ; ") };
    if (imp.avertissements.length && !confirmeAvertissements) return { ok: false, raison: "Avertissement à confirmer", avertissements: imp.avertissements, aConfirmer: true };
    var c = caseLibre(state, o);
    var d = { id: nid(state, "d"), offreId: o.id, caseId: c.id, etat: "demandee", creeeSemaine: state.semaine, derniereTransition: state.semaine,
      destinataire: o.mode === "libre" ? "Scolarité (système d'inscription — simulé)" : (o.responsable || o.unite) + " (responsable — simulé)",
      historique: [{ etat: "demandee", semaine: state.semaine, source: "Dépôt par la personne étudiante", motif: "" }] };
    state.demandes.push(d);
    log(state, "Demande déposée : " + o.code + " — " + o.titre + " → " + d.destinataire + ".", "Action de la personne étudiante");
    return { ok: true, demande: d };
  }
  function transition(state, d, etat, source, motif) {
    d.etat = etat; d.derniereTransition = state.semaine;
    d.historique.push({ etat: etat, semaine: state.semaine, source: source, motif: motif || "" });
  }
  function trouverDemande(state, id) { return state.demandes.filter(function (d) { return d.id === id; })[0]; }

  function annuler(state, demandeId) {
    var d = trouverDemande(state, demandeId);
    if (!d || d.etat !== "demandee") return { ok: false, raison: "Seule une demande en attente peut être annulée ; pour une activité confirmée, utilisez « Retirer »." };
    transition(state, d, "annulee", "Annulation par la personne étudiante");
    log(state, "Demande annulée : " + offre(d.offreId).code + ".", "Action de la personne étudiante");
    return { ok: true };
  }

  /* CU07 — réponse du responsable (simulée dans l'interface « Vue responsable »). */
  function repondre(state, demandeId, decision, motif) {
    var d = trouverDemande(state, demandeId);
    if (!d || d.etat !== "demandee") return { ok: false, raison: "Cette demande n'est plus en attente." };
    var o = offre(d.offreId);
    if (decision === "refuser") {
      if (!motif || !motif.trim()) return { ok: false, raison: "Un motif est obligatoire pour refuser (E6)." };
      transition(state, d, "refusee", "Réponse de " + (o.responsable || o.unite) + " (simulée)", motif.trim());
      log(state, o.code + " : demande refusée — motif : " + motif.trim() + ".", "Responsable (simulé)");
      return { ok: true };
    }
    if ((state.places[o.id] || 0) <= 0) {
      transition(state, d, "refusee", "Contrôle de capacité", "Capacité atteinte");
      return { ok: false, raison: "Plus de capacité : la demande est refusée automatiquement avec le motif « Capacité atteinte »." };
    }
    transition(state, d, "offerte", "Offre de " + (o.responsable || o.unite) + " (simulée)");
    d.offreExpireSemaine = state.semaine + EXPIRATION_OFFRE_SEMAINES;
    log(state, o.code + " : une place vous est offerte ; acceptez-la avant la semaine " + d.offreExpireSemaine + ".", "Responsable (simulé)");
    return { ok: true };
  }
  function accepterOffre(state, demandeId) {
    var d = trouverDemande(state, demandeId);
    if (!d || d.etat !== "offerte") return { ok: false, raison: "Aucune offre à accepter." };
    var o = offre(d.offreId);
    if ((state.places[o.id] || 0) <= 0) { transition(state, d, "refusee", "Contrôle de capacité", "Capacité atteinte"); return { ok: false, raison: "La place n'est plus disponible." }; }
    state.places[o.id]--;
    transition(state, d, "confirmee", "Acceptation par la personne étudiante");
    log(state, o.code + " : offre acceptée, activité confirmée.", "Action de la personne étudiante");
    return { ok: true };
  }
  function declinerOffre(state, demandeId) {
    var d = trouverDemande(state, demandeId);
    if (!d || d.etat !== "offerte") return { ok: false, raison: "Aucune offre à décliner." };
    transition(state, d, "declinee", "Refus de l'offre par la personne étudiante");
    return { ok: true };
  }

  /* E8, E9 — conséquences d'un retrait, calculées AVANT la décision (A2.3).
   * Observation P4 (profil 30 h, sem. 11) : le prototype de référence retire immédiatement,
   * sans confirmation, et n'explique pas le passage sous le temps plein. */
  function consequencesRetrait(state, demandeId) {
    var d = trouverDemande(state, demandeId);
    if (!d || d.etat !== "confirmee") return null;
    var o = offre(d.offreId), p = programme(state), r = regleRetrait(state);
    var avant = totaux(state, ETATS_ENGAGES), apres = totaux(state, ETATS_ENGAGES, null, d.id);
    var sousTP = avant.credits >= p.tempsPlein && apres.credits < p.tempsPlein;
    return {
      demande: d, offre: o, regle: r, avant: avant, apres: apres, reglesApres: regles(state, apres),
      passeSousTempsPlein: sousTP,
      alerteTempsPlein: sousTP ? "Ce retrait fait passer votre plan sous le seuil de temps plein (" + apres.credits + " / " + p.tempsPlein +
        " crédits). Votre statut peut changer ; les conséquences (ex. aide financière) dépendent de votre situation : vérifiez-les auprès des ressources compétentes avant de confirmer." : null,
      demarche: r.mode === "refuse" ? "Aucun retrait possible dans le système : adressez-vous au registrariat ou à la TGDE de votre programme."
        : "Le retrait dans le plan ne remplace pas l'abandon officiel : la démarche se fait auprès du registrariat (hors système)."
    };
  }

  /* Retrait d'une activité confirmée : toujours confirmé explicitement, jamais après la date d'abandon (E8). */
  function retirer(state, demandeId, confirme) {
    var c = consequencesRetrait(state, demandeId);
    if (!c) return { ok: false, raison: "Aucune activité confirmée à retirer." };
    var r = c.regle, d = c.demande;
    if (r.mode === "refuse") return { ok: false, raison: r.texte, regle: r, consequences: c };
    if (!confirme) return { ok: false, raison: r.texte, regle: r, consequences: c, aConfirmer: true };
    state.places[d.offreId]++;
    transition(state, d, "annulee", r.mode === "sans-frais" ? "Retrait sans frais confirmé (règle de démonstration)" : "Abandon avec frais confirmé (règle de démonstration)");
    log(state, offre(d.offreId).code + " retiré du plan (" + (r.mode === "sans-frais" ? "sans frais" : "avec frais") + ")" +
      (c.passeSousTempsPlein ? " — le plan passe sous le seuil de temps plein" : "") + ".", "Action de la personne étudiante");
    return { ok: true, regle: r, consequences: c };
  }

  /* Pas de temps simulé : chaque changement est journalisé avec sa source (réponse à l'ambiguïté OBS-11). */
  function avancerSemaine(state) {
    if (state.semaine >= D.NB_SEMAINES) return { ok: false, raison: "La session simulée est terminée (semaine " + D.NB_SEMAINES + ")." };
    state.semaine++;
    var w = state.semaine;
    log(state, "Semaine " + w + " commence (" + fmtDate(aujourdHui(state)) + ").", "Horloge simulée");
    D.OFFRES.forEach(function (o) {
      if (o.placesParSemaine && o.placesParSemaine[w] !== undefined) {
        var engagees = state.demandes.filter(function (d) { return d.offreId === o.id && d.etat === "confirmee"; }).length;
        var cible = Math.max(0, o.placesParSemaine[w] - engagees);
        if (cible !== state.places[o.id]) { log(state, o.code + " : places " + state.places[o.id] + " → " + cible + (cible === 0 ? " (complet)" : "") + ".", "Catalogue simulé (autres demandes fictives)"); state.places[o.id] = cible; }
      }
      if (o.ouvertureSemaine === w) log(state, "Nouvelle offre publiée : " + o.code + " — " + o.titre + ".", "Catalogue simulé");
    });
    state.demandes.forEach(function (d) {
      var o = offre(d.offreId);
      if (d.etat === "demandee" && o.mode === "libre" && d.creeeSemaine < w) {
        if (state.places[o.id] > 0) { state.places[o.id]--; transition(state, d, "confirmee", "Scolarité — réponse simulée (inscription libre)"); log(state, o.code + " : inscription confirmée (réponse simulée).", "Scolarité (simulée)"); }
        else { transition(state, d, "refusee", "Scolarité — réponse simulée", "Capacité atteinte"); log(state, o.code + " : inscription refusée, capacité atteinte.", "Scolarité (simulée)"); }
      } else if (d.etat === "demandee" && o.mode === "approbation" && w - d.creeeSemaine >= EXPIRATION_DEMANDE_SEMAINES) {
        transition(state, d, "expiree", "Règle de démonstration : sans réponse après " + EXPIRATION_DEMANDE_SEMAINES + " semaines");
        log(state, o.code + " : demande expirée sans réponse ; la case est libérée.", "Règle d'expiration (démo)");
      } else if (d.etat === "offerte" && w > d.offreExpireSemaine) {
        transition(state, d, "expiree", "Offre non acceptée dans le délai"); log(state, o.code + " : offre expirée.", "Règle d'expiration (démo)");
      }
    });
    return { ok: true };
  }

  /* Moteur de suggestions explicable (E2, CU09). Les appréciations n'agissent que sur le score,
   * jamais sur la disponibilité déclarée (E12 ; cf. observation P4 sur le prototype de référence). */
  function suggestions(state) {
    if (!state.profil) return [];
    var bonus = {};
    Object.keys(state.appreciations).forEach(function (id) { var o = offre(id); if (o && o.interet) bonus[o.interet] = (bonus[o.interet] || 0) + state.appreciations[id]; });
    return offresVisibles(state).map(function (o) {
      var s = 0, raisons = [], idx = state.profil.interets.indexOf(o.interet);
      if (idx === 0) { s += 3; raisons.push("correspond à votre intérêt principal (" + o.interet + ")"); }
      else if (idx > 0) { s += 2; raisons.push("correspond à votre intérêt « " + o.interet + " »"); }
      else raisons.push("hors de vos intérêts");
      if (bonus[o.interet]) { s += bonus[o.interet]; raisons.push((bonus[o.interet] > 0 ? "+" : "") + bonus[o.interet] + " selon vos appréciations en " + o.interet); }
      var pr = state.profil.pratique || 50;
      if (pr >= 60 && o.type !== "Cours") { s += 1; raisons.push("activité pratique, conforme à votre préférence"); }
      if (pr <= 40 && o.type === "Cours") { s += 1; raisons.push("cours, conforme à votre préférence plus théorique"); }
      if ((state.places[o.id] || 0) <= 0) { s -= 5; raisons.push("complet"); }
      var imp = impact(state, o);
      if (imp.bloquants.length) { s -= 3; raisons.push("dépasserait le plafond de crédits"); }
      else if (imp.avertissements.length) { s -= 1; raisons.push("attention : " + imp.avertissements.map(function (r) { return { charge: "dépasserait votre disponibilité", hors: "dépasserait la limite hors intérêts", prealables: "préalable non satisfait" }[r.id] || r.libelle; }).join(" et ")); }
      if (imp.prealables.statut === "inconnu") raisons.push("préalables impossibles à vérifier");
      return { offre: o, score: s, raisons: raisons };
    }).sort(function (a, b) { return b.score - a.score || a.offre.code.localeCompare(b.offre.code); });
  }
  function apprecier(state, offreId, valeur) {
    var d = state.demandes.filter(function (x) { return x.offreId === offreId && x.etat === "confirmee"; })[0];
    if (!d) return { ok: false, raison: "Seule une activité confirmée peut être appréciée." };
    if (valeur === 0) delete state.appreciations[offreId]; else state.appreciations[offreId] = valeur;
    log(state, "Appréciation " + (valeur > 0 ? "positive" : valeur < 0 ? "négative" : "retirée") + " : " + offre(offreId).code + ". Suggestions recalculées.", "Action de la personne étudiante");
    return { ok: true };
  }

  /* CU06 — intentions futures : jamais de réservation (E10, E11). */
  function sessionFuture(state, id) { return state.sessionsFutures.filter(function (s) { return s.id === id; })[0]; }
  function intentionsSurType(state, sid, type) { return state.intentions.filter(function (i) { return i.sessionId === sid && i.typeCase === type; }); }
  function ajouterIntention(state, sid, offreId) {
    var s = sessionFuture(state, sid), o = offre(offreId); if (!s || !o) return { ok: false, raison: "Session ou offre inconnue." };
    var types = typesCase(o), t = null;
    for (var i = 0; i < types.length; i++) if (intentionsSurType(state, sid, types[i]).length < s.cases[types[i]]) { t = types[i]; break; }
    if (!t) return { ok: false, raison: "Aucune case « " + NOM_CASE[types[0]] + " » libre à " + s.nom + " : ajustez le nombre de cases (+) d'abord.", action: types[0] };
    if (state.intentions.some(function (x) { return x.sessionId === sid && x.offreId === offreId; })) return { ok: false, raison: "Intention déjà présente pour cette session." };
    var it = { id: nid(state, "i"), sessionId: sid, offreId: offreId, typeCase: t, etat: "intention", creeeSemaine: state.semaine, note: "" };
    state.intentions.push(it);
    log(state, "Intention déposée pour " + s.nom + " : " + o.code + " (aucune place réservée).", "Action de la personne étudiante");
    return { ok: true, intention: it };
  }
  function retirerIntention(state, id) { state.intentions = state.intentions.filter(function (i) { return i.id !== id; }); return { ok: true }; }
  function modifierCases(state, sid, type, delta) {
    var s = sessionFuture(state, sid); s.cases[type] = Math.max(0, s.cases[type] + delta);
    var its = intentionsSurType(state, sid, type);
    its.forEach(function (it, k) { if (k >= s.cases[type]) { it.etat = "a-reevaluer"; it.note = "En surplus : plus de case « " + NOM_CASE[type] + " » à " + s.nom + ". Rien n'a été supprimé."; } else if (it.note.indexOf("En surplus") === 0) { it.etat = "intention"; it.note = ""; } });
    return { ok: true };
  }
  function simulerRetraitFutur(state, offreId) {
    state.retraitsFuturs[offreId] = true;
    state.intentions.forEach(function (it) { if (it.offreId === offreId) { it.etat = "a-reevaluer"; it.note = "L'offre n'est plus prévue selon le catalogue (simulé). Choisissez une alternative ou retirez l'intention."; } });
    log(state, "Catalogue futur (simulé) : " + offre(offreId).code + " n'est plus prévu. Intentions concernées à réévaluer.", "Catalogue simulé");
  }
  function totalCasesFutures(state) {
    var total = 0, reglees = 0;
    state.cases.forEach(function (c) { total++; if (demandeSurCase(state, c.id)) reglees++; });
    state.sessionsFutures.forEach(function (s) { total += s.cases.cours + s.cases.projet + s.cases.activite; });
    reglees += state.intentions.length;
    return { total: total, reglees: reglees };
  }
  function pluriel(n, sing, plur) { return n + " " + (n > 1 ? plur : sing); }

  /* E10 — crédits séparés : acquis (déclarés), en cours (session), planifiés (intentions, projection). */
  function creditsParType(state) {
    var acquis = ((state.profil && state.profil.coursReussis) || []).reduce(function (s, code) {
      var o = D.OFFRES.filter(function (x) { return x.code === code; })[0]; return s + (o ? o.credits : 3); }, 0);
    var enCours = totaux(state, ["confirmee"]).credits;
    var planifies = state.intentions.reduce(function (s, it) { var o = offre(it.offreId); return s + (o ? o.credits : 0); }, 0);
    return { acquis: acquis, enCours: enCours, planifies: planifies, projection: acquis + enCours + planifies };
  }

  /* E13 — alternatives et interlocuteur quand une offre est inaccessible. */
  function alternatives(state, o) {
    var cands = offresVisibles(state).filter(function (x) {
      return x.id !== o.id && (state.places[x.id] || 0) > 0 && (x.interet === o.interet || x.type === o.type) && peutDemander(state, x).ok;
    }).sort(function (a, b) { return (b.interet === o.interet) - (a.interet === o.interet) || a.code.localeCompare(b.code); });
    return { offres: cands.slice(0, 2), interlocuteur: o.responsable ? o.responsable + " (responsable de l'offre)" : "TGDE ou responsable du programme" };
  }

  /* E14 — bilan de fin de période : satisfait, incomplet, incertain. */
  function bilan(state) {
    var conf = totaux(state, ["confirmee"]);
    return {
      semaine: state.semaine, terminee: state.semaine >= D.NB_SEMAINES,
      confirmees: state.demandes.filter(function (d) { return d.etat === "confirmee"; }).map(function (d) { var o = offre(d.offreId); return o.code + " — " + o.titre; }),
      nonResolues: state.demandes.filter(function (d) { return d.etat === "demandee" || d.etat === "offerte"; }).map(function (d) { var o = offre(d.offreId); return { activite: o.code + " — " + o.titre, etat: d.etat }; }),
      regles: regles(state, conf).map(function (r) { return { libelle: r.libelle, valeur: r.valeur, seuil: r.seuil, statut: r.etat === "ok" ? "satisfait" : "incomplet" }; }),
      intentions: state.intentions.map(function (i) { var o = offre(i.offreId); return { session: sessionFuture(state, i.sessionId).nom, activite: o.code + " — " + o.titre, statut: "incertain", etat: i.etat }; }),
      credits: creditsParType(state)
    };
  }

  /* CU10 — export lisible (appui à E6 et E10 : états et types de crédits distingués). */
  function exporter(state) {
    var p = programme(state);
    return {
      genere: new Date().toISOString(), avertissement: "Export du PROTOTYPE DE DÉMONSTRATION. Données fictives ; aucune place officielle n'est réservée ni confirmée.",
      legende: { "confirmee": "Confirmée dans la simulation (pas une inscription officielle)", "demandee": "Demande en attente de réponse", "offerte": "Place offerte, à accepter",
        "refusee": "Refusée (motif conservé)", "expiree": "Expirée sans réponse ou non acceptée", "annulee": "Annulée ou retirée", "intention": "Intention future — AUCUNE place réservée", "a-reevaluer": "Intention à réévaluer" },
      profil: state.profil, programme: { nom: p.nom, source: p.source }, semaineSimulee: state.semaine, dateSimulee: aujourdHui(state),
      session: "Automne 2026",
      activites: state.demandes.map(function (d) { var o = offre(d.offreId); return { code: o.code, titre: o.titre, type: o.type, credits: o.credits, heures: o.heures, etat: d.etat, historique: d.historique, source: o.source }; }),
      totauxConfirmes: totaux(state, ["confirmee"]), totauxEngages: totaux(state, ETATS_ENGAGES),
      creditsParType: creditsParType(state),
      intentions: state.intentions.map(function (i) { var o = offre(i.offreId); return { session: sessionFuture(state, i.sessionId).nom, code: o.code, titre: o.titre, etat: i.etat, note: i.note || "Intention — aucune place réservée" }; }),
      echeances: D.ECHEANCES.map(function (e) { return { date: e.date, fin: e.fin, libelle: e.libelle, statut: statutEcheance(state, e).libelle, source: e.source }; })
    };
  }

  var API = { D: D, LIBELLES_ETAT: LIBELLES_ETAT, NOM_CASE: NOM_CASE, ETATS_ENGAGES: ETATS_ENGAGES, EXPIRATION_DEMANDE_SEMAINES: EXPIRATION_DEMANDE_SEMAINES,
    offre: offre, programme: programme, etatInitial: etatInitial, lundiSemaine: lundiSemaine, aujourdHui: aujourdHui, fmtDate: fmtDate,
    typesCase: typesCase, caseLibre: caseLibre, demandeSurCase: demandeSurCase, ajouterCase: ajouterCase, retirerCase: retirerCase,
    offresVisibles: offresVisibles, horsInterets: horsInterets, totaux: totaux, regles: regles, impact: impact, peutDemander: peutDemander,
    deposer: deposer, annuler: annuler, repondre: repondre, accepterOffre: accepterOffre, declinerOffre: declinerOffre, retirer: retirer,
    regleRetrait: regleRetrait, consequencesRetrait: consequencesRetrait, prealables: prealables, creditsParType: creditsParType,
    alternatives: alternatives, bilan: bilan, avancerSemaine: avancerSemaine, statutEcheance: statutEcheance, alertes: alertes, suggestions: suggestions,
    apprecier: apprecier, ajouterIntention: ajouterIntention, retirerIntention: retirerIntention, modifierCases: modifierCases,
    simulerRetraitFutur: simulerRetraitFutur, totalCasesFutures: totalCasesFutures, sessionFuture: sessionFuture, pluriel: pluriel, exporter: exporter };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.Rules = API;
})(this);
