class Player {
        constructor(x, y, direction, color, username) {
                this.color = color || "#fff";
                this.username = username || "AI"
                this.dead = false;
                this.direction = "";
                this.key = direction;
                this.x = x;
                this.y = y;
                this.startX = x;
                this.startY = y;
                this.startDirection = direction;
        }
}


class Tron {
        static UNIT = 15;
        static MIN_NUM_PLAYER = 2;
        static MAX_NUM_PLAYER = 4;
        static REFRESH_TIMELAPSE = 100;

        constructor(width, height) {
                this.canvas = document.getElementById("tron");
                this.context = this.canvas.getContext("2d");

                this.initUnboared()
                this.initGame(width, height)
        }

        initUnboared() {
                this.unboared = new Unboared.Game()
                this.unboared.init()
                this.unboared.onReady(() => this.resetGame())
                this.unboared.onConnect(() => this.resetGame())
                this.unboared.onDisconnect(() => this.resetGame())
                this.unboared.onMessageReceived((message, from, data) => this.messageHandler(
                        message, from, data))
                this.unboared.start()
        }

        initGame(width, height) {
                // Start coordinates
                const start_h = Math.round(0.01 * width) * Tron.UNIT
                const end_h = width - start_h
                const start_v = Math.round(0.01 * height) * Tron.UNIT
                const end_v = height - start_v

                // Initialize players start coordinates
                this.startXY = [
                        [start_h, start_v, "DOWN"],
                        [end_h, end_v, "UP"],
                        [end_h, start_v, "LEFT"],
                        [start_h, end_v, "RIGHT"]
                ];

                // Initialize informations
                this.outcome = ""
                this.winnerColor = ""
                this.game = null

                // Initialize players
                this.players = []
                this.playerCount = 0;

                // Initialize cells
                this.playableCells = this.getPlayableCells(this.canvas, Tron.UNIT);

        }

        updateActivePlayers() {
                const activeGP = this.unboared.getGamepadIDs().slice(0, Tron.MAX_NUM_PLAYER);
                this.unboared.loadActivePlayers(activeGP)
                this.players = []
                for (let i = 0; i < activeGP.length; i++) {
                        let color = this.unboared.getColor(activeGP[i])
                        let username = this.unboared.getUsername(activeGP[i])
                        let player = new Player(this.startXY[i][0], this.startXY[i]
                                [1],
                                this.startXY[i][2], color, username)
                        this.players.push(player)
                }
                this.playerCount = this.players.length;
                // Reset outcome
                this.outcome = "";
                this.winnerColor = "";
        }

        messageHandler(message, from, data) {
                let activePlayer = this.unboared.getActivePlayerIndex(from)
                if (activePlayer < this.players.length) {
                        let player = this.players[activePlayer]
                        switch (message) {
                                case "UP":
                                        if (player.direction !== "DOWN")
                                                player.key = "UP";
                                        break;
                                case "RIGHT":
                                        if (player.direction !== "LEFT") {
                                                player.key = "RIGHT";
                                        }
                                        break;
                                case "DOWN":
                                        if (player.direction !== "UP") {
                                                player.key = "DOWN";
                                        }
                                        break;
                                case "LEFT":
                                        if (player.direction !== "RIGHT") {
                                                player.key = "LEFT";
                                        }
                                        break;
                                default:
                                        break;
                        }
                }
        }

        resetGame() {
                if (this.game === null) {
                        // Remove the results node
                        const result = document.getElementById("result");
                        if (result) result.remove();

                        this.updateActivePlayers()

                        // Remove background then re-draw it
                        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        this.drawBackground();

                        // Reset playableCells
                        this.playableCells = this.getPlayableCells(this.canvas, Tron.UNIT);

                        // Reset players
                        this.players.forEach((p) => {
                                p.x = p.startX;
                                p.y = p.startY;
                                p.dead = false;
                                p.direction = "";
                                p.key = p.startDirection;
                        });
                        this.playerCount = this.players.length;
                        this.drawStartingPositions(this.players);

                        // Reset outcome
                        this.outcome = "";
                        this.winnerColor = "";

                        // Ensure draw() has stopped, then re-trigger it
                        clearInterval(this.game);
                        this.game = setInterval(() => this.draw(), Tron.REFRESH_TIMELAPSE);
                }
        }


