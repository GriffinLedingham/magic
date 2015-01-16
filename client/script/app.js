var player_hand = [];
var player_graveyard = [];
var player_battlefield = [];

function init() {
    socket = io.connect('http://localhost:3000');

    setUpBindings();

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
    });

    socket.emit('get_deck');
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
    	$('#battlefield_cards').append('<div class="player-battlefield-card" data-uuid="'+battlefield[card].uuid+'" style="display:inline-block;transition: 0.3s;"><img style="height: 200px;" src="http://mtgimage.com/card/' + encodeURIComponent(battlefield[card].imageName) + '.jpg" /></div>');
    }
}

function updateHand(hand) {
	player_hand = hand;
	$('#hand_cards').html('');
	for(card in hand)
    {
    	$('#hand_cards').append('<div class="player-hand-card" data-uuid="'+hand[card].uuid+'" style="display:inline-block;"><img style="height: 200px;" src="http://mtgimage.com/card/' + encodeURIComponent(hand[card].imageName) + '.jpg" /></div>');
    }
}

function updateGraveyard(graveyard) {
	player_graveyard = graveyard;
	$('#graveyard_cards').html('');
	for(card in graveyard)
    {
    	$('#graveyard_cards').append('<div data-uuid="'+graveyard[card].uuid+'" style="display:inline-block;"><img style="height: 200px;" src="http://mtgimage.com/card/' + encodeURIComponent(graveyard[card].imageName) + '.jpg" /></div>');
    }
    $('#graveyard_top_card').html('<div data-uuid="'+graveyard[graveyard.length-1].uuid+'" style="display:inline-block;"><img style="height: 200px;" src="http://mtgimage.com/card/' + encodeURIComponent(graveyard[graveyard.length-1].imageName) + '.jpg" /></div>')
    $('#graveyard_count').text(graveyard.length);
}

function updateLibrary(count) {
	$('#deck_count').text(count);
}

function setUpBindings() {
	$('#battlefield_cards').on('click', '.player-battlefield-card', function(e) {
		if($(e.currentTarget).css('transform') == 'matrix(6.12323399573677e-17, 1, -1, 6.12323399573677e-17, 0, 0)')
		{
			$(e.currentTarget).css('transform','rotate(0deg)');
		}
		else
		{
			$(e.currentTarget).css('transform','rotate(90deg)');
		}
	});

	$(document).on('click', '.player-hand-card', function(e) {
		var card_uuid = $(e.currentTarget).data('uuid');
		socket.emit('play_card', card_uuid);
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