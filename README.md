# Waifu Auction - Subasta de Personajes de Anime

Juego multijugador en tiempo real donde un anfitrión organiza una subasta de personajes de anime entre sus amigos.

## Características

- **Sin servidor externo**: Corre 100% desde la laptop del anfitrión
- **Túnel a internet**: Usa cloudflared para compartir con amigos (sin cuenta requerida)
- **Búsqueda en AniList**: Busca anime y personajes directamente desde la API
- **Filtros de géneros**: Filtra por géneros de anime (Acción, Romance, Fantasía, etc.)
- **Filtro de género de personaje**: Solo waifus, solo hombres, o todos
- **Modo aleatorio**: Genera personajes aleatorios basados en filtros seleccionados
- **Participación del anfitrión**: El anfitrión puede optar por participar como jugador
- **Modos de puja**: Libre o por turnos
- **Compra a ciegas**: Solo se revela el nombre del anime durante la puja
- **Sistema de votación**: Múltiples modos para elegir la "mejor compra"
- **Tiempo real**: Pujas, timers y actualizaciones vía Socket.IO

## Requisitos

- Node.js (v14 o superior)
- npm

## Instalación

1. Clonar o descargar el proyecto
2. Instalar dependencias:
```bash
npm install
```

## Subir a GitHub

Para subir el proyecto a GitHub:

1. Crear un nuevo repositorio en [GitHub.com](https://github.com/new)
2. Copiar la URL del repositorio (ej: `https://github.com/tu-usuario/waifu-auction.git`)
3. En tu terminal local, ejecutar:
```bash
git remote add origin https://github.com/tu-usuario/waifu-auction.git
git branch -M main
git push -u origin main
```

## GitHub Pages (Showcase)

**Nota importante:** GitHub Pages solo aloja sitios estáticos. Este juego requiere un servidor Node.js con Socket.IO, por lo que GitHub Pages solo servirá como showcase del frontend (no será funcional para jugar).

Para activar GitHub Pages:
1. Ve a tu repositorio en GitHub
2. Settings > Pages
3. Source: Deploy from a branch
4. Branch: main, folder: / (root)
5. Save

El sitio estará disponible en `https://tu-usuario.github.io/waifu-auction/`

## Cómo Correr

1. Iniciar el servidor:
```bash
npm start
```

2. Exponer a internet con cloudflared (sin cuenta requerida):

**Instalar cloudflared:**
- Descargar cloudflared para Windows desde: https://github.com/cloudflare/cloudflared/releases
- Extraer el archivo .zip
- Mover el ejecutable a una carpeta accesible o agregar al PATH

**Ejecutar túnel:**
```bash
cloudflared tunnel --url http://localhost:3000
```

**Compartir con jugadores:**
- cloudflared generará un link HTTPS (ej: https://xxxxx.trycloudflare.com)
- Compartir ese link con los jugadores
- Los jugadores abren el link en sus navegadores

3. El anfitrión abre el link y selecciona "Soy Anfitrión"
4. Los jugadores abren el link y seleccionan "Soy Jugador"

## Flujo del Juego

### Anfitrión
1. Configura los parámetros de la partida (saldo inicial, jugadores máximos, tiempo por ronda, etc.)
2. **Opcional**: Marca "Participar como jugador" e ingresa tu nombre si quieres pujar también
3. Busca anime/personajes en AniList y selecciona los que formarán parte de las rondas
4. Espera a que los jugadores se unan al lobby
5. Inicia la partida cuando esté listo
6. Si participas como jugador: puja, pasa y compite como cualquier otro jugador
7. Siempre puedes finalizar rondas manualmente con el botón "Finalizar Ronda"
8. Al final, selecciona el modo de votación o salta a resultados finales

### Jugadores
1. Entran al link del túnel
2. Ingresan su nombre para unirse al lobby
3. Esperan a que el anfitrión inicie la partida
4. En cada ronda:
   - Ven solo el nombre del anime (compra a ciegas)
   - Pujan un monto mayor al actual o pasan
   - Esperan el resultado y revelación del personaje
5. Participan en la votación final (si el anfitrión la habilita)
6. Ven los resultados finales con las colecciones de todos

## Configuración de Partida

- **Saldo Inicial**: Dinero inicial de cada jugador
- **Jugadores Máximos**: Cupo máximo de jugadores
- **Personajes por Jugador**: Límite de personajes que puede comprar cada jugador
- **Tiempo por Personaje**: Segundos para pujar por cada personaje
- **Modo de Puja**: 
  - `Libre`: Cualquiera puede pujar cuando quiera
  - `Por Turnos`: Cada ronda un jugador debe abrir la puja (rotación)
- **Comportamiento al finalizar tiempo**:
  - `Saltar personaje`: Nadie gana si se acaba el tiempo
  - `Finalizar con puja más alta`: Gana la puja más alta hasta ese momento
- **Mostrar contador de rondas**: Muestra "Ronda 3 de 10" o solo "Ronda 3"

## Modos de Votación

- **Por Precio**: Se compara la compra más cara de cada jugador
- **Uno por Uno**: Se califica cada personaje del 1 al 10
- **Por Ronda**: Se agrupan las compras por número de ronda
- **Sin votación**: Salta directo a resultados finales

## Estructura del Proyecto

```
waifu-auction/
├── server/
│   ├── server.js          # Servidor Express + Socket.IO
│   ├── gameState.js       # Estado del juego en memoria
│   ├── gameLogic.js       # Lógica del juego
│   └── socketHandlers.js  # Manejadores de eventos Socket.IO
├── public/
│   ├── index.html         # Estructura HTML principal
│   ├── css/
│   │   └── styles.css     # Estilos
│   └── js/
│       ├── client.js      # Utilidades compartidas del cliente
│       ├── hostView.js    # Vista del anfitrión
│       └── playerView.js  # Vista del jugador
├── package.json
└── README.md
```

## Notas Importantes

- Mientras dure la partida, desactivar la suspensión automática de la laptop
- El anfitrión no participa como jugador, solo administra
- Las imágenes de personajes se cargan directo desde el CDN de AniList (no pasan por el servidor)
- El estado del juego no persiste si se reinicia el servidor
- Para reconexión, los jugadores pueden recargar la página (el estado se mantiene en el servidor)

## Troubleshooting

- Si los jugadores no pueden conectarse, verificar que el túnel esté funcionando
- Si las imágenes no cargan, verificar conexión a internet (AniList API)
- Si hay problemas de conexión, intentar recargar la página
- El anfitrión puede finalizar rondas manualmente si el timer falla

## Licencia

MIT
