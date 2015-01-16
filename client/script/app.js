function init() {
    socket = io.connect('http://localhost:3000');

    socket.on('display_deck',function(deck){
        var deck = JSON.parse(deck);
        for(card in deck.deck)
        {
        	$('#deck_area').append('<img style="height: 200px;" src="http://mtgimage.com/card/' + encodeURIComponent(deck['deck'][card].imageName) + '.jpg" />');
        }
    });

    socket.on('update_data', function(hand){
    	var hand_json = JSON.parse(hand);
    	var player_hand = hand_json.hand;
    	$('#player_hand').html('');
    	for(card in player_hand)
        {
        	$('#player_hand').append('<img style="height: 200px;" src="http://mtgimage.com/card/' + encodeURIComponent(player_hand[card].imageName) + '.jpg" />');
        }
    });

    $('#draw_button').click(function(){
    	socket.emit('draw_card');
    });

    $('#shuffle_hand_button').click(function(){
    	socket.emit('shuffle_hand_to_deck');
    });

    socket.emit('get_deck');
    console.log('Initialized');
}