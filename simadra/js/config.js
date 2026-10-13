/*
 * KONFIGURASI DATA PUBLIK
 * 1) Publikasikan hanya worksheet yang benar-benar boleh dilihat siapa pun.
 * 2) Google Sheets > File > Share/Bagikan bukan hal yang sama dengan Publish to web.
 * 3) Jangan masukkan URL CSV Nilai, Presensi, Tagihan, Pembayaran, atau data pribadi.
 *
 * Isi csvUrl setelah worksheet publik diterbitkan sebagai CSV.
 * Format URL publik biasanya:
 * https://docs.google.com/spreadsheets/d/e/PUBLISHED_ID/pub?gid=SHEET_GID&single=true&output=csv
 */
window.SIM_CONFIG = {
  schoolName: "MA NU Hasyim Asy’ari 1 Kudus",
  motto: "Berakhlak, Cerdas, dan Berwawasan Lingkungan",
  spreadsheetId: "1tU7whrYyAlER7ua_C-TRsJWhwNTShvIOn1zpWrE_Ud4",
  sheets: {
    pengumuman: {
      csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRD0K6p2Xozbp2LGlJEDqj7XiDrDDrUkORrGd-SUfNOcyL3yd3yfHu_ULfh2KiLt5EJ1FNozV02dQ5N/pub?gid=0&single=true&output=csv",
      columns: { title: "Judul", body: "Isi", date: "TanggalPublikasi", target: "Target" }
    },
    jadwal: {
      csvUrl: "",
      columns: { day: "Hari", className: "Kelas", start: "JamMulai", end: "JamSelesai", subject: "MataPelajaran", teacher: "Guru" }
    },
    materi: {
      csvUrl: "",
      columns: { title: "Judul", description: "Deskripsi", subject: "MataPelajaran", url: "URL", type: "Jenis" }
    }
  }
};
