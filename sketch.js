let video
let prevFrame
let currentFrame
let motionGrid = []
let revealedCells = [] // Para mantener registro de qué celdas han sido reveladas
let gazaImage // Imagen que se revelará con el movimiento
let gridCols = 2 // 2 columnas
let gridRows = 3 // 3 filas
let gridWidth = 270 // Ancho de la grilla (será actualizado con las dimensiones de la imagen)
let gridHeight = 480 // Alto de la grilla (será actualizado con las dimensiones de la imagen)
let cellWidth = gridWidth / gridCols
let cellHeight = gridHeight / gridRows
let gridOffsetX = 0 // Será calculado para centrar
let gridOffsetY = 0 // Será calculado para centrar
let threshold = 30
let overlayOpacity = 150
let isVideoReady = false
let imageLoaded = false
let frameCount = 0 // Contador de frames para evitar detección temprana
let minFramesBeforeDetection = 30 // Esperar 30 frames antes de empezar a detectar

// Variables para controles
let thresholdSlider, opacitySlider
let thresholdDisplay, opacityDisplay

function preload () {
  // Cargar la imagen que se revelará
  gazaImage = loadImage(
    'gaza_2023.png',
    () => {
      console.log('Imagen cargada exitosamente')
      console.log(
        'Dimensiones originales:',
        gazaImage.width,
        'x',
        gazaImage.height
      )
      console.log(
        'Orientación:',
        gazaImage.width > gazaImage.height
          ? 'Horizontal (apaisada)'
          : 'Vertical'
      )

      // Verificar si la imagen es muy pequeña
      if (gazaImage.width < 200 || gazaImage.height < 200) {
        console.warn(
          '¡ADVERTENCIA! La imagen es muy pequeña:',
          gazaImage.width,
          'x',
          gazaImage.height
        )
        console.log('Se recomienda una imagen de al menos 400x300 píxeles')
      }

      // Para imagen horizontal (apaisada), usar toda la imagen
      // La grilla se ajustará a estas dimensiones
      gridWidth = gazaImage.width
      gridHeight = gazaImage.height
      cellWidth = gridWidth / gridCols // Ancho de cada celda
      cellHeight = gridHeight / gridRows // Alto de cada celda

      // Centrar la grilla en el canvas
      gridOffsetX = (640 - gridWidth) / 2
      gridOffsetY = (480 - gridHeight) / 2

      console.log('Grilla configurada:')
      console.log('- Dimensiones totales:', gridWidth, 'x', gridHeight)
      console.log(
        '- Celdas individuales:',
        cellWidth.toFixed(1),
        'x',
        cellHeight.toFixed(1)
      )
      console.log(
        '- Offset (centrado):',
        gridOffsetX.toFixed(1),
        ',',
        gridOffsetY.toFixed(1)
      )
      console.log('- Grilla:', gridCols, 'columnas x', gridRows, 'filas')

      imageLoaded = true
    },
    err => {
      console.error('Error cargando la imagen:', err)
      console.log('Verificar que el archivo gaza_2023.png existe en la carpeta')
    }
  )
}

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
  if (!isVideoReady || !imageLoaded) {
    // Mostrar mensaje de carga
    background(50)
    fill(255)
    textAlign(CENTER, CENTER)
    textSize(20)
    if (!isVideoReady && !imageLoaded) {
      text('Iniciando cámara e imagen...', width / 2, height / 2)
    } else if (!isVideoReady) {
      text('Iniciando cámara...', width / 2, height / 2)
    } else {
      text('Cargando imagen...', width / 2, height / 2)
    }
    return
  }

  // Incrementar contador de frames
  frameCount++

  // Mostrar el video actual
  image(video, 0, 0, width, height)

  // Actualizar frame actual
  updateCurrentFrame()

  // Solo detectar movimiento después de unos frames iniciales y si tenemos frame anterior
  if (prevFrame && frameCount > minFramesBeforeDetection) {
    detectMotion()
    revealImageSegments() // Nueva función para revelar segmentos
  } else if (frameCount <= minFramesBeforeDetection) {
    // Mostrar mensaje de calibración
    fill(255, 255, 0, 200)
    noStroke()
    rect(width / 2 - 100, height - 40, 200, 30)

    fill(0)
    textAlign(CENTER, CENTER)
    textSize(12)
    let remainingFrames = minFramesBeforeDetection - frameCount
    text(
      `Calibrando cámara... ${Math.ceil(remainingFrames / 30)}s`,
      width / 2,
      height - 25
    )
  } else {
    // Solo mostrar la grilla sin detección
    drawGrid()
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

  // Verificar que ambos frames tienen datos válidos
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

      // Si hay movimiento, marcar la celda como revelada permanentemente
      if (motionDetected) {
        revealedCells[gridX][gridY] = true
      }
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
        if (
          index < prevFrame.pixels.length - 3 &&
          index < currentFrame.pixels.length - 3
        ) {
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

function revealImageSegments () {
  // Dibujar los segmentos de imagen revelados permanentemente
  for (let gridX = 0; gridX < gridCols; gridX++) {
    for (let gridY = 0; gridY < gridRows; gridY++) {
      if (revealedCells[gridX] && revealedCells[gridX][gridY]) {
        // Calcular posiciones en el canvas (donde se dibuja)
        let canvasX = gridOffsetX + gridX * cellWidth
        let canvasY = gridOffsetY + gridY * cellHeight

        // Calcular coordenadas de origen en la imagen original
        // Cada celda debe mostrar solo su porción correspondiente
        let imgSourceX = gridX * cellWidth
        let imgSourceY = gridY * cellHeight

        // Dibujar solo el segmento específico de la imagen
        image(
          gazaImage,
          canvasX,
          canvasY,
          cellWidth,
          cellHeight, // destino en canvas
          imgSourceX,
          imgSourceY,
          cellWidth,
          cellHeight
        ) // porción específica de la imagen original
      }
    }
  }

  // Dibujar grilla opcional para debug (se puede quitar)
  drawGrid()
}

function drawMotionGrid () {
  // Esta función ya no se usa - la funcionalidad está en revealImageSegments()
  // Mantenida para compatibilidad
}

function drawGrid () {
  stroke(255, 255, 255, 50) // Líneas blancas muy sutiles
  strokeWeight(1)

  // Solo dibujar la grilla si no todas las celdas están reveladas
  let allRevealed = true
  for (let i = 0; i < gridCols && allRevealed; i++) {
    for (let j = 0; j < gridRows && allRevealed; j++) {
      if (!revealedCells[i] || !revealedCells[i][j]) {
        allRevealed = false
      }
    }
  }

  // Si no todas las celdas están reveladas, mostrar grilla sutil
  if (!allRevealed) {
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
}

function initializeMotionGrid () {
  motionGrid = []
  revealedCells = []

  for (let i = 0; i < gridCols; i++) {
    motionGrid[i] = []
    revealedCells[i] = []
    for (let j = 0; j < gridRows; j++) {
      motionGrid[i][j] = false
      revealedCells[i][j] = false
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
  rect(10, 10, 280, 140)

  fill(0)
  textAlign(LEFT)
  textSize(12)
  text(`FPS: ${Math.round(frameRate())}`, 20, 25)
  text(`Frames: ${frameCount}`, 20, 40)
  text(`Umbral: ${threshold}`, 20, 55)
  text(`Grilla: ${gridCols}x${gridRows} (${gridWidth}x${gridHeight}px)`, 20, 70)
  text(`Celda: ${Math.round(cellWidth)}x${Math.round(cellHeight)}px`, 20, 85)
  text(`Video: ${isVideoReady ? 'Activo' : 'Cargando...'}`, 20, 100)
  text(`Imagen: ${imageLoaded ? 'Cargada' : 'Cargando...'}`, 20, 115)

  // Estado de detección
  let detectionStatus =
    frameCount > minFramesBeforeDetection ? 'Activa' : 'Calibrando...'
  text(`Detección: ${detectionStatus}`, 20, 130)

  // Contar celdas reveladas
  let revealedCount = 0
  let motionCells = 0

  for (let i = 0; i < revealedCells.length; i++) {
    if (revealedCells[i]) {
      for (let j = 0; j < revealedCells[i].length; j++) {
        if (revealedCells[i][j]) revealedCount++
      }
    }
  }

  for (let i = 0; i < motionGrid.length; i++) {
    if (motionGrid[i]) {
      for (let j = 0; j < motionGrid[i].length; j++) {
        if (motionGrid[i][j]) motionCells++
      }
    }
  }

  text(`Reveladas: ${revealedCount}/${gridCols * gridRows} celdas`, 20, 145)

  // Mostrar mensaje de completado
  if (revealedCount === gridCols * gridRows) {
    fill(0, 150, 0)
    textSize(14)
    textAlign(CENTER)
    text('¡Imagen completa revelada!', width / 2, height - 20)
  }
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

// Función para resetear las celdas reveladas (opcional)
function keyPressed () {
  if (key === 'r' || key === 'R') {
    // Reset: limpiar todas las celdas reveladas
    for (let i = 0; i < gridCols; i++) {
      for (let j = 0; j < gridRows; j++) {
        if (revealedCells[i]) {
          revealedCells[i][j] = false
        }
      }
    }

    // No resetear frameCount para evitar detección falsa inmediata
    console.log('Imagen reseteada - presiona R para resetear')
  }

  if (key === 'c' || key === 'C') {
    // Comando oculto: resetear todo incluyendo calibración
    frameCount = 0
    for (let i = 0; i < gridCols; i++) {
      for (let j = 0; j < gridRows; j++) {
        if (revealedCells[i]) {
          revealedCells[i][j] = false
        }
      }
    }
    console.log('Reset completo - recalibrando...')
  }
}
