import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { isUUID } from "class-validator"
import { DeepPartial, EntityManager, Repository } from "typeorm"

import { Pet } from "./pets.entity"

@Injectable()
export class PetsRepository {
	constructor(
		@InjectRepository(Pet)
		private readonly repository: Repository<Pet>,
	) {}

	private repo(manager?: EntityManager): Repository<Pet> {
		return manager ? manager.getRepository(Pet) : this.repository
	}

	public findAllByStudent(studentId: string, manager?: EntityManager): Promise<Pet[]> {
		return this.repo(manager).find({ where: { studentId }, order: { createdAt: "DESC" } })
	}

	public async findById(id: string, manager?: EntityManager): Promise<Pet | null> {
		if (!isUUID(id)) return null
		return this.repo(manager).findOneBy({ id })
	}

	public findByStudentAndName(
		studentId: string,
		name: string,
		manager?: EntityManager,
	): Promise<Pet | null> {
		return this.repo(manager).findOneBy({ studentId, name })
	}

	public save(pet: DeepPartial<Pet>, manager?: EntityManager): Promise<Pet> {
		const repo = this.repo(manager)
		return repo.save(repo.create(pet))
	}

	public async delete(id: string, manager?: EntityManager): Promise<void> {
		await this.repo(manager).delete({ id })
	}

	public async deleteByStudent(studentId: string, manager?: EntityManager): Promise<void> {
		await this.repo(manager).delete({ studentId })
	}
}
