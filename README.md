# Ishxona Boshqaruv Tizimi

## Ishga tushirish

### 1. Node.js o'rnatish
https://nodejs.org/en/download saytidan LTS versiyasini yuklab o'rnating.

### 2. Loyihani ishga tushirish
`start.bat` faylini ikki marta bosing — avtomatik o'rnatib ishga tushiradi.

Yoki qo'lda:
```
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### 3. Brauzerda oching
http://localhost:3000

**Login:** admin  
**Parol:** admin123

---

## Imkoniyatlar
- ✅ Ishchilar ro'yxati (foto, shaxsiy ma'lumotlar)
- ✅ Davomat jadvali (oylik, kunlik)
- ✅ Maosh avtomatik hisoblash
- ✅ Bonus va jarima qo'shish
- ✅ Dashboard - umumiy statistika
- ✅ Grafiklar

## Loyiha tuzilmasi
```
kiro/
├── backend/          ← Node.js + Express + SQLite
│   ├── routes/       ← API marshrutlar
│   ├── middleware/   ← JWT autentifikatsiya
│   ├── database.js   ← Ma'lumotlar bazasi
│   └── server.js     ← Asosiy server
├── frontend/         ← React + Vite + Tailwind
│   └── src/
│       ├── pages/    ← Sahifalar
│       └── components/
└── start.bat         ← Ishga tushirish
```
