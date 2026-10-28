/**
 * Verificación de transacciones con rollback (Taller Evaluado II).
 *
 * Ejecuta el código REAL de la API (StudentsService) contra PostgreSQL y fuerza
 * errores para comprobar que, cuando algo falla a mitad de camino, se hace
 * ROLLBACK y los datos quedan intactos.
 *
 *   Caso 1: DELETE de un estudiante falla DESPUÉS de borrar sus mascotas.
 *   Caso 2: POST de un estudiante falla en su 2ª mascota (nombre duplicado).
 *
 * Uso:  make verify-rollback      (o: pnpm run verify:rollback dentro del contenedor)
 */
import { NestFactory } from "@nestjs/core"
import { ConflictException } from "@nestjs/common"

import { AppModule } from "@/app.module"
import { PetsRepository } from "@/pets/pets.repository"
import { StudentsRepository } from "@/students/students.repository"
import { StudentsService } from "@/students/students.service"

const results: Array<{ name: string; ok: boolean }> = []

function check(name: string, ok: boolean, detail: string) {
	results.push({ name, ok })
	console.log(`${ok ? "  ✔" : "  ✘"} ${name} -> ${detail}`)
}

async function main() {
	const app = await NestFactory.createApplicationContext(AppModule, {
		logger: ["error", "warn"],
	})

	const students = app.get(StudentsService)
	const studentsRepo = app.get(StudentsRepository)
	const petsRepo = app.get(PetsRepository)

	const suffix = Date.now().toString(36)

	// ------------------------------------------------------------------
	console.log(
		"\n=== Caso 1: DELETE de estudiante con error forzado a mitad de la transacción ===",
	)

	const student = await students.create({
		name: "Estudiante Rollback",
		username: `rollback_${suffix}`,
		email: `rollback_${suffix}@example.com`,
		age: 21,
		pets: [
			{ name: "Firulais", species: "perro", age: 3 },
			{ name: "Michi", species: "gato" },
		],
	})

	const petsBefore = await petsRepo.findAllByStudent(student.id)
	console.log(`Antes:   estudiante existe = true, mascotas = ${petsBefore.length}`)

	// Forzamos que el borrado del estudiante falle (las mascotas ya fueron borradas
	// dentro de la misma transacción cuando esto ocurre).
	const originalDelete = studentsRepo.delete.bind(studentsRepo)
	studentsRepo.delete = async () => {
		throw new Error("ERROR FORZADO: falla al eliminar el estudiante")
	}

	let failed = false
	try {
		await students.delete(student.id)
	} catch (error) {
		failed = true
		console.log(`Error capturado: ${(error as Error).message}`)
	} finally {
		studentsRepo.delete = originalDelete
	}

	const studentAfter = await studentsRepo.findById(student.id)
	const petsAfter = await petsRepo.findAllByStudent(student.id)
	console.log(
		`Después: estudiante existe = ${studentAfter !== null}, mascotas = ${petsAfter.length}`,
	)

	check("la operación falló como se esperaba", failed, "se lanzó el error forzado")
	check("el estudiante sigue existiendo", studentAfter !== null, "no se perdió")
	check(
		"las mascotas siguen intactas (no quedaron huérfanas ni borradas)",
		petsAfter.length === petsBefore.length,
		`${petsAfter.length}/${petsBefore.length}`,
	)

	// Limpieza real: sin error forzado, el borrado sí se confirma (COMMIT).
	await students.delete(student.id)
	const gone = await studentsRepo.findById(student.id)
	const petsGone = await petsRepo.findAllByStudent(student.id)
	check(
		"sin error, el DELETE hace COMMIT y borra estudiante + mascotas",
		gone === null && petsGone.length === 0,
		`estudiante=${gone === null ? "borrado" : "existe"}, mascotas=${petsGone.length}`,
	)

	// ------------------------------------------------------------------
	console.log(
		"\n=== Caso 2: POST de estudiante con mascotas duplicadas (falla en la 2ª mascota) ===",
	)

	const username = `dup_${suffix}`
	let conflict = false
	try {
		await students.create({
			name: "Estudiante Duplicado",
			username,
			email: `${username}@example.com`,
			age: 22,
			pets: [
				{ name: "Rex", species: "perro" },
				{ name: "Rex", species: "perro" },
			],
		})
	} catch (error) {
		conflict = error instanceof ConflictException
		console.log(`Error capturado: ${(error as Error).message}`)
	}

	const orphan = await studentsRepo.findByUsername(username)
	check("la creación falló con 409 Conflict", conflict, "mascota duplicada")
	check(
		"el estudiante NO quedó guardado (rollback de la 1ª mascota y del estudiante)",
		orphan === null,
		orphan === null ? "no existe en la BD" : "¡quedó guardado!",
	)

	// ------------------------------------------------------------------
	const allOk = results.every((r) => r.ok)
	console.log(
		`\nRESULTADO: ${allOk ? "TODAS LAS VERIFICACIONES PASARON ✔" : "HAY VERIFICACIONES FALLIDAS ✘"}\n`,
	)

	await app.close()
	process.exit(allOk ? 0 : 1)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
