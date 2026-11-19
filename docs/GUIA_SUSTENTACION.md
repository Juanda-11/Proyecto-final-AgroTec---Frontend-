# AgroTec — Guía de estudio para la sustentación

Proyecto final de **Estructuras de Datos** · Universidad Cooperativa de Colombia, Campus Pasto · Docente: Jhonatan Andrés Mideros Narváez.

---

## 0. El proyecto en 30 segundos (para empezar la exposición)
> "AgroTec es una aplicación para agricultores de Nariño que monitorea el cultivo en tiempo real. Un nodo físico con un ESP32 y sensores mide la humedad del suelo, la temperatura y la lluvia, y los envía por internet a un servidor. La app móvil los muestra, genera alertas y usa inteligencia artificial para recomendar riego y diagnosticar problemas del cultivo. Todas las estructuras de datos vistas en la materia están aplicadas en funciones reales de la app, y agregamos una estructura investigada, el Trie."

**Los 5 requisitos del profesor y cómo se cumplen:**
| Requisito (diapositiva 18) | Cómo se cumple |
|---|---|
| Caso de estudio real | Agricultura de precisión en Nariño (papa, café, hortalizas, maíz, fresa) |
| Implementar IA | Gemini (chat, diagnóstico con foto, análisis, resumen) + regresión lineal + reglas por cultivo |
| Aplicar todas las estructuras vistas | Pila, cola, lista simple, doble, circular, circular doble, AVL, N-ario, grafo (10 con el Trie) |
| Investigar más estructuras | **Trie** (autocompletado de síntomas) |
| Frontend | App móvil React Native + Expo, publicada en Vercel |
| Hardware (dicho por el docente) | Nodo ESP32 con 3 sensores reales conectado a la app |

> **Sobre TypeScript:** el PDF dice "solo TypeScript". La app, las estructuras y la lógica están en **TypeScript**. El backend de IA está en **Python** (que ustedes dijeron que el docente permitió) y el firmware del ESP32 en **C++** (es hardware). Estén listos para decirlo con claridad y, si tienen la autorización por escrito, tenerla a mano.

---

## 1. Problema y justificación
- Los pequeños productores de Nariño toman decisiones de riego y prevención "a ojo": la información está dispersa o se revisa manualmente.
- No saben **cuándo** regar, ni se enteran a tiempo de un riesgo (sequía, hongos con humedad alta, pH fuera de rango).
- AgroTec **mide, organiza, alerta y recomienda**. Es una herramienta de apoyo, **no reemplaza** al agrónomo (la IA es orientativa).

**Objetivo general:** monitorear variables del cultivo en tiempo real y apoyar la decisión del agricultor con IA, usando estructuras de datos para organizar la información.

---

## 2. Arquitectura general

```
 Sensores ──► ESP32 ──WiFi/HTTPS──► Backend (FastAPI, Vercel) ──► Upstash Redis
 (suelo, DHT22,   (C++)  POST /api/readings   │  valida, guarda         ▲
  lluvia)                                      │                          │ GET /api/readings/latest
                                               ├──► Gemini (IA)           │ cada 8 s
                                               ▼                          │
                                  App móvil (React Native + Expo + TypeScript, en Vercel)
                                  estructuras de datos · alertas · gráficas · chat
```

**Cuatro capas:**
1. **Hardware (ESP32):** lee sensores y envía JSON cada 10 segundos.
2. **Backend (Python/FastAPI):** recibe y guarda lecturas, y ofrece los servicios de IA.
3. **Almacenamiento (Upstash Redis):** guarda la última lectura y un historial de 200.
4. **App (TypeScript):** muestra todo y aplica las estructuras de datos.

**Dos repositorios en GitHub:** `Proyecto-final-AgroTec---Frontend-` (la app) y `Proyecto-final-AgroTec---Backend` (API, IA y hardware).

---

