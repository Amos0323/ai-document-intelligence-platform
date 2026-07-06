import { PrismaClient } from "@prisma/client"
import path from "node:path"

const localDatabaseUrl = `file:${path.resolve("prisma", "dev.db").replaceAll("\\", "/")}`

export const db = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? localDatabaseUrl,
})
