import { Module } from "@nestjs/common"
import { PetsModule } from "@/pets/pets.module"
import { StudentsModule } from "@/students/students.module"

@Module({
	imports: [StudentsModule, PetsModule],
})
export class AppModule {}
