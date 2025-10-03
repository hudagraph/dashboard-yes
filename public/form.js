// form.js - logic for form.html (YES 2025)
// Loads local JSON files: data_pm.json and sub_indikator.json
// APPS_SCRIPT_URL untuk submit/check duplicate
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvY3J16lZdzG6FdzVjPSQ3sHi24-HvcqNM8lNjbjrjK9qI7I6LOABK0DhGydhu3xqelQ/exec';

// helper: compute domains (same logic as dashboard)
function computeFromAnswers(obj){
  function v(k){ const val = Number(obj[k]); return isNaN(val)?0:Math.round(val); }
  function sumRange(s,e){ let ssum=0; for(let i=s;i<=e;i++) ssum += v('n'+String(i).padStart(2,'0')); return ssum; }

  const rawCampus = sumRange(1,8); const rawAkhlak = sumRange(9,26); const rawQuran = sumRange(27,33); const rawSoft = sumRange(34,43); const rawLead = sumRange(44,62);
  const maxCampus = 8*4, maxAkhlak = 18*4, maxQuran = 7*4, maxSoft = 10*4, maxLead = 19*4, maxTotal = 62*4;
  const pctCampus = Math.round((rawCampus / maxCampus) * 100) || 0;
  const pctAkhlak = Math.round((rawAkhlak / maxAkhlak) * 100) || 0;
  const pctQuran = Math.round((rawQuran / maxQuran) * 100) || 0;
  const pctSoft = Math.round((rawSoft / maxSoft) * 100) || 0;
  const pctLead = Math.round((rawLead / maxLead) * 100) || 0;
  const rawTotal = rawCampus + rawAkhlak + rawQuran + rawSoft + rawLead;
  const pctTotal = Math.round((rawTotal / maxTotal) * 100) || 0;

  return {
    _raw:{campus:rawCampus,akhlak:rawAkhlak,quranic:rawQuran,softskill:rawSoft,leadership:rawLead,total:rawTotal},
    _pct:{campus:pctCampus,akhlak:pctAkhlak,quranic:pctQuran,softskill:pctSoft,leadership:pctLead,total:pctTotal},
    campus_preparation: pctCampus, akhlak_mulia: pctAkhlak, quranic_mentorship: pctQuran, softskill: pctSoft, leadership: pctLead, total_skor: pctTotal
  };
}

function computeGrade(total){ if (total===100) return 'Excellent'; if (total>=90) return 'Very Good'; if (total>=80) return 'Good'; if (total>=70) return 'Satisfactory'; if (total>=50) return 'Need Improvement'; return 'Below Standard'; }

// State holders for JSON data
let DATA_PM = [];         // array of {Wilayah, Asesor, PM}
let SUB_INDICATOR = [];   // array of {Profile, Kode, 'Sub Indikator'}

// sections config (will be built from sub_indikator.json)
let sections = []; // [{title, items:[{Kode, Sub Indikator}]}]

const container = document.getElementById('sections-container');

// Initialize app: load local JSONs then render UI
async function initForm() {
  try {
    const [pmRes, subRes] = await Promise.all([ fetch('./data_pm.json'), fetch('./sub_indikator.json') ]);
    if (!pmRes.ok) throw new Error('Failed load data_pm.json');
    if (!subRes.ok) throw new Error('Failed load sub_indikator.json');
    DATA_PM = await pmRes.json();
    SUB_INDICATOR = await subRes.json();

    buildSectionsFromSubIndicator(SUB_INDICATOR);
    renderSections();
    setupDropdownsFromPM(DATA_PM);
    attachEventHandlers();

    // initial summary
    updateSummary();
  } catch (err) {
    console.error('initForm error', err);
    alert('Gagal memuat data lokal (data_pm.json / sub_indikator.json). Cek console.');
  }
}

// Build sections grouped by Profile using SUB_INDICATOR
function buildSectionsFromSubIndicator(list) {
  const byProfile = {};
  list.sort((a,b)=> {
    if (!a.Kode || !b.Kode) return 0;
    return a.Kode.localeCompare(b.Kode);
  }).forEach(item => {
    const profile = item.Profile || 'Unknown';
    if (!byProfile[profile]) byProfile[profile] = [];
    byProfile[profile].push(item);
  });
  sections = Object.keys(byProfile).map(k => ({ title: k, items: byProfile[k] }));
}

