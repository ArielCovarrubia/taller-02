import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PetsModule } from "@/pets/pets.module"
import { StudentsModule } from "@/students/students.module"

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRoot({
			type: "postgres",
			url: process.env.DATABASE_URL,
			autoLoadEntities: true,
			synchronize: false,
		}),
		StudentsModule,
		PetsModule,
	],
})
export class AppModule {}
