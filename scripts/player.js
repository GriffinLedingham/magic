var Card = require('../scripts/card');
var Deck = require('../scripts/deck');

module.exports = function Player(socket)
{
	this.socket;
	//functions specific to this card/type
	this.id;
	this.deck;
	this.hand;
	this.graveyard = [];

	this.init = function(socket) {
		this.socket = socket;
		this.id = socket.id;
		this.hand = [];
	};

	this.buildDeck = function(deckString) {
		this.deck = new Deck(deckString);
	};

	this.getFullDeck = function() {
		return this.deck.getCards();
	};

	this.getSimpleDeck = function() {
		return this.deck.getSimpleDeck();
	};

	this.shuffleDeck = function() {
		return this.deck.shuffleDeck();
	};

	this.shuffleHandToDeck = function() {
		this.deck.shuffleCardsIn(this.hand);
		this.hand = [];
		this.updateClientData();
	};

	this.discardHand = function() {
		this.graveyard = this.graveyard.concat(this.hand);
	};

	this.drawCard = function() {
		var card_uuid = this.deck.drawCard();
		this.hand.push(card_uuid);
		this.updateClientData();
	};

	this.updateClientData = function() {
		var simple_hand = [];
		for(var i = 0;i<this.hand.length;i++)
		{
			simple_hand.push(this.deck.getSimpleCardByUUID(this.hand[i]));
		}
		socket.emit('update_data',JSON.stringify({"hand":simple_hand}));
	};

	this.init(socket);
}