## 3. Tecnologías y por qué se eligieron
| Tecnología | Para qué | Por qué |
|---|---|---|
| **TypeScript** | App y estructuras de datos | Lo exige la materia; tipado fuerte evita errores |
| **React Native + Expo** | Interfaz móvil | Un solo código funciona en Android, iOS y web (PWA) |
| **Python + FastAPI** | Backend/IA | Rápido, validación automática con Pydantic, documentación automática en `/docs` |
| **Gemini (Google)** | IA generativa | Tier gratuito, texto y visión (foto de hojas) |
| **ESP32 (C++/Arduino)** | Nodo sensor | WiFi integrado, económico, 12 bits de ADC |
| **Upstash Redis** | Guardar lecturas | Vercel es "sin estado"; Redis gratis y por HTTP |
| **Vercel** | Despliegue | Despliegue automático con cada `git push`; HTTPS gratis |
| **AsyncStorage** | Guardado local en el celular | La app recuerda cultivo, parcelas, chat y modo de sensor |
| **react-native-svg** | Mapa de rutas y gráficas | Dibuja el grafo y el árbol AVL |
| **Pydantic / pytest / node:test** | Validación y pruebas | Calidad y confianza |

**Idioma:** el código (variables, funciones, commits) está en **inglés**; la interfaz que ve el agricultor, en **español**.

---

## 4. Las estructuras de datos (lo que más van a preguntar)
Están en `src/structures/` (TypeScript). **Cada una resuelve una necesidad real de la app**, no es solo un ejercicio.

| # | Estructura | Dónde se usa en AgroTec | Operaciones clave | Complejidad |
|---|---|---|---|---|
| 1 | **Pila (Stack)** LIFO | Historial de alertas atendidas y **"deshacer"** cambios del objetivo de humedad | push/pop/peek | O(1) |
| 2 | **Cola (Queue)** FIFO | **Cola de alertas** pendientes: se atiende primero la más antigua | enqueue/dequeue | O(1) amortizado |
| 3 | **Lista simple** | **Registro** de lecturas (la más reciente al inicio, máx. 300) | prepend, find, remove | prepend O(1); buscar O(n) |
| 4 | **Lista doble** | **Navegar** entre lecturas pasadas: botones anterior/siguiente | append, prev, next | O(1) |
| 5 | **Lista circular** | **Rotación de cultivos**: tras el último vuelve al primero | next | O(1) |
| 6 | **Lista circular doble** | **Ronda del técnico**: avanzar y retroceder sin fin | next, prev | O(1) |
| 7 | **Árbol AVL** | **Índice de parcelas** por código; se **autobalancea** | insert, find, remove | O(log n) |
| 8 | **Árbol N-ario** | **Jerarquía** finca → lote → cultivo → sensor | recorrido, profundidad, camino | O(n) |
| 9 | **Grafo** ponderado | **Rutas** de transporte entre municipios de Nariño | BFS, DFS, Dijkstra | BFS/DFS O(V+E); Dijkstra aquí O(V²) |
| 10 | **Trie** (investigada) | **Autocompletado** de síntomas (ignora tildes y mayúsculas) | insert, startsWith | O(k) (k = largo de la palabra) |

### Detalles para explicar bien
- **Pila vs cola:** la pila saca lo **último** que entró (deshacer); la cola saca lo **primero** (atender alertas en orden de llegada).
- **Cola con índice de cabeza:** en vez de mover todos los elementos al sacar, se avanza un índice; cada cierto tiempo se compacta. Por eso dequeue es O(1) amortizado.
- **AVL:** es un árbol binario de búsqueda donde la diferencia de alturas entre hijos nunca pasa de 1. Si se rompe, se reequilibra con **rotaciones**: simple derecha (LL), simple izquierda (RR), izquierda-derecha (LR) y derecha-izquierda (RL).
  - **Demostración en la app:** en *Cultivos*, insertar 1, 2, 3, 4, 5 seguidos. Un árbol normal quedaría como una "lista" (altura 5); el AVL se rota solo y baja la altura. El contador muestra las **rotaciones**.
  - Probado con 1000 inserciones ordenadas: altura ≤ 14 (≈ 1.44·log₂ n).
- **Árbol N-ario:** cada nodo puede tener cualquier número de hijos, ideal para jerarquías (finca con varios lotes, lote con cultivos, cultivo con sensores).
- **Grafo:** vértices = municipios (Pasto, Ipiales, Túquerres, Tumaco, La Unión, Sandoná, Samaniego); aristas = distancias aproximadas en km.
  - **BFS** recorre por niveles usando una **cola**; **DFS** recorre en profundidad usando una **pila**.
  - **Dijkstra** da la ruta de menor distancia. Nuestra versión busca el mínimo con un recorrido lineal → O(V²). Con una cola de prioridad (heap) sería O((V+E) log V).
