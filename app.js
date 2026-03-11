// ============================================================
// SAP Evidence zaměstnanců — app.js
// ============================================================

// ---- DATA LAYER ----
const DB = {
  employees: [],
  timesheet: [],
  vacation: [],
  meta: { nextId: 100 },

  load() {
    this.employees = JSON.parse(localStorage.getItem('sap_employees') || '[]');
    this.timesheet = JSON.parse(localStorage.getItem('sap_timesheet') || '[]');
    this.vacation  = JSON.parse(localStorage.getItem('sap_vacation')  || '[]');
    this.meta      = JSON.parse(localStorage.getItem('sap_meta')      || '{"nextId":100}');
  },

  save() {
    localStorage.setItem('sap_employees', JSON.stringify(this.employees));
    localStorage.setItem('sap_timesheet', JSON.stringify(this.timesheet));
    localStorage.setItem('sap_vacation',  JSON.stringify(this.vacation));
    localStorage.setItem('sap_meta',      JSON.stringify(this.meta));
  },

  nextId() {
    const id = this.meta.nextId++;
    this.save();
    return id;
  }
};

// ---- DEMO DATA ----
function loadDemoData() {
  const y = new Date().getFullYear();
  const m = String(new Date().getMonth() + 1).padStart(2, '0');

  DB.employees = [
    { id: 1, osobniCislo: 'EMP001', prijmeni: 'Novák',       jmeno: 'Jan',   datNarozeni: '1985-03-15', oddeleni: 'Informační technologie', pozice: 'Senior programátor',  datNastupu: '2018-01-15', email: 'j.novak@firma.cz',        telefon: '+420 601 234 567' },
    { id: 2, osobniCislo: 'EMP002', prijmeni: 'Svobodová',   jmeno: 'Marie', datNarozeni: '1990-07-22', oddeleni: 'Lidské zdroje',          pozice: 'Personalistka',        datNastupu: '2019-06-01', email: 'm.svobodova@firma.cz',    telefon: '+420 602 345 678' },
    { id: 3, osobniCislo: 'EMP003', prijmeni: 'Dvořák',      jmeno: 'Petr',  datNarozeni: '1982-11-08', oddeleni: 'Obchodní oddělení',      pozice: 'Obchodní zástupce',    datNastupu: '2015-09-01', email: 'p.dvorak@firma.cz',       telefon: '+420 603 456 789' },
    { id: 4, osobniCislo: 'EMP004', prijmeni: 'Procházková', jmeno: 'Jana',  datNarozeni: '1995-02-14', oddeleni: 'Účetnictví',             pozice: 'Účetní',               datNastupu: '2021-03-15', email: 'j.prochazkova@firma.cz',  telefon: '+420 604 567 890' },
    { id: 5, osobniCislo: 'EMP005', prijmeni: 'Krejčí',      jmeno: 'Tomáš', datNarozeni: '1988-05-30', oddeleni: 'Informační technologie', pozice: 'Správce sítě',         datNastupu: '2017-11-01', email: 't.krejci@firma.cz',       telefon: '+420 605 678 901' },
  ];
  DB.meta.nextId = 200;

  // Timesheet: first 10 days of current month for each employee
  const days = [1,2,3,4,5,8,9,10];
  days.forEach(d => {
    const date = `${y}-${m}-${String(d).padStart(2,'0')}`;
    DB.employees.forEach(emp => {
      const roll = Math.random();
      const typ  = roll > 0.88 ? 'Přesčas' : roll > 0.80 ? 'Nemoc' : 'Práce';
      const hod  = typ === 'Přesčas' ? 10 : typ === 'Nemoc' ? 0 : 8;
      DB.timesheet.push({ id: DB.meta.nextId++, zamestnanecId: emp.id, datum: date, typ, hodiny: hod, poznamka: '' });
    });
  });

  // Vacation
  DB.vacation = [
    { id: DB.meta.nextId++, zamestnanecId: 1, od: `${y}-02-17`, do: `${y}-02-21`, typ: 'Řádná dovolená',  stav: 'Schváleno',            poznamka: 'Lyžování' },
    { id: DB.meta.nextId++, zamestnanecId: 2, od: `${y}-03-03`, do: `${y}-03-07`, typ: 'Řádná dovolená',  stav: 'Schváleno',            poznamka: '' },
    { id: DB.meta.nextId++, zamestnanecId: 3, od: `${y}-${m}-20`, do: `${y}-${m}-24`, typ: 'Řádná dovolená', stav: 'Čeká na schválení', poznamka: 'Dovolená u moře' },
    { id: DB.meta.nextId++, zamestnanecId: 4, od: `${y}-01-13`, do: `${y}-01-17`, typ: 'Řádná dovolená',  stav: 'Schváleno',            poznamka: '' },
    { id: DB.meta.nextId++, zamestnanecId: 5, od: `${y}-${m}-05`, do: `${y}-${m}-05`, typ: 'Osobní volno', stav: 'Schváleno',           poznamka: 'Návštěva lékaře' },
  ];

  DB.save();
}

