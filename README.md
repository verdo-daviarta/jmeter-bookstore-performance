# JMeter Performance Test — Book Store API

Proyek ini menguji performa **DemoQA Book Store API** dengan Apache JMeter. Aplikasi Book Store menyediakan katalog buku dan koleksi pribadi untuk akun terdaftar. Pengujian mencakup autentikasi, pencarian buku berdasarkan ISBN, penambahan buku ke koleksi, dan pembersihan koleksi akun uji.

Baseline dan Load Test 10, 50, serta 100 user dijalankan di DemoQA. Ramp-Up / Stress dan Soak menggunakan environment staging. Catat environment dan konfigurasi setiap run saat membaca hasil pengujian.

## Endpoint API

| Langkah | Method | Endpoint | Data yang digunakan | Status HTTP yang diharapkan |
| --- | --- | --- | --- | ---: |
| Generate Token | `POST` | `/Account/v1/GenerateToken` | Username dan password akun uji | `200` |
| Login | `POST` | `/Account/v1/Login` | Username dan password akun uji | `200` |
| Browse Books | `GET` | `/BookStore/v1/Books` | Katalog yang memuat ISBN dari data uji | `200` |
| Select Book | `GET` | `/BookStore/v1/Book?ISBN=${isbn}` | ISBN hasil ekstraksi dari katalog | `200` |
| Add Book | `POST` | `/BookStore/v1/Books` | Bearer token, `userId`, dan ISBN dalam `collectionOfIsbns` | `201` |
| Cleanup | `DELETE` | `/BookStore/v1/Books?UserId=${userId}` | Bearer token dan `userId` akun uji | `204` |

## Alur E2E

1. **Login** — Ambil `username` dan `password` dari CSV. Panggil **Generate Token** dan simpan token ke `${token}`. Panggil **Login** dan simpan `userId` ke `${userId}`.
2. **Browse Books** — Ambil katalog buku. Gunakan `${isbnCsv}` dari CSV untuk memilih ISBN yang cocok dan simpan hasil ekstraksi ke `${isbn}`.
3. **Select Book** — Ambil detail buku dengan `${isbn}` dan verifikasi ISBN pada respons.
4. **Add Book** — Tambahkan buku ke koleksi akun `${userId}` dengan header `Authorization: Bearer ${token}`.
5. **Cleanup** — Kosongkan koleksi buku akun uji agar ISBN yang sama dapat dipakai pada putaran berikutnya. Sampler ini berjalan setelah **Add Book** di dalam Loop Controller.

Empat **Transaction Controller** mengelompokkan Login, Browse Books, Select Book, dan Add Book. **Response Assertion** memeriksa status HTTP setiap request. **JSON Extractor** meneruskan token, ID user, dan ISBN ke langkah berikutnya. **Uniform Random Timer** memberi jeda sekitar 1–3 detik sebelum Browse Books, Select Book, dan Add Book.

## Skenario pengujian

| No. | Skenario | Load | Ramp-Up (detik) | Durasi / Loop | Tujuan |
| ---: | --- | --- | ---: | --- | --- |
| 1 | Baseline | 1 user | 1 | 5 iterasi | Validasi skrip dan ukur baseline response time. |
| 2 | Load Test | 10 user | 10 | 70 detik | Verifikasi flow pada beban awal dan ukur response time, throughput, serta error rate. |
| 3 | Load Test | 50 user | 30 | 150 detik | Amati stabilitas sistem dan identifikasi tanda penurunan performa. |
| 4 | Load Test | 100 user | 90 | 210 detik | Uji beban 100 user konkuren dan analisis request yang gagal. |
| 5 | Ramp-Up / Stress | 100 user. Uji hingga titik jenuh jika memungkinkan di staging. | 60 | 180 detik | Amati perubahan response time selama beban meningkat dan identifikasi awal degradasi. |
| 6 | Soak (opsional, nilai tambah) | 25 user, yaitu 25% dari beban puncak dan berada dalam rentang 20–30% | 30 | 2.730 detik | Amati penurunan performa bertahap dan cari indikasi memory leak dengan memantau memori server. |

