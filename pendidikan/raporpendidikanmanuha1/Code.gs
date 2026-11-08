/**
 * Aplikasi Computer Based Test (CBT) berbasis Google Apps Script & Google Sheets
 * ID Sheet Target: 1QZ_Njojxn3U-Dwx4h2I_NyaEODF5ic6_TdDsBWiv-NI
 */

const SPREADSHEET_ID = "1QZ_Njojxn3U-Dwx4h2I_NyaEODF5ic6_TdDsBWiv-NI";
const ERAPOR_SPREADSHEET_ID = "1EUWuEuaR34sA7usjY-LfoTYP45XRo7wMOEH-trbzgos";

// Helper untuk mengambil Spreadsheet
function getDB() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Fungsi untuk menyiapkan struktur Sheet awal
function setupDatabase() {
  const ss = getDB();
  
  // 1. Sheet Users
  let sheetUsers = ss.getSheetByName("Users");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("Users");
    sheetUsers.appendRow(["Username", "Password", "Nama", "Role"]); // Role: admin, guru, murid
    sheetUsers.appendRow(["admin", "admin123", "Administrator Utama", "admin"]);
    sheetUsers.appendRow(["guru1", "guru123", "Bapak Guru S.Pd", "guru"]);
    sheetUsers.appendRow(["murid1", "murid123", "Siswa Teladan", "murid"]);
  }
  
  // 2. Sheet Bank Soal
  let sheetSoal = ss.getSheetByName("BankSoal");
  if (!sheetSoal) {
    sheetSoal = ss.insertSheet("BankSoal");
    sheetSoal.appendRow(["ID Soal", "Kategori", "Pertanyaan", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci Jawaban"]);
    // Sample Data
    sheetSoal.appendRow(["Q001", "AH1", "Berapakah hasil dari 5 + 5?", "8", "9", "10", "12", "C"]);
    sheetSoal.appendRow(["Q002", "AH1", "Ibu kota Indonesia adalah?", "Bandung", "Jakarta", "Surabaya", "Nusantara", "D"]);
    sheetSoal.appendRow(["Q003", "ASTS", "Simbol kimia dari air adalah?", "H2O", "CO2", "O2", "NaCl", "A"]);
  }

  // 3. Master mata pelajaran CBT
  let sheetMapel = ss.getSheetByName("MataPelajaran");
  if (!sheetMapel) {
    sheetMapel = ss.insertSheet("MataPelajaran");
    sheetMapel.appendRow(["Mata Pelajaran", "Aktif"]);
    ["Matematika","PKN","Bahasa Jawa","SKI","Bahasa Inggris","Qur’an Hadis","IPA","Ke-NU’an","Ekonomi","Penjaskes","Bahasa Arab","Fiqih","Bahasa Indonesia","Sosiologi","Geografi"].forEach(m => sheetMapel.appendRow([m,"YA"]));
  }

  // Tambahkan kolom MAPEL pada BankSoal lama tanpa menghapus data.
  if (sheetSoal.getLastColumn() < 9) sheetSoal.getRange(1, 9).setValue("Mata Pelajaran");
  else if (!String(sheetSoal.getRange(1,9).getValue()).trim()) sheetSoal.getRange(1,9).setValue("Mata Pelajaran");

  // 4. Sheet Draft Jawaban untuk autosave dan pemulihan setelah refresh
  let sheetDraft = ss.getSheetByName("DraftJawaban");
  if (!sheetDraft) {
    sheetDraft = ss.insertSheet("DraftJawaban");
    sheetDraft.appendRow(["Username","ExamKey","Kategori","Mata Pelajaran","Tahun Ajaran","Semester","JawabanJSON","UpdatedAt","EndAt"]);
  } else if (sheetDraft.getLastColumn() < 9) {
    sheetDraft.getRange(1,9).setValue("EndAt");
  }

  // 5. Sheet Nilai (Dipisahkan berdasarkan Kategori)
  const kategoriList = ["AH1", "AH2", "AH3", "AH4", "AH5", "AH6", "ASTS", "ASAS"];
  kategoriList.forEach(kat => {
    let sheetNilai = ss.getSheetByName("Nilai_" + kat);
    if (!sheetNilai) {
      sheetNilai = ss.insertSheet("Nilai_" + kat);
      sheetNilai.appendRow(["Tanggal", "Username", "Nama Murid", "Kategori", "Jumlah Benar", "Total Soal", "Nilai", "Status", "Mata Pelajaran", "Tahun Ajaran", "Semester", "Certificate ID"]);
    } else {
      ensureNilaiHeadersCBT_(sheetNilai);
    }
  });

  // Pengaturan durasi ujian (menit), dapat diubah melalui fungsi setCBTExamDuration.
  let shTimer = ss.getSheetByName("PengaturanCBT");
  if (!shTimer) {
    shTimer = ss.insertSheet("PengaturanCBT");
    shTimer.appendRow(["Pengaturan", "Nilai"]);
    shTimer.appendRow(["DurasiMenit", 60]);
  }
  // Kolom kelas pada akun murid (kolom E) dan pengelolaan bank soal.
  if (sheetUsers.getLastColumn() < 5) sheetUsers.getRange(1,5).setValue("Kelas");
  if (!String(sheetUsers.getRange(1,6).getValue()||'').trim()) sheetUsers.getRange(1,6).setValue("FOTO");
  if (!String(sheetUsers.getRange(1,7).getValue()||'').trim()) sheetUsers.getRange(1,7).setValue("MAPEL_TUGAS (opsional, pisahkan koma)");
  ensureBankSoalSchemaCBT_();
  return "Setup Database Berhasil pada Spreadsheet ID!";
}

/**
 * Migrasi BankSoal lama: opsi A-D, kunci, mapel -> opsi A-E, kunci, mapel.
 * Menyisipkan kolom E sebelum kolom kunci tanpa menghapus data lama.
 */
function ensureBankSoalSchemaCBT_() {
  const sh = getDB().getSheetByName("BankSoal");
  if (!sh) throw new Error("Sheet BankSoal tidak ditemukan.");
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const headers = sh.getRange(1,1,1,lastCol).getValues()[0]
    .map(v => String(v || '').trim().toLowerCase());
  if (headers[7] === "kunci jawaban") {
    sh.insertColumnBefore(8);
    sh.getRange(1,8).setValue("Opsi E");
  }
  const expected = ["ID Soal","Kategori","Pertanyaan","Opsi A","Opsi B","Opsi C",
    "Opsi D","Opsi E","Kunci Jawaban","Mata Pelajaran","Semester","Tipe Soal","Data Soal","Kelas","Diujikan"];
  const current = sh.getRange(1,1,1,Math.max(expected.length,sh.getLastColumn())).getValues()[0];
  expected.forEach((v,i) => {
    if (!String(current[i] || '').trim()) sh.getRange(1,i+1).setValue(v);
  });
  // Kolom O (Diujikan) dipertahankan untuk kompatibilitas data lama.
  // Kolom N adalah Kelas: jangan pernah menulis status YA ke kolom kelas.
  // Pemilihan soal ujian kini otomatis berdasarkan kategori, mapel, semester, dan kelas.
  if (sh.getLastRow() >= 2) {
    const extra = sh.getRange(2,15,sh.getLastRow()-1,1);
    const flags = extra.getValues();
    let dirty = false;
    flags.forEach(r => {
      if (!String(r[0] || '').trim()) { r[0] = "YA"; dirty = true; }
    });
    if (dirty) extra.setValues(flags);
  }
  // Soal lama tanpa penanda semester diasumsikan semester ganjil (1).
  if (sh.getLastRow() >= 2) {
    const range = sh.getRange(2,11,sh.getLastRow()-1,1);
    const values = range.getValues();
    let changed = false;
    values.forEach(row => {
      if (!String(row[0] || '').trim()) { row[0] = "1"; changed = true; }
      else row[0] = normalizeSemesterCBT_(row[0]) || String(row[0]).trim();
    });
    if (changed) range.setValues(values);
  }
  return true;
}

// Handler Auth Login

/** Membaca data guru dari database E-Rapor berdasarkan header pada gambar:
 * NIP, NAMA, USERNAME, PASSWORD, MAPEL, KELAS_DIAJAR, STATUS, FOTO.
 * Nama sheet tidak dikunci; sistem mencari sheet yang memiliki header tersebut.
 */
function getTeacherDirectoryRecord_(username) {
  const wanted = String(username || '').trim().toLowerCase();
  if (!wanted) return {mapel:[], foto:''};
  try {
    const ss = SpreadsheetApp.openById(ERAPOR_SPREADSHEET_ID);
    const sheets = ss.getSheets();
    for (const sh of sheets) {
      if (sh.getLastRow() < 2 || sh.getLastColumn() < 7) continue;
      const values = sh.getDataRange().getDisplayValues();
      const headers = values[0].map(v=>String(v||'').trim().toUpperCase());
      const ix = name => headers.indexOf(name);
      const u=ix('USERNAME'), m=ix('MAPEL'), status=ix('STATUS'), foto=ix('FOTO');
      if (u<0 || m<0) continue;
      const mapel=[], fotoList=[];
      for(let r=1;r<values.length;r++){
        if(String(values[r][u]||'').trim().toLowerCase()!==wanted) continue;
        if(status>=0 && String(values[r][status]||'AKTIF').trim().toUpperCase()!=='AKTIF') continue;
        const subject=String(values[r][m]||'').trim();
        if(subject && !mapel.some(x=>normalizeMapelCBT_(x)===normalizeMapelCBT_(subject))) mapel.push(subject);
        if(foto>=0 && values[r][foto]) fotoList.push(String(values[r][foto]).trim());
      }
      if(mapel.length || fotoList.length) return {mapel:mapel, foto:fotoList[0]||''};
    }
  } catch(err) {
    console.warn('Database guru E-Rapor tidak dapat dibaca: '+err.message);
  }
  return {mapel:[],foto:''};
}
function getGuruMapelDiizinkan_(username, role) {
  if(String(role||'').toLowerCase()==='admin') return getMataPelajaranCBT();
  const profile=getTeacherDirectoryRecord_(username);
  if(profile.mapel.length) return profile.mapel;
  // Fallback jika database guru eksternal belum tersedia: kolom G Users berisi mapel dipisah koma.
  const sh=getDB().getSheetByName('Users');
  if(sh && sh.getLastRow()>1){
    const vals=sh.getDataRange().getDisplayValues();
    for(let i=1;i<vals.length;i++) if(String(vals[i][0]).trim()===String(username).trim()){
      return String(vals[i][6]||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
    }
  }
  return [];
}
function assertGuruMapelAccess_(username, mapel) {
  const sh=getDB().getSheetByName('Users');
  if(!sh) throw new Error('Sheet Users tidak ditemukan.');
  const vals=sh.getDataRange().getDisplayValues();
  let role='';
  for(let i=1;i<vals.length;i++) if(String(vals[i][0]).trim()===String(username||'').trim()){role=String(vals[i][3]||'').toLowerCase();break;}
  if(role==='admin') return true;
  if(role!=='guru') throw new Error('Akses hanya untuk guru atau admin.');
  const allowed=getGuruMapelDiizinkan_(username,role);
  if(!allowed.some(x=>normalizeMapelCBT_(x)===normalizeMapelCBT_(mapel))){
    throw new Error('Anda tidak memiliki tugas mengelola mata pelajaran '+mapel+'.');
  }
  return true;
}
function getProfilGuruCBT(username) {
  const profile=getTeacherDirectoryRecord_(username);
  return {mapel:getGuruMapelDiizinkan_(username,'guru'),foto:profile.foto||''};
}

function processLogin(username, password) {
  const ss=getDB(), sheet=ss.getSheetByName("Users");
  if(!sheet) return {success:false,message:"Sheet Users tidak ditemukan."};
  const data=sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(String(data[i][0]||'').trim()===String(username||'').trim() &&
       String(data[i][1]||'').trim()===String(password||'').trim()){
      const role=String(data[i][3]||'').toLowerCase();
      const profile=role==='guru'?getTeacherDirectoryRecord_(data[i][0]):{mapel:[],foto:String(data[i][5]||'')};
      const foto=profile.foto||String(data[i][5]||'');
      if(foto && !String(data[i][5]||'')){sheet.getRange(i+1,6).setValue(foto);}
      return {success:true,user:{
        username:data[i][0],nama:data[i][2],role:role,kelas:data[i][4]||'',
        foto:foto,mapelDiampu:role==='guru'?getGuruMapelDiizinkan_(data[i][0],role):[]
      }};
    }
  }
  return {success:false,message:"Username atau Password salah!"};
}


/**
 * Membaca tahun ajaran dan semester dari sheet Pengaturan E-Rapor.
 * SEMESTER_AKTIF dapat berisi "1,2" (keduanya tersedia), "1" atau "2".
 * Jika ada SEMESTER_BERJALAN, semester tersebut dikunci sebagai semester berjalan.
 */
function getCBTActiveSettings() {
  const ss = SpreadsheetApp.openById(ERAPOR_SPREADSHEET_ID);
  const sh = ss.getSheetByName("Pengaturan");
  if (!sh || sh.getLastRow() < 2) {
    throw new Error("Sheet Pengaturan E-Rapor tidak ditemukan atau belum diisi.");
  }

  const settings = {};
  sh.getDataRange().getDisplayValues().slice(1).forEach(r => {
    const key = String(r[0] || "").trim().toUpperCase();
    if (key) settings[key] = String(r[1] == null ? "" : r[1]).trim();
  });

  const tahunAjaran = settings.TAHUN_AJARAN_AKTIF || "";
  if (!tahunAjaran) throw new Error("TAHUN_AJARAN_AKTIF belum diatur pada E-Rapor.");

  const semesterRaw = settings.SEMESTER_AKTIF || "1,2";
  const semesters = semesterRaw.split(/[;,]/)
    .map(normalizeSemesterCBT_)
    .filter(s => ["1", "2"].includes(s));

  const semesterBerjalan = normalizeSemesterCBT_(settings.SEMESTER_BERJALAN || "");
  const allowed = semesterBerjalan
    ? [semesterBerjalan]
    : (semesters.length ? [...new Set(semesters)] : ["1", "2"]);

  return {
    tahunAjaran: tahunAjaran,
    semesters: allowed,
    semesterBerjalan: semesterBerjalan && allowed.includes(semesterBerjalan) ? semesterBerjalan : "",
    semesterLabels: { "1": "Gasal", "2": "Genap" }
  };
}

function normalizeSemesterCBT_(value) {
  const s = String(value == null ? "" : value).trim().toLowerCase();
  if (["1", "gasal", "ganjil"].includes(s)) return "1";
  if (["2", "genap"].includes(s)) return "2";
  return "";
}

function ensureNilaiHeadersCBT_(sh) {
  const required = [
    "Tanggal", "Username", "Nama Murid", "Kategori", "Jumlah Benar",
    "Total Soal", "Nilai", "Status", "Mata Pelajaran", "Tahun Ajaran", "Semester", "Certificate ID"
  ];
  const last = Math.max(sh.getLastColumn(), 1);
  const headers = sh.getRange(1, 1, 1, last).getDisplayValues()[0]
    .map(v => String(v || "").trim());
  required.forEach(h => {
    if (!headers.some(x => x.toLowerCase() === h.toLowerCase())) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
      headers.push(h);
    }
  });
}


