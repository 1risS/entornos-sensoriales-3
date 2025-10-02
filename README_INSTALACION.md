# Gaza 2023-2025 - Instalación Interactiva

## Descripción
Instalación de net art que utiliza detección de movimiento para revelar progresivamente una imagen de Gaza, creando una experiencia inmersiva donde el movimiento del espectador desvela la realidad oculta.

## Configuración para Instalación

### Hardware Requerido
- Monitor vertical (rotado 90°)
- Webcam externa USB
- Computadora con navegador web moderno
- Conexión a internet (para cargar p5.js) o servidor local

### Software
- Navegador web (Chrome, Firefox, Safari, Edge)
- Servidor HTTP local (Python, Node.js, etc.)

## Instalación y Configuración

### 1. Preparar Archivos
Asegurate de tener estos archivos en el directorio:
- `instalacion.html` - Página principal de la instalación
- `sketch_instalacion.js` - Código principal de p5.js
- `gaza_2023_big.png` - Imagen de alta resolución a revelar

### 2. Iniciar Servidor Local
```bash
# Con Python 3
python3 -m http.server 5500

# O con Node.js (si tienes http-server instalado)
npx http-server -p 5500
```

### 3. Abrir Instalación
Navegar a: `http://localhost:5500/instalacion.html`

### 4. Configurar Monitor
- Rotar el monitor 90° para orientación vertical
- Posicionar la webcam para capturar el área frente al monitor
- Ajustar iluminación para buena detección de movimiento

### 5. Calibrar
- Esperar ~2 segundos para calibración automática
- Probar movimiento frente a la cámara
- Ajustar posición según sea necesario

## Controles de Instalación

### Teclas Disponibles
- **F**: Toggle pantalla completa
- **R**: Reiniciar instalación (limpiar imagen revelada)
- **I**: Toggle panel de debug (para técnicos)
- **ESC**: Salir de pantalla completa

### Modo Debug
Presionar 'I' muestra información técnica:
- FPS actual
- Número de celdas reveladas
- Estado del sistema

## Configuración Avanzada

### Ajustar Sensibilidad
En `sketch_instalacion.js`, línea ~15:
```javascript
let threshold = 25 // Reducir para más sensibilidad, aumentar para menos
```

### Cambiar Grilla
En `sketch_instalacion.js`, líneas ~8-9:
```javascript
let gridCols = 3 // Número de columnas
let gridRows = 4 // Número de filas
```

### Tiempo de Calibración
En `sketch_instalacion.js`, línea ~19:
```javascript
let minFramesBeforeDetection = 60 // Frames antes de detectar (60 = ~2 segundos)
```

## Funcionamiento

### Experiencia del Usuario
1. El espectador se acerca al monitor
2. Ve su imagen reflejada en la webcam
3. Al moverse, revela progresivamente segmentos de la imagen de Gaza
4. Cada segmento revelado permanece visible
5. La experiencia completa se logra cuando toda la imagen está revelada

### Aspectos Técnicos
- **Detección por celdas**: La pantalla se divide en una grilla (3×4 por defecto)
- **Frame difference**: Compara frames consecutivos para detectar movimiento
- **Persistencia**: Los segmentos revelados permanecen visibles
- **Optimización**: Muestreo de píxeles cada 4 para mejor rendimiento

## Resolución de Problemas

### No se detecta movimiento
- Verificar permisos de cámara en el navegador
- Comprobar que la webcam esté conectada
- Ajustar iluminación (evitar contraluz)
- Reducir el valor de `threshold`

### Imagen no se ve
- Verificar que `gaza_2023_big.png` esté en el directorio
- Comprobar la consola del navegador para errores
- Asegurar que el servidor esté corriendo

### Performance lento
- Cerrar otras aplicaciones
- Usar navegador actualizado
- Reducir resolución de la webcam si es posible

### Pantalla en negro
- Verificar permisos de cámara
- Esperar tiempo de calibración completo
- Revisar consola del navegador para errores

## Consideraciones Artísticas

### Concepto
La instalación explora temas de:
- Visibilidad/invisibilidad de conflictos
- Interacción corporal con la información
- Revelación progresiva de realidades ocultas
- Presencia física necesaria para acceder a contenido

### Experiencia Deseada
- Contemplación e interacción física
- Descubrimiento progresivo
- Reflexión sobre el acto de "revelar" información
- Conexión entre movimiento corporal y acceso a la verdad

## Mantenimiento

### Durante la Exhibición
- Monitor funcionamiento cada hora
- Reiniciar con 'R' si es necesario
- Verificar que la webcam mantenga buena visión del área
- Limpiar lente de cámara regularmente

### Logs del Sistema
Revisar consola del navegador para:
- Errores de carga de imagen
- Problemas de webcam
- Performance issues
- Estado de calibración

## Créditos
Instalación de net art sobre Gaza 2023-2025
Desarrollado con p5.js y tecnologías web
