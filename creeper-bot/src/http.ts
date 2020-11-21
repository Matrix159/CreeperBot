import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';
import http from 'http';
import socketio from 'socket.io';
import crypto from 'crypto';
import axios from 'axios';
import { DiscordAuth } from './models';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = http.createServer(app);

export const io = socketio(httpServer);

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://192.168.86.138:8080'],
  credentials: true
}));
app.use(bodyparser.json());

app.get('/', (req, res) => {
  res.send("test");
});

app.post('/login', async (req, res) => {
  console.log('Login hit');

  const formData =
  {
    'client_id': '732331475990478870',
    'client_secret': process.env.CLIENT_SECRET,
    'grant_type': 'authorization_code',
    'redirect_uri': process.env.REDIRECT_URI,
    'scope': 'identify',
    'code': req.body.code
  };

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  let discordAuth: DiscordAuth;
  try {
    discordAuth = (await axios.post('https://discord.com/api/oauth2/token', createQueryString(formData), config)).data;
    // console.log(discordAuth);
    let userInfo = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${discordAuth.access_token}`
      }
    });

    const token = jwt.sign({
      snowflake: userInfo.data.id,
      username: userInfo.data.username
    }, process.env.JWT_SECRET as string);

    console.log(`Token: ${token}`);
    res.json({ token });

    /*const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() +  discordAuth.expires_in);
    console.log(`Expire date: ${expireDate}`);
    const sessionId = generateKey();

    sessionMap.set(sessionId, {
      discordAuth,
      snowflake: userInfo.data.id,
      username: userInfo.data.username,
      expiresBy: expireDate
    });

    res.cookie('sessionID', sessionId, {
      maxAge: discordAuth.expires_in
    });
    res.sendStatus(200);*/
    return;
  } catch (error) {
    console.log(error);
    console.log(error.response.data);
  }
  res.sendStatus(400);
});

function generateKey() {
  // 16 bytes is likely to be more than enough,
  // but you may tweak it to your needs
  return crypto.randomBytes(16).toString('base64');
}

export const setupHttpServer = async () => {
  httpServer.listen(3000, () => {
    console.log('listening on *:3000');
  });
  return;
};

export function createQueryString(data = {}): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key as string)}=${encodeURIComponent(value as string)}`)
    .join('&');
}
