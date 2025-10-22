// main.js - CLEAN rebuilt by assistant
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXBexoF7cEi9ZHHTXkMMCigNLVcsyP-GdqiiPODkRbosgnNnpA1eyFygRHeo9MZ1eG/exec';
const TomSelect = window.TomSelect;
const TOTAL_PM_TARGET = 85;

// Overlay
let overlay = document.getElementById('loading-overlay');
if (!overlay) {
  overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'hidden';
  overlay.style.display = 'none';
  overlay.innerHTML = '<div class="text-center"><div class="inline-block p-6 bg-white rounded shadow"><div class="mb-3 font-medium">Loading data…</div><div class="w-48 h-2 bg-slate-100 rounded skeleton"></div></div></div>';
  document.body.appendChild(overlay);
}

const btnRefresh = document.getElementById('btn-refresh');
const btnAuto = document.getElementById('btn-autoref');
const autoIntervalInput = document.getElementById('auto-interval');

const tsPeriode = new TomSelect('#select-periode', { create:false, placeholder: 'Filter Periode' });
const tsWilayah = new TomSelect('#select-tags', { plugins:['remove_button'], create:false, placeholder: 'Filter Wilayah' });
const tsNama = new TomSelect('#select-nama', { plugins:['remove_button'], create:false, placeholder: 'Pilih Wilayah terlebih dahulu', maxItems:null });
tsNama.disable();

let DATA_ROWS = [];
let currentFilters = { wilayah: [], periode: [], nama_pm: [] };
let autoIntervalId = null;
let chartWilayah=null, chartTrend=null, chartDomain=null, chartGrade=null;

function scoreToLabel(score) {
  if (score === null || score === undefined || isNaN(Number(score))) return '—';
  score = Number(score);
  if (score === 100) return 'Excellent';
  if (score >= 90) return 'Very Good';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 50) return 'Need Improvement';
  return 'Below Standard';
}

const SUB_INDICATORS = {
  "n01": "Seluruh nilai pada rapor mampu mencapai KKM",
  "n02": "Nilai rata-rata rapor meningkat setiap semester",
  "n03": "Nilai ulangan harian dan tugas mencapai KKM",
  "n04": "Mampu menentukan jurusan dan kampus tujuan",
  "n05": "Memiliki dan menjalankan strategi lolos ke kampus tujuan",
  "n06": "Mampu mengerjakan soal tes ujian masuk PTN",
  "n07": "Mendapatkan beasiswa (KIPK, swasta, orang tua asuh, iluni, dll)",
  "n08": "Menyusun dokumen persiapan beasiswa secara mandiri",
  "n09": "Menegakkan sholat 5 waktu",
  "n10": "Berdzikir setelah sholat dan pada keadaan tertentu",
  "n11": "Melaksanakan amalan sunnah tertentu (dhuha, tahajjud, shaum dsj)",
  "n12": "Mengetahui sirah nabawiyah dasar",
  "n13": "Memiliki aqidah yang lurus sesuai ahlussunnah wal-jama'ah",
  "n14": "Mampu menerapkan 24 hadits pilihan (tentang aqidah, akhlak dan ibadah)",
  "n15": "Tidak terlibat pergaulan bebas, narkoba, dan perbuatan maksiat lainnya",
  "n16": "Meminta ijin dan mencium tangan orang tua ketika pergi dan pulang ke rumah",
  "n17": "Bersikap lemah lembut kepada orang tua",
  "n18": "Membantu pekerjaan orangtua",
  "n19": "Berdo'a untuk orangtua",
  "n20": "Berwudhu sebelum belajar",
  "n21": "Berdo'a sebelum dan sesudah belajar",
  "n22": "Serius / fokus dalam menyimak pelajaran",
  "n23": "Bersikap sopan dan hormat kepada guru",
  "n24": "Mengulang / membaca kembali pelajaran yang telah didapatkan",
  "n25": "Mampu memahami Fiqih thaharah",
  "n26": "Mampu memahami Fiqih Sholat",
  "n27": "Mampu memahami Fiqih Puasa",
  "n28": "Menguasai tahsin al-Qur'an",
  "n29": "Melaksanakan tilawah harian",
  "n30": "Mampu menulis huruf Arab",
  "n31": "Melaksanakan Tadabbur Al-Quran",
  "n32": "Mampu menyelesaikan hafalan Juz 30",
  "n33": "Melakukan muroja'ah setiap hari",
  "n34": "Menghafal 24 hadits pilihan (tentang aqidah, akhlak dan ibadah)",
  "n35": "Menyusun dan memiliki Individual Development Plan",
  "n36": "Menerapkan Individual Development Plan  dallam kegiatan sehari-hari",
  "n37": "Melakukan Self Assesment untuk menemukan minat dan bakat",
  "n38": "Mampu membaca efektif",
  "n39": "Mampu menerapkan teknik menghafal efektif",
  "n40": "Mampu mencatat dengan teknik mindmapping",
  "n41": "Melakukan pengembangan diri secara mandiri atau mengikuti pelatihan sesuai minat",
  "n42": "Mampu membuat CV dan Portofolio",
  "n43": "Memahami literasi keuangan dasar",
  "n44": "Mampu menggunakan canva, notion dan Chat Gpt untuk pelajar",
  "n45": "Berani tampil di depan publik",
  "n46": "Aktif bertanya",
  "n47": "Berani menyampaikan pendapat atau ide",
  "n48": "Siap memimpin kelompok / tim",
  "n49": "Mampu mengidentifikasi masalah",
  "n50": "Mampu menentukan sumber dan akar penyebab dari masalah",
  "n51": "Mampu merumuskan solusi masalah secara efektif dan efisien",
  "n52": "Menjaga barang-barang yang dimiliki dan menggunakannya dengan baik",
  "n53": "Mengerjakan tugas yang menjadi tanggung jawabnya",
  "n54": "Berani mengakui kesalahan dan meminta maaf atas kesalahan yang telah dilakukan",
  "n55": "Mengikuti KBM sekolah sesuai jadwal",
  "n56": "Hadir tepat waktu dalam setiap kegiatan",
  "n57": "Mengikuti kegiatan pembinaan program",
  "n58": "Menguasai kemampuan public speaking",
  "n59": "Memiliki kebiasaan menulis jurnal harian sebagai penerima manfaat",
  "n60": "Mampu membuat tulisan sederhana (opini, cerpen, dsj.)",
  "n61": "Menolong orang yang tidak mampu / membutuhkan bantuan",
  "n62": "Menyusun dan memiliki social project"
};

