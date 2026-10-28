import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { StudentsService } from "@/students/students.service"
import { StudentsController } from "@/students/students.controller"
import { StudentsRepository } from "@/students/students.repository"
import { Student } from "@/students/students.entity"
import { PetsModule } from "@/pets/pets.module"

@Module({
	imports: [TypeOrmModule.forFeature([Student]), forwardRef(() => PetsModule)],
	controllers: [StudentsController],
	providers: [StudentsService, StudentsRepository],
	exports: [StudentsService, StudentsRepository],
})
export class StudentsModule {}