// ---- HELPERS ----
function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}.${m}.${y}`;
}

function workdays(od, do_) {
  let n = 0, cur = new Date(od), end = new Date(do_);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

function empName(id) {
  const e = DB.employees.find(x => x.id === id);
  return e ? `${e.prijmeni} ${e.jmeno}` : '—';
}

function empOptions(selId) {
  return DB.employees.map(e =>
    `<option value="${e.id}" ${e.id === selId ? 'selected' : ''}>${e.osobniCislo} – ${e.prijmeni} ${e.jmeno}</option>`
  ).join('');
}

// ---- STATUS BAR ----
let _statusTimer = null;
function showStatus(msg, type = 'ok') {
  const ind = document.getElementById('status-indicator');
  const txt = document.getElementById('status-msg');
  txt.textContent = msg;
  ind.className = 'status-indicator ' + (type === 'error' ? 'red' : type === 'warn' ? 'yellow' : 'green');
  clearTimeout(_statusTimer);
  _statusTimer = setTimeout(() => { txt.textContent = 'Připraven'; ind.className = 'status-indicator green'; }, 3000);
}

function updateClock() {
  const el = document.getElementById('status-datetime');
  if (el) el.textContent = new Date().toLocaleString('cs-CZ', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

// ---- LOGIN ----
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');
  if (!user) { err.textContent = 'Zadejte uživatelské jméno.'; return; }
  if (!pass) { err.textContent = 'Zadejte heslo.'; return; }
  err.textContent = '';
  document.getElementById('screen-login').style.display = 'none';
  document.getElementById('screen-main').classList.add('visible');
  document.getElementById('current-user').textContent = user.toUpperCase();
  renderSection('employees');
  showStatus(`Uživatel ${user.toUpperCase()} přihlášen.`, 'ok');
}

function doLogout() {
  if (!confirm('Opravdu se chcete odhlásit?')) return;
  document.getElementById('screen-main').classList.remove('visible');
  document.getElementById('screen-login').style.display = '';
  document.getElementById('login-pass').value = '';
}

// ---- LOGOUT (updated with keyboard shortcut) ----
document.addEventListener('keydown', e => {
  if (e.shiftKey && e.key === 'F3') doLogout();
});

// ---- TCODE NAVIGATION ----
const TCODES = {
  PA10: 'employees', PA20: 'employees', PA30: 'employees', PA40: 'employees',
  PT10: 'timesheet', PT40: 'timesheet',
  PT50: 'vacation',  PT60: 'vacation',
  S001: 'overview',
};
const EASTER_TCODES = { 'KAFE': () => triggerKafe(), 'DOKTOR': () => triggerDoktor() };

function runTCode() {
  const tc = document.getElementById('tcode-input').value.trim().toUpperCase();
  document.getElementById('tcode-input').value = '';
  if (TCODES[tc]) { renderSection(TCODES[tc]); return; }
  if (EASTER_TCODES[tc]) { EASTER_TCODES[tc](); return; }
  if (tc) showStatus(`Transakce "${tc}" nenalezena.`, 'error');
}

// ---- NAVIGATION ----
let currentSection = 'employees';

function renderSection(section) {
  currentSection = section;
  document.querySelectorAll('.sap-tab').forEach(t => t.classList.toggle('active', t.dataset.section === section));
  const ca = document.getElementById('content-area');
  switch (section) {
    case 'employees': ca.innerHTML = buildEmployees(); break;
    case 'timesheet': ca.innerHTML = buildTimesheet(); break;
    case 'vacation':  ca.innerHTML = buildVacation();  break;
    case 'overview':  ca.innerHTML = buildOverview();  break;
  }
  updateHelpCtx(section);
  // Update pohled checkmarks
  ['view-emp','view-ts','view-vac','view-ov'].forEach((a,i) => {
    const sec = ['employees','timesheet','vacation','overview'][i];
    const el = document.querySelector(`[onclick="menuAction('${a}')"]`);
    if (el) el.textContent = (sec === section ? '&#10003; ' : '\u00A0\u00A0\u00A0 ') + el.textContent.replace(/^[✓\s]+/,'');
  });
}

// ============================================================
// SECTION: ZAMĚSTNANCI
// ============================================================
function buildEmployees() {
  const rows = DB.employees.map(e => `
    <tr>
      <td><input type="checkbox" class="row-cb" data-id="${e.id}"></td>
      <td>${e.osobniCislo}</td>
      <td>${e.prijmeni}</td>
      <td>${e.jmeno}</td>
      <td>${e.oddeleni}</td>
      <td>${e.pozice}</td>
      <td>${fmtDate(e.datNastupu)}</td>
      <td>${e.email || ''}</td>
      <td>
        <button class="action-link" onclick="editEmployee(${e.id})">Upravit</button>
        &nbsp;|&nbsp;
        <button class="action-link danger" onclick="delEmployee(${e.id})">Smazat</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="9" class="no-data">Žádní zaměstnanci. Přidejte prvního zaměstnance tlačítkem výše.</td></tr>`;

  return `
    <div class="section-header">
      <span>Správa zaměstnanců &nbsp;–&nbsp; Celkem: ${DB.employees.length}</span>
      <div class="section-header-btns">
        <button class="sap-btn primary" onclick="newEmployee()">&#10010; Nový zaměstnanec</button>
        <button class="sap-btn danger"  onclick="delSelected()">&#10008; Smazat označené</button>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="alv-table">
        <thead><tr>
          <th style="width:26px"><input type="checkbox" onchange="toggleAll(this)"></th>
          <th>Osobní č.</th><th>Příjmení</th><th>Jméno</th>
          <th>Oddělení</th><th>Pozice / Funkce</th><th>Datum nástupu</th>
          <th>E-mail</th><th>Akce</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

const ODDELENI = ['Informační technologie','Lidské zdroje','Obchodní oddělení','Účetnictví','Výroba','Marketing','Management','Logistika','Právo'];

function empForm(e = {}) {
  const sel = (val, arr) => arr.map(x => `<option value="${x}" ${x === val ? 'selected':''}>${x}</option>`).join('');
  return `
    <table class="form-table">
      <tr><td><span class="req">*</span> Příjmení:</td>       <td><input type="text"  id="f-prijmeni"    value="${e.prijmeni    ||''}" style="width:220px" maxlength="50"></td></tr>
      <tr><td><span class="req">*</span> Jméno:</td>          <td><input type="text"  id="f-jmeno"       value="${e.jmeno       ||''}" style="width:220px" maxlength="50"></td></tr>
      <tr><td>Datum narození:</td>                             <td><input type="date"  id="f-datNarozeni" value="${e.datNarozeni ||''}"></td></tr>
      <tr><td><span class="req">*</span> Oddělení:</td>       <td><select id="f-oddeleni" style="width:222px"><option value="">— vyberte —</option>${sel(e.oddeleni, ODDELENI)}</select></td></tr>
      <tr><td><span class="req">*</span> Pozice / Funkce:</td><td><input type="text"  id="f-pozice"      value="${e.pozice      ||''}" style="width:220px" maxlength="80"></td></tr>
      <tr><td><span class="req">*</span> Datum nástupu:</td>  <td><input type="date"  id="f-datNastupu"  value="${e.datNastupu  ||''}"></td></tr>
      <tr><td>E-mail:</td>                                     <td><input type="email" id="f-email"       value="${e.email       ||''}" style="width:220px"></td></tr>
      <tr><td>Telefon:</td>                                    <td><input type="text"  id="f-telefon"     value="${e.telefon     ||''}" style="width:180px" maxlength="20"></td></tr>
    </table>
    <p class="form-note"><span class="req">*</span> Povinné pole</p>`;
}

function collectEmpForm() {
  const v = id => document.getElementById(id)?.value?.trim();
  const prijmeni = v('f-prijmeni'), jmeno = v('f-jmeno'), oddeleni = v('f-oddeleni'), pozice = v('f-pozice'), datNastupu = v('f-datNastupu');
  if (!prijmeni || !jmeno || !oddeleni || !pozice || !datNastupu) { alert('Vyplňte všechna povinná pole (označena *).'); return null; }
  return { prijmeni, jmeno, datNarozeni: v('f-datNarozeni'), oddeleni, pozice, datNastupu, email: v('f-email'), telefon: v('f-telefon') };
}

function newEmployee() {
  showModal('Nový zaměstnanec (PA40)', empForm(), () => {
    const d = collectEmpForm(); if (!d) return false;
    d.id = DB.nextId();
    d.osobniCislo = 'EMP' + String(d.id).padStart(3, '0');
    DB.employees.push(d); DB.save();
    renderSection('employees');
    showStatus(`Zaměstnanec ${d.prijmeni} ${d.jmeno} byl přidán.`);
    return true;
  });
}

function editEmployee(id) {
  const e = DB.employees.find(x => x.id === id); if (!e) return;
  showModal(`Změnit zaměstnance (PA30) – ${e.osobniCislo}`, empForm(e), () => {
    const d = collectEmpForm(); if (!d) return false;
    Object.assign(e, d); DB.save();
    renderSection('employees');
    showStatus(`Zaměstnanec ${e.prijmeni} ${e.jmeno} byl aktualizován.`);
    return true;
  });
}

function delEmployee(id) {
  const e = DB.employees.find(x => x.id === id); if (!e) return;
  if (!confirm(`Smazat zaměstnance ${e.prijmeni} ${e.jmeno}?\nBudou smazány i jeho záznamy docházky a dovolené.`)) return;
  DB.employees = DB.employees.filter(x => x.id !== id);
  DB.timesheet  = DB.timesheet.filter(x => x.zamestnanecId !== id);
  DB.vacation   = DB.vacation.filter(x => x.zamestnanecId !== id);
  DB.save(); renderSection('employees');
  showStatus('Zaměstnanec byl smazán.');
}

