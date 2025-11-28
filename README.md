https://ui.omoplata.space/monthlyusd

[fetchUSDDaily](https://github.com/yusasugur/fetchUSDDaily)

	1.	Calls some external API to get buy/sell price + currency.
	2.	Connects to a PostgreSQL database.
	3.	Inserts a new row into a prices table.

On the Hetzner server

	1.	Installed Docker + docker compose plugin.
	2.	Cloned repo into /opt/fetchUSDDaily.
	3.	Ran docker compose up -d db to keep the DB container always running.
	4.	Used docker compose run to run the worker container when needed.

Cron job twice per day (Turkey time)

  Set up a cron job (as root) to run the worker at 10:00 and 15:00 Turkey time.

[getUSDLogs](https://github.com/yusasugur/getUSDLogs)

	•	Connects to the same Postgres DB.
	•	Has endpoints like:
	•	/logs/latest
	•	/logs/history
	•	It reads from prices and returns JSON.
  
  Connected it to the same Docker network as the DB so DB_HOST=price-db (or db) works

  Making the logs API public + HTTPS + domain

	1.	Bought the domain omoplata.space.
	2.	Pointed api.omoplata.space → your server IP (A record).
	3.	Installed nginx as reverse proxy.
	4.	Used certbot to get HTTPS certificates for api.omoplata.space

Next.js UI

	•	Deployed as a Docker container (nextapp) on port 3000.
	•	Configured basePath: '/monthlyusd' in next.config.js → so the app lives under /monthlyusd, not /.


Docker containers

	•	price-db (Postgres 16)
	•	fetchUSDDaily worker container (run twice per day by cron)
	•	getusdlogs-api (public logs API, port 3001)
	•	nextapp (Next.js UI, port 3000)

nginx + domains

	•	api.omoplata.space → HTTPS → nginx → getusdlogs-api on 3001
	•	ui.omoplata.space → HTTPS → nginx → nextapp on 3000, under /monthlyusd

cron job

	* Twice per day (10:00 & 15:00 Turkey time) cron runs:
	•	A docker compose run of your worker
	•	Which inserts a new daily USD price into the DB.

  
