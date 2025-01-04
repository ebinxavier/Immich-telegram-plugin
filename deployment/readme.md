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
