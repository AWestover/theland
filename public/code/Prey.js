// the animals have to eat this to stay alive. The predators can eat this to fufill their food quota
class Prey extends Animal
{
  constructor(animal_traits)
  {
    super(animal_traits);

    this.name = animal_traits["name"] || "pizza";
    this.type = "preys";
    this.help = animal_traits["help"] || {"health": 1, "hunger": -0.5};
    this.dims = [30,30];
  }

  handleCollide(otherAnimal)
  {
    if (this.health <=0 || otherAnimal.health <=0)
    {
      return false;
    }

    if (otherAnimal.type != "preys")
    {
      let deltaH = otherAnimal.interact();
      this.health += deltaH;
    }

    // you were alive, now you are dead
    if (this.health <= 0)
    {
      let data = {
        "world": user.world,
        "animal": otherAnimal,
        "type": "preys"
      }
      socket.emit('deathAlert', data);
    }

    return true;
  }

  interact()
  {
    return this.help;
  }

}
