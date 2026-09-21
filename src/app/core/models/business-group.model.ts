import { AccountCredentials } from './account.model';
import { ApiResponse } from './auth.model';
import { PagedResponse as Paged } from './paged-response.model';

/** Vai trò thành viên trong nhóm (khớp enum API GroupMemberRole) */
export enum GroupMemberRole {
    Member = 1,
    GroupAdmin = 2
}

/** Trạng thái thành viên (khớp enum API GroupMemberStatus) */
export enum GroupMemberStatus {
    Pending = 1,
    Active = 2,
    Rejected = 3,
    Left = 4
}

/** Loại bài trong nhóm (khớp enum API GroupPostType) */
export enum GroupPostType {
    Discussion = 1,
    Offer = 2,
    GroupBuyingRequest = 3,
    SupplierRequest = 4,
    Announcement = 5
}

/** Nhóm theo lĩnh vực kinh doanh */
export interface BusinessGroup {
    id: string;
    businessGroupCode?: string | null;
    name: string;
    description?: string | null;
    businessFieldId?: string | null;
    businessFieldName?: string | null;
    coverImageUrl?: string | null;
    requiresApproval: boolean;
    isActive: boolean;
    membersCount: number;
    postsCount: number;
    createdAt: string;
    myMemberStatus?: GroupMemberStatus | null;
    isMember: boolean;
    pendingMembersCount: number;
    privateRequestsCount: number;
}

export interface BusinessGroupMember {
    id: string;
    businessGroupId: string;
    userId: string;
    fullName: string;
    phone: string;
    zalo?: string | null;
    email?: string | null;
    note?: string | null;
    role: GroupMemberRole;
    status: GroupMemberStatus;
    isGuestAccount: boolean;
    joinedAt?: string | null;
    approvedAt?: string | null;
    rejectionReason?: string | null;
    createdAt: string;
}

export interface BusinessGroupDetail extends BusinessGroup {
    canViewPosts: boolean;
    isAdmin: boolean;
    members: BusinessGroupMember[];
}

export interface BusinessGroupPost {
    id: string;
    businessGroupPostCode?: string | null;
    businessGroupId: string;
    title?: string | null;
    content: string;
    type: GroupPostType;
    refId?: string | null;
    refCode?: string | null;
    isPrivateToAdmin: boolean;
    isPinned: boolean;
    isHidden: boolean;
    commentsCount: number;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface BusinessGroupComment {
    id: string;
    businessGroupPostId: string;
    userId: string;
    authorName: string;
    content: string;
    parentCommentId?: string | null;
    createdAt: string;
}

/** Kết quả xin vào nhóm */
export interface JoinBusinessGroupResult {
    memberId: string;
    status: GroupMemberStatus;
    membersCount: number;
    requiresApproval: boolean;
    isGroupActive: boolean;
    account?: AccountCredentials | null;
    message: string;
}

export interface BusinessGroupQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    businessFieldId?: string | null;
    mineOnly?: boolean;
}

export interface AdminBusinessGroupQuery extends BusinessGroupQuery {
    isActive?: boolean | null;
    hasPendingMembers?: boolean;
    hasPrivateRequests?: boolean;
}

export interface BusinessGroupMemberQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: GroupMemberStatus | null;
}

export interface GroupPostQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: GroupPostType | null;
    privateOnly?: boolean;
}

export interface JoinBusinessGroupRequest {
    fullName?: string;
    phone?: string;
    zalo?: string;
    email?: string;
    note?: string;
}

export interface CreateBusinessGroupRequest {
    name: string;
    description?: string;
    businessFieldId?: string | null;
    businessFieldName?: string | null;
    coverImageUrl?: string | null;
    requiresApproval: boolean;
    isActive: boolean;
}

export interface CreateGroupPostRequest {
    title?: string;
    content: string;
    type?: GroupPostType;
    refId?: string | null;
    refCode?: string;
    isPrivateToAdmin?: boolean;
}

export interface UpdateGroupPostRequest {
    title?: string;
    content: string;
    isPinned: boolean;
    isHidden: boolean;
}

export interface UpdateGroupMemberStatusRequest {
    status: GroupMemberStatus;
    rejectionReason?: string;
}

export interface BusinessGroupListResponse extends Paged<BusinessGroup> { }
export interface BusinessGroupDetailResponse extends ApiResponse<BusinessGroupDetail> { }
export interface JoinBusinessGroupResponse extends ApiResponse<JoinBusinessGroupResult> { }
export interface BusinessGroupPostListResponse extends Paged<BusinessGroupPost> { }
export interface BusinessGroupCommentListResponse extends Paged<BusinessGroupComment> { }
export interface BusinessGroupMemberListResponse extends Paged<BusinessGroupMember> { }
export interface BusinessGroupResponse extends ApiResponse<BusinessGroup> { }
export interface BusinessGroupPostResponse extends ApiResponse<BusinessGroupPost> { }
export interface BusinessGroupCommentResponse extends ApiResponse<BusinessGroupComment> { }
