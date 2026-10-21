import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { map, Observable } from "rxjs"
import { ApiResponse } from "./response"

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
		const request = context.switchToHttp().getRequest()
		const method: string = request.method

		return next.handle().pipe(
			map((data) => {
				const response = context.switchToHttp().getResponse()
				const code = method === "POST" ? 201 : response.statusCode

				if (method === "POST") {
					response.status(code)
				}

				return new ApiResponse(
					code,
					true,
					this.getMessage(method),
					new Date().toISOString(),
					data,
				)
			}),
		)
	}

	private getMessage(method: string): string {
		switch (method) {
			case "GET":
				return "Operación exitosa"
			case "POST":
				return "Recurso creado"
			case "PATCH":
				return "Recurso actualizado"
			case "DELETE":
				return "Recurso eliminado"
			default:
				return "OK"
		}
	}
}
