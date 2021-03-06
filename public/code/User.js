/*
user class
*/

class User {
  constructor(user_info)
  {
    this.name = user_info["name"];
    this.world = user_info["world"];
    this.animal_type = user_info["animal_type"];
    this.th = user_info["th"] || 0;

    // only can hold 1 of these for now
    // realistically this should not be a problem...
    this.occupations={};
    this.occupyTime = 7000; // millis

    this.pos = user_info["pos"] || [0,0]; // where are you looking

    this.stormlight = user_info["stormlight"] || 0;
    this.cost = user_info["cost"] || 100; // may be variable later
    this.protectorCost = user_info["protectorCost"] || 500;
    this.upgradeCost = user_info["upgradeCost"] || 50;
    this.feedCost = user_info["feedCost"] || 10;

    this.attractAnimals = user_info["attractAnimals"] || true;

    this.selectToggle = user_info["attractAnimals"] || true;

    for (let an in allAnimals)
    {
      if (!user_info[allAnimals[an]])
      {
        this[allAnimals[an]] = [];
      }
      else {
        this[allAnimals[an]] = user_info[allAnimals[an]];
      }
    }

    this.data_uri = "";

    this.idCt = user_info["isCt"] || 0;
    this.selectedPersonal = null;// don't need to send it over...

  }

  changePicture(sketch) {
    let data_uri = prompt("Please paste the uri for your picture that you received from face-color here");
    let newImg = sketch.loadImage(data_uri);
    if (newImg && data_uri && data_uri.length > 0) {
      this.data_uri = data_uri;
      for (let i = 0; i < this.personals.length; i++) {
        this.personals[i].image = newImg;
        this.personals[i].image.resize(this.personals[i].dims[0], this.personals[i].dims[1]);
        this.personals[i].img_uri = data_uri;
      }
    }
  }

  buyProtector(sketch)
  {
    if (this.stormlight >= this.protectorCost && this.protectors.length < maxProtectors)
    {
      this.stormlight -= this.protectorCost;
      this.addProtector({}, sketch);
    }
  }

  occupy(th)
  {
    //shouldn't be a problem... just in case
    if(this.occupations[th])
    {
      clearTimeout(this.occupations[th]);
    }

    let usr = this;
    this.occupations[th] = setTimeout(function(usr) {
      socket.emit('occupied', {"killth": th, "world": usr.world});

      // get the stormlight of the defeated user
      for (let unm in otherUsers)
      {
        if (otherUsers[unm].th == th)
        {
          usr.stormlight += otherUsers[unm].stormlight;
          $.notify("territory occupation achieved, \nrecieved " +
            otherUsers[unm].stormlight+" stormlight from User " + unm,
            {"style":"occupation"});
        }
      }

    }, this.occupyTime, usr);

  }

  cancelOccupy(th)
  {
    clearTimeout(this.occupations[th]);
    delete this.occupations[th];
  }

  getOccupySlots()
  {
    let o = {};
    for (let i in this.occupations)
    {
      o[i] = false;
    }
    return o;
  }

  toggleStatsAll()
  {
    for (let i = 0; i < this.personals.length; i++)
    {
      this.personals[i].showStats = this.selectToggle;
    }
    this.selectToggle = ! this.selectToggle;
  }

  validateSelected()
  {
    if (this.selectedPersonal == null || this.selectedPersonal.health <= 0)
    {
      return false;
    }
    else if (this.selectedPersonal.level >= max_lvls["personals"])
    {
      return false;
    }
    else {
      return true;
    }
  }

  feedHungry()
  {
    for (let i = 0; i < this.personals.length; i++)
    {
      if (this.personals[i].isHungry())
      {
        if (this.stormlight >= this.feedCost)
        {
          this.stormlight -= this.feedCost;
          this.personals[i].doFeed();
        }
      }
    }
  }

  upgradeSelected(sketch)
  {
    if (this.validateSelected())
    {
      if (this.stormlight >= this.upgradeCost)
      {
        this.stormlight -= this.upgradeCost;
        this.selectedPersonal.levelUp(sketch);
      }
    }
  }

