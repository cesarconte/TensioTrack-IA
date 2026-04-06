# AGENTS.md — TensioTrack Source of Truth

Este archivo es la fuente de verdad para cualquier agente de IA que trabaje en el repositorio de **TensioTrack**.

## 🎯 Objetivo del Proyecto
Proporcionar una herramienta profesional y privada para el seguimiento de la presión arterial siguiendo el protocolo médico **AMPA**.

## 🩺 Reglas Médicas (Protocolo AMPA)
- **Sesiones**: Mañana (antes de desayunar) y Noche (antes de cenar).
- **Tomas**: Exactamente 3 lecturas por sesión, separadas 1-3 minutos.
- **Regla de los 30 min**: Sin comida, café, ejercicio, tabaco o alcohol antes de la toma.
- **Rangos**: PAS (60-300), PAD (40-200), FC (30-250).

## 📊 Lógica de Promedios (Jerarquía)
1. **Sesión**: Media de las 3 lecturas.
2. **Día**: Media de las sesiones de mañana y noche (si ambas están completas).
3. **Período (5 días)**: Media de los 5 promedios de mañana y noche.
4. **Final**: Media de los promedios de mañana y noche del período.

## 🏗️ Arquitectura Técnica
- **Stack**: Next.js 15 / Express + Vite + SQLite + Prisma.
- **Estilo**: Tailwind CSS v4 + shadcn/ui.
- **Validación**: Zod (schemas en `src/lib/schemas.ts`).
- **Estado**: TanStack Query (servidor) + Zustand (UI).
- **Testing**: Vitest + RTL + Playwright.

## 📁 Estructura de Carpetas
- `/src/components`: Componentes UI reutilizables.
- `/src/domain`: Lógica de negocio pura (cálculos de promedios).
- `/src/application`: Casos de uso y servicios de API.
- `/src/infrastructure`: Configuración de Prisma y base de datos.
- `/docs`: Documentación detallada y ADRs.

## 🧪 Guía de Testing
- **TDD Obligatorio**: Red -> Green -> Refactor.
- **Cobertura**: Mínimo 80% en lógica de negocio (`src/domain`).
- **E2E**: Flujos críticos de registro de tomas.

---
*Última actualización: 2026-04-06*
