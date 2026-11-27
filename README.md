# Wichteln

David's family Secret Santa. Each person opens a personal link, which signs their device in, unwraps the name of the person they give to, and writes their own wish list. Earlier years' wish lists stay readable, but not who gave to whom.

It runs on prod-1 at <https://wichteln.vornholt.online> and has no pull request previews, because it holds family data.

## Develop

```sh
just dev-db-start
just dev-env-generate
bun run --cwd packages/db db:migrate
bun run dev
```

The app then runs at <http://localhost:3000>. To put made-up people into the dev database, run the admin command line below from `apps/web` as `bun --env-file=.env.local scripts/admin.ts <command>`.

## Run a season

The admin command line runs in the live container on prod-1, so it reaches the production database:

```sh
bun run --cwd apps/web admin status
bun run --cwd apps/web admin person add <Name> [paper]
bun run --cwd apps/web admin season open <year> <Name>...
bun run --cwd apps/web admin season pairs <year>
bun run --cwd apps/web admin link issue <Name>
bun run --cwd apps/web admin link revoke <Name>
bun run --cwd apps/web admin import < seasons.json
```

`season pairs` reads the draw from standard input, one `giver=recipient` per line: type the lines and end with Ctrl+D. That keeps the draw out of the command line, which `bun run` echoes, and out of the shell history. A new season becomes the current one, and every earlier season moves to the archive. `link issue` prints the new personal link and revokes the person's earlier ones, which signs out their devices.
