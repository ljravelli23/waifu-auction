# Waifu Auction - Subasta de Personajes de Anime

Juego multijugador en tiempo real donde un anfitrión organiza una subasta de personajes de anime entre sus amigos.

## Características

- **Sin servidor**: Corre 100% en el navegador usando WebRTC P2P (Trystero)
- **GitHub Pages**: Alojado estáticamente, sin backend ni descargas requeridas
- **Códigos de sala**: Los jugadores se unen con un código de 4 letras
- **Búsqueda en AniList**: Busca anime y personajes directamente desde la API
- **Modos de juego**: Elección, Aleatorio, y A ciegas
- **Configuración flexible**: Saldo inicial, máximo de waifus, rondas, modo de puja
- **Compra a ciegas**: Solo se revela el nombre del anime durante la puja
- **Tiempo real**: Pujas, timers y actualizaciones vía WebRTC P2P

## GitHub Pages

El juego está alojado en GitHub Pages y es completamente funcional sin necesidad de servidor.

Para activar GitHub Pages:
1. Ve a tu repositorio en GitHub
2. Settings > Pages
3. Source: Deploy from a branch
4. Branch: main, folder: / (root) o /public
5. Save

El sitio estará disponible en `https://tu-usuario.github.io/waifu-auction/`

## Cómo Jugar

### Anfitrión
1. Abre el link de GitHub Pages
2. Ingresa tu nombre
3. Haz clic en "Crear Sala (Anfitrión)"
4. Comparte el código de sala de 4 letras con tus amigos
5. Configura la partida (modo de juego, saldo inicial, etc.)
6. Espera a que los jugadores se unan
7. Inicia la partida cuando esté listo

### Jugadores
1. Abren el link de GitHub Pages
2. Ingresan su nombre
3. Ingresan el código de sala que les compartió el anfitrión
4. Hacen clic en "Unirse"
5. Esperan a que el anfitrión inicie la partida

## Flujo del Juego

### Anfitrión
1. Configura los parámetros de la partida (modo de juego, saldo inicial, etc.)
2. Espera a que los jugadores se unan al lobby
3. Inicia la partida cuando esté listo
4. En modo "Elección": cada jugador elige un personaje para subastar
5. En modo "Aleatorio": los personajes se generan automáticamente
6. En modo "A ciegas": los personajes se generan sin revelar la imagen
7. Gestiona las rondas y pujas
8. Finaliza la partida y muestra resultados

### Jugadores
1. Se unen al lobby con el código de sala
2. Esperan a que el anfitrión inicie la partida
3. En cada ronda:
   - Ven el personaje (o solo el anime en modo ciegas)
   - Pujan un monto mayor al actual o pasan
   - Esperan el resultado
4. Acumulan personajes en su colección
5. Ven los resultados finales

## Configuración de Partida

- **Modo de juego**:
  - `Elección`: Los jugadores eligen qué personajes subastar
  - `Aleatorio`: Personajes generados automáticamente
  - `A ciegas`: Personajes generados sin revelar la imagen
- **Saldo Inicial**: Dinero inicial de cada jugador
- **Máximo de waifus**: Límite de personajes por jugador (opcional)
- **Máximo de rondas**: Límite de rondas (opcional)
- **Modo de Puja**: 
  - `Libre`: Cualquiera puede pujar cuando quiera
  - `Por Turnos`: Cada ronda un jugador debe abrir la puja

## Estructura del Proyecto

```
waifu-auction/
├── index.html         # Estructura HTML principal
├── css/
│   └── styles.css     # Estilos
├── js/
│   ├── client.js      # Cliente Trystero y lógica compartida
│   ├── hostView.js    # Vista del anfitrión
│   └── playerView.js  # Vista del jugador
├── server/            # (Obsoleto - ya no se usa)
├── package.json
└── README.md
```

## Notas Importantes

- El juego usa WebRTC P2P (Trystero) para comunicación directa entre navegadores
- No requiere servidor ni descargas adicionales
- Las imágenes de personajes se cargan directo desde el CDN de AniList
- El estado del juego se mantiene en el navegador del anfitrión
- Si el anfitrión cierra la página, la partida se pierde
- Para reconexión, los jugadores pueden recargar la página si el anfitrión sigue conectado

## Troubleshooting

- Si los jugadores no pueden conectarse, verificar que estén usando el mismo código de sala
- Si hay problemas de conexión, intentar recargar la página
- Los errores de WebSocket relay en la consola son normales - Trystero intenta múltiples relays
- El anfitrión debe mantener la página abierta durante toda la partida

## Licencia

MIT