function mostFrequentGrade(rows) {
  const map = {};
  rows.forEach(r => {
    const g = r.grade || scoreToLabel(Number((r._pct && r._pct.total) || r.total_skor_pct || 0)) || 'Unknown';
    map[g] = (map[g] || 0) + 1;
  });
  const entries = Object.entries(map).sort((a,b)=> b[1]-a[1]);
  return entries.length ? entries[0][0] : '—';
}

function uniq(arr){ return Array.from(new Set((arr||[]).filter(v=>v!==undefined && v!==null && v!==''))); }
function safeAddOption(ts, value, text){
  if(!ts || value===undefined || value===null) return;
  try { if (!ts.options || !ts.options[value]) ts.addOption({value, text}); }
  catch(e){ try { ts.addOption({value, text}); } catch(err){} }
}
function setTsPlaceholder(ts, text){
  try {
    if (ts.control_input) ts.control_input.placeholder = text;
    else if (ts.input) ts.input.placeholder = text;
    else if (ts.control && ts.control.querySelector) {
      const inp = ts.control.querySelector('input'); if (inp) inp.placeholder = text;
    }
    if (ts.settings) ts.settings.placeholder = text;
  } catch(e){}
}

function showLoading(){ overlay.style.display='flex'; overlay.classList.remove('hidden'); }
function hideLoading(){ overlay.style.display='none'; overlay.classList.add('hidden'); }

