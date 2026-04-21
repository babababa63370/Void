import { Router, type IRouter } from "express";
import { jwtVerify } from "jose";
import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const { Pool } = pg;

const router: IRouter = Router();

const ADMIN_DISCORD_ID = "1243206708604702791";
const BACKUPS_DIR = path.resolve(process.cwd(), "data/backups");

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function requireAdmin(
  req: import("express").Request,
  res: import("express").Response,
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return null;
  }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtSecret());
    if (payload.sub !== ADMIN_DISCORD_ID) {
      res.status(403).json({ error: "forbidden" });
      return null;
    }
    return payload.sub;
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return null;
  }
}

async function ensureBackupsDir() {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

async function withPool<T>(url: string, fn: (pool: pg.Pool) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    return await fn(pool);
  } finally {
    await pool.end().catch(() => {});
  }
}

async function listTables(pool: pg.Pool): Promise<string[]> {
  const r = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );
  return r.rows.map((x) => x.table_name);
}

async function getTableColumns(pool: pg.Pool, table: string): Promise<string[]> {
  const r = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  return r.rows.map((x) => x.column_name);
}

async function getCounts(pool: pg.Pool): Promise<Record<string, number>> {
  const tables = await listTables(pool);
  const counts: Record<string, number> = {};
  for (const t of tables) {
    try {
      const r = await pool.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM "${t}"`);
      counts[t] = Number(r.rows[0]?.c ?? 0);
    } catch {
      counts[t] = -1;
    }
  }
  return counts;
}

// ─── Status ────────────────────────────────────────────────────────────────

router.get("/meonix/db/status", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const result: any = {
    current: { connected: false, error: null as string | null, tables: {} as Record<string, number> },
    old: { connected: false, error: null as string | null, tables: {} as Record<string, number>, configured: !!process.env.OLD_DATABASE_URL },
  };

  try {
    await withPool(process.env.DATABASE_URL!, async (p) => {
      result.current.connected = true;
      result.current.tables = await getCounts(p);
    });
  } catch (err: any) {
    result.current.error = err?.message ?? "Connection failed";
  }

  if (process.env.OLD_DATABASE_URL) {
    try {
      await withPool(process.env.OLD_DATABASE_URL, async (p) => {
        result.old.connected = true;
        result.old.tables = await getCounts(p);
      });
    } catch (err: any) {
      result.old.error = err?.message ?? "Connection failed";
    }
  }

  res.json(result);
});

// ─── Backups ───────────────────────────────────────────────────────────────

router.get("/meonix/db/backups", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await ensureBackupsDir();
  const files = await fs.readdir(BACKUPS_DIR);
  const list = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (name) => {
        const stat = await fs.stat(path.join(BACKUPS_DIR, name));
        return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
      }),
  );
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ backups: list });
});

router.post("/meonix/db/backup", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const source = (req.body?.source as string) === "old" ? "old" : "current";
  const url = source === "old" ? process.env.OLD_DATABASE_URL : process.env.DATABASE_URL;
  if (!url) {
    res.status(400).json({ error: `${source}_url_not_configured` });
    return;
  }
  try {
    await ensureBackupsDir();
    const dump: Record<string, any[]> = {};
    let totalRows = 0;
    await withPool(url, async (p) => {
      const tables = await listTables(p);
      for (const t of tables) {
        const r = await p.query(`SELECT * FROM "${t}"`);
        dump[t] = r.rows;
        totalRows += r.rows.length;
      }
    });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const name = `backup-${source}-${ts}.json`;
    const filepath = path.join(BACKUPS_DIR, name);
    await fs.writeFile(
      filepath,
      JSON.stringify({ source, createdAt: new Date().toISOString(), tables: dump }, null, 2),
    );
    const stat = await fs.stat(filepath);
    res.json({ success: true, name, size: stat.size, totalRows, tables: Object.keys(dump).length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "backup_failed" });
  }
});

router.get("/meonix/db/backups/:name/download", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const name = req.params.name;
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(name)) {
    res.status(400).json({ error: "invalid_name" });
    return;
  }
  const filepath = path.join(BACKUPS_DIR, name);
  try {
    await fs.access(filepath);
    res.download(filepath, name);
  } catch {
    res.status(404).json({ error: "not_found" });
  }
});

router.delete("/meonix/db/backups/:name", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const name = req.params.name;
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(name)) {
    res.status(400).json({ error: "invalid_name" });
    return;
  }
  try {
    await fs.unlink(path.join(BACKUPS_DIR, name));
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "not_found" });
  }
});

// ─── Restore from backup ────────────────────────────────────────────────────

router.post("/meonix/db/backups/:name/restore", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const name = req.params.name;
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(name)) {
    res.status(400).json({ error: "invalid_name" });
    return;
  }
  const target = (req.body?.target as string) === "old" ? "old" : "current";
  const mode = (req.body?.mode as string) === "merge" ? "merge" : "replace";
  const url = target === "old" ? process.env.OLD_DATABASE_URL : process.env.DATABASE_URL;
  if (!url) {
    res.status(400).json({ error: `${target}_url_not_configured` });
    return;
  }

  const filepath = path.join(BACKUPS_DIR, name);
  const report: Array<{ table: string; restored: number; skipped: number; error?: string }> = [];

  try {
    const raw = await fs.readFile(filepath, "utf8");
    const data = JSON.parse(raw) as { tables: Record<string, any[]> };
    if (!data?.tables || typeof data.tables !== "object") {
      res.status(400).json({ error: "invalid_backup_file" });
      return;
    }

    await withPool(url, async (pool) => {
      const existingTables = new Set(await listTables(pool));

      for (const [t, rows] of Object.entries(data.tables)) {
        if (!Array.isArray(rows)) continue;
        const entry = { table: t, restored: 0, skipped: 0 } as { table: string; restored: number; skipped: number; error?: string };

        if (!existingTables.has(t)) {
          entry.error = "table_missing_in_target";
          report.push(entry);
          continue;
        }

        try {
          const targetCols = new Set(await getTableColumns(pool, t));

          if (mode === "replace") {
            await pool.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
          }

          const pkRes = await pool.query<{ attname: string }>(
            `SELECT a.attname
             FROM pg_index i
             JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
             WHERE i.indrelid = $1::regclass AND i.indisprimary`,
            [`public."${t}"`],
          );
          const pkColsAll = pkRes.rows.map((r) => r.attname);

          for (const row of rows) {
            if (!row || typeof row !== "object") { entry.skipped++; continue; }
            const cols = Object.keys(row).filter((c) => targetCols.has(c));
            if (cols.length === 0) { entry.skipped++; continue; }
            const pkCols = pkColsAll.filter((c) => cols.includes(c));
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
            const values = cols.map((c) => (row as any)[c]);
            let sql = `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
            if (mode === "merge" && pkCols.length > 0) {
              const updateCols = cols.filter((c) => !pkCols.includes(c));
              if (updateCols.length > 0) {
                sql += ` ON CONFLICT (${pkCols.map((c) => `"${c}"`).join(", ")}) DO UPDATE SET ${updateCols
                  .map((c) => `"${c}" = EXCLUDED."${c}"`)
                  .join(", ")}`;
              } else {
                sql += ` ON CONFLICT DO NOTHING`;
              }
            } else if (mode === "merge") {
              sql += ` ON CONFLICT DO NOTHING`;
            }
            try {
              const r = await pool.query(sql, values);
              if ((r.rowCount ?? 0) > 0) entry.restored++;
              else entry.skipped++;
            } catch (e: any) {
              entry.skipped++;
              if (!entry.error) entry.error = e?.message?.slice(0, 200);
            }
          }
        } catch (e: any) {
          entry.error = e?.message ?? "table_failed";
        }
        report.push(entry);
      }
    });

    res.json({ success: true, target, mode, report });
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(500).json({ error: err?.message ?? "restore_failed", report });
  }
});

