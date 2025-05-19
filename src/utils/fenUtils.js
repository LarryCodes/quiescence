// FEN (Forsyth-Edwards Notation) utilities
import { PIECE_CODES } from './chessUtils';

/**
 * Standard starting position in FEN
 * rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
 * 
 * Format:
 * 1. Piece placement (from rank 8 to 1)
 * 2. Active color ('w' or 'b')
 * 3. Castling availability ('K'=white kingside, 'Q'=white queenside, 'k'=black kingside, 'q'=black queenside, '-'=none)
 * 4. En passant target square (e.g., 'e3'), or '-' if none
 * 5. Halfmove clock (number of halfmoves since the last capture or pawn advance)
 * 6. Fullmove number (starts at 1, incremented after Black's move)
 */
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Map from FEN piece symbol to HTML entity code
const FEN_TO_PIECE = {
  'p': PIECE_CODES.BLACK_PAWN,
  'n': PIECE_CODES.BLACK_KNIGHT,
  'b': PIECE_CODES.BLACK_BISHOP,
  'r': PIECE_CODES.BLACK_ROOK,
  'q': PIECE_CODES.BLACK_QUEEN,
  'k': PIECE_CODES.BLACK_KING,
  'P': PIECE_CODES.WHITE_PAWN,
  'N': PIECE_CODES.WHITE_KNIGHT,
  'B': PIECE_CODES.WHITE_BISHOP,
  'R': PIECE_CODES.WHITE_ROOK,
  'Q': PIECE_CODES.WHITE_QUEEN,
  'K': PIECE_CODES.WHITE_KING
};

// Map from HTML entity code to FEN piece symbol
const PIECE_TO_FEN = Object.fromEntries(
  Object.entries(FEN_TO_PIECE).map(([key, value]) => [value, key])
);

/**
 * Converts a FEN string to a board position object
 * @param {string} fen - The FEN string to parse
 * @returns {Object} An object containing the parsed FEN information
 */
export function parseFen(fen) {
  const parts = fen.trim().split(' ');
  
  if (parts.length !== 6) {
    throw new Error('Invalid FEN: must have 6 parts');
  }
  
  const [piecePlacement, activeColor, castling, enPassant, halfmoveClock, fullmoveNumber] = parts;
  
  // Parse piece placement
  const pieces = {};
  const rows = piecePlacement.split('/');
  
  if (rows.length !== 8) {
    throw new Error('Invalid FEN: piece placement must have 8 ranks');
  }
  
  for (let row = 0; row < 8; row++) {
    let col = 0;
    for (let i = 0; i < rows[row].length; i++) {
      const char = rows[row][i];
      
      if (/[1-8]/.test(char)) {
        // Skip empty squares
        col += parseInt(char);
      } else if (/[pnbrqkPNBRQK]/.test(char)) {
        // Place a piece
        const file = String.fromCharCode(97 + col); // 'a' to 'h'
        const rank = 8 - row; // 8 to 1
        const square = file + rank;
        pieces[square] = FEN_TO_PIECE[char];
        col++;
      } else {
        throw new Error(`Invalid FEN: unknown character ${char} in piece placement`);
      }
    }
    
    if (col !== 8) {
      throw new Error(`Invalid FEN: rank ${8 - row} does not have 8 squares`);
    }
  }
  
  // Parse active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    throw new Error('Invalid FEN: active color must be "w" or "b"');
  }
  
  // Parse castling availability
  if (!/^(KQ?k?q?|K?Qk?q?|K?Q?kq?|K?Q?k?q|-)$/.test(castling)) {
    throw new Error('Invalid FEN: invalid castling availability');
  }
  
  // Parse en passant target square
  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
    throw new Error('Invalid FEN: invalid en passant target square');
  }
  
  // Parse halfmove clock
  const halfmoves = parseInt(halfmoveClock);
  if (isNaN(halfmoves) || halfmoves < 0) {
    throw new Error('Invalid FEN: halfmove clock must be a non-negative integer');
  }
  
  // Parse fullmove number
  const fullmoves = parseInt(fullmoveNumber);
  if (isNaN(fullmoves) || fullmoves < 1) {
    throw new Error('Invalid FEN: fullmove number must be a positive integer');
  }
  
  return {
    pieces,
    currentPlayer: activeColor === 'w' ? 'white' : 'black',
    castlingRights: {
      white: { 
        kingSide: castling.includes('K'), 
        queenSide: castling.includes('Q') 
      },
      black: { 
        kingSide: castling.includes('k'), 
        queenSide: castling.includes('q') 
      }
    },
    enPassantTarget: enPassant === '-' ? null : enPassant,
    halfmoveClock: halfmoves,
    fullmoveNumber: fullmoves
  };
}

/**
 * Converts a board position to a FEN string
 * @param {Object} position - The board position object
 * @returns {string} The FEN string
 */
export function generateFen(position) {
  const { pieces, currentPlayer, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber } = position;
  
  // Generate piece placement
  let piecePlacement = '';
  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;
    
    for (let col = 0; col < 8; col++) {
      const file = String.fromCharCode(97 + col); // 'a' to 'h'
      const rank = 8 - row; // 8 to 1
      const square = file + rank;
      const piece = pieces[square];
      
      if (piece) {
        // Add empty squares count before adding the piece
        if (emptyCount > 0) {
          piecePlacement += emptyCount;
          emptyCount = 0;
        }
        piecePlacement += PIECE_TO_FEN[piece];
      } else {
        emptyCount++;
      }
    }
    
    // Add remaining empty squares
    if (emptyCount > 0) {
      piecePlacement += emptyCount;
    }
    
    // Add slash between ranks, except for the last rank
    if (row < 7) {
      piecePlacement += '/';
    }
  }
  
  // Generate active color
  const activeColor = currentPlayer === 'white' ? 'w' : 'b';
  
  // Generate castling availability
  let castling = '';
  if (castlingRights.white.kingSide) castling += 'K';
  if (castlingRights.white.queenSide) castling += 'Q';
  if (castlingRights.black.kingSide) castling += 'k';
  if (castlingRights.black.queenSide) castling += 'q';
  if (castling === '') castling = '-';
  
  // Generate en passant target square
  const enPassant = enPassantTarget || '-';
  
  // Combine all parts
  return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfmoveClock} ${fullmoveNumber}`;
}
