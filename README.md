# ATP 16363 - Android App

Мобільний застосунок для керування маршрутами та транспортом ATP 16363.

---

# 📱 Інструкція по оновленню застосунку

## 🔄 Повний цикл випуску нової версії

### Крок 1: Підготовка нової версії

#### 1.1 Оновлення номера версії у файлах

**Файл: `config.js`** (рядок 2)
```javascript
const appVersion = '1.2.4'; // Змінити на нову версію
```

**Файл: `screens/MainScreen.js`** (рядок ~85)
```javascript
<Text style={styles.versionText}>Версія 1.2.4</Text>
```

**Файл: `app.json`** (рядки 5 та 34)
```json
{
  "expo": {
    "version": "1.2.4",        // Рядок 5
    "android": {
      "versionCode": 14,       // Рядок 34 - ЗБІЛЬШИТИ на 1
    }
  }
}
```

**Правило версій:**
- `version` - текстова версія (1.2.4, 1.3.0, 2.0.0 і т.д.)
- `versionCode` - числова версія (завжди збільшувати на 1: 13→14→15...)

---

### Крок 2: Git операції

```bash
# Додати всі зміни
git add .

# Створити коміт з описом
git commit -m "Версія 1.2.4: опис змін"

# Відправити на GitHub
git push origin main
```

---

### Крок 3: Білд через EAS

```bash
# Запустити білд для Android (preview профіль)
eas build --platform android --profile preview
```

**Очікувати:**
- Білд запуститься у фоні
- Час очікування: 5-15 хвилин (залежить від черги)
- Результат: Build URL на expo.dev

**Приклад Build URL:**
```
https://expo.dev/accounts/yurecpr/projects/atp16363/builds/[BUILD_ID]
```

**Перевірка статусу:**
Відкрити URL у браузері і дочекатися статусу **"Finished"**

---

### Крок 4: Завантаження APK

#### 4.1 З сайту Expo:
1. Відкрити Build URL
2. Натиснути кнопку **"Download"**
3. Зберегти як: `atp_app_v1.2.4.apk`

#### 4.2 Перевірка файлу:
- Розмір: ~60-80 MB
- Тип: APK (Android Package)

---

### Крок 5: Розміщення APK на сервері

#### 5.1 Підключення до сервера:
```bash
ssh root@5.154.181.113
# або
ssh root@630393-vds-atp16363.tech.gmhost.pp.ua
```

#### 5.2 Знайти директорію сервера:
```bash
# Пошук каталогу з APK
find / -name "atp_app.apk" 2>/dev/null

# Або перейти до статичних файлів сервера (приклад)
cd /root/atp_app_server/static/
# або
cd /var/www/atp_server/static/
```

#### 5.3 Завантаження APK на сервер:

**Варіант А: Через SCP (з локального ПК):**
```bash
scp atp_app_v1.2.4.apk root@5.154.181.113:/root/atp_app_server/static/atp_app.apk
```

**Варіант Б: Через FileZilla/WinSCP:**
- Host: `5.154.181.113`
- User: `root`
- Шлях: `/root/atp_app_server/static/`
- Перейменувати на: `atp_app.apk` (ТОЧНА назва!)

**Варіант В: Через wget на сервері:**
```bash
cd /root/atp_app_server/static/
wget -O atp_app.apk "https://expo.dev/artifacts/eas/[BUILD_ID]/application-[hash].apk"
```

#### 5.4 Перевірка доступності:
```bash
# На сервері
ls -lh /root/atp_app_server/static/atp_app.apk

# Перевірка через curl
curl -I https://630393-vds-atp16363.tech.gmhost.pp.ua:5001/atp_app.apk
```

**Очікуваний результат:**
```
HTTP/1.1 200 OK
Content-Type: application/vnd.android.package-archive
Content-Length: 64497047
```

---

### Крок 6: Оновлення версії в MongoDB

#### 6.1 Підключення до MongoDB:
```bash
# На сервері виконати:
mongosh 'mongodb://client:***@localhost:27017/atp16363'
```

#### 6.2 Перевірка поточної версії:
```javascript
db.appversions.findOne()
// Результат: { _id: ObjectId('...'), version: '1.2.3' }
```

#### 6.3 Оновлення версії:
```javascript
db.appversions.updateOne({}, {$set: {version: "1.2.4"}}, {upsert: true})
// Результат: { acknowledged: true, modifiedCount: 1 }
```

