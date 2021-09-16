// Model implementation for a game of Freecell, having foundation, open, and cascade piles.
// Enforces the rules of the game, executes moves, and reports on game state.
// "private" methods that the controller and view do not depend on have names starting with _
class FreecellGame {
  constructor(numOpen, numCascade) {
    if (isNaN(parseInt(numOpen, 10)) || numOpen < 1 || numOpen > 52) {
      throw "Invalid number of open piles: " + numOpen;
    }
    if (isNaN(parseInt(numCascade, 10)) || numCascade < 1 || numCascade > 52) {
      throw "Invalid number of cascade piles: " + numCascade;
    }
    [numOpen, numCascade] = [parseInt(numOpen, 10), parseInt(numCascade, 10)];

    //3 arrays for each type of card
     this.foundation = [];
     for(var k = 0; k < 4; k++) {
       this.foundation.push([]);
     }
     this.open = [];
     for(var k = 0; k < numOpen; k++) {
       this.open.push([]);
     }
     var deck = getDeck();
     this.cascade = [];
     for(var k = 0; k < numCascade; k++) {
       this.cascade.push([]);
     }
     for(var i = 0; i < deck.length; i++) {
       this.cascade[i % numCascade].push(deck[i]);
     }
  }

  getNumCascade() {
    return this.cascade.length;
  }
  getNumOpen() {
    return this.open.length;
  }
  getFoundation() {
    //this line below is original, not making a deep copy so replaced with the last line.
    //return this.foundation.slice();
    return this.foundation.map(p => p.slice());
  }
  getOpen() {
    return this.open.map(p => p.slice());
  }
  getCascade() {
    return this.cascade.map(p => p.slice());
  }

  // execute a move from srcPile, e.g. {type:"cascade", index: 0, cardIndex, 5}
  // to destPile, e.g. {type:"open", index: 3}
  // mutates the game state.
  executeMove(srcPile, destPile) {
    let sourceCard = this._getSourceCardFromPile(srcPile);
    // .pop(): remove and return last element of array
    // .push(arg): add arg to end of array

    if (srcPile.type == "cascade" && destPile.type == "cascade") {
      if (this._isMultiMove(srcPile)) {
        let numCard = this.cascade[srcPile.index].length - srcPile.cardIndex;
        console.log(numCard + " moving from cascade to cascade");
        // get card and put into array
        for (let i = 0; i < numCard; i++) {
          this.cascade[destPile.index].push(this.cascade[srcPile.index][srcPile.cardIndex + i]);
        }

        for (let i = 0; i < numCard; i++) {
          this.cascade[srcPile.index].pop();
        }
        return;
      }
    }

    if (destPile.type == "cascade") {
      this.cascade[destPile.index].push(sourceCard);
    }
    else if (destPile.type == "open") {
      this.open[destPile.index].push(sourceCard);
    }
    else if (destPile.type == "foundation") {
      this.foundation[destPile.index].push(sourceCard);
    }

    
    if (srcPile.type == "cascade") {
      this.cascade[srcPile.index].pop();
    }
    else if (srcPile.type == "open") {
      this.open[srcPile.index] = [];
    }
  }

  // attempt to stick the given card on either a foundation or an open
  // by finding whatever foundation pile is valid, or the first open pile.
  // return true if success, false if no automatic move available
  // mutates the game state if a move is available.
  attemptAutoMove(srcPile) {
    let sourceCard = this._getSourceCardFromPile(srcPile);

    if (this.getValidFoundation(srcPile) != -1) {
      let index = this.getValidFoundation(srcPile);
      this.foundation[index].push(sourceCard);

      if (srcPile.type == "cascade") {
        this.cascade[srcPile.index].pop();
      }
      else if (srcPile.type == "open") {
        this.open[srcPile.index] = [];
      }
      return true;
    }

    else if (this.getFirstAvailableOpen() != -1) {
      let index = this.getFirstAvailableOpen();
      this.open[index].push(sourceCard);

      if (srcPile.type == "cascade") {
        this.cascade[srcPile.index].pop();
      }
      else if (srcPile.type == "open") {
        this.open[srcPile.index] = [];
      }
      return true;
    }    

    return false;
  }

