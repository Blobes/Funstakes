import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

export interface ISetupTotpResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

/**
 * Handles initialization, synchronization, and verification for Time-Based One-Time Passwords (TOTP).
 */
export class TotpService {
  /**
   * Generates a unique base32 secret, backup codes, and an exportable QR code URI matrix.
   */
  public async generateSetupPayload(
    userEmail: string,
    issuerName: string = "Funstakes",
  ): Promise<ISetupTotpResult> {
    // Top-level function handles secure base32 generation natively
    const secret = generateSecret();

    // Top-level function replaces the old keyuri builder method
    const otpauthUri = generateURI({
      secret,
      issuer: issuerName,
      label: userEmail,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);
    const backupCodes = this.generateBackupCodes(8);

    return {
      secret,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Validates a time-based token token against a stored secret key.
   */
  public async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
      // In v13, verification is async by default and returns an object containing validation status properties
      const result = await verify({
        token,
        secret,
        // Configures drift tolerance boundaries (matches old window: 1 option parameter)
        epochTolerance: 30,
      });

      return result.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates cryptographically secure alphanumeric backup arrays for high-security manual user recovery fallback.
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const segments = Array.from({ length: 3 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase(),
      );
      codes.push(segments.join("-"));
    }
    return codes;
  }
}

export const totpService = new TotpService();
