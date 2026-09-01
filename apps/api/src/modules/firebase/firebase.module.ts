import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { initializeApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import { FIREBASE_APP, FIRESTORE } from "./firebase.constants.js";

/**
 * Módulo global de Firebase: centraliza la inicialización del Admin SDK
 * y expone la instancia de App y Firestore para inyección en otros módulos.
 */
@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): App => {
        const projectId = configService.get<string>("gcs.projectId");
        // Avisar en desarrollo cuando se usa el emulador de Firebase Auth
        if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
          console.log(
            `Firebase Auth: usando emulador en ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
          );
        }
        try {
          return initializeApp({ projectId });
        } catch {
          // La app ya fue inicializada en este proceso
          return getApp();
        }
      },
    },
    {
      provide: FIRESTORE,
      inject: [FIREBASE_APP],
      useFactory: (app: App): Firestore => getFirestore(app),
    },
  ],
  exports: [FIREBASE_APP, FIRESTORE],
})
export class FirebaseModule {}
