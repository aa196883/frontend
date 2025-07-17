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
│   ├── acoustic_grand_piano/ # Sounds for piano keys
│   ├── data/                 # Musical data used by the app
│   ├── public/               # Images and static assets
│   ├── scripts/              # Client-side JS
│   └── styles/               # CSS files
├── docs/                     # Documentation (when generated)
├── config/                   # Neo4j configuration (legacy)
├── views/                    # HTML files
│
├── index.js                  # Main entry point (Node.js server)
├── jsdoc.json                # JSDoc config
├── package.json              # npm dependencies
├── loadAllDB.sh              # Load data into Neo4j
├── README.md
└── TODO.md
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

### 4. Install the vueJS client
Run the script `install_client.sh`:
```bash
./install_client.sh
```

<!-- TODO: install the data (mei files, ...) -->

This will clone the `client` repository, build it, and place the files to the right place.

### 5. Start the frontend API server
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

### 4. Start the frontend API server
```bash
node index.js
```

Or, for development (auto-restart on edit):
```
npm run nodemon
```

To see the website, launch the [vueJS client](https://gitlab.inria.fr/skrid/client)

---

## 🐞 Backend Dependency
This frontend communicates with the backend via REST API calls. The backend must be installed and running separately.

By default, the frontend expects the backend to be available at `http://localhost:5000`.

> Endpoint URLs and port can be configured in `index.js`

---

## 📄 Documentation
Generate developer documentation with:
```bash
npm run generate-docs
```
Open `docs/index.html` in your browser.

---

## 💡 Development Notes
- If you edit `index.js`, restart the server to apply changes (or use `nodemon`).

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
