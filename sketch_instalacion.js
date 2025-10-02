let video
let prevFrame
let currentFrame
let motionGrid = []
let revealedCells = [] // Para mantener registro de qué celdas han sido reveladas
let cellBrightness = [] // Para almacenar el brillo promedio de cada celda
let gazaImage // Imagen que se revelará con el movimiento
let gridCols = 3 // 3 columnas para vertical
let gridRows = 4 // 4 filas para vertical
let gridWidth = 0 // Se calculará basado en viewport
let gridHeight = 0 // Se calculará basado en viewport
let cellWidth = 0
let cellHeight = 0
let gridOffsetX = 0 // Será calculado para centrar
let gridOffsetY = 0 // Será calculado para centrar
let threshold = 25 // Más sensible para instalación
let isVideoReady = false
let imageLoaded = false
let frameCount = 0 // Contador de frames para evitar detección temprana
let minFramesBeforeDetection = 60 // Más tiempo para instalación
let canvasWidth = 0
let canvasHeight = 0

// Variables OSC
let oscEnabled = true // Para habilitar/deshabilitar OSC
let oscHost = "127.0.0.1" // Dirección IP del receptor
let oscPort = 8000 // Puerto OSC

function preload () {
  // Cargar la imagen grande para instalación
  gazaImage = loadImage(
    'gaza_2023_big.png',
    () => {
      console.log('INSTALACIÓN: gaza_2023_big.png cargada exitosamente')
      console.log(
        'Dimensiones originales:',
        gazaImage.width,
        'x',
        gazaImage.height
      )
      console.log(
        'Orientación:',
        gazaImage.width > gazaImage.height
          ? 'APAISADA (ideal para instalación)'
          : 'Vertical'
      )

      // Verificar que es la imagen correcta
      if (gazaImage.width > 500 && gazaImage.height > 300) {
        console.log('✓ Imagen de alta resolución confirmada para instalación')
      } else {
        console.warn('⚠️ La imagen parece pequeña para una instalación')
      }

      imageLoaded = true
      calculateGridDimensions()
    },
    err => {
      console.error('Error cargando la imagen de instalación:', err)
      console.log(
        'Verificar que el archivo gaza_2023_big.png existe en la carpeta'
      )
    }
  )
}

function setup () {
  // Configurar canvas para ocupar todo el viewport
  canvasWidth = windowWidth
  canvasHeight = windowHeight

  let canvas = createCanvas(canvasWidth, canvasHeight)
  canvas.parent(document.body)
  pixelDensity(1)

  // Estilo para ocupar toda la pantalla
  canvas.style('position', 'fixed')
  canvas.style('top', '0')
  canvas.style('left', '0')
  canvas.style('z-index', '1000')

  // Ocultar cursor para experiencia inmersiva
  canvas.style('cursor', 'none')

  // Configurar video con la webcam externa
  video = createCapture(VIDEO)
  video.size(canvasWidth, canvasHeight)
  video.hide()

  // Esperar a que el video esté listo
  video.elt.addEventListener('loadedmetadata', () => {
    console.log('Video metadata cargado para instalación')
    console.log('Dimensiones del video:', video.width, 'x', video.height)
    console.log('Dimensiones del canvas:', canvasWidth, 'x', canvasHeight)
    isVideoReady = true
    initializeFrames()
  })

  // Inicializar grilla de movimiento
  initializeMotionGrid()

  // Calcular dimensiones de grilla
  calculateGridDimensions()

  console.log(
    'Setup de instalación completado - Canvas:',
    canvasWidth,
    'x',
    canvasHeight
  )
}

function calculateGridDimensions () {
  if (!imageLoaded) return

  // La grilla ocupará todo el viewport
  gridWidth = canvasWidth
  gridHeight = canvasHeight
  cellWidth = gridWidth / gridCols
  cellHeight = gridHeight / gridRows

  // No hay offset ya que ocupa toda la pantalla
  gridOffsetX = 0
  gridOffsetY = 0

  console.log('Grilla de instalación configurada:')
  console.log('- Viewport completo:', gridWidth, 'x', gridHeight)
  console.log('- Imagen original:', gazaImage.width, 'x', gazaImage.height)
  console.log(
    '- Celdas individuales:',
    cellWidth.toFixed(1),
    'x',
    cellHeight.toFixed(1)
  )
  console.log('- Grilla:', gridCols, 'columnas x', gridRows, 'filas')

  // Información sobre el mapeo de imagen a viewport
  console.log('- Mapeo: imagen completa -> viewport completo por segmentos')
  if (gazaImage.width > gazaImage.height) {
    console.log('- Imagen APAISADA detectada: se expandirá a viewport completo')
  }
}

