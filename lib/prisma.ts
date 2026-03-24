import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Pobieramy adres bazy z pliku .env
const connectionString = process.env.DATABASE_URL;

// Inicjujemy pulę połączeń i nowoczesny adapter Vercela
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Zabezpieczenie przed tworzeniem wielu połączeń w trybie deweloperskim
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;