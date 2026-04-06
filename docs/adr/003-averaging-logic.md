# ADR-003 — Logica de promedios AMPA y redondeo

**Estado**: Aceptado  
**Fecha**: 2026-04-06

## Contexto

La aplicacion debe respetar el protocolo AMPA y producir resultados consistentes para sesiones, dias y periodos. Cualquier inconsistencia impacta directamente en interpretaciones clinicas.

## Decisión

- Implementar la jerarquia de promedio en **capa de dominio**:
  1. Promedio de sesion (3 lecturas)
  2. Promedio diario (manana + noche)
  3. Promedio de periodo (5 dias)
  4. Promedio final del periodo
- Aplicar redondeo uniforme a **1 decimal**
- Mantener funciones puras y testeables
- Evitar calcular reglas clinicas medicas complejas en UI sin una funcion de dominio compartida

## Alternativas consideradas

- Calculo en cliente para toda la jerarquia: descartado por riesgo de divergencia y menor trazabilidad.
- Redondeo solo al final: descartado por diferencias acumuladas frente a expectativa del producto.
- Logica mezclada entre componentes UI: descartado por baja mantenibilidad.

## Consecuencias

### Positivas

- Reproducibilidad y consistencia de resultados
- Tests unitarios directos y rapidos
- Menor riesgo de regresion al refactorizar UI

### Negativas

- Mayor disciplina para mantener el dominio como fuente unica
- Necesidad de actualizar tests cuando cambian reglas medicas

