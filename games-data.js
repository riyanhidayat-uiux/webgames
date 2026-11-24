/* =====================================================================
   DAFTAR GAME — untuk menambah game baru:
   1. Buat folder baru di samping index.html ini (mis. "tebak-angka/") dengan index.html di dalamnya.
   2. Tambahkan satu objek ke array GAMES di bawah.
      - path     : folder game (diakhiri "/")
      - emoji    : ikon besar di kartu
      - colors   : dua warna gradasi kartu
      - desc     : deskripsi SINGKAT (satu kalimat, ±60 karakter; maksimal tampil 2 baris)
      - more     : (opsional) deskripsi lengkap, tampil sebagai tooltip saat kursor diarahkan
      - tags     : label kecil (mode, kontrol, dll.); kartu menampilkan 3 pertama + jumlah sisanya
      - bestKey  : (opsional) kunci localStorage skor terbaik, untuk ditampilkan di kartu
   Jadi dulu: false → kartu tampil "Segera hadir" dan tidak bisa diklik.
   ===================================================================== */
const GAMES = [
  {
    title: 'Buah Ninja Sensor',
    desc: 'Tebas buah dengan jari, sentuhan, atau sensor miring.', more: 'Tebas buah dengan jari di depan kamera, sentuhan, atau sensor miring. Ada buah beku, buah hati, fever, skuisi, mode Arcade berlevel, Boss Rush, dan mode 2 Player.',
    emoji: '🍉', path: 'potong-buah/', img: 'img/potong-buah.jpg', art: ['🍉','🍊','🍓','🍍','💣'], colors: ['#ff5a3c', '#ffb000'],
    tags: ['1–2 Player', '📷 Kamera', '👆 Sentuhan', '🎮 Sensor'],
    bestKey: 'bns_best', bestLabel: 'Rekor'
  },
  {
    title: 'Ular 3D Sensor',
    desc: 'Ular klasik 3D, dikendalikan arah jari telunjuk.', more: 'Game ular klasik dalam 3D. Kendalikan dengan arah jari telunjuk di depan kamera, geser layar, atau keyboard. Ada apel emas, mode tembus dinding, dan mode 2 Player.',
    emoji: '🐍', path: 'ular-3d/', img: 'img/ular-3d.jpg', colors: ['#2fbf5a', '#b6ff6a'],
    tags: ['1–2 Player', '3D', '📷 Kamera', '👆 Sentuhan', '⌨️ Keyboard'],
    bestKey: 'ular3d_best', bestLabel: 'Rekor'
  },
  {
    title: 'Badminton 3D Sensor',
    desc: 'Badminton 3D: smash, clear, dan drop lawan AI atau teman.', more: 'Pertandingan badminton 3D. Gerakkan raket dengan jari di depan kamera: maju untuk smash, mundur untuk clear, diam dekat net untuk drop. Lawan AI atau main berdua.',
    emoji: '🏸', path: 'badminton-3d/', img: 'img/badminton-3d.jpg', colors: ['#2a6fe0', '#6fd0ff'],
    tags: ['1–2 Player', '3D', '📷 Kamera', '👆 Sentuhan', '🖱️ Mouse', '⌨️ Keyboard']
  },
  {
    title: 'Lari Rintangan Sensor',
    desc: 'Lari 3D: geser, lompat, dan merunduk dengan seluruh badan.', more: 'Game ala Kinect: berlari di jalur 3D dan gerakkan seluruh badanmu di depan kamera. Geser badan untuk pindah jalur, lompat melewati pagar, merunduk di bawah palang, dan kumpulkan koin.',
    emoji: '🏃', path: 'lari-rintangan/', img: 'img/lari-rintangan.jpg', colors: ['#ff7a3c', '#ffd23f'],
    tags: ['1 Player', '3D', '📷 Tubuh penuh', '⌨️ Keyboard', '👆 Sentuhan'],
    bestKey: 'lari_best', bestLabel: 'Rekor'
  },
  {
    title: 'Lubang di Dinding Sensor',
    desc: 'Tirukan pose supaya muat melewati lubang di dinding.', more: 'Game ala Kinect: dinding bersiluet pose bergerak ke arahmu, dan kamu menirukan pose dengan seluruh badan supaya muat melewati lubang. Pose dibaca lewat kamera, ada 13 pose, 3 tingkat kesulitan, dan mode 2 Player berdampingan.',
    emoji: '🧍', path: 'lubang-dinding/', img: 'img/lubang-dinding.jpg', colors: ['#7a4ae0', '#ff7ad0'],
    tags: ['1–2 Player', '3D', '📷 Tubuh penuh', '🖱️ Tanpa kamera', '😌 Mode santai'],
    bestKey: 'lubang_best', bestLabel: 'Rekor'
  },
  {
    title: 'Pukul Target Sensor',
    desc: 'Pukul bola 3D yang melayang dengan tangan, kepala, atau kaki.', more: 'Lihat dirimu di layar dan pukul bola-bola 3D yang melayang ke arahmu dengan tangan, kepala, siku, atau kaki. Ada bola emas, bola besar, hati, bom, dan hujan bola. Bisa 2 Player adu skor.',
    emoji: '🎯', path: 'pukul-target/', img: 'img/pukul-target.jpg', art: ['🎯','🥊','⚽','🏀','⭐'], colors: ['#2a8ae0', '#ff5aa8'],
    tags: ['1–2 Player', '3D', '📷 Tubuh penuh', '🖱️ Mouse / Sentuhan'],
    bestKey: 'puk_best', bestLabel: 'Rekor'
  },
  {
    title: 'Tinju Sensor',
    desc: 'Tinju 3D lawan 5 petarung AI, sudut pandang orang pertama.', more: 'Bertinju 3D melawan 5 petarung AI dari sudut pandang orang pertama. Pukul dengan jab, hook, dan uppercut, tangkis dengan kepalan di wajah, dan hindari dengan miring badan atau merunduk. Menghindar tepat membuka serangan balik. Ada juga mode sparring 2 Player.',
    emoji: '🥊', path: 'tinju/', img: 'img/tinju.jpg', colors: ['#d02a2a', '#ff9a3c'],
    tags: ['1–2 Player', '3D', '📷 Tubuh penuh', '⌨️ Keyboard'],
    bestKey: 'tinju_best', bestLabel: 'Rekor'
  },
  {
    title: 'Pelatih Senam Sensor',
    desc: 'Senam bersama pelatih 3D, kamera menghitung repetisimu.', more: 'Berolahraga bersama pelatih 3D: lompat bintang, squat, angkat lutut, angkat tangan, dan miring samping. Kamera menghitung repetisi dan menilai kualitas geraknya. Ada program singkat sampai tantangan dan mode adu 2 Player.',
    emoji: '🏋️', path: 'pelatih-senam/', img: 'img/pelatih-senam.jpg', art: ['🏋️','🤸','🧘','🔥','💪'], colors: ['#1fd0b0', '#7fffd0'],
    tags: ['1–2 Player', '3D', '📷 Seluruh badan', '⌨️ Mode demo'],
    bestKey: 'senam_best', bestLabel: 'Rekor'
  },
  {
    title: 'Ikuti Pose Sensor',
    desc: 'Menari mengikuti irama dan tirukan pose penari 3D.', more: 'Menari mengikuti irama: pose penari 3D muncul di jalur ketukan dan kamu menirukannya tepat waktu. Penilaian dari arah lengan dan badan, 3 lagu sintetis, combo, bintang, dan mode adu 2 Player.',
    emoji: '🕺', path: 'ikuti-pose/', img: 'img/ikuti-pose.jpg', art: ['💃','🎵','🕺','🎶','✨'], colors: ['#ff6ac8', '#ffd24a'],
    tags: ['1–2 Player', '3D', '🎵 Musik', '📷 Badan atas', '⌨️ Mode demo'],
    bestKey: 'ikuti_best_pagi', bestLabel: 'Rekor (Pagi Ceria)'
  },
  {
    title: 'Boling 3D Sensor',
    desc: 'Ayunkan lengan untuk melempar bola boling 3D.', more: 'Ayunkan lengan di depan kamera untuk melempar bola boling 3D. Kecepatan ayunan jadi tenaga, geser badan untuk memilih posisi, dan ayunan miring membuat bola melengkung. 10 frame dengan strike dan spare, plus mode gantian 2 Player.',
    emoji: '🎳', path: 'boling-3d/', img: 'img/boling-3d.jpg', colors: ['#7a3ad8', '#ff6ac8'],
    tags: ['1–2 Player', '3D', '📷 Ayunan lengan', '⌨️ Tanpa kamera'],
    bestKey: 'boling_best', bestLabel: 'Skor terbaik'
  },
  {
    title: 'Simulasi Mobil Sensor Stir',
    desc: 'Setir mobil 3D dengan tangan: menyetir bebas atau balapan.',
    more: 'Pegang setir imajiner di depan kamera: putar kedua tangan untuk belok, angkat tangan untuk gas, turunkan untuk rem. Menyetir bebas (Klasik, Santai 3 menit, Jalan Santai tanpa batas) atau BALAPAN melawan 3 pembalap AI dengan nitro dan slipstream, juga 2 Player layar terbelah (kamera mendeteksi dua orang atau keyboard). Tampilan belakang, kokpit pengemudi, atau kap mesin; siang/senja/malam; bisa juga keyboard, sentuh, atau ponsel sebagai setir.',
    emoji: '🚗', path: 'simulasi-mobil/', img: 'img/simulasi-mobil.jpg', colors: ['#2a8ae0', '#7fd0ff'],
    tags: ['1–2 Player', '3D', '🏁 Balapan', '📷 Setir tangan', '🧑‍✈️ Kokpit', '😌 Mode santai'],
    bestKey: 'mobil_best', bestLabel: 'Skor terbaik'
  },
  {
    title: 'Tendangan Penalti Sensor',
    desc: 'Adu penalti 3D realistis: tendang dengan kaki, jaga gawang dengan badan.',
    more: 'Stadion 3D dengan fisika bola nyata (hambatan udara, efek Magnus untuk bola lengkung, pantulan, tiang & mistar, jaring bergoyang) dan kiper AI yang menyelam. Mode Adu Penalti bergantian 5 tendangan + sudden death, atau Latihan 10 tendangan. Kamera: rentangkan tangan ke sasaran, ayunkan kaki untuk menendang (makin cepat makin keras), miringkan badan untuk menyelam saat jadi kiper. Bisa juga pakai mouse/keyboard. Ulangan gerak lambat, tiga tingkat kiper, pilihan seragam & suasana siang/malam.',
    emoji: '⚽', path: 'penalti/', img: 'img/penalti.jpg', colors: ['#1f9d4a', '#9be86f'],
    tags: ['1 Player', '3D', '📷 Tendang & selam', '🥅 Adu penalti', '🎬 Ulangan'],
    bestKey: 'penalti_bestPractice', bestLabel: 'Rekor latihan'
  },
  { title: 'Game berikutnya', desc: 'Slot untuk game baru.', more: 'Slot ini untuk game baru kamu.', emoji: '🎲', soon: true, colors: ['#444', '#222'], tags: ['Segera hadir'] }
];

