export interface AuthenticateDeviceParams {
  titleId: string;
  deviceId: string;
  displayName?: string;
  clientPlatform?: "Android" | "iOS" | "Windows" | "macOS" | "Linux" | "Web";
  endpoint?: string;
}

export interface PlayerSession {
  token: string;
  playerId: string;
  deviceId: string;
  username: string;
  isNewPlayer: boolean;
  wallet: Record<string, number>;
}

export class DakshAuth {
  private static activeSession: PlayerSession | null = null;

  /**
   * Authenticates instantly via unique hardware Device ID without passwords.
   */
  public static async authenticateDeviceAsync(params: AuthenticateDeviceParams): Promise<PlayerSession> {
    const endpoint = params.endpoint || "http://localhost:3000";
    const url = `${endpoint}/api/titles/${params.titleId}/players`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deviceId: params.deviceId,
        clientPlatform: params.clientPlatform || "Web",
        displayName: params.displayName
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Auth request failed" }));
      throw new Error(`[Daksh.Auth] Authentication failed: ${err.error || res.statusText}`);
    }

    const data = await res.json();
    const session: PlayerSession = {
      token: data.token,
      playerId: data.player.id,
      deviceId: data.player.deviceId,
      username: data.player.username,
      isNewPlayer: data.isNewPlayer,
      wallet: data.player.wallet || {}
    };

    DakshAuth.activeSession = session;
    return session;
  }

  public static getSession(): PlayerSession | null {
    return DakshAuth.activeSession;
  }

  public static logout(): void {
    DakshAuth.activeSession = null;
  }
}
