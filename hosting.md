# Smart Tourist Guide System - Hosting Guide

This document explains how to deploy the current project to a public production
environment. It is based on the code in this repository, not on a separate
frontend build pipeline.

## 1. Application architecture

The project is a server-rendered Node.js application:

- `frontend/` contains HTML templates and one CSS file. There is no frontend
  JavaScript bundle, React build, or static-site build command.
- `backend/` contains the Express 5 server, server-side HTML rendering, form
  handlers, JSON APIs, authentication, role-based management pages, and tests.
- MySQL 8 stores application data and the persistent Express sessions.
- The backend serves the frontend from the same origin. A separate frontend
  host is not required and would make session cookies and deployment more
  complicated.
- Images are loaded from `images.unsplash.com` and fonts from Google Fonts.
  The server's Content Security Policy already allows those hosts.

The main production request flow is:

```text
Browser
  -> HTTPS reverse proxy / hosting platform
  -> Node.js process (backend/src/server.js)
  -> MySQL 8 (application data + sessions)
```

The server listens on `PORT` (default `3000`), performs a database health query
before accepting traffic, and exposes `GET /api/health` for health checks.

## 2. Recommended production topology

Use:

1. One Node.js web service running the repository's `backend` directory.
2. One managed MySQL 8 database, reachable privately if the hosting provider
   supports private networking.
3. HTTPS provided by the platform or by a reverse proxy.
4. Environment variables configured in the hosting provider's secret manager.
5. Automated database backups and a separate tested restore procedure.

Do not deploy the `frontend` directory as an independent static site unless the
application is first redesigned to call a separately hosted API. The current
HTML uses same-origin routes such as `/account`, `/dashboard`, `/trips`, and
`/api`, and the server fills template placeholders before returning the page.

## 3. Requirements

- Node.js 20 or newer. The backend declares `node >=20`.
- npm, which is used with the committed `backend/package-lock.json`.
- MySQL 8.0 or newer with `utf8mb4` support.
- A domain name for a public deployment.
- A MySQL user with permission to create/use the application database during
  initial installation and to create the `sessions` table at first startup.
- TLS/HTTPS. Production cookies are marked `secure` and will not work correctly
  over plain HTTP.

## 4. Files that must be deployed

Deploy these directories and files:

```text
backend/
  package.json
  package-lock.json
  src/
  scripts/
  sql/
frontend/
```

Do not deploy `backend/.env` from a laptop or commit it to source control.
`backend/.gitignore` excludes it. Configure the values in the hosting
provider's environment-variable UI or secret store instead.

`backend/node_modules/` should not be committed or copied from Windows. The
hosting service should run `npm ci` on Linux using the lock file.

## 5. Production environment variables

Configure these variables on the Node.js service. Values below are examples;
replace every placeholder with a real production value.

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `NODE_ENV` | Yes | `production` | Enables secure cookies and production behavior. |
| `PORT` | Usually supplied by host | `3000` | Port for the Node process. Most platforms inject this automatically. |
| `SESSION_SECRET` | Yes | a random 32+ character value | Signs session cookies. Use a unique secret per environment. |
| `DB_HOST` | Yes | managed MySQL hostname | MySQL server hostname. |
| `DB_PORT` | Yes | `3306` | MySQL port. |
| `DB_NAME` | Yes | `roam_tourism` | Application database name. |
| `DB_USER` | Yes | restricted application user | MySQL username. |
| `DB_PASSWORD` | Yes | secret value | MySQL password. |
| `DB_SSL_REQUIRED` | Recommended for hosted MySQL | `true` | Enables TLS for providers such as Aiven. |
| `DB_SSL_REJECT_UNAUTHORIZED` | Recommended | `true` | Validates the provider's TLS certificate. Keep `true` for production. |
| `PUBLIC_BASE_URL` | Recommended | `https://travel.example.com` | Used when generating payment QR URLs. |
| `DEMO_ADMIN_EMAIL` | Optional | empty in production | Used only by the demo-account seed script. |
| `DEMO_ADMIN_PASSWORD` | Optional | empty in production | Used only by the demo-account seed script. |
| `DEMO_TOURIST_EMAIL` | Optional | empty in production | Used only by the demo-account seed script. |
| `DEMO_TOURIST_PASSWORD` | Optional | empty in production | Used only by the demo-account seed script. |

