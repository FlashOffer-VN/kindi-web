import { BusinessInfo } from './business-info.model';

export interface Collaborator {
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    zalo?: string;
    email?: string;
    position?: string;
    skills?: string;
    interests?: string;
    goals?: string;
    salesChannel?: number;
    experience?: string;
    agreeTerms: boolean;
    parentCollaboratorId?: string;
    businessFieldId?: string | null;
    businessFieldName?: string | null;
    level: number;
    referralCode?: string;
    status: CollaboratorStatus;
    isApproved: boolean;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt?: string;

    /**
     * Thông tin doanh nghiệp — backend trả object lồng `businessInfo` (contract cũ)
     * hoặc `companyInfo` (response thực tế). Nếu backend chỉ trả field phẳng ở root
     * thì các field dưới đây là fallback.
     */
    businessInfo?: BusinessInfo;
    companyInfo?: BusinessInfo;
    companyId?: string;
    companyName?: string;
    companyTax?: string;
    companyAddress?: string;
    companyWebsite?: string;
    businessName?: string;
    address?: string;
    website?: string;
    businessSize?: number;
}

export enum CollaboratorStatus {
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Suspended = 4,
    Active = 5
}

export interface CreateCollaboratorRequest {
    fullName: string;
    phone: string;
    zalo?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
    position?: string;
    skills?: string;
    interests?: string;
    goals?: string;
    salesChannel?: number;
    experience?: string;
    agreeTerms: boolean;
    businessName?: string;
    /** Id lĩnh vực hoạt động (BusinessField — quản lý tập trung). */
    businessFieldId?: string;
    /** Tên lĩnh vực; API dùng find-or-create khi không có businessFieldId. */
    businessFieldName?: string;
    businessSize?: number;
    address?: string;
    website?: string;
    parentCollaboratorId?: string;
}

export interface UpdateCollaboratorRequest {
    fullName?: string;
    phone?: string;
    zalo?: string;
    email?: string;
    position?: string;
    skills?: string;
    interests?: string;
    goals?: string;
    salesChannel?: number;
    experience?: string;

    // Thông tin doanh nghiệp
    address?: string;
    businessName?: string;
    businessSize?: number;
    website?: string;

    /** Id lĩnh vực — ưu tiên hơn businessFieldName. */
    businessFieldId?: string | null;
    /** Tên lĩnh vực — fallback find-or-create cho client chưa gửi Id. */
    businessFieldName?: string;
}

/**
 * Quy mô doanh nghiệp của cộng tác viên (khác Partner: CTV có 5 mức, Partner 4 mức).
 * value khớp `businessSize` mà backend nhận.
 */
export const BUSINESS_SIZES = [
    { value: 1, label: 'COMMON.BUSINESS_SIZE.SIZE_1_10' },
    { value: 2, label: 'COMMON.BUSINESS_SIZE.SIZE_11_50' },
    { value: 3, label: 'COMMON.BUSINESS_SIZE.SIZE_51_200' },
    { value: 4, label: 'COMMON.BUSINESS_SIZE.SIZE_201_500' },
    { value: 5, label: 'COMMON.BUSINESS_SIZE.SIZE_500_PLUS' }
];

export interface CollaboratorFilter {
    search?: string;
    status?: CollaboratorStatus;
    fromDate?: string;
    toDate?: string;
}

export const STATUS_LABEL: Record<CollaboratorStatus, string> = {
    [CollaboratorStatus.Pending]: 'Đang chờ duyệt',
    [CollaboratorStatus.Approved]: 'Đã duyệt',
    [CollaboratorStatus.Rejected]: 'Từ chối',
    [CollaboratorStatus.Suspended]: 'Tạm khóa',
    [CollaboratorStatus.Active]: 'Hoạt động'
};

export const STATUS_VARIANT: Record<CollaboratorStatus, string> = {
    [CollaboratorStatus.Pending]: 'warning',
    [CollaboratorStatus.Approved]: 'success',
    [CollaboratorStatus.Rejected]: 'danger',
    [CollaboratorStatus.Suspended]: 'secondary',
    [CollaboratorStatus.Active]: 'success'
};
// ===== Enum/helper dùng chung (gộp từ ctv.model.ts + ctv-registration.model.ts) =====

export enum SalesChannel {
    Retail = 1,
    Wholesale = 2,
    Online = 3,
    Offline = 4,
    Other = 5
}

export interface SalesChannelOption {
    value: SalesChannel;
    label: string;
}

/** 5 kênh bán hàng — label lấy từ i18n. */
export const SALES_CHANNEL_OPTIONS: SalesChannelOption[] = [
    { value: SalesChannel.Retail, label: 'FIND_SUPPLIER.SALES_CHANNEL_RETAIL' },
    { value: SalesChannel.Wholesale, label: 'FIND_SUPPLIER.SALES_CHANNEL_WHOLESALE' },
    { value: SalesChannel.Online, label: 'FIND_SUPPLIER.SALES_CHANNEL_ONLINE' },
    { value: SalesChannel.Offline, label: 'FIND_SUPPLIER.SALES_CHANNEL_OFFLINE' },
    { value: SalesChannel.Other, label: 'FIND_SUPPLIER.SALES_CHANNEL_OTHER' }
];

/** Tên hiển thị (key i18n) của kênh bán hàng. */
export function getSalesChannelLabel(channel: SalesChannel): string {
    const labels: Record<SalesChannel, string> = {
        [SalesChannel.Retail]: 'FIND_SUPPLIER.SALES_CHANNEL_RETAIL',
        [SalesChannel.Wholesale]: 'FIND_SUPPLIER.SALES_CHANNEL_WHOLESALE',
        [SalesChannel.Online]: 'FIND_SUPPLIER.SALES_CHANNEL_ONLINE',
        [SalesChannel.Offline]: 'FIND_SUPPLIER.SALES_CHANNEL_OFFLINE',
        [SalesChannel.Other]: 'FIND_SUPPLIER.SALES_CHANNEL_OTHER'
    };
    return labels[channel] || channel.toString();
}

/** Tên hiển thị (key i18n) của trạng thái cộng tác viên. */
export function getCollaboratorStatusLabel(status: CollaboratorStatus): string {
    const labels: Record<CollaboratorStatus, string> = {
        [CollaboratorStatus.Pending]: 'COMMON.STATUS.PENDING',
        [CollaboratorStatus.Approved]: 'COMMON.STATUS.APPROVED',
        [CollaboratorStatus.Rejected]: 'COMMON.STATUS.REJECTED',
        [CollaboratorStatus.Suspended]: 'COMMON.STATUS.SUSPENDED',
        [CollaboratorStatus.Active]: 'COMMON.STATUS.APPROVED'
    };
    return labels[status] || status.toString();
}
