# AgroTec — App móvil (Expo + React Native + TypeScript)

Asistente de agricultura de precisión para pequeños productores de Nariño.
Proyecto final de **Estructuras de Datos** — Universidad Cooperativa de Colombia, Campus Pasto.
Backend (Python + IA): repositorio *Proyecto-final-AgroTec---Backend*.

## Pantallas
1. **Inicio** — sensores IoT simulados, historial navegable, cola de alertas, predicción de humedad y análisis con IA.
2. **Cultivos** — lotes, árbol N-ario de la finca, índice AVL de parcelas, rotación circular y ronda circular doble.
3. **AgroIA** — chat con contexto de sensores, diagnóstico por síntomas/foto y autocompletado con Trie.
4. **Rutas** — grafo de municipios con Dijkstra, BFS y DFS.

## Detalles de uso
- Los datos del usuario (cultivo en foco, objetivos de humedad, parcelas del AVL y el chat) se guardan en el dispositivo; el botón *Restablecer datos guardados* (pantalla Inicio) los borra.
- Las pantallas permanecen montadas al cambiar de pestaña, así que no se pierde el chat ni el progreso.

## Iconos
Los PNG no se versionan: `pip install pillow && python scripts/generate_icons.py` los genera en `assets/` (ver el encabezado del script para enlazarlos en `app.json`).

## Estructuras de datos (`src/structures`)
Stack · Queue · SinglyLinkedList · DoublyLinkedList · CircularLinkedList · DoublyCircularList · AVLTree · NaryTree · Graph · **Trie** (investigada).
Ver `docs/REVISION_PROYECTO.md` para el mapa estructura → caso de uso.

## Ejecutar
```bash
npm install
cp .env.example .env     # EXPO_PUBLIC_API_URL = URL del backend (opcional)
npx expo start           # escanea el QR con Expo Go, o pulsa "w" para web
npm test                 # pruebas de las estructuras
npm run typecheck
```
Sin `EXPO_PUBLIC_API_URL` la app funciona con IA local de respaldo (reglas).

## Despliegue en Vercel (solo móvil)
Guía completa y ordenada: `docs/DESPLIEGUE.md`.

1. Importa este repo en Vercel; `vercel.json` ya define build (`expo export --platform web`) y salida (`dist`).
2. En *Settings → Environment Variables* añade `EXPO_PUBLIC_API_URL` con la URL del backend desplegado.
3. En escritorio la app se muestra dentro de un marco de teléfono; está pensada para móvil.