Generate a secret locally with Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Never reuse the development secret, database password, or demo credentials in
production. The server refuses to start unless `SESSION_SECRET` is at least 32
bytes and `DB_USER` is set.

## 6. Database setup

### 6.1 Create a fresh production database

Run the schema as a privileged database administrator. From the repository
root on a machine with the MySQL client installed:

```powershell
Get-Content backend\sql\schema.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p
Get-Content backend\sql\seed.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p roam_tourism
```

The schema creates the `roam_tourism` database and the tables for tourists,
destinations, hotels, attractions, restaurants, bookings, payments, reviews,
audit logs, and contact messages. The server creates the `sessions` table
automatically during startup if it does not already exist.

For a real public launch, review `seed.sql` before loading it. It contains demo
content. Load it only if that content is wanted in production.

### 6.2 Create a restricted application user

Do not run the Node service as MySQL `root`. Create a dedicated user from an
administrator connection:

```sql
CREATE USER 'roam_app'@'%' IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON roam_tourism.* TO 'roam_app'@'%';
FLUSH PRIVILEGES;
```

Restrict the host from `%` to the Node service's private network or fixed
outbound IP whenever the database provider supports it. If the database is
already initialized and the application is not expected to run schema
migrations, remove unnecessary privileges after setup. The application needs
to create `sessions` on first startup, so retain `CREATE` for that initial
startup or create the table manually first.

### 6.3 Existing database upgrades

For an existing database, take a backup first. Do not run the migration files
on a new database that was created from `schema.sql`.

```powershell
Get-Content backend\sql\migration-002-full-guide.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p roam_tourism
Get-Content backend\sql\migration-003-demo-experience.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p roam_tourism
Get-Content backend\sql\seed.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p roam_tourism
```

The migration files are one-time upgrades and are not a general migration
runner. Record which migrations have been applied.

## 7. First deployment and local production check

Before connecting a public domain, verify the production configuration locally
or on a staging service:

```powershell
Set-Location backend
npm.cmd ci
npm.cmd run check
npm.cmd test
npm.cmd start
```

In another terminal:

```powershell
Invoke-WebRequest http://localhost:3000/api/health
```

The response should be HTTP 200 with JSON containing `"status":"ok"`.

Then verify in a browser:

1. The home page and destination search load.
2. A new tourist account can register and sign in.
3. Refreshing the page preserves the session.
4. A booking can be created and its receipt/verification page loads.
5. Logout works.
6. Contact form submissions appear in the administrator dashboard.
7. Staff routes reject a normal tourist account.
8. The HTTPS deployment sends the `roam.sid` cookie with `Secure`,
   `HttpOnly`, and `SameSite=Strict`.

Do not run `npm run seed:demo` when `NODE_ENV=production`; the script
intentionally refuses to create demo accounts in production. If demo accounts
are needed in a non-production environment, configure their credentials
explicitly and change them before any public exposure.

## 8. Deploying on a managed Node platform

This is the simplest option for a first public deployment. Render, Railway,
Fly.io, and similar services can run the same process. The names of dashboard
fields differ, but the settings are equivalent.

### Service settings

- Repository: the project repository.
- Root directory: `backend`.
- Build command: `npm ci`.
- Start command: `npm start`.
- Runtime: Node.js 20 or newer.
- Health-check path: `/api/health`.
- Environment variables: configure the production variables from section 5.
- Database: use the provider's managed MySQL or an external managed MySQL 8
  service.

If the platform only supports a repository-root build command, use:

```powershell
cd backend; npm ci
```

and use this start command:

```powershell
cd backend; npm start
```

The platform must pass its assigned `PORT` to the process. Do not hard-code a
public port or start a development watcher in production.

After deployment, open:

```text
https://your-domain.example/api/health
https://your-domain.example/
https://your-domain.example/account
```

Attach the custom domain only after the generated platform URL is healthy.
Enable the platform's automatic HTTPS redirect and configure the DNS records
exactly as the platform instructs.

## 8A. Deploying on Vercel

Vercel can host this project through a Node.js serverless function. The
repository includes the required adapter in `api/index.js` and the routing
configuration in `vercel.json`. Do not deploy `backend/src/server.js` directly
as a Vercel command: Vercel needs the exported request handler, not a process
that calls `app.listen()`.

