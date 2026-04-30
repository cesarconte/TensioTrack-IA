# AGENTS.md — TensioTrack Source of Truth

Este archivo es la fuente de verdad para cualquier agente de IA que trabaje en el repositorio de **TensioTrack**.

## 🎯 Objetivo del Proyecto (UX/UI First)
Proporcionar una herramienta profesional, privada y extremadamente fácil de usar para el seguimiento de la presión arterial siguiendo el protocolo médico **AMPA**. 
**La experiencia de usuario (UX) y el diseño (UI) son el motor del proyecto**: cada funcionalidad debe ser intuitiva, accesible y visualmente impecable, priorizando siempre la claridad para personas mayores.

## 🩺 Reglas Médicas (Protocolo AMPA)
- **Sesiones**: Mañana (antes de desayunar) y Noche (antes de cenar).
- **Tomas**: Exactamente 3 lecturas por sesión, separadas 1-3 minutos.
- **Regla de los 30 min**: Sin comida, café, ejercicio, tabaco o alcohol antes de la toma.
- **Rangos Críticos**: PAS > 180 o PAD > 120 (Alerta inmediata).
- **Rangos Normales**: PAS (60-300), PAD (40-200), FC (30-250).

## 📊 Lógica de Promedios (Jerarquía)
1. **Sesión**: Media de las 3 lecturas de una misma sesión.
2. **Día**: Media de las sesiones de mañana y noche (si ambas están completas).
3. **Período (5 días)**: Media de los 5 promedios diarios PAS (mañana y noche) Y PAD (mañana y noche).
4. **Final**: Media de los promedios del período para el informe médico.

## 🏗️ Arquitectura Técnica Actual
- **Framework**: React 18 + Vite.
- **Backend/DB**: Firebase (Firestore + Auth).
  - *Futura Migración AI*: Las peticiones a la API de Gemini (actualmente en cliente con variables de entorno) deberán migrar a **Firebase Cloud Functions** (plan Blaze) antes de producción. Esto protegerá la `GEMINI_API_KEY` y permitirá gestionar/limitar el uso por usuario.
- **Estilo**: Tailwind CSS v4 + Framer Motion (animaciones).
- **Estado**: Zustand (UI & Auth) + TanStack Query (Sincronización Firestore).
- **Iconos**: Lucide React.
- **Notificaciones**: Sonner.

## 🚀 Metodología de Desarrollo Senior
- **Mobile First**: Diseñar y programar primero para móvil, escalando a desktop con media queries (`sm:`, `md:`, `lg:`).
- **Adaptabilidad Total**: El diseño debe ser fluido y responder no solo al tamaño de pantalla, sino también a la orientación (portrait/landscape) en móviles y tablets.
- **Consistencia Técnica**: Aplicar las mismas soluciones de diseño y layout en todo el proyecto. No se permiten "parches" locales o soluciones divergentes para problemas idénticos.
- **TDD (Test Driven Development)**: 
  - **Flujo**: Red (test falla) -> Green (implementación mínima para pasar) -> Refactor (limpiar código).
  - **Qué testear**: Lógica de negocio (AMPA), casos borde (PAS=300, PAD=40), transformaciones de datos y flujos críticos de usuario.
  - **Qué NO testear**: Librerías externas (Firebase), renderizado simple de UI (salvo estados críticos), estilos CSS.
- **Clean Code & SOLID**: Funciones pequeñas, nombres descriptivos, principio de responsabilidad única (SRP).
- **DRY & KISS**: No repetir lógica y mantener las soluciones lo más simples posible.

## 💻 Estándares de Lógica (TypeScript & Firebase)
- **TypeScript**: 
  - **Strict Mode**: Siempre activado. Prohibido el uso de `any`.
  - **Tipado**: Usar `interface` para objetos y `type` para uniones/alias. Tipar siempre los retornos de funciones.
  - **Exhaustividad**: Usar `switch` con chequeo de exhaustividad para enums y tipos unión.
- **Firebase**:
  - **Seguridad**: Las Security Rules son parte del desarrollo, no un paso final.
  - **Optimización**: Minimizar lecturas. Usar `onSnapshot` para tiempo real y `getDocs` solo cuando sea necesario.
  - **Robustez**: Manejar siempre estados de carga, error y "offline". Validar datos con Zod antes de escribir en Firestore.
- **Manejo de Errores**: Nunca silenciar errores (`catch {}` vacío). Usar un sistema de logs o notificaciones al usuario (Sonner).

## 📁 Estructura de Carpetas (Arquitectura Limpia)
- `/src/components`: Componentes UI y layouts (Presentación).
- `/src/domain`: Lógica de negocio pura y tipos (Cálculos AMPA).
- `/src/store`: Estado global con Zustand (Sincronización).
- `/src/hooks`: Lógica reutilizable y llamadas a Firebase (Infraestructura).
- `/src/lib`: Configuraciones y utilidades.
- `/docs`: Documentación técnica y decisiones de diseño.

## 🤖 Instrucciones para el Agente
1. **Prioridad UX**: Antes de cualquier cambio visual, verifica que sea accesible para personas mayores (botones grandes, texto claro, sin jerga técnica).
2. **Ethereal Interface (MD3+)**: Adherirse estrictamente al sistema de diseño "The Ethereal Interface". Esto implica:
   - **Cero líneas divisorias**: Usar cambios de tono de fondo y espaciado (16dp) para separar contenido.
   - **Tonal Layering**: La jerarquía se crea mediante capas de color sutiles, no sombras pesadas.
   - **Soft Edges**: Usar radios de borde grandes (`rounded-2xl` o `rounded-3xl`) para contenedores.
3. **Consistencia**: Mantener la simetría del Header y el uso de FABs en móvil. Las soluciones de diseño deben ser coherentes en toda la app.
4. **Adaptabilidad**: Asegurar que cada cambio funcione perfectamente en todas las resoluciones y orientaciones.
5. **Validación**: Siempre usar Zod para validar entradas de datos de salud.
6. **Privacidad**: Nunca exponer datos sensibles en logs o UI innecesaria.
7. **Performance**: Evitar re-renders innecesarios usando `React.memo` o `useMemo` donde sea crítico.
8. **Sin Trucos CSS**: Prohibido el uso de `!important` o hacks CSS. Usar la potencia de Tailwind v4 y una estructura HTML limpia.

---
*Última actualización: 2026-04-11*
