require('dotenv').config();
const express= require("express");
const connectDb =require("./connection/connect")
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multerconfig=require("./config/multerconfig");
const userRoute=require("./routes/user");
const authRoute=require("./routes/checkcookieRoutes");
const imgroute=require("./routes/image");
const blogroute=require("./routes/blog");
const permissionRoute=require("./routes/permission");
const FollowRoute=require("./routes/Follow");
const cookie = require('cookie');
const {IoMiddleware} = require('./middlewares/auth')
const { create, createSearchIndex } = require('./models/followers');
const  {createServer } = require('node:http');
const { connectsoket } = require("./controllers/soketmaneger");
const Message = require('./models/message');
const { validateToken } = require('./services/auth');
//-----------------------------------------------//

const app=express();
app.use(express.json({limit:"40kb"}));
const server = createServer(app);
 const io = connectsoket(server);
//--------------------------------//

io.use((socket, next) => {

  try {
    const rawCookie = socket.handshake.headers.cookie || '';
    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;
    if (!token) return next(new Error('No token found'));

    const payload = validateToken(token); // will give {_id, fullname, email, role}
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on("connection", (socket) => {
  console.log("connection is connected");
  const userId = socket.user._id;
  socket.join(userId);

 

  socket.on("disconnect", () => {
    console.log(`❌ User ${userId} disconnected`);
  });

  socket.on("private_message", async ({ to, content }) => {
    try {
      if (!to || !content) {
        console.log("Invalid message data:", { to, content });
        return;
      }
      console.log(`Sending message from ${userId} to ${to}: ${content}`);

      // save in DB
      const msg = await Message.create({
        from: socket.user._id,
        to,
        content
      });

      // console.log("Message saved to DB:", msg._id);

      // send to recipient
      io.to(to).emit("new_message", {
        _id: msg._id,
        from: msg.from,
        to: msg.to,
        content: msg.content,
        createdAt: msg.createdAt
      });

      // echo back to sender (so sender sees it instantly)
      socket.emit("message_sent", {
        _id: msg._id,
        to,
        content: msg.content,
        createdAt: msg.createdAt
      });

      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Add typing event handler
  socket.on("typing", ({ to, isTyping }) => {
    if (to) {
      io.to(to).emit("user_typing", { from: userId, isTyping });
    }
  });
});



//------------------------------//
const PORT = process.env.PORT || 8000;
app.set('trust proxy', 1);
app.use(cookieParser());
app.use('/public', express.static('public')); 

connectDb(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smpleBlog');

const allowedOrigins = (process.env.CLIENT_URL ? process.env.CLIENT_URL : 'http://localhost:5173')
  .split(',')
  .map(s => s.trim()) 
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use ('/user',userRoute);
app.use('/auth',authRoute);
app.use('/profile',imgroute); 
app.use('/blog',blogroute);
app.use('/permissions',permissionRoute);
app.use('/follow',FollowRoute);
server.listen(PORT,()=>console.log(`server is started on port ${PORT}`));