function draw () {
  if (!isVideoReady || !imageLoaded) {
    // Pantalla negra durante carga (más apropiado para instalación)
    background(0)
    return
  }

  frameCount++

  // Mostrar el video actual ocupando toda la pantalla (flippeado como espejo)
  push()
  scale(-1, 1) // Invertir horizontalmente
  image(video, -canvasWidth, 0, canvasWidth, canvasHeight)
  pop()

  // Actualizar frame actual
  updateCurrentFrame()

  // Solo detectar movimiento después del período de calibración
  if (prevFrame && frameCount > minFramesBeforeDetection) {
    detectMotion()
    revealImageSegments()
  }

  // Actualizar frame anterior
  updatePrevFrame()

  // Información mínima para debug (solo en consola, no en pantalla)
  if (frameCount % 60 === 0) {
    // Cada segundo
    logDebugInfo()
  }
}

function initializeFrames () {
  // Crear buffers para los frames con las dimensiones del canvas
  prevFrame = createGraphics(canvasWidth, canvasHeight)
  currentFrame = createGraphics(canvasWidth, canvasHeight)

  prevFrame.pixelDensity(1)
  currentFrame.pixelDensity(1)

  console.log(
    'Frames de instalación inicializados:',
    canvasWidth,
    'x',
    canvasHeight
  )
}

function updateCurrentFrame () {
  if (!currentFrame) return

  // Capturar frame actual flippeado para coincidir con la visualización espejo
  currentFrame.push()
  currentFrame.scale(-1, 1) // Invertir horizontalmente
  currentFrame.image(video, -canvasWidth, 0, canvasWidth, canvasHeight)
  currentFrame.pop()
  currentFrame.loadPixels()
}

function updatePrevFrame () {
  if (!prevFrame || !currentFrame) return
  prevFrame.image(currentFrame, 0, 0)
  prevFrame.loadPixels()
}

function detectMotion () {
  if (!prevFrame || !currentFrame) return

  prevFrame.loadPixels()
  currentFrame.loadPixels()

  if (prevFrame.pixels.length === 0 || currentFrame.pixels.length === 0) {
    return
  }

  // Reinicializar grilla de movimiento
  for (let i = 0; i < gridCols; i++) {
    if (!motionGrid[i]) motionGrid[i] = []
    for (let j = 0; j < gridRows; j++) {
      motionGrid[i][j] = false
    }
  }

  // Analizar cada celda de la grilla
  for (let gridX = 0; gridX < gridCols; gridX++) {
    for (let gridY = 0; gridY < gridRows; gridY++) {
      let motionDetected = analyzeGridCell(gridX, gridY)
      motionGrid[gridX][gridY] = motionDetected

      // Si hay movimiento y la celda no estaba revelada antes
      if (motionDetected && !revealedCells[gridX][gridY]) {
        revealedCells[gridX][gridY] = true
        
        // Enviar mensaje OSC con el brillo de la celda
        if (cellBrightness[gridX] && cellBrightness[gridX][gridY] !== undefined) {
          sendOSCMessage(gridX, gridY, cellBrightness[gridX][gridY])
        }
      }
    }
  }
}

function analyzeGridCell (gridX, gridY) {
  let startX = Math.floor(gridOffsetX + gridX * cellWidth)
  let startY = Math.floor(gridOffsetY + gridY * cellHeight)
  let endX = Math.floor(gridOffsetX + (gridX + 1) * cellWidth)
  let endY = Math.floor(gridOffsetY + (gridY + 1) * cellHeight)

  let totalDifference = 0
  let pixelCount = 0

  // Muestreo más eficiente para instalación (cada 4 píxeles)
  for (let x = startX; x < endX; x += 4) {
    for (let y = startY; y < endY; y += 4) {
      if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
        let index = (y * canvasWidth + x) * 4

        if (
          index < prevFrame.pixels.length - 3 &&
          index < currentFrame.pixels.length - 3
        ) {
          let prevR = prevFrame.pixels[index]
          let prevG = prevFrame.pixels[index + 1]
          let prevB = prevFrame.pixels[index + 2]

          let currR = currentFrame.pixels[index]
          let currG = currentFrame.pixels[index + 1]
          let currB = currentFrame.pixels[index + 2]

          let prevLuminance = prevR * 0.299 + prevG * 0.587 + prevB * 0.114
          let currLuminance = currR * 0.299 + currG * 0.587 + currB * 0.114

          let difference = Math.abs(prevLuminance - currLuminance)
          totalDifference += difference
          pixelCount++
        }
      }
    }
  }

  if (pixelCount === 0) return false

  let avgDifference = totalDifference / pixelCount
  return avgDifference > threshold
}

