# Wichteln

David's family Secret Santa. Each person opens a personal link, which signs their device in, unwraps the name of the person they give to, and writes their own wish list. Earlier years' wish lists stay readable, but not who gave to whom.

It has no pull request previews, because it holds family data.

## Develop

```sh
bun install --frozen-lockfile
just dev-env-generate
just dev-db-start
bun run --cwd packages/db db:migrate
bun run dev
```

The app then runs at <http://localhost:3000>. To put made-up people into the dev database, run the admin command line below from `apps/web` as `bun --env-file=.env.local scripts/admin.ts <command>`.

## Run a season

The admin command line runs in the live container on prod-1, so it reaches the production database. Start it with `podman exec -i` and without `-t`, because `season pairs` and `import` refuse input from a terminal:

```sh
bun run --cwd apps/web admin status
bun run --cwd apps/web admin person add <Name> [paper]
bun run --cwd apps/web admin season open <year> <Name>...
bun run --cwd apps/web admin season pairs <year> < pairs.txt
bun run --cwd apps/web admin link issue <Name>
bun run --cwd apps/web admin link revoke <Name>
bun run --cwd apps/web admin import < seasons.json
```

`season pairs` reads the draw from a file, one `giver=recipient` per line, and refuses to read it from the terminal. That keeps the draw out of the command line, which `bun run` echoes, out of the shell history, and off the screen. A new season becomes the current one, and every earlier season moves to the archive. `link issue` prints the new personal link and revokes the person's earlier ones, which signs out their devices.
