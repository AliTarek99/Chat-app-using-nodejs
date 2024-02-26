const express = require('express');
const authRouter = require('./routes/auth');
const chatsRouter = require('./routes/chats');
const profileRouter = require('./routes/profile');
const dbPool = require('./util/database');
const multer = require('multer');

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/messages", chatsRouter);
app.use("/api/profile", profileRouter);

app.listen(3000);