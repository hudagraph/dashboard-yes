const SPREADSHEET_ID = '1rid9dyKieUj33Du-MiKSBMMw6-bpEFD6Tzq4-GPMPqc';
const SHEET_NAME = 'database_nilai';

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);

    const headers = rows[0].map(h => (typeof h==='string'?h.trim():h));

    if (e && e.parameter && e.parameter.action === 'check') {
      const { wilayah='', nama_pm='', periode='' } = e.parameter;
      const found = rows.slice(1).map(r=>{
        const obj={}; headers.forEach((h,i)=> obj[h]=r[i]); return obj;
      }).filter(r =>
        (r.wilayah||'')===wilayah &&
        (r.nama_pm||'')===nama_pm &&
        (r.periode||'')===periode
      );
      return ContentService.createTextOutput(JSON.stringify(found))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({error:'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error:err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();
    const data = JSON.parse(e.postData.contents);
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];

    if (data.action === 'update') {
      const rows = sheet.getDataRange().getValues();
      for (let r = rows.length-1; r>=1; r--) {
        const row = rows[r]; const obj={}; headers.forEach((h,i)=>obj[h]=row[i]);
        if (obj.wilayah===data.wilayah && obj.nama_pm===data.nama_pm && obj.periode===data.periode) {
          headers.forEach((h,i)=>{ if (data.hasOwnProperty(h)) sheet.getRange(r+1,i+1).setValue(data[h]); });
          return ContentService.createTextOutput(JSON.stringify({status:'updated',row:r+1}))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      data.action = 'insert'; // fallback ke insert kalau update tidak ketemu
    }

    if (data.action === 'insert') {
      const newRow = headers.map(h=> data[h] || '');
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({status:'inserted',row:sheet.getLastRow()}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({error:'Unknown action'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error:err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