function revealImageSegments () {
  // Dibujar los segmentos de imagen revelados permanentemente
  for (let gridX = 0; gridX < gridCols; gridX++) {
    for (let gridY = 0; gridY < gridRows; gridY++) {
      if (revealedCells[gridX] && revealedCells[gridX][gridY]) {
        // Calcular posiciones en el canvas (viewport completo)
        let canvasX = gridOffsetX + gridX * cellWidth
        let canvasY = gridOffsetY + gridY * cellHeight

        // Calcular coordenadas proporcionales en la imagen original
        // Esto mapea cada celda de grilla a su segmento correspondiente en la imagen
        let imgSourceX = (gridX / gridCols) * gazaImage.width
        let imgSourceY = (gridY / gridRows) * gazaImage.height
        let imgSourceW = gazaImage.width / gridCols
        let imgSourceH = gazaImage.height / gridRows

        // Dibujar el segmento específico de la imagen
        // La imagen se escala automáticamente para llenar cada celda del viewport
        image(
          gazaImage,
          canvasX,
          canvasY,
          cellWidth,
          cellHeight, // destino: celda en viewport
          imgSourceX,
          imgSourceY,
          imgSourceW,
          imgSourceH // origen: segmento en imagen
        )
      }
    }
  }
}

function initializeMotionGrid () {
  motionGrid = []
  revealedCells = []
  cellBrightness = []

  for (let i = 0; i < gridCols; i++) {
    motionGrid[i] = []
    revealedCells[i] = []
    cellBrightness[i] = []
    for (let j = 0; j < gridRows; j++) {
      motionGrid[i][j] = false
      revealedCells[i][j] = false
      cellBrightness[i][j] = 0
    }
  }
  
  // Calcular el brillo de cada celda de la imagen si ya está cargada
  if (imageLoaded) {
    calculateCellBrightness()
  }
}

function logDebugInfo () {
  let revealedCount = 0
  for (let i = 0; i < revealedCells.length; i++) {
    if (revealedCells[i]) {
      for (let j = 0; j < revealedCells[i].length; j++) {
        if (revealedCells[i][j]) revealedCount++
      }
    }
  }

  console.log(
    `Instalación - Frame: ${frameCount}, FPS: ${Math.round(
      frameRate()
    )}, Reveladas: ${revealedCount}/${gridCols * gridRows}`
  )

  if (revealedCount === gridCols * gridRows) {
    console.log('¡INSTALACIÓN COMPLETA! Imagen totalmente revelada.')
  }
}

// Función para comunicarse con el HTML
function getInstallationStatus () {
  let revealedCount = 0
  for (let i = 0; i < revealedCells.length; i++) {
    if (revealedCells[i]) {
      for (let j = 0; j < revealedCells[i].length; j++) {
        if (revealedCells[i][j]) revealedCount++
      }
    }
  }

  let status = 'Calibrando...'
  if (frameCount > minFramesBeforeDetection) {
    if (revealedCount === gridCols * gridRows) {
      status = 'Completa'
    } else if (revealedCount > 0) {
      status = 'Revelando...'
    } else {
      status = 'Esperando movimiento'
    }
  }

  return {
    revealed: revealedCount,
    total: gridCols * gridRows,
    status: status,
    fps: Math.round(frameRate())
  }
}

// Controles para instalación
function keyPressed () {
  if (key === 'r' || key === 'R') {
    // Reset silencioso
    for (let i = 0; i < gridCols; i++) {
      for (let j = 0; j < gridRows; j++) {
        if (revealedCells[i]) {
          revealedCells[i][j] = false
        }
      }
    }
    console.log('Instalación reseteada')
  }

  if (key === 'f' || key === 'F') {
    // Toggle fullscreen
    let fs = fullscreen()
    fullscreen(!fs)
  }

  if (key === 'i' || key === 'I') {
    // Mostrar información en consola
    logDebugInfo()
    console.log('Dimensiones canvas:', canvasWidth, 'x', canvasHeight)
    console.log('Dimensiones imagen:', gazaImage.width, 'x', gazaImage.height)
    console.log('Grilla:', gridCols, 'x', gridRows)
  }
}

