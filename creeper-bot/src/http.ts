import express from 'express';
// import session from 'express-session';
import pg from 'pg';
// import connectPgSimple from 'connect-pg-simple';
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
// const pgSession = connectPgSimple(session);

export const io = socketio(httpServer);
export const sessionMap = new Session<UserInfo>(renewToken);

const pgPool = new pg.Pool({
  connectionString: process.env.PSQL_CONNECTION_STRING,
  ssl: true,
});

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(bodyparser.json());
/*app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  cookie: { maxAge: 604800 },
  name: 'session'
}));*/

app.get('/', (req, res) => {
  pgPool.query('SELECT * FROM session', (err, dbResponse) => {
    console.log(dbResponse.rows[0].sess.userInfo);
    res.sendStatus(200);
  });
});

app.post('/login', async (req, res) => {
  console.log('Login hit');
  
  const formData = 
  {
    'client_id': '732331475990478870',
    'client_secret': process.env.CLIENT_SECRET,
    'grant_type': 'authorization_code',
    'redirect_uri': 'http://localhost:8080/login',
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
    console.log(discordAuth);
    let userInfo = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${discordAuth.access_token}`
      }
    });
    //console.log(userInfo.data);
    req.session!.cookie.maxAge = discordAuth.expires_in;
    req.session!.userInfo = {
      discordAuth,
      snowflake: userInfo.data.id,
      username: userInfo.data.username
    };

    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + discordAuth.expires_in);

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

async function renewToken(): Promise<DiscordAuth> {
  return new Promise((resolve, reject) => {
    resolve({} as DiscordAuth);
 });
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