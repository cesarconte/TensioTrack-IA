# ADR-002 — Lógica de Promedios

**Estado**: Aceptado
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
