# ADR-002 — SQLite + Prisma para app personal

**Estado**: Aceptado  
**Fecha**: 2026-04-06

## Contexto

TensioTrack es una aplicacion personal orientada a privacidad, uso local y simplicidad operativa. Se requiere persistencia confiable sin introducir dependencias complejas de infraestructura.

## Decisión

Se adopta:

- **SQLite** como motor de base de datos local
- **Prisma ORM** como capa de acceso tipada y migraciones

Esta combinacion minimiza la friccion de setup y mantiene buena mantenibilidad.

## Alternativas consideradas

- **PostgreSQL remoto**: mas potente para multiusuario real, pero innecesario para alcance actual.
- **Firestore como fuente principal**: util para sincronizacion, pero incrementa complejidad de reglas/consistencia para logica medica central.
- **LocalStorage/IndexedDB sin ORM**: insuficiente para modelo relacional y evolucion controlada del esquema.

## Consecuencias

### Positivas

- Setup rapido y portable
- Control total de datos en entorno local
- Migraciones versionadas con Prisma

### Negativas

- Menor escalabilidad horizontal inmediata
- Requiere revisar estrategia si se vuelve colaborativa/multiusuario

### Disparadores para revisar esta decision

- Requisito de cuentas multiusuario simultaneas
- Sincronizacion en tiempo real entre dispositivos como requerimiento principal
- Necesidad de analitica avanzada con volumen alto de datos

