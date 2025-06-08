(() => {
  const SHAPES = {
    circle: "●",
    cross: "✚",
    triangle: "▲",
    star: "★",
    square: "■",
    whot: "❖"
  };
  const SHAPE_NAMES = ["circle", "cross", "triangle", "star", "square"];
  const NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,20]; // 20 = Whot

  let deck = [];
  let playerHand = [];
  let computerHand = [];
  let pile = null;
  let currentPlayer = "player";
  let requestedShape = null;

  const pileDiv = document.getElementById("pile");
  const playerHandDiv = document.getElementById("player-hand");
  const computerCountSpan = document.getElementById("computer-count");
  const deckCountSpan = document.getElementById("deck-count");  // New deck count span
  const statusDiv = document.getElementById("status");
  const restartBtn = document.getElementById("restart-btn");
  const drawBtn = document.getElementById("draw-btn");

  // Shape request UI
  let shapeRequestDiv;
  function createShapeRequestUI() {
    shapeRequestDiv = document.createElement("div");
    shapeRequestDiv.id = "shape-request";
    shapeRequestDiv.style.display = "none";
    shapeRequestDiv.style.flexDirection = "column";
    shapeRequestDiv.style.alignItems = "center";
    shapeRequestDiv.innerHTML = `<div>
      <strong>Choose a shape to request:</strong><br>
      ${SHAPE_NAMES.map(shape => 
        `<button class="${shape}" style="font-size:2rem; margin:5px;">${SHAPES[shape]}</button>`
      ).join("")}
    </div>`;
    document.body.appendChild(shapeRequestDiv);

    // Add click listeners for buttons
    shapeRequestDiv.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        requestedShape = btn.className;
        shapeRequestDiv.style.display = "none";
        setStatus(`Shape requested: ${requestedShape}`);
        // Switch to computer turn after player chooses shape
        currentPlayer = "computer";
        setTimeout(computerTurn, 1000);
      });
    });
  }

  function createDeck() {
    deck = [];
    SHAPE_NAMES.forEach(shape => {
      NUMBERS.forEach(num => {
        if(num === 20) return; // skip here, add below
        deck.push({shape, number: num});
      });
    });
    for(let i=0; i<5; i++) {
      deck.push({shape:"whot", number:20});
    }
    shuffle(deck);
  }

  function shuffle(arr) {
    for(let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function dealHands() {
    playerHand = deck.splice(0, 10);
    computerHand = deck.splice(0, 10);
  }

  function startPile() {
    pile = deck.shift();
  }

  function canPlayCard(card) {
    if(!pile) return true;
    if(requestedShape) {
      return card.shape === requestedShape || card.shape === "whot";
    }
    return card.shape === pile.shape || card.number === pile.number || card.shape === "whot";
  }

  function renderCard(card) {
    const div = document.createElement("div");
    div.className = `card ${card.shape}`;
    div.innerHTML = `<div class="shape-icon">${SHAPES[card.shape]}</div><div>${card.number}</div>`;
    return div;
  }

  function renderHands() {
    playerHandDiv.innerHTML = "";
    playerHand.forEach((card, idx) => {
      const cardDiv = renderCard(card);
      if(currentPlayer === "player" && canPlayCard(card)) {
        cardDiv.addEventListener("click", () => {
          playCard("player", idx);
        });
      } else {
        cardDiv.classList.add("disabled");
      }
      playerHandDiv.appendChild(cardDiv);
    });
    computerCountSpan.textContent = computerHand.length;
  }

  function updatePileDisplay() {
    if(!pile) {
      pileDiv.textContent = "Empty";
      pileDiv.className = "";
      return;
    }
    pileDiv.className = `card ${pile.shape}`;
    pileDiv.innerHTML = `<div class="shape-icon">${SHAPES[pile.shape]}</div><div>${pile.number}</div>`;
  }

  function setStatus(text) {
    statusDiv.textContent = text;
  }

  function updateDeckCount() {
    deckCountSpan.textContent = deck.length;
  }

  function drawCardFor(player) {
    if(deck.length === 0) {
      setStatus("Deck is empty!");
      return false;
    }
    const card = deck.shift();
    if(player === "player") playerHand.push(card);
    else computerHand.push(card);
    setStatus(`${player === "player" ? "You" : "Computer"} drew a card.`);
    updateDeckCount();          // Update deck count here
    renderHands();
    return true;
  }

  function playerHasPlayableCard() {
    return playerHand.some(canPlayCard);
  }

  function computerHasPlayableCard() {
    return computerHand.some(canPlayCard);
  }

  function checkForDraw() {
    if (
      deck.length === 0 &&
      !playerHasPlayableCard() &&
      !computerHasPlayableCard()
    ) {
      alert("Game over: Draw!");
      resetGame();
      return true;
    }
    return false;
  }

  function playCard(player, cardIndex) {
    const hand = player === "player" ? playerHand : computerHand;
    const card = hand[cardIndex];

    if(!canPlayCard(card)) {
      setStatus("Cannot play that card.");
      return;
    }

    hand.splice(cardIndex, 1);
    pile = card;
    requestedShape = null;
    updatePileDisplay();
    renderHands();
    setStatus(`${player === "player" ? "You" : "Computer"} played ${card.number} ${card.shape}`);

    if(card.number === 20) {
      if(player === "player") {
        setStatus("You played Whot! Choose a shape to request.");
        shapeRequestDiv.style.display = "flex";
        return;
      } else {
        // Computer picks shape it has
        const shapesInHand = {};
        computerHand.forEach(c => shapesInHand[c.shape] = true);
        const available = Object.keys(shapesInHand).filter(s => s !== "whot");
        requestedShape = available.length ? available[Math.floor(Math.random() * available.length)] : null;
        setStatus(`Computer played Whot! Requests shape: ${requestedShape}`);
      }
    }

    if(hand.length === 0) {
      alert(player === "player" ? "You win!" : "Computer wins!");
      resetGame();
      return;
    }

    if (checkForDraw()) return;

    currentPlayer = player === "player" ? "computer" : "player";

    if(currentPlayer === "computer") {
      setTimeout(computerTurn, 1000);
    } else {
      setStatus("Your turn.");
      renderHands();
    }
  }

  function computerTurn() {
    setStatus("Computer's turn...");

    let playableIndex = computerHand.findIndex(canPlayCard);
    if(playableIndex === -1) {
      if(drawCardFor("computer")) {
        playableIndex = computerHand.findIndex(canPlayCard);
      } else {
        setStatus("Deck empty. Computer cannot play.");
      }

      if(checkForDraw()) return;
    }
    if(playableIndex !== -1) {
      setTimeout(() => {
        playCard("computer", playableIndex);
      }, 1000);
    } else {
      // If still no playable card, just pass turn to player
      currentPlayer = "player";
      setStatus("Computer Drew Card. Your turn.");
      renderHands();
    }
  }

  function resetGame() {
    requestedShape = null;
    currentPlayer = "player";
    createDeck();
    dealHands();
    startPile();
    updatePileDisplay();
    updateDeckCount();          // Update deck count on reset
    renderHands();
    setStatus("Game started! Your turn.");
  }

  restartBtn.addEventListener("click", resetGame);

  drawBtn.addEventListener("click", () => {
    if(currentPlayer !== "player") {
      setStatus("Wait for your turn.");
      return;
    }
    // Only draw if no playable cards
    const hasPlayable = playerHand.some(canPlayCard);
    if(hasPlayable) {
      setStatus("You have playable cards. Play them first.");
      return;
    }
    if(drawCardFor("player")) {
      setStatus("You drew a card. Computer's turn now.");
      currentPlayer = "computer";
      if(checkForDraw()) return;
      setTimeout(computerTurn, 1000);
    }
  });

  // Init
  createShapeRequestUI();
  resetGame();
})();