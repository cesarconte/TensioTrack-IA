# Accessibility Checklist (WCAG 2.2 AA) — TensioTrack

## 👴 Enfoque en Personas Mayores (Prioridad 1)
- [ ] **Tamaño de Fuente**: Mínimo 16px para cuerpo, 14px para metadatos. Evitar fuentes extra-finas.
- [ ] **Contraste**: Ratio de contraste texto/fondo mínimo 7:1 para textos críticos (superando el estándar 4.5:1).
- [ ] **High Contrast Mode**: Los tokens de color deben cambiar automáticamente a una versión con mayor saturación y contraste si se detecta la preferencia.
- [ ] **AAA Compliant**: Los estados críticos deben cumplir con el estándar AAA de contraste (móvil y escritorio).
- [ ] **Áreas de Toque**: Botones y enlaces con un área mínima de 48x48px para facilitar la interacción con movilidad reducida.
- [ ] **Large Type Ready**: La interfaz debe escalar dinámicamente sin romper el layout si el sistema tiene activado el texto grande.
- [ ] **Simplicidad Cognitiva**: Evitar iconos sin etiquetas de texto (salvo en navegación muy estándar con tooltips).

## 🏗️ Estructura y Semántica
- [ ] Uso de HTML semántico (`main`, `nav`, `section`, `header`, `footer`).
- [ ] Jerarquía de encabezados lógica (`h1` -> `h2` -> `h3`).
- [ ] Landmarks definidos correctamente para navegación rápida.

## ⌨️ Navegación por Teclado
- [ ] Todos los elementos interactivos son alcanzables con `Tab`.
- [ ] Indicador de foco (`outline`) claramente visible y con alto contraste.
- [ ] Gestión de foco en modales (focus trap) y retorno al cerrar.

## 🗣️ Lectores de Pantalla (Screen Readers)
- [ ] Atributos `aria-label` descriptivos en todos los botones iconográficos (ej: "Nueva Lectura", "Cerrar Menú").
- [ ] Uso de `aria-expanded` y `aria-haspopup` en menús desplegables.
- [ ] Estados de carga anunciados mediante `aria-live="polite"` o `aria-busy`.
- [ ] Imágenes decorativas con `alt=""` y `referrerPolicy="no-referrer"`.
- [ ] Uso de `aria-invalid` y `aria-describedby` para validación de formularios.

## 🛠️ Buenas Prácticas Técnicas
- **Focus Management**: Al cerrar un modal, el foco debe volver al elemento que lo abrió.
- **Skip Links**: Implementar un enlace oculto al inicio para saltar directamente al contenido principal.
- **Reduced Motion**: Respetar la preferencia del usuario usando `motion` de Framer Motion con variantes que detecten `prefers-reduced-motion`.
- **Semántica**: Nunca usar un `div` como botón. Usar `<button type="button">`.

---
*Última actualización: 2026-04-11*
