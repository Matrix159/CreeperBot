import { DiscordAuth } from './models';

export interface SessionValue {
  discordAuth: DiscordAuth;
  expiresBy: Date;
}

export class Session<T extends SessionValue> extends Map<string, T> {
  
  renewFunction: (renewToken: string) => Promise<DiscordAuth>;

  constructor(renewFunction: (renewToken: string) => Promise<DiscordAuth>) {
    super();
    this.renewFunction = renewFunction;
  }

  async getRenewAsync(key: string): Promise<T | undefined> {
    const value = super.get(key);

    // If the session value has expired, attempt to renew it
    if (value && value.expiresBy > new Date()) {
      const newDiscordAuth = await this.renewFunction(value.discordAuth.refresh_token);
      value.discordAuth = newDiscordAuth;
      const expireDate = new Date();
      expireDate.setTime(expireDate.getTime() + newDiscordAuth.expires_in);
      value.expiresBy = expireDate;
    }
    return value;
  }
}