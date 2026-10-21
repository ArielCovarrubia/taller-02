import { randomUUID } from "node:crypto"
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"

import { Pet } from "./pets.entity"
import { PetsRepository } from "./pets.repository"
import { CreatePetDto, UpdatePetDto } from "@/pets/pets.dtos"
import { StudentsService } from "@/students/students.service"

@Injectable()
export class PetsService {
	constructor(
		private readonly petsRepository: PetsRepository,
		private readonly studentsService: StudentsService,
	) {}

	public async findAllForStudent(studentId: string): Promise<Pet[]> {
		await this.assertStudentExists(studentId)

		return this.petsRepository
			.findAllByStudent(studentId)
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
	}

	public async create(studentId: string, data: CreatePetDto): Promise<Pet> {
		await this.assertStudentExists(studentId)
		this.assertNoConflicts(studentId, data)

		const now = new Date()
		const pet: Pet = {
			id: randomUUID(),
			studentId,
			name: data.name,
			species: data.species,
			age: data.age,
			createdAt: now,
			updatedAt: now,
		}

		return this.petsRepository.save(pet)
	}

	public async update(studentId: string, petId: string, data: UpdatePetDto): Promise<Pet> {
		const existing = await this.findOwned(studentId, petId)
		this.assertNoConflicts(studentId, data, petId)

		const updated: Pet = {
			...existing,
			name: data.name ?? existing.name,
			species: data.species ?? existing.species,
			age: data.age ?? existing.age,
			updatedAt: new Date(),
		}

		return this.petsRepository.save(updated)
	}

	public async delete(studentId: string, petId: string): Promise<Pet> {
		const existing = await this.findOwned(studentId, petId)
		this.petsRepository.delete(petId)
		return existing
	}

	public async deleteAllForStudent(studentId: string): Promise<void> {
		this.petsRepository.deleteByStudent(studentId)
	}

	private async findOwned(studentId: string, petId: string): Promise<Pet> {
		await this.assertStudentExists(studentId)

		const pet = this.petsRepository.findById(petId)

		if (!pet || pet.studentId !== studentId) {
			throw new NotFoundException("Mascota no encontrada")
		}

		return pet
	}

	private async assertStudentExists(studentId: string): Promise<void> {
		await this.studentsService.findById(studentId)
	}

	private assertNoConflicts(studentId: string, data: { name?: string }, exceptId?: string): void {
		if (!data.name) return

		const existing = this.petsRepository.findByStudentAndName(studentId, data.name)

		if (existing && existing.id !== exceptId) {
			throw new ConflictException({
				message: "Conflicto con datos existentes",
				errors: {
					name: { message: "Ya tienes una mascota con ese nombre" },
				},
			})
		}
	}
}
