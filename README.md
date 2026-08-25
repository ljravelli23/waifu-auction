# 🎭 Subasta de Waifus - Juego Multijugador

Juego multijugador de subasta de personajes de anime para jugar con amigos. Un jugador actúa como anfitrión y aloja la partida desde su laptop, mientras los demás se unen mediante un código de 4 letras.

## 🚀 Características

- **Multijugador P2P**: Conexión directa entre jugadores usando WebRTC (sin servidor propio)
- **Voz en tiempo real**: Chat de voz entre todos los jugadores
- **Sala 3D**: Entorno de subasta en 3D con controles de primera persona
- **Avatar personalizable**: Creador de personajes estilo Mii (2D por capas)
- **3 modos de juego**: Elección, Aleatorio, y A ciegas
- **Integración con AniList**: Búsqueda de personajes de anime reales
- **Sistema de puja completo**: Temporizadores, validación anti-trampas
- **Votación final**: 3 modos para elegir al ganador

## 📋 Requisitos

- Navegador moderno con soporte para:
  - WebRTC
  - WebGL (para Three.js)
  - getUserMedia (para micrófono)
- Conexión a internet

## 🛠️ Instalación y Despliegue

### Desarrollo Local

1. Clona o descarga este repositorio
2. Inicia un servidor estático local (requerido para WebRTC y micrófono):

```bash
# Usando Python 3
python -m http.server 8000

# Usando Node.js (serve)
npx serve -l 8000

# Usando PHP
php -S localhost:8000
```

3. Abre `http://localhost:8000` en tu navegador

### Despliegue en GitHub Pages

1. Crea un nuevo repositorio en GitHub
2. Sube los archivos del proyecto (`index.html`, `styles.css`, `game.js`)
3. Activa GitHub Pages:
   - Ve a Settings → Pages
   - Selecciona la rama principal (main/master)
   - Guarda
4. Tu juego estará disponible en `https://tu-usuario.github.io/tu-repositorio/`

## 🎮 Cómo Jugar

### Como Anfitrión

1. Ingresa tu nombre y crea tu avatar
2. Haz clic en "Crear Sala (Anfitrión)"
3. Comparte el código de 4 letras con tus amigos
4. Configura la partida (modo de juego, saldo inicial, etc.)
5. Busca y selecciona personajes para el pool
6. Espera a que se unan los jugadores
7. Inicia la partida y modera las subastas

### Como Jugador

1. Ingresa tu nombre y crea tu avatar
2. Ingresa el código de sala que te compartió el anfitrión
3. Espera en el lobby con los demás jugadores
4. Participa en las subastas usando los botones de puja
6. Vota al final para elegir al ganador

## 🎯 Modos de Juego

### Elección
Los jugadores proponen personajes al pool antes de cada ronda. La imagen se ve normalmente al pujar.

### Aleatorio
El sistema elige automáticamente personajes del pool definido por el anfitrión. La imagen se ve normalmente.

### A ciegas
Igual que Aleatorio, pero durante la puja solo se muestra el nombre del anime (no la imagen). La imagen se revela al final de la ronda.

## 🔧 Configuración de Partida

El anfitrión puede configurar:

- **Modo de juego**: Elección, Aleatorio, o A ciegas
- **Saldo inicial**: Dinero virtual para cada jugador
- **Máximo de rondas**: Límite de rondas (o sin límite)
- **Máximo de waifus por jugador**: Límite de personajes (o sin límite)
- **Modo de puja**: Libre o Por turnos
- **Máximo de jugadores**: Límite de participantes
- **Tiempo de espera sin pujas**: Segundos antes de saltar un personaje
- **Modo de votación**: Por precio, Uno por uno, o Por ronda

## 🏗️ Arquitectura Técnica

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (vanilla)
- **3D Rendering**: Three.js
- **Networking**: PeerJS (WebRTC)
- **API de personajes**: AniList GraphQL
- **Persistencia**: localStorage (para avatares)
- **Hosting**: GitHub Pages (estático)

## 🔒 Seguridad y Validaciones

El anfitrión actúa como autoridad del juego y valida todas las pujas:

- Verifica que el monto sea mayor a la puja actual
- Verifica que el jugador tenga suficiente saldo
- Respeta el modo de puja (libre/por turnos)
- Aplica límites de personajes por jugador

## ⚠️ Limitaciones Conocidas

- La partida depende de que la laptop del anfitrión permanezca conectada
- En redes muy restrictivas puede fallar la conexión P2P
- El avatar es 2D (sprite), no un modelo 3D completo
- Requiere HTTPS o localhost para WebRTC y micrófono

## 📝 Notas de Desarrollo

- No requiere build step ni bundler
- Archivos completamente estáticos
- WebRTC maneja tanto datos como voz
- PeerJS usa servidor de señalización gratuito (0.peerjs.com)
- AniList API: 90 solicitudes por minuto (público, sin API key)

## 🤝 Contribuciones

Este es un proyecto personal para jugar con amigos. Las sugerencias son bienvenidas.

## 📄 Licencia

Proyecto de código abierto para uso personal y educativo.

## 🎨 Créditos

- Three.js para el renderizado 3D
- PeerJS para la networking WebRTC
- AniList para la base de datos de anime
- Diseño inspirado en conceptos de avatares (similar a Miis, Animal Crossing, Bitmoji)