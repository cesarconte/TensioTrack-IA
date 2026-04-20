# Design System — TensioTrack: The Ethereal Interface

## 🎭 Mood & Personalidad: "The Weightless Archive"
- **Vibe**: Profesional, médico pero acogedor, confiable y moderno.
- **Concepto**: "Cuidado invisible". La tecnología debe ser potente pero pasar desapercibida tras una interfaz simple.
- **Estética**: Soft Minimalism. Un framework minimalista suave construido para una experiencia de "archivo ingrávido". Rechazo de líneas estructurales rígidas en favor de capas flotantes y translúcidas.

## 🎨 Paleta de Colores (Ethereal Palette)
La paleta se basa en lavandas suaves y púrpuras profundos, utilizando un enfoque tonal sobre tonal para crear profundidad sin ruido visual.

- **Primary**: `#6750A5` (Lavender) - Acciones principales y marca.
- **Primary Container**: `#BBA2FD` - Fondos de elementos activos.
- **Secondary**: `#E8DEF8` - Elementos de apoyo.
- **Tertiary**: `#EDBADE` - Acentos suaves.
- **Surface**: `#FDF7FE` - Base de la interfaz.
- **Surface Low**: `#F8F2FA` - Agrupación primaria de contenido.
- **Surface Highest**: `#E7E0EC` - Elementos destacados o inputs.
- **Error**: `#F97386` - Estados de error (suave).

### Colores Funcionales (Health Status Standards)
Implementados según el framework visual "Health Status Colors":

#### Blood Pressure Status
- **Hipotensión**: `#3B82F6` (Soft Blue) - Umbral bajo (PAS < 100 o PAD < 60).
- **Normal**: `#10B981` (Emerald) - Rango de salud cardiovascular óptimo.
- **Normal-High**: `#F59E0B` (Amber) - Alerta de niveles elevados.
- **Hypertension**: `#E11D48` (Deep Red) - Rango de alerta crítica.

#### Pulse Rate Indicators
- **Bradycardia**: `#06B6D4` (Soft Cyan) - Ritmo cardíaco bajo.
- **Normal**: `#10B981` (Emerald) - Ritmo cardíaco óptimo.
- **Tachycardia**: `#EF4444` (Vivid Orange-Red) - Ritmo cardíaco elevado.

### Aura Integration
- **Primary Brand Gradient**: `135deg` desde `Primary` (#6750A5) hasta `Primary Container` (#BBA2FD).
- **Feedback Layering**: Uso de contenedores con **10% de opacidad** del color funcional para el fondo de las tarjetas de estado, manteniendo la armonía visual sin saturar.

## 🔡 Tipografía (Editorial Authority)
Utilizamos un enfoque de doble sans-serif para equilibrar la autoridad editorial con la claridad funcional.

- **Display & Headlines**: **Manrope** - Precisión geométrica. Usar para encabezados de categoría. (Letter spacing: -0.02em).
- **Body & Labels**: **Plus Jakarta Sans** - Alta legibilidad. Usar para etiquetas de configuración y descripciones.
- **Mono (Datos)**: **JetBrains Mono** - Para lecturas de presión y precisión médica.

## 📏 Layout & Grid (Tonal Layering)
- **Regla de "No-Line"**: Prohibido el uso de bordes sólidos de 1px para seccionar contenido. Las fronteras estructurales se definen únicamente mediante cambios de color de fondo.
- **Grid**: Sistema de 4px/8px.
- **Variables de Espaciado**:
  - `page-margin-x`: 1.5rem (24px) en móvil, 2.5rem (40px) en escritorio.
  - `section-gap`: 1.5rem (24px) entre secciones.
  - `component-padding`: 1rem (16px) o 1.5rem (24px).
- **Contenedor**: `max-w-7xl` centrado con `mx-auto`.
- **Bordes (Soft Edges)**: `rounded-[1.5rem]` (24px) para contenedores grandes para enfatizar la estética "Soft".

## 🧩 Patrones de UI Específicos
- **High Blur (Glassmorphism)**: Uso de desenfoques de fondo de 20px-30px en Headers y Modales con 80% de opacidad.
- **Tonal Layering**: La elevación se percibe mediante cambios sutiles de brillo (ej: tarjeta blanca sobre fondo `Surface Low`) en lugar de sombras pesadas.
- **The Contextual Anchor**: En lugar de tooltips estándar, usar chips flotantes que aparecen cerca de los ajustes para explicar su impacto.
- **Signature Gradient**: Para CTAs primarios: `135deg` desde `Primary` (#6750A5) hasta `Primary Container` (#BBA2FD).

## 📱 Responsividad & Adaptabilidad Total
- **Mobile First**: El código CSS debe escribirse pensando en móvil por defecto.
- **Orientación**: El diseño debe adaptarse a cambios de orientación (`portrait` vs `landscape`).
- **Touch Targets**: Mínimo 56dp de altura para ítems de lista para asegurar accesibilidad.

## 🚫 Anti-patrones (Lo que NO hacer)
- **No usar líneas divisorias**: Usar espaciado vertical (16dp) y cambios de tono en su lugar.
- **No usar Negro Puro**: Usar siempre `on_surface` (#34313A) para el texto.
- **No usar `!important`**: Mantener la especificidad correcta.
- **No amontonar**: Si una página tiene más de 8 ítems, dividir en capas de superficie anidadas.

---
*Última actualización: 2026-04-11*
