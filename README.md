# family-emergency-plan

Web sin backend para completar el [Formato Plan Familiar de Emergencias](https://portal.gestiondelriesgo.gov.co/simulacro/Documents/FORMATO-PLAN-FAMILIAR.pdf)
de la UNGRD: un wizard de 9 pasos que guarda el avance en el navegador y
exporta el plan terminado a PDF.

## Pasos

1. Encabezado
2. Grupo familiar
3. Teléfonos importantes
4. Personas con discapacidad
5. Sitios y personas frecuentes
6. Riesgos y puntos de encuentro
7. Maletín de emergencias
8. Verificación de la vivienda
9. Mascotas

Al final hay una revisión con todo resumido, editable por sección, y el
botón para descargar el plan en PDF.

## Privacidad

Todo se guarda en `localStorage` del navegador — nada viaja a un servidor.
Se borra al cerrar la pestaña o a los 15 minutos de inactividad.

## Stack

React + Vite + TypeScript + Tailwind, [jsPDF](https://github.com/parallax/jsPDF) para el export.

```bash
pnpm install && pnpm dev
```

Sin mantenimiento planeado — este repo sale como versión final.

No es una herramienta oficial de la UNGRD: es una iniciativa independiente
que replica su formato. El PDF lo aclara en cada página.

## Licencia

Ninguna — todos los derechos reservados.
