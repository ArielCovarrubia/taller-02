import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Relation,
	UpdateDateColumn,
} from "typeorm"

import { Student } from "@/students/students.entity"

@Entity("pets")
@Index("UQ_pets_student_name", ["studentId", "name"], { unique: true })
export class Pet {
	@PrimaryGeneratedColumn("uuid")
	id!: string

	@Column({ name: "student_id", type: "uuid" })
	studentId!: string

	@ManyToOne(() => Student, (student) => student.pets, { onDelete: "CASCADE" })
	@JoinColumn({ name: "student_id" })
	student?: Relation<Student>

	@Column({ type: "varchar", length: 50 })
	name!: string

	@Column({ type: "varchar", length: 50 })
	species!: string

	@Column({ type: "int", nullable: true })
	age?: number | null

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date

	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt!: Date
}