// Redimensionar cuando cambie el tamaño de ventana
function windowResized () {
  canvasWidth = windowWidth
  canvasHeight = windowHeight
  resizeCanvas(canvasWidth, canvasHeight)

  // Recalcular dimensiones de grilla
  calculateGridDimensions()

  // Reinicializar frames con nuevas dimensiones
  if (isVideoReady) {
    initializeFrames()
  }

  console.log(
    'Canvas redimensionado para instalación:',
    canvasWidth,
    'x',
    canvasHeight
  )
}

// Ocultar elementos de la página para experiencia inmersiva
document.addEventListener('DOMContentLoaded', function () {
  // Ocultar todos los elementos excepto el canvas
  let allElements = document.querySelectorAll('body > *:not(canvas)')
  allElements.forEach(el => {
    if (el.tagName !== 'SCRIPT') {
      el.style.display = 'none'
    }
  })

  // Estilo del body para instalación
  document.body.style.margin = '0'
  document.body.style.padding = '0'
  document.body.style.overflow = 'hidden'
  document.body.style.backgroundColor = '#000'
})

// Funciones OSC para sonificación

function calculateCellBrightness() {
  if (!gazaImage || !imageLoaded) return
  
  gazaImage.loadPixels()
  
  for (let gridX = 0; gridX < gridCols; gridX++) {
    for (let gridY = 0; gridY < gridRows; gridY++) {
      let brightness = calculateCellAverageBrightness(gridX, gridY)
      cellBrightness[gridX][gridY] = brightness
    }
  }
  
  console.log("Brillo de celdas calculado para instalación:")
  for (let y = 0; y < gridRows; y++) {
    let row = ""
    for (let x = 0; x < gridCols; x++) {
      row += cellBrightness[x][y].toFixed(1) + " "
    }
    console.log(`Fila ${y}: ${row}`)
  }
}

function calculateCellAverageBrightness(gridX, gridY) {
  if (!gazaImage || !imageLoaded) return 0
  
  // Calcular las coordenadas de la celda en la imagen original
  let imgCellWidth = gazaImage.width / gridCols
  let imgCellHeight = gazaImage.height / gridRows
  let startX = Math.floor(gridX * imgCellWidth)
  let startY = Math.floor(gridY * imgCellHeight)
  let endX = Math.floor((gridX + 1) * imgCellWidth)
  let endY = Math.floor((gridY + 1) * imgCellHeight)
  
  let totalBrightness = 0
  let pixelCount = 0
  
  // Analizar cada pixel en la región de la celda
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      let index = (y * gazaImage.width + x) * 4
      let r = gazaImage.pixels[index]
      let g = gazaImage.pixels[index + 1]
      let b = gazaImage.pixels[index + 2]
      
      // Calcular brillo usando fórmula de luminancia
      let brightness = (r * 0.299 + g * 0.587 + b * 0.114)
      totalBrightness += brightness
      pixelCount++
    }
  }
  
  return pixelCount > 0 ? totalBrightness / pixelCount : 0
}

function sendOSCMessage(gridX, gridY, brightness) {
  if (!oscEnabled) return
  
  // Normalizar el brillo a un rango 0-1
  let normalizedBrightness = brightness / 255.0
  
  console.log(`OSC INSTALACIÓN: Celda [${gridX},${gridY}] revelada - Brillo: ${brightness.toFixed(1)} (${(normalizedBrightness * 100).toFixed(1)}%)`)
  
  // En una implementación real, aquí iría el envío OSC
  simulateOSCSend(gridX, gridY, normalizedBrightness)
}

function simulateOSCSend(gridX, gridY, normalizedBrightness) {
  // Simular el mensaje OSC que se enviaría
  let oscAddress = `/gaza/cell/${gridX}/${gridY}`
  let oscMessage = {
    address: oscAddress,
    args: [
      { type: 'i', value: gridX },           // Posición X de la celda
      { type: 'i', value: gridY },           // Posición Y de la celda  
      { type: 'f', value: normalizedBrightness }, // Brillo normalizado
      { type: 'i', value: Date.now() }       // Timestamp
    ]
  }
  
  console.log(`[OSC SIMULADO INSTALACIÓN] ${oscHost}:${oscPort} -> ${JSON.stringify(oscMessage)}`)
}
