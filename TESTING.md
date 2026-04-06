# Testing Strategy

Este documento resume la estrategia de testing de TensioTrack por capas.

## Objetivos

- Proteger la logica medica AMPA contra regresiones
- Validar flujos criticos de captura de lecturas
- Mantener una base confiable para refactorizaciones

## Herramientas

- **Unit/Integration:** Vitest
- **UI component tests:** React Testing Library
- **E2E:** Playwright (pendiente de completarse en este repo)

## Que se testea por capa

### `src/domain`

- Calculos puros de promedios (Niveles 1-4)
- Clasificacion clinica de lecturas
- Reglas de redondeo y bordes

Meta: cobertura minima 80% en esta capa.

### `src/application` / `src/lib`

- Casos de uso y transformaciones de datos
- Integracion con servicios de datos (mockeada cuando corresponda)

### `src/components`

- Render de estados clave (normal, warning, high, danger)
- Interacciones principales del formulario

### E2E (Playwright)

Flujos criticos a cubrir:

- Registro de 3 lecturas por sesion
- Visualizacion correcta en historial
- Exportacion de datos

## Convenciones de naming

- `*.test.ts` para logica de dominio/utilidades
- `*.test.tsx` para componentes React

## Ejecucion de tests

- Ejecutar tests unitarios/integracion:
  - `npm run test -- --run`
- Modo watch para desarrollo:
  - `npm run test`
- Type check/lint:
  - `npm run lint`

## Criterios de aceptacion para cambios

- Todos los tests existentes en verde
- Test nuevo para cada bug funcional corregido
- No degradar cobertura en logica critica

