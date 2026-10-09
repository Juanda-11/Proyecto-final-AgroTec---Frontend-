# Revisión del proyecto AgroTec (estado inicial → estado actual)

## Hallazgos del prototipo original (`App.tsx` de ~1700 líneas)
| # | Hallazgo | Impacto | Resolución |
|---|---|---|---|
| 1 | Todo en un solo archivo | Difícil de mantener y de repartir entre 3 personas | Separado en `structures/`, `iot/`, `ai/`, `services/`, `store/`, `components/`, `screens/` |
| 2 | Faltaba el **AVL** (había un BST simple sin balanceo) y la **lista circular doble** | No cumplía "aplicar todas las estructuras vistas" (semanas 9 y 12) | `AVLTree.ts` con rotaciones LL/RR/LR/RL y `DoublyCircularList.ts` |
| 3 | Estructuras sin pruebas | Riesgo de errores en la sustentación | 11 pruebas (`npm test`): vacío, 1 elemento, casos límite, balance AVL con 1000 inserciones |
| 4 | La "IA" era un `if lower.includes(...)` | No cumple "implementar IA" | Backend Python con Gemini: chat con contexto, diagnóstico con foto, análisis, resumen de alertas y predicción por regresión lineal |
| 5 | Cola y pila poco útiles (la cola se vaciaba al instante, la pila crecía sin límite) | Estructuras "de adorno" | Cola FIFO de alertas pendientes + pila de atendidas con capacidad; pila para **deshacer** cambios de objetivo de humedad |
| 6 | Estructuras inicializadas dentro de `useEffect` y como globales mutables | Contadores en 0 en el primer render | Estado en `FarmProvider` con `useRef` y re-render controlado |
| 7 | Sensores = ruido blanco aleatorio | Datos poco creíbles | Caminata aleatoria con regresión a la media y botones "simular sequía/lluvia" |
| 8 | Tipografía de 7–9 px y emojis como iconos | Ilegible en móvil | Mínimo 11 px, iconos vectoriales (Ionicons), contraste revisado |
| 9 | Mapa con líneas posicionadas "a mano" | No reflejaba el grafo | Mapa SVG dibujado desde el propio grafo, ruta resaltada, BFS/DFS/Dijkstra |
| 11 | Al cambiar de pestaña se perdían el chat y las parcelas insertadas | Mala experiencia, estado inconsistente | Pantallas montadas + persistencia local (AsyncStorage) con lectura tolerante a fallos |
| 10 | Sin build web / Vercel | No se podía desplegar | `expo export --platform web` + `vercel.json`; marco de teléfono en pantallas anchas |

## Cobertura del cronograma de la materia
| Semana | Tema | Dónde se usa en la app |
|---|---|---|
| 2 | Pilas | Alertas atendidas y deshacer cambios (Inicio / Cultivos) |
| 3 | Colas | Cola FIFO de alertas pendientes (Inicio) |
| 4–6 | Listas / simples | Registro de lecturas (Inicio) |
| 7 | Listas dobles | Navegar lecturas anterior/siguiente (Inicio) |
| 8 | Listas circulares | Rotación de cultivos (Cultivos) |
| 9 | Circulares dobles | Ronda de inspección del técnico (Cultivos) |
| 10–12 | Binarios / ABC / AVL | Índice de parcelas AVL con inserción, búsqueda y rotaciones (Cultivos) |
| 13 | N-ary | Jerarquía finca → lote → cultivo → sensor (Cultivos) |
| 14–15 | Grafos | Red de rutas, Dijkstra, BFS, DFS (Rutas) |
| Extra | **Trie** (investigada) | Autocompletado de síntomas (AgroIA) |

## Pendiente / decisiones del equipo
- Confirmar por escrito con el docente el uso de Python en el backend (el PDF dice "solo TypeScript").
- Cada integrante debe hacer sus propios commits (ver `CONTRIBUTING.md`).
- Crear proyecto en Vercel para cada repo y definir variables (ver README de cada uno).
