export interface AuthenticateDeviceParams {
  titleId: string;
  deviceId: string;
  displayName?: string;
  clientPlatform?: "Android" | "iOS" | "Windows" | "macOS" | "Linux" | "Web";
  endpoint?: string;
}

export interface PlayerSession {
  token: string;
  refreshToken: string;
  expiresIn: number;
  playerId: string;
  deviceId: string;
  username: string;
  isNewPlayer: boolean;
  wallet: Record<string, number>;
}

export interface LinkAccountParams {
  titleId: string;
  playerId: string;
  provider: "Steam" | "Google" | "Apple" | "Email";
  providerId: string;
  conflictResolution?: "ABORT" | "SWITCH_ACCOUNT" | "MERGE_PROFILES";
  endpoint?: string;
}

export interface LinkAccountResponse {
  success: boolean;
  conflict?: boolean;
  resolutionApplied?: "LINKED" | "SWITCHED" | "MERGED";
  player: any;
  token?: string;
  refreshToken?: string;
  conflictDetails?: {
    conflictingPlayerId: string;
    conflictingUsername: string;
    conflictingWallet: Record<string, number>;
  };
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
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn || 7200,
      playerId: data.player.id,
      deviceId: data.player.deviceId,
      username: data.player.username,
      isNewPlayer: data.isNewPlayer,
      wallet: data.player.wallet || {}
    };

    DakshAuth.activeSession = session;
    return session;
  }

  /**
   * Refreshes an expired JWT session using the cryptographic 30-day refresh token.
   */
  public static async refreshSessionAsync(titleId: string, refreshToken: string, endpoint = "http://localhost:3000"): Promise<PlayerSession> {
    const url = `${endpoint}/api/titles/${titleId}/players/refresh`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Token refresh failed" }));
      throw new Error(`[Daksh.Auth] Refresh failed: ${err.error || res.statusText}`);
    }

    const data = await res.json();
    if (DakshAuth.activeSession) {
      DakshAuth.activeSession.token = data.token;
      DakshAuth.activeSession.refreshToken = data.refreshToken;
    }
    return DakshAuth.activeSession!;
  }

  /**
   * Links a federated identity (Steam, Google, Apple) with conflict resolution.
   */
  public static async linkAccountAsync(params: LinkAccountParams): Promise<LinkAccountResponse> {
    const endpoint = params.endpoint || "http://localhost:3000";
    const url = `${endpoint}/api/titles/${params.titleId}/players/link`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: params.playerId,
        provider: params.provider,
        providerId: params.providerId,
        conflictResolution: params.conflictResolution || "ABORT"
      })
    });

    const data = await res.json();
    if (data.success && data.token) {
      if (DakshAuth.activeSession) {
        DakshAuth.activeSession.token = data.token;
        DakshAuth.activeSession.refreshToken = data.refreshToken;
        DakshAuth.activeSession.playerId = data.player.id;
      }
    }
    return data;
  }

  public static getSession(): PlayerSession | null {
    return DakshAuth.activeSession;
  }

  public static logout(): void {
    DakshAuth.activeSession = null;
  }
}
