import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { isUUID } from "class-validator"
import { DeepPartial, EntityManager, Repository } from "typeorm"

import { Student } from "./students.entity"

@Injectable()
export class StudentsRepository {
	constructor(
		@InjectRepository(Student)
		private readonly repository: Repository<Student>,
	) {}

	// Si se entrega un `manager`, la operación participa en esa transacción.
	private repo(manager?: EntityManager): Repository<Student> {
		return manager ? manager.getRepository(Student) : this.repository
	}

	public findAll(manager?: EntityManager): Promise<Student[]> {
		return this.repo(manager).find({ order: { createdAt: "DESC" } })
	}

	public async findById(id: string, manager?: EntityManager): Promise<Student | null> {
		// Un id con formato inválido haría fallar a Postgres (500); lo tratamos como "no existe".
		if (!isUUID(id)) return null
		return this.repo(manager).findOneBy({ id })
	}

	public findByEmail(email: string, manager?: EntityManager): Promise<Student | null> {
		return this.repo(manager).findOneBy({ email })
	}

	public findByUsername(username: string, manager?: EntityManager): Promise<Student | null> {
		return this.repo(manager).findOneBy({ username })
	}

	public save(student: DeepPartial<Student>, manager?: EntityManager): Promise<Student> {
		const repo = this.repo(manager)
		return repo.save(repo.create(student))
	}

	public async delete(id: string, manager?: EntityManager): Promise<void> {
		await this.repo(manager).delete({ id })
	}
}
