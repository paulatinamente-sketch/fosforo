# Agentes de código

Este proyecto puede ser asistido por agentes de IA (Copilot, Cursor, Claude, etc.). Si trabajás con uno, tené en cuenta:

## Contexto del proyecto

- **Fósforo** es una app de匹配 laboral con IA para la competencia CoderCup 2026
- Usa React + Vite, Gemini API con visión de imágenes, desplegada en Vercel
- El usuario es principiante; preferí soluciones simples y directas

## Convenciones

- Componentes funcionales con hooks
- Estilos inline (sin CSS modules ni styled-components)
- Nombres en español para variables y funciones orientadas al usuario
- El archivo principal es `src/MatchCV.jsx`
- La función serverless está en `api/gemini.mjs`

## Reglas

- No agregar dependencias sin preguntar
- No cambiar la estructura de archivos existentes
- Mantener compatibilidad con la versión web y móvil
- Ejecutar `npm run build` después de cada cambio para verificar que compila
- El proxy de Vercel oculta la API key; nunca exponerla en el frontend

## Variables de entorno

- `VITE_GEMINI_API_KEY` → clave de Gemini (solo desarrollo local)
- `VITE_GEMINI_PROXY_URL` → ruta del proxy serverless (`/api/gemini`)
- `GEMINI_API_KEY` → clave en Vercel (server-side)