async function fetchData(){
  try {
    const res = await fetch(APPS_SCRIPT_URL+'?t='+Date.now(),{cache:'no-cache'});
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch(e){ console.error(e); return null; }
}

async function loadDataInit(){
  showLoading();
  const raw = await fetchData();
  if (!raw){ hideLoading(); return; }

  DATA_ROWS = raw.map(r=>{
    const norm={}; Object.keys(r).forEach(k=> norm[k.trim()]=r[k]);
    for (let i=1;i<=62;i++){
      const key='n'+String(i).padStart(2,'0');
      const v = norm.hasOwnProperty(key)?Number(norm[key]):null;
      norm[key]= isNaN(v)?null:Math.round(v);
    }
    if (!norm.hasOwnProperty('total_skor')) norm.total_skor=null;
    return computeDomains(norm);
  });

  buildOptionsFromData(DATA_ROWS);
  hideLoading();
  emitFiltersChanged();
}

// helpers for options & filtering
function buildOptionsFromData(rows){
  const wilayahList = uniq(rows.map(r=>r.wilayah));
  const periodeList = uniq(rows.map(r=>r.periode));
  const namaList = uniq(rows.map(r=>r.nama_pm));

  tsWilayah.clearOptions(); tsPeriode.clearOptions(); tsNama.clearOptions();
  periodeList.forEach(p=> safeAddOption(tsPeriode,p,p)); tsPeriode.refreshOptions(false);
  wilayahList.forEach(w=> safeAddOption(tsWilayah,w,w)); tsWilayah.refreshOptions(false);
  namaList.forEach(n=> safeAddOption(tsNama,n,n)); tsNama.refreshOptions(false);

  setTsPlaceholder(tsPeriode,'Filter Periode');
  setTsPlaceholder(tsWilayah,'Filter Wilayah');
  setTsPlaceholder(tsNama,'Pilih Wilayah terlebih dahulu');
}

function filterNamaByWilayah(rows, selected){
  if (!selected || selected.length===0) return uniq(rows.map(r=>r.nama_pm));
  const sel = Array.isArray(selected)?selected:[selected];
  return uniq(rows.filter(r=> sel.includes(r.wilayah)).map(r=>r.nama_pm));
}

// events
function emitFiltersChanged(){
  currentFilters = {
    wilayah: [].concat(tsWilayah.getValue()||[]),
    periode: [].concat(tsPeriode.getValue()||[]),
    nama_pm: [].concat(tsNama.getValue()||[])
  };
  renderAll();
}
tsWilayah.on('change', val=>{
  const names = filterNamaByWilayah(DATA_ROWS, [].concat(val||[]));
  tsNama.clearOptions(); names.forEach(n=> safeAddOption(tsNama,n,n)); tsNama.refreshOptions(false);
  if (names.length>0){ tsNama.enable(); setTsPlaceholder(tsNama,'Pilih Nama'); }
  else { tsNama.disable(); setTsPlaceholder(tsNama,'Pilih Wilayah terlebih dahulu'); }
  emitFiltersChanged();
});
tsPeriode.on('change', emitFiltersChanged);
tsNama.on('change', emitFiltersChanged);

// compute grade
function computeGrade(total){
  if (total===null || total===undefined || isNaN(Number(total))) return null;
  total = Number(total);
  if (total === 100) return 'Excellent';
  if (total >= 90) return 'Very Good';
  if (total >= 80) return 'Good';
  if (total >= 70) return 'Satisfactory';
  if (total >= 50) return 'Need Improvement';
  return 'Below Standard';
}

// --- computeDomains (raw sums -> percent rounded)
function computeDomains(row){
  function val(k){ const v = row[k]; if (v===null || v===undefined || v==='') return 0; const n=Number(v); return isNaN(n)?0:Math.round(n); }
  function sumRange(s,e){ let ssum=0; for(let i=s;i<=e;i++){ ssum += val('n'+String(i).padStart(2,'0')); } return ssum; }

  const rawCampus = sumRange(1,8);
  const rawAkhlak = sumRange(9,26);
  const rawQuran  = sumRange(27,33);
  const rawSoft   = sumRange(34,43);
  const rawLead   = sumRange(44,62);
  const rawTotal  = rawCampus + rawAkhlak + rawQuran + rawSoft + rawLead;

  const maxCampus = 8 * 4;
  const maxAkhlak = 18 * 4;
  const maxQuran = 7 * 4;
  const maxSoft = 10 * 4;
  const maxLead = 19 * 4;
  const maxTotal = 62 * 4;

  const pctCampus = Math.round((rawCampus / maxCampus) * 100);
  const pctAkhlak = Math.round((rawAkhlak / maxAkhlak) * 100);
  const pctQuran  = Math.round((rawQuran / maxQuran) * 100);
  const pctSoft   = Math.round((rawSoft / maxSoft) * 100);
  const pctLead   = Math.round((rawLead / maxLead) * 100);
  const pctTotal  = Math.round((rawTotal / maxTotal) * 100);

  const out = Object.assign({}, row);
  out._raw = { campus: rawCampus, akhlak: rawAkhlak, quranic: rawQuran, softskill: rawSoft, leadership: rawLead, total: rawTotal };
  out._pct = { campus: pctCampus, akhlak: pctAkhlak, quranic: pctQuran, softskill: pctSoft, leadership: pctLead, total: pctTotal };

  out.campus_preparation = out._pct.campus;
  out.akhlak_mulia = out._pct.akhlak;
  out.quranic_mentorship = out._pct.quranic;
  out.softskill = out._pct.softskill;
  out.leadership = out._pct.leadership;

  out.total_skor_raw = rawTotal;
  out.total_skor_pct = out._pct.total;
  out.total_skor = out.total_skor_pct;

  out.grade = computeGrade(out._pct.total);

  // ensure nXX are integers
  for (let i=1;i<=62;i++){ const k='n'+String(i).padStart(2,'0'); if (out.hasOwnProperty(k)) out[k] = val(k); }

  return out;
}

// filtered rows
window.getFilteredRows = function(){
  const f=currentFilters;
  return DATA_ROWS.filter(r=>{
    if (f.wilayah.length && !f.wilayah.includes(r.wilayah)) return false;
    if (f.periode.length && !f.periode.includes(r.periode)) return false;
    if (f.nama_pm.length && !f.nama_pm.includes(r.nama_pm)) return false;
    return true;
  });
};

function avg(arr){ if(!arr.length) return 0; return arr.reduce((a,b)=>a+b,0)/arr.length; }

// render KPIs - use percent totals and integers
function renderKPIs(filtered) {
  const total = filtered.length;
  document.getElementById('kpi-total-dinilai').textContent = total;
  const targetEl = document.getElementById('kpi-total-dinilai-sub');
  if (targetEl) targetEl.textContent = `dari target: ${TOTAL_PM_TARGET}`;

  const avgTotal = filtered.length ? Math.round(filtered.reduce((s,r)=> s + (Number((r._pct && r._pct.total) || r.total_skor_pct) || 0),0) / filtered.length) : 0;
  document.getElementById('kpi-avg-percent').textContent = `${avgTotal}`;

  const wilayahCount = new Set(filtered.map(r => r.wilayah).filter(Boolean)).size;
  document.getElementById('kpi-wilayah-count').textContent = wilayahCount;

  const avgGradeLabel = mostFrequentGrade(filtered);
  document.getElementById('kpi-avg-grade').textContent = avgGradeLabel;
  const distro = {};
  filtered.forEach(r => { const g = r.grade || scoreToLabel(Number((r._pct && r._pct.total) || r.total_skor_pct || 0)); distro[g] = (distro[g]||0) + 1; });
  const distroText = Object.entries(distro).map(([k,v]) => `${k}: ${v}`).join(' · ');
  document.getElementById('kpi-avg-grade-sub').textContent = distroText.slice(0,120);
}

// render table & modal
function renderTable(filtered) {
  const tbody = document.querySelector('#tbl-data tbody');
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();
  filtered.forEach(r => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 cursor-pointer';
    tr.innerHTML = `
      <td class="p-2">${r.wilayah||''}</td>
      <td class="p-2">${r.nama_pm||''}</td>
      <td class="p-2">${r.periode||''}</td>
      <td class="p-2">${r.total_skor ?? ''}</td>
      <td class="p-2">${r.grade ?? ''}</td>
    `;
    tr.addEventListener('click', () => {
      const modal = document.getElementById('modal');
      const body = document.getElementById('modal-body');
      let html = `<div class="space-y-3">`;
      html += `<div class="flex justify-end gap-2"><button id="modal-export-pdf" class="px-3 py-1 bg-blue-600 text-white rounded">Export PDF (This PM)</button></div>`;
      html += `<div><h5 class="font-semibold mb-1">Data Utama</h5><table class="w-full text-sm">`;
      ['timestamp','wilayah','asesor','nama_pm','periode','tanggal','total_skor','grade'].forEach(k => {
        if (! (k in r)) return;
        html += `<tr class="border-b"><td class="p-1 font-medium w-1/3 bg-slate-50">${k}</td><td class="p-1">${r[k] ?? ''}</td></tr>`;
      });
      html += `</table></div>`;

      html += `<div><h5 class="font-semibold mt-3 mb-1">Profil</h5><table class="w-full text-sm">`;
      ['campus_preparation','akhlak_mulia','quranic_mentorship','softskill','leadership'].forEach(k => {
        html += `<tr class="border-b"><td class="p-1 font-medium w-1/3 bg-slate-50">${k}</td><td class="p-1">${r[k] ?? ''} (${scoreToLabel(Number(r[k]||0))})</td></tr>`;
      });
      html += `</table></div>`;

      const domainGroups = [
        { title: 'Campus Preparation', start:1, end:8 },
        { title: 'Akhlak Mulia', start:9, end:26 },
        { title: 'Quranic Mentorship', start:27, end:33 },
        { title: 'Softskill', start:34, end:43 },
        { title: 'Leadership', start:44, end:62 }
      ];
      domainGroups.forEach(g => {
        html += `<div><h5 class="font-semibold mt-3 mb-1">${g.title}</h5><table class="w-full text-sm">`;
        for (let i=g.start;i<=g.end;i++){
          const key = 'n'+String(i).padStart(2,'0');
          if (key in r) {
            const label = (SUB_INDICATORS[key] || key);
            const val = r[key] ?? '';
            html += `<tr class="border-b"><td class="p-1 font-medium bg-slate-50" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:520px;">${label}</td><td class="p-1 text-right" style="white-space:nowrap;">${val}</td></tr>`;
          }
        }
        html += `</table></div>`;
      });

      html += `</div>`;
      body.innerHTML = html;

      // attach modal export
      const btnModalExport = document.getElementById('modal-export-pdf');
      if (btnModalExport) {
        btnModalExport.addEventListener('click', function(e){
          e.stopPropagation();
          try { exportPMToPDF(r); } catch(err){ console.error('export PM failed', err); alert('Export PM gagal: '+err.message); }
        });
      }

      modal.classList.remove('hidden'); modal.classList.add('flex');
    });
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

// render charts using percent fields
function renderCharts(filtered) {
  function makeOrUpdate(ctx, existing, cfg) {
    if (!ctx) return null;
    if (existing) {
      try { existing.data = cfg.data; existing.options = cfg.options; existing.update(); return existing; } catch(e){ try{ existing.destroy(); }catch(_){} }
    }
    return new Chart(ctx, cfg);
  }

  try {
    const perPer = {};
    filtered.forEach(r => {
      const k = r.periode || '—'; if (!perPer[k]) perPer[k]=[];
      perPer[k].push(Number((r._pct && r._pct.total) || r.total_skor_pct) || 0);
    });
    const labelsPeriod = Object.keys(perPer).sort((a,b)=> String(a).localeCompare(b));
    const dataPeriod = labelsPeriod.map(l => { const arr = perPer[l]; return arr && arr.length ? Math.round(arr.reduce((s,x)=>s+Number(x),0)/arr.length) : 0; });
    const elTrend = document.getElementById('chart-trend-periode');
    if (elTrend) {
      const ctxTrend = elTrend.getContext('2d');
      const cfgTrend = { type:'line', data:{ labels: labelsPeriod, datasets:[{ label:'Avg total', data: dataPeriod, fill:true, tension:0.25 }]}, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:true, suggestedMax:100 } } } };
      chartTrend = makeOrUpdate(ctxTrend, chartTrend, cfgTrend);
    }
  } catch(e){ console.warn('trend chart error', e); }

  try {
    const perWil = {};
    const domains = [
      { key: 'campus', field: '_pct.campus', label: 'Campus Preparation', color: 'rgba(255, 99, 132, 0.8)' },   // merah
      { key: 'akhlak', field: '_pct.akhlak', label: 'Akhlak Mulia', color: 'rgba(75, 192, 75, 0.8)' },         // hijau
      { key: 'quranic', field: '_pct.quranic', label: 'Quranic Mentorship', color: 'rgba(54, 162, 235, 0.8)' }, // biru
      { key: 'softskill', field: '_pct.softskill', label: 'Softskill', color: 'rgba(255, 206, 86, 0.8)' },      // kuning
      { key: 'leadership', field: '_pct.leadership', label: 'Leadership', color: 'rgba(255, 159, 64, 0.8)' }    // oranye
    ];

    // kumpulkan data per wilayah
    filtered.forEach(r => {
      const w = r.wilayah || '—';
      if (!perWil[w]) perWil[w] = { campus: [], akhlak: [], quranic: [], softskill: [], leadership: [] };
      perWil[w].campus.push(Number((r._pct && r._pct.campus) || 0));
      perWil[w].akhlak.push(Number((r._pct && r._pct.akhlak) || 0));
      perWil[w].quranic.push(Number((r._pct && r._pct.quranic) || 0));
      perWil[w].softskill.push(Number((r._pct && r._pct.softskill) || 0));
      perWil[w].leadership.push(Number((r._pct && r._pct.leadership) || 0));
    });

    const wilayahLabels = Object.keys(perWil).sort((a,b)=> String(a).localeCompare(b));

    // hitung rata-rata per domain per wilayah
    const avgPerDomain = (wilayah, key) => {
      const arr = perWil[wilayah][key] || [];
      return arr.length ? Math.round(arr.reduce((s,x)=>s+x,0)/arr.length) : 0;
    };

    const datasets = domains.map(d => ({
      label: d.label,
      backgroundColor: d.color,
      data: wilayahLabels.map(w => avgPerDomain(w, d.key))
    }));

    const elW = document.getElementById('chart-wilayah');
    if (elW) {
      const ctxW = elW.getContext('2d');
      const cfgW = {
        type: 'bar',
        data: {
          labels: wilayahLabels,
          datasets: datasets
        },
        options: {
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { beginAtZero: true, suggestedMax: 100, title: { display: true, text: 'Rata-rata (%)' } },
            x: { title: { display: true, text: 'Wilayah' } }
          },
          plugins: {
            legend: { position: 'top' },
            tooltip: { enabled: true }
          }
        }
      };
      chartWilayah = makeOrUpdate(ctxW, chartWilayah, cfgW);
    }
  } catch (e) {
    console.warn('wilayah chart error', e);
  }

  try {
    const domains = ['campus_preparation','akhlak_mulia','quranic_mentorship','softskill','leadership'];
    const mapShort = { campus_preparation:'campus', akhlak_mulia:'akhlak', quranic_mentorship:'quranic', softskill:'softskill', leadership:'leadership' };
    const domainAvg = domains.map(d => { const short = mapShort[d]; const arr = filtered.map(r=> Number((r._pct && r._pct[short]) || r[d] || 0)).filter(v=>!isNaN(v)); return arr.length ? Math.round(arr.reduce((s,x)=>s+x,0)/arr.length) : 0; });
    const elD = document.getElementById('chart-domain');
    if (elD) {
      const ctxD = elD.getContext('2d');
      const cfgD = { type:'bar', data:{ labels: ['Campus Preparation','Akhlak Mulia','Quranic Mentorship','Softskill','Leadership'], datasets:[{ label:'Avg domain', data: domainAvg }]}, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:true, suggestedMax:100 } } } };
      chartDomain = makeOrUpdate(ctxD, chartDomain, cfgD);
    }
  } catch(e){ console.warn('domain chart error', e); }

  try {
    const gradeBuckets = {};
    filtered.forEach(r => { const g = r.grade || computeGrade(Number((r._pct && r._pct.total) || r.total_skor_pct || 0)) || 'Unknown'; gradeBuckets[g] = (gradeBuckets[g]||0)+1; });
    const gradeLabels = Object.keys(gradeBuckets).sort((a,b)=> String(a).localeCompare(b));
    const gradeData = gradeLabels.map(l => gradeBuckets[l]);
    const elG = document.getElementById('chart-grade');
    if (elG) {
      const ctxG = elG.getContext('2d');
      const cfgG = { type:'pie', data:{ labels: gradeLabels, datasets:[{ data: gradeData }] }, options:{ responsive:true, plugins:{ legend:{ position:'right' } } } };
      chartGrade = makeOrUpdate(ctxG, chartGrade, cfgG);
    }
  } catch(e){ console.warn('grade chart error', e); }
}

