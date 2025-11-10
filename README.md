# Room Planner Frontend

Ez a repository a "Room Planner" alkalmazás Angularral készített frontend kliensét tartalmazza. Ez a felhasználói felület felelős az adatok vizuális megjelenítéséért és a felhasználói interakciók kezeléséért.

## Technológiák

- **Framework:** [Angular](https://angular.io/)
- **Nyelv:** TypeScript
- **Fejlesztői proxy:** Nginx (Docker segítségével), ami egységesíti a backend és a frontend szolgáltatások elérését.

## Előfeltételek

A projekt futtatásához az alábbi eszközök szükségesek:

- [Node.js](https://nodejs.org/) (LTS verzió javasolt) és npm
- [Angular CLI](https://angular.io/cli) globálisan telepítve: `npm install -g @angular/cli`
- [Docker](https://www.docker.com/products/docker-desktop/) és Docker Compose
- [rp-database](https://github.com/kvilmos/rp-database)
- [rp-backend](https://github.com/kvilmos/rp-backend)

## Telepítés és Futtatás

Kövesd az alábbi lépéseket a fejlesztői környezet elindításához.

### 1. Backend és adatbázis elindítása

Győződj meg róla, hogy az `rp-database` és `rp-backend` repositorykban leírtak szerint minden háttérszolgáltatás el van indítva és fut. A frontend nem fog tudni működni a háttér API-k nélkül.

- [rp-database](https://github.com/kvilmos/rp-database)
- [rp-backend](https://github.com/kvilmos/rp-backend)

### 2. Frontend függőségek telepítése

Nyiss egy terminált a projekt gyökérkönyvtárában (`rp-frontend`), és telepítsd a szükséges Node.js csomagokat:

```bash
npm install
```

### 3. Fejlesztői Proxy indítása

A frontend egy Nginx proxyt használ, hogy a backend API és MinIO kéréseket egyszerűen, CORS hibák nélkül kezelje.

1.  Lépj be a `dev-proxy` könyvtárba:
    ```bash
    cd dev-proxy
    ```
2.  Indítsd el az Nginx konténert a háttérben:
    ```bash
    docker-compose up -d
    ```

Ez elindít egy Nginx szervert a `80`-as porton. Az `nginx.conf` fájl alapján a bejövő kéréseket a megfelelő helyre irányítja:

- A sima frontend (`/`) kéréseket továbbítja az Angular fejlesztői szerver felé (`localhost:4200`).
- Az `/api/` végpontra érkező kéréseket továbbítja a Go backend felé (`localhost:4747`).
- Az `/minio/` végpontra érkező kéréseket továbbítja a MinIO szerver felé (`localhost:9000`).

### 4. Angular fejlesztői szerver indítása

Most, hogy a proxy fut, elindíthatod magát az Angular alkalmazást.

1.  Lépj vissza a projekt gyökérkönyvtárába.
2.  Indítsd el az `ng serve` parancsot:
    ```bash
    ng serve --host 0.0.0.0
    ```

### 5. Alkalmazás megnyitása

A fejlesztői szerver elindulása után az alkalmazást a böngésződben a **proxy címen** keresztül éred el:

**http://localhost**

Fontos, hogy ne a `http://localhost:4200`-as címet használd közvetlenül, mert akkor a backend API hívások CORS hibát fognak dobni. A `localhost` (80-as port) címen keresztül az Nginx proxy gondoskodik a kérések helyes továbbításáról.

---

## Hasznos parancsok

- **Függőségek telepítése:** `npm install`
- **Fejlesztői szerver indítása:** `ng serve`
- **Build a production környezethez:** `ng build`
- **Unit tesztek futtatása:** `ng test`
- **Proxy leállítása:** A `dev-proxy` mappában futtasd: `docker-compose down`
