<script setup>
import { ref, computed } from 'vue';

const boardSize = 8;

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = Array.from({ length: boardSize }, (_, i) => boardSize - i);

// Chess pieces with their starting positions using HTML entity codes
const initialPieces = {
  // Black pieces (top)
  'a8': '&#9820;', 'b8': '&#9822;', 'c8': '&#9821;', 'd8': '&#9819;',
  'e8': '&#9818;', 'f8': '&#9821;', 'g8': '&#9822;', 'h8': '&#9820;',
  'a7': '&#9823;', 'b7': '&#9823;', 'c7': '&#9823;', 'd7': '&#9823;',
  'e7': '&#9823;', 'f7': '&#9823;', 'g7': '&#9823;', 'h7': '&#9823;',
  
  // White pieces (bottom)
  'a2': '&#9817;', 'b2': '&#9817;', 'c2': '&#9817;', 'd2': '&#9817;',
  'e2': '&#9817;', 'f2': '&#9817;', 'g2': '&#9817;', 'h2': '&#9817;',
  'a1': '&#9814;', 'b1': '&#9816;', 'c1': '&#9815;', 'd1': '&#9813;',
  'e1': '&#9812;', 'f1': '&#9815;', 'g1': '&#9816;', 'h1': '&#9814;'
};

// Game state
const pieces = ref({ ...initialPieces });
const selectedSquare = ref(null);  // Track selected square in 'a1' format
const currentPlayer = ref('white'); // 'white' or 'black'
const capturedByWhite = ref([]); // Black pieces captured by white
const capturedByBlack = ref([]); // White pieces captured by black

// Special move tracking
const enPassantTarget = ref(null); // Square where en passant capture is possible
const castlingRights = ref({
  white: { kingSide: true, queenSide: true },
  black: { kingSide: true, queenSide: true }
});
const pieceHasMoved = ref({});
const inCheck = ref({ white: false, black: false });

// Convert between board coordinates and algebraic notation
const toAlgebraic = (row, col) => {
  const file = files[col - 1];
  const rank = boardSize - row + 1;
  return `${file}${rank}`;
};

const fromAlgebraic = (alg) => {
  const file = alg[0];
  const rank = parseInt(alg[1]);
  const col = files.indexOf(file) + 1;
  const row = boardSize - rank + 1;
  return { row, col };
};

// Function to get piece at a position
const getPiece = (row, col) => {
  const pos = toAlgebraic(row, col);
  return pieces.value[pos] || null;
};