/* =====================================================================
   DETAIL TIAP GAME — dipakai tools/build-detail.js untuk membuat detail/<game>.html (kunci = path game).
   Setelah mengubah isi di sini, jalankan:  node tools/build-detail.js
   - tagline : satu kalimat penarik
   - how     : langkah singkat cara bermain
   - controls: kontrol per perangkat { icon, name, items[] }
   - modes   : mode permainan
   - features: fitur unggulan
   - req     : kebutuhan kamera / ruang
   ===================================================================== */
const DETAILS = {
  'potong-buah/': {
    tagline: 'Tebas buah secepat kilat — hindari bom dan kejar combo FEVER.',
    how: ['Pilih mode (Waktu 5 menit atau Santai) dan cara kontrol.', 'Sabetkan jari dengan cepat menembus buah yang melambung.', 'Hindari bom 💣 dan jangan biarkan 5 buah jatuh.', 'Isi bar 🔥 FEVER untuk skor ×2 dan bom menghilang 8 detik.'],
    controls: [{ icon: '📷', name: 'Kamera', items: ['Arahkan jari telunjuk ke kamera depan', 'Sabetkan cepat untuk menebas'] }, { icon: '🎮', name: 'Sensor miring HP', items: ['Miringkan dan kibaskan ponsel', 'Titik tengah dikalibrasi saat mulai'] }, { icon: '👆', name: 'Sentuhan', items: ['Geser jari di layar', '2 Player: tiap pemain di sisinya'] }],
    modes: ['🍉 Klasik: Waktu 5 menit', '🌿 Santai — tanpa nyawa', '🏰 Arcade — level demi level dengan target & bos tiap level ke-5', '👹 Boss Rush — bos raksasa berturut-turut', '👥 2 Player layar terbagi'],
    features: ['👹 Bos raksasa: ditebas berkali-kali, 3 fase, melempar buah & bom', '⭐ Bintang tiap level (tergantung nyawa yang hilang)', '🌊 Gelombang berpola: kipas, silang, dari samping, tangga, menara', '💥 Combo multi-buah: TRIPLE, QUAD, PENTA, MEGA dengan bonus makin besar', '❄️ Buah beku: waktu melambat 3 detik', '💖 Buah hati: +1 nyawa', '🔥 FEVER: skor ×2', '🧸 22 jenis skuisi ikut terbang', '⭐ 2 Player: rebut bintang di tengah'],
    req: 'Kamera depan, tangan terlihat jelas. Bisa juga tanpa kamera (sentuhan).',
    boards: { arcade: ['🏰 Arcade — level tertinggi', 'level'], boss: ['👹 Boss Rush — bos dikalahkan', 'bos'] }
  },
  'ular-3d/': {
    tagline: 'Ular klasik dalam arena 3D — kendalikan dengan arah jarimu.',
    how: ['Arahkan telunjuk ke atas, bawah, kiri, atau kanan.', 'Makan apel 🍎 supaya ular makin panjang.', 'Jangan tabrak dinding atau badan sendiri.', 'Sambar apel emas ⭐ sebelum hilang untuk nilai besar.'],
    controls: [{ icon: '📷', name: 'Kamera', items: ['Telunjuk menunjuk arah', '2 Player: tangan kiri = P1, kanan = P2'] }, { icon: '👆', name: 'Sentuhan', items: ['Geser jari ke arah tujuan', 'P1 sisi kiri, P2 sisi kanan'] }, { icon: '⌨️', name: 'Keyboard', items: ['P1: W A S D', 'P2: tombol panah', 'Spasi: jeda'] }],
    modes: ['👤 1 Player', '👥 2 Player satu arena (3 ❤ masing-masing)', '🧱 Opsi tembus dinding'],
    features: ['⭐ Apel emas bernilai besar', '🐍 Rebutan makanan dengan ular lawan', '🛡️ Kebal 2,5 detik setelah muncul lagi'],
    req: 'Kamera depan dan tangan terlihat. Alternatif sentuhan/keyboard tersedia.'
  },
  'badminton-3d/': {
    tagline: 'Smash, clear, dan drop shot — badminton 3D dengan satu jari.',
    how: ['Gerakkan raket dengan telunjuk, mouse, atau sentuhan.', 'Kok dipukul otomatis saat masuk jangkauan raket.', 'Jenis pukulan ditentukan dari gerakanmu saat memukul.', 'Raih poin lebih dulu dari lawan AI atau temanmu.'],
    controls: [{ icon: '📷', name: 'Kamera', items: ['Maju cepat + kok tinggi = smash', 'Mundur = clear ke belakang', 'Diam dekat net = drop', 'Geser kiri/kanan = arahkan bola'] }, { icon: '🖱️', name: 'Mouse / Sentuhan', items: ['Geser untuk menggerakkan raket', '2 Player: P1 setengah bawah, P2 setengah atas'] }, { icon: '⌨️', name: 'Keyboard', items: ['P1: W A S D', 'P2: tombol panah'] }],
    modes: ['🤖 Lawan AI: Mudah / Sedang / Sulit', '👥 2 Player'],
    features: ['💥 Smash, drive, clear, dan drop', '🎯 Arah bola dari gerak raket', '🏸 Lapangan 3D lengkap dengan net'],
    req: 'Kamera depan dengan tangan terlihat. Bisa juga mouse atau sentuhan.'
  },
  'lari-rintangan/': {
    tagline: 'Berlari di jalan kota 3D dan gerakkan seluruh badanmu — gaya Kinect.',
    how: ['Berdiri ±2 meter dari kamera, kepala sampai pinggang terlihat.', 'Geser badan ke kiri/kanan untuk pindah jalur.', 'Lompat melewati pagar dan merunduk di bawah palang.', 'Kumpulkan koin untuk skor tertinggi.'],
    controls: [{ icon: '📷', name: 'Kamera (tubuh)', items: ['Geser badan = pindah jalur', 'Lompat = lompati pagar', 'Merunduk = lewati palang'] }, { icon: '⌨️', name: 'Keyboard', items: ['← / → pindah jalur', '↑ atau Spasi: lompat', '↓: merunduk'] }, { icon: '👆', name: 'Sentuhan', items: ['Geser ke arah yang diinginkan'] }],
    modes: ['👤 1 Player'],
    features: ['🏙️ Gedung dan pohon realistis', '🪙 Koin dan rintangan bervariasi', '⚙️ Kepekaan sensor bisa diatur'],
    req: 'Berdiri ±2 m, ruangan cukup terang. Alternatif keyboard/sentuhan tersedia.'
  },
  'lubang-dinding/': {
    tagline: 'Tirukan pose dengan badanmu supaya muat melewati lubang di dinding.',
    how: ['Lihat pose pada kotak di bagian atas.', 'Tirukan dengan seluruh lengan dan badan.', 'Sendi hijau berarti posisimu pas di lubang; baca teks dan panah kuning untuk tahu bagian tubuh yang perlu digeser.', 'Waspadai RANTAI (beberapa dinding berturut-turut) dan dinding yang BERUBAH pose di tengah jalan.', 'Dinding makin cepat — jaga 3 nyawamu.'],
    controls: [{ icon: '📷', name: 'Kamera (tubuh)', items: ['Tiru pose dengan seluruh badan', '2 Player: berdiri berdampingan ±1 m'] }, { icon: '🖱️', name: 'Tanpa kamera', items: ['P1: tombol pose angka / A, D', 'P2: panah ◀ ▶'] }],
    modes: ['❤️ Klasik (3 nyawa)', '😌 Santai — 5 menit tanpa nyawa', '🎓 Latihan — pilih pose, tanpa nyawa & waktu, pose gagal diulang', '👥 2 Player berdampingan'],
    features: ['🧍 28 pose berbeda dalam 4 tingkat (T kiri/kanan, diagonal, zigzag, kuda-kuda, pesawat, huruf A, hingga hore miring dan bintang lebar)', '🔀 Dinding "pilih salah satu": dua pose, lolos dengan salah satunya (pilihan lebih sulit +25)', '⚠ Dinding BOS tiap 10 dinding: pose paling sulit, hadiah ×3, dan LEVEL baru', '⭕ Power-up dari dinding berlogo: lubang besar, waktu melambat, +1 nyawa', '🎓 Mode Latihan: pilih pose & kecepatan, ringkasan per pose di akhir', '🎯 Panduan koreksi sendi: teks & panah menunjuk bagian tubuh yang meleset ("Angkat tangan kanan")', '🔗 Rantai 3–4 dinding beruntun dengan bonus bila semua lolos', '🔀 Dinding yang berubah pose di tengah jalan (bonus adaptasi)', '📈 3 tingkat kesulitan', '💥 Dinding pecah berkeping saat lolos, bingkai neon di sekeliling lubang', '🎵 Musik latar yang makin tegang, nada naik tiap combo', '🔔 Bunyi "ting" saat pose terkunci sebelum dinding tiba', '🤝 Bonus KOMPAK +50 bila kedua pemain sempurna'],
    req: 'Seluruh badan terlihat dan lengan bebas direntangkan.',
    boards: { 'klasik-mudah': ['❤️ Klasik · Mudah', 'poin'], 'klasik-normal': ['❤️ Klasik · Normal', 'poin'], 'klasik-sulit': ['❤️ Klasik · Sulit', 'poin'], 'santai-mudah': ['😌 Santai · Mudah', 'poin'], 'santai-normal': ['😌 Santai · Normal', 'poin'], 'santai-sulit': ['😌 Santai · Sulit', 'poin'] }
  },
  'pukul-target/': {
    tagline: 'Lihat dirimu di layar dan pukul bola 3D yang melayang ke arahmu.',
    how: ['Berdiri ±1,5–2,5 meter dari kamera dengan badan atas terlihat.', 'Pukul bola dengan tangan, kepala, siku, atau kaki.', 'Hindari bom 💣.', 'Kumpulkan poin sebanyak mungkin.'],
    controls: [{ icon: '📷', name: 'Kamera (tubuh)', items: ['Gerakkan tangan/anggota badan', 'Target muncul dalam jangkauan lenganmu'] }, { icon: '🖱️', name: 'Mouse / Sentuhan', items: ['Gerakkan mouse atau sentuh layar sebagai tanganmu', '2 Player: P1 kiri, P2 kanan'] }],
    modes: ['👤 1 Player: 😊 Mudah / 😎 Normal / 🔥 Sulit', '👥 2 Player adu skor 90 detik'],
    features: ['🔵 Biasa +10 · ⭐ Emas +50', '🛡️ Bola besar perlu 2× pukul', '💗 Hati +1 nyawa · 💣 Bom jangan dipukul', '☔ Hujan bola'],
    req: 'Badan atas terlihat jelas, ruangan terang.'
  },
  'tinju/': {
    tagline: 'Bertinju 3D melawan 5 petarung AI dari sudut pandang orang pertama.',
    how: ['Berdirilah seperti petinju di depan kamera.', 'Pukul dengan jab, hook, atau uppercut.', 'Tangkis dengan kepalan di depan wajah.', 'Menghindar tepat waktu membuka serangan balik.'],
    controls: [{ icon: '📷', name: 'Kamera (tubuh)', items: ['Pukul dengan tanganmu', 'Kepalan di wajah = tangkis', 'Miring badan atau merunduk = menghindar'] }, { icon: '⌨️', name: 'Keyboard', items: ['P1: Z/X/C pukul · V tangkis · A miring · S runduk', 'P2: J/K/L pukul · M tangkis · ◀ miring · ▼ runduk'] }],
    modes: ['🤖 1 Player lawan AI: Mudah / Normal / Sulit', '👥 Sparring 2 Player (maks. 5 ronde, menang 2 ronde)'],
    features: ['🥊 5 petarung AI berbeda', '⚡ Bar SUPER untuk pukulan ×3', '🎯 Jab/uppercut dihindari miring, hook dihindari merunduk'],
    req: 'Berdiri di depan kamera dengan badan atas terlihat jelas.'
  },
  'pelatih-senam/': {
    tagline: 'Berolahraga bersama pelatih 3D — kamera menghitung repetisimu.',
    how: ['Pilih program: Singkat, Standar, atau Tantangan.', 'Ikuti gerakan pelatih di layar.', 'Kamera menilai apakah gerakmu cukup dalam, tinggi, atau lebar.', 'Selesaikan semua gerakan dan lihat nilai akhir.'],
    controls: [{ icon: '📷', name: 'Kamera (seluruh badan)', items: ['Lompat bintang, squat, angkat lutut', 'Angkat tangan, miring samping'] }, { icon: '⌨️', name: 'Mode demo', items: ['Spasi = 1 repetisi', 'Untuk mencoba alur tanpa kamera'] }],
    modes: ['⚡ Singkat ±3 menit', '💪 Standar ±6 menit', '🔥 Tantangan ±9 menit', '👥 2 Player adu poin'],
    features: ['⭐ 5 jenis gerakan', '✅ Penilaian kualitas gerak', '🧑‍🏫 Pelatih 3D'],
    req: 'Berdiri ±2,5–3 m sampai kepala hingga kaki terlihat, ruang luas dan terang. Lakukan pemanasan dulu.'
  },
  'ikuti-pose/': {
    tagline: 'Menari mengikuti irama — tirukan pose penari tepat pada ketukan.',
    how: ['Nyalakan suara untuk musiknya.', 'Pose penari 3D muncul di jalur ketukan.', 'Tirukan tepat waktu untuk combo.', 'Kumpulkan bintang di akhir lagu.'],
    controls: [{ icon: '📷', name: 'Kamera (badan atas)', items: ['Yang dinilai arah lengan dan badan', 'Bebas bergeser posisi'] }, { icon: '⌨️', name: 'Mode demo', items: ['Spasi = P1', 'Enter = P2'] }],
    modes: ['👤 1 Player', '👥 2 Player adu (berdampingan ±1 m)'],
    features: ['🎵 3 lagu sintetis', '🔥 Sistem combo dan bintang', '📈 Penilaian per ketukan'],
    req: 'Berdiri ±2 m, kepala sampai pinggang terlihat (kaki boleh tidak).'
  },
  'boling-3d/': {
    tagline: 'Ayunkan lengan untuk melempar bola boling 3D — strike dan spare.',
    how: ['Berdiri ±2 meter sampai kepala, bahu, dan lengan terlihat.', 'Geser badan untuk memilih posisi lempar.', 'Ayunkan lengan dengan cepat dan tegas untuk melempar.', 'Ayunan miring membuat bola melengkung.'],
    controls: [{ icon: '📷', name: 'Kamera (lengan)', items: ['Geser badan = posisi', 'Kecepatan ayunan = tenaga', 'Ayun miring = lengkung'] }, { icon: '⌨️', name: 'Tanpa kamera', items: ['← / → geser · Q / E arah · Z / X lengkung', 'Tahan Spasi lalu lepas untuk melempar', 'Atau geser ke atas di layar'] }],
    modes: ['👤 1 Player', '👥 2 Player gantian per frame'],
    features: ['🎳 10 frame lengkap, strike & spare', '🌀 Efek lengkung bola', '📊 Papan skor otomatis'],
    req: 'Lengan terlihat jelas; ayunan harus cepat dan tegas.'
  },
  'simulasi-mobil/': {
    tagline: 'Pegang setir imajinermu — menyetir bebas atau balapan melawan AI.',
    how: ['Pegang setir imajiner setinggi dada dan tahan 1 detik untuk kalibrasi.', 'Putar kedua tangan untuk belok.', 'Angkat tangan untuk gas, turunkan untuk rem.', 'Salip mobil lain dan hindari tabrakan.'],
    controls: [{ icon: '📷', name: 'Kamera (setir tangan)', items: ['Putar tangan = belok', 'Tangan naik = gas · turun = rem'] }, { icon: '⌨️', name: 'Keyboard', items: ['← / → atau A / D belok', '↑ / W gas · ↓ / S rem', 'H klakson · C ganti sudut pandang'] }, { icon: '📱', name: 'Sentuh / HP', items: ['Tombol layar', 'Ponsel bisa jadi setir (sensor miring)'] }],
    modes: ['🚗 Menyetir bebas: Klasik, Santai 3 menit, Jalan Santai', '🏁 Balapan vs 3 pembalap AI', '👥 2 Player layar terbagi'],
    features: ['🧑‍✈️ Tampilan belakang, kokpit, atau kap mesin', '🌄 Siang, senja, dan malam', '⚡ Nitro dan slipstream saat balapan'],
    req: 'Berdiri ±2 m, kepala, bahu, dan kedua tangan terlihat.'
  },
  'penalti/': {
    tagline: 'Adu penalti di stadion 3D dengan fisika bola nyata dan kiper yang bereaksi.',
    how: ['Bidik sasaran di gawang.', 'Tendang — makin cepat ayunan, makin keras bola.', 'Bergantian menendang dan menjaga gawang (5 tendangan + sudden death).', 'Tonton ulangan gerak lambat setiap gol dan penyelamatan.'],
    controls: [{ icon: '📷', name: 'Kamera (seluruh badan)', items: ['Rentangkan satu tangan ke sasaran', 'Ayunkan kaki untuk menendang', 'Miringkan badan untuk menyelam'] }, { icon: '🖱️', name: 'Mouse', items: ['Bidik dengan mouse', 'Tahan klik / Spasi lalu lepas', 'Q / E lengkung · R / F naik-turun'] }, { icon: '⌨️', name: 'Menjaga gawang', items: ['← → menyelam · ↑ tinggi · ↓ rendah', 'Spasi: tengah'] }],
    modes: ['🥅 Adu Penalti (5 tendangan + sudden death)', '🎯 Latihan 10 tendangan', '😊 😎 🔥 3 tingkat kiper'],
    features: ['⚽ Hambatan udara, efek Magnus, tiang & mistar', '🧤 Kiper AI membaca lintasan bola', '🎬 Ulangan gerak lambat', '🌙 Seragam dan suasana siang/malam'],
    req: 'Berdiri ±2,5–3 m, seluruh badan terlihat. Bisa juga mouse/keyboard.'
  }
};