  _getSourceCardFromPile(CardPile) {
    if (CardPile.type == "cascade") {
      return this.cascade[CardPile.index][CardPile.cardIndex];
    }
    else if (CardPile.type == "open") {
      return this.open[CardPile.index][0];
    }
  }

  _getDestinationCardFromPile(CardPile) {
    if (CardPile.type == "cascade") {
      return this.cascade[CardPile.index][this.cascade[CardPile.index].length - 1];
    }
    else if (CardPile.type == "open") {
      return this.open[CardPile.index];
    }
    else if (CardPile.type == "foundation") {
      return this.foundation[CardPile.index][this.foundation[CardPile.index].length - 1];
    }
  }

  // (complete) return index of first valid foundation destination for the given card,
  // or anything else if there is no valid foundation destination
  getValidFoundation(srcPile) {
    let srcCard = this._getSourceCardFromPile(srcPile);

    // go through each foundation pile to see if the source can be successfully moved
    for (let i = 0; i < this.foundation.length; i++) {
      // for each foundation pile, find the last card and compare with the given srcPile.
      // if the current foundation pile is empty just return this pile index.
      if (this.foundation[i].length == 0) {
        if(srcCard.getValue() == 1) {
          return i;
        }
        continue;
      }

      let currentLastCard = this.foundation[i][this.foundation[i].length - 1];
      console.log(currentLastCard);
      if (currentLastCard.getSuit() == srcCard.getSuit() && currentLastCard.getValue() == srcCard.getValue() - 1) {
        return i;
      }

    }
    return -1;
  }

  // (complete) return index of first empty open pile
  // or anything else if no empty open pile
  getFirstAvailableOpen() {
    let numOpen = this.open.length;
    /*
    for (let i = 0; i < numOpen; i++) {
      console.log(this.open[i]);
    }
    */
    for (let i = 0; i < numOpen; i++) {
      if (this.open[i].length == 0) {
        return i;
      }
    }
    return -1;
  }

  // (complete) return true if in the given cascade pile, starting from given index, there is a valid "build"
  isBuild(pileIdx, cardIdx) {
    // if the card is the last card in that cascade pile, then return true
    if (cardIdx == this.cascade[pileIdx].length - 1) {
      return true;
    }

    // if the card is not the last card in the cascade pile, check this index to the last-1 index
    for (let i = cardIdx; i < this.cascade[pileIdx].length - 1; i++) {
      let card1 = this.cascade[pileIdx][cardIdx];
      let card2 = this.cascade[pileIdx][cardIdx + 1];
      if (card1.isBlack() == card2.isBlack() || card1.getValue() != card2.getValue() + 1) {
        return false;
      }
    }

    return true;
  }

  
  _isValidAddToCascade(sourceCard, destPile) {

    // check if pile information for cascade pile is correct
    if (destPile.index > this.cascade.length - 1 
      || destPile.index < 0) {
      return false;
    }

    if (this.cascade[destPile.index].length == 0) {
      return true;
    }

    // check if the source card can be added to the dest card
    let destCard = this._getDestinationCardFromPile(destPile);
    if (sourceCard.isBlack() == destCard.isBlack()) {
      return false;
    }
    if (sourceCard.getValue() != destCard.getValue() - 1) {
      return false;
    }
    return true;
  }
  
  _isValidAddToFoundation(sourceCard, destPile) {

    // check if pile information for foundation pile is correct
    if (destPile.index > this.foundation.length - 1 
      || destPile.index < 0 || destPile.index == -1) {
      return false;
    }

    if (this.foundation[destPile.index].length == 0 && sourceCard.getValue() == 1) {
      return true;
    }

    let destCard = this._getDestinationCardFromPile(destPile);
    // check if the source card can be added to the dest card
    if (sourceCard.getSuit() != destCard.getSuit()) {
      return false;
    }
    if (sourceCard.getValue() != destCard.getValue() + 1) {
      return false;
    }
    return true;
  }

  _isValidAddToOpen(sourceCard, destPile) {
    if (destPile.index < 0 || destPile.index > 3 || destPile.index == -1) {
      return false;
    }
    if (this.open[destPile.index] == Card) {
      return false;
    }

    return true;
  }

  // check if the card is the last card in a particular cascade pile (is the move a multimove)
  // return True if the card is not the last card.
  // return False if the card is the last card.
  _isMultiMove(srcPile) {
    if (srcPile.cardIndex == this.cascade[srcPile.index].length - 1) {
      return false;
    }
    
    return true;
  }

