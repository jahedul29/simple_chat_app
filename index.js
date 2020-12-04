const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
const http = require("http");

const { addUser, removeUser, getUser, getAllUsers } = require("./users");

const port = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "https://simplechatappjahed.netlify.app",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    const users = getAllUsers(room);

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name} welcome to the room!`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} has joined the chat.`,
    });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: users,
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getAllUsers(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left!`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getAllUsers(user.room),
      });
    }
  });
});

app.use(cors());
app.use(router);

server.listen(port, () => console.log(`server has started on ${port}`));
