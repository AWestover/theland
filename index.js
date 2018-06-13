// behind the scenes of the game
let express = require('express'); // needs this library
let app = express();
let port = process.env.PORT || 3000;  // what port to open it on must have the option to be
// chosen by server if you want it to be heroku compatible, also does need the default
let server = require('http').createServer(app).listen(port);
let socket = require('socket.io');
let io = socket(server);
app.use(express.static('public'));

const { Client } = require('pg');

// query the database
function queryDb(qu, params, callbackFunction, callbackParams)
{
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  client.connect();
  console.log("Querying " + qu);
  console.log("With params " + params);

  let dataResults = [];
  client.query(qu, params, (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      dataResults.push(row);
    }
    client.end();
    console.log(dataResults);
    if(callbackFunction)
    {
      callbackFunction(dataResults, callbackParams);
    }
  });
}

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

function handlePasswordInput(results, params)
{
  let resp = params["resp"];
  let pwd = params["pwd"];
  let datas = params["datas"];

  let dText = ["unm", "world", "anType","soundWanted"];

  console.log("pwd input results " + results);
  if (!results)
  {
    resp.redirect("game.html?"+joinIns(datas, dText));
  }
  else {
    let pwdReal = results[0];
    if (pwdReal == pwd)
    {
      resp.redirect("game.html?"+joinIns(datas, dText));
    }
    else
    {
      resp.redirect("index.html?login=failed");
    }
  }
}

// handle posts
app.post('/', function(req, resp) {
  let unm = nicerFormInput(req.body.unm);
  let datas = [unm, req.body.world, req.body.anType, req.body.soundWanted];
  let pwd = req.body.pwd;
  queryDb("SELECT * FROM users WHERE name=$1;", [unm], handlePasswordInput, {"resp":resp, "pwd": pwd, "datas": datas});
});

function registerGoodUnm(results, params)
{
  let resp = params["resp"];
  let fields = params["fields"];
  if (results.length != 0)
  {
    resp.redirect("register.html?fail=unm_exists");
  }
  else {
    queryDb("INSERT INTO Users VALUES ("+nums(fields.length)+");", fields);
    resp.redirect("index.html");
  }
}

app.post('/register', function(req, resp) {
  let unm = req.body.unm;
  let pwd = req.body.pwd;
  let fields = [unm, 'none', 0, pwd, 0, 0, 0, 0, 0, 0, 0];
  queryDb("SELECT * FROM users WHERE name=$1;", [unm], registerGoodUnm, {"resp": resp, "fields": fields});
});

console.log("server running");
io.sockets.on('connection', newConnection);  // when you get a connection do this

let playersConnected = [];
let worldThetas = {};
let userData = {};
const maxSLength = 15;

