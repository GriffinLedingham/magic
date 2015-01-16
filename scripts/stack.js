module.exports = function Stack(player_one_socket, player_two_socket)
{
	this.player_one_socket = player_one_socket;
	this.player_one_id = player_one_socket.id;
	
	this.player_two_socket = player_two_socket;
	this.player_two_id = player_two_socket.id;
	
	this.triggers = [];

	//Push simplified cards onto stack (name, image, resolve function, uuid)
	this.push = function(stack_card) {
		this.triggers.push(stack_card);
	};

	this.resolve = function() {
		var card_to_resolve = this.triggers.pop();
		card_to_resolve.resolve();
		this.updateClientData();
	};

	this.updateClientData = function() {
		//Emit to both players that stack has changed
	};

}

//Stack will emit data to player letting both players know who's spell is currently going to resolve
//If player on client ID != spell to resolve ID, they will have to respond, or allow it to resolve

//Use a while loop that always tries to resolve the last element
//If a user respond, continue in the while loop, so new spell is the one trying to resolve