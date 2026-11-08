# Portal Digital MA NU Hasyim Asy'ari 1 Kudus

Portal statis GitHub Pages untuk mengarahkan pengguna ke aplikasi Google Apps Script madrasah.

## Struktur
- `index.html` — halaman portal.
- `css/style.css` — desain responsif.
- `js/apps.js` — konfigurasi nama, logo, kategori, dan URL aplikasi.
- `js/main.js` — pencarian dan pembuatan kartu aplikasi.

## Mengaktifkan GitHub Pages
1. Buat repository `portal-digital-manuha1`.
2. Unggah seluruh isi folder proyek ke root repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main`, folder `/ (root)`, lalu **Save**.
6. Buka alamat `https://USERNAME.github.io/portal-digital-manuha1/`.

## Mengubah URL aplikasi
Edit `js/apps.js`. Ganti nilai `url` pada aplikasi yang sesuai. URL Google Apps Script harus berupa URL deployment Web App yang berakhiran `/exec`.

## Menambahkan logo
Pada properti `logo` di `js/apps.js`, isi URL HTTPS gambar logo yang dapat diakses publik. Jika dibiarkan kosong, portal menampilkan monogram HA.

## Catatan keamanan
- Repository GitHub Pages bersifat publik jika menggunakan repository publik.
- Jangan menyimpan password, token sesi, API key, atau data pribadi siswa di file portal.
- URL aplikasi bukan mekanisme autentikasi. Setiap aplikasi Apps Script harus memeriksa sesi, peran, dan izin pengguna di sisi server.
- Atur akses deployment dan validasi akses pada backend sesuai kebutuhan. Jangan membuka data siswa atau nilai kepada pengguna yang tidak berwenang.
- Tautan aplikasi dibuka di tab baru; portal tidak menggunakan iframe sehingga menghindari kendala pembatasan embedding Google Apps Script.
