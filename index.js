var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http, {
  allowEIO3: true,
  cors: {
    origin: "*",
  },
});

var port = process.env.PORT || 3000;

var Players = {};

function Player(robo, position, hp) {
  this.robo = robo;
  this.index = Players.length;
  this.position = position;
  this.hp = hp;
  this.kills = 0;
}

Player.prototype = {
  getRobo: function () {
    return { robo: this.robo };
  },
  getIndex: function () {
    return { index: this.index };
  },
  getPosition: function () {
    return { position: this.position };
  },
  getHp: function () {
    return { hp: this.hp };
  },
  getKills: function () {
    return { kills: this.kills };
  },
};

const POSITIONS_BORN = [
  { x: 12, y: 14 },
  { x: 17, y: 27 },
  { x: 20, y: 33 },
  { x: 30, y: 29 },
  { x: 52, y: 29 },
  { x: 60, y: 7 },
  { x: 58, y: 18 },
  { x: 38, y: 8 },
  { x: 40, y: 15 },
  { x: 44, y: 21 },
];
function randomId() {
  const id = Date.now();
  return id;
}
function createPlayer(message, id) {
  console.log("CREATE PLAYER: ", message);
  let player = new Player(
    message.data.robo,
    POSITIONS_BORN[Math.floor(Math.random() * POSITIONS_BORN.length)],
    message.data.hp
  );
  console.log("PLAYER CREATED: ", player);
  Player = {
    ...Player,
    [id]: player,
  };
  // Player[id] = player;
  console.log("PLAYERS DISPONÍVEIS: ", Players);
  return player;
}

function existeId(idPlayer) {
  if (Players.length > 0) {
    return Object.keys(Players).some((el) => el === idPlayer);
  }
  return false;
}
app.get("/clean", (req, res) => {
  Players = {};
  res.send("PlayerCleaned");
  const player = {
    action: "CLEAN",
    data: {
      playersON: Players,
    },
    error: false,
    msg: "",
  };
  io.emit("message", player);
});

io.on("connection", (client) => {
  console.log("Cliente conectado:: ", client);

  client.on("message", function (message) {
    switch (message.action) {
      case "CREATE":
        let playerCreated = null;
        let id = randomId();
        while (existeId(id)) {
          id = randomId();
        }
        playerCreated = createPlayer(message, id);

        let player = {
          action: "YOUR_PLAYER",
          data: {
            robo: playerCreated.robo,
            hp: playerCreated.hp,
            id: id,
            position: playerCreated.position,
            playersON: Players,
          },
          error: false,
          msg: "",
        };
        client.emit("message", player);
        player["action"] = "PLAYER_JOIN";
        client.broadcast.emit("message", player);
        playerCreated = null;
        break;

      // case "MOVE":
      //   let playerMove = {
      //     action: "MOVE",
      //     time: message.time || "",
      //     data: {
      //       player_id: message.data.player_id,
      //       direction: message.data.direction,
      //       position: {
      //         x: message.data.position.x,
      //         y: message.data.position.y,
      //       },
      //     },
      //     error: false,
      //     msg: "",
      //   };
      //   //Atualizando a posição do player
      //   if (Players[message.data.player_id])
      //     Players[message.data.player_id].position = message.data.position;

      //   console.log("PLAYER MOVE TO: ", playerMove);
      //   client.broadcast.emit("message", playerMove);
      //   break;

      // case "ATTACK":
      //   let playerAttack = {
      //     action: "ATTACK",
      //     time: message.time || "",
      //     data: {
      //       player_id: message.data.player_id,
      //       direction: message.data.direction,
      //       position: {
      //         x: message.data.position.x,
      //         y: message.data.position.y,
      //       },
      //     },
      //     error: false,
      //     msg: "",
      //   };
      //   console.log("PLAYER ATTACK: ", playerAttack);
      //   client.broadcast.emit("message", playerAttack);
      //   break;

      // case "RECEIVED_DAMAGE":
      //   let playerDamage = {
      //     action: "RECEIVED_DAMAGE",
      //     time: message.time || "",
      //     data: {
      //       player_id: message.data.player_id,
      //       player_id_attack: message.data.player_id_attack,
      //       damage: message.data.damage,
      //     },
      //     error: false,
      //     msg: "",
      //   };

      //   Players[message.data.player_id].life -= message.data.damage;

      //   if (Players[message.data.player_id].life <= 0)
      //     Players[message.data.player_id_attack].kills += 1;

      //   console.log("PLAYER DAMAGE: ", playerDamage);
      //   client.broadcast.emit("message", playerDamage);
      //   break;

      case "LOGOUT":
        delete Player[message.data.player_id];
        let playerLeaved = {
          action: "PLAYER_LOGOUT",
          data: {
            id: message.data.player_id,
            playersON: Players,
          },
          error: false,
          msg: "",
        };

        console.log("MESSAGE - playerLogout:: ", playerLeaved);
        client.broadcast.emit("message", playerLeaved);

        break;
    }

    // user disconnected
    client.on("disconnect", function (connection) {
      console.log("DISCONNECT: ", connection);
      let playerLeaved = {
        action: "PLAYER_LEAVED",
        data: {
          id: message.data.player_id,
          playersON: Players,
        },
        error: false,
        msg: "",
      };
      console.log("MESSAGE - playerLeaved:: ", playerLeaved);
      client.broadcast.emit("message", playerLeaved);
    });
  });
});

app.get("/teste", (req, res) => {
  res.send(new Date());
});
http.listen(port, function () {
  console.log("Zero:" + port);
});
