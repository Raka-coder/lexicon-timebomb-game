# Fase 3: Validasi KBBI - Walkthrough

## Status: ✅ COMPLETE

## Dataset

| Source | Records | Format |
|--------|---------|--------|
| [Definisi/kbbi](https://github.com/Definisi/kbbi) | **194,665 kata** | JSON → TXT |

## Files Created

### Backend
| File | Deskripsi |
|------|-----------|
| `backend/src/data/kbbi-words.txt` | Dataset offline (~2.2MB) |
| `backend/src/dictionary/words.ts` | Dictionary module |
| `backend/src/routes/dictionary.ts` | REST API |
| `backend/index.ts` | Updated with KBBI validation |

### Dataset Download Process
```bash
# 1. Download JSON (43.9MB)
curl -L -o kbbi_v6_data.json "https://raw.githubusercontent.com/Definisi/kbbi/master/kbbi_v6_data.json"

# 2. Extract words
node -e "
const data = require('./kbbi_v6_data.json');
const words = [...new Set(data.map(d => d.kata.toLowerCase()))];
require('fs').writeFileSync('kbbi-words.txt', words.join('\n'));
"
# Output: 194,665 unique words → kbbi-words.txt (2.2MB)
```

## API Endpoints

### GET /api/health
```bash
curl http://localhost:3001/api/health
```
Response:
```json
{
  "status": "ok",
  "wordCount": 194665,
  "timestamp": "2026-04-30T13:58:29.984Z"
}
```

### GET /api/dictionary/check/:word
```bash
# Valid word
curl http://localhost:3001/api/dictionary/check/rumah
# Response: { "word": "rumah", "valid": true, "source": "offline" }

# Invalid word
curl http://localhost:3001/api/dictionary/check/xyzabc
# Response: { "word": "xyzabc", "valid": false, "source": "offline" }
```

## Socket Events Changes

### SUBMIT_WORD Flow (with KBBI)
```
Client sends: SUBMIT_WORD { word: "kucing" }
    ↓
Server checks:
  1. Is it player's turn? → YES
  2. Word length >= 3? → YES
  3. First letter matches required? → YES
  4. Word not used before? → YES
  5. Word in KBBI dataset? → YES (offline)
    ↓
Server emits: WORD_VALID { word, playerId, scores, nextLetter }
    ↓
Next player's timer starts
```

### Word Validation Logic
```typescript
// Layer 1: Local validation (instant)
validateWordLogic(word, requiredLetter, wordHistory)
// Checks: length >= 3, correct first letter, not duplicate

// Layer 2: KBBI validation (instant - offline)
validateWord(word)
// Checks: word exists in kbbi-words.txt (194,665 words)
```

### Error Messages
| Reason | Message |
|--------|---------|
| `not_your_turn` | "Belum giliranmu!" |
| `too_short` | "Kata minimal 3 huruf" |
| `wrong_start_letter` | "Kata harus dimulai dengan huruf X" |
| `duplicate_word` | "Kata sudah digunakan" |
| `not_in_dictionary` | "Kata 'X' tidak ditemukan di KBBI" |

## Start Word (Random from KBBI)

```typescript
// Di getRandomStartWord():
const candidates = wordSet.filter(w => 
  w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w)
);
return random from candidates;
```

Semua kata awal sekarang dipilih secara **random** dari dataset KBBI (194k kata), bukan lagi hardcoded.

## Performance

| Metric | Value |
|--------|-------|
| Dataset size | 194,665 kata |
| Memory usage | ~2.2MB (txt) + ~1MB (Set) |
| Lookup time | O(1) - instant |
| Server startup | ~1-2 seconds |

## Pengujian

### 1. Test API
```bash
# Health check - harus ada wordCount
curl http://localhost:3001/api/health
# Expected: wordCount > 190000

# Dictionary check - valid word
curl http://localhost:3001/api/dictionary/check/rumah
# Expected: valid: true

# Dictionary check - invalid word  
curl http://localhost:3001/api/dictionary/check/xyzabc
# Expected: valid: false
```

### 2. Test Game
1. Buat room & join (2 players)
2. Klik "Mulai Game"
3. Perhatikan kata awal (random dari KBBI)
4. Kirim kata valid KBBI → accepted
5. Kirim kata tidak ada di KBBI → rejected dengan "tidak ditemukan di KBBI"

### 3. Test Edge Cases
- Kata pendek (<3) → "Kata minimal 3 huruf"
- Huruf salah → "Kata harus dimulai dengan huruf X"
- Sudah dipakai → "Kata sudah digunakan"
- Tidak di KBBI → "Kata 'xxx' tidak ditemukan di KBBI"

## Comparison: Before vs After

| Aspect | Fase 2 (Hardcoded) | Fase 3 (KBBI) |
|--------|-------------------|---------------|
| Start words | 10 words hardcoded | ~194k words random |
| Validation | Lokal saja | Lokal + KBBI |
| Error message | Basic | "tidak ditemukan di KBBI" |
| Dataset | None | 194,665 words |

## Notes
- **Offline-only approach** - tidak menggunakan API fallback (lebih cepat + reliable)
- Semua validasi sekarang menggunakan dataset offline O(1)
- KBBI API (kbbi.raf555.dev) masih tersedia jika ingin diaktifkan di future