function makeExamKeyCBT_(username, kategori, mapel, tahunAjaran, semester) {
  return [username, kategori, mapel, tahunAjaran, semester]
    .map(v => String(v || '').trim().toLowerCase()).join('|');
}

function makeCertificateIdCBT_(username, kategori, mapel, tahunAjaran, semester, timestamp) {
  const raw = [username,kategori,mapel,tahunAjaran,semester,timestamp].join('|');
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return digest.slice(0,6).map(b => ('0'+((b+256)%256).toString(16)).slice(-2)).join('').toUpperCase();
}

/** Simpan draft jawaban (upsert) agar jawaban tidak hilang saat halaman direfresh. */
function saveExamDraft(payload) {
  const username = String(payload.username || '').trim();
  const kategori = String(payload.kategori || '').trim();
  const mapel = String(payload.mapel || '').trim();
  const tahunAjaran = String(payload.tahunAjaran || '').trim();
  const semester = normalizeSemesterCBT_(payload.semester);
  const jawaban = payload.jawaban || {};
  if (!username || !kategori || !mapel || !tahunAjaran || !semester) {
    throw new Error('Identitas ujian belum lengkap; draft tidak dapat disimpan.');
  }
  const active = getCBTActiveSettings();
  if (tahunAjaran !== active.tahunAjaran || !active.semesters.includes(semester)) {
    throw new Error('Tahun ajaran/semester draft sudah tidak aktif. Muat ulang CBT.');
  }
  const sh = getDB().getSheetByName('DraftJawaban') || getDB().insertSheet('DraftJawaban');
  if (sh.getLastRow() === 0) sh.appendRow(["Username","ExamKey","Kategori","Mata Pelajaran","Tahun Ajaran","Semester","JawabanJSON","UpdatedAt","EndAt"]);
  if (sh.getLastColumn()<9) sh.getRange(1,9).setValue("EndAt");
  const key = makeExamKeyCBT_(username,kategori,mapel,tahunAjaran,semester);
  const values = sh.getDataRange().getValues();
  let row = -1;
  for (let i=1;i<values.length;i++) if (String(values[i][1]) === key) { row=i+1; break; }
  let endAt = row>0 ? values[row-1][8] : '';
  if (!endAt) endAt = new Date(new Date().getTime()+getCBTExamDuration()*60000);
  const record = [username,key,kategori,mapel,tahunAjaran,semester,JSON.stringify(jawaban),new Date(),endAt];
  if (row > 0) sh.getRange(row,1,1,record.length).setValues([record]);
  else sh.appendRow(record);
  return {success:true, updatedAt:new Date().toISOString()};
}

