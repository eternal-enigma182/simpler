// lib/pilihan-steps.js
// Nama tahapan sesuai struktur terbaru

export const PILIHAN_STEPS = {

  RTRWP: [
    { urutan: 1,  nama: "Matek Ruang Darat",
      pilihan: ["Belum", "Proses Penyusunan", "Matek Ruang Darat Selesai"] },
    { urutan: 2,  nama: "Pertek MKP",
      pilihan: ["Belum", "Proses Pesetujuan Teknis MKP", "Telah mendapatkan Persetujuan Teknis MKP", "Tidak Memiliki Wilayah Laut"] },
    { urutan: 3,  nama: "Proses Integrasi",
      pilihan: ["Belum", "Proses Integrasi", "Telah mendapatkan BA Integrasi", "Tidak Memiliki Wilayah Laut"] },
    { urutan: 4,  nama: "Validasi KLHS",
      pilihan: ["Belum", "Proses Penyusunan", "Telah Mendapatkan Validasi KLHS"] },
    { urutan: 5,  nama: "Pembahasan Ranperda di DPRD",
      pilihan: ["Belum", "Ranperda telah diajukan Gubernur", "Proses Pembahasan di DPRD", "Telah mendapatkan BA Kesepakatan Substansi"] },
    { urutan: 6,  nama: "Lintas Sektor",
      pilihan: ["Belum", "Ranperda telah diajukan Gubernur", "Proses Linsek/Pra-Linsek", "Telah mendapatkan BA Linsek"] },
    { urutan: 7,  nama: "Persub",
      pilihan: ["Belum", "Proses Persub", "Telah mendapatkan Surat Persetujuan Substansi"] },
    { urutan: 7,  nama: "Persetujuan Substansi",
      pilihan: ["Belum", "Proses Persub", "Telah mendapatkan Surat Persetujuan Substansi"] },
    { urutan: 8,  nama: "Persetujuan DPRD",
      pilihan: ["Belum", "Proses Persetujuan DPRD", "Telah mendapatkan SK dan BA Persetujuan Bersama Gub dan DPRD"] },
    { urutan: 9,  nama: "Evaluasi Dagri",
      pilihan: ["Belum", "Proses Evaluasi Dagri", "Telah mendapatkan Kepmendagri Evaluasi Ranperda"] },
    { urutan: 10, nama: "Pentapan Perda",
      pilihan: ["Belum", "Perda Telah Terbit"] },
    { urutan: 10, nama: "Penetapan Perda",
      pilihan: ["Belum", "Perda Telah Terbit"] },
  ],

  'RZ KAW': [
    { urutan: 1, nama: "Pembentukan PAK",
      pilihan: ["Belum", "Panitia Antar Kementerian Telah Terbentuk"] },
    { urutan: 2, nama: "Dokumen Awal",
      pilihan: ["Belum", "Pengumpulan Data, Informasi dan Peta Dasar", "Proses Penyusunan", "Konsultasi Publik Dokumen Awal", "Telah Mendapatkan BA Konsultasi Publik Dokumen Awal", "Dokumen Awal Selesai"] },
    { urutan: 3, nama: "Dokumen Antara",
      pilihan: ["Belum", "Proses Penyusunan", "Proses Perbaikan Dokumen", "FGD Konflik Pemanfaatan Ruang Laut", "Dokumen Antara Selesai"] },
    { urutan: 4, nama: "Dokumen Final",
      pilihan: ["Belum", "Proses Penyusunan", "Proses Perbaikan Dokumen", "Telah Mendapatkan BA Konsultasi Publik II", "Dokumen Final Telah Selesai"] },
    { urutan: 5, nama: "Legal Drafting",
      pilihan: ["Belum", "Proses Legal Drafting", "Legal Drafting Telah Selesai"] },
    { urutan: 6, nama: "Pembahasan PAK",
      pilihan: ["Belum", "Proses Pembahasan PAK", "Telah mendapatkan BA Persetujuan Bersama"] },
    { urutan: 7, nama: "Harmonisasi",
      pilihan: ["Belum", "Proses Harmonisasi", "Telah mendapatkan Surat Selesai Harmonisasi"] },
    { urutan: 8, nama: "Penetapan Perpres",
      pilihan: ["Belum", "Proses Penyusunan RPerpres", "Telah Terbit Perpres"] },
  ],

  'RTR KSN': [
    { urutan: 1,  nama: "Dokumen Awal",
      pilihan: ["Belum", "Proses Persiapan", "Proses Pengumpulan & Pengolahan Data", "Dokumen Awal Selesai"] },
    { urutan: 2,  nama: "Dokumen Antara",
      pilihan: ["Belum", "Proses Perbaikan Dokumen", "Telah mendapatkan BA Konsultasi Publik I", "Dokumen Antara Selesai"] },
    { urutan: 3,  nama: "Dokumen Final",
      pilihan: ["Belum", "Proses Perbaikan Dokumen", "Telah Mendapatkan BA Konsultasi Publik II", "Dokumen final Matek Ruang Perairan Selesai"] },
    { urutan: 4,  nama: "Konsepsi Matek Ruang Perairan",
      pilihan: ["Belum", "Surat telah di-TTD Dirjen"] },
    { urutan: 5,  nama: "Persiapan Penyusunan",
      pilihan: ["Belum", "Telah terbit SK Tim Penyusun & Kajian Awal"] },
    { urutan: 6,  nama: "Pengumpulan Data & Informasi",
      pilihan: ["Belum", "Proses Pengumpulan Data & Informasi", "Data & Informasi Telah Selesai"] },
    { urutan: 7,  nama: "Pengolahan Data dan Analisis",
      pilihan: ["Belum", "Telah terbit Buku Faknal"] },
    { urutan: 8,  nama: "Konsepsi Matek Ruang Darat",
      pilihan: ["Belum", "Proses Perumusan", "Buku Rencana dan Album Peta Sudah Selesai"] },
    { urutan: 9,  nama: "Integrasi Muatan Materi Teknis",
      pilihan: ["Belum", "Proses Integrasi", "Telah mendapatkan BA Integrasi"] },
    { urutan: 10, nama: "Persub",
      pilihan: ["Belum", "Proses Persub", "Telah mendapatkan Surat Persetujuan Substansi"] },
    { urutan: 10, nama: "Persetujuan Substansi",
      pilihan: ["Belum", "Proses Persub", "Telah mendapatkan Surat Persetujuan Substansi"] },
    { urutan: 11, nama: "PAK",
      pilihan: ["Belum", "Proses Rapat PAK", "Telah mendapatkan BA Persetujuan Bersama"] },
    { urutan: 11, nama: "Rapat PAK",
      pilihan: ["Belum", "Proses Rapat PAK", "Telah mendapatkan BA Persetujuan Bersama"] },
    { urutan: 12, nama: "Harmonisasi",
      pilihan: ["Belum", "Proses Harmonisasi", "Telah mendapatkan Surat Selesai Harmonisasi"] },
    { urutan: 13, nama: "Permohonan Paraf K/L",
      pilihan: ["Belum", "Proses Permohonan Paraf K/L", "Telah mendapatkan Paraf K/L"] },
    { urutan: 13, nama: "Peromohonan Paraf K/L",
      pilihan: ["Belum", "Proses Permohonan Paraf K/L", "Telah mendapatkan Paraf K/L"] },
    { urutan: 14, nama: "Penetapan Perpres",
      pilihan: ["Belum", "Telah Terbit Perpres"] },
  ],

  // RTRWN — sekarang 13 step setelah restrukturisasi (8 sub-step + 5 step lanjutan)
  RTRWN: [
    { urutan: 1, nama: "Persiapan Penyusunan Matek RTRL",
      pilihan: ["Belum", "Proses Peyusunan", "Kerangka Acuan Kerja dan metodologi Telah Selesai"] },
    { urutan: 2, nama: "Pengumpulan Data & Informasi Matek RTRL",
      pilihan: ["Belum", "Proses Pengumpulan Data & Informasi", "Data & Infromasi Telah Selesai"] },
    { urutan: 3, nama: "Pengolahan Data dan Analisis Matek RTRL",
      pilihan: ["Belum", "Proses Pengolahan dan Analisis", "Pengolahan dan Analisis Selesai"] },
    { urutan: 4, nama: "Konsepsi Matek Ruang Laut Matek RTRL",
      pilihan: ["Belum", "Proses Perumusan", "Buku Rencana dan Album Peta Sudah Selesai", "Telah Mendapatkan Persetujuan Teknis"] },
    { urutan: 5, nama: "Persiapan Penyusunan Matek RTRWN",
      pilihan: ["Belum", "Proses Peyusunan", "Kerangka Acuan Kerja dan metodologi Telah Selesai"] },
    { urutan: 6, nama: "Pengumpulan Data & Informasi Matek RTRWN",
      pilihan: ["Belum", "Proses Pengumpulan Data & Informasi", "Data & Infromasi Telah Selesai"] },
    { urutan: 7, nama: "Pengolahan Data dan Analisis Matek RTRWN",
      pilihan: ["Belum", "Proses Pengolahan dan Analisis", "Pengolahan dan Analisis Selesai"] },
    { urutan: 8, nama: "Konsepsi Matek Ruang Darat Matek RTRWN",
      pilihan: ["Belum", "Proses Perumusan", "Buku Rencana dan Album Peta Sudah Selesai"] },
    { urutan: 9, nama: "Integrasi Muatan Materi Teknis",
      pilihan: ["Belum", "Proses Integrasi", "Telah mendapatkan BA Integrasi"] },
    { urutan: 10, nama: "Sinkronisasi Muatan RTRWN",
      pilihan: ["Belum", "Proses sinkronisasi", "Telah mendapatkan BA Kesepakatan"] },
    { urutan: 11, nama: "Penyusunan RPP RTRWN",
      pilihan: ["Belum", "Proses penyusunan", "Telah terbit RPP RTRWN"] },
    { urutan: 12, nama: "Penyusunan Dokumen KLHS",
      pilihan: ["Belum", "Proses penyusunan dokumen KLHS", "Telah mendapatkan validasi KLHS"] },
    { urutan: 13, nama: "Penetapan Peraturan Pemerintah",
      pilihan: ["Belum", "Proses penyusunan", "Telah terbit PP RTRWN"] },
  ],

}

export function getPilihan(kategori, namaTahapan) {
  const steps = PILIHAN_STEPS[kategori] || []
  const step = steps.find(s => s.nama === namaTahapan)
  return step ? step.pilihan : ["Belum"]
}

export function getTahapan(kategori) {
  return (PILIHAN_STEPS[kategori] || []).sort((a, b) => a.urutan - b.urutan)
}