This deployment still requires an external MySQL 8 provider. Vercel does not
provide the MySQL database used by this application. Suitable providers
include a managed MySQL service such as PlanetScale, Railway MySQL, Aiven,
Amazon RDS, DigitalOcean Managed MySQL, or another MySQL 8-compatible service.
Use a provider that permits connections from Vercel serverless functions.

### 8A.1 Prepare the database

Create the production database and load the schema from a machine with the
MySQL client:

```powershell
Get-Content backend\sql\schema.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p
```

Review and optionally load the demo content:

```powershell
Get-Content backend\sql\seed.sql | mysql.exe -h <MYSQL_HOST> -P 3306 -u <ADMIN_USER> -p roam_tourism
```

Create a restricted application user and allow its network access according to
your database provider:

```sql
CREATE USER 'roam_app'@'%' IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON roam_tourism.* TO 'roam_app'@'%';
FLUSH PRIVILEGES;
```

If the provider does not allow the Vercel function to create the session table,
run this once as an administrator after the first schema setup:

```sql
CREATE TABLE IF NOT EXISTS roam_tourism.sessions (
  sid VARCHAR(128) NOT NULL,
  expires BIGINT UNSIGNED NOT NULL,
  data MEDIUMTEXT NOT NULL,
  PRIMARY KEY (sid),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB;
```

The application stores sessions in MySQL, so users do not depend on a
serverless instance's temporary memory. Do not replace this with an in-memory
session store.

### 8A.2 Push the project to GitHub

The Vercel dashboard imports a Git repository. Ensure the repository contains:

```text
api/index.js
vercel.json
backend/
frontend/
```

Do not commit `backend/.env`, database dumps, passwords, or production secrets.
The root `package-lock.json` is not the backend dependency lock file; Vercel
uses `backend/package.json` through the adapter's imports. The production
dependencies used by the function are declared in `backend/package.json`.

### 8A.3 Import the repository into Vercel

1. Sign in at <https://vercel.com> and choose **Add New... > Project**.
2. Import the GitHub repository containing this project.
3. Leave the project root directory as the repository root. Do not set it to
   `frontend` or `backend`; `api/index.js` and `vercel.json` are at the root.
4. Vercel should detect the `vercel.json` Node function configuration.
5. Deploy once, then add environment variables before relying on the deployment.

If Vercel asks for a build command, leave it empty. This application has no
frontend build step. If a command is required by the dashboard, use:

```text
npm ci --prefix backend
```

The important runtime entry point is `api/index.js`.

### 8A.4 Add Vercel environment variables

In **Project Settings > Environment Variables**, add the following for
**Production** (and Preview if you want staging deployments):

```text
NODE_ENV=production
SESSION_SECRET=<unique random value of at least 32 bytes>
DB_HOST=<managed MySQL hostname>
DB_PORT=3306
DB_NAME=roam_tourism
DB_USER=roam_app
DB_PASSWORD=<managed MySQL password>
PUBLIC_BASE_URL=https://<your-production-domain>
```

`PORT` is not normally needed on Vercel; Vercel supplies the serverless
request runtime. Do not paste the contents of the local `backend\.env` file
into a public repository or a client-side variable. These are server-side
variables and must not use a `NEXT_PUBLIC_`-style public prefix.

Generate a session secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Use **Redeploy** after adding or changing environment variables. Select the
correct environment when editing them; Production, Preview, and Development
variables are separate in Vercel.

### 8A.5 Verify the Vercel deployment

After deployment, replace the hostname below with the Vercel URL:

```powershell
Invoke-WebRequest https://<your-project>.vercel.app/api/health
```

The response should be HTTP 200 and contain:

```json
{"status":"ok"}
```

Then verify these URLs and flows:

```text
https://<your-project>.vercel.app/
https://<your-project>.vercel.app/account
https://<your-project>.vercel.app/admin/login
```

Register a test tourist, sign in, refresh the page, create a test booking,
check the receipt, and log out. Confirm that a second request still sees the
same session. Check Vercel's **Logs** tab if `/api/health` fails.

### 8A.6 Add a custom domain