  initAnimals(sketch)
  {
    for (let i = 0; i < 3; i++)
    {
      this.addPersonal({}, sketch);
    }
    for (let i = 0; i < 9; i++)
    {
      this.addPrey({}, sketch);
    }
    this.addPredator({}, sketch);
  }

  hideStats()
  {
    for (let i = 0; i < allAnimals.length; i++)
    {
      for (let an=0; an<this[allAnimals[i]].length; an++)
      {
        this[allAnimals[i]][an].showStats=false;
      }
    }
  }

  show(sketch, name)
  {
    for (let i in allAnimals)
    {
      for (let an in this[allAnimals[i]])
      {
        this[allAnimals[i]][an].show(sketch);
      }
    }
    sketch.noStroke();
  	sketch.fill(thColors[this.th]);
  	sketch.ellipse(-this.pos[0], -this.pos[1], 10, 10);
    if (name) {
      sketch.fill(0,0,0);
      sketch.text(name, -this.pos[0], -this.pos[1]-10);
    }
  }

  adjustAnimalLoc(pos)
  {
    return [-pos[0], -pos[1]];
  }

  update(sketch)
  {
    if (freeze){
      return false;
    }
    let results = [];
    for (let an in this.personals)
    {
      this.personals[an].sickDamage();
      if (this.personals[an].shouldDie())
      {
        this.personals.splice(an, 1);
        an -= 1;
        this.setAnimalsText();
      }
      else
      {
        if (this.attractAnimals)
        {
          this.personals[an].pushMotion(negateV(this.pos));
        }
        else {
          this.personals[an].move();
        }
        let currentResult = this.personals[an].hasOffspring();
        if (currentResult != false)
        {
          results.push(currentResult);
        }
      }
    }

    for (let i = 0; i < results.length; i++)
    {
      this.addPersonal(results[i], sketch);
    }

    let preysKilled=0;
    for (let an in this.preys)
    {
      if(this.preys[an].shouldDie())
      {
        this.preys.splice(an, 1);
        an -= 1;
        preysKilled+=1;
      }
      else {
        this.preys[an].move();
      }
    }
    for(let i=0; i < preysKilled; i++)
    {
      this.addPrey({}, sketch);
    }

    let predatorsKilled=0;
    for(let an in this.predators)
    {
      if (this.predators[an].shouldDie())
      {
        this.predators.splice(an, 1);
        an -= 1;
        predatorsKilled+=1;
      }
      else {
        this.predators[an].move();
      }
    }
    for(let i = 0; i < predatorsKilled; i++)
    {
      let respawnTime = 6000;
      let cc = this;
      setTimeout(function(){cc.addPredator();}, respawnTime);
    }

    for (let an in this.protectors)
    {
      if(this.protectors[an].shouldDie())
      {
        this.protectors.splice(an, 1);
        an -= 1;
      }
      else {
        this.protectors[an].move();
        this.protectors[an].pushMotion(territoryLocs[this.th]);
      }
    }

    this.addFrameStormlight();

    return results;
  }

  addFrameStormlight()
  {
    // later this can be variable or something
    if(Math.random() < 0.5)
    {
      if (this.attractAnimals)
      {
        this.stormlight += 1;
      }
      else {
        this.stormlight += 2;
      }
      this.setStormlightText();
    }
  }

  addPrey(data, sketch)
  {
    let nameP = randomWeightedChoice(["cake", "pizza", "chicken", "hawaiianPizza", "pie"],
      [1,1,10,1,3]);
    let newPrey = new Prey({
      "pos":randomMidish(0.99),
      "name": nameP,
      "username": this.name,
      "th": this.th,
      "id": this.idCt,
      "world": this.world
    }, sketch);
    for (let f in data)
    {
      newPrey[f] = data[f];
    }
    this.idCt+=1;
    this.preys.push(newPrey);
    this.preys[this.preys.length-1].subPos([newPrey.dims[0]/2, newPrey.dims[1]/2]);
  }

