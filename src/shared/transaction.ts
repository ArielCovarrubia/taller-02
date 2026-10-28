import { Logger } from "@nestjs/common"
import { DataSource, EntityManager } from "typeorm"

const logger = new Logger("Transaction")

/**
 * Ejecuta `work` dentro de una transacción atómica.
 *
 * - Si `work` termina bien  -> COMMIT.
 * - Si `work` lanza un error -> ROLLBACK explícito (nada queda guardado) y se relanza el error.
 *
 * Todas las operaciones de la transacción deben usar el `manager` recibido.
 */
export async function runInTransaction<T>(
	dataSource: DataSource,
	work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
	const queryRunner = dataSource.createQueryRunner()

	await queryRunner.connect()
	await queryRunner.startTransaction()

	try {
		const result = await work(queryRunner.manager)
		await queryRunner.commitTransaction()
		return result
	} catch (error) {
		await queryRunner.rollbackTransaction()
		const reason = error instanceof Error ? error.message : String(error)
		logger.warn(`ROLLBACK ejecutado. Motivo: ${reason}`)
		throw error
	} finally {
		await queryRunner.release()
	}
}
