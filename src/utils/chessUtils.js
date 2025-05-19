// Chess utility functions

// Board size
export const BOARD_SIZE = 8;

// Board coordinates and conversions
export const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ranks = Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - i);

// Piece codes
export const PIECE_CODES = {
  WHITE_KING: '&#9812;',
  WHITE_QUEEN: '&#9813;',
  WHITE_ROOK: '&#9814;',
  WHITE_BISHOP: '&#9815;',
  WHITE_KNIGHT: '&#9816;',
  WHITE_PAWN: '&#9817;',
  BLACK_KING: '&#9818;',
  BLACK_QUEEN: '&#9819;',
  BLACK_ROOK: '&#9820;',
  BLACK_BISHOP: '&#9821;',
  BLACK_KNIGHT: '&#9822;',
  BLACK_PAWN: '&#9823;'
};

// Convert between board coordinates and algebraic notation
export const toAlgebraic = (row, col) => {
  if (!isWithinBoard(row, col)) return null;
  const file = files[col - 1];
  const rank = BOARD_SIZE - row + 1;
  return `${file}${rank}`;
};

export const fromAlgebraic = (alg) => {
  if (!alg || alg.length !== 2) return null;
  const file = alg[0];
  const rank = parseInt(alg[1]);
  const col = files.indexOf(file) + 1;
  const row = BOARD_SIZE - rank + 1;
  return { row, col };
};

// Helper to check board bounds
export const isWithinBoard = (row, col) => {
  return row >= 1 && row <= BOARD_SIZE && col >= 1 && col <= BOARD_SIZE;
};

// Check if a piece is white based on its code
export const isWhitePiece = (pieceHtml) => {
  if (!pieceHtml) return false;
  const code = parseInt(pieceHtml.replace(/[&#;]/g, ''));
  return code >= 9812 && code <= 9817;
};

// Extract piece code from HTML entity
export const getPieceCode = (pieceHtml) => {
  // If the pieceHtml is null or undefined, return null
  if (!pieceHtml) return null;
  return pieceHtml;
};

// Chess pieces with their starting positions using HTML entity codes
export const initialPieces = {
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