// Handle square click
const handleSquareClick = (row, col) => {
  const position = toAlgebraic(row, col);
  const clickedPiece = getPiece(row, col);
  const isWhiteTurn = currentPlayer.value === 'white';

  // If a piece is already selected and this square is a possible move, move the piece
  if (selectedSquare.value && isPossibleMove(row, col)) {
    const newPieces = { ...pieces.value };
    const from = selectedSquare.value;
    const movingPiece = newPieces[from];
    const movingPieceCode = parseInt(movingPiece.replace(/[^0-9]/g, ''));
    const fromPos = fromAlgebraic(from);
    const toPos = { row, col };
    
    // Track that this piece has moved (for castling rights)
    pieceHasMoved.value[from] = true;
    pieceHasMoved.value[position] = true;
    
    // Handle regular capturing
    if (clickedPiece) {
      const capturedCode = parseInt(clickedPiece.replace(/[^0-9]/g, ''));
      if (capturedCode <= 9817) {
        capturedByWhite.value.push(clickedPiece); // White piece captured by black
      } else {
        capturedByBlack.value.push(clickedPiece); // Black piece captured by white
      }
    }
    
    // Handle en passant capture
    if ((movingPieceCode === 9817 || movingPieceCode === 9823) && // Pawn
        position === enPassantTarget.value) {
      // Determine the position of the captured pawn
      const direction = movingPieceCode === 9817 ? 1 : -1; // Direction to look for the captured pawn
      const capturedPawnRow = row + direction;
      const capturedPawnCol = col;
      const capturedPawnPos = toAlgebraic(capturedPawnRow, capturedPawnCol);
      const capturedPawn = newPieces[capturedPawnPos];
      
      // Add to captured list
      if (capturedPawn) {
        const capturedCode = parseInt(capturedPawn.replace(/[^0-9]/g, ''));
        if (capturedCode <= 9817) {
          capturedByWhite.value.push(capturedPawn);
        } else {
          capturedByBlack.value.push(capturedPawn);
        }
        
        // Remove the captured pawn
        delete newPieces[capturedPawnPos];
      }
    }
    
    // Handle castling (king moving two squares horizontally)
    if ((movingPieceCode === 9812 || movingPieceCode === 9818) && // King
        Math.abs(fromPos.col - toPos.col) === 2) { // Moved two squares horizontally
      // Determine rook positions
      const isKingSideCastle = toPos.col > fromPos.col;
      const rookFromCol = isKingSideCastle ? 8 : 1;
      const rookToCol = isKingSideCastle ? 6 : 4; // f1/f8 or d1/d8
      
      // Move the rook
      const rookFromPos = toAlgebraic(row, rookFromCol);
      const rookToPos = toAlgebraic(row, rookToCol);
      newPieces[rookToPos] = newPieces[rookFromPos];
      delete newPieces[rookFromPos];
    }
    
    // Update castling rights if king or rook moves
    if (movingPieceCode === 9812) { // White king
      castlingRights.value.white.kingSide = false;
      castlingRights.value.white.queenSide = false;
    } else if (movingPieceCode === 9818) { // Black king
      castlingRights.value.black.kingSide = false;
      castlingRights.value.black.queenSide = false;
    } else if (movingPieceCode === 9814) { // White rook
      if (from === 'a1') castlingRights.value.white.queenSide = false;
      if (from === 'h1') castlingRights.value.white.kingSide = false;
    } else if (movingPieceCode === 9820) { // Black rook
      if (from === 'a8') castlingRights.value.black.queenSide = false;
      if (from === 'h8') castlingRights.value.black.kingSide = false;
    }
    
    // Set en passant target if pawn moved two squares
    enPassantTarget.value = null; // Reset by default
    if ((movingPieceCode === 9817 || movingPieceCode === 9823) && // Pawn
        Math.abs(fromPos.row - toPos.row) === 2) { // Moved two squares
      const direction = movingPieceCode === 9817 ? -1 : 1; // White up, black down
      enPassantTarget.value = toAlgebraic(fromPos.row + direction, fromPos.col);
    }
    
    // Move the selected piece to the new position
    newPieces[position] = movingPiece;
    // Remove the piece from its old position
    delete newPieces[from];
    pieces.value = newPieces;
    selectedSquare.value = null; // Deselect after move
    // Switch turns
    currentPlayer.value = isWhiteTurn ? 'black' : 'white';
    return;
  }

  // Only allow selection of current player's pieces
  if (clickedPiece) {
    const code = parseInt(clickedPiece.replace(/[^0-9]/g, ''));
    const isWhitePieceSelected = code >= 9812 && code <= 9817;
    if ((isWhiteTurn && !isWhitePieceSelected) || (!isWhiteTurn && isWhitePieceSelected)) {
      // Ignore clicks on opponent's pieces
      return;
    }
  }

  // If clicking on a piece
  if (clickedPiece) {
    // If clicking on the already selected piece, deselect it
    if (selectedSquare.value === position) {
      selectedSquare.value = null;
    } else {
      selectedSquare.value = position;
    }
  } else {
    // If clicking on an empty square, deselect any selected piece
    selectedSquare.value = null;
  }
};

// Check if a piece is white
const isWhitePiece = (row, col) => {
  const piece = getPiece(row, col);
  if (!piece) return false;
  const code = parseInt(piece.replace(/[^0-9]/g, ''));
  // White pieces are 9812-9817, black pieces are 9818-9823
  const isWhite = code >= 9812 && code <= 9817;
  return isWhite;
};

// Check if a square is empty
const isEmpty = (row, col) => {
  return !getPiece(row, col);
};

// Check if a square contains an opponent's piece
const isOpponent = (row, col) => {
  const piece = getPiece(row, col);
  if (!piece || !selectedSquare.value) return false;
  const selectedPiece = pieces.value[selectedSquare.value];
  if (!selectedPiece) return false;
  const selectedCode = parseInt(selectedPiece.replace(/[^0-9]/g, ''));
  const targetCode = parseInt(piece.replace(/[^0-9]/g, ''));
  // White: 9812-9817, Black: 9818-9823
  if (selectedCode <= 9817 && targetCode >= 9818) return true;
  if (selectedCode >= 9818 && targetCode <= 9817) return true;
  return false;
};