function getExamDraft(username, kategori, mapel, tahunAjaran, semester) {
  const key = makeExamKeyCBT_(username,kategori,mapel,tahunAjaran,semester);
  const sh = getDB().getSheetByName('DraftJawaban');
  if (!sh || sh.getLastRow()<2) return {success:true,jawaban:{},endAt:''};
  const rows=sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][1])===key) {
      let answers={};
      try { answers=JSON.parse(rows[i][6] || '{}'); } catch(e) {}
      return {success:true,jawaban:answers,updatedAt:rows[i][7] || '',endAt:rows[i][8] ? new Date(rows[i][8]).toISOString() : ''};
    }
  }
  return {success:true,jawaban:{},endAt:''};
}

function deleteExamDraft(username, kategori, mapel, tahunAjaran, semester) {
  const key = makeExamKeyCBT_(username,kategori,mapel,tahunAjaran,semester);
  const sh=getDB().getSheetByName('DraftJawaban');
  if (!sh || sh.getLastRow()<2) return {success:true};
  const rows=sh.getDataRange().getValues();
  for(let i=rows.length-1;i>=1;i--) if(String(rows[i][1])===key) sh.deleteRow(i+1);
  return {success:true};
}

/** Riwayat ujian milik siswa berdasarkan username login, termasuk data sertifikat lulus. */
function getStudentExamHistory(username) {
  const user=String(username || '').trim();
  if (!user) throw new Error('Username siswa tidak valid.');
  const ss=getDB();
  const uniqueHistory = {};
  getKategoriUjian().forEach(kat=>{
    const sh=ss.getSheetByName('Nilai_'+kat);
    if(!sh || sh.getLastRow()<2) return;
    const data=sh.getDataRange().getValues();
    const headers=data[0].map(v=>String(v||'').trim().toLowerCase());
    const ix=n=>headers.indexOf(n.toLowerCase());
    for(let i=1;i<data.length;i++){
      const r=data[i];
      if(String(r[ix('Username')]||'').trim()!==user) continue;
      const nilai=Number(r[ix('Nilai')]||0);
      // Riwayat hanya menampilkan hasil lulus (nilai minimal 80).
      if (nilai < 80) continue;
      const tanggal=r[ix('Tanggal')] || '';
      const mapel=r[ix('Mata Pelajaran')] || '';
      const tahun=r[ix('Tahun Ajaran')] || '';
      const semester=r[ix('Semester')] || '';
      const certCol=ix('Certificate ID');
      let certId=certCol>=0 ? String(r[certCol]||'') : '';
      if(nilai>=80 && !certId) {
        certId=makeCertificateIdCBT_(user,kat,mapel,tahun,semester,tanggal);
        if(certCol>=0) sh.getRange(i+1,certCol+1).setValue(certId);
      }
      const uniqueKey = makeExamKeyCBT_(user,kat,mapel,tahun,semester);
      const item = {
        tanggal: tanggal instanceof Date ? Utilities.formatDate(tanggal,Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm') : String(tanggal),
        username:user, nama:String(r[ix('Nama Murid')]||''), kategori:kat,
        benar:r[ix('Jumlah Benar')], totalSoal:r[ix('Total Soal')], nilai:nilai,
        status:String(r[ix('Status')]||''), mapel:String(mapel), tahunAjaran:String(tahun),
        semester:String(semester), certificateId:certId, canGetCertificate:true
      };
      // Jika data lama memiliki duplikat, tampilkan satu hasil terbaru untuk kombinasi yang sama.
      // Iterasi berjalan dari baris lama ke baru; assignment terakhir menyimpan data terbaru.
      uniqueHistory[uniqueKey] = item;
    }
  });
  const out = Object.keys(uniqueHistory).map(k => uniqueHistory[k]);
  out.sort((a,b)=>String(b.tanggal).localeCompare(String(a.tanggal)));
  return out;
}

// Ambil list kategori ujian yang tersedia
function getKategoriUjian() {
  return ["AH1", "AH2", "AH3", "AH4", "AH5", "AH6", "ASTS", "ASAS"];
}

function getMataPelajaranCBT(username, role) {
  const sh = getDB().getSheetByName("MataPelajaran");
  const all = (!sh || sh.getLastRow()<2) ? [] : sh.getRange(2,1,sh.getLastRow()-1,2).getValues()
    .filter(r=>String(r[0]||'').trim() && String(r[1]||'YA').toUpperCase()!=='TIDAK')
    .map(r=>String(r[0]).trim());
  if(!username) return all;
  if(String(role||'').toLowerCase()==='admin') return all;
  const allowed=getGuruMapelDiizinkan_(username,'guru');
  return all.filter(m=>allowed.some(a=>normalizeMapelCBT_(a)===normalizeMapelCBT_(m)));
}

// Ambil Soal berdasarkan Kategori Ujian (untuk Siswa - tanpa Kunci Jawaban)

function normalizeQuestionTypeCBT_(type) {
  const t = String(type || 'PG').trim().toUpperCase();
  const aliases = {'PILIHAN GANDA':'PG','PILIHAN GANDA KOMPLEKS':'PGK','BENAR-SALAH':'BS',
    'BENAR SALAH':'BS','ISIAN':'ISIAN','ESSAY':'ESSAY','MENJODOHKAN':'JODOH'};
  const v = aliases[t] || t;
  return ['PG','PGK','BS','ISIAN','ESSAY','JODOH'].includes(v) ? v : 'PG';
}
function getCBTExamDuration() {
  const ss=getDB(); let sh=ss.getSheetByName('PengaturanCBT');
  if (!sh) { sh=ss.insertSheet('PengaturanCBT'); sh.appendRow(['Pengaturan','Nilai']); sh.appendRow(['DurasiMenit',60]); }
  const vals=sh.getDataRange().getValues();
  for(let i=1;i<vals.length;i++) if(String(vals[i][0])==='DurasiMenit') return Math.max(1,Math.min(600,Number(vals[i][1])||60));
  sh.appendRow(['DurasiMenit',60]); return 60;
}
function setCBTExamDuration(minutes) {
  const n=Math.max(1,Math.min(600,Math.floor(Number(minutes)||60)));
  const ss=getDB(); let sh=ss.getSheetByName('PengaturanCBT');
  if(!sh){sh=ss.insertSheet('PengaturanCBT');sh.appendRow(['Pengaturan','Nilai']);}
  const vals=sh.getDataRange().getValues(); let row=-1;
  for(let i=1;i<vals.length;i++) if(String(vals[i][0])==='DurasiMenit'){row=i+1;break;}
  if(row>0) sh.getRange(row,2).setValue(n); else sh.appendRow(['DurasiMenit',n]);
  return {success:true,durasiMenit:n};
}
function startExamTimer(username,kategori,mapel,tahunAjaran,semester) {
  const key=makeExamKeyCBT_(username,kategori,mapel,tahunAjaran,semester);
  const sh=getDB().getSheetByName('DraftJawaban');
  if(!sh) throw new Error('Sheet DraftJawaban belum tersedia. Jalankan setupDatabase().');
  if (sh.getLastColumn()<9) sh.getRange(1,9).setValue('EndAt');
  const values=sh.getDataRange().getValues(); let row=-1;
  for(let i=1;i<values.length;i++) if(String(values[i][1])===key){row=i+1;break;}
  const now=new Date(); let endAt=null, answers={};
  if(row>0){
    try{answers=JSON.parse(values[row-1][6]||'{}');}catch(e){}
    endAt=values[row-1][8] ? new Date(values[row-1][8]) : null;
  }
  if(!endAt || isNaN(endAt.getTime())){
    endAt=new Date(now.getTime()+getCBTExamDuration()*60000);
    const rec=[username,key,kategori,mapel,tahunAjaran,normalizeSemesterCBT_(semester),JSON.stringify(answers),now,endAt];
    if(row>0) sh.getRange(row,1,1,9).setValues([rec]); else sh.appendRow(rec);
  }
  return {endAt:endAt.toISOString(),durasiMenit:getCBTExamDuration(),serverNow:now.toISOString()};
}


function normalizeKelasCBT_(v) {
  return String(v || '').trim().toUpperCase()
    .replace(/\s+/g,' ')
    .replace(/^KELAS\s+/, '')
    .replace(/^TINGKAT\s+/, '');
}
function getBankSoalGuru(filters, username) {
  ensureBankSoalSchemaCBT_();
  filters=filters||{};
  const allowed=getGuruMapelDiizinkan_(username,'guru');
  const users=getDB().getSheetByName('Users').getDataRange().getDisplayValues();
  let role=''; for(let u=1;u<users.length;u++) if(String(users[u][0]).trim()===String(username||'').trim()){role=String(users[u][3]||'').toLowerCase();break;}
  const isAdmin=role==='admin';
  if(!isAdmin && !allowed.length) throw new Error('Akun guru belum memiliki mata pelajaran tugas. Periksa database guru pada kolom USERNAME dan MAPEL.');
  if(filters.mapel && !isAdmin && !allowed.some(x=>normalizeMapelCBT_(x)===normalizeMapelCBT_(filters.mapel))) throw new Error('Mata pelajaran tersebut bukan tugas Anda.');
  const sh=getDB().getSheetByName('BankSoal');
  const rows=sh.getDataRange().getValues();
  const out=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];
    if(!r[0]) continue;
    if(!isAdmin && !allowed.some(x=>normalizeMapelCBT_(x)===normalizeMapelCBT_(r[9]))) continue;
    if(filters.kategori && String(r[1]||'').trim().toUpperCase()!==String(filters.kategori).trim().toUpperCase()) continue;
    if(filters.kelas && normalizeKelasCBT_(r[13])!==normalizeKelasCBT_(filters.kelas)) continue;
    if(filters.mapel && normalizeMapelCBT_(r[9])!==normalizeMapelCBT_(filters.mapel)) continue;
    if(filters.semester && normalizeSemesterCBT_(r[10])!==normalizeSemesterCBT_(filters.semester)) continue;
    out.push({id:String(r[0]),kategori:r[1],pertanyaan:r[2],opsiA:r[3],opsiB:r[4],opsiC:r[5],opsiD:r[6],opsiE:r[7],kunci:r[8],mapel:r[9],semester:normalizeSemesterCBT_(r[10]),tipeSoal:normalizeQuestionTypeCBT_(r[11]),dataSoal:r[12]||'',kelas:r[13]||'',diujikan:String(r[14]||'YA').toUpperCase()==='YA',row:i+1});
  }
  return out;
}
function updateBankSoalCBT(data, username) {
  ensureBankSoalSchemaCBT_();
  const sh=getDB().getSheetByName('BankSoal');
  const rows=sh.getDataRange().getValues();
  const idx=rows.findIndex((r,i)=>i>0 && String(r[0])===String(data.id));
  if(idx<1) throw new Error('Soal tidak ditemukan.');
  const old=rows[idx];
  assertGuruMapelAccess_(username, old[9]);
  if (data.mapel) assertGuruMapelAccess_(username, data.mapel);
  const merged=Object.assign({},data);
  const tipe=normalizeQuestionTypeCBT_(merged.tipeSoal || old[11]);
  const opsiBaru = {
    A:String(merged.opsiA!==undefined?merged.opsiA:old[3]||'').trim(),
    B:String(merged.opsiB!==undefined?merged.opsiB:old[4]||'').trim(),
    C:String(merged.opsiC!==undefined?merged.opsiC:old[5]||'').trim(),
    D:String(merged.opsiD!==undefined?merged.opsiD:old[6]||'').trim(),
    E:String(merged.opsiE!==undefined?merged.opsiE:old[7]||'').trim()
  };
  const kunciBaru=String(merged.kunci!==undefined?merged.kunci:old[8]||'').trim();
  if (tipe==='PG' || tipe==='PGK') {
    if (!opsiBaru.A || !opsiBaru.B || !opsiBaru.C || !opsiBaru.D) throw new Error('Pilihan A sampai D wajib diisi.');
    const keys=tipe==='PG'?[kunciBaru.toUpperCase()]:kunciBaru.toUpperCase().split(',').map(x=>x.trim()).filter(Boolean);
    if (tipe==='PG' && (!['A','B','C','D','E'].includes(keys[0]) || (keys[0]==='E'&&!opsiBaru.E))) throw new Error('Kunci PG harus A-E dan pilihan E harus tersedia bila dipilih.');
    if (tipe==='PGK' && (keys.length<2 || keys.some(x=>!['A','B','C','D','E'].includes(x)) || new Set(keys).size!==keys.length || (keys.includes('E')&&!opsiBaru.E))) throw new Error('Kunci PGK tidak valid. Gunakan minimal dua pilihan berbeda, contoh A,C.');
  } else if (tipe==='BS' && !['BENAR','SALAH'].includes(kunciBaru.toUpperCase())) {
    throw new Error('Kunci Benar/Salah harus BENAR atau SALAH.');
  } else if ((tipe==='ISIAN'||tipe==='ESSAY') && !kunciBaru) {
    throw new Error('Kunci jawaban tidak boleh kosong.');
  }
  let dataSoalBaru=merged.dataSoal!==undefined?merged.dataSoal:old[12];
  if (tipe==='JODOH') {
    let parsed;
    try { parsed=JSON.parse(String(dataSoalBaru||'{}')); } catch(e) { throw new Error('Format pasangan MATCH harus berupa JSON yang valid.'); }
    const pairs=parsed && Array.isArray(parsed.pairs)?parsed.pairs:[];
    if (pairs.length<2 || pairs.some(p=>!String(p.left||'').trim()||!String(p.right||'').trim())) throw new Error('MATCH harus memiliki minimal dua pasangan lengkap.');
    dataSoalBaru=JSON.stringify({pairs:pairs.map(p=>({left:String(p.left).trim(),right:String(p.right).trim()}))});
  }
  const mapelBaru=merged.mapel||old[9];
  assertGuruMapelAccess_(username, mapelBaru);
  const rec=[old[0],merged.kategori||old[1],merged.pertanyaan||old[2],
    opsiBaru.A,opsiBaru.B,opsiBaru.C,opsiBaru.D,opsiBaru.E,
    tipe==='JODOH'?'MATCH':(tipe==='PG'||tipe==='PGK'?kunciBaru.toUpperCase():kunciBaru.toUpperCase()),
    mapelBaru,normalizeSemesterCBT_(merged.semester||old[10]),tipe,
    dataSoalBaru,merged.kelas!==undefined?merged.kelas:old[13],
    merged.diujikan!==undefined?(merged.diujikan?'YA':'TIDAK'):(old[14]||'YA')];
  sh.getRange(idx+1,1,1,15).setValues([rec]);
  return {success:true,message:'Soal berhasil diperbarui.'};
}
function deleteBankSoalCBT(id, username) {
  const sh=getDB().getSheetByName('BankSoal');
  if(!sh) throw new Error('BankSoal tidak ditemukan.');
  const rows=sh.getDataRange().getValues();
  for(let i=rows.length-1;i>=1;i--) if(String(rows[i][0])===String(id)){assertGuruMapelAccess_(username,rows[i][9]);sh.deleteRow(i+1);return {success:true};}
  throw new Error('Soal tidak ditemukan.');
}
function getSoalUjian(kategori, mapel, semester, kelas, username) {
  ensureBankSoalSchemaCBT_();
  const ss = getDB();
  const sh = ss.getSheetByName("BankSoal");
  const data = sh.getDataRange().getValues();
  const semesterDipilih = normalizeSemesterCBT_(semester);
  if (!["1","2"].includes(semesterDipilih)) {
    throw new Error("Pilih semester ganjil atau genap sebelum mengerjakan ujian.");
  }

  // Ambil kelas dari database Users berdasarkan username, bukan hanya dari cache browser.
  // Ini mengatasi sesi lama yang masih menyimpan kelas kosong/tidak sesuai.
  let studentClass = normalizeKelasCBT_(kelas);
  const userName = String(username || '').trim();
  if (userName) {
    const usersSheet = ss.getSheetByName("Users");
    if (usersSheet && usersSheet.getLastRow() >= 2) {
      const users = usersSheet.getDataRange().getValues();
      for (let u = 1; u < users.length; u++) {
        if (String(users[u][0] || '').trim() === userName) {
          const dbClass = normalizeKelasCBT_(users[u][4] || '');
          if (dbClass) studentClass = dbClass;
          break;
        }
      }
    }
  }

  const kategoriDipilih = String(kategori || '').trim().toUpperCase();
  const mapelDipilih = normalizeMapelCBT_(mapel);
  if (!studentClass) {
    throw new Error("Kelas akun murid belum diisi. Isi kolom E (Kelas) pada sheet Users, lalu keluar dan masuk kembali.");
  }

  const listSoal = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowKategori = String(row[1] || '').trim().toUpperCase();
    const rowSemester = normalizeSemesterCBT_(row[10]);
    const rowClass = normalizeKelasCBT_(row[13]);
    const rowMapel = normalizeMapelCBT_(row[9]);
    if (rowKategori === kategoriDipilih &&
        rowMapel === mapelDipilih &&
        rowSemester === semesterDipilih &&
        (!rowClass || rowClass === studentClass)) {
      listSoal.push({
        id: row[0], kategori: row[1], mapel: row[9] || '',
        semester: rowSemester, pertanyaan: row[2],
        opsiA: row[3], opsiB: row[4], opsiC: row[5],
        opsiD: row[6], opsiE: row[7],
        tipeSoal: normalizeQuestionTypeCBT_(row[11]),
        dataSoal: row[12] || ''
      });
    }
  }
  return listSoal;
}

