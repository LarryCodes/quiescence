// Chess utility functions

// Board coordinates and conversions
export const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ranks = Array.from({ length: 8 }, (_, i) => 8 - i);

// Convert between board coordinates and algebraic notation
export const toAlgebraic = (row, col) => {
  const file = files[col - 1];
  const rank = 8 - row + 1;
  return `${file}${rank}`;
};

export const fromAlgebraic = (alg) => {
  const file = alg[0];
  const rank = parseInt(alg[1]);
  const col = files.indexOf(file) + 1;
  const row = 8 - rank + 1;
  return { row, col };
};

// Check if coordinates are within the board
export const isWithinBoard = (row, col) => row >= 1 && row <= 8 && col >= 1 && col <= 8;

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

// Piece codes
export const PIECE_CODES = {
  WHITE_KING: 9812,
  WHITE_QUEEN: 9813,
  WHITE_ROOK: 9814,
  WHITE_BISHOP: 9815,
  WHITE_KNIGHT: 9816,
  WHITE_PAWN: 9817,
  BLACK_KING: 9818,
  BLACK_QUEEN: 9819,
  BLACK_ROOK: 9820,
  BLACK_BISHOP: 9821,
  BLACK_KNIGHT: 9822,
  BLACK_PAWN: 9823
};

// Check if a piece is white based on its code
export const isWhitePiece = (pieceCode) => {
  return pieceCode >= PIECE_CODES.WHITE_KING && pieceCode <= PIECE_CODES.WHITE_PAWN;
};

// Extract piece code from HTML entity
export const getPieceCode = (pieceHtml) => {
  if (!pieceHtml) return null;
  return parseInt(pieceHtml.replace(/[^0-9]/g, ''));
};