- **Trie:** cada nodo es una letra; las palabras que comparten prefijo comparten camino. Buscar un prefijo cuesta O(k), independiente de cuántas palabras haya. Se eligió sobre un B-Tree porque para vocabulario agrícola en móvil es más directo.

### Por qué no es "solo teoría"
Las estructuras no están aisladas: **una lectura de sensor** entra a la lista simple (registro), a la lista doble (historial navegable) y, si genera riesgo, a la **cola de alertas**; al atenderla pasa a la **pila**. Todo en la misma función (`pushReading` en `FarmContext.tsx`).

---

## 5. Inteligencia Artificial (más que un chatbot)
Cinco funciones en el backend (`/api/...`):
| Función | Qué hace | Cómo |
|---|---|---|
| **Chat** `/chat` | Asistente agrónomo que conoce las lecturas actuales de la finca | Gemini + historial + contexto de sensores |
| **Análisis** `/analyze` | Riesgo (BAJO/MEDIO/ALTO), riego (NINGUNO/RECOMENDADO/URGENTE) y consejo | Reglas por cultivo + explicación con Gemini |
| **Diagnóstico** `/diagnose` | Causas probables y recomendación a partir de **síntomas y foto** | Gemini multimodal con respuesta JSON estructurada |
| **Predicción** `/forecast` | Tendencia de la humedad y **cuánto falta para llegar al nivel crítico** | **Regresión lineal** (mínimos cuadrados) |
| **Resumen** `/summary` | Resume la cola de alertas y dice cuál atender primero | Gemini |

**Puntos fuertes para decir:**
- **Híbrida:** reglas transparentes (explicables) + IA generativa. Las reglas dependen del cultivo (cada uno tiene su rango de humedad, pH y temperatura).
- **Tolerante a fallos:** si Gemini no responde (error 503 o 429), el backend reintenta, cambia a un modelo de reserva y, si todo falla, responde con reglas locales (la app muestra la etiqueta **REGLAS** en vez de **GEMINI**). La app incluso tiene reglas locales si no hay backend.
- **Responsable:** siempre aclara que es orientación y que no reemplaza al agrónomo o a la UMATA/ICA.
- **No da dosis de agroquímicos**, a propósito.

**Cómo se calcula el riesgo (reglas):** suma puntos: humedad muy baja (+3), poco baja (+1), temperatura alta (+2), pH fuera de rango (+2), lluvia alta (+1), UV muy alto (+1). Puntaje ≥ 5 = ALTO; ≥ 2 = MEDIO.

---

## 6. Hardware (el nodo sensor)
**Componentes:** ESP32 (chip ESP32-D0WD-V3) sobre un shield de expansión, sensor **DHT22**, sensor de **humedad de suelo capacitivo V2.0**, módulo **Water Sensor** (lluvia).

| Sensor | Pin | Qué mide | Cómo funciona |
|---|---|---|---|
| DHT22 | GPIO 32 (digital) | Temperatura y humedad del aire | Sensor digital con protocolo propio |
| Suelo capacitivo | GPIO 34 (analógico) | Humedad del suelo | Mide cambios en la **permitividad** del suelo; **no se corroe** (a diferencia del resistivo). En seco da un valor alto; en agua, bajo |
| Water Sensor | GPIO 35 (analógico) | Lluvia / agua | Pistas conductoras: el agua cierra el circuito y sube el voltaje |

**Conceptos:**
- **ADC de 12 bits:** convierte voltaje (0–3.3 V) en un número de 0 a 4095. Se promedian 16 muestras para reducir ruido.
- **Pines ADC1 (32–39):** los analógicos van ahí porque el ADC2 no funciona con el WiFi encendido.
- **Calibración:** se mide cada sensor "al aire" (seco) y "en agua" (mojado) y se convierte a porcentaje con una interpolación lineal (`SOIL_RAW_DRY` / `SOIL_RAW_WET`). Por eso el valor crudo (raw) no es directamente un porcentaje.
- **Alimentación a 3.3 V** (los pines del ESP32 aguantan máximo ~3.6 V).
- **Envío:** cada **10 s** por HTTPS `POST /api/readings` con un JSON y una clave en la cabecera `X-Device-Key`.

