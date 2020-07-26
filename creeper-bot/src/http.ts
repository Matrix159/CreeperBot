import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';
import http from 'http';
import socketio from 'socket.io';
import crypto from 'crypto';
import axios from 'axios';
import { UserInfo, DiscordAuth } from './models';

const app = express();
const httpServer = http.createServer(app);
export const io = socketio(httpServer);

export const sessionMap = new Map<string, UserInfo>();

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(bodyparser.json());

app.get('/', (req, res) => res.send('Hello world!'));

app.post('/login', async (req, res) => {
  console.log('Login hit');
  // TODO: Fill out remainder of OAuth logic and session management
  const sessionID = generateKey();
  
  const formData = 
  {
    'client_id': '732331475990478870',
    'client_secret': process.env.CLIENT_SECRET,
    'grant_type': 'authorization_code',
    'redirect_uri': 'http://localhost:8080',
    'scope': 'identify',
    'code': req.body.code
  };
  //console.log(req.body.code);
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  let discordAuth: DiscordAuth;
  try {
    discordAuth = (await axios.post('https://discord.com/api/oauth2/token', getQueryString(formData), config)).data;
    console.log(discordAuth);
    let userInfo = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${discordAuth.access_token}`
      }
    });
    //console.log(userInfo.data);
    sessionMap.set(sessionID, {
      discordAuth,
      snowflake: userInfo.data.id,
      username: userInfo.data.username
    });
    //console.log(sessionMap);
    res.cookie('sessionID', sessionID, {
      maxAge: sessionMap.get(sessionID)?.discordAuth.expires_in
    });
    res.sendStatus(200);
    return;
  } catch (error) {
    console.log(error.response.data);
  }
  res.sendStatus(400);
});

async function renewToken() {

}

export const setupHttpServer = (callback: () => void) => {
  httpServer.listen(3000, () => {
    console.log('listening on *:3000');
  });
  callback();
};

function generateKey() {
    // 16 bytes is likely to be more than enough,
    // but you may tweak it to your needs
    return crypto.randomBytes(16).toString('base64');
}
function getQueryString(data = {}): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key as string)}=${encodeURIComponent(value as string)}`)
    .join('&');
}