// Render sections in DOM as table-like blocks
function renderSections(){
  let html='';
  sections.forEach(s=>{
    html += `<div class="section-card"><div class="section-title">${s.title}</div>`;
    // header row
    html += `<div class="indicator-row header"><div class="col-no">No</div><div class="col-sub">Sub Indikator</div><div class="col-score">Skor (1-4)</div></div>`;
    // rows
    s.items.forEach((it, idx)=>{
      const kode = (it.Kode || `n${String(idx+1).padStart(2,'0')}`).toLowerCase();
      const number = (kode.match(/\d+/)||[])[0] || (idx+1);
      const label = it['Sub Indikator'] || kode;
      const indik = it.ProfileShort || '';
      html += `<div class="indicator-row"><div class="col-no">${number}</div><div class="col-sub">${label}</div><div class="col-score"><select class="inp-select select-score" data-key="${kode}"><option value="">-</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div></div>`;
    });
    html += `</div>`;
  });
  container.innerHTML = html;
}

// Setup dropdowns (Wilayah, Asesor, Nama PM) from DATA_PM
function setupDropdownsFromPM(pmList) {
  const selW = document.getElementById('sel-wilayah');
  const selA = document.getElementById('sel-asesor');
  const selN = document.getElementById('sel-nama');

  // unique wilayah
  const wilayahSet = [...new Set(pmList.map(x => x.Wilayah).filter(Boolean))].sort();
  selW.innerHTML = '<option value="">— Pilih Wilayah —</option>' + wilayahSet.map(w => `<option>${w}</option>`).join('');

  // on change filter asesor and nama
  selW.addEventListener('change', () => {
    const w = selW.value;
    const filtered = pmList.filter(x => x.Wilayah === w);
    const asesors = [...new Set(filtered.map(x=>x.Asesor).filter(Boolean))];
    selA.innerHTML = '<option value="">— Pilih Asesor —</option>' + asesors.map(a=>`<option>${a}</option>`).join('');
    selA.disabled = asesors.length === 0;
    const pms = filtered.map(x=>x.PM).filter(Boolean).sort();
    selN.innerHTML = '<option value="">— Pilih Nama PM —</option>' + pms.map(p=>`<option>${p}</option>`).join('');
    selN.disabled = pms.length === 0;
  });
}

// state helpers
function readAllAnswers(){ const out={}; document.querySelectorAll('.inp-select').forEach(el=>{ const k=el.dataset.key; const v=el.value; out[k]=v?Number(v):0; }); return out; }
function updateSummary(){ const answers = readAllAnswers(); const calc = computeFromAnswers(answers); const filled = Object.values(answers).filter(v=>v>0).length;
  document.getElementById('filled-count').textContent = filled;
  document.getElementById('score-percent').textContent = calc._pct.total;
  document.getElementById('grade-chip').textContent = computeGrade(calc._pct.total);
  document.getElementById('progress-inner').style.width = calc._pct.total + '%';
}

