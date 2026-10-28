import { join } from "node:path"
import { DataSource } from "typeorm"

// Funciona tanto con ts-node (src/*.ts) como compilado (dist/*.js).
const ext = __filename.endsWith(".ts") ? "ts" : "js"

/**
 * DataSource usado SOLO por el CLI de TypeORM (migraciones).
 * La API en ejecución usa la configuración de TypeOrmModule en app.module.ts.
 */
export default new DataSource({
	type: "postgres",
	url: process.env.DATABASE_URL,
	entities: [join(__dirname, "..", "**", `*.entity.${ext}`)],
	migrations: [join(__dirname, "migrations", `*.${ext}`)],
	synchronize: false,
})
