var fs = require('fs');
var CardDatabase = require('../data/cards.json');
var SetDatabase = require('../data/sets.json');

module.exports = function Card(name)
{
	//functions specific to this card/type
	this.actions;

	this.initialized = false;

	//name 			- String: 	"Arbor Elf"
	this.name = "";
	//manaCost 		- String: 	"{G}""
    this.manaCost = "";
    //cmc 			- Int: 		1
	this.cmc = 0;
	//colors 		- Array: 	["Green"]
    this.colors = [];
    //type 			- String: 	"Creature - Elf Druid"
    this.type = "";
    //supertypes	- Array: 	[]
    this.supertypes = [];
    //types 		- Array: 	["Creature"]
	this.types = [];
	//subtypes		- Array: 	["Elf", "Druid"]
    this.subtypes = [];
    //rarity		- String	"Common"
    this.rarity = "";
    //text			- String 	"" NOTE: This is the creature's effect which will be handled in a per card script
    this.text = "";
    //flavor		- String	"The forest will surround you with its life if you are still and calm."
    this.flavor = "";
    //artist		- String 	"rk post"
    this.artist = "";
    //number		- String	"160"
    this.number = "";
    //power			- String 	"1"
    this.power = "";
    //toughness		- String	"1"
    this.toughness = "";
    //layout		- String 	"normal"
    this.layout = "";
    //multiverseid	- Int 		249840
    this.multiverseid = 0;
    //set 			- String 	"M12"
    this.set = "";
    //imageName		- String	"arbor elf"
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
	if(fs.existsSync('./scripts/card_scripts/' + escapedName + '.js'))
	{
		var fns = require('./card_scripts/' + escapedName + '.js');
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
			for(prop in card_object)
			{
				if(typeof self[prop] != 'undefined')
				{
					self[prop] = card_object[prop];
				}
			}

			var card_set = card_object.printings[card_object.printings.length-1];

			for(set in SetDatabase)
			{
				if(SetDatabase[set].name == card_set)
				{
					self['set'] = SetDatabase[set].code;
					break;
				}
			}

			result = true;
		}
	}	
	return result;
}