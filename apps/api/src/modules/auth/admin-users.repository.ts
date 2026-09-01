import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import type { IAdminUser, UserRole } from "@ciudadano/shared";
import { UserRole as UserRoleEnum, AdminUserStatus as AdminUserStatusEnum } from "@ciudadano/shared";
import { FIRESTORE } from "../firebase/firebase.constants.js";

const ADMIN_USERS_COLLECTION = "admin_users";

/** Usuario admin con hash de contraseña (uso interno del login) */
export interface AdminUserWithPassword extends IAdminUser {
  password: string;
}

@Injectable()
export class AdminUsersRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  /** Busca usuario por email incluyendo el hash de contraseña */
  async findByEmail(email: string): Promise<AdminUserWithPassword | null> {
    const snapshot = await this.db
      .collection(ADMIN_USERS_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (snapshot.docs.length === 0) return null;
    const doc = snapshot.docs[0];
    return {
      ...this.mapAdminUser(doc.id, doc.data()!),
      password: doc.data()!.password,
    };
  }

  /** Verifica si el email ya está registrado */
  async emailExists(email: string): Promise<boolean> {
    const snapshot = await this.db
      .collection(ADMIN_USERS_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();
    return snapshot.docs.length > 0;
  }

  /** Crea usuario backoffice con estado pendiente y rol staff */
  async create(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<IAdminUser> {
    const id = randomUUID();
    const ref = this.db.collection(ADMIN_USERS_COLLECTION).doc(id);
    await ref.set({
      email: data.email,
      password: data.password,
      name: data.name,
      role: UserRoleEnum.STAFF,
      status: AdminUserStatusEnum.PENDING,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return this.mapAdminUser(doc.id, doc.data()!);
  }

  /** Lista todos los usuarios del backoffice */
  async findAll(): Promise<IAdminUser[]> {
    const snapshot = await this.db
      .collection(ADMIN_USERS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => this.mapAdminUser(doc.id, doc.data()!));
  }

  /** Actualiza el estado de aprobación de un usuario */
  async updateStatus(
    id: string,
    status: IAdminUser["status"]
  ): Promise<IAdminUser> {
    await this.ensureExists(id);
    const ref = this.db.collection(ADMIN_USERS_COLLECTION).doc(id);
    await ref.update({ status });
    const doc = await ref.get();
    return this.mapAdminUser(doc.id, doc.data()!);
  }

  /** Actualiza el rol de un usuario */
  async updateRole(id: string, role: UserRole): Promise<IAdminUser> {
    await this.ensureExists(id);
    const ref = this.db.collection(ADMIN_USERS_COLLECTION).doc(id);
    await ref.update({ role });
    const doc = await ref.get();
    return this.mapAdminUser(doc.id, doc.data()!);
  }

  /** Elimina un usuario */
  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.db.collection(ADMIN_USERS_COLLECTION).doc(id).delete();
  }

  /** Lanza NotFoundException si el documento no existe */
  private async ensureExists(id: string): Promise<void> {
    const doc = await this.db.collection(ADMIN_USERS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException("Usuario no encontrado.");
    }
  }

  /** Mapea un documento Firestore a IAdminUser (sin contraseña) */
  private mapAdminUser(id: string, data: DocumentData): IAdminUser {
    return {
      id,
      email: data.email,
      name: data.name,
      role: data.role,
      status: data.status,
      created_at: (data.createdAt as Timestamp).toDate().toISOString(),
    };
  }
}
