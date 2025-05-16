# Quiescence - A Modern Chess Interface

A responsive chess application built with Vue 3 and Vite, featuring a clean UI and complete chess rules implementation.

![Chess Board](/public/chess-preview.png)

## Features

- ♟️ Complete chess rules implementation
- ♜ All piece movements including special moves (castling, en passant, pawn promotion)
- ♞ Move validation and check detection
- ♝ Responsive design that works on desktop and mobile
- ♛ Visual indicators for selected pieces and legal moves
- ♚ Captured pieces display
- ♛ Turn indicator

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/quiescence.git
   cd quiescence
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

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
