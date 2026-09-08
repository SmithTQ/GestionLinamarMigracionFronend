# Linamar Gestion Frontend

Frontend administrativo de Linamar Gestion construido con Angular 21, Signals, componentes standalone, Tailwind CSS y DaisyUI.

## Requisitos

- Node.js compatible con Angular 21.
- npm.
- Backend Laravel disponible en `http://localhost:8000/api/v1` para desarrollo.

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm start
```

La aplicacion queda disponible en `http://localhost:4200`.

## Validacion

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox
```

## Ambientes

La configuracion de API se encuentra en:

- Desarrollo: `src/environments/environment.ts`.
- Produccion: `src/environments/environment.prod.ts`.

## Estrategia de ramas

La estrategia replica el repositorio backend:

- `main`: codigo estable y listo para produccion.
- `qa`: validacion integrada y pruebas de aceptacion.
- `dev`: desarrollo activo de funcionalidades.

Flujo recomendado:

1. Crear una rama de trabajo desde `dev`.
2. Integrar los cambios en `dev` mediante pull request.
3. Promover `dev` hacia `qa` para validacion.
4. Promover `qa` hacia `main` para publicacion.

## Estructura principal

```text
src/app/core       Servicios globales, autenticacion, guards e HTTP.
src/app/shared     Componentes, pipes y utilidades reutilizables.
src/app/features   Modulos funcionales del sistema.
```

## Notas

- Las rutas administrativas requieren autenticacion y permisos.
- El backend es la autoridad definitiva para autorizacion y reglas de negocio.
- No se deben versionar credenciales, tokens, `node_modules`, `dist` ni caches locales.
