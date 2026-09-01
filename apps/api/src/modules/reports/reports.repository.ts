import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  DocumentData,
  Firestore,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type {
  IReport,
  IInternalNote,
  ReportStatus,
  ReportQueryParams,
  HeatmapPoint,
  ReportStats,
  PaginatedResponse,
} from "@ciudadano/shared";
import { ReportStatus as ReportStatusEnum } from "@ciudadano/shared";
import { FIRESTORE } from "../firebase/firebase.constants.js";

const REPORTS_COLLECTION = "reports";
const NOTES_COLLECTION = "notes";

/** Límites de paginación para proteger el cursor walk */
const MAX_PAGE = 50;
const MAX_LIMIT = 1000;
/** Tamaño de lote para leer colecciones completas */
const FETCH_BATCH_SIZE = 1000;

/** Intensidad del mapa de calor según estado de la denuncia */
const HEATMAP_INTENSITY: Record<string, number> = {
  [ReportStatusEnum.PENDING]: 1.0,
  [ReportStatusEnum.IN_PROGRESS]: 0.5,
  [ReportStatusEnum.RESOLVED]: 0.1,
};

@Injectable()
export class ReportsRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  /** Crea una denuncia con ubicación geográfica */
  async create(data: {
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    citizenUserId?: string;
  }): Promise<IReport> {
    const id = randomUUID();
    const ref = this.db.collection(REPORTS_COLLECTION).doc(id);
    await ref.set({
      description: data.description,
      category: data.category,
      status: ReportStatusEnum.PENDING,
      location: { lat: data.latitude, lng: data.longitude },
      imageUrl: data.imageUrl ?? null,
      citizenUserId: data.citizenUserId ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    // Lectura posterior para devolver los timestamps reales del servidor
    const doc = await ref.get();
    return this.mapReport(doc.id, doc.data()!);
  }

  /** Lista denuncias con filtros y paginación */
  async findAll(params: ReportQueryParams): Promise<PaginatedResponse<IReport>> {
    const page = Math.min(Math.max(params.page ?? 1, 1), MAX_PAGE);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), MAX_LIMIT);

    const baseQuery = this.buildReportsQuery(params);

    // Total exacto vía agregación count()
    const countSnapshot = await baseQuery.count().get();
    const total = countSnapshot.data().count;
    const totalPages = Math.ceil(total / limit);

    // Firestore no soporta OFFSET: se recorre con cursores hasta la página pedida
    let query = baseQuery.limit(limit);
    for (let currentPage = 1; currentPage < page; currentPage++) {
      const snapshot = await query.get();
      // Sin más documentos: la página pedida queda fuera de rango
      if (snapshot.docs.length < limit) {
        return { success: true, data: [], meta: { total, page, limit, totalPages } };
      }
      query = baseQuery
        .startAfter(snapshot.docs[snapshot.docs.length - 1])
        .limit(limit);
    }

    const snapshot = await query.get();
    return {
      success: true,
      data: snapshot.docs.map((doc) => this.mapReport(doc.id, doc.data()!)),
      meta: { total, page, limit, totalPages },
    };
  }

  /** Busca denuncia por ID */
  async findById(id: string): Promise<IReport | null> {
    const doc = await this.db.collection(REPORTS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return this.mapReport(doc.id, doc.data()!);
  }

  /** Actualiza estado de una denuncia */
  async updateStatus(id: string, status: ReportStatus): Promise<IReport> {
    const ref = this.db.collection(REPORTS_COLLECTION).doc(id);
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    const doc = await ref.get();
    return this.mapReport(doc.id, doc.data()!);
  }

  /** Crea nota interna de seguimiento */
  async createNote(data: {
    reportId: string;
    content: string;
    createdBy: string;
  }): Promise<IInternalNote> {
    const id = randomUUID();
    const ref = this.db
      .collection(REPORTS_COLLECTION)
      .doc(data.reportId)
      .collection(NOTES_COLLECTION)
      .doc(id);
    await ref.set({
      reportId: data.reportId,
      content: data.content,
      createdBy: data.createdBy,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return this.mapNote(doc.id, doc.data()!);
  }

  /** Obtiene notas de una denuncia */
  async findNotes(reportId: string): Promise<IInternalNote[]> {
    const snapshot = await this.db
      .collection(REPORTS_COLLECTION)
      .doc(reportId)
      .collection(NOTES_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => this.mapNote(doc.id, doc.data()!));
  }

  /** Obtiene datos agregados para mapa de calor */
  async getHeatmapData(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<HeatmapPoint[]> {
    let query: Query = this.db.collection(REPORTS_COLLECTION);
    if (params?.startDate) {
      query = query.where("createdAt", ">=", new Date(params.startDate));
    }
    if (params?.endDate) {
      query = query.where("createdAt", "<=", new Date(params.endDate));
    }
    if (params?.category) {
      query = query.where("category", "==", params.category);
    }

    const docs = await this.fetchAll(query);
    return docs.map((doc) => {
      const data = doc.data()!;
      return {
        id: doc.id,
        lat: data.location.lat,
        lng: data.location.lng,
        intensity: HEATMAP_INTENSITY[data.status] ?? 0.5,
      };
    });
  }

  /** Obtiene estadísticas agregadas (cálculo en memoria a escala municipal) */
  async getStats(): Promise<ReportStats> {
    const docs = await this.fetchAll(this.db.collection(REPORTS_COLLECTION));

    const statusMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    for (const doc of docs) {
      const data = doc.data()!;
      statusMap[data.status] = (statusMap[data.status] ?? 0) + 1;
      categoryMap[data.category] = (categoryMap[data.category] ?? 0) + 1;
    }

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    return {
      total,
      byStatus: statusMap,
      byCategory: categoryMap,
      pendingCount: statusMap[ReportStatusEnum.PENDING] ?? 0,
      inProgressCount: statusMap[ReportStatusEnum.IN_PROGRESS] ?? 0,
      resolvedCount: statusMap[ReportStatusEnum.RESOLVED] ?? 0,
    };
  }

  /** Construye la query de denuncias con filtros y orden estable */
  private buildReportsQuery(params: ReportQueryParams): Query {
    let query: Query = this.db.collection(REPORTS_COLLECTION);
    if (params.status) query = query.where("status", "==", params.status);
    if (params.category) query = query.where("category", "==", params.category);
    if (params.startDate) {
      query = query.where("createdAt", ">=", new Date(params.startDate));
    }
    if (params.endDate) {
      query = query.where("createdAt", "<=", new Date(params.endDate));
    }
    // Tie-break por ID de documento para paginación estable
    return query.orderBy("createdAt", "desc").orderBy("__name__", "desc");
  }

  /** Lee todos los documentos de una query paginando con cursores */
  private async fetchAll(query: Query): Promise<QueryDocumentSnapshot[]> {
    const docs: QueryDocumentSnapshot[] = [];
    let last: QueryDocumentSnapshot | undefined;
    for (;;) {
      let pageQuery = query.limit(FETCH_BATCH_SIZE);
      if (last) pageQuery = pageQuery.startAfter(last);
      const snapshot = await pageQuery.get();
      docs.push(...snapshot.docs);
      if (snapshot.docs.length < FETCH_BATCH_SIZE) break;
      last = snapshot.docs[snapshot.docs.length - 1];
    }
    return docs;
  }

  /** Mapea un documento Firestore a IReport */
  private mapReport(id: string, data: DocumentData): IReport {
    return {
      id,
      description: data.description,
      location: { lat: data.location.lat, lng: data.location.lng },
      image_url: data.imageUrl ?? null,
      category: data.category as IReport["category"],
      status: data.status,
      created_at: (data.createdAt as Timestamp).toDate().toISOString(),
      updated_at: (data.updatedAt as Timestamp).toDate().toISOString(),
    };
  }

  /** Mapea un documento de nota a IInternalNote */
  private mapNote(id: string, data: DocumentData): IInternalNote {
    return {
      id,
      report_id: data.reportId,
      content: data.content,
      created_by: data.createdBy,
      created_at: (data.createdAt as Timestamp).toDate().toISOString(),
    };
  }
}
