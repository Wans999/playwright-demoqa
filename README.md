# Playwright + Cucumber BDD Framework

Framework automation testing menggunakan Playwright dan Cucumber dengan pola Page Object Model (POM), dengan target web [demoqa.com](https://demoqa.com).

> **Baru pertama kali mencoba?** Ikuti panduan singkat di **[HOW_TO_RUN.md](HOW_TO_RUN.md)** — dari install sampai melihat hasil test.

| Skenario | URL | Yang dites |
|---|---|---|
| Bulk Insert User di Web Tables | `/webtables` | Tambah banyak user dari CSV, pastikan semua muncul di tabel |
| Drag and Drop | `/droppable` | Seret elemen ke area target, pastikan berhasil di-drop |
| Resize Element | `/resizable` | Ubah ukuran elemen menjadi 400 × 200 px, pastikan ukurannya sesuai |
| Student Registration Form | `/automation-practice-form` | Isi & submit form, verifikasi data di popup konfirmasi |

---

## Tech Stack

- **Playwright** — browser automation
- **Cucumber** — BDD framework
- **multiple-cucumber-html-reporter** — HTML report generator
- **Allure Report** — advanced report generator
- **dotenv** — environment configuration
- **Jenkins** — CI/CD

---

## Struktur Project

```
playwright/
├── tests/                   # [tests] skenario test
│   ├── features/
│   │   ├── webTables.feature
│   │   ├── droppable.feature
│   │   ├── resizable.feature
│   │   └── practiceForm.feature
│   ├── steps/
│   │   ├── webTablesSteps.js
│   │   ├── droppableSteps.js
│   │   ├── resizableSteps.js
│   │   └── practiceFormSteps.js
│   └── support/
│       ├── world.js             # browser setup, blokir iklan & hooks
│       └── dataHelper.js        # pembaca data test (CSV/JSON)
├── pages/                   # [pages] class per halaman berisi aksi (method)
│   ├── basePage.js          # parent class (open URL)
│   ├── webTablesPage.js
│   ├── droppablePage.js
│   ├── resizablePage.js
│   └── practiceFormPage.js
├── locators/                # [locators] selector elemen per halaman
│   ├── webTablesLocators.js
│   ├── droppableLocators.js
│   ├── resizableLocators.js
│   └── practiceFormLocators.js
├── data/                    # [data] data test
│   ├── webTablesUsers.csv   # daftar user untuk bulk insert
│   ├── studentForm.json     # data form Student Registration
│   ├── testData.json        # base URL, path halaman, target resize, dll
│   └── files/profile.png    # file untuk upload picture
├── reports/                 # output cucumber JSON report
├── allure-results/          # output allure raw results
├── allure-report/           # output allure HTML report
├── videos/                  # output video recording
├── .env                     # environment variables (tidak di-push ke GitHub)
├── Jenkinsfile              # Jenkins CI/CD pipeline
├── cucumber.json            # konfigurasi cucumber
├── generate-report.js       # script generate HTML report
└── package.json
```

---

## Instalasi

```bash
npm install
npx playwright install chromium
```

Buat file `.env` di root project:
```
BASE_URL=https://demoqa.com
```
Kalau `.env` tidak ada, base URL diambil dari `data/testData.json`.

---

## Cara Run Test

### Run semua test
```bash
npm test
```

### Run berdasarkan tag
```bash
npm run test:webtables   # @webtables
npm run test:droppable   # @droppable
npm run test:resizable   # @resizable
npm run test:form        # @practiceForm
```

Tanpa membuka browser (headless):
```bash
CI=true npm test
```

### Mengatur kecepatan test
Saat dijalankan di lokal, test sengaja diperlambat supaya mudah diamati (di CI tanpa jeda):

| Variabel | Default lokal | Fungsi |
|---|---|---|
| `SLOW_MO` | `1000` ms | Jeda setiap aksi (klik, ketik, drag) |
| `STEP_DELAY` | `2000` ms | Jeda setelah setiap step |

Bisa diatur di `.env` atau langsung saat run:
```bash
SLOW_MO=2000 STEP_DELAY=3000 npm test   # lebih lambat lagi
SLOW_MO=0 STEP_DELAY=0 npm test         # kecepatan penuh
```

### Generate HTML Report
```bash
npm run report
```

Report tersimpan di `reports/html/index.html`.

### Test Dashboard (custom)
Setiap `npm test` / `npm run test:*` selesai, dashboard **otomatis di-generate dan dibuka di browser**, baik test lulus maupun gagal (lewat `run-tests.js`).
- Di CI (`CI=true`) dashboard tetap di-generate tapi browser tidak dibuka.
- Tidak mau browser terbuka otomatis: `DASHBOARD_OPEN=false npm test`
- `npm run test:allure` sekalian membuat Allure report (single file) sebelum dashboard.

Generate / buka manual:
```bash
npm run dashboard        # generate dashboard dari hasil test terakhir
npm run dashboard:open   # buka di browser
```
Dashboard tersimpan di `reports/dashboard/index.html` dan menampilkan:
- Ringkasan passed / duration / pass rate, dibandingkan dengan run sebelumnya
- Grafik durasi per scenario (run ini vs run sebelumnya) dan riwayat run
- Daftar scenario: klik `…` untuk melihat step, error, dan screenshot per step
- Activity feed per scenario, termasuk pesan error dan screenshot step yang gagal
- **Logs**: setiap error dijelaskan dengan:
  - jenis error (teks tidak cocok, elemen tertutup, timeout, dll) dan penjelasannya
  - Expected vs Received, locator yang dipakai, dan berapa lama Playwright menunggu
  - lokasi error: feature → step → step definition → page object (file:baris), plus potongan kodenya
  - saran perbaikan, screenshot saat gagal, error console browser, dan log mentah (bisa di-copy)
  - execution log gaya terminal untuk semua step (filter *Errors only*)

Analisis error ada di `dashboard/errorAnalyzer.js`. Error console browser dikumpulkan oleh `tests/support/world.js`.
- Pencarian scenario (tekan `/`)

- **History**: semua run sebelumnya (default 20 terakhir):
  - daftar run dengan hasil, durasi, dan skenario yang gagal, plus tombol **Open** untuk membuka dashboard lengkap run tersebut (termasuk screenshot & log error)
  - **Compare runs**: pilih 2 run mana saja, lihat perubahan per skenario (*Fixed*, *Broke*, *Still failing*, lebih cepat/lambat)
  - **Scenario timeline**: status setiap skenario di setiap run, dengan penanda **FLAKY** untuk test yang kadang lulus kadang gagal

Riwayat run disimpan di `reports/history.json`, dan salinan dashboard tiap run di `reports/dashboard/runs/run-N/`.
Jumlah run yang disimpan bisa diubah lewat `DASHBOARD_HISTORY` (misal `DASHBOARD_HISTORY=50 npm run dashboard`).
Hapus `reports/history.json` dan `reports/dashboard/runs/` untuk mulai dari run #1 lagi.
Kode dashboard ada di `dashboard/generate.js` (pengolah data) dan `dashboard/template.html` (tampilan).

### Generate Allure Report
```bash
npm run allure:generate   # generate report (single file, bisa dibuka langsung dari allure-report/index.html)
npm run allure:open       # buka report di browser
```

Atau langsung serve tanpa generate:
```bash
npm run allure:serve
```

---

## Tags

| Tag | Keterangan |
|---|---|
| `@webtables` | Bulk insert user dari CSV |
| `@droppable` | Drag and drop |
| `@resizable` | Resize elemen ke 400 × 200 |
| `@practiceForm` | Submit Student Registration Form |

---

## Page Object Model (POM)

Kode dipisah menjadi empat bagian:

| Bagian | Folder | Isi |
|---|---|---|
| tests | `tests/` | Skenario test (`.feature`) + step definitions |
| pages | `pages/` | Class per halaman berisi aksi (method) |
| locators | `locators/` | Selector elemen per halaman |
| data | `data/` | Data test (CSV / JSON) |

Alurnya: **feature → steps → pages → locators**, dan steps mengambil data dari `data/`.

```js
// locators/webTablesLocators.js
module.exports = { addButton: '#addNewRecordButton', ... };

// pages/webTablesPage.js
const WebTablesLocators = require('../locators/webTablesLocators');
class WebTablesPage extends BasePage {
    constructor(page) {
        super(page);
        this.addButton = page.locator(WebTablesLocators.addButton);
    }
    async addUser(user) { ... }
}
```

Untuk menambah user di skenario bulk insert, cukup tambahkan baris di `data/webTablesUsers.csv`, tanpa perlu mengubah kode. Data form bisa diubah di `data/studentForm.json`.

---

## Fitur

### Video Recording
Setiap test direkam otomatis dan disimpan di folder `videos/` dengan nama scenario (misal `drag-element-to-the-target-area-<timestamp>.webm`). Dikonfigurasi di `tests/support/world.js`.

Video bisa ditonton langsung di dashboard (`npm run dashboard`) lewat menu **Videos**, tombol **Watch video** di detail scenario, atau **Watch recording** di kartu error. Video ikut disalin ke arsip setiap run, jadi run lama tetap bisa ditonton dari menu History.

### Screenshot Per Step
Screenshot diambil setelah setiap step dan otomatis masuk ke HTML report. Dikonfigurasi menggunakan hook `AfterStep` di `support/world.js`.

### Environment Config
Kredensial dan URL dikelola lewat file `.env` menggunakan package `dotenv`. File `.env` tidak di-push ke GitHub untuk keamanan.

---

## CI/CD dengan Jenkins

### Prasyarat
- Jenkins terinstall dan berjalan di `http://localhost:8080`
- Plugin: **Pipeline**, **Git**, **HTML Publisher**, **Allure Jenkins Plugin**
- **Allure Commandline** didaftarkan di **Manage Jenkins → Tools → Allure Commandline installations** (centang *Install automatically*)
- Node.js terinstall di `/opt/homebrew/bin` (Mac Apple Silicon) atau `/usr/local/bin` (Mac Intel / Linux)
- Java (sudah ada kalau Jenkins jalan)

### Setup Job
1. Buat **New Item** → pilih **Pipeline**
2. Di bagian **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/Wans999/Playwright.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. Centang **Poll SCM** dengan schedule `H/5 * * * *`
4. Klik **Save**

### Menjalankan Pipeline
- **Build Now** — run semua test
- **Build with Parameters** — pilih tag scenario yang dijalankan

### Melihat Report di Jenkins
Setelah build selesai, di sidebar kiri halaman build ada:
- **Test Dashboard** — dashboard custom (Logs, Videos, History, dll)
- **Cucumber HTML Report**
- **Allure Report**

Dashboard build terakhir selalu bisa dibuka di alamat tetap (simpan sebagai bookmark):
```
http://localhost:8080/job/<nama-job>/Test_20Dashboard/
```
Link ini juga dicetak di akhir **Console Output** setiap build.

### Wajib: Izinkan JavaScript di Report (CSP)
Secara default Jenkins memblokir JavaScript di report HTML, sehingga **Test Dashboard tampil kosong** dan grafik Cucumber report tidak muncul.
Jalankan script ini di **Manage Jenkins → Script Console**:
```groovy
System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
```
Setting ini **hilang setiap Jenkins di-restart**. Supaya permanen, buat init script yang otomatis dijalankan Jenkins setiap start:
```bash
mkdir -p ~/.jenkins/init.groovy.d
echo 'System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")' > ~/.jenkins/init.groovy.d/csp.groovy
brew services restart jenkins-lts
```

### Catatan
- History dashboard di Jenkins tersimpan di workspace job (`reports/history.json`), terpisah dari history di laptop.
- Tombol Allure/Cucumber di dalam Test Dashboard tidak berfungsi di Jenkins; pakai menu di sidebar build.
- Build yang disimpan dibatasi 20 terakhir (`buildDiscarder` di Jenkinsfile) supaya disk tidak penuh.

---

## Stages Jenkins Pipeline

| Stage | Keterangan |
|---|---|
| Checkout | Pull code dari GitHub |
| Install Dependencies | `npm ci` (install sesuai `package-lock.json`) |
| Install Playwright Browsers | Install Chromium |
| Run Tests | `node run-tests.js --allure` — test + Allure results + Test Dashboard |
| Post (selalu jalan) | Generate Cucumber HTML report, publish Test Dashboard, Cucumber report & Allure report |
