var Card = require('../scripts/card');

module.exports = function Deck(deckString)
{	
	this.full_cards = [];
	this.cards = [];
	this.card_hash = {};
	this.uuid_card_hash = {};
	this.size = 0;

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

	this.getCount = function() {
		return this.cards.length;
	}

	this.getCards = function() {
		var result_deck = [];
		for(card in this.cards)
		{
			result_deck.push(this.card_hash[this.cards[card]]);
		}
		return result_deck;
	};

	this.getSimpleDeck = function() {
		var result_deck = [];
		for(card in this.cards)
		{
			var simple_card = this.getSimpleCardByUUID(this.cards[card]);

			result_deck.push(simple_card);
		}
		return result_deck;
	};

	this.getCardByUUID = function(hash_id) {
		return this.card_hash[this.uuid_card_hash[hash_id]];
	};

	this.getSimpleCardByUUID = function(hash_id) {
		var full_card = this.card_hash[this.uuid_card_hash[hash_id]];
		var simple_card = {};

		simple_card.name = full_card.name;
		simple_card.imageName = full_card.imageName;
		simple_card.uuid = hash_id;

		return simple_card;
	};

	this.shuffleDeck = function() {
		this.cards = shuffle(this.cards);
	};

	this.drawCard = function() {
		var card = this.cards.pop();
		return card;
	};

	this.shuffleCardsIn = function(cards_array) {
		this.cards = this.cards.concat(cards_array);
		this.shuffleDeck();
	};

	var deck_array = this.importDeck(deckString);
	this.buildDeck(deck_array);
}

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

//Shuffle by Google
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
