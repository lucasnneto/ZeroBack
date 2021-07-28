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

function Player(robo, hp) {
  this.robo = robo;
  this.position = {
    x: "",
    y: "",
  };
  this.hp = hp;
  this.kills = 0;
  this.side = Object.keys(Players).length === 0 ? "l" : "r";
}

Player.prototype = {
  getRobo: function () {
    return { robo: this.robo };
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
  getSide: function () {
    return { side: this.side };
  },
};

function randomId() {
  const id = Date.now().toString();
  return id;
}
function createPlayer(message, id) {
  console.log("CREATE PLAYER: ", message);
  let player = new Player(message.data.robo, message.data.hp);
  console.log("PLAYER CREATED: ", player);
  Players[id] = player;
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
        if (Object.keys(Players).length < 2) {
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
              side: playerCreated.side,
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
        }
        break;

      case "MOVE":
        let playerMove = {
          action: "MOVE",
          time: message.time || "",
          data: {
            player_id: message.data.player_id,
            direction: message.data.direction,
            position: {
              x: message.data.position.x,
              y: message.data.position.y,
            },
          },
          error: false,
          msg: "",
        };
        //Atualizando a posição do player
        if (Players[message.data.player_id])
          Players[message.data.player_id].position = message.data.position;

        console.log("PLAYER MOVE TO: ", playerMove);
        client.broadcast.emit("message", playerMove);
        break;

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
