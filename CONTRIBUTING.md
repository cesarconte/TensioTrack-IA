# Contributing to TensioTrack

Gracias por contribuir a TensioTrack. Este documento define el flujo de trabajo recomendado para mantener calidad, trazabilidad y coherencia médica (AMPA).

## Requisitos previos

- Node.js LTS (recomendado: 20+)
- npm 10+
- Git
- Dependencias instaladas con `npm install`

## Convenciones de código

- TypeScript con `strict: true`
- Nombres en ingles para simbolos (variables, funciones, tipos)
- Lint y type-check deben pasar antes de abrir PR
- Cambios de logica medica deben incluir tests unitarios
- Evitar mezclar refactor grande con bugfix en el mismo commit

## Convencion de commits

Usamos **Conventional Commits**:

- `feat:` nueva funcionalidad
- `fix:` correccion de bug
- `refactor:` mejora interna sin cambio funcional
- `test:` cambios en tests
- `docs:` documentacion
- `chore:` tareas de mantenimiento

Ejemplos:

- `fix: correct clinical status thresholds in history`
- `docs: add security policy and testing strategy`

## Flujo de ramas

- Base: `main`
- Crear rama por cambio:
  - `feature/<descripcion-corta>`
  - `fix/<descripcion-corta>`
  - `docs/<descripcion-corta>`
- Abrir PR pequeno y enfocado
- No mezclar multiples objetivos no relacionados

## Checklist antes de abrir PR

- [ ] `npm run lint`
- [ ] `npm run test -- --run`
- [ ] Si aplica, evidencias manuales en UI
- [ ] Documentacion actualizada si cambia comportamiento
- [ ] Sin secretos ni credenciales en codigo

## Recomendaciones de revision

- Priorizar regresiones funcionales y reglas medicas AMPA
- Verificar umbrales clinicos y mensajes al usuario
- Confirmar accesibilidad basica (teclado, foco, labels)
- Revisar naming y legibilidad (KISS/DRY/YAGNI)