**Lo que es real y lo que es simulado (sean claros y honestos):**
- **Real:** humedad del suelo, temperatura, humedad del aire y lluvia.
- **Simulado:** **pH y UV** (no se compraron esos sensores). En la app salen con la etiqueta **SIM**; los reales, con **REAL**.
- La app tiene además un **modo Simulado** para ensayar y para mostrar situaciones (sequía, lluvia) sin esperar al clima.

---

## 7. Backend (Python / FastAPI)
**Endpoints:**
| Método y ruta | Función |
|---|---|
| `POST /api/readings` | Ingesta del ESP32 (protegida con clave) |
| `GET /api/readings/latest` | Última lectura y si el nodo está **en línea** (reportó en los últimos 30 s) |
| `GET /api/readings/history` | Últimas lecturas |
| `POST /api/chat`, `/analyze`, `/diagnose`, `/forecast`, `/summary` | IA |
| `GET /api/health` | Estado y si Gemini está activo |

**Seguridad y calidad:**
- La clave del dispositivo se compara con `hmac.compare_digest` (tiempo constante).
- **Pydantic** valida rangos (por ejemplo, humedad 0–100) y rechaza datos absurdos.
- Las claves (Gemini, dispositivo, Upstash) están en **variables de entorno**, nunca en el código ni en GitHub.
- El servidor pone su **propia hora** a cada lectura (no confía en el reloj del ESP32).
- **CORS** configurable.
- **19 pruebas automáticas** (pytest): ingesta, clave, estado en línea, historial, IA con respaldo, etc.

---

## 8. La app (frontend)
**Cuatro pantallas:**
1. **Inicio:** sensores en vivo, interruptor **Simulado / Sensor real**, historial navegable (lista doble), predicción de humedad, **análisis con IA**, cola de alertas.
2. **Cultivos:** lotes, árbol N-ario de la finca, índice **AVL**, rotación (lista circular), ronda (circular doble), "deshacer" (pila).
3. **AgroIA:** chat, **diagnóstico con foto**, autocompletado con **Trie**.
4. **Rutas:** mapa con el **grafo** y algoritmos (Dijkstra, BFS, DFS).

**Detalles de calidad:** animaciones y degradados, interfaz para pantallas pequeñas (probada en 320, 360 y 390 px), botones táctiles de 44 px, splash animado, guardado local (la app recuerda el cultivo, parcelas, chat y modo), **11 pruebas** de las estructuras y revisión de tipos con TypeScript estricto.

**Cómo llega el dato real a la pantalla:** la app consulta `/api/readings/latest` cada **8 s**; si hay una lectura nueva, entra por `pushReading` (estructuras de datos) y se actualiza la interfaz. Si el nodo no reporta en 30 s, la app dice **"Nodo sin señal"**.

---

## 9. Despliegue (todo en producción)
- **Frontend:** Expo exporta la app a web (`expo export`) y **Vercel** la publica; se instala como app desde el navegador ("Añadir a pantalla de inicio"). Android e iOS también corren con Expo Go.
- **Backend:** FastAPI como función serverless en Vercel.
- **Datos:** Upstash Redis (plan gratuito).
- **Despliegue continuo:** cada vez que se fusiona un cambio en `main` de GitHub, Vercel despliega automáticamente.
- **Problema real que resolvimos:** Vercel enviaba a la app la ruta `/api/index` en vez de la ruta original, y todas las rutas daban "Not Found". Se resolvió reescribiendo la URL con la ruta original dentro de la petición y restaurándola con un *middleware* ASGI. Es un buen ejemplo de depuración para contar.
- **Por qué Upstash:** Vercel no guarda estado entre peticiones; sin una base de datos, las lecturas se perderían.

---

## 10. Guion de demostración (practicar con el equipo)
Tiempo sugerido total: **8–10 minutos** + preguntas.

