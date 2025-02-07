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
	this.health = 20;

	this.statistics = {

	};

	this.mana_pool = {'white':0,'blue':0,'black':0,'red':0,'green':0,'colorless':0,'generic':0};

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
	 * Discard non-permanent being cast to field.
	 *
	 * @param  {String} 	card_uuid
	 * @param  {Object} 	game
	 */
	this.discardCastCard = function(card_uuid, game) {
		if(typeof this.battlefield[card_uuid] != 'undefined')
		{
			var card_to_discard = this.battlefield[card_uuid];
			this.graveyard.push(card_uuid);
			delete this.battlefield[card_uuid];
			this.updateClientData({'battlefield': true, 'mana': true, 'hand': true, 'library':true, 'graveyard':true, 'phase': game.current_turn_data.phase, 'health': game.player_one.health});
		}
	};

	/**
	 * Discard random card from player hand.
	 *
	 * @param  {Object} 	game
	 */
	this.discardRandomCard = function(game) {
		var index = Math.floor(Math.random()*this.hand.length);
		var card_to_discard = this.hand[index];
		this.graveyard.push(card_to_discard);
		this.hand.splice(index,1);
		this.updateClientData({'battlefield': true, 'mana': true, 'hand': true, 'library':true, 'graveyard':true, 'phase': game.current_turn_data.phase, 'health': game.player_one.health});
	};

	/**
	 * Place top card of library into graveyard
	 *
	 */
	this.millTopCard = function() {
		var card_uuid = this.deck.drawCard();
		this.graveyard.push(card_uuid);
	};

	/**
	 * Place top cards of library into graveyard
	 *
	 * @param {Integer} num
	 */
	this.millTopCards = function(num) {
		for(var i = 0;i<num;i++)
		{
			this.millTopCard();
		}
	};

	/**
	 * Tap target card passed through by card unique id.
	 *
	 * @param  {String} 	card_uuid
	 */
	this.tapCard = function(data, game) {
		var card_uuid = data.uuid;
		if(typeof this.battlefield[card_uuid] != 'undefined')
		{
			var card_to_tap = this.battlefield[card_uuid];
			if(typeof card_to_tap['sick'] == 'undefined' || card_to_tap['sick'] == false)
			{
				this.deck.getCardByUUID(card_uuid).tap(game);
				card_to_tap.tapped = true;
				this.battlefield[card_uuid] = card_to_tap;
			}
		}
	};

	/**
	 * Tap target card passed through by card unique id, with option
	 *
	 * @param  {String} 	card_uuid
	 * @param  {Integer} 	option
	 * @param  {Object} 	game
	 */
	this.tapCardOption = function(card_uuid, option, game) {
		if(typeof this.battlefield[card_uuid] != 'undefined')
		{
			var card_to_tap = this.battlefield[card_uuid];
			if(typeof card_to_tap['sick'] == 'undefined' || card_to_tap['sick'] == false)
			{
				this.deck.getCardByUUID(card_uuid).tapOption(game, option);
				card_to_tap.tapped = true;
				this.battlefield[card_uuid] = card_to_tap;
			}
		}
	};

	/**
	 * Tap target card by effect other than user request.
	 *
	 * @param  {String} 	card_uuid
	 * @param  {Object} 	game
	 */
	this.forceTapCard = function(card_uuid, game) {
		if(typeof this.battlefield[card_uuid] != 'undefined')
		{
			var card_to_tap = this.battlefield[card_uuid];
			card_to_tap.tapped = true;
			this.battlefield[card_uuid] = card_to_tap;
			this.updateClientData({'battlefield': true, 'mana': true, 'hand': true, 'library':true, 'graveyard':true, 'phase': game.current_turn_data.phase, 'health': game.player_one.health});
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
	this.playCard = function(card_uuid, game) {
		if(this.hand.indexOf(card_uuid) != -1)
		{
			var card_to_cast = this.deck.getCardByUUID(card_uuid);
			if(card_to_cast.canCastCard(game))
			{
				if(spendManaForCard(card_to_cast.manaCost, this.mana_pool, this))
				{
					this.battlefield[card_uuid] = {'tapped':false,'damage':0, 'sick': card_to_cast.doesGetSick()};
					var index = this.hand.indexOf(card_uuid);
					this.hand.splice(index, 1);
					card_to_cast.cast(game, card_uuid);
				}
			}
		}
	};

	/**
	 * Play a card from the player's hand to the battlefield
	 * with alt mana cost
	 *
	 * @param  {String} 	card_uuid
	 */
	this.playCardAltCost = function(card_uuid, option, game) {
		if(this.hand.indexOf(card_uuid) != -1)
		{
			var card_to_cast = this.deck.getCardByUUID(card_uuid);
			if(card_to_cast.canCastCard(game))
			{
				var uses_mana = card_to_cast.optionUsesMana(option);
				if(uses_mana)
				{
					if(spendManaForCard(card_to_cast.manaCost, this.mana_pool, this))
					{
						this.battlefield[card_uuid] = {'tapped':false,'damage':0, 'sick': card_to_cast.doesGetSick()};
						var index = this.hand.indexOf(card_uuid);
						this.hand.splice(index, 1);
						card_to_cast.cast(game, card_uuid);
					}
				}
				else
				{
					if(card_to_cast.payAltCost(option, game))
					{
						this.battlefield[card_uuid] = {'tapped':false,'damage':0, 'sick': card_to_cast.doesGetSick()};
						var index = this.hand.indexOf(card_uuid);
						this.hand.splice(index, 1);
						card_to_cast.cast(game, card_uuid);
					}
				}
			}
		}
	};

	/**
	 * Play a card from the player's hand to the battlefield with option
	 * and spend corresponding mana to do so.
	 *
	 * @param  {String} 	card_uuid
	 * @param  {String} 	option
	 */
	this.playCardOption = function(card_uuid, option, game) {
		if(this.hand.indexOf(card_uuid) != -1)
		{
			var card_to_cast = this.deck.getCardByUUID(card_uuid);
			if(card_to_cast.canCastCard(game))
			{
				if(spendManaForCard(card_to_cast.manaCost, this.mana_pool, this))
				{
					this.battlefield[card_uuid] = {'tapped':false,'damage':0, 'sick': card_to_cast.doesGetSick()};
					var index = this.hand.indexOf(card_uuid);
					this.hand.splice(index, 1);
					card_to_cast.castOption(game, card_uuid, option);
				}
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
	 * Subtract from player's health.
	 *
	 * @param {Integer} num
	 */
	this.subtractHealth = function(num) {
		this.health = this.health - num;
	};

	/**
	 * Add to player's health.
	 *
	 * @param {Integer} num
	 */
	this.addHealth = function(num) {
		this.health = this.health + num;
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

		if(typeof update_options['phase'] != 'undefined')
		{
			update_json.phase = update_options['phase'];
		}

		if(typeof update_options['health'] != 'undefined')
		{
			update_json.health = this.health;
		}

		this.socket.emit('update_data',JSON.stringify(update_json));
	};

	/**
	 * Shuffle this player's deck.
	 */
	this.getManaPool = function() {
		return this.mana_pool;
	};

	/**
	 * Empty player mana pool
	 */
	this.emptyManaPool = function() {
		this.mana_pool = {'white':0,'blue':0,'black':0,'red':0,'green':0,'colorless':0,'generic':0};
	};

	/**
	 * Add mana to player mana pool
	 *
	 * @param {String} 	color
	 * @param {Integer} num
	 */
	this.addMana = function(color, num) {
		this.mana_pool[color] = this.mana_pool[color] + num;
	};

	/**
	 * Remove summoning sickness from all player cards
	 */
	this.cureAllSummoningSick = function() {
		for(card_uuid in this.battlefield)
		{
			var card_to_untap = this.battlefield[card_uuid];
			card_to_untap.sick = false;
			this.battlefield[card_uuid] = card_to_untap;
		}
	};

	/**
	 * Convert one player mana to generic mana
	 *
	 * @param {String} color
	 */
	this.convertManaToGeneric = function(color) {
		if(this.mana_pool[color] > 0)
		{
			this.mana_pool[color] = this.mana_pool[color] - 1;
			this.mana_pool['generic'] = this.mana_pool['generic'] + 1;
		}
	};

	/**
	 * Set player has played land for the turn
	 *
	 * @param  {Object} game
	 */
	this.didPlayLand = function(game) {
		game.didPlayLand();
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
		mana_cost_object.generic = parseInt(mana_cost_array[0]);
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