#### 6.4 Або одна команда (з терміналу):
```bash
mongosh 'mongodb://client:***@localhost:27017/atp16363' --eval 'db.appversions.updateOne({}, {$set: {version: "1.2.4"}}, {upsert: true})'
```

#### 6.5 Перевірка:
```bash
mongosh 'mongodb://client:***@localhost:27017/atp16363' --eval 'db.appversions.findOne()'
```

---

### Крок 7: Інформування водіїв

#### 7.1 Підготувати повідомлення:

```
🚨 Оновлення застосунку ATP до версії 1.2.4

📲 Завантажте та встановіть оновлення:
https://630393-vds-atp16363.tech.gmhost.pp.ua:5001/atp_app.apk

Просто відкрийте файл після завантаження і натисніть "Оновити"

🆕 Що нового:
- [Опис змін]
- [Опис змін]
```

#### 7.2 Канали розсилки:
- Telegram група
- Viber група
- Email розсилка
- Або прикріпити APK файл до повідомлення

---

## 📍 Важливі дані

### Сервер:
- **IP:** `5.154.181.113`
- **Domain:** `630393-vds-atp16363.tech.gmhost.pp.ua`
- **Port:** `5001`
- **User:** `root`

### MongoDB:
- **Host:** `localhost:27017` (на сервері)
- **Database:** `atp16363`
- **User:** `client`
- **Password:** `***`
- **Collection:** `appversions` (поле `version`)

### APK:
- **Шлях на сервері:** `/root/atp_app_server/static/atp_app.apk`
- **URL для завантаження:** `https://630393-vds-atp16363.tech.gmhost.pp.ua:5001/atp_app.apk`
- **Назва файлу:** `atp_app.apk` (ТОЧНА!)

### Git:
- **Repo:** `https://github.com/yurecpr/ATP_Anroid.git`
- **Branch:** `main`

### Package:
- **ID:** `com.vladositto.atp16363`

---

## ✅ Чеклист оновлення

- [ ] Змінити версію у `config.js`
- [ ] Змінити версію у `screens/MainScreen.js`
- [ ] Змінити `version` та `versionCode` у `app.json`
- [ ] `git add .`
- [ ] `git commit -m "Версія X.X.X: опис"`
- [ ] `git push origin main`
- [ ] `eas build --platform android --profile preview`
- [ ] Дочекатися завершення білду
- [ ] Завантажити APK з Expo
- [ ] Завантажити APK на сервер як `atp_app.apk`
- [ ] Перевірити доступність `curl -I https://.../.../atp_app.apk`
- [ ] Оновити версію в MongoDB `db.appversions.updateOne(...)`
- [ ] Перевірити версію в БД `db.appversions.findOne()`
- [ ] Розіслати повідомлення водіям

---

## 🚨 Troubleshooting

### APK не завантажується (404):
```bash
# Перевірити чи файл існує
ls -lh /root/atp_app_server/static/atp_app.apk

# Перевірити права доступу
chmod 644 /root/atp_app_server/static/atp_app.apk
```

### Версія в БД не оновлюється:
```bash
# Перевірити підключення
mongosh 'mongodb://client:***@localhost:27017/atp16363' --eval 'db.runCommand({ping: 1})'

# Створити запис якщо його немає
mongosh 'mongodb://client:***@localhost:27017/atp16363' --eval 'db.appversions.insertOne({version: "1.2.4"})'
```

### Користувачі не бачать оновлення:
- Перевірити версію в БД
- Перевірити версію в `config.js`
- Переконатись що версії РІЗНІ (1.2.3 ≠ 1.2.4)

### Play Market відкривається замість завантаження:
- Це старі версії додатку (до 1.2.2b)
- Водіям потрібно встановити APK з повідомлення вручну

---

## 📚 Історія версій

| Версія | versionCode | Дата | Зміни |
|--------|------------|------|-------|
| 1.0.8  | 9          | -    | Базова версія |
| 1.2.0  | 10         | -    | route_id, номери машин, прізвища |
| 1.2.1  | 11         | -    | Виправлення підрахунку пробігу |
| 1.2.2b | 12         | -    | Тестування автооновлення (Brem) |
| 1.2.3  | 13         | 17.02.2026 | Автооновлення для всіх + форми |

---

**Остання оновлення:** 17 лютого 2026