// attach other event handlers
function attachEventHandlers(){
  // update summary when any select changes
  document.addEventListener('change', (e)=>{ if (e.target.classList && e.target.classList.contains('inp-select')) updateSummary(); });

  // set default date to today
  (function setToday(){ const d=new Date(); const iso = d.toISOString().slice(0,10); document.getElementById('sel-tanggal').value = iso; })();

  // submit flow with duplicate check
  document.getElementById('btn-validate').addEventListener('click', async ()=>{
    // basic validation
    const wilayah = document.getElementById('sel-wilayah').value; const nama = document.getElementById('sel-nama').value; const periode = document.getElementById('sel-periode').value; const tanggal = document.getElementById('sel-tanggal').value;
    if (!wilayah || !nama || !periode) return alert('Lengkapi Wilayah, Nama PM, dan Periode sebelum submit');
    const payload = buildPayload(false);

    // lookup existing rows by keys (wilayah + nama_pm + periode)
    try{
      showLoading("Memeriksa data...");
      const q = new URLSearchParams({ action:'check', wilayah: payload.wilayah, nama_pm: payload.nama_pm, periode: payload.periode, t: Date.now() });
      const res = await fetch(APPS_SCRIPT_URL + '?' + q.toString());
      const found = res.ok ? await res.json() : [];
      hideLoading();
      if (!found || found.length===0){ // no existing -> confirm then insert
        showModal(`Tidak ditemukan data sebelumnya. Submit data baru?\\nSkor: ${payload.total_skor} - ${payload.grade}`, async ()=>{ await postSubmit(payload, 'insert'); });
      } else {
        // show duplicates and ask user
        // helper untuk format tanggal menjadi yyyy-mm-dd (fallback ke string kosong)
        function formatDateForRow(val){
          if (!val) return '';
          // jika sudah dalam format ISO / timestamp
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth()+1).padStart(2,'0');
            const dd = String(d.getDate()).padStart(2,'0');
            return `${yyyy}-${mm}-${dd}`;
          }
          // kalau bukan parseable, trim dan return as-is (safer)
          return String(val).trim();
        }

        // build table showing wilayah, nama_pm, periode, skor (bulat), tanggal
        let html = `<div class="max-h-56 overflow-auto text-sm"><p>Ditemukan ${found.length} record yang mirip:</p>`;
        html += `<table class="w-full text-sm mt-2"><thead><tr>
          <th class="text-left">Wilayah</th>
          <th class="text-left">Nama PM</th>
          <th class="text-left">Periode</th>
          <th class="text-right">Skor</th>
          <th class="text-left">Tanggal</th>
        </tr></thead><tbody>`;

        html += found.map(r => {
          const wilayah = r.wilayah || r.Wilayah || '';
          const nama = r.nama_pm || r.nama || r.nama_pm || '';
          const periodeVal = r.periode || r.Periode || '';
          // ambil skor dari beberapa kemungkinan field, lalu bulatkan (integer)
          const rawScore = (r.total_skor !== undefined && r.total_skor !== null) ? r.total_skor : (r.total_skor_pct !== undefined ? r.total_skor_pct : (r.total_score || ''));
          const scoreNum = Number(rawScore);
          const skor = Number.isFinite(scoreNum) ? Math.round(scoreNum) : (rawScore ? Math.round(Number(rawScore)) : '');

          // tanggal: coba beberapa field (tanggal, timestamp), lalu format
          const tanggalRaw = r.tanggal || r.timestamp || r.Timestamp || '';
          const tanggal = formatDateForRow(tanggalRaw);

          return `<tr>
            <td class="py-1">${escapeHtml(String(wilayah))}</td>
            <td class="py-1">${escapeHtml(String(nama))}</td>
            <td class="py-1">${escapeHtml(String(periodeVal))}</td>
            <td class="py-1 text-right">${skor}</td>
            <td class="py-1">${escapeHtml(String(tanggal))}</td>
          </tr>`;
        }).join('');

        html += `</tbody></table></div>`;

        /* small helper to avoid HTML injection or broken cells (optional but good) */
        function escapeHtml(s){
          return s.replace && typeof s.replace === 'function' ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : s;
        }

        showModal(html + '<p class="mt-2">Pilih salah satu tindakan:</p>', async ()=>{ /* primary default: update latest */ await postSubmit(Object.assign({},payload,{_updateLatest:true}), 'update'); }, 'Update existing');
      }
    }catch(err){ console.error(err); alert('Lookup gagal — coba submit langsung.'); showModal('Submit langsung?', async ()=> await postSubmit(payload,'insert')); }
  });

  async function postSubmit(payload, action){
    try{
      payload.action = action === 'update' ? 'update' : 'insert';

      showLoading("Menyimpan data...");

      // Build URL-encoded body to avoid CORS preflight
      const bodyParams = new URLSearchParams();
      for (const k in payload) {
        // skip undefined
        if (payload[k] === undefined) continue;
        // convert objects to JSON string (if any)
        const val = typeof payload[k] === 'object' ? JSON.stringify(payload[k]) : String(payload[k]);
        bodyParams.append(k, val);
      }

      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: bodyParams.toString()
      });

      // try to read json safely
      const text = await res.text();
      let j = {};
      try { j = text ? JSON.parse(text) : {}; } catch(e){ j = { raw: text }; }

      if (res.ok){ 
        localStorage.removeItem('yes2025_form_draft'); 
        hideModal(); 
        hideLoading();
        showSuccess("Data berhasil disimpan.", ()=>{ window.location.href='/index.html'; });
      }
      else {
        hideModal();
        hideLoading();
        alert('Submit gagal: ' + (j && j.error ? j.error : res.status + ' ' + res.statusText));
      }
    } catch(err){
      hideModal();
      hideLoading();
      console.error(err);
      alert('Submit error: ' + err.message);
    }
  }


  function showModal(html, onPrimary, primaryText='OK'){
    const m = document.getElementById('modal'); const body = document.getElementById('modal-content'); body.innerHTML = typeof html === 'string' ? html : '';
    document.getElementById('modal-primary').textContent = primaryText; m.style.display='flex';
    function cleanup(){ document.getElementById('modal-primary').removeEventListener('click', clickPrimary); document.getElementById('modal-cancel').removeEventListener('click', clickCancel); }
    function clickPrimary(){ cleanup(); hideModal(); if (onPrimary) onPrimary(); }
    function clickCancel(){ cleanup(); hideModal(); }
    document.getElementById('modal-primary').addEventListener('click', clickPrimary);
    document.getElementById('modal-cancel').addEventListener('click', clickCancel);
  }
  function hideModal(){ document.getElementById('modal').style.display='none'; }

  // reset
  document.getElementById('btn-reset').addEventListener('click', ()=>{ if (!confirm('Reset semua isian?')) return; document.querySelectorAll('.inp-select').forEach(s=>s.value=''); updateSummary(); });
}

