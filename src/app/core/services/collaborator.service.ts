import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    Collaborator,
    CollaboratorStatus,
    CreateCollaboratorRequest,
    UpdateCollaboratorRequest,
    SalesChannelOption,
    SALES_CHANNEL_OPTIONS
} from '../models/collaborator.model';
import { ApiResponse, PagedResponse } from '@core/models/paged-response.model';

@Injectable({ providedIn: 'root' })
export class CollaboratorService {
    private readonly _baseUrl = 'Collaborators';

    constructor(private _apiService: ApiService) { }

    /**
     * Đăng ký cộng tác viên mới
     */
    register(data: CreateCollaboratorRequest): Observable<{ success: boolean; message: string; data: Collaborator }> {
        return this._apiService.post<{ success: boolean; message: string; data: Collaborator }>(this._baseUrl, data);
    }

    /**
     * Lấy danh sách cộng tác viên phân trang (Admin)
     * GET /api/v1/Collaborators?page=&size=&search=&status=&fromDate=&toDate=
     */
    getData(
        pageNumber = 1,
        pageSize = 10,
        search = '',
        status?: CollaboratorStatus,
        fromDate?: string,
        toDate?: string
    ): Observable<PagedResponse<Collaborator>> {
        // Backend yêu cầu pageSize trong [1, 100]
        pageSize = this.clampPageSize(pageSize);
        const params: any = { page: pageNumber, size: pageSize, search };
        if (status !== undefined) params.status = status;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        return this._apiService.get<PagedResponse<Collaborator>>(this._baseUrl, params);
    }

    /**
     * Danh sách cộng tác viên đã xóa (Admin)
     * GET /api/v1/Collaborators/deleted?page=&size=&search=&fromDate=&toDate=
     */
    getDeletedData(
        pageNumber = 1,
        pageSize = 10,
        search = '',
        fromDate?: string,
        toDate?: string
    ): Observable<PagedResponse<Collaborator>> {
        pageSize = this.clampPageSize(pageSize);
        const params: any = { page: pageNumber, size: pageSize, search };
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        return this._apiService.get<PagedResponse<Collaborator>>(`${this._baseUrl}/deleted`, params);
    }

    /**
     * 5 kênh bán hàng dùng trong form đăng ký (label lấy từ i18n).
     */
    getSalesChannels(): SalesChannelOption[] {
        return SALES_CHANNEL_OPTIONS;
    }

    private clampPageSize(pageSize: number): number {
        if (!pageSize || pageSize < 1) return 10;
        if (pageSize > 100) return 100;
        return pageSize;
    }

    /**
     * Lấy cộng tác viên theo Id
     */
    getById(id: string): Observable<ApiResponse<Collaborator>> {
        return this._apiService.get<ApiResponse<Collaborator>>(`${this._baseUrl}/${id}`);
    }

    /**
     * Cập nhật cộng tác viên — partial update, field nào không gửi/null thì giữ nguyên.
     */
    update(id: string, data: UpdateCollaboratorRequest): Observable<ApiResponse<Collaborator>> {
        return this._apiService.put<ApiResponse<Collaborator>>(`${this._baseUrl}/${id}`, data);
    }

    /**
     * Duyệt cộng tác viên
     */
    approve(id: string): Observable<{ success: boolean; message: string }> {
        return this._apiService.post<{ success: boolean; message: string }>(`${this._baseUrl}/${id}/approve`, {});
    }

    /**
     * Từ chối cộng tác viên
     */
    reject(id: string, reason?: string): Observable<{ success: boolean; message: string }> {
        return this._apiService.post<{ success: boolean; message: string }>(`${this._baseUrl}/${id}/reject`, { reason });
    }

    /**
     * Xóa cộng tác viên
     */
    delete(id: string): Observable<{ success: boolean; message: string }> {
        return this._apiService.delete<{ success: boolean; message: string }>(`${this._baseUrl}/${id}`);
    }

    /**
     * Khôi phục cộng tác viên
     */
    restore(id: string): Observable<{ success: boolean; message: string }> {
        return this._apiService.post<{ success: boolean; message: string }>(`${this._baseUrl}/${id}/restore`, {});
    }
}