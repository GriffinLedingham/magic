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
    initTemplates();

    socket.on('set_user_id', function(uid) {
        user_id = uid;
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

        if(typeof decoded_data.phase != 'undefined')
        {
            console.log(decoded_data.phase);
        }

        if(typeof decoded_data.health != 'undefined')
        {
            updatePlayerHealth(decoded_data.health);
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
    $('#player_colorless_mana').text(mana_pool.colorless);
	$('#player_generic_mana').text(mana_pool.generic);
}

function updatePlayerHealth(health) {
    $('#player_health').text(health);
}

function updateBattlefield(battlefield) {
	player_battlefield = battlefield;
    $('#nonland_perm').html('');
	$('#land_perm').html('');
	for(card in battlefield)
    {
        var simple_card = battlefield[card];
        var tapped_class = '';
        if(simple_card.tapped == true)
        {
            tapped_class = 'tapped';
        }

        if(simple_card.type.indexOf('Land') != -1)
        {
    	   $('#land_perm').append(loadTemplate('battlefieldCardTemplate', {tapped_class: tapped_class, simple_card: simple_card}));
        }
        else
        {
            $('#nonland_perm').append(loadTemplate('battlefieldCardTemplate', {tapped_class: tapped_class, simple_card: simple_card}));
        }
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
        $('#opponent_battlefield_cards').append(loadTemplate('battlefieldCardTemplate', {tapped_class: tapped_class, simple_card: simple_card}));
    }
}

function updateHand(hand) {
	player_hand = hand;
	$('#hand_cards').html('');
    var count = 0;
    var num_cards = hand.length;
    //var start = 0 - Math.floor(num_cards/2) - 2;
    var start = 0 - Math.floor(num_cards/2);
    var last = 20;
    for(card in hand)
    {
        //var bottom_val = (Math.min((last-((count-1)*(num_cards/2-5) )),20));
        var bottom_val = (107 * (count - 1)) - (num_cards / 2) * 107;
        if(count == 0) bottom_val = bottom_val - 15;
    	$('#hand_cards').append(loadTemplate('handCardTemplate', {hand_card: hand[card], rotation: (((90 / num_cards) * (count - 1)) - 45)/*(start*10) + (count*10)*/, left: bottom_val}));
        last = Math.min((last-((count-1)*(num_cards/2-5) )),20);
        count++;
    }
}

function updateGraveyard(graveyard) {
    if(graveyard.length == 0) return;
	player_graveyard = graveyard;
	$('#graveyard_cards').html('');
	for(card in graveyard)
    {
    	$('#graveyard_cards').append(loadTemplate('battlefieldCardTemplate', {simple_card: graveyard[card]}));
    }
    $('#graveyard_top_card').html(loadTemplate('topGraveyardCardTemplate', {graveyard_card: graveyard[graveyard.length-1]}))
    //$('#graveyard_count').text(graveyard.length);
}

function updateLibrary(count) {
	//$('#deck_count').text(count);
}

function optionTapMenu(card, e) {
    var height = $('#decisionMenu').height();
    var width = $('#decisionMenu').width();

    leftVal=e.pageX-(width/2)+"px";
    topVal=e.pageY-(height/2)+"px";

    var template = loadTemplate('decisionTapMenuTemplate', card);
    $('body').prepend(template);

    $('#decisionTapMenu').css({left:leftVal,top:topVal}).show();
}

function optionCastMenu(card, e) {
    var height = $('#decisionMenu').height();
    var width = $('#decisionMenu').width();

    leftVal=e.pageX-(width/2)+"px";
    topVal=e.pageY-(height/2)+"px";

    var template = loadTemplate('decisionCastMenuTemplate', card);
    $('body').prepend(template);

    $('#decisionCastMenu').css({left:leftVal,top:topVal}).show();
}

function altCostCastMenu(card, e) {
    var height = $('#decisionMenu').height();
    var width = $('#decisionMenu').width();

    leftVal=e.pageX-(width/2)+"px";
    topVal=e.pageY-(height/2)+"px";

    var template = loadTemplate('decisionAltCostMenuTemplate', card);
    $('body').prepend(template);

    $('#decisionAltCostMenu').css({left:leftVal,top:topVal}).show();
}

function setUpBindings() {
	$('#player_battlefield').on('click', '.player-battlefield-card', function(e) {
		if($(e.currentTarget).hasClass('tapped'))
		{

		}
		else
		{
            var uuid = $(e.currentTarget).data('uuid');
            for(card in player_battlefield)
            {
                if(player_battlefield[card].uuid == uuid)
                {
                    if(typeof player_battlefield[card]['options'] != 'undefined'
                        && typeof player_battlefield[card]['options']['tap'] != 'undefined')
                    {
                        optionTapMenu(player_battlefield[card], e);
                    }
                    else
                    {
                        socket.emit('tap_card', {uuid: $(e.currentTarget).data('uuid')});
                    }
                    break;
                }
            }
        }
    });

	$(document).on('click', '.player-hand-card', function(e) {
        if(priority_user_id == user_id)
        {
		  var card_uuid = $(e.currentTarget).data('uuid');
          for(card in player_hand)
          {
            if(player_hand[card].uuid == card_uuid)
            {
                if(typeof player_hand[card]['options'] != 'undefined'
                    && typeof player_hand[card]['options']['cast'] != 'undefined')
                {
		          optionCastMenu(player_hand[card], e);
                }
                else if(typeof player_hand[card]['options'] != 'undefined'
                    && typeof player_hand[card]['options']['cost'] != 'undefined')
                {
                  altCostCastMenu(player_hand[card], e);
                }
                else
                {
                  socket.emit('play_card', card_uuid);
                }
            }
          }
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
        if($('#player_graveyard').css('display') == 'block')
        {
           $('#player_hand').css('display','block');
           $('#player_graveyard').css('display','none');
        }
        else
        {
    	   $('#player_hand').css('display','none');
    	   $('#player_graveyard').css('display','block');
        }
    });

    $('#player_graveyard_single').click(function(){
    	if($('#player_graveyard').css('display') == 'block')
        {
           $('#player_hand').css('display','block');
           $('#player_graveyard').css('display','none');
        }
        else
        {
           $('#player_hand').css('display','none');
           $('#player_graveyard').css('display','block');
        }
    });

    $('#show_hand_button').click(function(){
    	$('#player_graveyard').css('display','none');
    	$('#player_hand').css('display','block');
    });

    $('.mana-icon').click(function(e){
        var color = $(e.currentTarget).data('color');
        if(color != 'generic')
        {
            socket.emit('convert_color_to_generic', color);
        }
    });

    $(window)[0].addEventListener('mousedown', function(e){ e.preventDefault(); }, false);

    $(window).keypress(function (e) {
      if (e.keyCode === 0 || e.keyCode === 32) {
        e.preventDefault()
        socket.emit('end_phase');
      }
    })

    $('.player-battlefield-card').bind("contextmenu", function(event) {
        event.preventDefault();
        rightClickMenu(event);
    });

    $(document).mouseup(function(e)
    {
        var container = $('#decisionTapMenu');
        if (container.has(e.target).length === 0)
        {
            $('#decisionTapMenu').remove();
        }

        container = $('#decisionCastMenu');
        if (container.has(e.target).length === 0)
        {
            $('#decisionCastMenu').remove();
        }

        container = $('#decisionAltCostMenu');
        if (container.has(e.target).length === 0)
        {
            $('#decisionAltCostMenu').remove();
        }
    });

    $(document).on('click', '.card-tap-option', function(e){
        var option = $(e.currentTarget).data('option');
        socket.emit('tap_card_option', {uuid: $('#decisionTapMenu').data('uuid'), option: option});
        $('#decisionTapMenu').remove();
    });

    $(document).on('click', '.card-cast-option', function(e){
        var option = $(e.currentTarget).data('option');
        socket.emit('play_card_option', {uuid: $('#decisionCastMenu').data('uuid'), option: option});
        $('#decisionCastMenu').remove();
    });

    $(document).on('click', '.card-cost-option', function(e){
        var option = $(e.currentTarget).data('option');
        socket.emit('play_card_alt_cost', {uuid: $('#decisionAltCostMenu').data('uuid'), option: option});
        $('#decisionAltCostMenu').remove();
    });
}

var initTemplates = function(){
  $.ajax({
    url: './templates/magic.html',
    type: 'GET',
    async: false,
    complete: function(response) {
      $('#templates').append(response.responseText);
    }
  });
};

var loadTemplate = function(key, vars){
    if(typeof vars == 'undefined') { vars = {}; }
    var temp = Handlebars.compile($('#'+key).html());
    return temp(vars);
};