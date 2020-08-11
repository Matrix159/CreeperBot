import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';
import http from 'http';
import socketio from 'socket.io';
import crypto from 'crypto';
import axios from 'axios';
import { UserInfo, DiscordAuth } from './models';
import { Session } from './session';

const app = express();
const httpServer = http.createServer(app);

export const io = socketio(httpServer);
export const sessionMap = new Session<UserInfo>(renewToken);

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://192.168.86.138:8080'],
  credentials: true
}));
app.use(bodyparser.json());

/*app.get('/', (req, res) => {
  pgPool.query('SELECT * FROM session', (err, dbResponse) => {
    console.log(dbResponse.rows[0]);
    res.sendStatus(200);
  });
});*/

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
    discordAuth = (await axios.post('https://discord.com/api/oauth2/token', getQueryString(formData), config)).data;
    // console.log(discordAuth);
    let userInfo = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${discordAuth.access_token}`
      }
    });
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() +  5000/*discordAuth.expires_in*/);
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
    res.sendStatus(200);
    return;
  } catch (error) {
    console.log(error);
    console.log(error.response.data);
  }
  res.sendStatus(400);
});

async function renewToken(refreshToken: string): Promise<DiscordAuth> {
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  const formData = 
  {
    'client_id': '732331475990478870',
    'client_secret': process.env.CLIENT_SECRET,
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken,
    'redirect_uri': 'http://localhost:8080/login',
    'scope': 'identify'
  };
  
  return await axios.post('https://discord.com/api/oauth2/token', getQueryString(formData), config)
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