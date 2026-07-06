import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(".env.local"), quiet: true })
dotenv.config({ path: path.resolve("..", ".env.local"), quiet: true })
dotenv.config({ path: path.resolve(".env"), quiet: true })