// Check if a square is under attack by a specific side
const isSquareAttacked = (row, col, byWhite) => {
  // Check pawn attacks
  const pawnDirection = byWhite ? -1 : 1; // Direction pawns attack from
  for (const colOffset of [-1, 1]) {
    const attackRow = row + pawnDirection;
    const attackCol = col + colOffset;
    if (isWithinBoard(attackRow, attackCol)) {
      const piece = getPiece(attackRow, attackCol);
      if (piece) {
        const code = parseInt(piece.replace(/[^0-9]/g, ''));
        if ((byWhite && code === 9817) || (!byWhite && code === 9823)) {
          return true; // Pawn attack
        }
      }
    }
  }
  
  // Check knight attacks
  const knightMoves = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];
  for (const [rowOffset, colOffset] of knightMoves) {
    const attackRow = row + rowOffset;
    const attackCol = col + colOffset;
    if (isWithinBoard(attackRow, attackCol)) {
      const piece = getPiece(attackRow, attackCol);
      if (piece) {
        const code = parseInt(piece.replace(/[^0-9]/g, ''));
        if ((byWhite && code === 9816) || (!byWhite && code === 9822)) {
          return true; // Knight attack
        }
      }
    }
  }
  
  // Check diagonal attacks (bishop, queen)
  const diagonalDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [rowDir, colDir] of diagonalDirections) {
    let distance = 1;
    while (true) {
      const attackRow = row + rowDir * distance;
      const attackCol = col + colDir * distance;
      if (!isWithinBoard(attackRow, attackCol)) break;
      
      const piece = getPiece(attackRow, attackCol);
      if (piece) {
        const code = parseInt(piece.replace(/[^0-9]/g, ''));
        if ((byWhite && (code === 9815 || code === 9813)) || 
            (!byWhite && (code === 9821 || code === 9819))) {
          return true; // Bishop or Queen attack
        }
        break; // Any other piece blocks the attack
      }
      distance++;
    }
  }
  
  // Check straight attacks (rook, queen)
  const straightDirections = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [rowDir, colDir] of straightDirections) {
    let distance = 1;
    while (true) {
      const attackRow = row + rowDir * distance;
      const attackCol = col + colDir * distance;
      if (!isWithinBoard(attackRow, attackCol)) break;
      
      const piece = getPiece(attackRow, attackCol);
      if (piece) {
        const code = parseInt(piece.replace(/[^0-9]/g, ''));
        if ((byWhite && (code === 9814 || code === 9813)) || 
            (!byWhite && (code === 9820 || code === 9819))) {
          return true; // Rook or Queen attack
        }
        break; // Any other piece blocks the attack
      }
      distance++;
    }
  }
  
  // Check king attacks (only for adjacent squares)
  const kingMoves = [
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  for (const [rowOffset, colOffset] of kingMoves) {
    const attackRow = row + rowOffset;
    const attackCol = col + colOffset;
    if (isWithinBoard(attackRow, attackCol)) {
      const piece = getPiece(attackRow, attackCol);
      if (piece) {
        const code = parseInt(piece.replace(/[^0-9]/g, ''));
        if ((byWhite && code === 9812) || (!byWhite && code === 9818)) {
          return true; // King attack
        }
      }
    }
  }
  
  return false;
};

// Check if a king is in check
const isKingInCheck = (isWhiteKing) => {
  // Find the king's position
  let kingRow = 0, kingCol = 0;
  for (let row = 1; row <= 8; row++) {
    for (let col = 1; col <= 8; col++) {
      const piece = getPiece(row, col);
      if (piece) {
        const code = parseInt(piece.replace(/[^0-9]/g, ''));
        if ((isWhiteKing && code === 9812) || (!isWhiteKing && code === 9818)) {
          kingRow = row;
          kingCol = col;
          break;
        }
      }
    }
  }
  
  if (kingRow === 0) return false; // King not found (shouldn't happen in a real game)
  
  // Check if the king's square is under attack by the opposite side
  return isSquareAttacked(kingRow, kingCol, !isWhiteKing);
};

// Check if a square is selected
const isSelected = (row, col) => {
  return selectedSquare.value === toAlgebraic(row, col);
};

// Check if a square is a possible move
// Compute possible moves for the selected piece
// Helper to check board bounds
const isWithinBoard = (targetRow, targetCol) => targetRow >= 1 && targetRow <= 8 && targetCol >= 1 && targetCol <= 8;
// Helper to check if square has friendly piece
const isFriendlyPiece = (pieceCode, targetRow, targetCol) => {
  const targetPiece = getPiece(targetRow, targetCol);
  if (!targetPiece) return false;
  const targetPieceCode = parseInt(targetPiece.replace(/[^0-9]/g, ''));
  return (pieceCode <= 9817 && targetPieceCode <= 9817) || (pieceCode >= 9818 && targetPieceCode >= 9818);
};

