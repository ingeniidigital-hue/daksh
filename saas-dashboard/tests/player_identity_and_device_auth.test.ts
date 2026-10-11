import { describe, it, expect } from "vitest";
import {
  generateEd25519KeyPair,
  signPlayerJwt,
  verifyPlayerJwt,
  authenticateDevice,
  deletePlayerRightToBeForgotten,
  setPlayerStatus,
  listTitlePlayers,
  clearPlayerStorage
} from "../lib/auth";

describe("STORY-02 / TDD: Player Identity Federation & Device Authentication", () => {
  const titleId = "TITL1";
  const deviceId = "hw_pixel_9_pro_a1b2c3d4";

  it("TEST-02-A [Happy Path]: should authenticate device, create player row, and issue valid Ed25519 JWT", async () => {
    clearPlayerStorage();

    const authResult = await authenticateDevice({
      titleId,
      deviceId,
      clientPlatform: "Android"
    });

    expect(authResult).toBeDefined();
    expect(authResult.isNewPlayer).toBe(true);
    expect(authResult.player.id).toMatch(/^ply_[a-f0-9]{8}$/);
    expect(authResult.player.deviceId).toBe(deviceId);
    expect(authResult.player.status).toBe("Active");
    expect(typeof authResult.token).toBe("string");

    // Verify the Ed25519 JWT token
    const decoded = await verifyPlayerJwt(authResult.token);
    expect(decoded.valid).toBe(true);
    expect(decoded.payload.sub).toBe(authResult.player.id);
    expect(decoded.payload.titleId).toBe(titleId);
    expect(decoded.payload.deviceId).toBe(deviceId);
    expect(decoded.payload.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("TEST-02-B [Idempotency]: re-authenticating with same device ID returns existing profile", async () => {
    const firstAuth = await authenticateDevice({
      titleId,
      deviceId,
      clientPlatform: "Android"
    });

    const secondAuth = await authenticateDevice({
      titleId,
      deviceId,
      clientPlatform: "Android"
    });

    expect(secondAuth.isNewPlayer).toBe(false);
    expect(secondAuth.player.id).toBe(firstAuth.player.id);
    expect(secondAuth.player.deviceId).toBe(deviceId);

    // Ensure database doesn't have duplicate records
    const allPlayers = await listTitlePlayers(titleId);
    const matching = allPlayers.filter(p => p.deviceId === deviceId);
    expect(matching.length).toBe(1);
  });

  it("TEST-02-C [Failure Mode]: blank or null deviceId returns 400 validation error", async () => {
    await expect(authenticateDevice({ titleId, deviceId: "" }))
      .rejects.toThrow("deviceId cannot be blank");

    await expect(authenticateDevice({ titleId, deviceId: "   " }))
      .rejects.toThrow("deviceId cannot be blank");
  });

  it("TEST-02-D [Security Check]: tampered JWT token or altered signature is rejected", async () => {
    const authResult = await authenticateDevice({
      titleId,
      deviceId: "hw_iphone_16_secure",
      clientPlatform: "iOS"
    });

    const validToken = authResult.token;
    const parts = validToken.split(".");
    expect(parts.length).toBe(3);

    // 1. Tamper with the payload (e.g. elevate permissions or change playerId)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], "base64url").toString()), role: "admin" })
    ).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const tamperedCheck = await verifyPlayerJwt(tamperedToken);
    expect(tamperedCheck.valid).toBe(false);
    expect(tamperedCheck.error).toBe("INVALID_SIGNATURE");

    // 2. Tamper with the signature
    const corruptSignature = parts[2].slice(0, -4) + "XXXX";
    const corruptToken = `${parts[0]}.${parts[1]}.${corruptSignature}`;

    const corruptCheck = await verifyPlayerJwt(corruptToken);
    expect(corruptCheck.valid).toBe(false);
  });

  it("TEST-02-E [DPDP / GDPR]: Right to be Forgotten deletion pipeline completely removes player", async () => {
    const authResult = await authenticateDevice({
      titleId,
      deviceId: "hw_gdpr_deletion_target",
      clientPlatform: "Web"
    });

    const playerId = authResult.player.id;
    const deleted = await deletePlayerRightToBeForgotten(titleId, playerId);
    expect(deleted).toBe(true);

    const playersAfter = await listTitlePlayers(titleId);
    expect(playersAfter.find(p => p.id === playerId)).toBeUndefined();
  });

  it("TEST-02-F [Studio Moderation]: banning player updates status and blocks subsequent auth tokens", async () => {
    const authResult = await authenticateDevice({
      titleId,
      deviceId: "hw_cheater_device_007",
      clientPlatform: "PC"
    });

    const playerId = authResult.player.id;
    const updated = await setPlayerStatus(titleId, playerId, "Banned");
    expect(updated.status).toBe("Banned");

    const check = await verifyPlayerJwt(authResult.token);
    expect(check.valid).toBe(false);
    expect(check.error).toBe("PLAYER_BANNED");
  });

});
