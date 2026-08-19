# Fósforo

Un espejo para tu búsqueda laboral.

Fósforo es una herramienta web que utiliza inteligencia artificial (Gemini) para analizar un aviso laboral y tu CV, y devolverte un match honesto: qué coincidís, qué te falta, y si vale la pena postularte.

## ¿Cómo funciona?

1. Subís una captura del aviso laboral
2. Subís una captura de tu CV
3. La IA analiza ambas imágenes como lo haría una reclutadora
4. Recibís un score del 1-100 con análisis detallado

## ¿Qué analiza?

- Coincidencias al 100%
- Coincidencias parciales
- Gaps (lo que te falta)
- Nivel de exigencia del puesto
- Sugerencias para mejorar tu perfil

## stack

- React + Vite
- Gemini API (Google) con visión de imágenes
- Vercel (hosting + serverless function)

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy

```bash
npx vercel --prod --yes
```

## Licencia

Proyecto para CoderCup 2026.