  addProtector(data, sketch)
  {
    let newProtector = new Protector({
      "pos": territoryLocs[this.th],
      "name": "balrog",
      "username": this.name,
      "th": this.th,
      "id": this.idCt,
      "world": this.world
    }, sketch);
    for (let f in data)
    {
      newProtector[f] = data[f];
    }
    this.idCt += 1;
    this.protectors.push(newProtector);
    this.protectors[this.protectors.length-1].subPos([newProtector.dims[0]/2, newProtector.dims[1]/2]);
  }

  addPredator(data, sketch)
  {
    let newPredator = new Predator({
      "pos": randomMidish(0.5),
      "name": "dino",
      "username": this.name,
      "th": this.th,
      "id": this.idCt,
      "world": this.world
    }, sketch);
    for (let f in data)
    {
      newPredator[f] = data[f];
    }
    this.idCt += 1;
    this.predators.push(newPredator);
    this.predators[this.predators.length-1].subPos([newPredator.dims[0]/2, newPredator.dims[1]/2]);
  }

  addPersonal(data, sketch)
  {
    let newPersonal = new Personal({
      "pos":this.adjustAnimalLoc(this.pos),
      "name": this.animal_type,
      "username": this.name,
      "th": this.th,
      "id": this.idCt,
      "world": this.world,
      "img_uri": this.data_uri
    }, sketch);
    for (let f in data)
    {
      newPersonal[f] = data[f];
    }
    this.idCt += 1;
    this.personals.push(newPersonal);
    this.personals[this.personals.length-1].subPos([newPersonal.dims[0]/2,newPersonal.dims[1]/2]);
    stopGameOverCallback();
    this.setAnimalsText();
  }

  buyAnimal(sketch)
  {
    if (this.stormlight >= this.cost && this.personals.length < maxAnimals)
    {
      this.stormlight -= this.cost;
      this.addPersonal({}, sketch);
    }
  }


  updateView(last_pos, current_pos)
  {
    let proposedPos = addV([current_pos[0]-last_pos[0], current_pos[1] - last_pos[1]], this.pos);
    if((proposedPos[0] > -gridSize || this.pos[0] < proposedPos[0]) && (proposedPos[0] < gridSize || this.pos[0] > proposedPos[0]))
    {
      this.pos[0] = proposedPos[0];
    }
    if ((proposedPos[1] > -gridSize || this.pos[1] < proposedPos[1]) && (proposedPos[1] < gridSize || this.pos[1] > proposedPos[1]))
    {
      this.pos[1] = proposedPos[1];
    }
  }

  shiftPos(pos)
  {
    this.pos = [this.pos[0] + pos[0], this.pos[1] + pos[1]];
  }

  // later only show things that are in our view
  inView(pos)
  {
    let sPos = this.shiftPos(pos);
    if (sPos[0]>0 && sPos[0] < screen_dims[0] && sPos[1]>0 && sPos[1]<screen_dims[1])
    {
      return true;
    }
    return false;
  }

  setStormlightText()
  {
      $('#stormlightTxt').text("Stormlight: " + this.stormlight);
  }

  setAnimalsText()
  {
      $('#animalsTxt').text("Animals: " + this.personals.length);
  }

  setAnimalType()
  {
      $('#animalTypeTxt').text("Animals Type: " + this.animal_type);
  }

  giveAnimalsName()
  {
    for (let t in allAnimals)
    {
      for(let an in this[allAnimals[t]])
      {
        this[allAnimals[t]][an].username = this.name;
      }
    }
  }

  giveAnimalsTh()
  {
    for (let t in allAnimals)
    {
      for(let an in this[allAnimals[t]])
      {
        this[allAnimals[t]][an].th = this.th;
      }
    }
  }

  toggleAttractAnimals()
  {
    this.attractAnimals = ! this.attractAnimals;
  }

  getScore()
  {
    return Math.floor(this.personals.length*20+0.1*this.stormlight);
  }

  triggerReward(type)
  {
    this.stormlight+=rewards[type];
    this.setStormlightText();

    let col = type + "_killed";
    if(userDb) {
      console.log("update userDb " + col);
      userDb[col] += 1;
      updateDbText();
      socket.emit("updateAchievments", {"unm": this.name, "col": col, "newVal": userDb[col]});
      if (questComplete()) {
        myp5.handleQuestComplete();
      }
    }
  }

}
