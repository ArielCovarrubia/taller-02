import { AppModule } from "@/app.module"
import { NestFactory } from "@nestjs/core"
import { BadRequestException, ValidationPipe } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AllExceptionsFilter } from "@/shared/all-exceptions.filter"
import { ResponseInterceptor } from "@/shared/response.interceptor"
import { ValidationError } from "class-validator"

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.useStaticAssets("public")

	app.useGlobalFilters(new AllExceptionsFilter())
	app.useGlobalInterceptors(new ResponseInterceptor())

	app.enableCors({
		origin: "*",
	})

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			exceptionFactory: (errors: ValidationError[]) => new BadRequestException(errors),
		}),
	)

	const config = new DocumentBuilder()
		.setTitle("NestJS CRUD Students & Pets")
		.setDescription("API de un CRUD en memoria para la entidad Student y sus mascotas (Pet)")
		.setVersion("1.0")
		.build()

	const document = SwaggerModule.createDocument(app, config)

	SwaggerModule.setup("docs", app, document)

	await app.listen(3000, "0.0.0.0")

	console.log("Application running on: http://localhost:3000")
	console.log("Documentation at: http://localhost:3000/docs")
}

bootstrap()
