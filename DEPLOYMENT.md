# Production Deployment

This Compose setup runs MongoDB, the API, and the Nginx client on one Linux host. MongoDB is authenticated and private to the backend network. Its host port is bound to loopback only for host-based backup jobs; only the client is reachable externally on ports 80 and 443. Do not change the MongoDB binding to `0.0.0.0` or expose ports 27017 or 3000 to the public internet.

## Host and DNS

Use a maintained Linux server, point the domain's DNS A record to its public address, and allow inbound TCP 80/443 in the host and provider firewalls. Do not publish an AAAA record unless IPv6 is configured on the host. For this deployment, the domain is `badhon.mooo.com` and its A record must point to `172.198.76.61`. Install Docker Engine with the Compose plugin, Git, Certbot, MongoDB Database Tools, and rclone. Keep the host patched and restrict SSH access.

## Secrets and TLS

Clone the repository to `/opt/badhon`. Create a private production environment file:

```sh
cd /opt/badhon
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32
openssl rand -hex 32
```

Set `DOMAIN` and `APP_ORIGIN` to the exact public host and its HTTPS origin. Use separate generated values for `JWT_SECRET`, `MONGO_ROOT_PASSWORD`, and `MONGO_APP_PASSWORD`. Set `MONGO_URI` to `mongodb://<MONGO_APP_USERNAME>:<MONGO_APP_PASSWORD>@mongodb:27017/badhon?authSource=badhon` and `MONGO_BACKUP_URI` to the same URI with `127.0.0.1` instead of `mongodb`. Use the same generated hex value for the application password in both URIs; hex avoids URL-encoding issues. MongoDB uses the root credential only during database initialization; the application and backup use the dedicated `readWrite` account. Set both TLS paths to the full-chain certificate and private key for the domain. Never commit `.env.production`, paste secrets into logs, or reuse development credentials.

The MongoDB initialization script creates the application account only when the data volume is first initialized. For an existing database volume, create the least-privilege user through an authenticated MongoDB admin session before deploying this Compose configuration; initialization scripts do not rerun on existing data.

Issue the initial certificate before starting the client, because Nginx requires the certificate files at startup. Confirm the domain's A record points to this VPS before requesting the certificate:

```sh
sudo certbot certonly --standalone --agree-tos --no-eff-email \
  --email admin@example.com -d badhon.mooo.com
```

Replace the email with an address monitored by the operator. Start the stack from the repository root:

```sh
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

Test renewal with `sudo certbot renew --dry-run`. Install the included systemd timer so Certbot stops the client only when this certificate is due, renews it using the standalone challenge, and restarts the client even if renewal fails:

```sh
sudo install -m 644 ops/badhon-cert-renew.service /etc/systemd/system/
sudo install -m 644 ops/badhon-cert-renew.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now badhon-cert-renew.timer
sudo systemctl start badhon-cert-renew.service
sudo systemctl status badhon-cert-renew.timer
```

Keep the TLS private key readable by the Docker host, not committed to the repository; Compose mounts it read-only into Nginx.

## Backups and Recovery

Backups require MongoDB Database Tools and rclone on the host. Configure an S3-compatible rclone remote and a `crypt` remote wrapping it, with filename and directory encryption enabled. Keep the rclone config and encryption password protected on the host; do not store them in the repository. Use the encrypted remote as `BACKUP_RCLONE_DEST`.

Create `/etc/badhon/backup.env` containing only these backup credentials and settings. Replace the URI password with the same URL-safe hex value as `MONGO_APP_PASSWORD`, and set the encrypted remote name to the `crypt` remote configured above:

```sh
MONGO_BACKUP_URI=mongodb://badhonApp:replace-with-the-same-hex-password@127.0.0.1:27017/badhon?authSource=badhon
BACKUP_RCLONE_DEST=badhon-crypt:database
RCLONE_CONFIG=/etc/rclone/rclone.conf
BACKUP_DIR=/var/backups/badhon
RETENTION_DAYS=30
```

Protect both `/etc/badhon/backup.env` and `/etc/rclone/rclone.conf` with root-only permissions (`chmod 600`) and ensure `/var/backups/badhon` exists.

Install the included daily systemd timer, adjusting `/opt/badhon` only if the repository is installed elsewhere:

```sh
sudo install -d -m 700 /etc/badhon /var/backups/badhon
sudo install -m 644 ops/badhon-backup.service /etc/systemd/system/
sudo install -m 644 ops/badhon-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now badhon-backup.timer
sudo systemctl start badhon-backup.service
sudo systemctl status badhon-backup.service
```

The service writes owner-only compressed archives, uploads them to the encrypted rclone destination, and only then prunes local and off-site archives older than the configured retention period. A failed off-site upload fails the job and leaves local archives in place. Check `systemctl status badhon-backup.timer` and `journalctl -u badhon-backup.service` regularly, and alert on failed or missing runs. Test recovery periodically by downloading an archive and restoring it into a separate, non-production MongoDB instance. For a restore test, start a disposable MongoDB instance bound to `127.0.0.1` on a different port (for example, 27018), download an archive with `rclone copy`, then restore it with `mongorestore --gzip --archive=<archive> --nsFrom='badhon.*' --nsTo='badhon_restore.*'` using that disposable instance's admin URI. Never use the production URI or test a restore against the production database.

## Operations

Check service health with `docker compose --env-file .env.production ps` and logs with `docker compose --env-file .env.production logs --tail=100 server client mongodb`. Store secrets in a host secret manager where available, rotate credentials if exposed, and limit access to the production host and backups. Before upgrading MongoDB, make and verify a backup and follow MongoDB's supported upgrade path.