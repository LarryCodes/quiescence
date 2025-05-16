// Chess move generation logic
import { isWithinBoard, toAlgebraic, getPieceCode, PIECE_CODES, isWhitePiece } from './chessUtils';

// Generate pawn moves
export function getPawnMoves(pieceCode, selectedRow, selectedCol, getPiece, isEmpty, isOpponent, enPassantTarget) {
  const moves = [];
  const direction = pieceCode === PIECE_CODES.WHITE_PAWN ? -1 : 1; // White up, black down
  const pawnStartRow = pieceCode === PIECE_CODES.WHITE_PAWN ? 7 : 2;
  
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
  if (enPassantTarget) {
    const { row: epRow, col: epCol } = enPassantTarget;
    for (const colOffset of [-1, 1]) {
      if (selectedCol + colOffset === epCol && selectedRow === epRow - direction) {
        moves.push(toAlgebraic(epRow, epCol));
      }
    }
  }
  
  return moves;
}

// Generate knight moves
export function getKnightMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece) {
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

// Generate bishop moves
export function getBishopMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent) {
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

// Generate rook moves
export function getRookMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent) {
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

// Generate queen moves (combination of bishop and rook)
export function getQueenMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent) {
  return [
    ...getBishopMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent),
    ...getRookMoves(pieceCode, selectedRow, selectedCol, isFriendlyPiece, isEmpty, isOpponent)
  ];
}

// Generate king moves
export function getKingMoves(
  pieceCode, 
  selectedRow, 
  selectedCol, 
  isFriendlyPiece, 
  isEmpty, 
  getPiece,
  isSquareAttacked, 
  pieceHasMoved, 
  castlingRights
) {
  const moves = [];
  const isWhite = pieceCode === PIECE_CODES.WHITE_KING;
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
  const rights = castlingRights[isWhite ? 'white' : 'black'];
  const row = isWhite ? 8 : 1;
  
  // Check if king is currently in check
  const kingInCheck = isSquareAttacked(selectedRow, selectedCol, !isWhite);
  
  // Only allow castling if king hasn't moved and is not in check
  if (!pieceHasMoved[kingPosition] && !kingInCheck) {
    // Kingside castling
    if (rights.kingSide) {
      const rookPosition = toAlgebraic(row, 8); // h1 or h8
      if (!pieceHasMoved[rookPosition] && 
          isEmpty(row, 6) && isEmpty(row, 7) &&
          getPiece(row, 8)) {
        
        const rookCode = getPieceCode(getPiece(row, 8));
        if (rookCode === (isWhite ? PIECE_CODES.WHITE_ROOK : PIECE_CODES.BLACK_ROOK)) {
          // Check if king passes through or ends up in check
          const passesThroughCheck = isSquareAttacked(row, 6, !isWhite);
          const endsInCheck = isSquareAttacked(row, 7, !isWhite);
          
          if (!passesThroughCheck && !endsInCheck) {
            moves.push(toAlgebraic(row, 7)); // g1 or g8
          }
        }
      }
    }
    
    // Queenside castling
    if (rights.queenSide) {
      const rookPosition = toAlgebraic(row, 1); // a1 or a8
      if (!pieceHasMoved[rookPosition] && 
          isEmpty(row, 2) && isEmpty(row, 3) && isEmpty(row, 4) &&
          getPiece(row, 1)) {
          
        const rookCode = getPieceCode(getPiece(row, 1));
        if (rookCode === (isWhite ? PIECE_CODES.WHITE_ROOK : PIECE_CODES.BLACK_ROOK)) {
          // Check if king passes through or ends up in check
          const passesThroughCheck = isSquareAttacked(row, 4, !isWhite) || isSquareAttacked(row, 3, !isWhite);
          const endsInCheck = isSquareAttacked(row, 3, !isWhite);
          
          if (!passesThroughCheck && !endsInCheck) {
            moves.push(toAlgebraic(row, 3)); // c1 or c8
          }
        }
      }
    }
  }
  
  return moves;
}