function getPawnMoves(pieceCode, selectedRow, selectedCol) {
  const moves = [];
  const direction = pieceCode === 9817 ? -1 : 1; // White up, black down
  const pawnStartRow = pieceCode === 9817 ? 7 : 2;
  // Single forward push
  const forwardRow = selectedRow + direction;
  if (isWithinBoard(forwardRow, selectedCol) && isEmpty(forwardRow, selectedCol)) {
    moves.push(toAlgebraic(forwardRow, selectedCol));
    // Double forward push
    const doubleForwardRow = selectedRow + 2 * direction;
    if (selectedRow === pawnStartRow && isEmpty(doubleForwardRow, selectedCol) && isEmpty(forwardRow, selectedCol)) {
      moves.push(toAlgebraic(doubleForwardRow, selectedCol));
    }
  }
  // Pawn captures
  for (const colOffset of [-1, 1]) {
    const captureCol = selectedCol + colOffset;
    if (isWithinBoard(forwardRow, captureCol) && isOpponent(forwardRow, captureCol)) {
      moves.push(toAlgebraic(forwardRow, captureCol));
    }
  }
  // En passant capture
  if (enPassantTarget.value) {
    const { row: epRow, col: epCol } = fromAlgebraic(enPassantTarget.value);
    for (const colOffset of [-1, 1]) {
      if (selectedCol + colOffset === epCol && selectedRow === epRow - direction) {
        moves.push(enPassantTarget.value);
      }
    }
  }
  return moves;
}

function getKnightMoves(pieceCode, selectedRow, selectedCol) {
  const moves = [];
  const knightMoves = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];
  for (const [rowOffset, colOffset] of knightMoves) {
    const targetRow = selectedRow + rowOffset;
    const targetCol = selectedCol + colOffset;
    if (isWithinBoard(targetRow, targetCol) && !isFriendlyPiece(pieceCode, targetRow, targetCol)) {
      moves.push(toAlgebraic(targetRow, targetCol));
    }
  }
  return moves;
}