1. Open **Project Settings > Domains** in Vercel.
2. Add your domain.
3. Create the DNS records Vercel displays at your DNS provider.
4. Set `PUBLIC_BASE_URL` to the final HTTPS domain.
5. Redeploy.

Use one canonical domain. A session cookie set on one hostname is not shared
with another hostname.

### 8A.7 Vercel limitations and important settings

- Vercel functions are short-lived and may be invoked on different instances.
  MySQL must be external and sessions must remain in MySQL.
- Do not write uploads, database files, logs, or other persistent data to the
  function filesystem. The current application does not need local file
  storage.
- Each function instance can open MySQL connections. Use a managed database
  with serverless-compatible connection pooling or limits. If the database
  provider supplies a pooled connection endpoint, use that endpoint in
  `DB_HOST`.
- The application initializes the MySQL session table and performs `SELECT 1`
  before handling each new serverless instance's first request.
- Vercel's platform HTTPS makes production secure cookies work. The adapter
  does not call `app.listen()`.
- The simulated payment flow is not a real payment gateway. Do not enter or
  accept real card, bank, UPI, or CVV data.
- Vercel deployment logs are useful for errors, but configure database backups
  and operational monitoring with the database provider as well.

### 8A.8 Vercel deployment troubleshooting

**`FUNCTION_INVOCATION_FAILED` or an immediate 500**

Check Vercel runtime logs and confirm that all `DB_*` variables and
`SESSION_SECRET` are set for the deployment environment. Confirm the database
allows connections from Vercel and that TLS/SSL requirements from the provider
are satisfied.

**`/api/health` cannot connect to MySQL**

Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Check
whether the database provider requires an allowlist, a pooled hostname, or an
SSL connection. Test the same credentials from a secure machine without
printing the password.

**Login works but the session disappears**

Confirm the site is accessed over HTTPS and on one hostname, then inspect the
`roam.sid` cookie in browser developer tools. Verify that the `sessions` table
is writable and that the Vercel function can reach MySQL on every invocation.

**CSS or pages return 404**

Confirm the project root is the repository root and that `frontend/`,
`api/index.js`, and `vercel.json` are committed. Do not configure `frontend` as
the Vercel project root.

## 9. VPS deployment with Nginx and systemd

Use this option when full server control is required. The commands below are a
deployment outline for Ubuntu/Debian; adapt package commands for another Linux
distribution.

### 9.1 Install runtime dependencies

```bash
sudo apt update
sudo apt install -y nginx mysql-client git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 9.2 Copy and install the application

```bash
sudo mkdir -p /var/www/roam-tourist-system
sudo chown -R "$USER":"$USER" /var/www/roam-tourist-system
git clone <REPOSITORY_URL> /var/www/roam-tourist-system
cd /var/www/roam-tourist-system/backend
npm ci --omit=dev
```

Create `/etc/roam-tourist-system.env` with mode `600`:

```text
NODE_ENV=production
PORT=3000
SESSION_SECRET=REPLACE_WITH_A_RANDOM_32_BYTE_OR_LONGER_SECRET
DB_HOST=REPLACE_WITH_MYSQL_HOST
DB_PORT=3306
DB_NAME=roam_tourism
DB_USER=roam_app
DB_PASSWORD=REPLACE_WITH_DATABASE_PASSWORD
PUBLIC_BASE_URL=https://travel.example.com
```

### 9.3 Run Node with systemd

Create `/etc/systemd/system/roam-tourist-system.service`:

```ini
[Unit]
Description=Smart Tourist Guide System
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/roam-tourist-system/backend
EnvironmentFile=/etc/roam-tourist-system.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Set ownership, start the service, and inspect logs:

```bash
sudo chown -R www-data:www-data /var/www/roam-tourist-system
sudo chmod 600 /etc/roam-tourist-system.env
sudo systemctl daemon-reload
sudo systemctl enable --now roam-tourist-system
sudo systemctl status roam-tourist-system
sudo journalctl -u roam-tourist-system -f
```

### 9.4 Reverse proxy with Nginx

Create `/etc/nginx/sites-available/roam-tourist-system`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name travel.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and validate the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/roam-tourist-system /etc/nginx/sites-enabled/roam-tourist-system
sudo nginx -t
sudo systemctl reload nginx
```

Install a certificate after DNS points to the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d travel.example.com
```

