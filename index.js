import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { Chess } from 'chess.js';
import { title } from 'process';

const app = express();
const server = http.createServer(app);

const io = new Server(server);
const chess = new Chess();
let players = {};
let currentTurn = 'w';

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("connectedd", uniquesocket.id);
    console.log("players", players);
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
        // console.log("white player connected");
    }
    else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", () => {
        if (uniquesocket.id == players.white) {
            delete players.white;
        }
        else if (uniquesocket.id == players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            console.log(move);
            if (chess.turn() == 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() == 'b' && uniquesocket.id !== players.black) return;
            const result = chess.move(move);
            if (result) {
                currentTurn = chess.turn();
                console.log(move, currentTurn);
                // currentTurn = (currentTurn == 'w') ? 'b' : 'w';
                io.emit("move", move);
                // console.log(chess.fen());
                io.emit("boardState", chess.fen());
                console.log("boardState", chess.fen());
                // io.emit("playerRole", currentTurn);
            }
            else {
                console.log("invalid move: ", move);
                uniquesocket.emit("invalidMove", move);
            }

        }
        catch (err) {
            console.log(err);
            uniquesocket.emit("invalidMove", move);

        }
    })

    uniquesocket.on("disconnect", () => {
        console.log("user_disconnected", uniquesocket.id);
    })
})

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

server.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`);
});
