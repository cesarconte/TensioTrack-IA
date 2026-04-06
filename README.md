# TensioTrack

Aplicacion web personal para registro y analisis de presion arterial basada en protocolo **AMPA**.

## Objetivo

Proveer una herramienta privada y profesional para:

- registrar lecturas de tension de forma guiada
- calcular promedios clinicos por sesion, dia y periodo
- visualizar tendencia y preparar informacion util para consulta medica

## Requisitos previos

- Node.js 20+
- npm 10+

## Instalacion

```bash
npm install
```

## Arranque en desarrollo

```bash
npm run dev
```

## Scripts disponibles

- `npm run dev` inicia entorno de desarrollo con Vite
- `npm run build` genera build de produccion
- `npm run test` ejecuta tests con Vitest (watch/interactive)
- `npm run test -- --run` ejecuta tests una sola vez (CI/local)
- `npm run lint` ejecuta type-check con TypeScript

Nota: `test:e2e` esta definido en la estrategia de proyecto y se incorporara con Playwright en la fase correspondiente.

## Estructura principal

- `src/components`: componentes UI
- `src/domain`: logica de negocio pura (promedios, reglas clinicas)
- `src/lib`: capa de datos y utilidades de aplicacion
- `docs`: guias funcionales y ADRs

## Documentacion relacionada

- [AGENTS](./AGENTS.md)
- [Medical Guidelines (AMPA)](./docs/medical-guidelines.md)
- [Accessibility Checklist](./ACCESSIBILITY.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Testing Strategy](./TESTING.md)
- [Security Policy](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture Decision Records](./docs/adr/README.md)
- [Changelog](./CHANGELOG.md)
