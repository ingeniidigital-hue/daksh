import { TurnBasedMatch, TurnMove } from "./types";

/**
 * Validates and executes a turn move server-authoritatively.
 * Throws specific errors if not player's turn or if move is illegal.
 */
export function validateAndApplyMove(
  match: TurnBasedMatch,
  playerId: string,
  moveInput: { action: string; x?: number; y?: number; payload?: any }
): { match: TurnBasedMatch; move: TurnMove; isWin: boolean; isDraw: boolean } {
  if (match.status !== "ACTIVE") {
    throw new Error(`MATCH_NOT_ACTIVE: Match status is '${match.status}'`);
  }

  // 1. Turn order check
  if (match.activeTurnPlayerId !== playerId) {
    throw new Error(`NOT_YOUR_TURN: It is currently ${match.activeTurnPlayerId}'s turn`);
  }

  // 2. Coordinate & Bounds validation (authoritative rule checking)
  const { x, y } = moveInput;
  if (x === undefined || y === undefined || x < 0 || x > 2 || y < 0 || y > 2) {
    throw new Error("ILLEGAL_MOVE: Position coordinates out of bounds (must be 0..2)");
  }

  // 3. Occupancy check
  if (match.boardState[x][y] !== null) {
    throw new Error(`ILLEGAL_MOVE: Cell (${x}, ${y}) is already occupied by ${match.boardState[x][y]}`);
  }

  // 4. Apply move to in-memory board
  match.boardState[x][y] = playerId;

  const moveRecord: TurnMove = {
    action: moveInput.action,
    playerId,
    x,
    y,
    payload: moveInput.payload,
    timestamp: Date.now()
  };
  match.moveHistory.push(moveRecord);

  // 5. Check Win Condition (3 in a row, col, or diagonal)
  const isWin = checkWin(match.boardState, playerId);
  const isDraw = !isWin && checkDraw(match.boardState);

  if (isWin) {
    match.status = "RESOLVED";
    match.winnerId = playerId;
    match.loserId = match.players.find(p => p !== playerId) || null;
    match.resolutionReason = "WIN_CONDITION_MET";
  } else if (isDraw) {
    match.status = "DRAW";
    match.winnerId = null;
    match.loserId = null;
    match.resolutionReason = "BOARD_FULL_DRAW";
  } else {
    // 6. Turn Rotation: Handoff active turn token to opponent
    const nextPlayerIndex = (match.players.indexOf(playerId) + 1) % match.players.length;
    match.activeTurnPlayerId = match.players[nextPlayerIndex];
    match.turnNumber += 1;
    match.turnStartedAt = Date.now();
  }

  match.updatedAt = Date.now();

  return { match, move: moveRecord, isWin, isDraw };
}

function checkWin(board: (string | null)[][], player: string): boolean {
  // Check rows
  for (let r = 0; r < 3; r++) {
    if (board[r][0] === player && board[r][1] === player && board[r][2] === player) return true;
  }
  // Check cols
  for (let c = 0; c < 3; c++) {
    if (board[0][c] === player && board[1][c] === player && board[2][c] === player) return true;
  }
  // Diagonals
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;

  return false;
}

function checkDraw(board: (string | null)[][]): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}
