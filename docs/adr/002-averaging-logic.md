# ADR-002 (LEGACY) — Lógica de Promedios

**Estado**: Superado por ADR-003
**Fecha**: 2026-04-06

## Contexto
El cálculo de promedios de tensión arterial debe seguir el protocolo AMPA de 4 niveles.

## Decisión
- La lógica se implementará en la **capa de dominio/negocio** del servidor.
- Se usará **redondeo a 1 decimal**.
- Solo se calculan promedios diarios si ambas sesiones (mañana/noche) están completas (3 tomas cada una).

## Consecuencias
- Integridad total de los datos médicos.
- El cliente solo muestra datos procesados, evitando errores de cálculo en la UI.

> Nota: Este documento se mantiene por trazabilidad historica.
> La version vigente es `docs/adr/003-averaging-logic.md`.
