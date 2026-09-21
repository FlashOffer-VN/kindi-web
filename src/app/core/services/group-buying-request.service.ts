import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    AdminGroupBuyingListResponse,
    CreateGroupBuyingRequest,
    GetAdminGroupBuyingQuery,
    GetPublicGroupBuyingQuery,
    GroupBuyingDetailResponse,
    GroupBuyingFeedResponse,
    GroupBuyingResponse,
    JoinGroupBuyingPayload,
    JoinGroupBuyingResponse,
    UpdateGroupBuyingPayload,
    UpdateGroupBuyingStatusPayload
} from '@core/models/group-buying-request.model';

@Injectable({
    providedIn: 'root'
})
export class GroupBuyingRequestService {
    private endpoint = 'GroupBuyingRequests';

    constructor(private apiService: ApiService) { }

    // ===================== CÔNG KHAI =====================

    /**
     * Tạo yêu cầu mua chung mới (khách chưa đăng nhập vẫn tạo được)
     * POST /api/v1/GroupBuyingRequests
     */
    create(request: CreateGroupBuyingRequest): Observable<GroupBuyingResponse> {
        return this.apiService.post<GroupBuyingResponse>(this.endpoint, request);
    }

    /**
     * Feed mua chung cho tab "Mua chung": nhóm đã duyệt + nhóm của chính mình (kể cả chờ duyệt)
     * GET /api/v1/GroupBuyingRequests/public
     */
    getPublic(query: GetPublicGroupBuyingQuery = {}): Observable<GroupBuyingFeedResponse> {
        return this.apiService.get<GroupBuyingFeedResponse>(`${this.endpoint}/public`, {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 12,
            search: query.search || undefined,
            sortBy: query.sortBy || 'CreatedAt',
            sortOrder: query.sortOrder || 'desc',
            mineOnly: query.mineOnly ?? false
        });
    }

    /**
     * Chi tiết mua chung cho người dùng (liên hệ bị che nếu chưa đăng nhập)
     * GET /api/v1/GroupBuyingRequests/{id}/public
     */
    getPublicDetail(id: string): Observable<GroupBuyingDetailResponse> {
        return this.apiService.get<GroupBuyingDetailResponse>(`${this.endpoint}/${id}/public`);
    }

    /**
     * Đăng ký tham gia nhóm mua chung.
     * Khách chưa đăng nhập gửi kèm họ tên/SĐT/Zalo/email → hệ thống tạo tài khoản (username user<sđt>, mật khẩu = sđt).
     * POST /api/v1/GroupBuyingRequests/{id}/join
     */
    join(id: string, payload: JoinGroupBuyingPayload): Observable<JoinGroupBuyingResponse> {
        return this.apiService.post<JoinGroupBuyingResponse>(`${this.endpoint}/${id}/join`, payload);
    }

    /**
     * Hủy tham gia nhóm mua chung (cần đăng nhập)
     * DELETE /api/v1/GroupBuyingRequests/{id}/join
     */
    leave(id: string): Observable<GroupBuyingDetailResponse> {
        return this.apiService.delete<GroupBuyingDetailResponse>(`${this.endpoint}/${id}/join`);
    }

    // ===================== ADMIN =====================

    /**
     * Danh sách phân trang (admin: tất cả, user: của mình)
     * GET /api/v1/GroupBuyingRequests?page=&pageSize=&search=&status=
     */
    getData(query: GetAdminGroupBuyingQuery = {}): Observable<AdminGroupBuyingListResponse> {
        return this.apiService.get<AdminGroupBuyingListResponse>(this.endpoint, {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 10,
            search: query.search || undefined,
            status: query.status || undefined,
            sortBy: query.sortBy || 'CreatedAt',
            sortOrder: query.sortOrder || 'desc'
        });
    }

    /**
     * Chi tiết đầy đủ (admin — không che thông tin liên hệ)
     * GET /api/v1/GroupBuyingRequests/{id}
     */
    getById(id: string): Observable<GroupBuyingDetailResponse> {
        return this.apiService.get<GroupBuyingDetailResponse>(`${this.endpoint}/${id}`);
    }

    /**
     * Duyệt / đóng / hủy yêu cầu mua chung (Admin)
     * PUT /api/v1/GroupBuyingRequests/{id}/status
     */
    updateStatus(id: string, payload: UpdateGroupBuyingStatusPayload): Observable<GroupBuyingResponse> {
        return this.apiService.put<GroupBuyingResponse>(`${this.endpoint}/${id}/status`, payload);
    }

    /**
     * Sửa thông tin yêu cầu mua chung (Admin)
     * PUT /api/v1/GroupBuyingRequests/{id}
     */
    update(id: string, payload: UpdateGroupBuyingPayload): Observable<GroupBuyingResponse> {
        return this.apiService.put<GroupBuyingResponse>(`${this.endpoint}/${id}`, payload);
    }

    /**
     * Xóa một người khỏi nhóm mua chung (Admin)
     * DELETE /api/v1/GroupBuyingRequests/{id}/participants/{participantId}
     */
    removeParticipant(id: string, participantId: string): Observable<GroupBuyingDetailResponse> {
        return this.apiService.delete<GroupBuyingDetailResponse>(`${this.endpoint}/${id}/participants/${participantId}`);
    }

    /**
     * Hủy yêu cầu mua chung (Admin, xóa mềm)
     * DELETE /api/v1/GroupBuyingRequests/{id}
     */
    cancel(id: string): Observable<GroupBuyingResponse> {
        return this.apiService.delete<GroupBuyingResponse>(`${this.endpoint}/${id}`);
    }
}
