var Card = require('../scripts/card');

module.exports = function Deck(deckString)
{	
	this.full_cards = [];
	this.cards = [];
	this.card_hash = {};
	this.uuid_card_hash = {};
	this.size = 0;

	/**
	 * [init description]
	 * @param  {String} 	deckString
	 */
	this.init = function(deckString) {
		var deck_array = this.importDeck(deckString);
		this.buildDeck(deck_array);
	};

	/**
	 * [importDeck description]
	 * @param  {String} 	deckString
	 * @return {Array}
	 */
	this.importDeck = function(deckString) {
		var deck_array = deckString.split('\n');
		var formatted_deck = {};
		for(var i = 0;i<deck_array.length;i++)
		{
			//Main Deck
			if(deck_array[i].indexOf('SB: ') == -1)
			{
				var j = deck_array[i].indexOf(' ');
				var deck_line_array = [deck_array[i].slice(0,j), deck_array[i].slice(j+1)];
				if(deck_line_array[0] != '')
				{
					formatted_deck[deck_line_array[1]] = parseInt(deck_line_array[0]);
				}
			}
			//Sideboard
			else
			{
				//TODO: Add Sideboard parsing - very low priority
			}
		}
		return formatted_deck;
	};

	/**
	 * [buildDeck description]
	 * 
	 * card_index is generated, and then hashed against the full card object in card_hash
	 * card_uuid is generated for each unique card in the deck, and then hashed against card_index in uuid_card_hash
	 * full_cards is pushed to as a static array which can be used to reverse lookup
	 * cards is the library active in the current game
	 * 
	 * @param  Array 	deckArray
	 */
	this.buildDeck = function(deckArray) {
		var card_index = 0;
		for(card_name in deckArray)
		{
			var num_copies = deckArray[card_name];
			var card_data = new Card(card_name);
			this.card_hash[card_index] = card_data;
			for(var i = 0;i<num_copies;i++)
			{
				var card_uuid = generateUUID();
				this.uuid_card_hash[card_uuid] = card_index;
				this.full_cards.push(card_uuid);
				this.cards.push(card_uuid);
			}
			card_index++;
		}
		this.size = this.cards.length;
	};

	/**
	 * [getCount description]
	 * @return {Int}
	 */
	this.getCount = function() {
		return this.cards.length;
	}

	/**
	 * [getCards description]
	 * @return {Array}
	 */
	this.getCards = function() {
		var result_deck = [];
		for(card in this.cards)
		{
			result_deck.push(this.card_hash[this.cards[card]]);
		}
		return result_deck;
	};

	/**
	 * [getSimpleDeck description]
	 * @return {Array}
	 */
	this.getSimpleDeck = function() {
		var result_deck = [];
		for(card in this.cards)
		{
			var simple_card = this.getSimpleCardByUUID(this.cards[card]);

			result_deck.push(simple_card);
		}
		return result_deck;
	};

	/**
	 * [getCardByUUID description]
	 * @param  {String} 	hash_id
	 * @return {Card}
	 */
	this.getCardByUUID = function(hash_id) {
		return this.card_hash[this.uuid_card_hash[hash_id]];
	};

	/**
	 * [getSimpleCardByUUID description]
	 * @param  {String} 	hash_id
	 * @return {Object}
	 */
	this.getSimpleCardByUUID = function(hash_id) {
		var full_card = this.card_hash[this.uuid_card_hash[hash_id]];
		var simple_card = {};

		simple_card.name = full_card.name;
		simple_card.imageName = full_card.imageName;
		simple_card.uuid = hash_id;

		return simple_card;
	};

	/**
	 * [shuffleDeck description]
	 */
	this.shuffleDeck = function() {
		this.cards = shuffle(this.cards);
	};

	/**
	 * [drawCard description]
	 * @return {String}
	 */
	this.drawCard = function() {
		var card = this.cards.pop();
		return card;
	};

	/**
	 * [shuffleCardsIn description]
	 * @param  {Array} 	cards_array
	 */
	this.shuffleCardsIn = function(cards_array) {
		this.cards = this.cards.concat(cards_array);
		this.shuffleDeck();
	};

	this.init(deckString);
}

/**
 * [generateUUID description]
 * @return {String}
 */
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

/**
 * Shuffle by Google
 * @param  {Array} 	o
 * @return {Array}
 */
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
