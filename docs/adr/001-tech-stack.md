# ADR-001 — Stack Tecnológico

**Estado**: Aceptado
**Fecha**: 2026-04-06

## Contexto
Se requiere una aplicación personal de seguimiento de salud con persistencia local, alta calidad visual y rigor médico.

## Decisión
Se elige el siguiente stack:
- **Next.js 15 / Express + Vite**: Para soportar lógica de servidor y base de datos.
- **SQLite + Prisma**: Persistencia local robusta, ligera y con tipos seguros.
- **Tailwind CSS v4 + shadcn/ui**: Desarrollo rápido de UI accesible y estética.
- **Zod**: Validación de datos en toda la cadena (API y UI).

## Alternativas consideradas
- **Firebase**: Descartado por la preferencia de SQLite/SQL del usuario.
- **LocalStorage**: Descartado por falta de robustez para relaciones complejas (Sesiones/Días/Períodos).

## Consecuencias
- Mayor complejidad inicial al configurar el servidor.
- Excelente mantenibilidad y extensibilidad.
- Datos 100% privados y locales.