Durasi pengujian berbasis waktu mencakup ramp-up. Soak menyediakan 30 detik ramp-up dan 45 menit observasi pada beban target. Untuk Load, Stress, dan Soak, **Loop Count** pada Thread Group bernilai `1` agar setiap thread mengambil satu baris akun. **Loop Controller** di dalam grup memakai `Infinite` agar alur berulang sampai batas durasi.

## Persyaratan teknis

- **Apache JMeter 5.6.3** dan **Java 8 atau lebih baru**. Cek instalasi dengan `java -version` dan `jmeter -v` jika JMeter sudah ada di `PATH`. [Persyaratan resmi Apache JMeter](https://jmeter.apache.org/usermanual/get-started.html#requirements)
- **Akses ke environment uji.** Set protokol, host, dan port pada **HTTP Request Defaults** di grup yang akan dijalankan. Untuk staging, gunakan nilai yang berlaku pada device staging.
- **Data uji.** Siapkan akun uji unik yang valid dan ISBN yang tersedia di katalog pada environment yang sama. Gunakan akun dengan koleksi khusus untuk pengujian karena sampler Cleanup mengosongkan koleksinya.
- **CSV Data Set Config.** Gunakan CSV UTF-8 dengan delimiter koma dan header di bawah. Kosongkan **Variable Names** agar JMeter membaca header. Atur **Sharing mode** ke `All threads`, **Recycle on EOF** ke `False`, dan **Stop thread on EOF** ke `True`. Siapkan satu baris akun untuk setiap user pada skenario utama.

```csv
username,password,isbnCsv
```

Gunakan nama berikut sesuai konfigurasi lokal. Untuk staging, arahkan **Filename** ke CSV akun staging yang sesuai. Jika CSV ditaruh di subfolder, gunakan path relatif dari `bookstore.jmx`, misalnya `Data Set Config/users-load-10.csv`. Simpan CSV akun di device masing-masing dan masukkan namanya ke `.gitignore`.

| Skenario | CSV yang dirujuk oleh test plan lokal |
| --- | --- |
| Baseline | `users.csv` |
| Load 10 | `users-load-10.csv` |
| Load 50 | `users-load-50.csv` |
| Load 100 dan Ramp-Up / Stress | `users-load-100.csv` |
| Soak | `users-soak-25.csv` |

## Menjalankan pengujian

1. Buka `bookstore.jmx` di JMeter. Pilih Thread Group skenario yang akan diuji, aktifkan grup itu saja, dan cek **HTTP Request Defaults** serta **CSV Data Set Config**.
2. Pastikan sampler **Cleanup** di dalam alur utama aktif. Grup **Cleanup - 50 Akun Uji** dan **Cleanup - 100 Akun Uji** dapat dijalankan terpisah jika ada koleksi yang masih berisi buku setelah tes. Nonaktifkan **View Results Tree** saat menjalankan pengujian performa.
3. Simpan test plan. Dari folder yang memuat `bookstore.jmx`, jalankan contoh berikut di PowerShell. Sesuaikan path `jmeter.bat` dengan instalasi di device dan gunakan nama output baru untuk setiap run.

```powershell
$jmeter = 'E:\apache-jmeter-5.6.3\bin\jmeter.bat'
& $jmeter -n -t '.\bookstore.jmx' -l '.\results-run01.jtl' -j '.\jmeter-run01.log' -e -o '.\report-run01'
```

File `.jtl` berisi sampel pengujian. File `.log` mencatat eksekusi JMeter. Buka `report-run01/index.html` untuk melihat response time, persentil, throughput, dan error rate. Gunakan folder output laporan yang baru atau masih kosong. [Panduan dashboard HTML Apache JMeter](https://jmeter.apache.org/usermanual/generating-dashboard.html#report_generation)

Pada Soak, bandingkan P95 response time, throughput, dan error rate di awal, tengah, serta akhir. Jika metrik server tersedia, cek tren heap dan garbage collection untuk menilai indikasi memory leak.