// Submit Ujian oleh Murid
function submitUjian(payload) {
  ensureBankSoalSchemaCBT_();
  const { username, nama, kategori, mapel, jawaban } = payload;
  if (!mapel) return { success:false, message:"Mata pelajaran belum dipilih." };
  const semester = normalizeSemesterCBT_(payload.semester);
  if (!["1","2"].includes(semester)) return {success:false,message:"Semester ujian tidak valid."};
  const ss = getDB();
  const sheetSoal = ss.getSheetByName("BankSoal");
  const dataSoal = sheetSoal.getDataRange().getValues();
  // Ambil kelas murid agar total dan kunci hanya dihitung dari soal yang memang ditujukan ke kelasnya.
  let kelasMurid = normalizeKelasCBT_(payload.kelas || "");
  if (!kelasMurid) {
    const shUsers = ss.getSheetByName("Users");
    if (shUsers) {
      const usersData = shUsers.getDataRange().getValues();
      for (let u = 1; u < usersData.length; u++) {
        if (String(usersData[u][0]).trim() === String(username).trim()) {
          kelasMurid = normalizeKelasCBT_(usersData[u][4] || "");
          break;
        }
      }
    }
  }

  // Penilaian hanya menggunakan soal kategori, mapel, semester, dan kelas murid.
  const kunciMap = {};
  for (let i = 1; i < dataSoal.length; i++) {
    if (String(dataSoal[i][1]).trim() === String(kategori).trim() &&
        normalizeMapelCBT_(dataSoal[i][9]) === normalizeMapelCBT_(mapel) &&
        normalizeSemesterCBT_(dataSoal[i][10]) === semester &&
        (!normalizeKelasCBT_(dataSoal[i][13]) || normalizeKelasCBT_(dataSoal[i][13]) === kelasMurid)) {
      kunciMap[dataSoal[i][0]] = {
        key:String(dataSoal[i][8] || '').trim(),
        type:normalizeQuestionTypeCBT_(dataSoal[i][11]),
        data:dataSoal[i][12] || ''
      };
    }
  }

  let totalSoal = 0;
  Object.keys(kunciMap).forEach(id=>{
    const e=kunciMap[id];
    if(e.type==='JODOH'){
      try { totalSoal += Math.max(1,(JSON.parse(e.data||'{}').pairs||[]).length); }
      catch(err){ totalSoal += 1; }
    } else totalSoal += 1;
  });
  if (totalSoal === 0) {
    return { success: false, message: "Tidak ada soal dalam kategori ini." };
  }

  function normAnswer(v) {
    return String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g,' ');
  }
  function keywordSet(v) {
    return normAnswer(v).replace(/[^\p{L}\p{N}]+/gu,' ')
      .split(' ').filter(w=>w.length>=2);
  }
  function gradeOne(id, entry) {
    const ans=jawaban[id];
    if(ans===undefined || ans===null || ans==='') return 0;
    const key=entry.key, type=entry.type;
    if(type==='PG') return String(ans).trim().toUpperCase()===key.trim().toUpperCase()?1:0;
    if(type==='PGK') {
      const keys=String(key||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
      const selected=(Array.isArray(ans)?ans:String(ans).split(',')).map(x=>String(x).trim().toUpperCase()).filter(Boolean);
      const matched=selected.filter(x=>keys.includes(x)).length;
      return matched>=2?1:0;
    }
    if(type==='BS') return normAnswer(ans)===normAnswer(key)?1:0;
    if(type==='ISIAN' || type==='ESSAY') {
      const keys=[...new Set(keywordSet(key))];
      const response=new Set(keywordSet(ans));
      const matched=keys.filter(w=>response.has(w)).length;
      // ISIAN: cukup satu kata kunci cocok. ESSAY: minimal tiga kata kunci cocok.
      if(type==='ISIAN') return matched>=1?1:0;
      return matched>=3?1:0;
    }
    if(type==='JODOH') {
      try {
        const pairs=JSON.parse(entry.data || '{}').pairs || [];
        const submitted=typeof ans==='string'?JSON.parse(ans):ans;
        return pairs.reduce((score,p,i)=>score+(normAnswer(submitted && submitted[i])===normAnswer(p.right)?1:0),0);
      } catch(e) { return 0; }
    }
    return 0;
  }
  let benar = 0;
  const wrongQuestionNumbers = [];
  Object.keys(kunciMap).forEach((id, index) => {
    const entry = kunciMap[id];
    const score = gradeOne(id, entry);
    benar += score;
    let maxScore = 1;
    if (entry.type === 'JODOH') {
      try { maxScore = Math.max(1, (JSON.parse(entry.data || '{}').pairs || []).length); }
      catch (e) { maxScore = 1; }
    }
    // Nomor soal mengikuti urutan soal yang dikirim untuk sesi ujian.
    // Soal menjodohkan dengan sebagian pasangan salah tetap masuk daftar remedial.
    if (score < maxScore) wrongQuestionNumbers.push(index + 1);
  });
  let nilai = Math.round((benar / totalSoal) * 100);
  let status = nilai >= 80 ? "LULUS" : "REMIDIAL";

  // Simpan Hasil ke Sheet Kategori terkait
  const sheetTargetName = "Nilai_" + kategori;
  let sheetTarget = ss.getSheetByName(sheetTargetName);
  if (!sheetTarget) {
    sheetTarget = ss.insertSheet(sheetTargetName);
    sheetTarget.appendRow(["Tanggal", "Username", "Nama Murid", "Kategori", "Jumlah Benar", "Total Soal", "Nilai", "Status", "Mata Pelajaran", "Tahun Ajaran", "Semester"]);
  } else {
    ensureNilaiHeadersCBT_(sheetTarget);
  }

  // Validasi ulang di server agar siswa tidak dapat mengirim tahun/semester lama
  // dengan memanipulasi nilai pada browser.
  const active = getCBTActiveSettings();
  const tahunAjaran = String(payload.tahunAjaran || "").trim();

  if (!tahunAjaran || tahunAjaran !== active.tahunAjaran) {
    throw new Error("Tahun ajaran ujian tidak sesuai dengan tahun ajaran aktif E-Rapor. Muat ulang halaman CBT.");
  }
  if (!active.semesters.includes(semester)) {
    throw new Error("Semester tidak aktif atau tidak diizinkan pada E-Rapor.");
  }
  if (active.semesterBerjalan && semester !== active.semesterBerjalan) {
    throw new Error("Semester yang dipilih bukan semester aktif E-Rapor.");
  }

  const timestamp = new Date();
  let certificateId = "";
  let savedToHistory = false;

  // Hanya nilai >= 80 yang masuk riwayat. Kunci unik:
  // username + mapel + jenis ujian + tahun ajaran + semester.
  // Jika kombinasi yang sama sudah ada, baris lama ditimpa.
  if (nilai >= 80) {
    certificateId = makeCertificateIdCBT_(username,kategori,mapel,tahunAjaran,semester,timestamp.toISOString());
    const lastRow = sheetTarget.getLastRow();
    const rows = lastRow >= 2 ? sheetTarget.getDataRange().getValues() : [];
    const headers = rows.length ? rows[0].map(v => String(v || '').trim().toLowerCase()) : [];
    const col = name => headers.indexOf(String(name).toLowerCase());
    const ixUser=col('Username'), ixKat=col('Kategori'), ixMapel=col('Mata Pelajaran');
    const ixYear=col('Tahun Ajaran'), ixSem=col('Semester');
    let targetRow = -1;
    // Cari dari bawah agar jika data lama terlanjur ganda, baris terbaru yang dipakai.
    for (let i=rows.length-1;i>=1;i--) {
      if (String(rows[i][ixUser] || '').trim() === String(username).trim() &&
          String(rows[i][ixKat] || '').trim() === String(kategori).trim() &&
          normalizeMapelCBT_(rows[i][ixMapel]) === normalizeMapelCBT_(mapel) &&
          String(rows[i][ixYear] || '').trim() === tahunAjaran &&
          normalizeSemesterCBT_(rows[i][ixSem]) === semester) {
        targetRow = i + 1;
        break;
      }
    }
    const record = [timestamp, username, nama, kategori, benar, totalSoal, nilai, status, mapel, tahunAjaran, semester, certificateId];
    if (targetRow > 0) {
      sheetTarget.getRange(targetRow,1,1,record.length).setValues([record]);
    } else {
      sheetTarget.appendRow(record);
    }
    savedToHistory = true;
  }

  deleteExamDraft(username,kategori,mapel,tahunAjaran,semester);

  return {
    success: true,
    result: {
      nama,
      kategori,
      mapel,
      tahunAjaran,
      semester,
      certificateId,
      tanggal: Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd/MM/yyyy"),
      benar,
      totalSoal,
      nilai,
      wrongQuestionNumbers,
      status,
      canGetCertificate: nilai >= 80,
      savedToHistory
    }
  };
}

