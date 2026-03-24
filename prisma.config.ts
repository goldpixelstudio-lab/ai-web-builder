import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // @ts-ignore
  migrate: {
    url: process.env.DATABASE_URL, 
  },
});