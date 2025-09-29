let video
let prevFrame
let currentFrame
let motionGrid = []
let gridCols = 2 // 2 columnas
let gridRows = 3 // 3 filas
let gridWidth = 270 // Ancho de la grilla
let gridHeight = 480 // Alto de la grilla
let cellWidth = gridWidth / gridCols // 135px por celda
let cellHeight = gridHeight / gridRows // 160px por celda
let gridOffsetX = (640 - gridWidth) / 2 // Centrar horizontalmente
let gridOffsetY = (480 - gridHeight) / 2 // Centrar verticalmente (será 0)
let threshold = 30
let overlayOpacity = 150
let isVideoReady = false

// Variables para controles
let thresholdSlider, opacitySlider
let thresholdDisplay, opacityDisplay

function setup () {
  // Crear canvas con densidad de píxeles consistente
  let canvas = createCanvas(640, 480)
  canvas.parent('canvas-container')
  pixelDensity(1) // Asegurar densidad consistente

  // Configurar video
  video = createCapture(VIDEO)
  video.size(640, 480)
  video.hide() // Ocultar el elemento de video HTML

  // Esperar a que el video esté listo
  video.elt.addEventListener('loadedmetadata', () => {
    console.log('Video metadata cargado')
    console.log('Dimensiones del video:', video.width, 'x', video.height)
    isVideoReady = true
    initializeFrames()
  })

  // Configurar controles
  setupControls()

  // Inicializar grilla de movimiento
  initializeMotionGrid()

  console.log('Setup completado - Canvas:', width, 'x', height)
}

function draw () {
  if (!isVideoReady) {
    // Mostrar mensaje de carga
    background(50)
    fill(255)
    textAlign(CENTER, CENTER)
    textSize(20)
    text('Iniciando cámara...', width / 2, height / 2)
    return
  }

  // Mostrar el video actual
  image(video, 0, 0, width, height)

  // Actualizar frame actual
  updateCurrentFrame()

  // Detectar movimiento si tenemos frame anterior
  if (prevFrame) {
    detectMotion()
    drawMotionGrid()
  }

  // Actualizar frame anterior
  updatePrevFrame()

  // Mostrar información
  drawInfo()
}

function initializeFrames () {
  // Crear buffers para los frames con las dimensiones exactas del canvas
  prevFrame = createGraphics(width, height)
  currentFrame = createGraphics(width, height)
  
  // Configurar los gráficos para pixelDensity consistente
  prevFrame.pixelDensity(1)
  currentFrame.pixelDensity(1)

  console.log('Frames inicializados con dimensiones:', width, 'x', height)
}

function updateCurrentFrame () {
  if (!currentFrame) return

  // Capturar frame actual - asegurar que coincida exactamente con las dimensiones del canvas
  currentFrame.image(video, 0, 0, width, height)
  currentFrame.loadPixels()
}

function updatePrevFrame () {
  if (!prevFrame || !currentFrame) return

  // Copiar frame actual al anterior
  prevFrame.image(currentFrame, 0, 0)
  prevFrame.loadPixels()
}

function detectMotion () {
  if (!prevFrame || !currentFrame) return

  // Asegurar que los pixels estén cargados
  prevFrame.loadPixels()
  currentFrame.loadPixels()

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
    }
  }
}

function analyzeGridCell (gridX, gridY) {
  // Calcular la posición real de la celda en el canvas
  let startX = Math.floor(gridOffsetX + gridX * cellWidth)
  let startY = Math.floor(gridOffsetY + gridY * cellHeight)
  let endX = Math.floor(gridOffsetX + (gridX + 1) * cellWidth)
  let endY = Math.floor(gridOffsetY + (gridY + 1) * cellHeight)

  let totalDifference = 0
  let pixelCount = 0

  // Comparar pixels en esta celda de la grilla
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      // Asegurar que estamos dentro de los límites del canvas
      if (x >= 0 && x < width && y >= 0 && y < height) {
        let index = (y * width + x) * 4

        // Verificar que el índice esté dentro del rango
        if (index < prevFrame.pixels.length - 3 && index < currentFrame.pixels.length - 3) {
          // Obtener valores RGB del frame anterior
          let prevR = prevFrame.pixels[index]
          let prevG = prevFrame.pixels[index + 1]
          let prevB = prevFrame.pixels[index + 2]

          // Obtener valores RGB del frame actual
          let currR = currentFrame.pixels[index]
          let currG = currentFrame.pixels[index + 1]
          let currB = currentFrame.pixels[index + 2]

          // Calcular diferencia (usando luminancia)
          let prevLuminance = prevR * 0.299 + prevG * 0.587 + prevB * 0.114
          let currLuminance = currR * 0.299 + currG * 0.587 + currB * 0.114

          let difference = Math.abs(prevLuminance - currLuminance)
          totalDifference += difference
          pixelCount++
        }
      }
    }
  }

  // Evitar división por cero
  if (pixelCount === 0) return false

  // Calcular diferencia promedio
  let avgDifference = totalDifference / pixelCount

  // Retornar true si supera el umbral
  return avgDifference > threshold
}

