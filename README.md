# WorkFlowHub

A minimal full-stack workflow app used to demonstrate CI/CD for SOFT806 Assignment 1 (Task 2).

- **Backend:** Django REST Framework (`backend/`): registration, login, logout, and full CRUD for workflow items
- **Frontend:** React + Vite (`frontend/`): login/register, create, edit, change status, filter, and delete items
- **Containers:** one Dockerfile per tier, plus `docker-compose.yml`
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) and CircleCI (`.circleci/config.yml`)

## Project structure

```
workflowhub/
├── backend/                  Django REST Framework API
│   ├── config/               settings (env vars), urls, wsgi
│   ├── workflows/            models, serializers, views, urls, tests, migrations
│   ├── requirements.txt      pip dependencies
│   ├── .env.example
│   └── Dockerfile
├── frontend/                 React app (Vite)
│   ├── src/                  App.jsx, api.js, styles.css
│   ├── package.json          npm dependencies (+ package-lock.json)
│   ├── .env.example
│   ├── nginx.conf
│   └── Dockerfile            multi-stage: npm ci + build -> nginx
├── docker-compose.yml
├── .github/workflows/ci.yml  GitHub Actions pipeline
└── .circleci/config.yml      CircleCI pipeline
```

## API endpoints

All endpoints are under `/api/`. Every endpoint except register, login and health needs the header `Authorization: Token <token>`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/` | Health check (used by CI smoke test) |
| POST | `/api/auth/register/` | Create an account: `{username, email, password}` |
| POST | `/api/auth/login/` | Returns `{token, username}` |
| POST | `/api/auth/logout/` | Deletes the caller's token |
| GET | `/api/workflows/` | List your items (optional `?status=pending\|in_progress\|completed`) |
| POST | `/api/workflows/` | Create `{title, description}` (status defaults to `pending`) |
| GET | `/api/workflows/{id}/` | Retrieve one item |
| PUT/PATCH | `/api/workflows/{id}/` | Edit title/description or change status |
| DELETE | `/api/workflows/{id}/` | Delete an item |

Users can only see and change their own items.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | backend | Django secret key (**set as a secret in CI**) |
| `DJANGO_DEBUG` | backend | `True` for local development only |
| `DJANGO_ALLOWED_HOSTS` | backend | Comma-separated host names |
| `CORS_ALLOWED_ORIGINS` | backend | Frontend origins allowed to call the API |
| `VITE_API_URL` | frontend (build time) | Base URL of the API, e.g. `http://localhost:8000/api` |

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env` for local (non-Docker) development. `.env` files are git-ignored.

## Run with Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000/api/

Stop with `docker compose down`. Add `-v` to also delete the database volume.

Build the images individually (useful for screenshots of the build evidence):

```bash
docker build -t workflowhub-backend ./backend
docker build -t workflowhub-frontend --build-arg VITE_API_URL=http://localhost:8000/api ./frontend
```

## Run without Docker

```bash
# backend
cd backend
python -m venv venv && venv\Scripts\activate      # Windows (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py runserver

# frontend (new terminal)
cd frontend
npm ci
npm run dev                                       # http://localhost:5173
```

## CI pipelines

**GitHub Actions** runs on every push and on pull requests to `main`:
1. Backend job: install with pip (cached), run Django tests, build the backend image with Buildx (layer cache in GitHub cache), then start the container and smoke-test `/api/health/`.
2. Frontend job: build the frontend image (multi-stage `npm ci` + `vite build`) with `VITE_API_URL` passed as a build argument.

Optional: add `DJANGO_SECRET_KEY` under *Settings → Secrets and variables → Actions → Secrets* and `VITE_API_URL` under *Variables*. The pipeline falls back to CI-only defaults if they are missing.

**CircleCI** runs the same two jobs in parallel. It uses the `cimg/python` and `cimg/base` Docker executors, and `setup_remote_docker` for `docker build`. To enable it, log in to circleci.com with GitHub, choose *Projects → Set Up Project*, and select this repository (it uses `.circleci/config.yml`). Optional secrets go in *Project Settings → Environment Variables*.

## Task 2 checklist (things you do on GitHub)

1. **Create the repository** on GitHub and push this code. Protect `main` in *Settings → Branches*: require a pull request, 1 approval, and the CI status checks.
2. **Kanban board**: *Projects → New project → Board*, with columns **Backlog, To Do, In Progress, In Review, Done**.
3. **Issues**: create one issue per user story from the Task 1 backlog (US-01 … US-22) and add them to the board.
4. **Feature branches + PRs**: for each story, create a branch (e.g. `feature/US-06-create-item`), commit, push, and open a PR to `main`. Move the issue to *In Review*, add a review comment, approve, merge, and move it to *Done*. A classmate can review your work, or you can add a collaborator.
5. **Commit incrementally** (suggested order): repo setup → Django project + settings → models/migrations → auth endpoints → workflow CRUD + tests → React app → API integration → Dockerfiles → docker-compose → GitHub Actions → CircleCI → README.
6. **Screenshots** (labelled, in order, in a Word document): Kanban board at different stages, branches list, PRs with comments/approvals, commit history, local `docker build` output, GitHub Actions successful runs, CircleCI successful runs.
7. **Submission**: `Assignment1-Evidence-YourName.zip` containing the Word document of screenshots and a `.txt` file with the repository link.