// ─── Migration (old → current) ─────────────────────────────────────────────

router.post("/meonix/db/migrate", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  if (!process.env.OLD_DATABASE_URL) {
    res.status(400).json({ error: "old_url_not_configured" });
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(400).json({ error: "current_url_not_configured" });
    return;
  }

  const mode = (req.body?.mode as string) === "replace" ? "replace" : "merge";
  const onlyTables = Array.isArray(req.body?.tables) ? (req.body.tables as string[]) : null;

  const report: Array<{ table: string; copied: number; skipped: number; error?: string }> = [];

  try {
    await withPool(process.env.OLD_DATABASE_URL, async (oldPool) => {
      await withPool(process.env.DATABASE_URL!, async (newPool) => {
        const oldTables = await listTables(oldPool);
        const newTables = new Set(await listTables(newPool));
        const targets = oldTables.filter((t) => newTables.has(t) && (!onlyTables || onlyTables.includes(t)));

        for (const t of targets) {
          const entry = { table: t, copied: 0, skipped: 0 } as { table: string; copied: number; skipped: number; error?: string };
          try {
            const oldCols = await getTableColumns(oldPool, t);
            const newCols = new Set(await getTableColumns(newPool, t));
            const cols = oldCols.filter((c) => newCols.has(c));
            if (cols.length === 0) {
              entry.error = "no_common_columns";
              report.push(entry);
              continue;
            }

            if (mode === "replace") {
              await newPool.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
            }

            const sourceRows = await oldPool.query(
              `SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM "${t}"`,
            );

            const pkRes = await newPool.query<{ attname: string }>(
              `SELECT a.attname
               FROM pg_index i
               JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
               WHERE i.indrelid = $1::regclass AND i.indisprimary`,
              [`public."${t}"`],
            );
            const pkCols = pkRes.rows.map((r) => r.attname).filter((c) => cols.includes(c));

            for (const row of sourceRows.rows) {
              const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
              const values = cols.map((c) => row[c]);
              let sql = `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
              if (mode === "merge" && pkCols.length > 0) {
                const updateCols = cols.filter((c) => !pkCols.includes(c));
                if (updateCols.length > 0) {
                  sql += ` ON CONFLICT (${pkCols.map((c) => `"${c}"`).join(", ")}) DO UPDATE SET ${updateCols
                    .map((c) => `"${c}" = EXCLUDED."${c}"`)
                    .join(", ")}`;
                } else {
                  sql += ` ON CONFLICT DO NOTHING`;
                }
              } else if (mode === "merge") {
                sql += ` ON CONFLICT DO NOTHING`;
              }
              try {
                const r = await newPool.query(sql, values);
                if ((r.rowCount ?? 0) > 0) entry.copied++;
                else entry.skipped++;
              } catch (e: any) {
                entry.skipped++;
                if (!entry.error) entry.error = e?.message?.slice(0, 200);
              }
            }
          } catch (e: any) {
            entry.error = e?.message ?? "table_failed";
          }
          report.push(entry);
        }
      });
    });

    res.json({ success: true, mode, report });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "migration_failed", report });
  }
});

export default router;
