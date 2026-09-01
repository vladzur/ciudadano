import { Inject, Injectable } from "@nestjs/common";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import type { ICitizenUser } from "@ciudadano/shared";
import { FIRESTORE } from "../firebase/firebase.constants.js";

const CITIZEN_USERS_COLLECTION = "citizen_users";

@Injectable()
export class CitizenUsersRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  /**
   * Crea o actualiza el ciudadano usando firebase_uid como ID del documento.
   * En logins posteriores solo se actualiza lastLogin, preservando createdAt.
   */
  async upsertByFirebaseUid(data: {
    uid: string;
    email: string | null;
    displayName: string | null;
    provider: string;
  }): Promise<ICitizenUser> {
    const ref = this.db.collection(CITIZEN_USERS_COLLECTION).doc(data.uid);
    const existing = await ref.get();

    if (existing.exists) {
      await ref.update({
        email: data.email,
        displayName: data.displayName,
        lastLogin: FieldValue.serverTimestamp(),
      });
    } else {
      await ref.set({
        id: data.uid,
        email: data.email,
        displayName: data.displayName,
        provider: data.provider,
        createdAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
      });
    }

    const doc = await ref.get();
    return this.mapCitizenUser(doc.id, doc.data()!);
  }

  /** Mapea un documento Firestore a ICitizenUser */
  private mapCitizenUser(id: string, data: DocumentData): ICitizenUser {
    return {
      id: data.id ?? id,
      firebase_uid: id,
      email: data.email ?? null,
      display_name: data.displayName ?? null,
      provider: data.provider,
      created_at: (data.createdAt as Timestamp).toDate().toISOString(),
      last_login: (data.lastLogin as Timestamp).toDate().toISOString(),
    };
  }
}
