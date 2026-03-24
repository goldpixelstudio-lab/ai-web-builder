import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    url: process.env.DATABASE_URL, // <--- Tutaj trafia Twój URL dla migracji
  },
});