| Min | Quién sugerido | Qué mostrar |
|---|---|---|
| 0–1 | Juan | Problema y arquitectura (el diagrama de la sección 2) |
| 1–3 | Brayan | El **hardware**: qué sensor mide qué, cómo se conectan, el firmware y que envía por WiFi |
| 3–4 | Mario | **La maqueta**: matera, sensores, qué pasa al regar |
| 4–6 | Juan | **App en modo Sensor real**: echar agua a la matera → sube la humedad; respirar cerca del DHT22 → sube la temperatura; mostrar las etiquetas REAL/SIM |
| 6–7 | Juan | **IA**: "Analizar mi cultivo" con datos reales; chat: "¿Debo regar hoy?"; diagnóstico de una hoja |
| 7–9 | Todos | **Estructuras de datos**: cola de alertas, AVL (insertar 1–5), grafo (ruta Tumaco → Ipiales), Trie (escribir "hojas") |
| 9–10 | Todos | Conclusiones, límites y trabajo futuro; mostrar GitHub (repos y commits) |

**Plan B si algo falla (llévenlo preparado):**
- **El WiFi no conecta:** usen la zona WiFi del celular (2.4 GHz). Prueben **30 minutos antes**.
- **El nodo aparece "sin señal":** cambien la app a **Simulado** y expliquen que es el mismo flujo; o corran el simulador `hardware/tools/simulate_device.py` (envía datos de prueba como si fuera el ESP32).
- **Gemini lento o caído:** la app responde con reglas (etiqueta REGLAS); expliquen el respaldo.
- **Vercel "dormido":** la primera petición puede tardar unos segundos; abran la app y `/api/health` **5 minutos antes**.
- Tengan **capturas y un video corto** de la demo funcionando, y el power bank cargado.

---

## 11. Preguntas probables y cómo responderlas
**¿Por qué usaron Python si el requisito decía solo TypeScript?**
Respuesta: la app, la lógica y las estructuras están en TypeScript. El backend de IA está en Python porque el docente lo permitió, ya que las librerías y la integración con IA se hacen más simple; el firmware es C++ porque así se programa el ESP32.

**¿Qué diferencia hay entre simulación y datos reales?**
Humedad del suelo, temperatura, humedad del aire y lluvia son reales (nodo ESP32). El pH y el UV están simulados, y la app los marca con la etiqueta SIM. Hay un interruptor para cambiar entre modos.

**¿Por qué un AVL y no un árbol binario normal?**
Un árbol de búsqueda normal puede degenerar en una lista si se insertan datos ordenados (búsqueda O(n)). El AVL se reequilibra con rotaciones y garantiza O(log n). Se puede demostrar insertando 1, 2, 3, 4, 5 en la app.

**¿Para qué sirve la cola y para qué la pila?**
La cola guarda las alertas en orden de llegada y se atienden de la más antigua (FIFO). La pila guarda lo último hecho y permite deshacer (LIFO).

**¿Por qué un Trie?**
Es una estructura que investigamos. Busca por prefijo en O(k) sin importar cuántos términos haya, ideal para el autocompletado de síntomas agrícolas.

**¿Cuál es la complejidad de Dijkstra en su implementación?**
O(V²) porque buscamos el mínimo recorriendo todos los vértices; con una cola de prioridad sería O((V+E) log V). Con 7 municipios es suficiente.

**¿Qué diferencia hay entre BFS y DFS?**
BFS recorre por niveles y usa una cola; DFS recorre en profundidad y usa una pila. BFS encuentra el camino con menos saltos en un grafo no ponderado.

**¿Cómo funciona la IA?**
Combina reglas por cultivo (explicables) con Gemini para explicar y conversar. Además hay una regresión lineal que predice cuándo la humedad llegará al nivel crítico. Si Gemini falla, el sistema sigue funcionando con reglas.

**¿La IA diagnostica con certeza?**
No. Es orientación de apoyo. Siempre lo aclara y recomienda consultar a un agrónomo o a la UMATA/ICA.

**¿Cómo funciona el sensor de suelo capacitivo y por qué no uno resistivo?**
Mide cambios de capacitancia (permitividad) según el agua en el suelo. El resistivo se corroe con el tiempo; el capacitivo, no.

**¿Qué es el ADC y la calibración?**
El ADC convierte el voltaje del sensor en un número de 0 a 4095. Como cada sensor es distinto, medimos el valor en seco y en agua para convertirlo a porcentaje.

**¿Cómo viajan los datos del sensor a la pantalla?**
El ESP32 lee, arma un JSON y lo envía por HTTPS cada 10 s. El backend valida, guarda en Redis y la app lo consulta cada 8 s. Si pasan más de 30 s sin datos, muestra "sin señal".