// Fungsi Tambah Soal (Admin & Guru)
function addBankSoal(data, username) {
  ensureBankSoalSchemaCBT_();
  if (!data) throw new Error("Data soal tidak ditemukan.");
  assertGuruMapelAccess_(username, data.mapel);
  const tipe = normalizeQuestionTypeCBT_(data.tipeSoal);
  const pertanyaan = String(data.pertanyaan || "").trim();
  const kunci = String(data.kunci || "").trim();
  if (!pertanyaan) throw new Error("Pertanyaan wajib diisi.");

  const opsi = {
    A:String(data.opsiA || "").trim(), B:String(data.opsiB || "").trim(),
    C:String(data.opsiC || "").trim(), D:String(data.opsiD || "").trim(),
    E:String(data.opsiE || "").trim()
  };
  let dataSoal = "";
  if (tipe === "PG" || tipe === "PGK") {
    if (!opsi.A || !opsi.B || !opsi.C || !opsi.D) {
      throw new Error("Pilihan A sampai D wajib diisi untuk soal pilihan ganda.");
    }
    if (tipe === "PG") {
      if (!["A","B","C","D","E"].includes(kunci.toUpperCase())) throw new Error("Kunci pilihan ganda harus A sampai E.");
      if (kunci.toUpperCase()==="E" && !opsi.E) throw new Error("Pilihan E belum diisi.");
    } else {
      const keys=kunci.toUpperCase().split(",").map(x=>x.trim()).filter(Boolean);
      if (keys.length<2 || keys.some(x=>!["A","B","C","D","E"].includes(x))) {
        throw new Error("Kunci PG kompleks harus minimal dua pilihan, contoh A,C.");
      }
      if (new Set(keys).size!==keys.length) throw new Error("Kunci PG kompleks tidak boleh duplikat.");
      if (keys.includes("E") && !opsi.E) throw new Error("Pilihan E menjadi kunci tetapi belum diisi.");
    }
  } else if (tipe === "BS") {
    if (!["BENAR","SALAH"].includes(kunci.toUpperCase())) throw new Error("Kunci benar/salah harus BENAR atau SALAH.");
  } else if (tipe === "ISIAN" || tipe === "ESSAY") {
    if (!kunci) throw new Error("Kunci jawaban wajib diisi.");
  } else if (tipe === "JODOH") {
    let parsed;
    try { parsed=JSON.parse(String(data.dataSoal || "{}")); } catch(e) { throw new Error("Format data menjodohkan tidak valid."); }
    const pairs=parsed && Array.isArray(parsed.pairs) ? parsed.pairs : [];
    if (pairs.length<2 || pairs.some(p=>!String(p.left||"").trim() || !String(p.right||"").trim())) {
      throw new Error("Menjodohkan minimal memiliki dua pasangan lengkap.");
    }
    dataSoal=JSON.stringify({pairs:pairs.map(p=>({left:String(p.left).trim(),right:String(p.right).trim()}))});
  }

  const ss = getDB();
  const sheet = ss.getSheetByName("BankSoal");
  const idSoal = "Q" + String(sheet.getLastRow()).padStart(3, '0');
  sheet.appendRow([
    idSoal, data.kategori, pertanyaan,
    opsi.A, opsi.B, opsi.C, opsi.D, opsi.E,
    tipe==="JODOH" ? "MATCH" : kunci.toUpperCase(),
    data.mapel, normalizeSemesterCBT_(data.semester) || "1",
    tipe, dataSoal, String(data.kelas || '').trim(), 'YA'
  ]);
  return { success: true, message: "Soal " + tipe + " berhasil ditambahkan!" };
}

