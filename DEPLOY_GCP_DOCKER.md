# Deploy on GCP VM with Docker Compose (Production)

This project is prepared to run in production on a Google Compute Engine VM using Docker only.

## 1) Create a VM

Use Ubuntu 22.04 (or Debian) VM and open firewall for HTTP/HTTPS/SSH:
- TCP 22
- TCP 80
- TCP 443 (optional for SSL)

## 2) Connect to VM and install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release; echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 3) Clone project

```bash
git clone <YOUR_REPO_URL>
cd ngafa.ma
```

## 4) Create production env file

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Update at minimum:
- `SECRET_KEY`
- `POSTGRES_PASSWORD`
- `ALLOWED_HOSTS` (VM IP and/or domain)
- `CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`

## 5) Build and run production stack

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## 6) Check status and logs

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f frontend
```

## 7) Create Django admin user

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 8) Access app

- Frontend: `http://YOUR_VM_IP`
- Admin: `http://YOUR_VM_IP/admin/`
- API: `http://YOUR_VM_IP/api/`

## 9) Update deployment after new code

```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## 10) Backup PostgreSQL database

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T db sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```

## 11) Stop/start stack

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml stop
docker compose --env-file .env.prod -f docker-compose.prod.yml start
```

## 12) Optional: enable HTTPS with Nginx + Certbot on host

If you use a domain, install certbot on VM and terminate TLS on host Nginx, then proxy to `localhost:80` (Docker frontend).
