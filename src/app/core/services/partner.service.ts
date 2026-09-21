import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    Partner,
    PartnerProduct,
    PartnerStatus,
    BusinessType,
    CompanySize,
    CommissionType,
    ProductCategory,
    UpdatePartnerRequest,
    CreatePartnerProductRequest,
    UpdatePartnerProductRequest,
    getPartnerStatusLabel,
    getBusinessTypeLabel,
    getCompanySizeLabel,
    getCommissionTypeLabel,
    getProductCategoryLabel,
    PublicPartner,
    PublicPartnerQuery
} from '../models/partner.model';
import { ApiResponse, PagedResponse } from '../models/paged-response.model';

@Injectable({
    providedIn: 'root'
})
export class PartnerService {
    private readonly _baseUrl = 'partners';

    constructor(private _apiService: ApiService) { }

    /**
     * Nguồn cung công khai (trang /suppliers): chỉ trả đối tác doanh nghiệp đã được duyệt.
     * Chỉ gửi param có giá trị — HttpParams serialize undefined thành chuỗi "undefined".
     */
    getPublicSuppliers(query: PublicPartnerQuery = {}): Observable<PagedResponse<PublicPartner>> {
        const params: Record<string, unknown> = {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 12
        };
        if (query.search?.trim()) params['search'] = query.search.trim();
        if (query.businessFieldId) params['businessFieldId'] = query.businessFieldId;

        return this._apiService.get<PagedResponse<PublicPartner>>(`${this._baseUrl}/public`, params);
    }

    // ==============================
    // GET LIST
    // ==============================

    getData(
        pageNumber = 1,
        pageSize = 10,
        search = '',
        status?: PartnerStatus,
        fromDate?: string,
        toDate?: string,
        isDeleted?: boolean
    ): Observable<PagedResponse<Partner>> {
        // Backend yêu cầu pageSize trong [1, 100]
        pageSize = this.clampPageSize(pageSize);
        const params: any = {
            pageNumber,
            pageSize,
            search: search || ''
        };
        if (status !== undefined && status !== null) {
            params.status = status;
        }
        if (isDeleted !== undefined && isDeleted !== null) {
            params.isDeleted = isDeleted;
        }
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        return this._apiService.get<PagedResponse<Partner>>(this._baseUrl, params);
    }

    /**
     * Đảm bảo pageSize trong khoảng hợp lệ mà backend cho phép ([1, 100]).
     */
    private clampPageSize(pageSize: number): number {
        if (!pageSize || pageSize < 1) return 10;
        if (pageSize > 100) return 100;
        return pageSize;
    }

    // ==============================
    // GET DETAIL
    // ==============================

    getDetail(id: string): Observable<ApiResponse<Partner>> {
        return this._apiService.get<ApiResponse<Partner>>(`${this._baseUrl}/${id}`);
    }

    // ==============================
    // APPROVE
    // ==============================

    approve(id: string): Observable<ApiResponse<Partner>> {
        return this._apiService.post<ApiResponse<Partner>>(`${this._baseUrl}/${id}/approve`, {});
    }

    // ==============================
    // REJECT
    // ==============================

    reject(id: string): Observable<ApiResponse<Partner>> {
        return this._apiService.post<ApiResponse<Partner>>(`${this._baseUrl}/${id}/reject`, {});
    }

    // ==============================
    // ACTIVATE
    // ==============================

    activate(id: string): Observable<ApiResponse<Partner>> {
        return this._apiService.post<ApiResponse<Partner>>(`${this._baseUrl}/${id}/activate`, {});
    }

    // ==============================
    // UPDATE (PARTIAL)
    // ==============================

    /**
     * Cập nhật đối tác — partial update, field nào không gửi/null thì giữ nguyên.
     * PUT /api/v1/partners/{id}
     */
    update(id: string, data: UpdatePartnerRequest): Observable<ApiResponse<Partner>> {
        return this._apiService.put<ApiResponse<Partner>>(`${this._baseUrl}/${id}`, data);
    }

    // ==============================
    // SẢN PHẨM (API RIÊNG)
    // ==============================

    /** Thêm sản phẩm cho đối tác. POST /api/v1/partners/{id}/products */
    addProduct(partnerId: string, data: CreatePartnerProductRequest): Observable<ApiResponse<PartnerProduct>> {
        return this._apiService.post<ApiResponse<PartnerProduct>>(
            `${this._baseUrl}/${partnerId}/products`, data
        );
    }

    /**
     * Cập nhật sản phẩm — partial update, field nào không gửi/null thì giữ nguyên.
     * PUT /api/v1/partners/{id}/products/{productId}
     */
    updateProduct(
        partnerId: string,
        productId: string,
        data: UpdatePartnerProductRequest
    ): Observable<ApiResponse<PartnerProduct>> {
        return this._apiService.put<ApiResponse<PartnerProduct>>(
            `${this._baseUrl}/${partnerId}/products/${productId}`, data
        );
    }

    /** Xóa sản phẩm. DELETE /api/v1/partners/{id}/products/{productId} */
    deleteProduct(partnerId: string, productId: string): Observable<ApiResponse<{ message: string }>> {
        return this._apiService.delete<ApiResponse<{ message: string }>>(
            `${this._baseUrl}/${partnerId}/products/${productId}`
        );
    }

    // ==============================
    // SOFT DELETE & RESTORE (ADMIN)
    // ==============================

    /**
     * Danh sách đối tác đã xóa mềm.
     * GET /api/v1/partners/deleted?pageNumber&pageSize&search
     */
    getDeletedData(pageNumber = 1, pageSize = 10, search = ''): Observable<PagedResponse<Partner>> {
        pageSize = this.clampPageSize(pageSize);
        const params: any = { pageNumber, pageSize, search: search || '' };
        return this._apiService.get<PagedResponse<Partner>>(`${this._baseUrl}/deleted`, params);
    }

    /**
     * Xóa mềm đối tác.
     * DELETE /api/v1/partners/{id}
     */
    delete(id: string): Observable<ApiResponse<{ message: string }>> {
        return this._apiService.delete<ApiResponse<{ message: string }>>(`${this._baseUrl}/${id}`);
    }

    /**
     * Khôi phục đối tác đã xóa.
     * POST /api/v1/partners/{id}/restore
     */
    restore(id: string): Observable<ApiResponse<Partner>> {
        return this._apiService.post<ApiResponse<Partner>>(`${this._baseUrl}/${id}/restore`, {});
    }
}