The `X-Forwarded-Proto` header is important because the Express application
trusts the first proxy in production and uses secure session cookies.

## 10. Security checklist before going public

- Set `NODE_ENV=production`.
- Use HTTPS only and verify HTTP redirects to HTTPS.
- Generate a unique `SESSION_SECRET` of at least 32 random bytes.
- Use a least-privilege MySQL user, not `root`.
- Restrict MySQL network access to the application service.
- Do not expose MySQL port 3306 to the whole internet.
- Remove or change every demo administrator/tourist credential.
- Do not use real card numbers, CVVs, bank credentials, or UPI credentials.
  The payment flow is explicitly simulated and does not process real payments.
- Keep `.env` files, database dumps, and logs out of the repository.
- Configure database backups, retention, and restore testing.
- Keep Node.js, npm dependencies, the operating system, and the database
  patched.
- Review the administrator accounts and staff roles before launch.
- Monitor failed logins, database errors, process restarts, and disk usage.
- Configure a firewall so only SSH (restricted), HTTP, and HTTPS are public on
  a VPS.

The application already uses Helmet, rate limits API requests and sign-in
attempts, parameterized MySQL queries, bcrypt password hashes, server-side
validation, and a MySQL-backed session store. Hosting configuration does not
replace application security review.

## 11. Backups and operations

Back up the MySQL database, not just the source code. User accounts, bookings,
payments, reviews, messages, audit logs, and sessions are database data.

Example logical backup:

```bash
mysqldump --single-transaction --routines --triggers \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p \
  "$DB_NAME" > roam_tourism-$(date +%F).sql
```

Store encrypted backups outside the application server, restrict access, define
retention, and periodically restore one into a staging database. Do not put
passwords directly into shell history or backup scripts.

For releases:

1. Back up the database.
2. Deploy to staging.
3. Run `npm run check` and `npm test`.
4. Apply any required SQL migration once.
5. Deploy the application.
6. Check `/api/health` and the browser flows.
7. Watch logs for errors and roll back the application if needed.

The server handles `SIGINT` and `SIGTERM` and closes the HTTP server, session
cleanup timer, and MySQL pool during shutdown. This makes it suitable for
platform restarts and systemd-managed deployments.

## 12. Troubleshooting

### The service exits immediately

Check the service logs. The most common causes are:

- `SESSION_SECRET` is missing or shorter than 32 bytes.
- `DB_USER` is missing.
- The database host, credentials, or firewall rule is wrong.
- The database does not accept the application connection.
- The service is running an unsupported Node.js version.

### `/api/health` returns an error

Confirm that MySQL is reachable from the Node service, the database name is
correct, and the application user has access to `roam_tourism`. Test the
connection from the same host/network as the Node process.

### Users are logged out after every request

Confirm that:

- all requests use the same public HTTPS host;
- the reverse proxy sends `X-Forwarded-Proto`;
- `NODE_ENV=production` is set;
- the MySQL `sessions` table exists and is writable;
- the browser is not blocking the `roam.sid` cookie.

Do not use an in-memory session store or run multiple instances without the
shared MySQL session store.

### CSS or pages return 404

The process must start from `backend` or have the repository layout intact.
The server resolves the templates and stylesheet relative to the checked-out
repository, so do not copy only individual HTML files to a different directory.

### QR codes contain the wrong URL

Set `PUBLIC_BASE_URL` to the canonical HTTPS origin, including the scheme and
without a trailing path such as `/api`. The server otherwise derives a URL from
the incoming request host.

## 13. Short deployment checklist

```text
[ ] MySQL 8 database created from backend/sql/schema.sql
[ ] Optional seed data reviewed and loaded
[ ] Dedicated restricted MySQL user created
[ ] Backups configured and restore tested
[ ] Node.js 20+ service configured with npm ci and npm start
[ ] NODE_ENV=production set
[ ] Strong unique SESSION_SECRET set
[ ] DB_* variables set in the host secret manager
[ ] PUBLIC_BASE_URL set to the HTTPS domain
[ ] Demo credentials removed or changed
[ ] /api/health returns status ok
[ ] Registration, login, session persistence, booking, logout tested
[ ] HTTPS, secure cookie, domain, and DNS verified
[ ] Monitoring and error logs enabled
```
