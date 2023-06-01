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

        kill() {
                this.dead = true;
                this.direction = "";
        }
}


class Tron {
        static UNIT = 15;
        static MIN_NUM_PLAYER = 2;
        static MAX_NUM_PLAYER = 4;
        static REFRESH_TIMELAPSE = 100;

        constructor(width, height) {
                // Initializes Unboared
                this.initUnboared()

                // Initializes the game (players and game field)
                this.initGame(width, height)
        }

        /**
         * Initializes unboared API.
         */
        initUnboared() {
                // --- Initialize Unboared API ---
                this.unboared = new Unboared.Game()
                this.unboared.init()

                // --- Assign event handlers ---
                // Called when the game is successfully loaded
                this.unboared.onReady(() => this.resetGame())

                // Called at a gamepad connection
                this.unboared.onConnect(() => this.resetGame())

                // Called at a gamepad disconnection
                this.unboared.onDisconnect(() => this.resetGame())

                // Called when a gamepad send a message to the screen
                this.unboared.onMessageReceived((message, from, data) => this.messageHandler(
                        message, from, data))

                // --- Start unboared --- 
                // Start listening to events
                this.unboared.start()
        }

        /**
         * Initializes the game.
         * @param {number} width the width of the map 
         * @param {number} height the width of the map
         */
        initGame(width, height) {
                // Create canva 
                this.canvas = document.getElementById("tron");
                this.context = this.canvas.getContext("2d");

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

        /**
         * Resets the game variables and refreshes display screen.
         */
        resetGame() {
                if (this.game === null) {
                        // Remove the results node
                        const result = document.getElementById("result");
                        if (result) result.remove();

                        // Remove background then re-draw it
                        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

                        // Build a list of playable cells in the grid 
                        this.playableCells = this.getPlayableCells(this.canvas, Tron.UNIT);

                        // Reset players
                        this.players = this.getActivePlayers()
                        this.playerCount = this.players.length;

                        // Reset outcome
                        this.outcome = "";
                        this.winnerColor = "";

                        // Ensure draw() has stopped, then re-trigger it
                        clearInterval(this.game);
                        this.game = setInterval(() => this.draw(), Tron.REFRESH_TIMELAPSE);
                }
        }

        /**
         * This function returns the list of players who will be active for the next game.
         * @returns the list of active players
         */
        getActivePlayers() {
                // --- Reset players according to connected gamepads ---
                // Get the gamepad list (maximum 4 players)
                const activeGP = this.unboared.getGamepadIDs().slice(0, Tron.MAX_NUM_PLAYER);

                // Inform every devices about the active players
                this.unboared.loadActivePlayers(activeGP)

                // Instanciate players
                let players = []
                for (let i = 0; i < activeGP.length; i++) {
                        let player =
                                new Player(this.startXY[i][0],
                                        this.startXY[i][1],
                                        this.startXY[i][2],
                                        this.unboared.getColor(activeGP[i]),
                                        this.unboared.getUsername(activeGP[i])
                                )
                        players.push(player)
                }
                return players
        }

        /**
         * This function returns the list of grid cells that can be played on
         * @param {*} canvas the canvas 
         * @param {number} unit the size of a cell
         * @returns 
         */
        getPlayableCells(canvas, unit) {
                let playableCells = new Set();
                for (let i = 0; i < canvas.width / unit; i++) {
                        for (let j = 0; j < canvas.height / unit; j++) {
                                playableCells.add(Tron.cell(i * unit, j * unit));
                        }
                }
                return playableCells;
        }

        /**
         * This function manages messages from the gamepads.
         */
        messageHandler(message, from, data) {
                // Manage messages from the gamepads
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

        /**
         * Redraw the canvas
         */
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
                                this.context.fillRect(p.x, p.y, Tron.UNIT,
                                        Tron.UNIT);

                                if (!this.playableCells.has(Tron.cell(p.x,
                                                p.y)) && !p.dead) {
                                        p.kill()
                                        this.playerCount -= 1;
                                }

                                this.playableCells.delete(Tron.cell(p.x, p.y));

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

        /**
         * Displays the results screen.
         * @param {string} color the color of the winner (#fff if not set)
         */
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
                replayButton.style.backgroundColor = color || "#fff";
                replayButton.style.borderWidth = "0px";
                replayButton.style.borderRadius = "15px";
                replayButton.style.boxShadow = `0px 0px 10px ${color || "#fff"}`;
                replayButton.onclick = () => this.resetGame();

                resultNode.appendChild(resultText);
                resultNode.appendChild(replayButton);
                document.querySelector("body").appendChild(resultNode);

                this.unboared.onMessage("START", (from, data) => {
                        this.resetGame()
                })
        }

        static cell(x, y) {
                return `${x}x${y}y`
        }

}