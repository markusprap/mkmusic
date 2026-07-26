# Perjanjian Kerja — Claude Code di Repo Ini

Disepakati di awal project (2026-07-25), berlaku untuk seluruh sesi kerja di repo ini:

- **Tooling utama:** `agent-skills` (alur: spec → plan → tasks → implement) dipakai sebagai skill utama untuk breakdown & eksekusi kerja.
- **Gaya coding:** `ponytail` (lazy-coding — solusi paling sederhana yang benar, tanpa abstraksi/boilerplate yang tidak diminta) dipakai di semua sesi, semua level.
- **`superpowers`** hanya dipakai kalau memang dibutuhkan untuk task spesifik (mis. debugging sistematis, brainstorming terstruktur) — bukan default di setiap task.
- **Sebelum commit atau push:** jalankan `ponytail-review` terhadap setiap file yang diubah atau dibuat pada sesi itu (bukan seluruh repo — itu `ponytail-audit`, dipakai terpisah kalau diminta). Terapkan temuan yang jelas benar (delete/stdlib/native/yagni/shrink) sebelum lanjut commit, supaya kode yang masuk selalu konsisten dengan prinsip ponytail.
