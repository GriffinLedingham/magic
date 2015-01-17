var player_hand = [];
var player_graveyard = [];
var player_battlefield = [];

var opponent_battlefield = [];

var user_id;
var turn_user_id;
var priority_user_id;

var socket;

function init() {
    socket = io.connect('http://localhost:3000');

    setUpBindings();

    socket.on('set_user_id', function(uid) {
        user_id = uid;
        console.log(user_id);
    });

    socket.on('update_data', function(update_data){
    	var decoded_data = JSON.parse(update_data);

    	if(typeof decoded_data.hand != 'undefined')
    	{
    		updateHand(decoded_data.hand);
    	}

    	if(typeof decoded_data.graveyard != 'undefined')
    	{
    		updateGraveyard(decoded_data.graveyard);
    	}

    	if(typeof decoded_data.library != 'undefined')
    	{
    		updateLibrary(decoded_data.library);
    	}

    	if(typeof decoded_data.mana != 'undefined')
    	{
    		updateMana(decoded_data.mana);
    	}

    	if(typeof decoded_data.battlefield != 'undefined')
    	{
    		updateBattlefield(decoded_data.battlefield);
    	}

        if(typeof decoded_data.opponent_battlefield != 'undefined')
        {
            updateOpponentBattlefield(decoded_data.opponent_battlefield);
        }

        if(typeof decoded_data.turn != 'undefined')
        {
            updateTurn(decoded_data.turn);
        }

        if(typeof decoded_data.priority != 'undefined')
        {
            updatePriority(decoded_data.priority);
        }
    });

    socket.emit('get_deck');
}

function updatePriority(priority) {
    priority_user_id = priority;
    if(priority_user_id != user_id)
    {
        $('#hand_cards').css('opacity', 0.2);
    }
    else
    {
        $('#hand_cards').css('opacity', 1);   
    }
}

function updateTurn(turn_uid) {
    turn_user_id = turn_uid;
    if(turn_user_id == user_id)
    {
        $('#end_turn_button').css('display','block');
    }
    else
    {
        $('#end_turn_button').css('display','none');   
    }
}

function updateMana(mana_pool) {
	$('#player_white_mana').text(mana_pool.white);
	$('#player_blue_mana').text(mana_pool.blue);
	$('#player_black_mana').text(mana_pool.black);
	$('#player_red_mana').text(mana_pool.red);
	$('#player_green_mana').text(mana_pool.green);
}

function updateBattlefield(battlefield) {
	player_battlefield = battlefield;
	$('#battlefield_cards').html('');
	for(card in battlefield)
    {
        var simple_card = battlefield[card];
        var tapped_class = '';
        if(simple_card.tapped == true)
        {
            tapped_class = 'tapped';
        }
    	$('#battlefield_cards').append('<div class="player-battlefield-card '+tapped_class+'" data-uuid="'+simple_card.uuid+'" style="display:inline-block;transition: 0.3s;"><img style="height: 100px;" src="http://mtgimage.com/card/' + encodeURIComponent(simple_card.imageName) + '.jpg" /></div>');
    }
}

function updateOpponentBattlefield(battlefield) {
    opponent_battlefield = battlefield;
    $('#opponent_battlefield_cards').html('');
    for(card in battlefield)
    {
        var simple_card = battlefield[card];
        var tapped_class = '';
        if(simple_card.tapped == true)
        {
            tapped_class = 'tapped';
        }
        $('#opponent_battlefield_cards').append('<div class="opponent-battlefield-card '+tapped_class+'" data-uuid="'+simple_card.uuid+'" style="display:inline-block;transition: 0.3s;"><img style="height: 100px;" src="http://mtgimage.com/card/' + encodeURIComponent(simple_card.imageName) + '.jpg" /></div>');
    }
}

function updateHand(hand) {
	player_hand = hand;
	$('#hand_cards').html('');
	for(card in hand)
    {
    	$('#hand_cards').append('<div class="player-hand-card" data-uuid="'+hand[card].uuid+'" style="display:inline-block;"><img style="height: 100px;" src="http://mtgimage.com/card/' + encodeURIComponent(hand[card].imageName) + '.jpg" /></div>');
    }
}

function updateGraveyard(graveyard) {
	player_graveyard = graveyard;
	$('#graveyard_cards').html('');
	for(card in graveyard)
    {
    	$('#graveyard_cards').append('<div data-uuid="'+graveyard[card].uuid+'" style="display:inline-block;"><img style="height: 100px;" src="http://mtgimage.com/card/' + encodeURIComponent(graveyard[card].imageName) + '.jpg" /></div>');
    }
    $('#graveyard_top_card').html('<div data-uuid="'+graveyard[graveyard.length-1].uuid+'" style="display:inline-block;"><img style="height: 100px;" src="http://mtgimage.com/card/' + encodeURIComponent(graveyard[graveyard.length-1].imageName) + '.jpg" /></div>')
    $('#graveyard_count').text(graveyard.length);
}

function updateLibrary(count) {
	$('#deck_count').text(count);
}

function setUpBindings() {
	$('#battlefield_cards').on('click', '.player-battlefield-card', function(e) {
		if($(e.currentTarget).hasClass('tapped'))
		{
			$(e.currentTarget).removeClass('tapped');
            socket.emit('untap_card', $(e.currentTarget).data('uuid'));
		}
		else
		{
			$(e.currentTarget).addClass('tapped');
            socket.emit('tap_card', $(e.currentTarget).data('uuid'));
		}
	});

	$(document).on('click', '.player-hand-card', function(e) {
        if(priority_user_id == user_id)
        {
		  var card_uuid = $(e.currentTarget).data('uuid');
		  socket.emit('play_card', card_uuid);
        }
	});

    $('#end_turn_button').click(function(){
        socket.emit('end_turn');
    });

	$('#draw_button').click(function(){
    	socket.emit('draw_card');
    });

    $('#player_deck').click(function(){
    	socket.emit('draw_card');
    });

    $('#shuffle_hand_button').click(function(){
    	socket.emit('shuffle_hand_to_deck');
    });

    $('#discard_hand_button').click(function(){
    	socket.emit('discard_hand');
    });

    $('#show_graveyard_button').click(function(){
    	$('#player_hand').css('display','none');
    	$('#player_graveyard').css('display','block');
    });

    $('#player_graveyard_single').click(function(){
    	$('#player_hand').css('display','none');
    	$('#player_graveyard').css('display','block');
    });

    $('#show_hand_button').click(function(){
    	$('#player_graveyard').css('display','none');
    	$('#player_hand').css('display','block');
    });
}