**¿Por qué usan Upstash?**
Vercel ejecuta funciones sin estado: cada petición puede caer en otra instancia. Redis guarda la última lectura para que cualquiera la consulte.

**¿Qué pasa si se cae internet?**
El nodo no puede enviar y la app marca "sin señal". La app sigue funcionando en modo simulado y con IA local de respaldo.

**¿Qué tan segura es la comunicación?**
Va por HTTPS; el envío del nodo exige una clave en una cabecera que se compara en tiempo constante; las claves están en variables de entorno. **Límite honesto:** el firmware no valida el certificado del servidor (para simplificar la demo); en producción habría que fijar el certificado.

**¿Es escalable?**
La arquitectura permite varios nodos (cada uno con su `device_id`). Hoy la app muestra el último nodo; el siguiente paso sería listar y seleccionar nodos por lote.

**¿Qué mejorarían?**
Sensores reales de pH y UV, actuador de riego (relé y bomba) comandado desde la app, varios nodos por lote, notificaciones push, y validar el certificado en el firmware.

**¿Cómo se trabajó en equipo?**
Con dos repositorios, ramas por tarea, Pull Requests y commits pequeños. Repartición: Juan (backend, nube y app), Brayan (electrónica y firmware), Mario (maqueta y demostración).

---

## 12. Límites que conviene reconocer (la honestidad suma puntos)
- pH y UV simulados; la maqueta es un prototipo, no un sistema de producción.
- Los umbrales de riesgo son de demostración y deben calibrarse por cultivo con un agrónomo.
- La IA es orientativa; las distancias del mapa son aproximadas.
- Planes gratuitos de Vercel, Upstash y Gemini tienen cuotas.
- El firmware se probó en la maqueta, pero sin pruebas de larga duración.

---

## 13. Números y datos para recordar
| Dato | Valor |
|---|---|
| Estructuras de datos | 10 (9 vistas en clase + Trie) |
| Pantallas de la app | 4 |
| Funciones de IA | 5 (chat, análisis, diagnóstico con foto, predicción, resumen) |
| Sensores reales | 3 (suelo, DHT22 → temperatura y humedad del aire, lluvia) |
| Sensores simulados | 2 (pH, UV) |
| Pines | DHT22 → GPIO 32 · suelo → GPIO 34 · lluvia → GPIO 35 |
| Envío del nodo | cada 10 s |
| Consulta de la app | cada 8 s |
| "En línea" si reportó hace ≤ | 30 s |
| ADC | 12 bits (0–4095), promedio de 16 muestras |
| Voltaje de los sensores | 3.3 V |
| Pruebas automáticas | 11 (estructuras) + 19 (backend) |
| Lenguajes | TypeScript (app), Python (backend), C++ (firmware) |
| Repositorios | 2 (Frontend y Backend) |

---

## 14. Glosario rápido
- **ESP32:** microcontrolador con WiFi y Bluetooth.
- **ADC:** convertidor analógico-digital.
- **API REST:** servicio web al que se le piden/envían datos con HTTP (GET, POST).
- **JSON:** formato de texto para intercambiar datos.
- **Serverless:** código que corre bajo demanda, sin servidor propio y sin estado.
- **Redis:** base de datos clave-valor muy rápida.
- **PWA:** web que se instala como app.
- **CORS:** regla del navegador sobre qué páginas pueden llamar a una API.
- **LIFO / FIFO:** último en entrar, primero en salir / primero en entrar, primero en salir.
- **Rotación (AVL):** reacomodo local de nodos para recuperar el equilibrio.
- **Regresión lineal:** recta que mejor se ajusta a los datos (mínimos cuadrados).

---

## 15. Antes de exponer (checklist de 5 minutos)
- [ ] Zona WiFi del celular encendida (2.4 GHz) y el power bank cargado.
- [ ] Nodo conectado y la app en **Sensor real** diciendo "en línea".
- [ ] `/api/health` y la app abiertas (para que Vercel no esté "dormido").
- [ ] Cada integrante puede explicar **su parte** y la arquitectura general.
- [ ] Capturas o video de respaldo en el celular.
- [ ] Repos de GitHub abiertos (para mostrar commits, ramas y Pull Requests).
