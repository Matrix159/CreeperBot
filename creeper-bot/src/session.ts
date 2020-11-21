import { DiscordAuth, UserInfo } from './models';
import axios from 'axios';
import { createQueryString } from './http';

export interface SessionValue {
  discordAuth: DiscordAuth;
  expiresBy: Date;
}

export class Session<T extends SessionValue> extends Map<string, T> {
  constructor() {
    super();
  }

  async getRenewAsync(key: string): Promise<T | undefined> {
    const value = super.get(key);

    // If the session value has expired, attempt to renew it
    if (value && value.expiresBy < new Date()) {
      const newDiscordAuth = await this.renewToken(value.discordAuth.refresh_token);
      value.discordAuth = newDiscordAuth;
      const expireDate = new Date();
      expireDate.setTime(expireDate.getTime() + newDiscordAuth.expires_in);
      value.expiresBy = expireDate;
    }
    return value;
  }

  async renewToken(refreshToken: string): Promise<DiscordAuth> {
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
        'redirect_uri': process.env.REDIRECT_URI,
        'scope': 'identify'
      };

    return await axios.post('https://discord.com/api/oauth2/token', createQueryString(formData), config)
  }
}

// export default new Session<UserInfo>();
