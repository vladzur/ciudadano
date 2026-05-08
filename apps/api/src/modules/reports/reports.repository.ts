import { Injectable } from "@nestjs/common";
import { pool } from "@ciudadano/database";
import type {
  IReport,
  IInternalNote,
  ReportStatus,
  ReportQueryParams,
  HeatmapPoint,
  PaginatedResponse,
} from "@ciudadano/shared";

interface ReportRow {
  id: string;
  description: string;
  lat: number;
  lng: number;
  image_url: string | null;
  category: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ReportsRepository {
  /** Crea una denuncia con ubicación geográfica */
  async create(data: {
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    citizenUserId?: string;
  }): Promise<IReport> {
    const result = await pool.query(
      `INSERT INTO reports (description, category, location, image_url, citizen_user_id)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6)
       RETURNING id, description, ST_Y(location) as lat, ST_X(location) as lng,
                 image_url, category, status, created_at, updated_at`,
      [data.description, data.category, data.longitude, data.latitude, data.imageUrl ?? null, data.citizenUserId ?? null]
    );
    return this.mapReport(result.rows[0]);
  }

  /** Lista denuncias con filtros y paginación */
  async findAll(params: ReportQueryParams): Promise<PaginatedResponse<IReport>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.status) {
      where += ` AND status = $${paramIndex++}`;
      values.push(params.status);
    }
    if (params.category) {
      where += ` AND category = $${paramIndex++}`;
      values.push(params.category);
    }
    if (params.startDate) {
      where += ` AND created_at >= $${paramIndex++}`;
      values.push(params.startDate);
    }
    if (params.endDate) {
      where += ` AND created_at <= $${paramIndex++}`;
      values.push(params.endDate);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM reports ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await pool.query(
      `SELECT id, description, ST_Y(location) as lat, ST_X(location) as lng,
              image_url, category, status, created_at, updated_at
       FROM reports ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    return {
      success: true,
      data: dataResult.rows.map((r: ReportRow) => this.mapReport(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Busca denuncia por ID */
  async findById(id: string): Promise<IReport | null> {
    const result = await pool.query(
      `SELECT id, description, ST_Y(location) as lat, ST_X(location) as lng,
              image_url, category, status, created_at, updated_at
       FROM reports WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.mapReport(result.rows[0]);
  }

  /** Actualiza estado de una denuncia */
  async updateStatus(id: string, status: ReportStatus): Promise<IReport> {
    const result = await pool.query(
      `UPDATE reports SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, description, ST_Y(location) as lat, ST_X(location) as lng,
                 image_url, category, status, created_at, updated_at`,
      [status, id]
    );
    return this.mapReport(result.rows[0]);
  }

  /** Crea nota interna de seguimiento */
  async createNote(data: {
    reportId: string;
    content: string;
    createdBy: string;
  }): Promise<IInternalNote> {
    const result = await pool.query(
      `INSERT INTO internal_notes (report_id, content, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, report_id, content, created_by, created_at`,
      [data.reportId, data.content, data.createdBy]
    );
    return result.rows[0];
  }

  /** Obtiene notas de una denuncia */
  async findNotes(reportId: string): Promise<IInternalNote[]> {
    const result = await pool.query(
      `SELECT id, report_id, content, created_by, created_at
       FROM internal_notes
       WHERE report_id = $1
       ORDER BY created_at DESC`,
      [reportId]
    );
    return result.rows;
  }

  /** Obtiene datos agregados para mapa de calor */
  async getHeatmapData(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<HeatmapPoint[]> {
    let where = "WHERE 1=1";
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params?.startDate) {
      where += ` AND created_at >= $${paramIndex++}`;
      values.push(params.startDate);
    }
    if (params?.endDate) {
      where += ` AND created_at <= $${paramIndex++}`;
      values.push(params.endDate);
    }
    if (params?.category) {
      where += ` AND category = $${paramIndex++}`;
      values.push(params.category);
    }

    const result = await pool.query(
      `SELECT ST_Y(location) as lat, ST_X(location) as lng,
              CASE status
                WHEN 'pending' THEN 1.0
                WHEN 'in_progress' THEN 0.5
                WHEN 'resolved' THEN 0.1
                ELSE 0.5
              END as intensity
       FROM reports ${where}`,
      values
    );
    return result.rows;
  }

  /** Obtiene estadísticas agregadas */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    pendingCount: number;
    inProgressCount: number;
    resolvedCount: number;
  }> {
    const [byStatus, byCategory] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*)::int as count FROM reports GROUP BY status`
      ),
      pool.query(
        `SELECT category, COUNT(*)::int as count FROM reports GROUP BY category`
      ),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.rows.forEach((r: { status: string; count: number }) => {
      statusMap[r.status] = r.count;
    });
    const categoryMap: Record<string, number> = {};
    byCategory.rows.forEach((r: { category: string; count: number }) => {
      categoryMap[r.category] = r.count;
    });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    return {
      total,
      byStatus: statusMap,
      byCategory: categoryMap,
      pendingCount: statusMap["pending"] ?? 0,
      inProgressCount: statusMap["in_progress"] ?? 0,
      resolvedCount: statusMap["resolved"] ?? 0,
    };
  }

  private mapReport(row: ReportRow): IReport {
    return {
      id: row.id,
      description: row.description,
      location: { lat: row.lat, lng: row.lng },
      image_url: row.image_url,
      category: row.category as IReport["category"],
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
