import Joi from "joi";

/** Configuración tipada de la aplicación */
export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  gcs: {
    bucket: string;
    projectId: string;
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
    DB_HOST: Joi.string().default("localhost"),
    DB_PORT: Joi.number().default(5432),
    DB_NAME: Joi.string().default("ciudadano"),
    DB_USER: Joi.string().default("postgres"),
    DB_PASSWORD: Joi.string().default("postgres"),
    GCS_BUCKET: Joi.string().required(),
    GCS_PROJECT_ID: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().default("15m"),
    JWT_REFRESH_EXPIRATION: Joi.string().default("7d"),
    FIREBASE_AUTH_EMULATOR_HOST: Joi.string().optional(),
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
    database: {
      host: value.DB_HOST,
      port: value.DB_PORT,
      name: value.DB_NAME,
      user: value.DB_USER,
      password: value.DB_PASSWORD,
    },
    gcs: {
      bucket: value.GCS_BUCKET,
      projectId: value.GCS_PROJECT_ID,
    },
    jwt: {
      secret: value.JWT_SECRET,
      expiration: value.JWT_EXPIRATION,
      refreshExpiration: value.JWT_REFRESH_EXPIRATION,
    },
  };
}
