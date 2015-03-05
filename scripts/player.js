var Card = require('../scripts/card');
var Deck = require('../scripts/deck');

module.exports = function Player(socket)
{
	this.socket;
	this.id;
	this.deck;
	this.hand;
	this.graveyard = [];
	this.battlefield = {};

	this.mana_pool = {'white':3,'blue':0,'black':0,'red':3,'green':1,'colorless':0};

	/**
	 * Initialize player object.
	 * 
	 * @param  {Socket} 	socket
	 */
	this.init = function(socket) {
		this.socket = socket;
		this.id = socket.id;
		this.hand = [];
	};

	/**
	 * Set the player's deck equal to the deck string passed in
	 * 
	 * @param  {String} 	deskString 
	 */
	this.buildDeck = function(deckString) {
		this.deck = new Deck(deckString);
	};

	/**
	 * Draw a card from player's deck and put it in that player's hand
	 */
	this.drawCard = function() {
		var card_uuid = this.deck.drawCard();
		this.hand.push(card_uuid);
	};

	/**
	 * Draw multiple cards, defined by num passed in
	 * 
	 * @param  {Int} 	num
	 */
	this.drawCards = function(num) {
		for(var i = 0;i<num;i++)
		{
			this.drawCard();
		}
	};

	/**
	 * Shuffle the player's hand into their deck.
	 */
	this.shuffleHandToDeck = function() {
		this.deck.shuffleCardsIn(this.hand);
		this.hand = [];
	};

	/**
	 * Place player's hand into the graveyard.
	 */
	this.discardHand = function() {
		this.graveyard = this.graveyard.concat(this.hand);
		this.hand = [];
	};

	/**
	 * Tap target card passed through by card unique id.
	 * 
	 * @param  {String} 	card_uuid
	 */
	this.tapCard = function(card_uuid) {
		if(typeof this.battlefield[card_uuid] != 'undefined')
		{
			var card_to_tap = this.battlefield[card_uuid];
			card_to_tap.tapped = true;
			this.battlefield[card_uuid] = card_to_tap;
		}
	};

	/**
	 * Untap target card passed through by card unique id.
	 * 
	 * @param  {String} 	card_uuid
	 */
	this.untapCard = function(card_uuid) {
		if(typeof this.battlefield[card_uuid] != 'undefined')
		{
			var card_to_untap = this.battlefield[card_uuid];
			card_to_untap.tapped = false;
			this.battlefield[card_uuid] = card_to_untap;
		}
	};

	/**
	 * Untap all cards a player controls.
	 */
	this.untapAllCards = function() {
		for(card_uuid in this.battlefield)
		{
			var card_to_untap = this.battlefield[card_uuid];
			card_to_untap.tapped = false;
			this.battlefield[card_uuid] = card_to_untap;
		}
	};

	/**
	 * Play a card from the player's hand to the battlefield 
	 * and spend corresponding mana to do so.
	 * 
	 * @param  {String} 	card_uuid
	 */
	this.playCard = function(card_uuid) {
		if(this.hand.indexOf(card_uuid) != -1)
		{
			var card_to_cast = this.deck.getCardByUUID(card_uuid);
			if(spendManaForCard(card_to_cast.manaCost, this.mana_pool, this))
			{
				this.battlefield[card_uuid] = {'tapped':false,'damage':0};
				var index = this.hand.indexOf(card_uuid);
				this.hand.splice(index, 1);
				card_to_cast.cast();
			}
		}
	};

	/**
	 * Return the player's full deck as an array (full card objects).
	 * 
	 * @return {Array} 	Player's current library
	 */
	this.getFullDeck = function() {
		return this.deck.getCards();
	};

	/**
	 * Get array of this player's battlefield in the form of simplified cards.
	 * 
	 * @return {Array}
	 */
	this.getSimpleBattlefield = function() {
		return getSimpleBattlefield(this.battlefield, this.deck);
	}

	/**
	 * Shuffle this player's deck.
	 */
	this.shuffleDeck = function() {
		this.deck.shuffleDeck();
	};

	/**
	 * Send off packet of data updates through socket to client
	 * Data packets are passed through in the options array.
	 * 
	 * Any new data to send to client in the update process must 
	 * be added to this conditional check block.
	 * 
	 * @param  {Object} 	update_options
	 */
	this.updateClientData = function(update_options) {
		var update_json = {};
		
		if(typeof update_options['hand'] != 'undefined')
		{
			var simple_hand = getSimpleCards(this.hand, this.deck);
			update_json.hand = simple_hand;
		}

		if(typeof update_options['battlefield'] != 'undefined')
		{
			var simple_battlefield = getSimpleBattlefield(this.battlefield, this.deck);
			update_json.battlefield = simple_battlefield;
		}

		if(typeof update_options['opponent_battlefield'] != 'undefined')
		{
			var simple_opp_battlefield = update_options['opponent_battlefield'];
			update_json.opponent_battlefield = simple_opp_battlefield;
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

		if(typeof update_options['turn'] != 'undefined')
		{
			update_json.turn = update_options['turn'];
		}

		if(typeof update_options['priority'] != 'undefined')
		{
			update_json.priority = update_options['priority'];
		}

		this.socket.emit('update_data',JSON.stringify(update_json));
	};

	this.init(socket);
}

/**
 * Returns the passed in array of unique card ID's as 
 * simplified versions of the cards.
 * 
 * @param  {Array} 	cards
 * @param  {Deck} 	deck
 * 
 * @return {Array}
 */
function getSimpleCards(cards, deck)
{
	var simple_cards = [];
	for(var i = 0;i<cards.length;i++)
	{
		simple_cards.push(deck.getSimpleCardByUUID(cards[i]));
	}
	return simple_cards;
}

/**
 * Returns this player's battlefield as an 
 * array of simplified card objects.
 * 
 * @param  {Array} 	cards
 * @param  {Deck} 	deck
 * 
 * @return {Array}
 */
function getSimpleBattlefield(cards, deck)
{
	var simple_cards = [];
	//for(var i = 0;i<cards.length;i++)
	for(card_uuid in cards)
	{
		var simple_card = deck.getSimpleCardByUUID(card_uuid);
		
		var card_bf_object = cards[card_uuid];
		simple_card.tapped = card_bf_object.tapped;

		simple_cards.push(simple_card);
	}
	return simple_cards;
}

/**
 * Deplete mana from this player's mana pool used to
 * pay the cost of a card.
 * 
 * @param  {String} 	mana_cost
 * @param  {Object} 	mana_pool
 * @param  {Player} 	self
 * 
 * @return {Bool}
 */
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

/**
 * Returns whether a value is numeric.
 * 
 * @return {Boolean}
 */
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}