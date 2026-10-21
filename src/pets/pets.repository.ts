import { Injectable } from "@nestjs/common"

import { Pet } from "./pets.entity"
import { InMemoryStore } from "@/shared/in-memory-store"

@Injectable()
export class PetsRepository {
	private readonly store = new InMemoryStore<Pet>()

	public findAllByStudent(studentId: string): Pet[] {
		return this.store.findBy((pet) => pet.studentId === studentId)
	}

	public findById(id: string): Pet | undefined {
		return this.store.get(id)
	}

	public findByStudentAndName(studentId: string, name: string): Pet | undefined {
		return this.store.findBy((pet) => pet.studentId === studentId && pet.name === name)[0]
	}

	public save(pet: Pet): Pet {
		this.store.set(pet)
		return pet
	}

	public delete(id: string): void {
		this.store.delete(id)
	}

	public deleteByStudent(studentId: string): void {
		this.store.deleteBy((pet) => pet.studentId === studentId)
	}
}
