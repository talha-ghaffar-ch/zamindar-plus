# EC2 Docker Deployment

This guide deploys Zamindar Plus on one EC2 instance with Docker Compose, Caddy HTTPS, AWS RDS PostgreSQL, Elastic IP, and `sslip.io`.

## 1. AWS Resources

Create these in the same AWS region:

- EC2 Ubuntu instance.
- Elastic IP associated with the EC2 instance.
- RDS PostgreSQL database.
- EC2 security group allowing inbound `22`, `80`, and `443`.
- RDS security group allowing PostgreSQL `5432` from the EC2 security group only.

The public host will be:

```text
YOUR_ELASTIC_IP.sslip.io
```

Example:

```text
43.205.175.32.sslip.io
```

## 2. EC2 Runtime

Install Docker and Git on EC2:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git unzip
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Log out and SSH back in, then verify:

```bash
docker --version
docker compose version
```

## 3. First Deploy

Clone the repo:

```bash
git clone https://github.com/talha-ghaffar-ch/zamindar-plus.git
cd zamindar-plus
```

Create the production environment file:

```bash
cp .env.production.example .env.production
nano .env.production
```

Set at least:

- `APP_HOST`
- `APP_URL`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VITE_GOOGLE_CLIENT_ID`
- SMTP values
- `GEMINI_API_KEY`

Build and start:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Check containers:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=100
```

Caddy will automatically request and renew the HTTPS certificate for `APP_HOST`.

## 4. Useful Commands

Restart:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

Pull latest code and redeploy manually:

```bash
git pull origin main
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Run seed users once if needed:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec api npm run seed:users
```

## 5. CI/CD Later

After EC2 is working manually, add GitHub repository secrets:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`

The workflow file is `.github/workflows/deploy-ec2.yml`.

It SSHes into EC2, pulls `main`, and runs:

```bash
scripts/deploy-ec2-docker.sh
```
