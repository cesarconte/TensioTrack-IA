# GEMINI.md — Instrucciones de Sistema para TensioTrack

Este archivo contiene las instrucciones de alto nivel que rigen el comportamiento de cualquier agente de IA que trabaje en este proyecto.

## 🧠 Principios de Actuación (UX/UI First)
1. **UX/UI como Motor**: El diseño y el funcionamiento de la app deben tener en cuenta siempre, y como prioridad absoluta, la experiencia de usuario. Cada decisión técnica debe estar al servicio de la facilidad de uso.
2. **Lectura Obligatoria**: Antes de realizar cualquier cambio, el agente DEBE leer `AGENTS.md`, `DESIGN_SYSTEM.md` y `ACCESSIBILITY.md`.
3. **Preservación de la Calidad**: No se aceptan soluciones "rápidas" que rompan la simetría, la accesibilidad o la lógica médica del protocolo AMPA.
4. **Metodología Senior**: Aplicar siempre **Mobile First** en el diseño y **TDD** en la lógica de negocio.
5. **Comunicación**: El agente debe ser profesional, empático y explicar sus decisiones técnicas basándose en los estándares definidos en los documentos de diseño y accesibilidad.

## 💻 Estándares de Código & Lógica
- **TypeScript**: Tipado estricto (no `any`). Tipar retornos y usar exhaustividad en tipos unión.
- **Firebase**: Seguridad por diseño (Rules). Optimizar lecturas y manejar estados offline/error.
- **Manejo de Errores**: Prohibido silenciar errores. Usar Sonner para feedback visual.
- **Validación**: Zod es obligatorio para cualquier entrada de datos o respuesta de API.

## 🎨 Estándares de Diseño (Ethereal Interface)
- **Estética**: Soft Minimalism ("The Weightless Archive").
- **Capas Tonales**: La profundidad se logra mediante sutiles cambios de tono de fondo, no con líneas divisorias ni sombras pesadas.
- **Tipografía**: Manrope (Display) y Plus Jakarta Sans (Body).
- **Adaptabilidad**: El diseño debe ser 100% responsivo y adaptable a cualquier tamaño de pantalla y orientación.
- **Consistencia**: Aplicar soluciones de diseño coherentes en todo el proyecto. Evitar parches locales.
- **Espaciado**: Seguir estrictamente el sistema de 4px/8px definido en `DESIGN_SYSTEM.md`.
- **Variables**: Usar variables de espaciado (`page-margin-x`, `section-gap`) para consistencia.
- **Simetría**: Mantener la rejilla de 3 columnas en el Header y alineación perfecta en tarjetas.
- **Glassmorphism**: Usar desenfoques de fondo (`backdrop-blur`) de 20-30px en elementos flotantes.
- **Sin Hacks**: Prohibido el uso de `!important` o trucos CSS. El layout debe ser limpio y basado en estándares.

## ♿ Estándares de Accesibilidad
- Priorizar el uso de la aplicación por personas mayores.
- Contraste alto, áreas de toque grandes y etiquetas ARIA siempre presentes.

## 🩺 Lógica de Negocio (AMPA)
- Respetar siempre la jerarquía de promedios y las reglas de las sesiones (Mañana/Noche).
- Validar que las lecturas estén dentro de los rangos médicos permitidos.

---
*Este archivo es inyectado automáticamente en las instrucciones del sistema del agente.*
