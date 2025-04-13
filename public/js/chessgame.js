const socket = io();
// import { Chess } from 'chess.js';
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    // console.log(board);
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            // console.log(square);
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? 'light' : 'dark'
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;
            if (square) {
                const pieceElement = document.createElement("div");
                // Check if square.atsquare exists before accessing its color property.
                // if (square.atsquare) {
                pieceElement.classList.add(
                    square.color === "w" ? "white" : "black"
                );
                // } 
                // else {
                //     // If square.atsquare does not exist, use another default class for the piece
                //     pieceElement.classList.add("no-color");
                // }
                // console.log(square.type);
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                })

                pieceElement.addEventListener("dragend", () => {
                    console.log(draggedPiece);
                    console.log(sourceSquare);
                    // draggedPiece = null;
                    // sourceSquare = null;
                    // console.log(draggedPiece);
                    // console.log(sourceSquare);
                })

                squareElement.appendChild(pieceElement);


            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    }
                    console.log(sourceSquare, targetSource);
                    handleMove(sourceSquare, targetSource);
                }
            });




            boardElement.appendChild(squareElement);
        });
    });

}



const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q' // always promote to a queen for example simplicity
    }
    console.log(move);
    socket.emit("move", move);
}
const getPieceUnicode = (square) => {
    const pieceUnicodeWhite = {
        k: '\u2654',
        q: '\u2655',
        r: '\u2656',
        b: '\u2657',
        n: '\u2658',
        p: '\u2659',
    }
    const pieceUnicodeBlack = {
        k: '\u265A',
        q: '\u265B',
        r: '\u265C',
        b: '\u265D',
        n: '\u265E',
        p: '\u{265F}',

    }
    if (square.color === 'w') {
        console.log(square.color, square.type);
        return pieceUnicodeWhite[square.type] || "";
    }
    return pieceUnicodeBlack[square.type] || "";
}

socket.on("playerRole", (role) => {
    console.log(role, "playerRole");
    playerRole = role;
    renderBoard();
})
socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
})
socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
})
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
})

renderBoard();