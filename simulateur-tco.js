/* ═══════════════════════════════════
   EVERA — Simulateur TCO
   ═══════════════════════════════════ */

const WEBHOOK_URL = ""; // À configurer — webhook Zapier pour les leads TCO

/* ── Helpers ── */
const $ = id => document.getElementById(id);
const V = id => parseFloat($(id).value) || 0;
const fmt = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fK = n => n.toLocaleString('fr-FR') + ' km';
const qA = s => document.querySelectorAll(s);

/* ── Prix domicile (heures creuses moyen France) ── */
const PRIX_DOMICILE = 0.21;

/* ── Presets véhicule par catégorie + motorisation ──
     Valeurs annuelles TTC moyennes marché France 2026
     loyer = LLD annuel TTC
     conso = L/100km (thermique) ou kWh/100km (élec)
     entretien, assurance, tvs = €/an */
const PRESETS = {
  citadine: {
    diesel:  { loyer: 4800, conso: 5.0, entretien: 900,  assurance: 950,  tvs: 400 },
    essence: { loyer: 4500, conso: 5.8, entretien: 850,  assurance: 900,  tvs: 500 },
    hybride: { loyer: 5400, conso: 4.2, entretien: 750,  assurance: 950,  tvs: 200 },
    phev:    { loyer: 6000, conso: 2.0, entretien: 700,  assurance: 1000, tvs: 0 },
    elec:    { loyer: 5400, conso: 15,  entretien: 450,  assurance: 900,  tvs: 0 }
  },
  berline: {
    diesel:  { loyer: 7200, conso: 6.5, entretien: 1500, assurance: 1600, tvs: 1100 },
    essence: { loyer: 6600, conso: 7.5, entretien: 1400, assurance: 1500, tvs: 1300 },
    hybride: { loyer: 7800, conso: 5.0, entretien: 1100, assurance: 1600, tvs: 500 },
    phev:    { loyer: 8400, conso: 2.0, entretien: 900,  assurance: 1650, tvs: 0 },
    elec:    { loyer: 7800, conso: 17,  entretien: 600,  assurance: 1400, tvs: 0 }
  },
  suv: {
    diesel:  { loyer: 9000, conso: 7.5, entretien: 1800, assurance: 2000, tvs: 1500 },
    essence: { loyer: 8400, conso: 9.5, entretien: 1700, assurance: 1900, tvs: 1800 },
    hybride: { loyer: 9600, conso: 6.0, entretien: 1400, assurance: 2000, tvs: 700 },
    phev:    { loyer: 10200, conso: 2.5, entretien: 1200, assurance: 2100, tvs: 0 },
    elec:    { loyer: 10200, conso: 22,  entretien: 800,  assurance: 1800, tvs: 0 }
  },
  utilitaire: {
    diesel:  { loyer: 7200, conso: 8.5, entretien: 1800, assurance: 1400, tvs: 700 },
    essence: { loyer: 6600, conso: 10.0, entretien: 1700, assurance: 1350, tvs: 900 },
    hybride: { loyer: 7800, conso: 7.0, entretien: 1400, assurance: 1400, tvs: 350 },
    phev:    { loyer: 8400, conso: 3.0, entretien: 1300, assurance: 1500, tvs: 0 },
    elec:    { loyer: 9000, conso: 28,  entretien: 900,  assurance: 1300, tvs: 0 }
  }
};

/* ── Noms des motorisations pour affichage ── */
const MOTO_LABELS = {
  diesel: 'Diesel', essence: 'Essence', hybride: 'Hybride',
  phev: 'Hybride recharg.', electrique: 'Électrique'
};

/* ── Couleurs postes de coût ── */
const POST_COLORS = [
  { key: 'loyer',     label: 'Loyer',      color: '#131B1D' },
  { key: 'energie',   label: 'Énergie',    color: '#E8943A' },
  { key: 'entretien', label: 'Entretien',  color: '#63768D' },
  { key: 'assurance', label: 'Assurance',  color: '#1A8A84' },
  { key: 'fiscalite', label: 'Fiscalité',  color: '#C4554E' }
];

let cD = null, mAt = 0;

/* ══════════════════════════════════
   UI STATE MANAGERS
   ══════════════════════════════════ */