function renderProfileAverages(filtered) {
  const domains = [
    { key:'campus_preparation', el:'pf-campus', cat:'pf-campus-cat' },
    { key:'akhlak_mulia', el:'pf-akhlak', cat:'pf-akhlak-cat' },
    { key:'quranic_mentorship', el:'pf-quranic', cat:'pf-quranic-cat' },
    { key:'softskill', el:'pf-softskill', cat:'pf-softskill-cat' },
    { key:'leadership', el:'pf-leadership', cat:'pf-leadership-cat' }
  ];

  domains.forEach(d => {
    const vals = filtered.map(r => Number(r[d.key] || 0)).filter(v => !isNaN(v));
    const avg = vals.length ? Math.round(vals.reduce((s,x)=>s+x,0)/vals.length) : 0;
    document.getElementById(d.el).textContent = avg ? String(avg) : '—';
    document.getElementById(d.cat).textContent = avg ? scoreToLabel(avg) : '—';
  });
}

function renderAll(){
  const f=window.getFilteredRows();
  renderKPIs(f);
  renderTable(f);
  renderCharts(f);
  renderProfileAverages(f);
}

// reload/auto
async function reloadData(){ await loadDataInit(); }
function startAutoRefresh(sec=30){ stopAutoRefresh(); autoIntervalId=setInterval(()=>reloadData(),sec*1000); btnAuto.textContent='Stop Auto'; btnAuto.classList.remove('bg-green-600'); btnAuto.classList.add('bg-red-600'); }
function stopAutoRefresh(){ if (autoIntervalId){ clearInterval(autoIntervalId); autoIntervalId=null; btnAuto.textContent='Start Auto'; btnAuto.classList.remove('bg-red-600'); btnAuto.classList.add('bg-green-600'); } }

