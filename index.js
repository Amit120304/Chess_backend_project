import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let chess = new Chess();

// Set EJS view engine
app.set('view engine', 'ejs');
app.set('views', './views');
// Static
app.use(express.static('public'));
// Root route
app.get('/', (req, res) => res.render('index'));

io.white = null;
io.black = null;

io.on('connection', socket => {
    console.log('connected:', socket.id);
    if (!io.white) { io.white = socket.id; socket.emit('playerRole', 'w'); }
    else if (!io.black) { io.black = socket.id; socket.emit('playerRole', 'b'); }
    else { socket.emit('spectatorRole'); }
    socket.emit('boardState', chess.fen());

    socket.on('move', move => {
        if ((chess.turn() === 'w' && socket.id !== io.white) ||
            (chess.turn() === 'b' && socket.id !== io.black)) return;
        const res = chess.move(move);
        if (res) {
            io.emit('move', move);
            io.emit('boardState', chess.fen());
            if (chess.game_over()) {
                const out = chess.in_checkmate()
                    ? { type: 'checkmate', winner: res.color === 'w' ? 'White' : 'Black' }
                    : { type: 'draw' };
                io.emit('gameOver', out);
                chess = new Chess();
                io.emit('reset', chess.fen());
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('disconnected:', socket.id);
        if (socket.id === io.white) io.white = null;
        if (socket.id === io.black) io.black = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