function getBishopMoves(pieceCode, selectedRow, selectedCol) {
  const moves = [];
  const bishopDirections = [
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  for (const [rowOffset, colOffset] of bishopDirections) {
    let distance = 1;
    while (true) {
      const targetRow = selectedRow + rowOffset * distance;
      const targetCol = selectedCol + colOffset * distance;
      if (!isWithinBoard(targetRow, targetCol)) break;
      if (isFriendlyPiece(pieceCode, targetRow, targetCol)) break;
      moves.push(toAlgebraic(targetRow, targetCol));
      if (isOpponent(targetRow, targetCol)) break; // Stop after capture
      if (isEmpty(targetRow, targetCol)) {
        distance++;
      } else {
        break;
      }
    }
  }
  return moves;
}

function getRookMoves(pieceCode, selectedRow, selectedCol) {
  const moves = [];
  const rookDirections = [
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  for (const [rowOffset, colOffset] of rookDirections) {
    let distance = 1;
    while (true) {
      const targetRow = selectedRow + rowOffset * distance;
      const targetCol = selectedCol + colOffset * distance;
      if (!isWithinBoard(targetRow, targetCol)) break;
      if (isFriendlyPiece(pieceCode, targetRow, targetCol)) break;
      moves.push(toAlgebraic(targetRow, targetCol));
      if (isOpponent(targetRow, targetCol)) break; // Stop after capture
      if (isEmpty(targetRow, targetCol)) {
        distance++;
      } else {
        break;
      }
    }
  }
  return moves;
}

function getQueenMoves(pieceCode, selectedRow, selectedCol) {
  const moves = [];
  const queenDirections = [
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  for (const [rowOffset, colOffset] of queenDirections) {
    let distance = 1;
    while (true) {
      const targetRow = selectedRow + rowOffset * distance;
      const targetCol = selectedCol + colOffset * distance;
      if (!isWithinBoard(targetRow, targetCol)) break;
      if (isFriendlyPiece(pieceCode, targetRow, targetCol)) break;
      moves.push(toAlgebraic(targetRow, targetCol));
      if (isOpponent(targetRow, targetCol)) break; // Stop after capture
      if (isEmpty(targetRow, targetCol)) {
        distance++;
      } else {
        break;
      }
    }
  }
  return moves;
}

function getKingMoves(pieceCode, selectedRow, selectedCol) {
  const moves = [];
  const isWhite = pieceCode === 9812;
  const kingDirections = [
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  
  // Regular king moves - don't allow moving into check
  for (const [rowOffset, colOffset] of kingDirections) {
    const targetRow = selectedRow + rowOffset;
    const targetCol = selectedCol + colOffset;
    if (!isWithinBoard(targetRow, targetCol)) continue;
    if (isFriendlyPiece(pieceCode, targetRow, targetCol)) continue;
    
    // Don't allow moving into check
    if (!isSquareAttacked(targetRow, targetCol, !isWhite)) {
      moves.push(toAlgebraic(targetRow, targetCol));
    }
  }
  
  // Castling
  const kingPosition = toAlgebraic(selectedRow, selectedCol);
  const rights = castlingRights.value[isWhite ? 'white' : 'black'];
  const row = isWhite ? 8 : 1;
  
  // Check if king is currently in check
  const kingInCheck = isSquareAttacked(selectedRow, selectedCol, !isWhite);
  
  // Only allow castling if king hasn't moved and is not in check
  if (!pieceHasMoved.value[kingPosition] && !kingInCheck) {
    // Kingside castling
    if (rights.kingSide) {
      const rookPosition = toAlgebraic(row, 8); // h1 or h8
      if (!pieceHasMoved.value[rookPosition] && 
          isEmpty(row, 6) && isEmpty(row, 7) &&
          getPiece(row, 8) && parseInt(getPiece(row, 8).replace(/[^0-9]/g, '')) === (isWhite ? 9814 : 9820)) {
        
        // Check if king passes through or ends up in check
        const passesThroughCheck = isSquareAttacked(row, 6, !isWhite);
        const endsInCheck = isSquareAttacked(row, 7, !isWhite);
        
        if (!passesThroughCheck && !endsInCheck) {
          moves.push(toAlgebraic(row, 7)); // g1 or g8
        }
      }
    }
    
    // Queenside castling
    if (rights.queenSide) {
      const rookPosition = toAlgebraic(row, 1); // a1 or a8
      if (!pieceHasMoved.value[rookPosition] && 
          isEmpty(row, 2) && isEmpty(row, 3) && isEmpty(row, 4) &&
          getPiece(row, 1) && parseInt(getPiece(row, 1).replace(/[^0-9]/g, '')) === (isWhite ? 9814 : 9820)) {
        
        // Check if king passes through or ends up in check
        const passesThroughCheck = isSquareAttacked(row, 4, !isWhite) || isSquareAttacked(row, 3, !isWhite);
        const endsInCheck = isSquareAttacked(row, 3, !isWhite);
        
        if (!passesThroughCheck && !endsInCheck) {
          moves.push(toAlgebraic(row, 3)); // c1 or c8
        }
      }
    }
  }
  
  return moves;
}

const possibleMoves = computed(() => {
  if (!selectedSquare.value) return [];
  const selectedPosition = selectedSquare.value;
  const selectedPiece = pieces.value[selectedPosition];
  if (!selectedPiece) return [];

  const pieceCode = parseInt(selectedPiece.replace(/[^0-9]/g, ''));
  const { row: selectedRow, col: selectedCol } = fromAlgebraic(selectedPosition);

  if (pieceCode === 9817 || pieceCode === 9823) {
    return getPawnMoves(pieceCode, selectedRow, selectedCol);
  } else if (pieceCode === 9816 || pieceCode === 9822) {
    return getKnightMoves(pieceCode, selectedRow, selectedCol);
  } else if (pieceCode === 9815 || pieceCode === 9821) {
    return getBishopMoves(pieceCode, selectedRow, selectedCol);
  } else if (pieceCode === 9814 || pieceCode === 9820) {
    return getRookMoves(pieceCode, selectedRow, selectedCol);
  } else if (pieceCode === 9813 || pieceCode === 9819) {
    return getQueenMoves(pieceCode, selectedRow, selectedCol);
  } else if (pieceCode === 9812 || pieceCode === 9818) {
    return getKingMoves(pieceCode, selectedRow, selectedCol);
  } else {
    return [];
  }
});

// Check if a square is a possible move
const isPossibleMove = (row, col) => {
  return possibleMoves.value.includes(toAlgebraic(row, col));
};
</script>

<template>
  <!-- Prisoners: White pieces captured by black (shown above the board) -->
  <div class="prisoners prisoners-black">
    <span v-for="(piece, idx) in capturedByWhite" :key="'prisoner-black-' + idx" class="prisoner" v-html="piece"></span>
  </div>
  <div class="turn-indicator" :class="currentPlayer">
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
  <!-- Prisoners: Black pieces captured by white (shown below the board) -->
  <div class="prisoners prisoners-white">
    <span v-for="(piece, idx) in capturedByBlack" :key="'prisoner-white-' + idx" class="prisoner" v-html="piece"></span>
  </div>
</template>
