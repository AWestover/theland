/*
Animal class

basic ideas for all animals

movement properties etc

*/

class Animal
{
  constructor(animal_traits)
  {
    // basic stats
    this.pos = animal_traits["pos"].slice() || [0,0];
    this.vel = [0, 0];
    this.name = animal_traits["name"] || "circle";
    this.health = animal_traits["health"] || 10;

    // identification
    this.username = animal_traits["username"] || "NPC";
    this.id = animal_traits["id"] || 0;

    this.dims=[66,50];
    this.showStats = animal_traits["showStats"] || false;

    this.level = animal_traits["level"] || 1;

    this.type = "animals";
    this.image = this.getImg();
  }

  getImg()
  {
    try{
      return animal_pictures[this.name+this.level];
    }
    catch(err)
    {
      return false;
    }
  }

  move()
  {
    var th = (Math.random()-0.5)*0.9;
    if (Math.random() < 0.5) {
      th = 0;
    }
    var nx = this.vel[0]*Math.cos(th) - this.vel[1]*Math.sin(th);
    var ny = this.vel[0]*Math.sin(th) + this.vel[1]*Math.cos(th);

    this.vel = [nx, ny];
    this.addPos(this.vel); // *dt
  }

  pStats()
  {
    if (this.showStats)
    {
      fill(0,0,0);
      let ctx = "Name: "  +  this.name + "\n"
              + "Health: " + this.health + "\n"
      text(ctx, this.pos[0], this.pos[1]-this.dims[1]*0.5);
    }
  }

  show()
  {
    if (this.health>0)
    {
      this.pStats();
      fill(200, 50, 50);
      // health bar
      rect(this.pos[0], this.pos[1],5*this.health, 10);
      try
      {
        image(this.image, this.pos[0], this.pos[1], this.image.width, this.image.height);
      }
      catch(err)
      {
        ellipse(this.pos[0], this.pos[1], 10, 10);
      }
    }
    else {
      console.log("this.health=0 in an Animal... a bit sketchy");
    }
  }

  addPos(apos)
  {
    this.pos[0] += apos[0];
    this.pos[1] += apos[1];
  }

  subPos(apos)
  {
    this.pos[0] -= apos[0];
    this.pos[1] -= apos[1];
  }

  randomHeading(speed)
  {
    let thInit = Math.random()*Math.PI*2;
    return [Math.cos(thInit)*speed, Math.sin(thInit)*speed];
  }

  addVel(avel)
  {
    this.vel[0]+=avel[0];//*dt
    this.vel[1]+=avel[1];//*dt
  }

  scaleVel(k)
  {
    this.vel[0] *= k;
    this.vel[1] *= k;
  }

  velMag()
  {
    return Math.sqrt(this.vel[0]*this.vel[0]+this.vel[1]*this.vel[1]);
  }

  getBox()
  {
    return [this.pos[0], this.pos[1], this.dims[0], this.dims[1]];
  }

  shouldDie()
  {
    if (this.health <=0)
    {
      return true;
    }
    return false;
  }

}
