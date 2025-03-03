import { migrateDatabase } from "@/lib/database/postgres";

async function main() {
  console.log("Starting database migration...");

  try {
    await migrateDatabase();
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
