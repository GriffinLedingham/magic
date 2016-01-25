module.exports =
{
  cast: function(game, card_uuid){
    game.player_one.discardCastCard(card_uuid, game);
    game.player_one.drawCard();

    //TODO: Scry 2.. fuuuuuuuuuck.
  }
}