import { Injectable } from "@nestjs/common"

import { Student } from "./students.entity"
import { InMemoryStore } from "@/shared/in-memory-store"

@Injectable()
export class StudentsRepository {
	private readonly store = new InMemoryStore<Student>()

	public findAll(): Student[] {
		return this.store.findAll()
	}

	public findById(id: string): Student | undefined {
		return this.store.get(id)
	}

	public findByEmail(email: string): Student | undefined {
		return this.store.findBy((student) => student.email === email)[0]
	}

	public findByUsername(username: string): Student | undefined {
		return this.store.findBy((student) => student.username === username)[0]
	}

	public save(student: Student): Student {
		this.store.set(student)
		return student
	}

	public delete(id: string): void {
		this.store.delete(id)
	}
}
