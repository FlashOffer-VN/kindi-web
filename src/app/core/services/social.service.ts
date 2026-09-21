import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
    SocialPost,
    SocialMember,
    SocialGroup,
    SocialComment,
    CreatePostRequest,
    GetPostsQuery,
    UpdatePostRequest
} from '../models/social.model';
import { PagedResponse } from '@core/models/paged-response.model';
import { ApiResponse } from '@core/models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class SocialService {
    private readonly _baseSocialUrl = 'Social';
    private readonly _baseSocialInteractionUrl = 'socialInteraction';

    constructor(private _apiService: ApiService) { }

    _mockPosts = [];

    // ===== POSTS =====
    getPosts(query: GetPostsQuery = {}): Observable<PagedResponse<SocialPost>> {
        const params: any = {
            pageNumber: query.pageNumber || 1,
            pageSize: query.pageSize || 10
        };
        if (query.type) params.type = query.type;
        if (query.privacy) params.privacy = query.privacy;
        if (query.tag) params.tag = query.tag;

        return this._apiService.get<PagedResponse<SocialPost>>(
            `${this._baseSocialUrl}/posts`,
            params
        );
    }

    getPendingPosts(pageNumber = 1, pageSize = 10): Observable<PagedResponse<SocialPost>> {
        return this._apiService.get<PagedResponse<SocialPost>>(
            `${this._baseSocialUrl}/posts/pending`,
            { pageNumber, pageSize }
        );
    }

    /**
     * Admin: danh sách bài viết theo trạng thái (approved/pending/deleted/all).
     */
    getAdminPosts(
        status: string | null,
        pageNumber = 1,
        pageSize = 10,
        search = '',
        fromDate?: string,
        toDate?: string
    ): Observable<PagedResponse<SocialPost>> {
        // Backend yêu cầu pageSize trong [1, 100]
        pageSize = this.clampPageSize(pageSize);
        const params: any = { pageNumber, pageSize };
        if (status) params.status = status;
        if (search) params.search = search;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        return this._apiService.get<PagedResponse<SocialPost>>(
            `${this._baseSocialUrl}/posts/admin`,
            params
        );
    }

    /**
     * Đảm bảo pageSize trong khoảng hợp lệ mà backend cho phép ([1, 100]).
     */
    private clampPageSize(pageSize: number): number {
        if (!pageSize || pageSize < 1) return 10;
        if (pageSize > 100) return 100;
        return pageSize;
    }

    /**
     * Admin: khôi phục bài viết đã xóa.
     */
    restorePost(id: string): Observable<SocialPost> {
        return this._apiService.post<SocialPost>(`${this._baseSocialUrl}/posts/${id}/restore`, {});
    }

    /**
     * Upload ảnh lên server, trả url tương đối để gắn vào post.
     * API trả ApiResponse<{ url }> -> map lấy data.url.
     */
    uploadImage(file: Blob, fileName: string): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file, fileName);
        return this._apiService
            .uploadMultipart<ApiResponse<{ url: string }>>('Files/upload', formData)
            .pipe(map(r => r.data ?? { url: '' }));
    }

    approvePost(id: string): Observable<SocialPost> {
        return this._apiService.post<SocialPost>(`${this._baseSocialUrl}/posts/${id}/approve`, {});
    }

    rejectPost(id: string, reason = ''): Observable<SocialPost> {
        return this._apiService.post<SocialPost>(
            `${this._baseSocialUrl}/posts/${id}/reject`,
            reason
        );
    }

    // ===== PIN / UNPIN (Admin ghim) =====
    pinPost(id: string): Observable<SocialPost> {
        return this._apiService.post<SocialPost>(
            `${this._baseSocialUrl}/posts/${id}/pin`,
            {}
        );
    }

    unpinPost(id: string): Observable<SocialPost> {
        return this._apiService.post<SocialPost>(
            `${this._baseSocialUrl}/posts/${id}/unpin`,
            {}
        );
    }

    getPostById(id: string): Observable<any> {
        return this._apiService.get<SocialPost>(`${this._baseSocialUrl}/posts/${id}`);
    }

    createPost(data: CreatePostRequest): Observable<SocialPost> {
        return this._apiService.post<SocialPost>(`${this._baseSocialUrl}/posts`, data);
    }

    updatePost(id: string, data: UpdatePostRequest): Observable<SocialPost> {
        return this._apiService.put<SocialPost>(`${this._baseSocialUrl}/posts/${id}`, data);
    }

    deletePost(id: string): Observable<void> {
        return this._apiService.delete<void>(`${this._baseSocialUrl}/posts/${id}`);
    }

    // ===== MEMBERS =====
    // ❌ CHƯA CÓ API - Giữ mock
    getMembers(): Observable<SocialMember[]> {
        const members: SocialMember[] = [
            // Mock data
        ];
        return of(members).pipe(delay(300));
    }

    // ===== GROUPS =====
    // ❌ CHƯA CÓ API - Giữ mock
    getGroups(): Observable<SocialGroup[]> {
        const groups: SocialGroup[] = [
            { id: 1, name: 'Công nghệ & Khởi nghiệp', description: 'Thảo luận về công nghệ và xu hướng khởi nghiệp', icon: 'fa-solid fa-microchip', members: 120, posts: 45, isJoined: true, isPrivate: false },
            { id: 2, name: 'Marketing & Branding', description: 'Chia sẻ kiến thức marketing và xây dựng thương hiệu', icon: 'fa-solid fa-bullhorn', members: 85, posts: 32, isJoined: false, isPrivate: false },
            { id: 3, name: 'Tài chính & Đầu tư', description: 'Thảo luận về tài chính doanh nghiệp và đầu tư', icon: 'fa-solid fa-chart-line', members: 60, posts: 28, isJoined: false, isPrivate: true },
        ];
        return of(groups).pipe(delay(300));
    }

    // ===== INTERACTIONS =====
    likePost(postId: any): Observable<{ success: boolean }> {
        const url = `${this._baseSocialInteractionUrl}/posts/${postId}/like`;
        return this._apiService.post(url, {})
    }

    getLikeStatus(postId: any): Observable<any> {
        const url = `${this._baseSocialInteractionUrl}/posts/${postId}/like-status`;
        return this._apiService.get(url, {})
    }

    // ❌ CHƯA CÓ API - Giữ mock
    savePost(postId: any): Observable<{ success: boolean }> {
        // const post = this._mockPosts.find(p => p.id === postId);
        // if (post) {
        //     post.isSaved = !post.isSaved;
        // }
        return of({ success: true }).pipe(delay(200));
    }

    sharePost(postId: string): Observable<ApiResponse<any>> {
        const url = `${this._baseSocialInteractionUrl}/posts/${postId}/share`;
        return this._apiService.post<ApiResponse<any>>(url, {});
    }
}