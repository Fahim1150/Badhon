# Production Deployment

This Compose setup runs MongoDB, the API, and the Nginx client on one Linux host. MongoDB is authenticated and private to the backend network; only the client publishes ports 80 and 443. Do not expose ports 27017 or 3000 to the public internet.

## Host and DNS

Use a maintained Linux server, point the domain's DNS A record (and AAAA record only if IPv6 is configured) to its public address, and allow inbound TCP 80/443 in the host and provider firewalls. Install Docker Engine with the Compose plugin, Git, Certbot, and MongoDB Database Tools. Keep the host patched and restrict SSH access.

## Secrets and TLS

Create a private production environment file and replace the example domain and values:

```sh
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32
openssl rand -hex 32
```

Set `DOMAIN` to the exact public host and `APP_ORIGIN` to `https://` plus that host. Use separate generated values for `JWT_SECRET`, `MONGO_ROOT_PASSWORD`, and `MONGO_APP_PASSWORD`. MongoDB uses the root credential only during database initialization; the API and backup script use the dedicated `readWrite` account in `MONGO_URI`. Keep `MONGO_APP_USERNAME` and `MONGO_APP_PASSWORD` consistent with that URI. Hex values are safe to place in a MongoDB URI without URL encoding. Set both TLS paths to the full-chain certificate and private key for that domain. Never commit `.env.production`, paste secrets into logs, or reuse development credentials.

The MongoDB initialization script creates the application account only when the data volume is first initialized. For an existing database volume, create the least-privilege user through an authenticated MongoDB admin session before deploying this Compose configuration; initialization scripts do not rerun on existing data.

Issue the initial certificate before starting the client, because Nginx requires the certificate files at startup:

```sh
sudo certbot certonly --standalone --agree-tos --no-eff-email \
  --email admin@example.com -d badhon.example.com
```

Replace the email and domain with real values. Start the stack from the repository root:

```sh
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

Configure certificate renewal to stop and restart only the client around Certbot's standalone renewal, then test renewal with `sudo certbot renew --dry-run`. For example, schedule `docker compose --env-file /path/to/repo/.env.production stop client`, `certbot renew`, and `docker compose --env-file /path/to/repo/.env.production start client` as a host-managed renewal job. Keep the TLS private key readable by the Docker host, not committed to the repository; Compose mounts it read-only into Nginx.

## Backups and Recovery

Install MongoDB Database Tools on the host. Load the trusted production environment file into the shell and run the backup script:

```sh
set -a
. ./.env.production
set +a
./ops/backup-mongodb.sh
```

The script writes compressed archives under `backups/` with owner-only permissions and removes local archives older than 30 days by default. Set `BACKUP_DIR` and `RETENTION_DAYS` to customize this. Copy backups to a separate encrypted off-host location, monitor backup completion, and regularly rehearse restores into a non-production database. A local archive alone is not a disaster-recovery plan.

## Operations

Check service health with `docker compose --env-file .env.production ps` and logs with `docker compose --env-file .env.production logs --tail=100 server client mongodb`. Store secrets in a host secret manager where available, rotate credentials if exposed, and limit access to the production host and backups. Before upgrading MongoDB, make and verify a backup and follow MongoDB's supported upgrade path.