function drawMotionGrid () {
  // Dibujar celdas con movimiento
  fill(255, 0, 0, overlayOpacity) // Rojo semi-transparente
  noStroke()

  for (let gridX = 0; gridX < gridCols; gridX++) {
    for (let gridY = 0; gridY < gridRows; gridY++) {
      if (motionGrid[gridX] && motionGrid[gridX][gridY]) {
        let x = gridOffsetX + gridX * cellWidth
        let y = gridOffsetY + gridY * cellHeight
        rect(x, y, cellWidth, cellHeight)
      }
    }
  }

  // Dibujar grilla (opcional)
  drawGrid()
}

function drawGrid () {
  stroke(255, 255, 255, 100) // Líneas blancas semi-transparentes más visibles
  strokeWeight(2)

  // Líneas verticales (separando columnas)
  for (let i = 0; i <= gridCols; i++) {
    let x = gridOffsetX + i * cellWidth
    line(x, gridOffsetY, x, gridOffsetY + gridHeight)
  }

  // Líneas horizontales (separando filas)
  for (let j = 0; j <= gridRows; j++) {
    let y = gridOffsetY + j * cellHeight
    line(gridOffsetX, y, gridOffsetX + gridWidth, y)
  }
}

function initializeMotionGrid () {
  motionGrid = []
  for (let i = 0; i < gridCols; i++) {
    motionGrid[i] = []
    for (let j = 0; j < gridRows; j++) {
      motionGrid[i][j] = false
    }
  }
}

function setupControls () {
  // Obtener referencias a los controles
  thresholdSlider = select('#threshold')
  opacitySlider = select('#opacity')

  thresholdDisplay = select('#threshold-value')
  opacityDisplay = select('#opacity-value')

  // Configurar eventos
  if (thresholdSlider) {
    thresholdSlider.input(() => {
      threshold = thresholdSlider.value()
      if (thresholdDisplay) thresholdDisplay.html(threshold)
    })
  }

  if (opacitySlider) {
    opacitySlider.input(() => {
      overlayOpacity = parseInt(opacitySlider.value())
      if (opacityDisplay) opacityDisplay.html(overlayOpacity)
    })
  }

  // Ocultar el control de tamaño de grilla ya que ahora es fijo
  let gridContainer = select('#grid-size')
  if (gridContainer && gridContainer.elt) {
    // Buscar el contenedor padre y ocultarlo
    let parentElement = gridContainer.elt.parentElement
    if (parentElement) {
      parentElement.style.display = 'none'
    }
  }
}

function drawInfo () {
  // Mostrar FPS y información de depuración
  fill(255, 255, 255, 200)
  noStroke()
  rect(10, 10, 220, 100)

  fill(0)
  textAlign(LEFT)
  textSize(12)
  text(`FPS: ${Math.round(frameRate())}`, 20, 25)
  text(`Umbral: ${threshold}`, 20, 40)
  text(`Grilla: ${gridCols}x${gridRows} (${gridWidth}x${gridHeight}px)`, 20, 55)
  text(`Celda: ${cellWidth}x${cellHeight}px`, 20, 70)
  text(`Video: ${isVideoReady ? 'Activo' : 'Cargando...'}`, 20, 85)

  // Contar celdas con movimiento
  let motionCells = 0
  for (let i = 0; i < motionGrid.length; i++) {
    if (motionGrid[i]) {
      for (let j = 0; j < motionGrid[i].length; j++) {
        if (motionGrid[i][j]) motionCells++
      }
    }
  }
  text(`Movimiento: ${motionCells} celdas`, 20, 100)
}

// Función para manejar errores de video
function videoError (err) {
  console.error('Error de video:', err)
  background(100, 0, 0)
  fill(255)
  textAlign(CENTER, CENTER)
  textSize(16)
  text('Error al acceder a la cámara', width / 2, height / 2 - 10)
  text('Verifica los permisos', width / 2, height / 2 + 10)
}

// Redimensionar cuando cambie el tamaño de ventana
function windowResized () {
  // Mantener el tamaño fijo para consistencia
  // resizeCanvas(windowWidth, windowHeight);
}
