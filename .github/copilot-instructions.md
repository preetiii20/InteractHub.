# Copilot / AI agent instructions for InteractHub

This file gives targeted, discoverable facts an AI coding agent needs to be immediately productive in this repository.

## Big-picture architecture
- Frontend: a Create React App located in `frontend/` (see `frontend/package.json`). It is a single-page React client using `axios`, `@stomp/stompjs` and `sockjs-client` for WebSocket/STOMP connections.
- Backend: Spring Boot microservices under `backend-microservices/` with four main modules you should inspect:
  - `admin-service` (port 8081)
  - `manager` (port 8083)
  - `chat` (port 8085)
  - `notify` (port 8090)
  Each has a Maven wrapper (`mvnw` / `mvnw.cmd`) and a `pom.xml`.

## Service boundaries & data flows
- Frontend calls backend via REST base URLs configured in `frontend/src/config/api.js`. In development these map to `http://localhost:<port>/api/<service>`.
- Shared DB: all services use a MySQL database named `interacthub` by default (see `*/src/main/resources/application.properties`). Services rely on JPA (hibernate) with `spring.jpa.hibernate.ddl-auto=update` (dev-friendly).
- Real-time: chat uses WebSockets/STOMP. Frontend `websocketUrl` (in `api.js`) points to the chat service `/ws` endpoint. Libraries: `@stomp/stompjs`, `sockjs-client`.

## Auth and client conventions (critical)
- Token & user storage keys are centralized in `frontend/src/config/auth.js`:
  - TOKEN_KEY: `interacthub_token`
  - USER_KEY: `interacthub_user` (user object serialized)
  - getUserEmail() is marked CRITICAL in the codebase as the unique direct-message identifier — many features depend on user email being present.
- Auth endpoints (client-side): `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/verify` (see `authConfig` in `auth.js`).

## How to run locally (developer workflow)
- Start MySQL and ensure a database `interacthub` is available (default creds in properties: username `root`, password `root`). Prefer environment vars to override sensitive values.
- Run a backend service (Windows pwsh):

```powershell
cd backend-microservices\chat
$env:DB_URL = 'jdbc:mysql://localhost:3306/interacthub?useSSL=false&serverTimezone=UTC'
.\mvnw.cmd spring-boot:run
```

- Run the frontend (from `frontend/`):

```powershell
cd frontend
npm install
npm start
```

Notes:
- Each backend module has its own `application.properties` with `server.port` set; check and align ports with `frontend/src/config/api.js` if you change them.
- You can override service URLs using environment variables (properties already reference env placeholders, e.g. `${CHAT_SERVICE_URL:http://localhost:8085/api/chat}`).

## Build & tests
- Frontend: `npm run build`, `npm test` (see `frontend/README.md`).
- Backend: use the Maven wrapper in each service: `./mvnw spring-boot:run` (or `mvnw.cmd` on Windows) and `./mvnw test`.

## Integration points & patterns to look for
- Inter-service communication is configured in `application.properties` (e.g. `admin.service.url`, `chat.service.url` in `admin-service` and `manager`).
- File uploads are handled in `admin-service` (multipart size limits configured in `admin-service/src/main/resources/application.properties`).
- Logging: `admin-service` increases SQL/hibernate logging levels (useful when debugging SQL errors).

## Security & secrets (important)
- The repo currently includes SMTP credentials in `notify/src/main/resources/application.properties`. Treat this as sensitive — do not reuse or expose. When automating, prefer env vars and secret stores and ensure `.gitignore`/CI secrets are used.

## Quick inspection checklist (files to open first)
- `frontend/src/config/api.js` — maps client API URLs and websocket URL
- `frontend/src/config/auth.js` — token/user storage helpers (critical helper `getUserEmail`)
- `frontend/package.json` and `frontend/README.md` — client scripts
- `backend-microservices/*/src/main/resources/application.properties` — ports, DB, inter-service URLs
- `backend-microservices/*/pom.xml` — dependencies (Spring Boot, WebSocket, JPA)
- `backend-microservices/*/mvnw` & `mvnw.cmd` — use wrappers to run/build

## When making changes, prefer small, local tests
- For frontend UI changes, run `npm start` and watch the console for CORS / auth failures.
- For backend REST changes, run the single service and call endpoints with curl/Postman; use SQL logs in `admin-service` for debugging.

If anything in these instructions is unclear or you want me to expand on an integration pattern (for example: WebSocket message format, DTO shapes, or sample auth responses), tell me which area and I will iterate.
