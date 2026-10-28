import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateStudentsAndPets1793117674427 implements MigrationInterface {
	name = "CreateStudentsAndPets1793117674427"

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Necesaria para uuid_generate_v4() (la migración queda autosuficiente en una BD vacía)
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
		await queryRunner.query(
			`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "username" character varying(30) NOT NULL, "email" character varying(255) NOT NULL, "age" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fa8c3b4233deabc0917380ef4ef" UNIQUE ("username"), CONSTRAINT "UQ_25985d58c714a4a427ced57507b" UNIQUE ("email"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
		)
		await queryRunner.query(
			`CREATE TABLE "pets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "species" character varying(50) NOT NULL, "age" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d01e9e7b4ada753c826720bee8b" PRIMARY KEY ("id"))`,
		)
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_pets_student_name" ON "pets"  ("student_id", "name") `,
		)
		await queryRunner.query(
			`ALTER TABLE "pets" ADD CONSTRAINT "FK_f2db5a896038bb47dd8e4901627" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "pets" DROP CONSTRAINT "FK_f2db5a896038bb47dd8e4901627"`,
		)
		await queryRunner.query(`DROP INDEX "public"."UQ_pets_student_name"`)
		await queryRunner.query(`DROP TABLE "pets"`)
		await queryRunner.query(`DROP TABLE "students"`)
	}
}
