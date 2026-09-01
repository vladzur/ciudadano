import Joi from "joi";

/** Configuración tipada de la aplicación */
export interface AppConfig {
  port: number;
  gcs: {
    bucket: string;
    projectId: string;
    serviceAccountKey?: string;
  };
  jwt: {
    secret: string;
    expiration: string;
    refreshExpiration: string;
  };
}

/** Valida y carga variables de entorno */
export function configuration(): AppConfig {
  const schema = Joi.object({
    PORT: Joi.number().default(3000),
    GCS_BUCKET: Joi.string().required(),
    GCS_PROJECT_ID: Joi.string().required(),
    GCS_SERVICE_ACCOUNT_KEY: Joi.string().optional(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().default("15m"),
    JWT_REFRESH_EXPIRATION: Joi.string().default("7d"),
    FIREBASE_AUTH_EMULATOR_HOST: Joi.string().optional(),
    FIRESTORE_EMULATOR_HOST: Joi.string().optional(),
  });

  const { value, error } = schema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    throw new Error(`Error de configuración: ${error.message}`);
  }

  return {
    port: value.PORT,
    gcs: {
      bucket: value.GCS_BUCKET,
      projectId: value.GCS_PROJECT_ID,
      serviceAccountKey: value.GCS_SERVICE_ACCOUNT_KEY,
    },
    jwt: {
      secret: value.JWT_SECRET,
      expiration: value.JWT_EXPIRATION,
      refreshExpiration: value.JWT_REFRESH_EXPIRATION,
    },
  };
}
