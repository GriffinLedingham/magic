var fs = require('fs');
var CardDatabase = require('../data/cards.json');
var SetDatabase = require('../data/sets.json');

module.exports = function Card(name)
{
	//functions specific to this card/type
	this.actions;

	this.initialized = false;

	/**
	 * [description]
	 * Card properties all being empty initialized
	 */
  this.name = "";
  this.manaCost = "";
  this.cmc = 0;
  this.colors = [];
  this.type = "";
  this.supertypes = [];
  this.types = [];
  this.subtypes = [];
  this.rarity = "";
  this.text = "";
  this.flavor = "";
  this.artist = "";
  this.number = "";
  this.power = "";
  this.toughness = "";
  this.layout = "";
  this.multiverseid = 0;
  this.set = "";
  this.imageName = "";

	this.init = function(name){
		this.name = name;

		//Set card properties, if it exists in database
		if(initCardProperties(name, this))
		{
			//Set card type, and type specific functions
			if(initType(this.types[this.types.length-1], this))
			{
				//Set card specific logic, if it exists
				initCardScript(name, this);
				this.initialized = true;
			}
		}
	};

    this.getName = function(){
    	return this.name;
    };

    this.getCMC = function(){
    	return this.cmc;
    }

    this.init(name);
}

function initType(type, self)
{
	var result = false;
	if(fs.existsSync('./scripts/card_types/' + type.toLowerCase() + '.js'))
	{
		var fns = require('./card_types/' + type.toLowerCase() + '.js');
		for(fn_name in fns)
		{
			self[fn_name] = fns[fn_name];
		}
		result = true;
	}
	return result;
}

function initCardScript(name, self)
{
	var result = false;
	var escapedName = name.toLowerCase().replace(/ /g, '_');
	if(fs.existsSync('./scripts/card_scripts/' + escapedName[0].toUpperCase() + '/' + escapedName + '.js'))
	{
		var fns = require('./card_scripts/' + escapedName[0].toUpperCase() + '/' + escapedName + '.js');
		for(fn_name in fns)
		{
			self[fn_name] = fns[fn_name];
		}
		result = true;
	}
	return result;
}

function initCardProperties(name, self)
{
	var result = false;
	for(card in CardDatabase)
	{
		if(CardDatabase[card].name.toLowerCase() == name.toLowerCase())
		{
			var card_object = CardDatabase[card];
      var printing = 1;
      var full_card = null;
      while(true) {
  			var card_set = card_object.printings[card_object.printings.length-printing];

        var set_json = JSON.parse(fs.readFileSync('./data/json/'+card_set+'.json', 'utf8'));
        var full_cards = set_json.cards.filter(function( obj ) {
          return obj.name.toLowerCase() == name.toLowerCase();
        });
        full_card = full_cards[0];
        if(typeof full_card.multiverseid != 'undefined'){break;}
        printing++;
      }
      for(prop in full_card)
      {
        if(typeof self[prop] != 'undefined')
        {
          self[prop] = full_card[prop];
        }
      }

			result = true;
		}
	}
	return result;
}