function getCat() {
  return document.querySelector('.cat-card.active')?.dataset.cat || 'berline';
}
function getMoto() {
  return document.querySelector('.moto-card.active')?.dataset.type || 'diesel';
}

function setCat(el) {
  qA('.cat-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  applyPresets();
}

function setMoto(el) {
  qA('.moto-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const t = el.dataset.type;
  const isElec = t === 'electrique';
  $('consoUnit').textContent = isElec ? 'kWh/100km' : 'L/100km';
  // Masquer le prix carburant si déjà électrique
  const carbField = $('fieldCarb');
  if (carbField) carbField.style.display = isElec ? 'none' : '';
  applyPresets();
}

function applyPresets() {
  const cat = getCat();
  const moto = getMoto();
  const key = moto === 'electrique' ? 'elec' : moto;
  const p = PRESETS[cat]?.[key];
  if (!p) return;
  $('loyer').value = p.loyer;
  $('conso').value = p.conso;
  $('fraisEntretien').value = p.entretien;
  $('fraisAssurance').value = p.assurance;
  $('fraisTVS').value = p.tvs;
  if (moto === 'diesel') $('prixCarb').value = '1.65';
  else if (moto !== 'electrique') $('prixCarb').value = '1.75';
  updateFraisTotal();
}

function setFleet(e) {
  qA('.fp').forEach(b => b.classList.remove('active'));
  e.classList.add('active');
  $('flotte').value = e.dataset.v;
  document.querySelector('.fleet-presets').classList.remove('fleet-required');
  $('errFlotte').style.display = 'none';
}
function syncFleetBtns() {
  const v = parseInt($('flotte').value) || 1;
  qA('.fp').forEach(b => b.classList.toggle('active', parseInt(b.dataset.v) === v));
  if (v >= 1) { document.querySelector('.fleet-presets').classList.remove('fleet-required'); $('errFlotte').style.display = 'none' }
}

function sliderFill(el) {
  const mn = parseFloat(el.min), mx = parseFloat(el.max), v = parseFloat(el.value);
  const pct = ((v - mn) / (mx - mn)) * 100;
  el.style.background = `linear-gradient(to right,#63768D 0%,#63768D ${pct}%,#E0E7EB ${pct}%,#E0E7EB 100%)`;
}

function updateKm() {
  const v = parseInt($('kmTotal').value);
  $('kmTotalVal').textContent = fK(v);
  sliderFill($('kmTotal'));
}

function updateRecharge() {
  const v = parseInt($('pctDomicile').value);
  $('pctDomicileVal').textContent = v + '%';
  if ($('pctDomicileVal2')) $('pctDomicileVal2').textContent = v + '%';
  $('pctBorneVal').textContent = (100 - v) + '%';
  sliderFill($('pctDomicile'));
}

function updateFraisTotal() {
  const total = V('fraisEntretien') + V('fraisAssurance') + V('fraisTVS');
  $('fraisTotal').textContent = total.toLocaleString('fr-FR') + ' €/an';
}

/* Init listeners frais */
['fraisEntretien', 'fraisAssurance', 'fraisTVS'].forEach(id => {
  $(id)?.addEventListener('input', updateFraisTotal);
});

/* Init sliders */
updateKm();
updateRecharge();

/* ══════════════════════════════════
   TCO CALCULATION ENGINE
   ══════════════════════════════════ */

function runCalc() {
  const cat = getCat();
  const moto = getMoto();
  const isAlreadyElec = moto === 'electrique';
  const km = parseInt($('kmTotal').value);
  const prixCarb = V('prixCarb');
  const prixBorne = V('prixElec');
  const pctDom = parseInt($('pctDomicile').value) / 100;
  const fl = Math.max(1, parseInt($('flotte').value) || 1);

  /* Valeurs saisies pour le véhicule actuel */
  const loyerA = V('loyer');
  const consoA = V('conso');
  const entretienA = V('fraisEntretien');
  const assuranceA = V('fraisAssurance');
  const tvsA = V('fraisTVS');

  /* Preset électrique de référence */
  const ep = PRESETS[cat].elec;

  /* Coût énergie — véhicule actuel */
  let energieA;
  if (isAlreadyElec) {
    const pMix = pctDom * PRIX_DOMICILE + (1 - pctDom) * prixBorne;
    energieA = (km * consoA / 100) * pMix;
  } else {
    energieA = (km * consoA / 100) * prixCarb;
  }

  /* Coût énergie — véhicule électrique de référence */
  const pMixE = pctDom * PRIX_DOMICILE + (1 - pctDom) * prixBorne;
  const energieE = (km * ep.conso / 100) * pMixE;

  /* TCO Actuel */
  const a = {
    loyer: loyerA,
    energie: Math.round(energieA),
    entretien: entretienA,
    assurance: assuranceA,
    fiscalite: tvsA
  };
  a.total = a.loyer + a.energie + a.entretien + a.assurance + a.fiscalite;

  /* TCO Électrique */
  const e = {
    loyer: ep.loyer,
    energie: Math.round(energieE),
    entretien: ep.entretien,
    assurance: ep.assurance,
    fiscalite: ep.tvs
  };
  e.total = e.loyer + e.energie + e.entretien + e.assurance + e.fiscalite;

  const diff = a.total - e.total;

  /* Économies Evera Fleet (optimisations plateforme) */
  const evera = {
    aen:              Math.round(e.loyer * 0.12),
    electrification:  Math.max(0, Math.round(diff)),
    energie:          Math.round(e.energie * 0.15),
    fiscalite:        Math.max(0, tvsA),
    entretien:        Math.round(e.entretien * 0.20),
    assurance:        Math.round(e.assurance * 0.08)
  };
  /* Total = savings plateforme (hors electrification qui est déjà dans le diff TCO) */
  evera.total = evera.aen + evera.electrification + evera.energie + evera.entretien + evera.assurance;

  cD = { a, e, diff, evera, fl, km, cat, moto, isAlreadyElec, pctDom, prixBorne };
}

/* ══════════════════════════════════
   MODAL & LEAD CAPTURE
   ══════════════════════════════════ */

function onCalculate() {
  const flV = parseInt($('flotte').value);
  if (!flV || flV < 1) {
    const fp = document.querySelector('.fleet-presets');
    fp.classList.remove('fleet-required');
    void fp.offsetWidth;
    fp.classList.add('fleet-required');
    $('errFlotte').style.display = 'block';
    $('flotte').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => $('flotte').focus(), 400);
    return;
  }
  document.querySelector('.fleet-presets').classList.remove('fleet-required');
  $('errFlotte').style.display = 'none';
  if (parseInt($('kmTotal').value) <= 0) return;
  runCalc();
  const sv = Math.abs(cD.diff) * cD.fl;
  $('modalSavValue').textContent = fmt(sv);
  $('modalSavLabel').textContent = cD.fl > 1
    ? `d'économies / an sur votre flotte de ${cD.fl} véhicules`
    : `d'économies / an sur votre flotte`;
  mAt = Date.now();
  $('modal').classList.add('open');
  clE();
  setTimeout(() => $('leadPrenom').focus(), 150);
}

function closeModal() { $('modal').classList.remove('open') }

/* ── Validation (identique AEN) ── */
const BD = 'mailinator.com yopmail.com yopmail.fr guerrillamail.com tempmail.com throwaway.email sharklasers.com grr.la dispostable.com maildrop.cc trashmail.com temp-mail.org fakeinbox.com tmpmail.net mohmal.com getnada.com discard.email jetable.org mytemp.email tempail.com burnermail.io meltmail.com mailsac.com'.split(' ');
const FD = 'gmail.com yahoo.com yahoo.fr hotmail.com hotmail.fr outlook.com outlook.fr live.com live.fr aol.com icloud.com me.com mail.com gmx.com gmx.fr protonmail.com proton.me zoho.com free.fr orange.fr wanadoo.fr laposte.net sfr.fr bbox.fr numericable.fr'.split(' ');
const TP = [/^test/i,/^fake/i,/^demo/i,/^abc$/i,/^aaa/i,/^xxx/i,/^zzz/i,/^qwer/i,/^asdf/i,/^azerty/i,/^toto/i,/^tutu/i,/^tata/i,/^foo$/i,/^bar$/i,/^null/i,/^none/i,/^admin$/i,/^blabla/i];
const NJ = [/^test$/i,/^fake$/i,/^demo$/i,/^abc$/i,/^aaa$/i,/^xxx$/i,/^zzz$/i,/^toto$/i,/^tata$/i,/^tutu$/i,/^foo$/i,/^bar$/i,/^null$/i,/^none$/i,/^na$/i,/^n\/a$/i,/^\.$/,/^-$/,/^\?$/,/^x$/i,/^qq$/i,/^azerty$/i,/^blabla$/i,/^fdp$/i];

function sE(id, m) {
  const e = $(id);
  e.querySelector('span').textContent = m;
  e.classList.add('show');
  const i = e.previousElementSibling;
  if (i && i.classList.contains('input')) i.classList.add('input-err');
}
function clE() {
  qA('.field-err').forEach(e => {
    e.classList.remove('show');
    const i = e.previousElementSibling;
    if (i && i.classList.contains('input')) i.classList.remove('input-err');
  });
}

function vL() {
  clE();
  let ok = 1;
  const p = $('leadPrenom').value.trim(),
        n = $('leadNom').value.trim(),
        em = $('leadEmail').value.trim().toLowerCase(),
        en = $('leadEntreprise').value.trim();
  if ($('leadWebsite').value.trim()) return 0;
  if (Date.now() - mAt < 2e3) return 0;
  if (!p) { sE('errPrenom', 'Prénom requis'); ok = 0 }
  else if (p.length < 2) { sE('errPrenom', 'Prénom trop court'); ok = 0 }
  else if (NJ.some(r => r.test(p))) { sE('errPrenom', 'Prénom invalide'); ok = 0 }
  else if (/\d/.test(p)) { sE('errPrenom', 'Pas de chiffres'); ok = 0 }
  if (!n) { sE('errNom', 'Nom requis'); ok = 0 }
  else if (n.length < 2) { sE('errNom', 'Nom trop court'); ok = 0 }
  else if (NJ.some(r => r.test(n))) { sE('errNom', 'Nom invalide'); ok = 0 }
  else if (/\d/.test(n)) { sE('errNom', 'Pas de chiffres'); ok = 0 }
  if (!em) { sE('errEmail', 'Email requis'); ok = 0 }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { sE('errEmail', 'Email invalide'); ok = 0 }
  else {
    const d = em.split('@')[1], l = em.split('@')[0];
    if (BD.includes(d)) { sE('errEmail', 'Email jetable interdit'); ok = 0 }
    else if (FD.includes(d)) { sE('errEmail', 'Utilisez votre email pro'); ok = 0 }
    else if (TP.some(r => r.test(l))) { sE('errEmail', 'Email invalide'); ok = 0 }
    else if (d.length < 4 || !d.includes('.')) { sE('errEmail', 'Domaine invalide'); ok = 0 }
  }
  if (!en) { sE('errEntreprise', 'Entreprise requise'); ok = 0 }
  else if (en.length < 2) { sE('errEntreprise', 'Nom trop court'); ok = 0 }
  else if (NJ.some(r => r.test(en))) { sE('errEntreprise', 'Nom invalide'); ok = 0 }
  const tel = $('leadTel').value.replace(/[\s.\-()]/g, '');
  if (tel && !/^(\+?\d{10,15})$/.test(tel)) { sE('errTel', 'Numéro invalide (ex: 06 12 34 56 78)'); ok = 0 }
  return ok;
}

function submitLead() {
  if (!vL()) return;
  const b = $('btnSubmit');
  b.disabled = 1;
  b.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span> Envoi…';
  const { a, e, diff, evera, fl, km } = cD;
  const pay = {
    prenom: $('leadPrenom').value.trim(),
    nom: $('leadNom').value.trim(),
    email: $('leadEmail').value.trim().toLowerCase(),
    entreprise: $('leadEntreprise').value.trim(),
    telephone: $('leadTel').value.trim(),
    nombre_vehicules: fl,
    timestamp: new Date().toISOString(),
    source: 'simulateur-tco',
    categorie: cD.cat,
    motorisation: cD.moto,
    loyer: V('loyer'),
    conso: V('conso'),
    prix_carburant: V('prixCarb'),
    prix_electricite: V('prixElec'),
    assurance: V('fraisAssurance'),
    entretien: V('fraisEntretien'),
    tvs: V('fraisTVS'),
    km_annuel: km,
    pct_recharge_domicile: Math.round(cD.pctDom * 100),
    tco_actuel: Math.round(a.total),
    tco_electrique: Math.round(e.total),
    eco_vehicule: Math.round(diff),
    eco_flotte: Math.round(diff * fl),
    eco_evera_total: Math.round(evera.total)
  };
  if (WEBHOOK_URL) fetch(WEBHOOK_URL, { method: 'POST', body: JSON.stringify(pay) }).catch(() => {});
  setTimeout(() => {
    b.disabled = 0;
    b.innerHTML = 'Résultats détaillés <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    closeModal();
    showResults();
  }, 800);
}

function skipLead() { closeModal(); showResults() }

/* Auto-clear field errors on input */
['leadPrenom', 'leadNom', 'leadEmail', 'leadEntreprise', 'leadTel'].forEach(id => {
  $(id)?.addEventListener('input', () => {
    const e = id === 'leadTel' ? 'errTel' : 'err' + id.charAt(4).toUpperCase() + id.slice(5);
    if ($(e)) { $(e).classList.remove('show'); $(id).classList.remove('input-err') }
  });
});

/* Evera staff bypass */
$('leadEmail')?.addEventListener('input', function () {
  const em = this.value.trim().toLowerCase();
  if (/@evera\.co$/i.test(em) && em.split('@')[0].length > 1) {
    closeModal(); showResults(); showCalcDebug();
  }
});

/* ══════════════════════════════════
   RESULTS DISPLAY
   ══════════════════════════════════ */

function showResults() {
  const { a, e, diff, evera, fl, km } = cD;
  const motoLabel = MOTO_LABELS[cD.moto] || cD.moto;

  /* Hero */
  $('heroSav').textContent = fmt(Math.abs(diff));
  $('heroFlotteLabel').textContent = fl > 1 ? ' par véhicule / an' : ' par an';
  const hft = $('heroFleetTotal');
  if (fl > 1) {
    hft.textContent = 'Soit ' + fmt(Math.abs(diff) * fl) + ' pour ' + fl + ' véhicules';
    hft.style.display = 'block';
  } else { hft.style.display = 'none' }

  $('heroActuel').textContent = fmt(a.total);
  $('heroElec').textContent = fmt(e.total);
  $('heroArrow').textContent = (diff >= 0 ? '−' : '+') + fmt(Math.abs(diff)).replace(/[^\d\s]/g, '').trim() + ' €';
  $('heroMotoLabel').textContent = motoLabel;

  /* Detail cards */
  const posts = ['loyer', 'energie', 'entretien', 'assurance', 'fiscalite'];
  posts.forEach(p => {
    $('r_a_' + p).textContent = fmt(a[p]);
    $('r_e_' + p).textContent = fmt(e[p]);
  });
  $('r_a_total').textContent = fmt(a.total);
  $('r_e_total').textContent = fmt(e.total);

  /* Coût au km */
  $('r_a_km').textContent = (a.total / km).toFixed(2).replace('.', ',') + ' €/km';
  $('r_e_km').textContent = (e.total / km).toFixed(2).replace('.', ',') + ' €/km';

  /* Metrics */
  $('coutMensuelActuel').textContent = fmt(Math.round(a.total / 12));
  $('coutMensuelElec').textContent = fmt(Math.round(e.total / 12));
  $('coutKmActuel').textContent = (a.total / km).toFixed(2).replace('.', ',') + ' €';
  $('coutKmElec').textContent = (e.total / km).toFixed(2).replace('.', ',') + ' €';

  /* Charts */
  renderCharts();

  /* Evera solutions */
  renderSolutions();

  $('results').classList.add('visible');
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════
   CHARTS (pure CSS)
   ══════════════════════════════════ */

function renderCharts() {
  const { a, e } = cD;

  /* Bar chart */
  const maxVal = Math.max(...POST_COLORS.map(p => Math.max(a[p.key], e[p.key], 1)));
  let barsHtml = '';
  POST_COLORS.forEach(p => {
    const hA = Math.max(3, a[p.key] / maxVal * 100).toFixed(1);
    const hE = Math.max(3, e[p.key] / maxVal * 100).toFixed(1);
    barsHtml += `<div class="bar-group">
      <div class="bar-pair">
        <div class="bar bar-a" style="height:${hA}%" data-val="${fmt(a[p.key])}"></div>
        <div class="bar bar-e" style="height:${hE}%" data-val="${fmt(e[p.key])}"></div>
      </div>
      <div class="bar-label">${p.label}</div>
    </div>`;
  });
  $('chartBars').innerHTML = barsHtml;

  /* Stacked bars */
  function stackRow(data, label) {
    let segs = '';
    POST_COLORS.forEach(p => {
      const w = (data.total > 0 ? data[p.key] / data.total * 100 : 0).toFixed(1);
      segs += `<div class="seg" style="width:${w}%;background:${p.color}" title="${p.label}: ${fmt(data[p.key])}"></div>`;
    });
    return `<div class="stack-row">
      <span class="stack-label">${label}</span>
      <div class="stack-track">${segs}</div>
      <span class="stack-total">${fmt(data.total)}</span>
    </div>`;
  }
  $('chartStacked').innerHTML = stackRow(a, 'Actuel') + stackRow(e, 'Électrique');

  /* Donut charts */
  function renderDonut(data, id) {
    let angle = 0;
    const segments = POST_COLORS.map(p => {
      const pct = data.total > 0 ? data[p.key] / data.total * 360 : 0;
      const start = angle;
      angle += pct;
      return `${p.color} ${start.toFixed(1)}deg ${angle.toFixed(1)}deg`;
    });
    $(id).style.background = `conic-gradient(${segments.join(',')})`;
  }
  renderDonut(a, 'donutActuel');
  renderDonut(e, 'donutElec');

  /* Donut legend */
  const legendHtml = POST_COLORS.map(p =>
    `<div class="donut-legend-item"><span class="dl-dot" style="background:${p.color}"></span>${p.label}</div>`
  ).join('');
  qA('.donut-legend').forEach(el => el.innerHTML = legendHtml);
}

/* ══════════════════════════════════
   EVERA FLEET SOLUTIONS
   ══════════════════════════════════ */

function renderSolutions() {
  const { evera, fl } = cD;

  $('solAen').textContent = fmt(evera.aen);
  $('solElec').textContent = fmt(evera.electrification);
  $('solEnergie').textContent = fmt(evera.energie);
  $('solFiscalite').textContent = fmt(evera.fiscalite);
  $('solEntretien').textContent = fmt(evera.entretien);
  $('solAssurance').textContent = fmt(evera.assurance);

  /* Savings bar */
  $('savingsTotal').textContent = fmt(evera.total) + ' / véhicule / an';
  const sf = $('savingsFleet');
  if (fl > 1) {
    sf.textContent = 'Soit ' + fmt(evera.total * fl) + ' / an pour ' + fl + ' véhicules';
    sf.style.display = 'block';
  } else { sf.style.display = 'none' }

  /* Chips */
  const chips = [
    { label: 'Électrification', val: evera.electrification, color: '#1A8A84' },
    { label: 'AEN', val: evera.aen, color: '#131B1D' },
    { label: 'Énergie', val: evera.energie, color: '#E8943A' },
    { label: 'Entretien', val: evera.entretien, color: '#63768D' },
    { label: 'Assurance', val: evera.assurance, color: '#C4554E' }
  ];
  $('savingsChips').innerHTML = chips
    .filter(c => c.val > 0)
    .map(c => `<span class="sav-chip" style="background:${c.color}15;color:${c.color};border-color:${c.color}30">
      ${c.label} −${fmt(c.val)}</span>`).join('');
}

/* ══════════════════════════════════
   TOGGLES & MISC
   ══════════════════════════════════ */

function toggleCharts() {
  const c = $('chartsContent'), t = $('chartsToggle');
  const o = c.classList.toggle('open');
  t.classList.toggle('open', o);
  const sv = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg> ';
  t.innerHTML = o ? sv + 'Masquer les graphiques' : sv + 'Afficher les graphiques';
}

function newSim() {
  ['results', 'chartsContent', 'chartsToggle'].forEach(id => $(id)?.classList.remove('visible', 'open'));
  if ($('calcDebug')) $('calcDebug').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Webflow padding fix ── */
function fixPad() {
  qA('.sim .evc:not(.evc-sm):not(.evc-np)').forEach(el => el.style.setProperty('padding', '24px 24px 20px', 'important'));
  qA('.sim .evc-sm').forEach(el => el.style.setProperty('padding', '16px 20px', 'important'));
  qA('.sim .evc-np').forEach(el => el.style.setProperty('padding', '0', 'important'));
}
fixPad();
window.addEventListener('load', fixPad);
setTimeout(fixPad, 1500);
setTimeout(fixPad, 4000);

/* ══════════════════════════════════
   CALC DEBUG (Evera staff)
   ══════════════════════════════════ */

function showCalcDebug() {
  if (!cD) return;
  const { a, e, diff, evera, km, fl, pctDom, prixBorne } = cD;
  const fN = n => Math.round(n).toLocaleString('fr-FR');
  const pMixE = pctDom * PRIX_DOMICILE + (1 - pctDom) * prixBorne;

  let h = '<h4>Détail des calculs TCO — mode interne Evera</h4>';

  h += '<h5>Entrées</h5>';
  h += `<div class="cd-row"><span>Catégorie</span><span class="cd-val">${cD.cat}</span></div>`;
  h += `<div class="cd-row"><span>Motorisation actuelle</span><span class="cd-val">${cD.moto}</span></div>`;
  h += `<div class="cd-row"><span>Kilométrage annuel</span><span class="cd-val">${fK(km)}</span></div>`;
  h += `<div class="cd-row"><span>Recharge domicile</span><span class="cd-val">${Math.round(pctDom * 100)}%</span></div>`;
  h += `<div class="cd-row"><span>Prix mix électricité</span><span class="cd-val">${pMixE.toFixed(3)} €/kWh</span></div>`;
  h += `<div class="cd-row"><span>Nombre de véhicules</span><span class="cd-val">${fl}</span></div>`;

  h += '<h5>TCO Actuel</h5>';
  ['loyer', 'energie', 'entretien', 'assurance', 'fiscalite'].forEach(k => {
    h += `<div class="cd-row"><span>${k.charAt(0).toUpperCase() + k.slice(1)}</span><span class="cd-val">${fmt(a[k])}</span></div>`;
  });
  h += `<div class="cd-row" style="font-weight:700"><span>Total</span><span class="cd-val">${fmt(a.total)}</span></div>`;

  h += '<h5>TCO Électrique</h5>';
  ['loyer', 'energie', 'entretien', 'assurance', 'fiscalite'].forEach(k => {
    h += `<div class="cd-row"><span>${k.charAt(0).toUpperCase() + k.slice(1)}</span><span class="cd-val">${fmt(e[k])}</span></div>`;
  });
  h += `<div class="cd-row" style="font-weight:700"><span>Total</span><span class="cd-val">${fmt(e.total)}</span></div>`;

  h += '<h5>Économie TCO</h5>';
  h += `<div class="cd-eco">${fmt(a.total)} − ${fmt(e.total)} = ${fmt(diff)} / véhicule / an</div>`;
  if (fl > 1) h += `<div class="cd-eco" style="margin-top:6px">× ${fl} véhicules = ${fmt(diff * fl)}</div>`;

  h += '<h5>Économies Evera Fleet</h5>';
  h += `<div class="cd-row"><span>AEN optimisés (12% du loyer élec.)</span><span class="cd-val">${fmt(evera.aen)}</span></div>`;
  h += `<div class="cd-row"><span>Électrification (diff TCO)</span><span class="cd-val">${fmt(evera.electrification)}</span></div>`;
  h += `<div class="cd-row"><span>Énergie optimisée (15% énergie élec.)</span><span class="cd-val">${fmt(evera.energie)}</span></div>`;
  h += `<div class="cd-row"><span>Fiscalité (TVS évitée)</span><span class="cd-val">${fmt(evera.fiscalite)}</span></div>`;
  h += `<div class="cd-row"><span>Entretien préventif (20% entretien élec.)</span><span class="cd-val">${fmt(evera.entretien)}</span></div>`;
  h += `<div class="cd-row"><span>Assurance flotte (8% assurance élec.)</span><span class="cd-val">${fmt(evera.assurance)}</span></div>`;
  h += `<div class="cd-eco" style="margin-top:12px">Total Evera = ${fmt(evera.total)} / véhicule / an</div>`;

  $('calcDebug').innerHTML = h;
  $('calcDebug').style.display = 'block';
}

/* ══════════════════════════════════
   PDF EXPORT
   ══════════════════════════════════ */

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF || !cD) return;
  const doc = new jsPDF();
  const { a, e, diff, evera, fl, km } = cD;
  const L = 20, W = 170;
  let y = 20;

  /* Titre */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(19, 27, 29);
  doc.text('Simulation TCO — Evera', L, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 118, 141);
  doc.text('Rapport généré le ' + new Date().toLocaleDateString('fr-FR') + ' — evera.co', L, y);
  y += 4;
  doc.setDrawColor(224, 231, 235);
  doc.line(L, y, L + W, y);
  y += 10;

  /* Paramètres */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(19, 27, 29);
  doc.text('Paramètres du véhicule', L, y);
  y += 7;
  const catLabel = document.querySelector('.cat-card.active .cc-label')?.textContent || '—';
  const motoLabel = MOTO_LABELS[cD.moto] || '—';
  const params = [
    ['Catégorie', catLabel],
    ['Motorisation', motoLabel],
    ['Loyer annuel TTC', V('loyer').toLocaleString('fr-FR') + ' €'],
    ['Consommation', V('conso') + ' ' + $('consoUnit').textContent],
    ['Entretien', V('fraisEntretien').toLocaleString('fr-FR') + ' €/an'],
    ['Assurance', V('fraisAssurance').toLocaleString('fr-FR') + ' €/an'],
    ['TVS', V('fraisTVS').toLocaleString('fr-FR') + ' €/an'],
    ['Km annuel', km.toLocaleString('fr-FR') + ' km'],
    ['Recharge domicile', Math.round(cD.pctDom * 100) + '%'],
    ['Nb véhicules', '' + fl]
  ];
  doc.setFontSize(9);
  params.forEach(([lb, vl]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 118, 141);
    doc.text(lb, L, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(19, 27, 29);
    doc.text(vl, L + 55, y);
    y += 5;
  });
  y += 4;
  doc.line(L, y, L + W, y);
  y += 10;

  /* Résultats */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(19, 27, 29);
  doc.text('Résultats — TCO Actuel vs Électrique', L, y);
  y += 8;
  const c1 = L, c2 = L + 80, c3 = L + 135;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(154, 172, 184);
  doc.text('ACTUEL', c2, y);
  doc.text('ÉLECTRIQUE', c3, y);
  y += 3;
  doc.line(L, y, L + W, y);
  y += 6;

  const rows = [
    ['Loyer', 'loyer'],
    ['Énergie', 'energie'],
    ['Entretien', 'entretien'],
    ['Assurance', 'assurance'],
    ['Fiscalité (TVS)', 'fiscalite'],
    ['TOTAL', 'total', 1]
  ];
  doc.setFontSize(9);
  rows.forEach(([lb, k, isB]) => {
    doc.setFont('helvetica', isB ? 'bold' : 'normal');
    doc.setTextColor(100, 118, 141);
    doc.setFontSize(isB ? 10 : 9);
    doc.text(lb, c1 + 2, y);
    doc.setFont('helvetica', isB ? 'bold' : 'normal');
    doc.setTextColor(19, 27, 29);
    doc.text(fmt(a[k]), c2, y);
    doc.setTextColor(26, 138, 132);
    doc.text(fmt(e[k]), c3, y);
    y += isB ? 7 : 5;
    if (isB) { doc.line(L, y, L + W, y); y += 6 }
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(26, 138, 132);
  doc.text('Économie : ' + fmt(Math.abs(diff)) + ' / véhicule / an', L, y);
  if (fl > 1) {
    y += 8;
    doc.setFontSize(13);
    doc.text('Soit ' + fmt(Math.abs(diff * fl)) + ' pour ' + fl + ' véhicules', L, y);
  }

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(154, 172, 184);
  doc.text('Ce rapport est une estimation indicative. Résultats calculés sur evera.co.', L, y);

  doc.save('simulation-tco-evera.pdf');
}
