<script setup>
import { ref, watch } from 'vue';
import { useChessEngine } from '@utils/chessEngine';
import { files, ranks, BOARD_SIZE } from '@utils/chessUtils';
import { STARTING_FEN } from '@utils/fenUtils';
import '@styles/components/ChessBoard.css';

// Get chess engine functionality
const {
  // Game state
  pieces,
  selectedSquare,
  currentPlayer,
  capturedByWhite,
  capturedByBlack,
  inCheck,
  halfmoveClock,
  fullmoveNumber,
  
  // Game actions
  handleSquareClick,
  resetGame,
  
  // Helper functions
  getPiece,
  isSelected,
  isPossibleMove,
  isWhitePiece,
  toAlgebraic,
  
  // FEN-related methods
  loadFen,
  getCurrentFen
} = useChessEngine();

// Define board-related constants for the template
const boardSize = BOARD_SIZE;

// FEN input handling
const fenInput = ref(STARTING_FEN);
const fenError = ref('');

// Update FEN input when the board changes
const updateFenInput = () => {
  fenInput.value = getCurrentFen();
};

// Load position from FEN input
const loadFenPosition = () => {
  fenError.value = '';
  try {
    const success = loadFen(fenInput.value);
    if (!success) {
      fenError.value = 'Invalid FEN notation';
    }
  } catch (error) {
    fenError.value = error.message || 'Invalid FEN notation';
  }
};

// Reset to starting position
const resetToStartingPosition = () => {
  fenInput.value = STARTING_FEN;
  resetGame();
  fenError.value = '';
};

// Watch for changes in the board state and update FEN input
watch([currentPlayer, pieces], () => {
  updateFenInput();
}, { deep: true });
</script>

<template>
  <div class="turn-indicator compact" :class="currentPlayer">
    <span v-if="currentPlayer === 'white'">&#9812; White's turn</span>
    <span v-else>&#9818; Black's turn</span>
  </div>
  <div class="chess-board">
    <!-- Top coordinates (letters) -->
    <div class="coordinates top-coordinates">
      <div class="coordinate" v-for="file in files" :key="'top-' + file">{{ file }}</div>
    </div>
    
    <div class="board-container">
      <!-- Left coordinates (numbers) -->
      <div class="coordinates left-coordinates">
        <div class="coordinate" v-for="rank in ranks" :key="'left-' + rank">{{ rank }}</div>
      </div>
      
      <!-- The chess board -->
      <div class="board">
        <div 
          v-for="row in boardSize" 
          :key="'row-' + row"
          class="board-row"
        >
          <div 
            v-for="col in boardSize" 
            :key="'col-' + col"
            :class="[
              'square',
              ((row + col) % 2 === 0) ? 'light' : 'dark',
              { 'selected': isSelected(row, col), 'possible-move': isPossibleMove(row, col) }
            ]"
            @click="handleSquareClick(row, col)"
            :data-position="toAlgebraic(row, col)"
          >
            <span 
              v-if="getPiece(row, col)" 
              class="chess-piece" 
              :class="{ 'white': isWhitePiece(row, col) }" 
              v-html="getPiece(row, col)">
            </span>
          </div>
        </div>
      </div>
      
      <!-- Right coordinates (numbers) -->
      <div class="coordinates right-coordinates">
        <div class="coordinate" v-for="rank in ranks" :key="'right-' + rank">{{ rank }}</div>
      </div>
    </div>
    
    <!-- Bottom coordinates (letters) -->
    <div class="coordinates bottom-coordinates">
      <div class="coordinate" v-for="file in files" :key="'bottom-' + file">{{ file }}</div>
    </div>
  </div>
  <!-- Prisoners section removed -->
  
  <!-- FEN Notation Section -->
  <div class="fen-section">
    <div class="fen-controls">
      <div class="fen-input-group">
        <div class="fen-input-wrapper">
          <label for="fen-input" class="fen-label">FEN</label>
          <input 
            id="fen-input"
            type="text" 
            v-model="fenInput" 
            class="fen-input" 
            @click="updateFenInput"
          />
        </div>
        <div class="fen-buttons">
          <button @click="loadFenPosition" class="fen-button fen-button-dark">Load</button>
          <button @click="resetToStartingPosition" class="fen-button fen-button-light">Reset</button>
        </div>
      </div>
      <div v-if="fenError" class="fen-error">{{ fenError }}</div>
    </div>
    <div class="fen-info">
      <div class="fen-info-item">
        <span class="fen-info-label">Half-move:</span>
        <span class="fen-info-value">{{ halfmoveClock }}</span>
      </div>
      <div class="fen-info-item">
        <span class="fen-info-label">Full-move:</span>
        <span class="fen-info-value">{{ fullmoveNumber }}</span>
      </div>
    </div>
  </div>
</template>
