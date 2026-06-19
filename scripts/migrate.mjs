import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const projectRef = "jhlytzidmwgvriysbrsc";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("\n❌ Manca SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const sqlFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const urls = [
  process.env.DATABASE_URL,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
].filter(Boolean);

async function connect() {
  let lastError;
  for (const url of urls) {
    const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

const client = await connect();
console.log("✓ Connesso a Supabase\n");

for (const file of sqlFiles) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  try {
    await client.query(sql);
    console.log(`✓ ${file}`);
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log(`⚠ ${file} (già applicata)`);
    } else {
      console.error(`❌ ${file}:`, err.message);
      process.exit(1);
    }
  }
}

await client.end();
console.log("\n✓ Migration completate\n");
