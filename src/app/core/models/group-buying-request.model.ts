// src/app/core/models/group-buying-request.model.ts
import { ApiResponse } from './auth.model';
import { PagedResponse as Paged } from './paged-response.model';

export interface GroupBuyingRequest {
    id: string;
    groupBuyingRequestCode?: string | null;
    productName: string;
    productLink: string | null;
    targetPeopleCount: number;
    currentPeopleCount: number;
    neededPeopleCount?: number;
    targetPrice: number;
    fullName: string;
    phone: string;
    zalo: string | null;
    email: string;
    note: string | null;
    status: GroupBuyingStatus;
    businessFieldId?: string | null;
    businessFieldName?: string | null;
    createdAt: string;
    approvedAt?: string | null;
    closedReason?: string | null;
}

export enum GroupBuyingStatus {
    PENDING = 1,    // Chờ duyệt
    ACTIVE = 2,     // Đang hoạt động (đã duyệt)
    COMPLETED = 3,  // Hoàn thành
    CANCELLED = 4   // Đã hủy (bao gồm cả reject và cancel)
}

// Helper để lấy tên status hiển thị
export const GroupBuyingStatusLabel: Record<GroupBuyingStatus, string> = {
    [GroupBuyingStatus.PENDING]: 'GROUP_BUYING.STATUS.PENDING',
    [GroupBuyingStatus.ACTIVE]: 'GROUP_BUYING.STATUS.ACTIVE',
    [GroupBuyingStatus.COMPLETED]: 'GROUP_BUYING.STATUS.COMPLETED',
    [GroupBuyingStatus.CANCELLED]: 'GROUP_BUYING.STATUS.CANCELLED'
};

// Helper để lấy màu badge
export const GroupBuyingStatusColor: Record<GroupBuyingStatus, string> = {
    [GroupBuyingStatus.PENDING]: 'warning',
    [GroupBuyingStatus.ACTIVE]: 'info',
    [GroupBuyingStatus.COMPLETED]: 'success',
    [GroupBuyingStatus.CANCELLED]: 'danger'
};

export interface CreateGroupBuyingRequest {
    productName: string;
    productLink?: string;
    targetPeopleCount: number;
    targetPrice: number;
    fullName: string;
    phone: string;
    zalo?: string;
    email: string;
    note?: string;
}

// ===== Tab "Mua chung" trên trang social =====

/** Item trên feed mua chung (chỉ thông tin cơ bản + tiến độ số người). */
export interface GroupBuyingFeedItem {
    id: string;
    groupBuyingRequestCode: string | null;
    productName: string;
    productLink: string | null;
    targetPrice: number | null;
    targetPeopleCount: number;
    currentPeopleCount: number;
    neededPeopleCount: number;
    status: GroupBuyingStatus;
    note: string | null;
    businessFieldName: string | null;
    creatorName: string;
    createdAt: string;
    isMine: boolean;
    isJoinedByMe: boolean;
    canJoin: boolean;
    /** Tên người đã tham gia (đã rút gọn) */
    participants: string[];
}

export interface GroupBuyingParticipant {
    id: string;
    userId: string;
    userCode: string | null;
    collaboratorCode: string | null;
    fullName: string;
    phone: string;
    zalo: string | null;
    email: string | null;
    note: string | null;
    isCreator: boolean;
    isGuestAccount: boolean;
    status: number;
    isMe: boolean;
    createdAt: string;
}

/** Chi tiết một yêu cầu mua chung (bấm vào item trên tab Mua chung). */
export interface GroupBuyingDetail {
    id: string;
    groupBuyingRequestCode: string | null;
    productName: string;
    productLink: string | null;
    targetPrice: number | null;
    targetPeopleCount: number;
    currentPeopleCount: number;
    neededPeopleCount: number;
    status: GroupBuyingStatus;
    note: string | null;
    businessFieldId: string | null;
    businessFieldName: string | null;
    createdAt: string;
    approvedAt: string | null;
    closedReason: string | null;
    creatorName: string;
    creatorPhone: string;
    creatorZalo: string | null;
    creatorEmail: string | null;
    isMine: boolean;
    isJoinedByMe: boolean;
    canJoin: boolean;
    joinBlockedReason: string | null;
    participants: GroupBuyingParticipant[];
}

/** Khách chưa đăng nhập phải gửi họ tên + SĐT; người đã đăng nhập chỉ cần ghi chú. */
export interface JoinGroupBuyingPayload {
    fullName?: string;
    phone?: string;
    zalo?: string;
    email?: string;
    note?: string;
}

export interface JoinGroupBuyingResult {
    participantId: string;
    currentPeopleCount: number;
    targetPeopleCount: number;
    neededPeopleCount: number;
    isGroupFull: boolean;
    isNewAccount: boolean;
    username: string | null;
    passwordIsPhone: boolean;
    accountAlreadyExisted: boolean;
    message: string;
}

export interface GetPublicGroupBuyingQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    /** true = chỉ lấy nhóm do chính mình mở (kể cả đang chờ duyệt). */
    mineOnly?: boolean;
}

export interface GetAdminGroupBuyingQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface UpdateGroupBuyingStatusPayload {
    status: number;
    reason?: string;
}

export interface UpdateGroupBuyingPayload {
    productName?: string;
    productLink?: string;
    targetPeopleCount?: number;
    targetPrice?: number;
    note?: string;
}

export interface GroupBuyingResponse extends ApiResponse<GroupBuyingRequest> { }
export interface GroupBuyingListResponse extends ApiResponse<GroupBuyingRequest[]> { }
export interface GroupBuyingFeedResponse extends Paged<GroupBuyingFeedItem> { }
export interface GroupBuyingDetailResponse extends ApiResponse<GroupBuyingDetail> { }
export interface JoinGroupBuyingResponse extends ApiResponse<JoinGroupBuyingResult> { }
export interface AdminGroupBuyingListResponse extends Paged<GroupBuyingRequest> { }
