document.addEventListener("DOMContentLoaded", () => {
  let board = null; // Initialize the chessboard
  const game = new Chess(); // Create new Chess.js game instance
  const moveHistory = document.getElementById("move-history"); // Get move history container
  const voiceText = document.getElementById("voice-text"); // Display recognized text
  const voiceLog = document.getElementById("voice-log"); // Display log of all recognized text
  let moveCount = 1; // Initialize the move count
  let userColor = "w"; // Initialize the user's color as white

  // Function to make a random move for the computer
  const makeRandomMove = () => {
    const possibleMoves = game.moves();

    if (game.game_over()) {
      alert("Checkmate!");
    } else {
      const randomIdx = Math.floor(Math.random() * possibleMoves.length);
      const move = possibleMoves[randomIdx];
      game.move(move);
      board.position(game.fen());
      recordMove(move, moveCount); // Record and display the move with move count
      moveCount++; // Increment the move count
    }
  };

  // Function to record and display a move in the move history
  const recordMove = (move, count) => {
    const formattedMove =
      count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} -`;
    moveHistory.textContent += formattedMove + " ";
    moveHistory.scrollTop = moveHistory.scrollHeight; // Auto-scroll to the latest move
  };

  // Function to handle the start of a drag position
  const onDragStart = (source, piece) => {
    // Allow the user to drag only their own pieces based on color
    return !game.game_over() && piece.search(userColor) === 0;
  };

  // Function to handle a piece drop on the board
  const onDrop = (source, target) => {
    const move = game.move({
      from: source,
      to: target,
      promotion: "q",
    });

    if (move === null) return "snapback";

    window.setTimeout(makeRandomMove, 250);
    recordMove(move.san, moveCount); // Record and display the move with move count
    moveCount++;
  };

  // Function to handle the end of a piece snap animation
  const onSnapEnd = () => {
    board.position(game.fen());
  };

  // Configuration options for the chessboard
  const boardConfig = {
    showNotation: true,
    draggable: true,
    position: "start",
    onDragStart,
    onDrop,
    onSnapEnd,
    moveSpeed: "fast",
    snapBackSpeed: 500,
    snapSpeed: 100,
  };

  // Initialize the chessboard
  board = Chessboard("board", boardConfig);

  // Function to execute voice command to set position using FEN
  const executeFENCommand = (command) => {
    // Convert spoken move to a valid FEN
    const fen = command.replace("set position", "").trim();
    if (game.load(fen)) {
      board.position(fen);
      moveHistory.textContent = "";
      moveCount = 1;
      userColor = "w";
      voiceText.textContent = `Position set: ${fen}`;
      voiceLog.textContent += `Recognized: ${fen}\n`;
    } else {
      alert("Invalid FEN notation. Please try again.");
      voiceText.textContent = `Invalid FEN: ${fen}`;
      voiceLog.textContent += `Invalid FEN: ${fen}\n`;
    }
  };

  // Function to execute generic voice command
  const executeVoiceCommand = (command) => {
    // Convert spoken move to a chess move
    let move = command
      .replace(/move\s*/, "")
      .trim()
      .toLowerCase();
    const movePattern = /^[a-h][1-8][a-h][1-8]$/;
    const moveWithToPattern = /^[a-h][1-8]\s*to\s*[a-h][1-8]$/;

    let fromSquare, toSquare;

    if (movePattern.test(move)) {
      fromSquare = move.substring(0, 2);
      toSquare = move.substring(2, 4);
    } else if (moveWithToPattern.test(move)) {
      const moveParts = move.split(/\s*to\s*/);
      fromSquare = moveParts[0];
      toSquare = moveParts[1];
    } else {
      voiceText.textContent = `Invalid move format: ${move}`;
      voiceLog.textContent += `Invalid move format: ${move}\n`;
      return;
    }

    const isValidMove =
      /^[a-h][1-8]$/.test(fromSquare) && /^[a-h][1-8]$/.test(toSquare);
    if (isValidMove) {
      const moveResult = game.move({
        from: fromSquare,
        to: toSquare,
        promotion: "q", // Always promote to queen for simplicity
      });

      if (moveResult) {
        board.position(game.fen());
        recordMove(moveResult.san, moveCount); // Record and display the move with move count
        moveCount++;
        voiceText.textContent = `Move: ${fromSquare} to ${toSquare}`;
        voiceLog.textContent += `Recognized move: ${fromSquare} to ${toSquare}\n`;
      } else {
        voiceText.textContent = `Invalid move: ${fromSquare} to ${toSquare}`;
        voiceLog.textContent += `Invalid move: ${fromSquare} to ${toSquare}\n`;
      }
    } else {
      voiceText.textContent = `Invalid move format: ${move}`;
      voiceLog.textContent += `Invalid move format: ${move}\n`;
    }
  };

  // Function to handle speech recognition
  const recognizeSpeech = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.trim().toLowerCase();
      voiceText.textContent = `Recognized: ${command}`;
      voiceLog.textContent += `Recognized: ${command}\n`;

      // Decide whether to execute a FEN command or a move command
      if (command.startsWith("set position")) {
        executeFENCommand(command);
      } else if (command.startsWith("move")) {
        executeVoiceCommand(command);
      } else {
        executeVoiceCommand(command); // Try to interpret it as a move command
      }

      recognition.stop();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      voiceText.textContent = `Error: ${event.error}`;
      voiceLog.textContent += `Error: ${event.error}\n`;
    };

    recognition.start();
  };

  // Event listener for the "Play Again" button
  document.querySelector(".play-again").addEventListener("click", () => {
    game.reset();
    board.start();
    moveHistory.textContent = "";
    moveCount = 1;
    userColor = "w";
    voiceText.textContent = "";
    voiceLog.textContent = "";
  });

  // Event listener for the "Set Position" button
  document.querySelector(".set-pos").addEventListener("click", () => {
    const fen = prompt("Enter the FEN notation for the desired position!");
    if (fen !== null) {
      if (game.load(fen)) {
        board.position(fen);
        moveHistory.textContent = "";
        moveCount = 1;
        userColor = "w";
      } else {
        alert("Invalid FEN notation. Please try again.");
      }
    }
  });

  // Event listener for the "Flip Board" button
  document.querySelector(".flip-board").addEventListener("click", () => {
    board.flip();
    makeRandomMove();
    // Toggle user's color after flipping the board
    userColor = userColor === "w" ? "b" : "w";
  });

  // Event listener for the "Voice Control for FEN" button
  document
    .querySelector(".voice-control")
    .addEventListener("click", recognizeSpeech);
});