btnRefresh.addEventListener('click', ()=> reloadData());
btnAuto.addEventListener('click', ()=> { if (!autoIntervalId) startAutoRefresh(Number(autoIntervalInput.value)||30); else stopAutoRefresh(); });

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('modal-close');
  const modal = document.getElementById('modal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); modal.classList.remove('flex'); });
  }
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); } });
});

document.getElementById('btn-reset').addEventListener('click', () => {
  try { tsWilayah.clear(true); tsPeriode.clear(true); tsNama.clear(true); } catch(e){ tsWilayah.setValue([]); tsPeriode.setValue([]); tsNama.setValue([]); }
  emitFiltersChanged();
});

// Export button in UI
(function addExportButton(){
  try {
    const btn = document.createElement('button');
    btn.id = 'btn-export-pdf';
    btn.type = 'button';
    btn.className = 'ml-2 px-3 py-2 bg-blue-600 text-white rounded';
    btn.textContent = 'Export PDF';
    if (btnAuto && btnAuto.parentNode) btnAuto.parentNode.insertBefore(btn, btnAuto.nextSibling);
    btn.addEventListener('click', async function(){
      btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Preparing...';
      try { await exportFilteredViewToPDF(); } catch(e){ console.error(e); alert('Export gagal: '+e.message); }
      btn.disabled = false; btn.textContent = orig;
    });
  } catch(e){ console.warn('addExportButton failed', e); }
})();

