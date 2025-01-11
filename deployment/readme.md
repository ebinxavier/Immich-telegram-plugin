### Immich docker compose deployment

1. Copy `docker-compose.yaml` and rename `sample.env` to `.env` and change the postgres password
2. Run docker compose up command

```shell
docker compose up -d
```

3. Check the docker containers

```shell
docker ps
```

now if you see some containers are restarting due permission issue, do the following command

```sh
sudo chown -R *
```

4. Restart docker compose after `chown` if you face above error

```shell
docker compose down -v
docker compose up -d
```

5. Check the docker containers (healthy)

```shell
docker ps

53eedd7952a1   ghcr.io/immich-app/immich-server:release             "tini -- /bin/bash s…"   10 minutes ago   Up 10 minutes (healthy)   0.0.0.0:2283->2283/tcp, :::2283->2283/tcp   immich_server
e952d4b8d256   tensorchord/pgvecto-rs:pg14-v0.2.0                   "docker-entrypoint.s…"   10 minutes ago   Up 10 minutes (healthy)   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   immich_postgres
6b5187960f58   ghcr.io/immich-app/immich-machine-learning:release   "tini -- ./start.sh"     10 minutes ago   Up 10 minutes (healthy)                                               immich_machine_learning
75ab2a1986d0   redis:6.2-alpine                                     "docker-entrypoint.s…"   10 minutes ago   Up 10 minutes (healthy)   6379/tcp                                    immich_redis

```

### Restore postgres DB

docker compose down -v # CAUTION! Deletes all Immich data to start from scratch

## Uncomment the next line and replace DB_DATA_LOCATION with your Postgres path to permanently reset the Postgres database

# rm -rf DB_DATA_LOCATION # CAUTION! Deletes all Immich data to start from scratch

docker compose pull # Update to latest version of Immich (if desired)
docker compose create # Create Docker containers for Immich apps without running them
docker start immich_postgres # Start Postgres server
sleep 10 # Wait for Postgres server to start up

# Check the database user if you deviated from the default

gunzip < "/home/opc/immich-server/library/backups/immich-db-backup-1736301600032.sql.gz" \
| sed "s/SELECT pg_catalog.set_config('search_path', '', false);/SELECT pg_catalog.set_config('search_path', 'public, pg_catalog', true);/g" \
| docker exec -i immich_postgres psql --username=postgres # Restore Backup
docker compose up -d # Start remainder of Immich apps

### Import Immich config

- Under administrator settings import this [immich config](./immich-config.json)
- This config ensures that the image thumbnail is smaller and disable video transcoding.
