// Chess engine core logic
import { ref, computed } from 'vue';
import { initialPieces, toAlgebraic, fromAlgebraic, isWithinBoard, getPieceCode, PIECE_CODES } from './chessUtils';
import { 
  getPawnMoves, 
  getKnightMoves, 
  getBishopMoves, 
  getRookMoves, 
  getQueenMoves, 
  getKingMoves 
} from './moveGenerator';
import { parseFen, generateFen, STARTING_FEN } from './fenUtils';

export function useChessEngine() {
  // Game state
  const pieces = ref({ ...initialPieces });
  const selectedSquare = ref(null);
  const currentPlayer = ref('white');
  const capturedByWhite = ref([]);
  const capturedByBlack = ref([]);

  // Special move tracking
  const enPassantTarget = ref(null);
  const castlingRights = ref({
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true }
  });
  const pieceHasMoved = ref({});
  const inCheck = ref({ white: false, black: false });
  
  // FEN-related state
  const halfmoveClock = ref(0); // Number of halfmoves since the last capture or pawn advance
  const fullmoveNumber = ref(1); // Incremented after Black's move
  
  // Function to get piece at a position
  const getPiece = (row, col) => {
    const pos = toAlgebraic(row, col);
    return pieces.value[pos] || null;
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
    
    const selectedCode = getPieceCode(selectedPiece);
    const targetCode = getPieceCode(piece);
    
    // White: 9812-9817, Black: 9818-9823
    if (selectedCode <= PIECE_CODES.WHITE_PAWN && targetCode >= PIECE_CODES.BLACK_KING) return true;
    if (selectedCode >= PIECE_CODES.BLACK_KING && targetCode <= PIECE_CODES.WHITE_PAWN) return true;
    return false;
  };

  // Helper to check if square has friendly piece
  const isFriendlyPiece = (pieceCode, targetRow, targetCol) => {
    const targetPiece = getPiece(targetRow, targetCol);
    if (!targetPiece) return false;
    
    const targetPieceCode = getPieceCode(targetPiece);
    const isSelectedWhite = pieceCode <= PIECE_CODES.WHITE_PAWN;
    const isTargetWhite = targetPieceCode <= PIECE_CODES.WHITE_PAWN;
    
    return isSelectedWhite === isTargetWhite;
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
          const code = getPieceCode(piece);
          if ((byWhite && code === PIECE_CODES.WHITE_PAWN) || 
              (!byWhite && code === PIECE_CODES.BLACK_PAWN)) {
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
          const code = getPieceCode(piece);
          if ((byWhite && code === PIECE_CODES.WHITE_KNIGHT) || 
              (!byWhite && code === PIECE_CODES.BLACK_KNIGHT)) {
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
          const code = getPieceCode(piece);
          if ((byWhite && (code === PIECE_CODES.WHITE_BISHOP || code === PIECE_CODES.WHITE_QUEEN)) || 
              (!byWhite && (code === PIECE_CODES.BLACK_BISHOP || code === PIECE_CODES.BLACK_QUEEN))) {
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
          const code = getPieceCode(piece);
          if ((byWhite && (code === PIECE_CODES.WHITE_ROOK || code === PIECE_CODES.WHITE_QUEEN)) || 
              (!byWhite && (code === PIECE_CODES.BLACK_ROOK || code === PIECE_CODES.BLACK_QUEEN))) {
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
          const code = getPieceCode(piece);
          if ((byWhite && code === PIECE_CODES.WHITE_KING) || 
              (!byWhite && code === PIECE_CODES.BLACK_KING)) {
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
          const code = getPieceCode(piece);
          if ((isWhiteKing && code === PIECE_CODES.WHITE_KING) || 
              (!isWhiteKing && code === PIECE_CODES.BLACK_KING)) {
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

  // Compute possible moves for the selected piece
  const possibleMoves = computed(() => {
    if (!selectedSquare.value) return [];
    
    const selectedPosition = selectedSquare.value;
    const selectedPiece = pieces.value[selectedPosition];
    if (!selectedPiece) return [];

    const pieceCode = getPieceCode(selectedPiece);
    const { row: selectedRow, col: selectedCol } = fromAlgebraic(selectedPosition);

    // Call the appropriate move generator based on piece type
    if (pieceCode === PIECE_CODES.WHITE_PAWN || pieceCode === PIECE_CODES.BLACK_PAWN) {
      return getPawnMoves(
        pieceCode, 
        selectedRow, 
        selectedCol, 
        getPiece, 
        isEmpty, 
        isOpponent, 
        enPassantTarget.value ? fromAlgebraic(enPassantTarget.value) : null
      );
    } else if (pieceCode === PIECE_CODES.WHITE_KNIGHT || pieceCode === PIECE_CODES.BLACK_KNIGHT) {
      return getKnightMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece);
    } else if (pieceCode === PIECE_CODES.WHITE_BISHOP || pieceCode === PIECE_CODES.BLACK_BISHOP) {
      return getBishopMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent);
    } else if (pieceCode === PIECE_CODES.WHITE_ROOK || pieceCode === PIECE_CODES.BLACK_ROOK) {
      return getRookMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent);
    } else if (pieceCode === PIECE_CODES.WHITE_QUEEN || pieceCode === PIECE_CODES.BLACK_QUEEN) {
      return getQueenMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent);
    } else if (pieceCode === PIECE_CODES.WHITE_KING || pieceCode === PIECE_CODES.BLACK_KING) {
      return getKingMoves(
        pieceCode, 
        selectedRow, 
        selectedCol, 
        isFriendlyPiece, 
        isEmpty, 
        getPiece,
        isSquareAttacked, 
        pieceHasMoved.value, 
        castlingRights.value
      );
    } else {
      return [];
    }
  });

  // Check if a square is a possible move
  const isPossibleMove = (row, col) => {
    return possibleMoves.value.includes(toAlgebraic(row, col));
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
      const movingPieceCode = getPieceCode(movingPiece);
      const fromPos = fromAlgebraic(from);
      const toPos = { row, col };
      
      // Track that this piece has moved (for castling rights)
      pieceHasMoved.value[from] = true;
      pieceHasMoved.value[position] = true;
      
      // Handle regular capturing
      if (clickedPiece) {
        const capturedCode = getPieceCode(clickedPiece);
        if (capturedCode <= PIECE_CODES.WHITE_PAWN) {
          capturedByWhite.value.push(clickedPiece); // White piece captured by black
        } else {
          capturedByBlack.value.push(clickedPiece); // Black piece captured by white
        }
      }
      
      // Handle en passant capture
      if ((movingPieceCode === PIECE_CODES.WHITE_PAWN || movingPieceCode === PIECE_CODES.BLACK_PAWN) && 
          position === enPassantTarget.value) {
        // Determine the position of the captured pawn
        const direction = movingPieceCode === PIECE_CODES.WHITE_PAWN ? 1 : -1;
        const capturedPawnRow = row + direction;
        const capturedPawnCol = col;
        const capturedPawnPos = toAlgebraic(capturedPawnRow, capturedPawnCol);
        const capturedPawn = newPieces[capturedPawnPos];
        
        // Add to captured list
        if (capturedPawn) {
          const capturedCode = getPieceCode(capturedPawn);
          if (capturedCode <= PIECE_CODES.WHITE_PAWN) {
            capturedByWhite.value.push(capturedPawn);
          } else {
            capturedByBlack.value.push(capturedPawn);
          }
          
          // Remove the captured pawn
          delete newPieces[capturedPawnPos];
        }
      }
      
      // Handle castling (king moving two squares horizontally)
      if ((movingPieceCode === PIECE_CODES.WHITE_KING || movingPieceCode === PIECE_CODES.BLACK_KING) && 
          Math.abs(fromPos.col - toPos.col) === 2) {
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
      if (movingPieceCode === PIECE_CODES.WHITE_KING) {
        castlingRights.value.white.kingSide = false;
        castlingRights.value.white.queenSide = false;
      } else if (movingPieceCode === PIECE_CODES.BLACK_KING) {
        castlingRights.value.black.kingSide = false;
        castlingRights.value.black.queenSide = false;
      } else if (movingPieceCode === PIECE_CODES.WHITE_ROOK) {
        if (from === 'a1') castlingRights.value.white.queenSide = false;
        if (from === 'h1') castlingRights.value.white.kingSide = false;
      } else if (movingPieceCode === PIECE_CODES.BLACK_ROOK) {
        if (from === 'a8') castlingRights.value.black.queenSide = false;
        if (from === 'h8') castlingRights.value.black.kingSide = false;
      }
      
      // Set en passant target if pawn moved two squares
      enPassantTarget.value = null; // Reset by default
      if ((movingPieceCode === PIECE_CODES.WHITE_PAWN || movingPieceCode === PIECE_CODES.BLACK_PAWN) && 
          Math.abs(fromPos.row - toPos.row) === 2) {
        const direction = movingPieceCode === PIECE_CODES.WHITE_PAWN ? -1 : 1;
        enPassantTarget.value = toAlgebraic(fromPos.row + direction, fromPos.col);
      }
      
      // Move the selected piece to the new position
      newPieces[position] = movingPiece;
      // Remove the piece from its old position
      delete newPieces[from];
      pieces.value = newPieces;
      selectedSquare.value = null; // Deselect after move
      
      // Update check status
      inCheck.value.white = isKingInCheck(true);
      inCheck.value.black = isKingInCheck(false);
      
      // Update FEN-related state
      const isPawnMove = movingPieceCode === PIECE_CODES.WHITE_PAWN || movingPieceCode === PIECE_CODES.BLACK_PAWN;
      const isCapture = clickedPiece !== null || (position === enPassantTarget.value); // Regular capture or en passant
      
      if (isPawnMove || isCapture) {
        halfmoveClock.value = 0;
      } else {
        halfmoveClock.value++;
      }
      
      // Switch turns
      currentPlayer.value = isWhiteTurn ? 'black' : 'white';
      
      // Increment fullmove number after Black's move
      if (!isWhiteTurn) {
        fullmoveNumber.value++;  
      }
      return;
    }

    // Only allow selection of current player's pieces
    if (clickedPiece) {
      const code = getPieceCode(clickedPiece);
      const isWhitePieceSelected = code <= PIECE_CODES.WHITE_PAWN;
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

  // Reset the game to the starting position
  const resetGame = () => {
    loadFen(STARTING_FEN);
  };
  
  // Load a position from FEN notation
  const loadFen = (fen) => {
    try {
      const position = parseFen(fen);
      
      // Update game state
      pieces.value = position.pieces;
      selectedSquare.value = null;
      currentPlayer.value = position.currentPlayer;
      capturedByWhite.value = [];
      capturedByBlack.value = [];
      enPassantTarget.value = position.enPassantTarget;
      castlingRights.value = position.castlingRights;
      pieceHasMoved.value = {};
      halfmoveClock.value = position.halfmoveClock;
      fullmoveNumber.value = position.fullmoveNumber;
      
      // Determine which pieces have moved based on castling rights
      if (!position.castlingRights.white.kingSide || !position.castlingRights.white.queenSide) {
        pieceHasMoved.value['e1'] = true; // White king has moved
      }
      if (!position.castlingRights.white.kingSide) {
        pieceHasMoved.value['h1'] = true; // White kingside rook has moved
      }
      if (!position.castlingRights.white.queenSide) {
        pieceHasMoved.value['a1'] = true; // White queenside rook has moved
      }
      if (!position.castlingRights.black.kingSide || !position.castlingRights.black.queenSide) {
        pieceHasMoved.value['e8'] = true; // Black king has moved
      }
      if (!position.castlingRights.black.kingSide) {
        pieceHasMoved.value['h8'] = true; // Black kingside rook has moved
      }
      if (!position.castlingRights.black.queenSide) {
        pieceHasMoved.value['a8'] = true; // Black queenside rook has moved
      }
      
      // Check if kings are in check
      inCheck.value.white = isKingInCheck(true);
      inCheck.value.black = isKingInCheck(false);
      
      return true;
    } catch (error) {
      console.error('Error loading FEN:', error);
      return false;
    }
  };
  
  // Get the current position as FEN notation
  const getCurrentFen = () => {
    return generateFen({
      pieces: pieces.value,
      currentPlayer: currentPlayer.value,
      castlingRights: castlingRights.value,
      enPassantTarget: enPassantTarget.value,
      halfmoveClock: halfmoveClock.value,
      fullmoveNumber: fullmoveNumber.value
    });
  };

  // Helper function to check if a piece is white (for UI purposes)
  const isWhitePiece = (row, col) => {
    const piece = getPiece(row, col);
    if (!piece) return false;
    const code = parseInt(piece.replace(/[^0-9]/g, ''));
    // White pieces are 9812-9817, black pieces are 9818-9823
    return code >= 9812 && code <= 9817;
  };

  return {
    // State
    pieces,
    selectedSquare,
    currentPlayer,
    capturedByWhite,
    capturedByBlack,
    inCheck,
    enPassantTarget,
    castlingRights,
    pieceHasMoved,
    halfmoveClock,
    fullmoveNumber,
    
    // Methods
    getPiece,
    isOpponent,
    isEmpty,
    isSelected: (row, col) => selectedSquare.value === toAlgebraic(row, col),
    isPossibleMove,
    handleSquareClick,
    resetGame,
    isWhitePiece,
    toAlgebraic,
    fromAlgebraic,
    isWithinBoard,
    isSquareAttacked,
    isKingInCheck,
    
    // FEN-related methods
    loadFen,
    getCurrentFen,
    
    // Computed
    possibleMoves
  };
}
