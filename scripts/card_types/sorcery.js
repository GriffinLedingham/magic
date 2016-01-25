var Components = require('../components.js');

module.exports =
{
	cast: Components.castToStack,
  canCastCard: function(game) {
    if(game.current_turn_data.phase == 'main1'
      || game.current_turn_data.phase == 'main2' )
    {
      return true;
    }
    else
    {
      return false;
    }
  },
  doesGetSick: function() {
    return false;
  }
}