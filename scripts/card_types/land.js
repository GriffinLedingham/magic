var Components = require('../components.js');

module.exports =
{
	cast: function(game){
    game.player_one.didPlayLand(game);
  },
  tap: function(){},
  canCastCard: function(game) {
    var result = true;
    if(game.current_turn_data.played_land
      || (game.current_turn_data.phase != 'main1' && game.current_turn_data.phase != 'main2')
    )
    {
      result = false;
    }
    else
    {
      result = true;
    }
    return result;
  },
  doesGetSick: function() {
    return false;
  }
}