// restore draft to form
function restorePayloadToForm(p){ if (!p) return; document.getElementById('sel-wilayah').value = p.wilayah || ''; const ev = new Event('change'); document.getElementById('sel-wilayah').dispatchEvent(ev); document.getElementById('sel-asesor').value = p.asesor || ''; document.getElementById('sel-nama').value = p.nama_pm || ''; document.getElementById('sel-periode').value = p.periode || 'Assessment Awal'; document.getElementById('sel-tanggal').value = p.tanggal || document.getElementById('sel-tanggal').value; for(let i=1;i<=62;i++){ const k='n'+String(i).padStart(2,'0'); const el = document.querySelector(`select[data-key="${k}"]`); if (el) el.value = p[k] || ''; } }

function buildPayload(isDraft=false){ const answers = readAllAnswers(); const calc = computeFromAnswers(answers);
  const payload = { timestamp: (new Date()).toISOString(), wilayah: document.getElementById('sel-wilayah').value || '', asesor: document.getElementById('sel-asesor').value || '', nama_pm: document.getElementById('sel-nama').value || '', periode: document.getElementById('sel-periode').value, tanggal: document.getElementById('sel-tanggal').value, total_skor: calc._pct.total, grade: computeGrade(calc._pct.total) };
  // attach n01..n62
  const keys = SUB_INDICATOR.length ? SUB_INDICATOR.map(x=>x.Kode) : Array.from({length:62},(_,i)=>'n'+String(i+1).padStart(2,'0'));
  for(let k of keys){ payload[k] = Number((readAllAnswers()[k]||0)); }
  // domain percents
  payload.campus_preparation = calc._pct.campus; payload.akhlak_mulia = calc._pct.akhlak; payload.quranic_mentorship = calc._pct.quranic; payload.softskill = calc._pct.softskill; payload.leadership = calc._pct.leadership;
  if (isDraft) payload._draft = true;
  return payload;
}

// LOADING overlay helpers
function showLoading(msg="Processing..."){
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.querySelector('span').textContent = msg;
  overlay.classList.remove('hidden');
}
function hideLoading(){
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
}

// SUCCESS modal helpers
function showSuccess(message, onOk){
  const m = document.getElementById('success-modal');
  const msgEl = document.getElementById('success-message');
  if (!m || !msgEl) return;

  msgEl.textContent = message || "Data berhasil disimpan.";

  m.classList.remove('hidden');  // kalau ada hidden
  m.style.display = 'flex';

  function cleanup(){
    document.getElementById('success-ok').removeEventListener('click', okHandler);
  }
  function okHandler(){
    cleanup();
    m.style.display = 'none';
    m.classList.add('hidden');
    if (onOk) onOk();
  }
  document.getElementById('success-ok').addEventListener('click', okHandler);
}


// boot
initForm();
