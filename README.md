# 🎼 SKRID (frontend)

SKRID Platform is a web-based interface for querying and exploring musical patterns stored in a graph database. This repository contains only the **frontend** of the platform.

The **backend** (query compilation, result processing, etc.) is maintained in a separate repository:
➡️ [SKRID Backend Repository](https://gitlab.inria.fr/skrid/backend)

The **client** (vueJS implementation of the interface) is maintained in a separate repository:
➡️ [SKRID Client Repository](https://gitlab.inria.fr/skrid/client)

---

## ✨ Features
- Communication with a Python backend via REST endpoints
- Interface for melodic and rhythmic search via interactive piano interface input
- Flexible contour search
- Display of musical score collection

---

## 📁 Code Structure
```text
.
├── assets/
│   ├── README.md           # Overview of generated asset folders
│   ├── client/             # (generated) Vue client Git clone (install_client.sh)
│   ├── data/               # (generated) Musical dataset repository (install_data.sh)
│   └── vuejs/              # (generated) Built client bundle served by Express
├── CHANGELOG.md
├── Dockerfile
├── index.js                # Entry point that boots the Express app
├── install_client.sh       # Fetches and builds the Vue client bundle
├── install_data.sh         # Fetches the musical dataset and derived assets
├── jsdoc.json              # JSDoc config
├── LICENSE.md
├── package.json            # npm dependencies
├── README.md
├── src/
│   └── server/
│       ├── config.js       # Environment-driven configuration
│       ├── index.js        # createApp factory that wires the server together
│       ├── logger.js       # Timestamped logging with log-level filtering
│       ├── middleware.js   # Shared middleware and centralised error handling
│       └── router.js       # API routes and static asset delivery
├── tests/
│   ├── helpers/            # Shared test utilities
│   ├── installers/         # Installer script smoke tests
│   └── integration/        # Express integration tests
├── TODO.md
└── uploads/                # Temporary storage for uploaded audio files
```

---

## 🚀 Production setup
Follow these instructions to deploy the SKRID frontend.

### 1. Clone the repository
```bash
git clone --depth=1 https://gitlab.inria.fr/skrid/frontend.git
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create the `.env` file
Copy the example `.env` file and adjust the values:
```bash
cp .env.example .env
```

### 4. Authenticate with GitLab
The asset installers clone private repositories from `gitlab.inria.fr`:

- [`skrid/data`](https://gitlab.inria.fr/skrid/data) (musical collections)
- [`skrid/client`](https://gitlab.inria.fr/skrid/client) (Vue.js frontend)

Make sure your Git configuration can authenticate against GitLab before running the scripts:

1. Request access to the projects (membership is required).
2. Create a personal access token with the **`read_repository`** scope.
3. Configure your environment so `git` can use those credentials (e.g. `git config credential.helper store`, or set `GIT_ASKPASS` / `GIT_TERMINAL_PROMPT=1`).

Without credentials (or if outbound network access is blocked) the clone step fails with HTTP 403 and the asset folders remain empty. In CI you can provide credentials through environment variables or a deploy key.

### 5. Install the data
To get the MEI files needed to display the previews, run the script `install_data.sh`:
```bash
./install_data.sh
```

The script populates `assets/data/` by cloning the GitLab repository and running its `Makefile`. Use `./install_data.sh --verify` to confirm the required tooling (`git`, `python3`, `make`) is available before cloning.

### 6. Install the vueJS client
Run the script `install_client.sh`:
```bash
./install_client.sh
```

This clones `assets/client/`, builds the Vue.js application, and copies the compiled bundle into `assets/vuejs/`. The directory is cleared on every run so the generated files always match the latest build.

### 7. Start the frontend API server
```bash
node index.js
```

The website will be available at [`localhost:3000`](http://localhost:3000).

---

## 🚀 Development setup
Follow these instructions to develop or debug the platform.

### 1. Clone the repository
```bash
git clone https://gitlab.inria.fr/skrid/frontend.git
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create the `.env` file
Copy the example `.env` file and adjust the values:
```bash
cp .env.example .env
```

### 4. Authenticate with GitLab
Access to the private `skrid/data` and `skrid/client` repositories is still required in development. Follow the steps in the production section to ensure `git` can read from GitLab before continuing.

### 5. Install the data
To get the MEI files needed to display the previews, run the script `install_data.sh`:
```bash
./install_data.sh
```

The script creates `assets/data/` and generates the derived formats by running the repository's `Makefile`.

### 6. Start the frontend API server
```bash
node index.js
```

Or, for development (auto-restart on edit):
```
npm run nodemon
```

To see the website, launch the [vueJS client](https://gitlab.inria.fr/skrid/client) (after cloning/building it through `install_client.sh`).

### ✅ Testing

The project uses Node's built-in test runner with an Express harness to exercise the proxy routes and smoke-test the installer scripts.

Run the full suite locally:

```bash
npm test
```

In CI, run the same command after installing dependencies. The suite spins up a mock backend, so no external services are required.

---

## 🐞 Backend Dependency
This frontend communicates with the backend via REST API calls. The backend must be installed and running separately.

By default, the frontend expects the backend to be available at `http://localhost:5000`.

> Endpoint URLs, port, logging level, and CORS behaviour are now configured through environment variables in `src/server/config.js`.

### 🔧 Configuration overview

The server reads configuration from the environment (see `.env`):

- `API_BASE_URL`: URL of the Python backend (default: `http://localhost:5000`).
- `PORT`: Port exposed by the Node.js server (default: `3000`).
- `NODE_ENV`: Controls production behaviour. When set to `production`, CORS is disabled and logging defaults to `warn`.
- `ENABLE_CORS`: Force-enable CORS in production if required (`true` / `false`).
- `LOG_LEVEL`: One of `error`, `warn`, `info`, or `debug` to fine-tune console output.

---

## 📄 Documentation
Generate developer documentation with:
```bash
npm run generate-docs
```
Open `docs/index.html` in your browser.

---

## 💡 Development Notes
- If you edit files in `src/server`, restart the server to apply changes (or use `nodemon`).

For database setup and ingestion scripts, see the backend project.

- cors package was install for development, but it should not be used in production. It is needed for development in order to connect the vueJS client development server to the frontend server.

---

## 🖊️ Roadmap, Known Bugs & Tasks
See [TODO.md](TODO.md) for planned features and known issues.

---

## License

This project is distributed under the MIT License.  
See [LICENSE](./LICENSE) for details.  
(Copyright © 2023–2025 IRISA)
