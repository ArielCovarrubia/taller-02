.PHONY: help install dev-local build lint format format-check clean-local check-tools \
        env dev prod down clean logs ps migrate migrate-prod migrate-revert migrate-show verify-rollback

COMPOSE := docker compose

help:
	@echo "Docker (taller):"
	@echo "  make dev              Levanta db + adminer + api (desarrollo, hot reload)"
	@echo "  make prod             Levanta db + adminer + api (produccion, sin --watch)"
	@echo "  make down             Detiene contenedores (los datos se conservan en el volumen)"
	@echo "  make clean            Detiene y BORRA volumenes (docker compose down -v)"
	@echo "  make migrate          Aplica migraciones de TypeORM (equivale a "upgrade head") en dev"
	@echo "  make migrate-prod     Aplica migraciones en el contenedor de produccion"
	@echo "  make migrate-revert   Revierte la ultima migracion (dev)"
	@echo "  make migrate-show     Muestra el estado de las migraciones (dev)"
	@echo "  make verify-rollback  Demuestra el rollback de transacciones (dev)"
	@echo "  make logs             Logs de los contenedores"
	@echo "  make ps               Estado de los contenedores"
	@echo ""
	@echo "Local (sin Docker):"
	@echo "  make install | dev-local | build | lint | format | format-check | clean-local"

# ---------------------------------------------------------------------------
# Docker Compose
# ---------------------------------------------------------------------------

# Crea .env desde la plantilla si no existe (un solo comando para levantar todo)
env:
	@test -f .env || (cp .env.example .env && echo ".env creado desde .env.example")

dev: env
	$(COMPOSE) --profile dev up -d --build

prod: env
	$(COMPOSE) --profile prod up -d --build

down:
	$(COMPOSE) --profile dev --profile prod down

clean:
	$(COMPOSE) --profile dev --profile prod down -v

logs:
	$(COMPOSE) --profile dev --profile prod logs -f --tail=100

ps:
	$(COMPOSE) --profile dev --profile prod ps

# Migraciones TypeORM (se ejecutan DENTRO del contenedor de la API, que ve a la BD como host "db").
# En dev el codigo compilado (dist/) lo genera `nest start --watch`; esperamos a que exista.
migrate:
	@$(COMPOSE) ps -q api | grep -q . || { echo "La API no esta corriendo. Ejecuta 'make dev' primero."; exit 1; }
	@for i in $$(seq 1 60); do $(COMPOSE) exec -T api test -f dist/database/data-source.js && break; echo "Esperando compilacion de la API ($$i/60)..."; sleep 2; done
	$(COMPOSE) exec -T api pnpm run migration:run

migrate-prod:
	$(COMPOSE) exec -T api-prod pnpm run migration:run

migrate-revert:
	$(COMPOSE) exec -T api pnpm run migration:revert

migrate-show:
	$(COMPOSE) exec -T api pnpm run migration:show

verify-rollback:
	$(COMPOSE) exec -T api pnpm run verify:rollback

# ---------------------------------------------------------------------------
# Local (sin Docker)
# ---------------------------------------------------------------------------

check-tools:
	@if ! command -v node >/dev/null 2>&1; then \
		echo "Node.js no esta instalado. Instalalo aqui: https://nodejs.org/"; \
		exit 1; \
	fi
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "pnpm no esta instalado. Instalalo aqui: https://pnpm.io/installation"; \
		exit 1; \
	fi

install: check-tools
	pnpm install

dev-local:
	pnpm run start:dev

build:
	pnpm run build

lint:
	pnpm run lint

format:
	pnpm run format

format-check:
	pnpm run format:check

clean-local:
	rm -rf dist coverage node_modules