  // return true if the move from a cascade srcPile to destPile would be valid, false otherwise.
  // does NOT mutate the model.
  isValidMove(srcPile, destPile) {

    if(!srcPile || !destPile
      || (srcPile.type == destPile.type && srcPile.index == destPile.index)
      || srcPile.type == "foundation") {
      return false;
    }

    //check if the current move is a multi-move
    let isMultiMove;

    if (srcPile.type == "cascade") {
      if (srcPile.index > this.cascade.length - 1 
        || srcPile.index < 0) {
          return false;
      }
      if (srcPile.cardIndex > this.cascade[srcPile.index].length - 1 
        || srcPile.cardIndex < 0 || srcPile.cardIndex == undefined) {
          return false;
      }
      isMultiMove = this._isMultiMove(srcPile);
    }
    else if (srcPile.type == "open") {
      if (srcPile.index > this.open.length - 1 
        || srcPile.index < 0) {
          return false;
      }
    }

    let sourceCard = this._getSourceCardFromPile(srcPile);   

    // all the rules for moves in freecell
    // 1. (Working) if src == cascade and dst == cascade
    if (srcPile.type == "cascade" && destPile.type == "cascade") {
      if (isMultiMove) {
        if (this._isValidAddToCascade(sourceCard, destPile) 
        && (this.cascade[srcPile.index].length - srcPile.cardIndex <= this._numCanMove(destPile.index))) {
          return true;
        }
      }
      else {
        console.log("in isValid");
        if (this._isValidAddToCascade(sourceCard, destPile) == true) {
          console.log("is valid single move");
          return true;
        }
      }
    }
    // 2. (Working) if src == cascade and dst == open
    else if (srcPile.type == "cascade" && destPile.type == "open") {
      if (isMultiMove == true) {
        return false;
      }

      return this._isValidAddToOpen(sourceCard, destPile);
    }

    // 3. (Working) if src == cascade and dst == foundation
    else if (srcPile.type == "cascade" && destPile.type == "foundation") {
      if (isMultiMove == true) {
        return false;
      }

      if (this._isValidAddToFoundation(sourceCard, destPile) == true) {
        return true;
      }
    }
    // 4. (Working) if src == open and dst == cascade
    else if (srcPile.type == "open" && destPile.type == "cascade") {
      if (this._isValidAddToCascade(sourceCard, destPile) == true) {
        return true;
      }
    }
    // 4. (Working) if src == open and dst == foundation
    else if (srcPile.type == "open" && destPile.type == "foundation") {
      if (this._isValidAddToFoundation(sourceCard, destPile) == true) {
        return true;
      }
    }
    return false;
  }

  // suggested private methods
  _numCanMove(destPileIndex) {
    var numOpen = this.open.reduce((sum, c) => c.length == 0 ? sum + 1 : sum, 0);
    var numEmptyCascade = this.cascade.reduce((sum, c) => c.length == 0 ? sum + 1 : sum, 0);
    if(this.cascade[destPileIndex].length == 0) {
      numEmptyCascade--;  // subtract one empty pile if destination is empty
      // this is technically a rule of freecell though we glossed over it on HW4
    }
    return (numOpen + 1) * Math.pow(2, numEmptyCascade);
  }

  // GIVEN: is overCard stackable on top of underCard, according to solitaire red-black rules
  static _isStackable(underCard, overCard) {
    return underCard.getValue() - 1 == overCard.getValue()
      && overCard.isBlack() != underCard.isBlack();
  }
}

// GIVEN: generate and return a shuffled deck (array) of Cards.
function getDeck() {
  var deck = [];
  var suits = ["spades", "clubs", "diamonds", "hearts"];
  for(var v = 13; v >= 1; v--) {
    for(s in suits) {
      deck.push(new Card(v, suits[s]));
    }
  }
  shuffle(deck);    // comment out this line to not shuffle
  return deck;
}

// GIVEN: shuffle an array: mutate the given array to put its values in random order
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a remaining element...
    let j = Math.floor(Math.random() * (i + 1));
    // And swap it with the current element.
    [array[i], array[j]] = [array[j], array[i]];
  }
}
