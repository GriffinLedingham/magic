module.exports =
{
  tap: function(game){

  },
  tapOption: function(game, option){
    var color = 'blue';
    var num = 1;
    if(option === 0)
    {
      color = 'red';
      game.player_one.subtractHealth(1);
    }
    else if(option === 3)
    {
      color = 'colorless';
    }
    else
    {
      game.player_one.subtractHealth(1);
    }

    game.player_one.addMana(color, num);
  },
  getCardChoices: function() {
    return {
      'tap':[
        {option: 3, text: 'Add 1 to your mana pool.'},
        {option: 0, text: 'Add R to your mana pool. Shivan Reef deals 1 damage to you.'},
        {option: 1, text: 'Add U to your mana pool. Shivan Reef deals 1 damage to you.'}
      ]
    };
  }
}