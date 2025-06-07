# Quiescence - A Modern Chess Experience

A responsive chess application built with Vue 3, Vite, and Electron, featuring a clean UI, realistic sound effects, and complete chess rules implementation. Play in your browser or as a native desktop application.

![Chess Board](/public/chess-preview.png)

## ✨ Features

### Gameplay
- ♟️ Complete chess rules implementation
- ♜ All piece movements including special moves (castling, en passant, pawn promotion)
- ♞ Move validation and check detection
- ♛ Visual indicators for selected pieces and legal moves
- ♚ Captured pieces display
- ♛ Turn indicator

### Desktop Experience
- 🖥️ Native desktop application (Windows, macOS, Linux)
- 🎮 Realistic wooden chess piece sounds
- 🎚️ Sound controls with volume adjustment
- 🖱️ Native window controls
- 📦 Easy installation with auto-updates

### Web Version
- 🌐 Responsive design for all devices
- 📱 Touch-friendly interface
- ⚡ Fast loading with Vite

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Git

### Web Version

1. Clone the repository
   ```bash
   git clone https://github.com/LarryCodes/quiescence.git
   cd quiescence
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Desktop Application

#### Development

1. Install dependencies (if not already done)
   ```bash
   npm install
   ```

2. Start the development environment
   ```bash
   npm run electron:dev
   ```

#### Building for Production

Build installers for all platforms:
```bash
npm run electron:build
```

Build for specific platform:
```bash
# Windows
npx electron-builder --win

# macOS
npx electron-builder --mac

# Linux
npx electron-builder --linux
```

Builds will be available in the `release` directory.

## 🎮 Controls

- Click and drag pieces to move them
- Right-click to cancel a move
- Use the sound controls in the bottom-right to adjust volume or mute

## 🛠️ Project Structure

```
src/
  ├── components/     # Vue components
  ├── css/            # Stylesheets
  ├── utils/          # Game logic and utilities
  └── main.js         # Application entry point

dist-electron/       # Electron main process files
build/               # Build configuration and assets
public/              # Static assets
```

## 📦 Dependencies

- Vue 3 - Progressive JavaScript framework
- Vite - Next generation frontend tooling
- Electron - Cross-platform desktop apps
- chess.js - Chess logic
- Web Audio API - Sound effects

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chess piece icons by [Chess.com](https://www.chess.com/)
- Sound effects generated with Web Audio API
- Built with ❤️ by [Your Name]

## Project Structure

```
src/
├── assets/         # Static assets
├── components/     # Vue components
│   └── ChessBoard.vue  # Main chess board component
├── utils/
│   ├── chessEngine.js   # Core game logic
│   ├── moveGenerator.js # Move generation
│   └── chessUtils.js    # Helper functions
├── App.vue         # Root component
└── main.js         # Application entry point
```

## Future Improvements

- [ ] Add UCI protocol support for chess engine integration
- [ ] Implement game history and move list
- [ ] Add game timers
- [ ] Support for different board themes
- [ ] Add move sound effects
- [ ] Implement game saving/loading

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Vue 3](https://v3.vuejs.org/) and [Vite](https://vitejs.dev/)
- Chess piece symbols from Unicode
- Inspired by classic chess interfaces
