# 🕹️ Tetris Elite - Cliente Web

La experiencia definitiva de Tetris con modo batalla en tiempo real, efectos visuales premium y diseño responsivo.

## ✨ Características
- **Modo Batalla Online:** Compite contra otros jugadores en tiempo real.
- **Efectos Visuales:** Sistema de partículas, efectos de neón y animaciones fluidas.
- **Multijugador Real-Time:** Ve las piezas de tu oponente moviéndose en vivo.
- **Responsive Design:** Optimizado para PC, Tablets y Smartphones (Android).
- **Glassmorphism UI:** Interfaz moderna basada en transparencias y desenfoque.

## 🎮 Controles

### Teclado (PC)
- `Flechas Izq/Der`: Mover pieza.
- `Flecha Arriba`: Rotar.
- `Flecha Abajo`: Caída suave.
- `Espacio`: Caída instantánea (Hard Drop).
- `C / Shift`: Guardar pieza (Hold).
- `Esc`: Menú de pausa / Salir.

### Táctil (Móvil)
- Deslizar y botones integrados en pantalla para todas las acciones.

## 🛠️ Desarrollo
El frontend no requiere compilación previa. Se basa en módulos de JavaScript nativo.

```bash
# Iniciar con un servidor local para evitar errores de CORS
npx serve .
# O simplemente abrir index.html
```

## 📱 Despliegue Android
Este proyecto está preparado para ser empaquetado con **Capacitor**.
1. Instalar Capacitor: `npm install @capacitor/core @capacitor/cli`
2. Generar proyecto Android: `npx cap add android`
3. Sincronizar: `npx cap sync`
4. Abrir en Android Studio: `npx cap open android`