// Ambil Rekap Nilai per Kategori (Guru & Admin)
function getRekapNilai(kategori) {
  try {
    const sheet = getDB().getSheetByName("Nilai_" + String(kategori || '').trim());
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(v=>String(v||'').trim().toLowerCase());
    const ix = name => headers.indexOf(String(name).toLowerCase());
    const c = {tanggal:ix("Tanggal"),username:ix("Username"),nama:ix("Nama Murid"),kategori:ix("Kategori"),
      benar:ix("Jumlah Benar"),total:ix("Total Soal"),nilai:ix("Nilai"),status:ix("Status"),
      mapel:ix("Mata Pelajaran"),tahun:ix("Tahun Ajaran"),semester:ix("Semester")};
    const tz=Session.getScriptTimeZone();
    return data.slice(1).filter(r=>r.some(v=>v!=='' && v!==null)).map(r=>{
      const d=c.tanggal>=0?r[c.tanggal]:'';
      const tanggal=d instanceof Date && !isNaN(d.getTime()) ? Utilities.formatDate(d,tz,'dd/MM/yyyy HH:mm:ss') : (d==null?'':String(d));
      return {tanggal,username:c.username>=0?r[c.username]:'',nama:c.nama>=0?r[c.nama]:'',
        kategori:c.kategori>=0?r[c.kategori]:kategori,benar:c.benar>=0?r[c.benar]:'',
        totalSoal:c.total>=0?r[c.total]:'',nilai:c.nilai>=0?(Number(r[c.nilai])||0):0,
        status:c.status>=0?r[c.status]:'',mapel:c.mapel>=0?r[c.mapel]:'',
        tahunAjaran:c.tahun>=0?r[c.tahun]:'',semester:c.semester>=0?String(r[c.semester]||''):''};
    });
  } catch(err) {
    console.error("getRekapNilai gagal: "+err.stack);
    throw new Error("Gagal memuat rekap nilai: "+err.message);
  }
}

