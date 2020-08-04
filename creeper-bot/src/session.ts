type SessionValue = {
  expiresBy: Date
};

export class Session<T extends SessionValue> extends Map<string, T> {
  
  constructor() {
    super();
  }

  get(key: any): T | undefined {
    const value = super.get(key);
    return value;
  }
}