function newConnection(socket) {
	/*
		socket.on  - when this specific socket instance (which indexjs holds all of the sockets) hears something

		socket.emit - emit to this socket only
		socket.broadcast - to all other people
		io.sockets.emit - to everyone
	*/

  console.log("new connection");
  let name;
  let world;
  let th;

  // what to listen for
  socket.on('named', handleNaming);
  socket.on('sendWorld', handleSendWorld);
  socket.on('updatePlayer', updatePlayer);
  socket.on('pushAnimalUpdate', pushAnimalUpdate);
  socket.on('deathAlert', handleDeath);
  socket.on('choseAnimalType', handleChoseAnimalType);
  socket.on('selectDb', handleSelectDb);
  socket.on('updateAchievments', handleUpdateAchievments);

  function handleUpdateAchievments(data)
  {
    let unm = data["unm"];
    queryDb("UPDATE Users SET ($1)=($2) WHERE name=$3;", [data["col"], data["newVal"], unm]);
  }

  function handleSelectDb(data)
  {
    let unm = data["unm"];
    queryDb("SELECT * FROM users WHERE name=$1;", [unm], function(results, empty) {socket.emit("selectedData", results);}, []);
  }

  socket.on('getData', sendData);
  function sendData(data)
  {
    socket.emit('gotData', userData);
  }

  function handleChoseAnimalType(data)
  {
    userData[name].push(data["animalType"]);
  }

  function handleSendWorld(data)
  {
  	world = data["world"];

    if  (!world)
    {
      world = "World";
    }

    if (world.length > maxSLength)
    {
      world = world.slice(0, maxSLength);
    }

    // 12 ppl max in the world (it is a clock!!!!!)
    while (worldThetas[world] && worldThetas[world].length >= 12)
    {
      world += Math.floor(10*Math.random());
    }

    if (worldThetas[world])
    {
      let ii=0;
      while (ii < worldThetas[world].length && worldThetas[world][ii]==ii)
      {
        ii += 1;
      }
      worldThetas[world].splice(ii,0, ii);// insert into that position that value
      th=ii;
    }
    else {
      worldThetas[world] = [0];
      th=0;
    }

    userData[name].push(world);
    userData[name].push(th);

  	socket.join(world); // join a world... this means you can have a private conversation within that world

    // console.log(worldThetas);
    console.log("world chosen " + world);

    // what world did we really join?...
    socket.emit("worldChosen", {"world":world, "ourTheta": th});
  }

  function updatePlayer(user)
  {
  	// don't emit to yourself or people in other worlds
  	socket.broadcast.to(user.world).emit("updatePlayer", user);
    // io.sockets.emit("updatePlayer", data);
  }

  function pushAnimalUpdate(data)
  {
    socket.broadcast.to(data.world).emit("pushedAnimalUpdate", data);
  }

  function handleNaming(data)
  {
    // later do not allow duplicates
    name = data["name"];

    if (!name){name = "User";}
    if (name=="NONE"){name="fakeNONE";}
    if(name=="NPC"){name="fakeNPC";}

    if (name.length > maxSLength)
    {
      name = name.slice(0,maxSLength)
    }

    while (nameExists(name)!=0) {
    	name = name + Math.floor(Math.random()*10);
    }

    console.log(name + " added" );
    playersConnected.push(name);
    userData[name] = [name];
    console.log("Now playing: ");
    console.log(playersConnected);

    socket.emit('nameChosen', name);
  }

  function handleDeath(data)
  {
    io.to(data["world"]).emit("death", data);
  }

  socket.on('disconnect', handleDisconnect);
  function handleDisconnect(data)
  {
    if (world)
    {
      try {
        for (let i = 0; i < worldThetas[world].length; i++)
        {
          if (th == worldThetas[world][i])
          {
            worldThetas[world].splice(i,1);
            break;
          }
        }
      }
      catch (e) {
        console.log("ERROR " + e);
      }
      let idx = playersConnected.indexOf(name);
      console.log("disconnect by " + idx + " " + name);
      if (idx != -1)
      {
        delete userData[name];
        playersConnected.splice(idx, 1); // 1 means remove 1 thing
        console.log("Now playing: ");
        console.log(playersConnected);

  	     // don't emit to yourself or people in other worlds
         socket.broadcast.to(world).emit("deletePlayer", {"name": name});
         // io.sockets.emit("deletePlayer", {"name":name});
      }
    }
    else {
      console.log("disconnect on HOME PAGE");
    }
  }

}

function joinIns(ins, fields)
{
	let out = "";
	if (ins.length<1)
	{
		return out;
	}
	for (let i = 0; i < ins.length-1; i++)
	{
		out+=fields[i]+"="+ins[i]+"&";
	}
	out+= fields[ins.length-1]+"="+ins[ins.length-1];
	return out;
}

function nameExists(name)
{
	let ct=0;
	for (let i = 0; i<playersConnected.length; i++)
	{
    // if (playersConnected[i].indexOf(name)!=-1)
		if (playersConnected[i] == name)
		{
			ct+=1;
		}
	}
	return ct;
}

function nums(x)
{
  let o = "";
  for (let i = 1; i <= x; i++)
  {
    o+="$"+i;
    if (i!= x)
    {
      o+=", ";
    }
  }
  return o;
}

function nicerFormInput(fi)
{
  fi = fi.replace("?", "");
  fi = fi.replace(" ", "_");
  return fi;
}