function delSelected() {
  const ids = [...document.querySelectorAll('.row-cb:checked')].map(cb => parseInt(cb.dataset.id));
  if (!ids.length) { alert('Nejprve označte záznamy.'); return; }
  if (!confirm(`Smazat ${ids.length} označených zaměstnanců?`)) return;
  ids.forEach(id => {
    DB.employees = DB.employees.filter(x => x.id !== id);
    DB.timesheet  = DB.timesheet.filter(x => x.zamestnanecId !== id);
    DB.vacation   = DB.vacation.filter(x => x.zamestnanecId !== id);
  });
  DB.save(); renderSection('employees');
  showStatus(`${ids.length} zaměstnanců smazáno.`);
}

function toggleAll(master) {
  document.querySelectorAll('.row-cb').forEach(cb => { cb.checked = master.checked; });
}

// ============================================================
// SECTION: DOCHÁZKA
// ============================================================
let tsF = {};

function buildTimesheet() {
  const now = new Date();
  if (!tsF.month) tsF.month = String(now.getMonth() + 1).padStart(2, '0');
  if (!tsF.year)  tsF.year  = String(now.getFullYear());

  const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  const mOpts = MONTHS.map((m,i) => { const v = String(i+1).padStart(2,'0'); return `<option value="${v}" ${tsF.month===v?'selected':''}>${v} – ${m}</option>`; }).join('');
  const yOpts = [-1,0,1].map(d => { const y = now.getFullYear()+d; return `<option value="${y}" ${tsF.year===String(y)?'selected':''}>${y}</option>`; }).join('');

  let entries = DB.timesheet.filter(t => {
    if (tsF.empId && t.zamestnanecId !== parseInt(tsF.empId)) return false;
    const [y, m] = t.datum.split('-');
    return m === tsF.month && y === tsF.year;
  });
  entries.sort((a, b) => a.datum.localeCompare(b.datum) || a.zamestnanecId - b.zamestnanecId);

  const totalH = entries.reduce((s, t) => s + t.hodiny, 0);
  const TBADGE = { 'Práce':'badge-blue','Přesčas':'badge-yellow','Nemoc':'badge-red','Služební cesta':'badge-green','Školení':'badge-grey' };

  const rows = entries.map(t => `
    <tr>
      <td><input type="checkbox" class="row-cb" data-id="${t.id}"></td>
      <td>${fmtDate(t.datum)}</td>
      <td>${empName(t.zamestnanecId)}</td>
      <td><span class="badge ${TBADGE[t.typ]||'badge-blue'}">${t.typ}</span></td>
      <td style="text-align:right">${t.hodiny} h</td>
      <td>${t.poznamka||''}</td>
      <td>
        <button class="action-link" onclick="editTimeEntry(${t.id})">Upravit</button>
        &nbsp;|&nbsp;
        <button class="action-link danger" onclick="delTimeEntry(${t.id})">Smazat</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" class="no-data">Žádné záznamy pro zvolené filtry.</td></tr>`;

  return `
    <div class="section-header">
      <span>Docházka zaměstnanců &nbsp;–&nbsp; ${entries.length} záznamů, ${totalH} h celkem</span>
      <button class="sap-btn primary" onclick="newTimeEntry()">&#10010; Nový záznam</button>
    </div>
    <div class="filter-bar">
      <label>Zaměstnanec:</label>
      <select class="sap-select" style="width:210px" onchange="tsF.empId=this.value;renderSection('timesheet')">
        <option value="">– Všichni –</option>${empOptions(tsF.empId?parseInt(tsF.empId):null)}
      </select>
      <label>Měsíc:</label>
      <select class="sap-select" onchange="tsF.month=this.value;renderSection('timesheet')">${mOpts}</select>
      <label>Rok:</label>
      <select class="sap-select" onchange="tsF.year=this.value;renderSection('timesheet')">${yOpts}</select>
      <button class="sap-btn" onclick="tsF={};renderSection('timesheet')">Obnovit</button>
    </div>
    <div style="overflow-x:auto">
      <table class="alv-table">
        <thead><tr>
          <th style="width:26px"><input type="checkbox" onchange="toggleAll(this)"></th>
          <th>Datum</th><th>Zaměstnanec</th><th>Typ</th>
          <th style="text-align:right">Hodiny</th><th>Poznámka</th><th>Akce</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

const TYP_TS = ['Práce','Přesčas','Nemoc','Služební cesta','Školení'];

function tsForm(t = {}) {
  const typOpts = TYP_TS.map(x => `<option value="${x}" ${t.typ===x?'selected':''}>${x}</option>`).join('');
  return `
    <table class="form-table">
      <tr><td><span class="req">*</span> Zaměstnanec:</td><td><select id="f-zam" style="width:260px"><option value="">– vyberte –</option>${empOptions(t.zamestnanecId)}</select></td></tr>
      <tr><td><span class="req">*</span> Datum:</td>       <td><input type="date" id="f-datum" value="${t.datum||''}"></td></tr>
      <tr><td><span class="req">*</span> Typ:</td>         <td><select id="f-typ" style="width:180px">${typOpts}</select></td></tr>
      <tr><td><span class="req">*</span> Hodiny:</td>      <td><input type="number" id="f-hod" value="${t.hodiny??8}" min="0" max="24" step="0.5" style="width:80px"> h</td></tr>
      <tr><td>Poznámka:</td>                               <td><input type="text" id="f-poz" value="${t.poznamka||''}" style="width:260px" maxlength="120"></td></tr>
    </table>
    <p class="form-note"><span class="req">*</span> Povinné pole</p>`;
}

function collectTsForm() {
  const zamId = parseInt(document.getElementById('f-zam').value);
  const datum = document.getElementById('f-datum').value;
  const typ   = document.getElementById('f-typ').value;
  const hod   = parseFloat(document.getElementById('f-hod').value);
  if (!zamId || !datum || !typ || isNaN(hod) || hod < 0) { alert('Vyplňte všechna povinná pole.'); return null; }
  return { zamestnanecId: zamId, datum, typ, hodiny: hod, poznamka: document.getElementById('f-poz').value.trim() };
}

function newTimeEntry() {
  const today = new Date().toISOString().slice(0,10);
  showModal('Zápis docházky (PT10)', tsForm({ datum: today, typ: 'Práce', hodiny: 8 }), () => {
    const d = collectTsForm(); if (!d) return false;
    d.id = DB.nextId(); DB.timesheet.push(d); DB.save();
    renderSection('timesheet'); showStatus('Záznam docházky přidán.'); return true;
  });
}

function editTimeEntry(id) {
  const t = DB.timesheet.find(x => x.id === id); if (!t) return;
  showModal('Změnit záznam (PT10)', tsForm(t), () => {
    const d = collectTsForm(); if (!d) return false;
    Object.assign(t, d); DB.save();
    renderSection('timesheet'); showStatus('Záznam aktualizován.'); return true;
  });
}

function delTimeEntry(id) {
  if (!confirm('Smazat tento záznam?')) return;
  DB.timesheet = DB.timesheet.filter(x => x.id !== id);
  DB.save(); renderSection('timesheet'); showStatus('Záznam smazán.');
}

// ============================================================
// SECTION: DOVOLENÁ
// ============================================================
let vacF = {};

function buildVacation() {
  const now = new Date();
  if (!vacF.year) vacF.year = String(now.getFullYear());

  const yOpts = [-1,0,1].map(d => { const y = now.getFullYear()+d; return `<option value="${y}" ${vacF.year===String(y)?'selected':''}>${y}</option>`; }).join('');

  let entries = DB.vacation.filter(v => {
    if (vacF.empId && v.zamestnanecId !== parseInt(vacF.empId)) return false;
    return v.od.startsWith(vacF.year);
  });
  entries.sort((a,b) => a.od.localeCompare(b.od));

  const SBADGE = { 'Schváleno':'badge-green','Čeká na schválení':'badge-yellow','Zamítnuto':'badge-red' };

  const rows = entries.map(v => {
    const days = workdays(v.od, v.do);
    const approve = v.stav === 'Čeká na schválení'
      ? `<button class="action-link" style="color:#005500" onclick="approveVac(${v.id},'Schváleno')">Schválit</button>
         &nbsp;|&nbsp;
         <button class="action-link danger" onclick="approveVac(${v.id},'Zamítnuto')">Zamítnout</button>
         &nbsp;|&nbsp;` : '';
    return `
      <tr>
        <td><input type="checkbox" class="row-cb" data-id="${v.id}"></td>
        <td>${empName(v.zamestnanecId)}</td>
        <td>${fmtDate(v.od)}</td>
        <td>${fmtDate(v.do)}</td>
        <td style="text-align:right">${days}</td>
        <td>${v.typ}</td>
        <td><span class="badge ${SBADGE[v.stav]||'badge-yellow'}">${v.stav}</span></td>
        <td>${v.poznamka||''}</td>
        <td>${approve}
          <button class="action-link" onclick="editVac(${v.id})">Upravit</button>
          &nbsp;|&nbsp;
          <button class="action-link danger" onclick="delVac(${v.id})">Smazat</button>
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="9" class="no-data">Žádné záznamy pro zvolené filtry.</td></tr>`;

  // Balance table
  const balRows = DB.employees.map(emp => {
    const used = DB.vacation
      .filter(v => v.zamestnanecId === emp.id && v.od.startsWith(vacF.year) && v.typ === 'Řádná dovolená' && v.stav !== 'Zamítnuto')
      .reduce((s, v) => s + workdays(v.od, v.do), 0);
    const total = 20, rem = total - used;
    const pct = Math.min(100, Math.round((used/total)*100));
    const cls = rem < 0 ? 'over' : rem < 5 ? 'warn' : '';
    return `
      <tr>
        <td>${emp.osobniCislo}</td>
        <td>${emp.prijmeni} ${emp.jmeno}</td>
        <td style="text-align:right">${total}</td>
        <td style="text-align:right">${used}</td>
        <td style="text-align:right;font-weight:bold;color:${rem<0?'#AA0000':rem<5?'#AA6600':'#005500'}">${rem}</td>
        <td><div class="vac-bar-wrap"><div class="vac-bar-fill ${cls}" style="width:${pct}%"></div></div></td>
      </tr>`;
  }).join('');

  return `
    <div class="section-header">
      <span>Evidence dovolené &nbsp;–&nbsp; ${entries.length} záznamů</span>
      <button class="sap-btn primary" onclick="newVac()">&#10010; Nová žádost</button>
    </div>
    <div class="filter-bar">
      <label>Zaměstnanec:</label>
      <select class="sap-select" style="width:210px" onchange="vacF.empId=this.value;renderSection('vacation')">
        <option value="">– Všichni –</option>${empOptions(vacF.empId?parseInt(vacF.empId):null)}
      </select>
      <label>Rok:</label>
      <select class="sap-select" onchange="vacF.year=this.value;renderSection('vacation')">${yOpts}</select>
      <button class="sap-btn" onclick="vacF={};renderSection('vacation')">Obnovit</button>
    </div>
    <div style="overflow-x:auto">
      <table class="alv-table">
        <thead><tr>
          <th style="width:26px"><input type="checkbox" onchange="toggleAll(this)"></th>
          <th>Zaměstnanec</th><th>Od</th><th>Do</th>
          <th style="text-align:right">Dní</th><th>Typ</th><th>Stav</th>
          <th>Poznámka</th><th>Akce</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <hr class="sap-hr" style="margin-top:14px">
    <div class="sub-header">Přehled čerpání dovolené ${vacF.year} &nbsp;–&nbsp; Řádná dovolená, nárok 20 dní/rok</div>
    <table class="alv-table">
      <thead><tr>
        <th>Osobní č.</th><th>Zaměstnanec</th>
        <th style="text-align:right">Nárok</th>
        <th style="text-align:right">Čerpáno</th>
        <th style="text-align:right">Zbývá</th>
        <th style="min-width:100px">Využití</th>
      </tr></thead>
      <tbody>${balRows||'<tr><td colspan="6" class="no-data">Žádní zaměstnanci.</td></tr>'}</tbody>
    </table>`;
}

const TYP_VAC  = ['Řádná dovolená','Nemocenská','Osobní volno','Studijní volno','Náhradní volno'];
const STAV_VAC = ['Čeká na schválení','Schváleno','Zamítnuto'];

function vacForm(v = {}) {
  const sel = (arr, cur) => arr.map(x => `<option value="${x}" ${x===cur?'selected':''}>${x}</option>`).join('');
  return `
    <table class="form-table">
      <tr><td><span class="req">*</span> Zaměstnanec:</td><td><select id="f-zam" style="width:260px"><option value="">– vyberte –</option>${empOptions(v.zamestnanecId)}</select></td></tr>
      <tr><td><span class="req">*</span> Od:</td>         <td><input type="date" id="f-od" value="${v.od||''}" onchange="calcVacDays()"></td></tr>
      <tr><td><span class="req">*</span> Do:</td>         <td><input type="date" id="f-do" value="${v.do||''}" onchange="calcVacDays()"></td></tr>
      <tr><td>Počet prac. dní:</td>                       <td><strong id="vac-days">—</strong></td></tr>
      <tr><td><span class="req">*</span> Typ:</td>        <td><select id="f-typ" style="width:210px">${sel(TYP_VAC,v.typ)}</select></td></tr>
      <tr><td><span class="req">*</span> Stav:</td>       <td><select id="f-stav" style="width:180px">${sel(STAV_VAC,v.stav||'Čeká na schválení')}</select></td></tr>
      <tr><td>Poznámka:</td>                              <td><input type="text" id="f-poz" value="${v.poznamka||''}" style="width:260px" maxlength="120"></td></tr>
    </table>
    <p class="form-note"><span class="req">*</span> Povinné pole</p>`;
}

function calcVacDays() {
  const od = document.getElementById('f-od')?.value;
  const do_ = document.getElementById('f-do')?.value;
  const el = document.getElementById('vac-days');
  if (!el) return;
  el.textContent = (od && do_ && od <= do_) ? workdays(od, do_) + ' dní' : '—';
}

function collectVacForm() {
  const zamId = parseInt(document.getElementById('f-zam').value);
  const od    = document.getElementById('f-od').value;
  const do_   = document.getElementById('f-do').value;
  const typ   = document.getElementById('f-typ').value;
  const stav  = document.getElementById('f-stav').value;
  if (!zamId || !od || !do_ || !typ || !stav) { alert('Vyplňte všechna povinná pole.'); return null; }
  if (od > do_) { alert('Datum "Od" nemůže být po datu "Do".'); return null; }
  return { zamestnanecId: zamId, od, do: do_, typ, stav, poznamka: document.getElementById('f-poz').value.trim() };
}

function newVac() {
  const today = new Date().toISOString().slice(0,10);
  showModal('Nová žádost o dovolenou (PT50)', vacForm({ od: today, do: today }), () => {
    const d = collectVacForm(); if (!d) return false;
    d.id = DB.nextId(); DB.vacation.push(d); DB.save();
    renderSection('vacation'); showStatus('Žádost o dovolenou přidána.'); return true;
  });
  setTimeout(calcVacDays, 0);
}

function editVac(id) {
  const v = DB.vacation.find(x => x.id === id); if (!v) return;
  showModal('Změnit žádost (PT50)', vacForm(v), () => {
    const d = collectVacForm(); if (!d) return false;
    Object.assign(v, d); DB.save();
    renderSection('vacation'); showStatus('Žádost aktualizována.'); return true;
  });
  setTimeout(calcVacDays, 0);
}

function delVac(id) {
  if (!confirm('Smazat tento záznam dovolené?')) return;
  DB.vacation = DB.vacation.filter(x => x.id !== id);
  DB.save(); renderSection('vacation'); showStatus('Záznam smazán.');
}

function approveVac(id, stav) {
  const v = DB.vacation.find(x => x.id === id); if (!v) return;
  v.stav = stav; DB.save();
  renderSection(currentSection);
  showStatus(stav === 'Schváleno' ? 'Žádost schválena.' : 'Žádost zamítnuta.');
}

// ============================================================
// SECTION: PŘEHLEDY
// ============================================================
function buildOverview() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  const mName = MONTHS[now.getMonth()];

  const monthTs = DB.timesheet.filter(t => t.datum.startsWith(`${y}-${m}`));
  const totalH  = monthTs.reduce((s,t) => s + t.hodiny, 0);
  const avgH    = DB.employees.length ? (totalH / DB.employees.length).toFixed(1) : 0;
  const pending = DB.vacation.filter(v => v.stav === 'Čeká na schválení').length;

  // Hours per employee this month
  const empHours = DB.employees.map(emp => {
    const h = monthTs.filter(t => t.zamestnanecId === emp.id).reduce((s,t) => s+t.hodiny, 0);
    return { emp, h };
  }).sort((a,b) => b.h - a.h);

  const empHRows = empHours.map(({ emp, h }) => `
    <tr>
      <td>${emp.osobniCislo}</td>
      <td>${emp.prijmeni} ${emp.jmeno}</td>
      <td>${emp.oddeleni}</td>
      <td style="text-align:right;font-weight:bold">${h} h</td>
      <td><div class="mini-bar-wrap"><div class="mini-bar-fill" style="width:${Math.min(100,Math.round(h/176*100))}%"></div></div></td>
    </tr>`).join('') || `<tr><td colspan="5" class="no-data">Žádná data.</td></tr>`;

  // Dept summary
  const depts = {};
  DB.employees.forEach(e => { depts[e.oddeleni] = (depts[e.oddeleni]||0) + 1; });
  const deptRows = Object.entries(depts).sort((a,b)=>b[1]-a[1]).map(([d,n]) => `
    <tr><td>${d}</td><td style="text-align:right;font-weight:bold">${n}</td></tr>`).join('');

  // Pending vacations
  const pendRows = DB.vacation.filter(v => v.stav === 'Čeká na schválení').map(v => `
    <tr>
      <td>${empName(v.zamestnanecId)}</td>
      <td>${fmtDate(v.od)}</td><td>${fmtDate(v.do)}</td>
      <td style="text-align:right">${workdays(v.od,v.do)}</td>
      <td>
        <button class="action-link" style="color:#005500" onclick="approveVac(${v.id},'Schváleno')">Schválit</button>
        &nbsp;|&nbsp;
        <button class="action-link danger" onclick="approveVac(${v.id},'Zamítnuto')">Zamítnout</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="5" class="no-data">Žádné čekající žádosti.</td></tr>`;

  return `
    <div class="section-header"><span>Přehledy a statistiky &nbsp;–&nbsp; ${mName} ${y}</span></div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-label">Celkem zaměstnanců</div><div class="stat-value">${DB.employees.length}</div></div>
      <div class="stat-box"><div class="stat-label">Hodiny celkem (${mName})</div><div class="stat-value">${totalH} h</div></div>
      <div class="stat-box"><div class="stat-label">Průměr hodin / os. (${mName})</div><div class="stat-value">${avgH} h</div></div>
      <div class="stat-box"><div class="stat-label">Žádosti k vyřízení</div><div class="stat-value ${pending>0?'warn':''}">${pending}</div></div>
    </div>
    <div class="overview-grid">
      <div>
        <div class="sub-header">Hodiny dle zaměstnanců — ${mName} ${y}</div>
        <table class="alv-table">
          <thead><tr><th>Osobní č.</th><th>Zaměstnanec</th><th>Oddělení</th><th style="text-align:right">Hodiny</th><th>Graf (z 176 h)</th></tr></thead>
          <tbody>${empHRows}</tbody>
        </table>
      </div>
      <div>
        <div class="sub-header">Zaměstnanci dle oddělení</div>
        <table class="alv-table">
          <thead><tr><th>Oddělení</th><th style="text-align:right">Počet</th></tr></thead>
          <tbody>${deptRows||'<tr><td colspan="2" class="no-data">—</td></tr>'}</tbody>
        </table>
        <div style="margin-top:10px">
          <div class="sub-header">Čekající žádosti o dovolenou</div>
          <table class="alv-table">
            <thead><tr><th>Zaměstnanec</th><th>Od</th><th>Do</th><th style="text-align:right">Dní</th><th>Akce</th></tr></thead>
            <tbody>${pendRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

// ============================================================
// MODAL
// ============================================================
let _modalCb = null;

function showModal(title, html, onSave) {
  document.getElementById('modal-title-text').textContent = title;
  document.getElementById('modal-content').innerHTML = html;
  _modalCb = onSave;
  document.getElementById('modal-overlay').classList.add('visible');
  setTimeout(() => {
    const first = document.querySelector('#modal-content input:not([type=hidden]), #modal-content select');
    if (first) first.focus();
  }, 50);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
  _modalCb = null;
}

function saveModal() {
  if (_modalCb && _modalCb() !== false) closeModal();
}

// ============================================================
// DROPDOWN MENUS
// ============================================================
function toggleMenu(id) {
  const dd = document.getElementById(id);
  const wasOpen = dd.classList.contains('open');
  closeAllMenus();
  if (!wasOpen) dd.classList.add('open');
}

function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown.open').forEach(d => d.classList.remove('open'));
}

function menuAction(action) {
  closeAllMenus();
  switch (action) {
    // Zaměstnanec
    case 'pa20': renderSection('employees'); break;
    case 'pa30': renderSection('employees'); break;
    case 'pa40': renderSection('employees'); setTimeout(newEmployee, 50); break;
    case 'print-emp': window.print(); break;
    // Zpracování
    case 'pt10': renderSection('timesheet'); setTimeout(newTimeEntry, 50); break;
    case 'pt40': renderSection('timesheet'); break;
    case 'pt50': renderSection('vacation');  setTimeout(newVac, 50); break;
    case 'pt60': renderSection('vacation');  break;
    // Pohled
    case 'view-emp': renderSection('employees'); break;
    case 'view-ts':  renderSection('timesheet'); break;
    case 'view-vac': renderSection('vacation');  break;
    case 'view-ov':  renderSection('overview');  break;
    case 'refresh':  renderSection(currentSection); showStatus('Obrazovka obnovena.'); break;
    // Nástroje
    case 'export':     exportData(); break;
    case 'load-demo':  reloadDemo(); break;
    case 'clear-data': clearAllData(); break;
    // Systém
    case 'sysinfo': showSysInfo(); break;
    case 'logout':  doLogout(); break;
    // Nápověda
    case 'help-keys':   showHelpModal('keys'); break;
    case 'help-tcodes': showHelpModal('tcodes'); break;
    case 'help-about':  showHelpModal('about'); break;
  }
}

// ============================================================
// TOOLS: EXPORT / IMPORT / CLEAR
// ============================================================
function exportData() {
  const data = { employees: DB.employees, timesheet: DB.timesheet, vacation: DB.vacation, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `evidence_zamestnancu_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showStatus('Data exportována do JSON souboru.');
}

function reloadDemo() {
  if (!confirm('Přepsat stávající data vzorovými daty?\nVšechna aktuální data budou ztracena.')) return;
  DB.employees = []; DB.timesheet = []; DB.vacation = []; DB.meta.nextId = 100;
  loadDemoData();
  renderSection(currentSection);
  showStatus('Vzorová data načtena.');
}

function clearAllData() {
  if (!confirm('POZOR: Opravdu smazat VŠECHNA data?\nTuto akci nelze vrátit zpět.')) return;
  DB.employees = []; DB.timesheet = []; DB.vacation = []; DB.meta.nextId = 100;
  DB.save();
  renderSection(currentSection);
  showStatus('Všechna data byla smazána.', 'warn');
}

// ============================================================
// SYSTÉM INFO
// ============================================================
function showSysInfo() {
  const rows = [
    ['Systém', 'HR-PROD'],
    ['Server', 'SAPHR01'],
    ['Verze aplikace', '1.0.0'],
    ['Klient', '001'],
    ['Jazyk', 'CS'],
    ['Přihlášený uživatel', document.getElementById('current-user')?.textContent || 'ADMIN'],
    ['Zaměstnanců v DB', DB.employees.length],
    ['Záznamů docházky', DB.timesheet.length],
    ['Záznamů dovolené', DB.vacation.length],
    ['Úložiště', 'localStorage (prohlížeč)'],
    ['Datum / čas', new Date().toLocaleString('cs-CZ')],
  ];
  const html = `
    <table class="form-table">
      ${rows.map(([k,v]) => `<tr><td>${k}:</td><td><strong>${v}</strong></td></tr>`).join('')}
    </table>`;
  showModal('Informace o systému', html, () => true);
  // Hide save button for info-only modals
  setTimeout(() => { const btn = document.getElementById('modal-save-btn'); if (btn) btn.style.display = 'none'; }, 0);
}

// ============================================================
// HELP MODALS
// ============================================================
function showHelpModal(type) {
  let title, html;
  if (type === 'keys') {
    title = 'Klávesové zkratky';
    html = `
      <div class="help-modal-section">
        <h4>Globální zkratky</h4>
        <table class="help-modal-table">
          <tr><td>F5</td>            <td>Obnovit aktuální záložku</td></tr>
          <tr><td>Esc</td>           <td>Zavřít dialog / zrušit</td></tr>
          <tr><td>Enter</td>         <td>Potvrdit přihlášení nebo uložit dialog</td></tr>
          <tr><td>Shift+F3</td>      <td>Odhlásit se ze systému</td></tr>
        </table>
      </div>
      <div class="help-modal-section">
        <h4>Transakční pole (toolbar)</h4>
        <table class="help-modal-table">
          <tr><td>PA20 / PA30</td>  <td>Zobrazit / změnit zaměstnance</td></tr>
          <tr><td>PA40</td>         <td>Nástup nového zaměstnance</td></tr>
          <tr><td>PT10</td>         <td>Nový záznam docházky</td></tr>
          <tr><td>PT40</td>         <td>Přehled docházky</td></tr>
          <tr><td>PT50</td>         <td>Nová žádost o dovolenou</td></tr>
          <tr><td>PT60</td>         <td>Přehled dovolené</td></tr>
          <tr><td>S001</td>         <td>Statistiky a přehledy</td></tr>
        </table>
      </div>`;
  } else if (type === 'tcodes') {
    title = 'Kódy transakcí (T-kódy)';
    html = `
      <div class="help-modal-section">
        <h4>Správa zaměstnanců (PA)</h4>
        <table class="help-modal-table">
          <tr><td>PA20</td><td>Zobrazit zaměstnance (read-only)</td></tr>
          <tr><td>PA30</td><td>Změnit kmenová data zaměstnance</td></tr>
          <tr><td>PA40</td><td>Nástup / přijetí zaměstnance</td></tr>
        </table>
      </div>
      <div class="help-modal-section">
        <h4>Správa docházky (PT)</h4>
        <table class="help-modal-table">
          <tr><td>PT10</td><td>Přímý zápis pracovní doby</td></tr>
          <tr><td>PT40</td><td>Přehled docházky zaměstnance</td></tr>
          <tr><td>PT50</td><td>Žádost o dovolenou / absenci</td></tr>
          <tr><td>PT60</td><td>Přehled čerpání dovolené</td></tr>
        </table>
      </div>
      <div class="help-modal-section">
        <h4>Přehledy (S)</h4>
        <table class="help-modal-table">
          <tr><td>S001</td><td>Statistiky a přehledy organizace</td></tr>
        </table>
      </div>
      <p style="margin-top:8px;font-size:10px;color:#606060;">T-kódy zadávejte do pole "Transakce" v toolbaru a potvrďte Enterem nebo tlačítkem ▶.</p>`;
  } else {
    title = 'O aplikaci';
    html = `
      <div style="text-align:center;margin-bottom:14px;">
        <div class="sap-logo-text" style="font-size:24px;padding:6px 16px">SAP</div>
        <div style="margin-top:8px;font-size:13px;font-weight:bold;color:#003399">Evidence zaměstnanců — HR modul</div>
        <div style="margin-top:4px;font-size:10px;color:#606060">Verze 1.0.0 &nbsp;|&nbsp; Klient 001 &nbsp;|&nbsp; Jazyk CS</div>
      </div>
      <div class="help-modal-section">
        <h4>Popis</h4>
        <p style="font-size:11px;line-height:1.6">
          Webová aplikace pro evidenci zaměstnanců inspirovaná rozhraním SAP GUI 7.x.<br>
          Umožňuje správu zaměstnanců, evidenci pracovní doby a evidenci dovolené.<br>
          Data jsou ukládána lokálně v prohlížeči (localStorage).
        </p>
      </div>
      <div class="help-modal-section">
        <h4>Moduly</h4>
        <table class="help-modal-table">
          <tr><td>PA – Zaměstnanci</td><td>CRUD evidence, osobní údaje, oddělení</td></tr>
          <tr><td>PT – Docházka</td>   <td>Zápis hodin, typy absencí, měsíční přehledy</td></tr>
          <tr><td>PT – Dovolená</td>   <td>Žádosti, schvalování, bilance 20 dní/rok</td></tr>
          <tr><td>S – Přehledy</td>    <td>Statistiky, grafy, čekající žádosti</td></tr>
        </table>
      </div>
      <p style="margin-top:10px;font-size:10px;color:#606060;text-align:center">Podnikové informační systémy &nbsp;|&nbsp; PEF</p>`;
  }
  showModal(title, html, () => true);
  setTimeout(() => { const btn = document.getElementById('modal-save-btn'); if (btn) btn.style.display = 'none'; }, 0);
}

// ============================================================
// HELP BOX (floating panel)
// ============================================================
const HELP_CTX = {
  employees: [
    '"Nový zaměstnanec" nebo T-kód PA40 pro přijetí pracovníka.',
    'Klikněte "Upravit" pro změnu kmenových dat.',
    'Označte více řádků a smažte hromadně.',
    'Osobní číslo (EMP…) se generuje automaticky.',
  ],
  timesheet: [
    'Vyberte zaměstnance, měsíc a rok pro filtrování.',
    'Typy: Práce (std. 8h), Přesčas (>8h), Nemoc (0h).',
    'T-kód PT10 otevře formulář nového záznamu.',
    'Tlačítko "Obnovit" resetuje všechny filtry.',
  ],
  vacation: [
    'Nárok na řádnou dovolenou je 20 dní/rok.',
    'Počet pracovních dní se počítá automaticky.',
    'Stavy: Čeká → Schváleno / Zamítnuto.',
    'Bilance na konci stránky ukazuje využití.',
  ],
  overview: [
    'Přehled ukazuje aktuální měsíc.',
    'Graf hodin: 100% = 176 h (22 dní × 8 h).',
    'Schvalovat žádosti lze přímo z přehledu.',
    'T-kód S001 pro rychlý přístup.',
  ],
};

function updateHelpCtx(section) {
  const el = document.getElementById('help-ctx');
  if (!el) return;
  const tips = HELP_CTX[section] || [];
  el.innerHTML = `
    <div class="help-section-title">${{ employees:'Zaměstnanci', timesheet:'Docházka', vacation:'Dovolená', overview:'Přehledy' }[section] || 'Nápověda'}</div>
    ${tips.map(t => `<div class="help-ctx-tip">${t}</div>`).join('')}`;
}

let helpOpen = true;
function toggleHelp() {
  helpOpen = !helpOpen;
  const body = document.getElementById('help-body');
  const icon = document.getElementById('help-chevron');
  if (body) body.classList.toggle('collapsed', !helpOpen);
  if (icon) icon.textContent = helpOpen ? '▼' : '▲';
}

// ============================================================
// EASTER EGGS
// ============================================================

// --- 1. Konami kód → Matrix ---
function initKonami() {
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  document.addEventListener('keydown', e => {
    if (!document.getElementById('screen-main').classList.contains('visible')) { idx = 0; return; }
    idx = (e.key === SEQ[idx]) ? idx + 1 : (e.key === SEQ[0] ? 1 : 0);
    if (idx === SEQ.length) { idx = 0; triggerMatrix(); }
  });
}

function triggerMatrix() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9998;';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;';
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);

  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオカキクケコ';
  const cols   = Math.floor(canvas.width / 14);
  const drops  = Array.from({ length: cols }, () => Math.random() * -60);
  let elapsed  = 0;

  const id = setInterval(() => {
    elapsed++;
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00FF41';
    ctx.font = '14px monospace';
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 14, y * 14);
      if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });

    if (elapsed === 130) {
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(canvas.width / 2 - 310, canvas.height / 2 - 90, 620, 175);
      ctx.strokeStyle = '#00FF41';
      ctx.lineWidth = 1;
      ctx.strokeRect(canvas.width / 2 - 310, canvas.height / 2 - 90, 620, 175);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00FF41';
      ctx.font = 'bold 19px "Courier New"';
      ctx.fillText('WAKE UP, ZAMĚSTNANEC...', canvas.width / 2, canvas.height / 2 - 45);
      ctx.font = '13px "Courier New"';
      ctx.fillText('SAP ví, že jsi tady.', canvas.width / 2, canvas.height / 2 - 15);
      ctx.fillText('Pracovní doba: 8:00 – nekonečno.', canvas.width / 2, canvas.height / 2 + 14);
      ctx.fillText('Dovolená: viz transakce PT50 (pokud schválena).', canvas.width / 2, canvas.height / 2 + 38);
      ctx.fillStyle = '#507050';
      ctx.font = '11px "Courier New"';
      ctx.fillText('[ Klikni pro návrat do matrice ]', canvas.width / 2, canvas.height / 2 + 72);
      overlay.style.cursor = 'pointer';
      overlay.onclick = () => { clearInterval(id); overlay.remove(); ctx.textAlign = 'left'; };
    }
    if (elapsed > 400) { clearInterval(id); overlay.remove(); ctx.textAlign = 'left'; }
  }, 30);
}

// --- 2. T-kód KAFE → Schválená přestávka ---
function triggerKafe() {
  const back = new Date(Date.now() + 15 * 60000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const html = `
    <div style="text-align:center;padding:8px 0 12px">
      <div style="font-size:42px;margin-bottom:6px">&#9749;</div>
      <div style="font-size:13px;font-weight:bold;color:#003399">Přestávka schválena systémem SAP HR</div>
      <div style="font-size:10px;color:#606060;margin-top:3px">Transakce KAFE — Správa pracovních přerušení v. 3.2</div>
    </div>
    <table class="form-table">
      <tr><td>Typ přestávky:</td>     <td><strong>Kávová pauza (KP-15)</strong></td></tr>
      <tr><td>Trvání:</td>            <td><strong>15 minut</strong></td></tr>
      <tr><td>Schválil:</td>          <td><strong>Automat. systém HR (robot)</strong></td></tr>
      <tr><td>Návrat nejpozději:</td> <td><strong style="color:#AA0000">${back}</strong></td></tr>
      <tr><td>Odpočet:</td>           <td><strong id="kafe-cd" style="color:#003399;font-size:14px">15:00</strong></td></tr>
    </table>
    <div style="margin-top:10px;padding:7px 9px;background:#FFFACC;border:1px solid #AAAA00;font-size:10px;color:#555500">
      &#9888; Upozornění: Přesáhnutí schválené doby bude zaznamenáno v docházkovém systému.
      Opakované porušení může vést k automatickému odpočtu z dovolené (MKN-10: Z73.0).
    </div>`;
  showModal('Správa pracovních přestávek (KAFE)', html, () => true);
  setTimeout(() => {
    const btn = document.getElementById('modal-save-btn');
    if (btn) { btn.textContent = '✓ Beru na vědomí'; btn.onclick = closeModal; }
    let rem = 15 * 60;
    const tid = setInterval(() => {
      const el = document.getElementById('kafe-cd');
      if (!el) { clearInterval(tid); return; }
      rem--;
      const m = Math.floor(rem / 60), s = rem % 60;
      el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (rem <= 60) el.style.color = '#AA0000';
      if (rem <= 0) { clearInterval(tid); el.textContent = 'VYPRŠELA'; }
    }, 1000);
  }, 50);
}

// --- 3. T-kód DOKTOR → Diagnostická zpráva ---
function triggerDoktor() {
  const user    = document.getElementById('current-user')?.textContent || 'ADMIN';
  const tsCount = DB.timesheet.length;
  const pending = DB.vacation.filter(v => v.stav === 'Čeká na schválení').length;
  const html = `
    <div style="background:#003399;color:#FFF;padding:5px 10px;font-weight:bold;margin-bottom:10px;font-size:12px">
      SAP HR — Diagnostická zpráva &nbsp;|&nbsp; Důvěrné
    </div>
    <table class="form-table">
      <tr><td>Pacient:</td>           <td><strong>${user}</strong></td></tr>
      <tr><td>Datum vyšetření:</td>   <td><strong>${new Date().toLocaleDateString('cs-CZ')}</strong></td></tr>
      <tr><td>Diagnóza (MKN-10):</td> <td><strong style="color:#AA0000">Z73.0 — Akutní workoholismus</strong></td></tr>
      <tr><td>Stav:</td>              <td><span class="badge badge-red">KRITICKÝ</span></td></tr>
    </table>
    <hr class="sap-hr">
    <div style="font-weight:bold;margin-bottom:5px">Klinické příznaky:</div>
    <div style="font-size:11px;line-height:2.1">
      &#9679; Správa <strong>${DB.employees.length}</strong> zaměstnanců bez viditelné únavy<br>
      &#9679; Pořízeno <strong>${tsCount}</strong> záznamů docházky (norma: 0)<br>
      &#9679; <strong>${pending}</strong> nevyřízených žádostí (symptom chronického přetížení)<br>
      &#9679; Dobrovolné používání SAP rozhraní z roku 1990 (velmi závažný příznak)
    </div>
    <hr class="sap-hr">
    <div style="font-weight:bold;margin-bottom:5px">Lékařské doporučení:</div>
    <div style="font-size:11px;line-height:2.1">
      &#10003; Okamžitá dovolená — minimálně 14 dní (viz transakce PT50)<br>
      &#10003; Redukce počtu schůzek o 73 %<br>
      &#10003; Zákaz kontroly e-mailu po 17:00<br>
      &#10003; Denní příjem kávy max. 3 šálky (viz transakce KAFE)
    </div>
    <div style="margin-top:10px;padding:6px 9px;background:#CCFFCC;border:1px solid #00AA00;font-size:10px">
      &#10003; Zpráva odeslána pojišťovně. Náhrada: 14 dní placeného léčení.
      <em>(Platné pouze v tomto systému.)</em>
    </div>`;
  showModal('SAP Medicínský modul — Diagnostika (DOKTOR)', html, () => true);
  setTimeout(() => { const btn = document.getElementById('modal-save-btn'); if (btn) btn.style.display = 'none'; }, 0);
}

// --- 4. Status indikátor 10× klik → Spořič ---
function initScreensaverEgg() {
  let clicks = 0, t = null;
  const el = document.getElementById('status-indicator');
  if (!el) return;
  el.addEventListener('click', () => {
    clicks++;
    clearTimeout(t);
    t = setTimeout(() => { clicks = 0; }, 2500);
    if (clicks >= 10) { clicks = 0; triggerScreensaver(); }
  });
}

function triggerScreensaver() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9998;cursor:none;';

  const label = document.createElement('div');
  label.innerHTML = '<span style="font-weight:bold;font-style:italic;font-size:38px;padding:8px 20px;border-radius:2px;white-space:nowrap;">SAP</span>';
  label.style.cssText = 'position:absolute;color:#FFF;';
  overlay.appendChild(label);

  const hint = document.createElement('div');
  hint.textContent = 'Klikni nebo stiskni klávesu pro pokračování';
  hint.style.cssText = 'position:absolute;bottom:20px;width:100%;text-align:center;color:#333;font-size:11px;font-family:Arial,sans-serif;';
  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  const W = window.innerWidth, H = window.innerHeight;
  const BW = 160, BH = 60;
  let x = W / 2, y = H / 2, dx = 2.2, dy = 1.9;
  const COLORS = ['#FFF', '#003399', '#CC0000', '#00AA00', '#FF8800', '#9900CC'];
  let ci = 0;

  const dismiss = () => { cancelAnimationFrame(raf); overlay.remove(); };
  overlay.addEventListener('click', dismiss);
  document.addEventListener('keydown', dismiss, { once: true });

  let raf;
  function frame() {
    x += dx; y += dy;
    let bounced = false;
    if (x + BW >= W) { x = W - BW; dx = -Math.abs(dx); bounced = true; }
    if (x <= 0)       { x = 0;       dx =  Math.abs(dx); bounced = true; }
    if (y + BH >= H)  { y = H - BH;  dy = -Math.abs(dy); bounced = true; }
    if (y <= 0)        { y = 0;       dy =  Math.abs(dy); bounced = true; }
    if (bounced) { ci = (ci + 1) % COLORS.length; label.querySelector('span').style.color = COLORS[ci]; }
    label.style.left = x + 'px';
    label.style.top  = y + 'px';
    raf = requestAnimationFrame(frame);
  }
  frame();
}

// --- 5. SAP logo v titulbaru 7× rychle → BSOD ---
function initBsodEgg() {
  let clicks = 0, t = null;
  const el = document.querySelector('.sap-logo-small');
  if (!el) return;
  el.style.cursor = 'default';
  el.addEventListener('click', () => {
    clicks++;
    clearTimeout(t);
    t = setTimeout(() => { clicks = 0; }, 1800);
    if (clicks >= 7) { clicks = 0; triggerBsod(); }
  });
}

function triggerBsod() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:#0000AA;color:#FFF;z-index:9999;
    font-family:"Courier New",monospace;font-size:12px;
    padding:40px 70px;line-height:1.8;`;
  overlay.innerHTML = `
    <div style="background:#AAAAAA;color:#0000AA;display:inline-block;padding:1px 8px;font-weight:bold;margin-bottom:20px;font-size:13px">Windows</div>
    <div style="font-size:15px;margin-bottom:20px;font-weight:bold">
      A fatal exception 0E has occurred at 0028:SAP_HR+00000042. The current<br>
      application will be terminated.
    </div>
    <div style="margin-bottom:20px">
      * Press any key to terminate the current application.<br>
      * Press CTRL+ALT+DEL again to restart your career.<br>
        You will lose any unsaved vacation days.
    </div>
    <div style="margin-bottom:24px">
      Chybový kód: EMPLOYEE_NOT_FOUND<br>
      Soubor: docházka.dll<br>
      *** STOP: 0x0000KAFE (0xC0000034, 0xDEADB055, 0xFEEDC0DE, 0x00DONUT)
    </div>
    <div id="bsod-cd">Systém se restartuje za 5 sekund...</div>`;
  document.body.appendChild(overlay);

  let s = 5;
  const tid = setInterval(() => {
    s--;
    const el = document.getElementById('bsod-cd');
    if (el) el.textContent = s > 0 ? `Systém se restartuje za ${s} sekund...` : 'Restartování SAP...';
    if (s <= 0) { clearInterval(tid); overlay.remove(); showStatus('Systém úspěšně restartován. Ztracena data: žádná.', 'ok'); }
  }, 1000);
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  DB.load();
  if (DB.employees.length === 0) loadDemoData();

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Keyboard shortcuts
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('tcode-input').addEventListener('keydown', e => { if (e.key === 'Enter') runTCode(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'F5') { e.preventDefault(); renderSection(currentSection); }
  });

  // Close dropdown menus when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu-wrap')) closeAllMenus();
  });

  // Easter eggs
  initKonami();
  initScreensaverEgg();
  initBsodEgg();
});