        draw() {
                if (this.players.length < Tron.MIN_NUM_PLAYER) {
                        this.outcome = this.players.length === 1 ?
                                "Requires one additional player!" :
                                "Requires two additional players!";
                } else {
                        if (this.playerCount === 1) {
                                const alivePlayers = this.players.filter((p) => !p.dead);
                                this.outcome = `${alivePlayers[0].username} wins!`;
                                this.winnerColor = alivePlayers[0].color;
                        } else if (this.playerCount === 0) {
                                this.outcome = "Draw!";
                        }
                }

                if (this.outcome) {
                        this.createResultsScreen(this.winnerColor);
                        clearInterval(this.game);
                        this.game = null
                }

                this.players.forEach((p) => {
                        if (p.key) {
                                p.direction = p.key;

                                this.context.fillStyle = p.color;
                                this.context.fillRect(p.x,
                                        p.y, Tron.UNIT, Tron.UNIT);
                                this.context.strokeStyle = "black";
                                this.context.strokeRect(p.x, p.y, Tron.UNIT,
                                        Tron.UNIT);

                                if (!this.playableCells.has(
                                                `${p.x}x${p.y}y`) && !p.dead) {
                                        p.dead = true;
                                        p.direction = "";
                                        this.playerCount -= 1;
                                }

                                this.playableCells.delete(
                                        `${p.x}x${p.y}y`
                                );

                                if (!p.dead) {
                                        if (p.direction === "LEFT")
                                                p.x -= Tron.UNIT;
                                        if (p.direction === "UP")
                                                p.y -= Tron.UNIT;
                                        if (p.direction === "RIGHT")
                                                p.x += Tron.UNIT;
                                        if (p.direction === "DOWN")
                                                p.y += Tron.UNIT;
                                }
                        }
                });
        }

        drawBackground() {
                this.context.strokeStyle = "#001900";
                for (let i = 0; i <= this.canvas.width / Tron.UNIT + 2; i += 2) {
                        for (let j = 0; j <= this.canvas.height / Tron.UNIT + 2; j += 2) {
                                this.context.strokeRect(0, 0, Tron.UNIT * i, Tron.UNIT * j);
                        }
                }

                this.context.strokeStyle = "#000000";
                this.context.lineWidth = 2;
                for (let i = 1; i <= (this.canvas.width + Tron.UNIT) / Tron.UNIT; i += 2) {
                        for (let j = 1; j <= (this.canvas.height + Tron.UNIT) / Tron.UNIT; j +=
                                2) {
                                this.context.strokeRect(0, 0, Tron.UNIT * i, Tron.UNIT * j);
                        }
                }
                this.context.lineWidth = 1;
        }

        drawStartingPositions(players) {
                players.forEach((p) => {
                        this.context.fillStyle = p.color;
                        this.context.fillRect(p.x, p.y,
                                Tron.UNIT, Tron.UNIT
                        );
                        this.context.strokeStyle = "black";
                        this.context.strokeRect(p.x, p.y,
                                Tron.UNIT, Tron.UNIT
                        );
                });
        }

        getPlayableCells(canvas, unit) {
                let playableCells = new Set();
                for (let i = 0; i < canvas.width / unit; i++) {
                        for (let j = 0; j < canvas.height / unit; j++) {
                                playableCells.add(`${i * unit}x${j * unit}y`);
                        }
                }
                return playableCells;
        }

        createResultsScreen(color) {
                const resultNode = document.createElement("div");
                resultNode.id = "result";
                resultNode.style.color = color || "#fff";
                resultNode.style.position = "fixed";
                resultNode.style.top = 0;
                resultNode.style.display = "grid";
                resultNode.style.gridTemplateColumns = "1fr";
                resultNode.style.width = "100%";
                resultNode.style.height = "100vh";
                resultNode.style.justifyContent = "center";
                resultNode.style.alignItems = "center";
                resultNode.style.background = "#00000088";

                const resultText = document.createElement("h1");
                resultText.innerText = this.outcome;
                resultText.style.fontFamily = "Bungee, cursive";
                resultText.style.textTransform = "uppercase";

                const replayButton = document.createElement("button");
                replayButton.innerText = "Replay";
                replayButton.style.fontFamily = "Bungee, cursive";
                replayButton.style.textTransform = "uppercase";
                replayButton.style.padding = "10px 30px";
                replayButton.style.fontSize = "1.2rem";
                replayButton.style.margin = "0 auto";
                replayButton.style.cursor = "pointer";
                replayButton.onclick = () => this.resetGame();

                resultNode.appendChild(resultText);
                resultNode.appendChild(replayButton);
                document.querySelector("body").appendChild(resultNode);

                this.unboared.onMessage((message, data) => {
                        if (message === "START") {
                                this.resetGame()
                        }
                })
        }

}