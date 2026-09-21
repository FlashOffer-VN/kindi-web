import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
    AdminBusinessGroupQuery,
    BusinessGroupCommentListResponse,
    BusinessGroupCommentResponse,
    BusinessGroupDetailResponse,
    BusinessGroupListResponse,
    BusinessGroupMemberListResponse,
    BusinessGroupMemberQuery,
    BusinessGroupPostListResponse,
    BusinessGroupPostResponse,
    BusinessGroupResponse,
    BusinessGroupQuery,
    ForwardedGroupListResponse,
    CreateBusinessGroupRequest,
    CreateCommunityGroupRequest,
    CreateGroupPostRequest,
    UpdateCommunityApprovalRequest,
    GroupPostQuery,
    JoinBusinessGroupRequest,
    JoinBusinessGroupResponse,
    UpdateGroupMemberStatusRequest,
    UpdateGroupPostRequest
} from '@core/models/business-group.model';

/**
 * Nhóm theo lĩnh vực kinh doanh.
 * LƯU Ý: chỉ gửi param có giá trị thật — HttpParams serialize undefined thành chuỗi "undefined"
 * khiến API lọc sai (bài học từ tab mua chung).
 */
@Injectable({
    providedIn: 'root'
})
export class BusinessGroupService {
    private readonly endpoint = 'BusinessGroups';

    constructor(private readonly api: ApiService) { }

    // ===== Công khai =====
    getPublic(query: BusinessGroupQuery = {}): Observable<BusinessGroupListResponse> {
        const params: Record<string, unknown> = {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 12,
            mineOnly: query.mineOnly ?? false
        };
        if (query.search?.trim()) params['search'] = query.search.trim();
        if (query.businessFieldId) params['businessFieldId'] = query.businessFieldId;

        return this.api.get<BusinessGroupListResponse>(`${this.endpoint}/public`, params);
    }

    /** Nhóm ngành đã có bài chuyển tiếp cho bản ghi này (admin) — cảnh báo trước khi gửi */
    getForwardedGroups(refId: string): Observable<ForwardedGroupListResponse> {
        return this.api.get<ForwardedGroupListResponse>(`${this.endpoint}/forwarded-groups`, { refId });
    }

    getPublicDetail(id: string): Observable<BusinessGroupDetailResponse> {
        return this.api.get<BusinessGroupDetailResponse>(`${this.endpoint}/${id}/public`);
    }

    // ===== Hội nhóm (người dùng tự tạo theo chủ đề) =====
    /** Danh sách hội nhóm: hội đã duyệt + hội của chính mình (mọi trạng thái) */
    getCommunity(query: BusinessGroupQuery = {}): Observable<BusinessGroupListResponse> {
        const params: Record<string, unknown> = {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 12,
            mineOnly: query.mineOnly ?? false
        };
        if (query.search?.trim()) params['search'] = query.search.trim();

        return this.api.get<BusinessGroupListResponse>(`${this.endpoint}/community`, params);
    }

    /** Người dùng tạo hội nhóm theo chủ đề (chờ admin duyệt mở hội) */
    createCommunity(request: CreateCommunityGroupRequest): Observable<BusinessGroupResponse> {
        return this.api.post<BusinessGroupResponse>(`${this.endpoint}/community`, request);
    }

    /** Admin duyệt / từ chối mở hội nhóm */
    updateCommunityApproval(id: string, request: UpdateCommunityApprovalRequest): Observable<BusinessGroupResponse> {
        return this.api.put<BusinessGroupResponse>(`${this.endpoint}/community/${id}/approval`, request);
    }

    join(id: string, request: JoinBusinessGroupRequest): Observable<JoinBusinessGroupResponse> {
        return this.api.post<JoinBusinessGroupResponse>(`${this.endpoint}/${id}/join`, request);
    }

