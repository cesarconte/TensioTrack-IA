# Accessibility Checklist (WCAG 2.2 AA)

## 🏗️ Estructura y Semántica
- [ ] Uso de HTML semántico (`main`, `nav`, `section`, `header`, `footer`).
- [ ] Jerarquía de encabezados lógica (`h1` -> `h2` -> `h3`).
- [ ] Landmarks definidos correctamente.
- [ ] Skip links implementados para contenido principal.

## ⌨️ Navegación por Teclado
- [ ] Todos los elementos interactivos son alcanzables con `Tab`.
- [ ] Indicador de foco visible y con alto contraste.
- [ ] Gestión de foco en modales y diálogos (focus trap).
- [ ] Orden de tabulación lógico.

## 👁️ Visual y Contraste
- [ ] Ratio de contraste texto/fondo mínimo 4.5:1.
- [ ] Ratio de contraste componentes UI mínimo 3:1.
- [ ] No se usa el color como único medio para transmitir información.
- [ ] Soporte para `prefers-reduced-motion`.

## 🗣️ Lectores de Pantalla
- [ ] Atributos `aria-label` en botones iconográficos.
- [ ] Roles ARIA correctos en componentes complejos.
- [ ] Estados de carga anunciados (`aria-busy`, `aria-live`).
- [ ] Imágenes con `alt` descriptivo o vacío si son decorativas.

## 📱 Mobile-First & Touch
- [ ] Touch targets mínimos de 44x44px.
- [ ] Sin dependencia de gestos complejos sin alternativa simple.
- [ ] Zoom del navegador permitido (no `user-scalable=no`).
