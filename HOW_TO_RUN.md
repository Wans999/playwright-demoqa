# Cara Menjalankan Test

Panduan singkat untuk mencoba menjalankan automation test di project ini, dari nol sampai melihat hasilnya.

Test ini berjalan otomatis di website latihan **[demoqa.com](https://demoqa.com)** dan mengecek 4 hal:

| Test | Yang dilakukan |
|---|---|
| **Web Tables** | Menambahkan 5 user sekaligus dari file CSV, lalu memastikan semuanya muncul di tabel |
| **Drag and Drop** | Menyeret kotak ke area target, lalu memastikan berhasil di-drop |
| **Resize** | Mengubah ukuran kotak menjadi 400 × 200 piksel, lalu memastikan ukurannya sesuai |
| **Student Registration Form** | Mengisi dan mengirim formulir, lalu mengecek data di popup konfirmasi |

---

## 1. Siapkan dulu

Kamu butuh:

- **Node.js versi 20 atau lebih baru** — download di [nodejs.org](https://nodejs.org) (pilih versi **LTS**)
- **Git** — download di [git-scm.com](https://git-scm.com) (atau download project sebagai ZIP, lihat langkah 2)
- Koneksi internet (test membuka website demoqa.com)

Cek apakah sudah terpasang dengan membuka **Terminal** (Mac) atau **Command Prompt / PowerShell** (Windows), lalu ketik:

```bash
node -v
```

Kalau muncul angka versi (misalnya `v22.11.0`), berarti sudah siap.

---

## 2. Download project

```bash
git clone https://github.com/Wans999/playwright-demoqa.git
cd playwright-demoqa
```

> Tidak pakai Git? Buka halaman repo di GitHub → tombol hijau **Code** → **Download ZIP**, ekstrak, lalu buka folder hasil ekstrak di Terminal.

---

## 3. Install (sekali saja)

Jalankan dua perintah ini di dalam folder project:

```bash
npm install
npx playwright install chromium
```

- `npm install` memasang semua library yang dibutuhkan (butuh 1–2 menit).
- `npx playwright install chromium` mengunduh browser Chromium yang dipakai untuk test.

---

## 4. Jalankan test

```bash
npm test
```

Yang akan terjadi:

1. Browser Chromium terbuka dan **bergerak sendiri** — mengklik, mengetik, menyeret — seperti ada orang yang memakainya. Sengaja dibuat agak pelan supaya mudah diikuti.
2. Di Terminal muncul setiap langkah test beserta tanda ✔ (lulus) atau ✖ (gagal).
3. Setelah selesai (± 2–3 menit), **dashboard hasil test otomatis terbuka** di browser.

Contoh hasil di Terminal kalau semua lulus:

```
4 scenarios (4 passed)
13 steps (13 passed)
```

---

## 5. Menjalankan satu test saja

| Perintah | Test yang dijalankan |
|---|---|
| `npm run test:webtables` | Web Tables (bulk insert dari CSV) |
| `npm run test:droppable` | Drag and Drop |
| `npm run test:resizable` | Resize elemen |
| `npm run test:form` | Student Registration Form |

---

## 6. Membaca hasil di dashboard

Dashboard terbuka otomatis setelah test selesai. Kalau tidak terbuka atau ingin membukanya lagi:

```bash
npm run dashboard:open
```

> Di Windows: buka file `reports\dashboard\index.html` dengan double-click.

Menu di sebelah kiri dashboard:

| Menu | Isinya |
|---|---|
| **Overview** | Ringkasan: berapa test yang lulus, total durasi, pass rate |
| **Performance** | Grafik durasi tiap test, dibanding run sebelumnya |
| **Scenarios** | Daftar test. **Klik barisnya** untuk melihat setiap langkah + screenshot |
| **Logs** | Kalau ada yang gagal: penjelasan error, lokasi di kode, dan saran perbaikan |
| **Videos** | Rekaman layar setiap test — bisa ditonton langsung |
| **History** | Semua run sebelumnya, bisa dibuka dan dibandingkan |

Kalau ada test yang **gagal**, buka menu **Logs** — di sana dijelaskan apa yang salah, di file dan baris mana, dan cara memperbaikinya. Tonton juga videonya di menu **Videos**.

---

## 7. Mengatur kecepatan

Secara default test berjalan pelan (jeda 1 detik tiap klik/ketik) supaya mudah diamati.

**Mau lebih cepat?** Mac / Linux:
```bash
SLOW_MO=0 STEP_DELAY=0 npm test
```
Windows (PowerShell):
```powershell
$env:SLOW_MO=0; $env:STEP_DELAY=0; npm test
```

**Mau tanpa membuka jendela browser** (jalan di belakang layar, paling cepat)? Mac / Linux:
```bash
CI=true npm test
```
Windows (PowerShell):
```powershell
$env:CI="true"; npm test
```

> Mode ini tidak membuka dashboard otomatis — buka manual dengan `npm run dashboard:open`.

---

## 8. Mencoba dengan data sendiri

Data test ada di folder `data/` dan bisa diubah tanpa menyentuh kode:

**`data/webTablesUsers.csv`** — daftar user yang ditambahkan ke tabel. Tambah baris baru untuk menambah user:
```
firstName,lastName,email,age,salary,department
Budi,Santoso,budi.santoso@example.com,28,8000,Engineering
```

**`data/studentForm.json`** — data formulir pendaftaran (nama, email, tanggal lahir, hobi, dll).

> ⚠️ Untuk **tanggal lahir**, `input` memakai singkatan bulan 3 huruf, sedangkan `expected` memakai nama bulan lengkap tanpa spasi sebelum tahun:
> ```json
> "dateOfBirth": { "input": "27 Jun 1999", "expected": "27 June,1999" }
> ```

Setelah mengubah data, jalankan lagi `npm test`.

---

## 9. (Opsional) Allure Report

Allure adalah laporan test alternatif yang lebih detail. Butuh **Java** terpasang (`java -version`).

```bash
npm run test:allure     # jalankan test + buat Allure report
npm run allure:open     # buka Allure report
```

---

## Kalau ada masalah

| Masalah | Solusi |
|---|---|
| `node: command not found` / `npm: command not found` | Node.js belum terpasang. Install dari [nodejs.org](https://nodejs.org), lalu tutup & buka lagi Terminal. |
| `Executable doesn't exist ... chromium` | Browser belum diunduh. Jalankan `npx playwright install chromium`. |
| Test gagal dengan pesan `Timeout` | Biasanya internet lambat atau demoqa.com sedang lambat. Coba jalankan lagi. |
| Test form gagal, tanggal lahir yang muncul adalah **tanggal hari ini** | Format `input` tanggal salah — pakai singkatan bulan 3 huruf, misal `Jun` bukan `June` (lihat langkah 8). |
| Dashboard tidak terbuka otomatis | Jalankan `npm run dashboard:open`, atau buka `reports/dashboard/index.html` secara manual. |
| Video tidak bisa diputar di Safari | Buka dashboard dengan Chrome, Edge, atau Firefox. |

---

Dokumentasi teknis lengkap (struktur project, Page Object Model, Jenkins, dll) ada di [README.md](README.md).