    leave(id: string): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`${this.endpoint}/${id}/join`);
    }

    // ===== Bài đăng trong nhóm =====
    getPosts(groupId: string, query: GroupPostQuery = {}): Observable<BusinessGroupPostListResponse> {
        const params: Record<string, unknown> = {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 20
        };
        if (query.search?.trim()) params['search'] = query.search.trim();
        if (query.type) params['type'] = query.type;
        if (query.privateOnly) params['privateOnly'] = true;

        return this.api.get<BusinessGroupPostListResponse>(`${this.endpoint}/${groupId}/posts`, params);
    }

    createPost(groupId: string, request: CreateGroupPostRequest): Observable<BusinessGroupPostResponse> {
        return this.api.post<BusinessGroupPostResponse>(`${this.endpoint}/${groupId}/posts`, request);
    }

    updatePost(groupId: string, postId: string, request: UpdateGroupPostRequest): Observable<BusinessGroupPostResponse> {
        return this.api.put<BusinessGroupPostResponse>(`${this.endpoint}/${groupId}/posts/${postId}`, request);
    }

    deletePost(groupId: string, postId: string): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`${this.endpoint}/${groupId}/posts/${postId}`);
    }

    // ===== Bình luận =====
    getComments(postId: string, page = 1, pageSize = 20): Observable<BusinessGroupCommentListResponse> {
        return this.api.get<BusinessGroupCommentListResponse>(`${this.endpoint}/posts/${postId}/comments`, { page, pageSize });
    }

    createComment(postId: string, content: string, parentCommentId?: string): Observable<BusinessGroupCommentResponse> {
        return this.api.post<BusinessGroupCommentResponse>(`${this.endpoint}/posts/${postId}/comments`, { content, parentCommentId });
    }

    deleteComment(postId: string, commentId: string): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`${this.endpoint}/posts/${postId}/comments/${commentId}`);
    }

    // ===== Quản trị =====
    getAdminList(query: AdminBusinessGroupQuery = {}): Observable<BusinessGroupListResponse> {
        const params: Record<string, unknown> = {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 10
        };
        if (query.search?.trim()) params['search'] = query.search.trim();
        if (query.businessFieldId) params['businessFieldId'] = query.businessFieldId;
        if (query.isActive !== null && query.isActive !== undefined) params['isActive'] = query.isActive;
        if (query.type) params['type'] = query.type;
        if (query.approvalStatus) params['approvalStatus'] = query.approvalStatus;
        if (query.hasPendingMembers) params['hasPendingMembers'] = true;
        if (query.hasPrivateRequests) params['hasPrivateRequests'] = true;

        return this.api.get<BusinessGroupListResponse>(this.endpoint, params);
    }

    getAdminDetail(id: string): Observable<BusinessGroupDetailResponse> {
        return this.api.get<BusinessGroupDetailResponse>(`${this.endpoint}/${id}`);
    }

    create(request: CreateBusinessGroupRequest): Observable<BusinessGroupResponse> {
        return this.api.post<BusinessGroupResponse>(this.endpoint, request);
    }

    update(id: string, request: CreateBusinessGroupRequest): Observable<BusinessGroupResponse> {
        return this.api.put<BusinessGroupResponse>(`${this.endpoint}/${id}`, request);
    }

    remove(id: string): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`${this.endpoint}/${id}`);
    }

    getMembers(id: string, query: BusinessGroupMemberQuery = {}): Observable<BusinessGroupMemberListResponse> {
        const params: Record<string, unknown> = {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 20
        };
        if (query.search?.trim()) params['search'] = query.search.trim();
        if (query.status) params['status'] = query.status;

        return this.api.get<BusinessGroupMemberListResponse>(`${this.endpoint}/${id}/members`, params);
    }

    updateMemberStatus(id: string, memberId: string, request: UpdateGroupMemberStatusRequest): Observable<{ success: boolean; message: string }> {
        return this.api.put<{ success: boolean; message: string }>(
            `${this.endpoint}/${id}/members/${memberId}/status`, request);
    }

    removeMember(id: string, memberId: string): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`${this.endpoint}/${id}/members/${memberId}`);
    }

    getPrivateRequests(id: string, query: GroupPostQuery = {}): Observable<BusinessGroupPostListResponse> {
        const params: Record<string, unknown> = { page: query.page ?? 1, pageSize: query.pageSize ?? 20, privateOnly: true };
        return this.api.get<BusinessGroupPostListResponse>(`${this.endpoint}/${id}/private-requests`, params);
    }
}
