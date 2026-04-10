# TensioTrack 🩺🤖

**TensioTrack** es una aplicación web personal para el seguimiento y análisis profesional de la presión arterial, diseñada bajo el estricto protocolo médico **AMPA** (Automedición de la Presión Arterial).

## 🚀 Características Principales

- **Protocolo AMPA**: Registro guiado de 3 tomas por sesión (mañana y noche).
- **Lógica Médica**: Cálculo automático de promedios en 4 niveles (sesión, día, período de 5 días y final).
- **Análisis con IA**: Integración con Gemini para interpretar tendencias y ofrecer consejos de estilo de vida.
- **Visualización Profesional**: Gráficos de evolución temporal para PAS, PAD y frecuencia cardíaca.
- **Privacidad y Sincronización**: Persistencia en la nube con Firebase Firestore y autenticación segura.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + shadcn/ui.
- **Estado Global**: Zustand.
- **Base de Datos & Auth**: Firebase (Firestore & Auth).
- **Validación**: Zod + React Hook Form.
- **IA**: Google Gemini API.

## 📦 Instalación y Desarrollo

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

## 🚀 Despliegue en Producción

Si decides subir tu aplicación a un servicio de hosting, recuerda configurar las variables de entorno:

1. **El archivo `.env` no se subirá** por motivos de seguridad (está en el `.gitignore`).
2. Añade las variables de entorno necesarias para Firebase y Gemini API.

## 🧪 Testing

- **Unitarios/Integración**: `npm run test` (Vitest).
- **E2E**: `npm run test:e2e` (Playwright).

## 📄 Documentación

- [Guías Médicas (AMPA)](/docs/medical-guidelines.md)
- [Accesibilidad (WCAG 2.2 AA)](/ACCESSIBILITY.md)
- [Sistema de Diseño](/DESIGN_SYSTEM.md)
- [Arquitectura (ADRs)](/docs/adr/README.md)

---
Desarrollado con ❤️ para cuidar tu corazón.