// export filtered view
async function exportFilteredViewToPDF() {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) { alert('Library jsPDF belum dimuat. Pastikan script CDN tersedia.'); return; }
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const rows = window.getFilteredRows ? window.getFilteredRows() : DATA_ROWS || [];
  const now = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = margin;

  doc.setFontSize(16); doc.text('Laporan Dashboard', pageWidth/2, y, { align:'center' }); y += 8;
  doc.setFontSize(10); doc.text('Tanggal: '+now.toLocaleString(), margin, y); y += 6;
  doc.text('Filter: Periode=' + (tsPeriode.getValue()||'All') + ', Wilayah=' + (tsWilayah.getValue()||'All') + ', Nama=' + (tsNama.getValue()||'All'), margin, y); y += 8;
  doc.text('Total Dinilai: ' + rows.length, margin, y); y += 6;
  const avgTotal = rows.length ? Math.round(rows.reduce((s,r)=> s + (Number((r._pct && r._pct.total) || r.total_skor_pct) || 0),0)/rows.length) : 0;
  doc.text('Rata-rata Total: ' + avgTotal, margin, y); y += 8;

  // charts snapshot - capture canvases if present
  const chartIds = ['chart-trend-periode','chart-wilayah','chart-domain','chart-grade'];
  for (const id of chartIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const canvas = el.getContext ? el : (el.querySelector && el.querySelector('canvas')) ? el.querySelector('canvas') : null;
    if (!canvas || !canvas.toDataURL) continue;
    try {
      const img = canvas.toDataURL('image/png',1.0);
      const imgProps = doc.getImageProperties(img);
      const maxW = pageWidth - margin*2;
      const h = (imgProps.height * maxW) / imgProps.width;
      if (y + h > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.addImage(img, 'PNG', margin, y, maxW, h); y += h + 6;
    } catch(e){ console.warn('chart export failed', e); }
  }

  // Profil summary table (autoTable if available)
  const domainRows = [
    ['Campus Preparation', String(getAvgFromFiltered(rows,'campus')), scoreToLabel(getAvgFromFiltered(rows,'campus'))],
    ['Akhlak Mulia', String(getAvgFromFiltered(rows,'akhlak')), scoreToLabel(getAvgFromFiltered(rows,'akhlak'))],
    ['Quranic Mentorship', String(getAvgFromFiltered(rows,'quranic')), scoreToLabel(getAvgFromFiltered(rows,'quranic'))],
    ['Softskill', String(getAvgFromFiltered(rows,'softskill')), scoreToLabel(getAvgFromFiltered(rows,'softskill'))],
    ['Leadership', String(getAvgFromFiltered(rows,'leadership')), scoreToLabel(getAvgFromFiltered(rows,'leadership'))]
  ];
  if (doc.autoTable) {
    doc.autoTable({ startY: y + 2, head: [['Domain','Avg','Label']], body: domainRows, theme:'grid', styles:{fontSize:10}, margin:{left:margin,right:margin} });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    domainRows.forEach(rw => { if (y> doc.internal.pageSize.getHeight()-40) { doc.addPage(); y=margin; } doc.text(rw.join(' — '), margin, y); y+=6; });
  }

  // Respondent table
  const tableCols = ['Wilayah','Nama PM','Periode','Total','Grade'];
  const tableBody = rows.map(rr => ([ rr.wilayah||'', rr.nama_pm||'', rr.periode||'', (rr._pct && rr._pct.total) ? rr._pct.total : (rr.total_skor_pct? rr.total_skor_pct :''), rr.grade||'' ]));
  if (doc.autoTable) {
    doc.autoTable({ startY: y+4, head:[tableCols], body:tableBody, styles:{fontSize:9}, margin:{left:margin,right:margin}, didDrawPage: function(data){ doc.setFontSize(8); doc.text('Generated: '+now.toLocaleString(), margin, doc.internal.pageSize.getHeight()-8); } });
  } else {
    let yy = y+4;
    tableBody.forEach(rb => { if (yy > doc.internal.pageSize.getHeight()-20) { doc.addPage(); yy = margin; } doc.text(rb.join(' | '), margin, yy); yy+=6; });
  }

  doc.save('laporan-dashboard-' + (new Date()).toISOString().slice(0,19).replace(/[:T]/g,'-') + '.pdf');

  function getAvgFromFiltered(rows, shortKey){ if (!rows || !rows.length) return 0; const vals = rows.map(r => Number((r._pct && r._pct[shortKey]) || r[shortKey] || 0)).filter(v=>!isNaN(v)); return vals.length ? Math.round(vals.reduce((s,x)=>s+x,0)/vals.length) : 0; }
}

