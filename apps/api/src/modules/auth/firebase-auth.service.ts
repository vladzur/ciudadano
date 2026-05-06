import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { pool } from "@ciudadano/database";
import type { ICitizenUser } from "@ciudadano/shared";

@Injectable()
export class FirebaseAuthService {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>("gcs.projectId");
    this.firebaseApp = admin.initializeApp({ projectId });
  }

  /** Verifica token Firebase ID y hace upsert del usuario ciudadano */
  async verifyCitizenToken(idToken: string): Promise<{
    citizenUser: ICitizenUser;
    firebaseUid: string;
  }> {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebaseApp.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException("Token de Firebase inválido.");
    }

    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const displayName = decoded.name ?? null;
    const provider = decoded.firebase.sign_in_provider;

    const result = await pool.query(
      `INSERT INTO citizen_users (firebase_uid, email, display_name, provider, last_login)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (firebase_uid) DO UPDATE
         SET email = $2, display_name = $3, last_login = NOW()
       RETURNING id, firebase_uid, email, display_name, provider, created_at, last_login`,
      [uid, email, displayName, provider]
    );

    const row = result.rows[0];
    const citizenUser: ICitizenUser = {
      id: row.id,
      firebase_uid: row.firebase_uid,
      email: row.email,
      display_name: row.display_name,
      provider: row.provider,
      created_at: row.created_at,
      last_login: row.last_login,
    };

    return { citizenUser, firebaseUid: uid };
  }
}
