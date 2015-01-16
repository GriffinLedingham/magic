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
	this.battlefield = [];

	//Temporary beginner mana for cast testing
	//Should be initialized to 0's
	this.mana_pool = {'white':3,'blue':0,'black':0,'red':3,'green':1,'colorless':0};

	this.init = function(socket) {
		this.socket = socket;
		this.id = socket.id;
		this.hand = [];
	};

	this.buildDeck = function(deckString) {
		this.deck = new Deck(deckString);
		this.updateClientData({'library':true});
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
		this.updateClientData({'hand':true, 'library':true});
	};

	this.discardHand = function() {
		this.graveyard = this.graveyard.concat(this.hand);
		this.hand = [];
		this.updateClientData({'hand':true, 'graveyard':true});
	};

	this.drawCard = function() {
		var card_uuid = this.deck.drawCard();
		this.hand.push(card_uuid);
		this.updateClientData({'hand':true, 'library':true});
	};

	this.playCard = function(card_uuid) {
		//TODO: Check mana here
		if(this.hand.indexOf(card_uuid) != -1)
		{
			var card_to_cast = this.deck.getCardByUUID(card_uuid);
			if(spendManaForCard(card_to_cast.manaCost, this.mana_pool, this))
			{
				this.battlefield.push(card_uuid);
				var index = this.hand.indexOf(card_uuid);
				this.hand.splice(index, 1);

				//TODO: Put the card on the stack
				//TODO: Resolve card's cast effect function

				//Temporary: Place card on battlefield if mana sufficient
				this.updateClientData({'hand':true,'battlefield':true,'mana':true});
			}
		}
	};

	this.updateClientData = function(update_options) {
		var update_json = {};
		
		if(typeof update_options['hand'] != 'undefined')
		{
			var simple_hand = getSimpleCards(this.hand, this.deck);
			update_json.hand = simple_hand;
		}

		if(typeof update_options['battlefield'] != 'undefined')
		{
			var simple_battlefield = getSimpleCards(this.battlefield, this.deck);
			update_json.battlefield = simple_battlefield;
		}

		if(typeof update_options['mana'] != 'undefined')
		{
			update_json.mana = this.mana_pool;
		}

		if(typeof update_options['graveyard'] != 'undefined')
		{
			var simple_graveyard = getSimpleCards(this.graveyard, this.deck);
			update_json.graveyard = simple_graveyard;
		}

		if(typeof update_options['library'] != 'undefined')
		{
			var library_count = this.deck.getCount();
			update_json.library = library_count;
		}

		socket.emit('update_data',JSON.stringify(update_json));
	};

	this.init(socket);
}

function getSimpleCards(cards, deck)
{
	var simple_cards = [];
	for(var i = 0;i<cards.length;i++)
	{
		simple_cards.push(deck.getSimpleCardByUUID(cards[i]));
	}
	return simple_cards;
}


function spendManaForCard(mana_cost, mana_pool, self)
{
	mana_cost = mana_cost.replace(/G/g, 'green').replace(/R/g, 'red').replace(/W/g, 'white').replace(/U/g, 'blue').replace(/B/g, 'black');
	var mana_cost_array = [], re = /{([^}]+)}/g, text;

	while(text = re.exec(mana_cost)) {
		mana_cost_array.push(text[1]);
	}

	var mana_cost_object = {};

	if(isNumber(mana_cost_array[0]))
	{
		mana_cost_object.colorless = parseInt(mana_cost_array[0]);
		mana_cost_array.shift();
	}

	for(var i = 0; i< mana_cost_array.length; i++) {
	    var mana_type = mana_cost_array[i];
	    mana_cost_object[mana_type] = mana_cost_object[mana_type] ? mana_cost_object[mana_type]+1 : 1;
	}

	var have_mana = true;
	for(mana_type in mana_cost_object)
	{
		if(mana_cost_object[mana_type] > self.mana_pool[mana_type])
		{
			have_mana = false;
			break;
		}
	}

	var result = false;
	if(have_mana)
	{
		for(mana_type in mana_cost_object)
		{
			self.mana_pool[mana_type] = parseInt(self.mana_pool[mana_type]) - parseInt(mana_cost_object[mana_type]);
		}
		result = true;
	}

	return result;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}