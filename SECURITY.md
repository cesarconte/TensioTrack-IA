# Security Policy

## Supported Versions

Actualmente se da soporte de seguridad a la rama activa de `main`.

| Version | Supported |
| ------- | --------- |
| main    | yes       |

## Reporting a Vulnerability

Si encuentras una vulnerabilidad:

1. **No** abras un issue publico con detalles explotables.
2. Reporta por canal privado al mantenedor del repositorio.
3. Incluye:
   - Descripcion del riesgo
   - Pasos para reproducir
   - Impacto potencial
   - Mitigacion sugerida (si aplica)

## Response Targets

- Confirmacion de recepcion: dentro de 72 horas
- Evaluacion inicial: dentro de 7 dias
- Plan de remediacion: segun severidad (critica/alta/media/baja)

## Security Practices in This Project

- Validacion de entradas en cliente y servidor
- Type safety con TypeScript strict
- Persistencia local (SQLite) para minimizar superficie externa
- Reglas de acceso y validacion de datos para almacenamiento remoto (cuando aplique)
- Sin secretos en codigo fuente

## Disclosure

Cuando una vulnerabilidad se corrija:

- Se registrara en `CHANGELOG.md`
- Se notificara de forma responsable, sin exponer detalles innecesarios de explotacion

