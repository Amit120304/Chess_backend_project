const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
const roleDisplay = document.getElementById('roleDisplay');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    // Only flip once if this client is Black
    boardElement.classList.toggle('flipped', playerRole === 'b');

    boardElement.innerHTML = '';
    const board = chess.board();
    // Always draw rows 0→7 and cols 0→7
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = board[r][c];
            const sqEl = document.createElement('div');
            sqEl.classList.add('square', (r + c) % 2 === 0 ? 'light' : 'dark');
            sqEl.dataset.row = r;
            sqEl.dataset.col = c;

            if (square) {
                const p = document.createElement('div');
                p.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                p.innerText = getPieceUnicode(square);
                p.draggable = playerRole === square.color;
                p.addEventListener('dragstart', e => {
                    if (!p.draggable) return;
                    draggedPiece = p;
                    sourceSquare = { row: r, col: c };
                    e.dataTransfer.setData('text/plain', '');
                });
                p.addEventListener('dragend', () => { draggedPiece = null; sourceSquare = null; });
                sqEl.appendChild(p);
            }

            sqEl.addEventListener('dragover', e => e.preventDefault());
            sqEl.addEventListener('drop', e => {
                e.preventDefault();
                if (draggedPiece) {
                    const target = { row: +sqEl.dataset.row, col: +sqEl.dataset.col };
                    handleMove(sourceSquare, target);
                }
            });

            boardElement.appendChild(sqEl);
        }
    }

    roleDisplay.innerText = `You are: ${playerRole === 'w' ? 'White' : playerRole === 'b' ? 'Black' : 'Spectator'}`;
};

const handleMove = (src, tgt) => {
    const move = {
        from: `${String.fromCharCode(97 + src.col)}${8 - src.row}`,
        to: `${String.fromCharCode(97 + tgt.col)}${8 - tgt.row}`,
        promotion: 'q'
    };
    socket.emit('move', move);
};

const unicodeMap = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟︎' }
};
const getPieceUnicode = sq => unicodeMap[sq.color][sq.type] || '';

socket.on('playerRole', role => { playerRole = role; renderBoard(); });
socket.on('spectatorRole', () => { playerRole = null; renderBoard(); });
socket.on('boardState', fen => { chess.load(fen); renderBoard(); });
socket.on('move', mv => { chess.move(mv); renderBoard(); });
socket.on('gameOver', o => {
    alert(o.type === 'checkmate' ? `Checkmate! ${o.winner} wins.` : 'Draw. Restarting new game.');
});
socket.on('reset', fen => { chess.reset(); chess.load(fen); renderBoard(); });

// Initial render (wait for role)
renderBoard();