// export single PM to PDF
function exportPMToPDF(row) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) { alert('jsPDF belum dimuat'); return; }
  const doc = new jsPDF({ unit:'mm', format:'a4' }); const margin=12; let y=margin;
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(14); doc.text('Detail PM: ' + (row.nama_pm||'PM'), margin, y); y+=8;
  doc.setFontSize(11); doc.text('Wilayah: ' + (row.wilayah||''), margin, y); y+=6;
  doc.text('Periode: ' + (row.periode||''), margin, y); y+=6;
  doc.text('Grade: ' + (row.grade||''), margin, y); y+=8;

  const dataMain = [
    ['Field','Value'],
    ['Nama PM', row.nama_pm||''],
    ['Wilayah', row.wilayah||''],
    ['Periode', row.periode||''],
    ['Total', (row._pct && row._pct.total) ? row._pct.total : (row.total_skor_pct? row.total_skor_pct :'')],
    ['Grade', row.grade||'']
  ];
  if (doc.autoTable) {
    doc.autoTable({ startY: y, head: [dataMain[0]], body: dataMain.slice(1), theme:'grid', styles:{fontSize:10}, margin:{left:margin,right:margin} });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    dataMain.slice(1).forEach(rw => { doc.text(rw.join(': '), margin, y); y+=6; });
  }

  const subRows = [];
  for (let i=1;i<=62;i++){ const key='n'+String(i).padStart(2,'0'); if (key in row) { subRows.push([ (SUB_INDICATORS[key]||key), row[key] ?? '' ]); } }
  if (doc.autoTable) {
    doc.autoTable({ startY: y, head: [['Sub Indicator','Value']], body: subRows, styles:{fontSize:9}, margin:{left:margin,right:margin} });
  } else {
    subRows.forEach(rr => { if (y > doc.internal.pageSize.getHeight()-20) { doc.addPage(); y=margin; } doc.text(rr.join(' | '), margin, y); y+=6; });
  }

  doc.save('detail-pm-' + ((row.nama_pm||'pm').replace(/\s+/g,'_')) + '-' + (new Date()).toISOString().slice(0,19).replace(/[:T]/g,'-') + '.pdf');
}

loadDataInit();