// Tambah User Baru (Khusus Admin)
function addUser(dataUser) {
  const ss = getDB();
  const sheet = ss.getSheetByName("Users");
  sheet.appendRow([dataUser.username, dataUser.password, dataUser.nama, dataUser.role]);
  return { success: true, message: "User berhasil dibuat!" };
}

function normalizeMapelCBT_(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g,' ');
}


// ===== PENGATURAN WARNA CBT (ADMIN) =====
const CBT_THEME_DEFAULTS_ = {
  primary:'#4338ca', primaryDark:'#3730a3', accent:'#7c3aed',
  pageBg:'#f1f5f9', cardBg:'#ffffff', textColor:'#1e293b',
  certBorder:'#1e3a8a', certDash:'#3b82f6', certTitle:'#1e3a8a',
  certName:'#312e81', certAccent:'#059669', certBg:'#f8fafc'
};
function ensureCBTThemeSheet_() {
  const ss=getDB();
  let sh=ss.getSheetByName('PengaturanTampilan');
  if(!sh){sh=ss.insertSheet('PengaturanTampilan');sh.appendRow(['Pengaturan','Warna']);}
  const vals=sh.getDataRange().getDisplayValues();
  const existing={};
  vals.slice(1).forEach(r=>existing[String(r[0]||'').trim()]=String(r[1]||'').trim());
  Object.keys(CBT_THEME_DEFAULTS_).forEach(k=>{
    if(!existing[k]) sh.appendRow([k,CBT_THEME_DEFAULTS_[k]]);
  });
  return sh;
}
function getCBTThemeSettings() {
  const sh=ensureCBTThemeSheet_(), vals=sh.getDataRange().getDisplayValues(), out={};
  vals.slice(1).forEach(r=>{const k=String(r[0]||'').trim();if(k)out[k]=/^#[0-9a-f]{6}$/i.test(String(r[1]||''))?String(r[1]):CBT_THEME_DEFAULTS_[k]||'';});
  return Object.assign({},CBT_THEME_DEFAULTS_,out);
}
function saveCBTThemeSettings(username, settings) {
  const users=getDB().getSheetByName('Users');
  if(!users) throw new Error('Sheet Users tidak ditemukan.');
  const rows=users.getDataRange().getDisplayValues();
  const u=rows.slice(1).find(r=>String(r[0]||'').trim()===String(username||'').trim());
  if(!u || String(u[3]||'').toLowerCase()!=='admin') throw new Error('Hanya admin yang dapat mengubah warna website dan sertifikat.');
  const sh=ensureCBTThemeSheet_();
  const allowed=Object.keys(CBT_THEME_DEFAULTS_);
  const vals=sh.getDataRange().getDisplayValues();
  const rowMap={}; vals.slice(1).forEach((r,i)=>rowMap[String(r[0]).trim()]=i+2);
  allowed.forEach(k=>{
    const v=String(settings && settings[k] || '').trim();
    if(!/^#[0-9a-f]{6}$/i.test(v)) throw new Error('Kode warna '+k+' tidak valid. Gunakan format #RRGGBB.');
    const row=rowMap[k];
    if(row) sh.getRange(row,2).setValue(v); else sh.appendRow([k,v]);
  });
  return {success:true,settings:getCBTThemeSettings()};
}

// Fungsi utama render HTML
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('CBT System - Madrasah')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}