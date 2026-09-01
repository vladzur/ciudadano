import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { getAuth } from "firebase-admin/auth";
import type { App } from "firebase-admin/app";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { ICitizenUser } from "@ciudadano/shared";
import { FIREBASE_APP } from "../firebase/firebase.constants.js";
import { CitizenUsersRepository } from "./citizen-users.repository.js";

@Injectable()
export class FirebaseAuthService {
  constructor(
    @Inject(FIREBASE_APP) private readonly firebaseApp: App,
    private readonly citizenUsersRepository: CitizenUsersRepository
  ) {}

  /** Verifica token Firebase ID y hace upsert del usuario ciudadano */
  async verifyCitizenToken(idToken: string): Promise<{
    citizenUser: ICitizenUser;
    firebaseUid: string;
  }> {
    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(this.firebaseApp).verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException("Token de Firebase inválido.");
    }

    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const displayName = decoded.name ?? null;
    const provider = decoded.firebase.sign_in_provider;

    const citizenUser = await this.citizenUsersRepository.upsertByFirebaseUid({
      uid,
      email,
      displayName,
      provider,
    });

    return { citizenUser, firebaseUid: uid };
  }
}
