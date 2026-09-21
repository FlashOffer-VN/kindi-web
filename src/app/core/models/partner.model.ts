// ==============================
// 1. ENUMS
// ==============================

import { BusinessInfo } from './business-info.model';
import { AccountCredentials } from './account.model';

export enum BusinessType {
    SME = 1,
    SoleProprietor = 2,
    Partnership = 3,
    Corporation = 4,
    Limited = 5,
    Other = 6
}

export enum CompanySize {
    Size1_10 = 1,
    Size11_50 = 2,
    Size51_200 = 3,
    Size200Plus = 4,
    Size500Plus = 5
}

export enum PartnerStatus {
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Active = 4
}

export enum CommissionType {
    Percentage = 1,
    Fixed = 2,
    Tiered = 3
}

export enum ProductCategory {
    Electronics = 1,
    Fashion = 2,
    Food = 3,
    Beauty = 4,
    Home = 5,
    Other = 6
}

// ==============================
// 2. API RESPONSE
// ==============================

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors: string[] | null;
    timestamp: string;
}

export interface PagedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    timestamp: string;
}

// ==============================
// 3. REQUEST MODELS (GỬI LÊN API)
// ==============================

export interface PartnerRegisterRequest {
    // Step 1: Personal Info (+ mã giới thiệu)
    fullName: string;
    email: string;
    phone: string;
    position: string;
    referralCode?: string;

    // Step 2: Business Info (lĩnh vực hoạt động quản lý tập trung qua BusinessField)
    companyName: string;
    companyAddress: string;
    businessFieldId?: string;
    companySize: CompanySize;
    products: ProductInfoRequest[];

    // Step 3: Confirmation
    agreeTerms: boolean;
}

export interface ProductInfoRequest {
    name: string;
    description?: string;
}

/**
 * Cập nhật đối tác (PUT /partners/{id}) — partial update:
 * field nào `null` thì backend giữ nguyên giá trị cũ.
 *
 * Không sửa được: partnerCode, status (có endpoint riêng), userId, referralCode.
 *
 * SẢN PHẨM KHÔNG nằm trong payload này — quản lý qua API riêng:
 *   POST   /partners/{id}/products
 *   PUT    /partners/{id}/products/{productId}
 *   DELETE /partners/{id}/products/{productId}
 */
export interface UpdatePartnerRequest {
    // Thông tin cá nhân
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    position?: string | null;

    // Thông tin doanh nghiệp
    companyName?: string | null;
    companyTax?: string | null;
    companyAddress?: string | null;
    companyWebsite?: string | null;
    businessType?: BusinessType | null;
    companySize?: CompanySize | null;
    note?: string | null;

    /** Lĩnh vực kinh doanh (BusinessField). */
    businessFieldId?: string | null;
}

/**
 * Tạo sản phẩm cho đối tác (POST /partners/{id}/products).
 * Các field số/danh mục bỏ trống sẽ được backend gán mặc định
 * (Category = Other, giá = 0, số lượng tối thiểu = 1).
 */
export interface CreatePartnerProductRequest {
    name: string;
    description?: string | null;
    category?: ProductCategory | null;
    retailPrice?: number | null;
    wholesalePrice?: number | null;
    minOrderQuantity?: number | null;
}

/**
 * Cập nhật sản phẩm (PUT /partners/{id}/products/{productId}) — partial update:
 * field nào `null` thì backend giữ nguyên.
 */
export interface UpdatePartnerProductRequest {
    name?: string | null;
    description?: string | null;
    category?: ProductCategory | null;
    retailPrice?: number | null;
    wholesalePrice?: number | null;
    minOrderQuantity?: number | null;
}

// ==============================
// 4. RESPONSE MODELS (NHẬN TỪ API)
// ==============================

export interface PartnerRegisterResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        partnerCode: string;
        status: PartnerStatus;
        registeredAt: string;
        /** Tài khoản vừa tạo/dùng lại khi đăng ký công khai (username user<sđt>, mật khẩu = SĐT) */
        account?: AccountCredentials | null;
    };
    errors: string[] | null;
    timestamp: string;
}

// ==============================
// 5. ENTITY MODELS (DÙNG TRONG UI)
// ==============================

export interface Partner {
    id: string;
    userId: string;
    partnerCode: string;
    fullName: string;
    phone: string;
    email: string;
    position: string;
    companyName: string;
    companyTax: string;
    companyAddress: string;
    businessType: BusinessType;
    companySize: CompanySize;
    companyWebsite?: string;
    businessFieldId?: string | null;
    businessFieldName?: string | null;
    referralCode?: string;
    note?: string;
    status: PartnerStatus;
    approvedAt?: string;
    createdAt: string;
    updatedAt?: string;
    user?: {
        id: string;
        username: string;
        email: string;
        fullName: string;
        phone?: string;
    };
    commission?: PartnerCommission;
    products?: PartnerProduct[];
    /**
     * Thông tin doanh nghiệp dạng object lồng. Backend có thể trả `businessInfo`
     * (contract cũ) hoặc `companyInfo`, hoặc chỉ field phẳng ở root
     * (`companyName`, `companyTax`, ...). Dùng `toBusinessInfo()` để gom đủ 3 dạng.
     */
    businessInfo?: BusinessInfo;
    companyInfo?: BusinessInfo;
}

export interface PartnerCommission {
    id: string;
    partnerId: string;
    type: CommissionType;
    rate: number;
    minOrderValue?: number;
    maxCommission?: number;
    specialConditions?: string;
}

export interface PartnerProduct {
    id: string;
    /** Mã sản phẩm đối tác (vd. PRDP...) — backend tự cấp. */
    partnerProductCode?: string | null;
    partnerId: string;
    name: string;
    description?: string;
    category: ProductCategory;
    retailPrice: number;
    wholesalePrice: number;
    minOrderQuantity: number;
    /** Lĩnh vực của sản phẩm — API trả kèm, hiện chưa hiển thị. */
    businessFieldId?: string | null;
    businessFieldName?: string | null;
}

// ==============================
// 6. CONSTANTS (CHO DROPDOWN)
// ==============================

export const BUSINESS_TYPES = [
    { value: BusinessType.SME, label: 'PARTNER.BUSINESS_TYPE_SME' },
    { value: BusinessType.SoleProprietor, label: 'PARTNER.BUSINESS_TYPE_SOLE_PROPRIETOR' },
    { value: BusinessType.Partnership, label: 'PARTNER.BUSINESS_TYPE_PARTNERSHIP' },
    { value: BusinessType.Corporation, label: 'PARTNER.BUSINESS_TYPE_CORPORATION' },
    { value: BusinessType.Limited, label: 'PARTNER.BUSINESS_TYPE_LIMITED' },
    { value: BusinessType.Other, label: 'PARTNER.BUSINESS_TYPE_OTHER' }
];

export const COMPANY_SIZES = [
    { value: CompanySize.Size1_10, label: 'PARTNER.COMPANY_SIZE_1_10' },
    { value: CompanySize.Size11_50, label: 'PARTNER.COMPANY_SIZE_11_50' },
    { value: CompanySize.Size51_200, label: 'PARTNER.COMPANY_SIZE_51_200' },
    { value: CompanySize.Size200Plus, label: 'PARTNER.COMPANY_SIZE_200_PLUS' }
];

export const PRODUCT_CATEGORIES = [
    { value: ProductCategory.Electronics, label: 'PARTNER.PRODUCT_CATEGORY_ELECTRONICS' },
    { value: ProductCategory.Fashion, label: 'PARTNER.PRODUCT_CATEGORY_FASHION' },
    { value: ProductCategory.Food, label: 'PARTNER.PRODUCT_CATEGORY_FOOD' },
    { value: ProductCategory.Beauty, label: 'PARTNER.PRODUCT_CATEGORY_BEAUTY' },
    { value: ProductCategory.Home, label: 'PARTNER.PRODUCT_CATEGORY_HOME' },
    { value: ProductCategory.Other, label: 'PARTNER.PRODUCT_CATEGORY_OTHER' }
];

export const COMMISSION_TYPES = [
    { value: CommissionType.Percentage, label: 'PARTNER.COMMISSION_TYPE_PERCENTAGE' },
    { value: CommissionType.Fixed, label: 'PARTNER.COMMISSION_TYPE_FIXED' },
    { value: CommissionType.Tiered, label: 'PARTNER.COMMISSION_TYPE_TIERED' }
];

// ==============================
// 7. HELPER FUNCTIONS
// ==============================

export function getBusinessTypeLabel(type: BusinessType): string {
    const labels: Record<BusinessType, string> = {
        [BusinessType.SME]: 'PARTNER.BUSINESS_TYPE_SME',
        [BusinessType.SoleProprietor]: 'PARTNER.BUSINESS_TYPE_SOLE_PROPRIETOR',
        [BusinessType.Partnership]: 'PARTNER.BUSINESS_TYPE_PARTNERSHIP',
        [BusinessType.Corporation]: 'PARTNER.BUSINESS_TYPE_CORPORATION',
        [BusinessType.Limited]: 'PARTNER.BUSINESS_TYPE_LIMITED',
        [BusinessType.Other]: 'PARTNER.BUSINESS_TYPE_OTHER'
    };
    return labels[type] || type.toString();
}

export function getCompanySizeLabel(size: CompanySize): string {
    const labels: Record<CompanySize, string> = {
        [CompanySize.Size1_10]: 'PARTNER.COMPANY_SIZE_1_10',
        [CompanySize.Size11_50]: 'PARTNER.COMPANY_SIZE_11_50',
        [CompanySize.Size51_200]: 'PARTNER.COMPANY_SIZE_51_200',
        [CompanySize.Size200Plus]: 'PARTNER.COMPANY_SIZE_200_PLUS',
        [CompanySize.Size500Plus]: 'PARTNER.COMPANY_SIZE_500_PLUS'
    };
    return labels[size] || size.toString();
}

export function getPartnerStatusLabel(status: PartnerStatus): string {
    const labels: Record<PartnerStatus, string> = {
        [PartnerStatus.Pending]: 'COMMON.STATUS.PENDING',
        [PartnerStatus.Approved]: 'COMMON.STATUS.APPROVED',
        [PartnerStatus.Rejected]: 'COMMON.STATUS.REJECTED',
        [PartnerStatus.Active]: 'COMMON.STATUS.ACTIVE'
    };
    return labels[status] || status.toString();
}

export function getCommissionTypeLabel(type: CommissionType): string {
    const labels: Record<CommissionType, string> = {
        [CommissionType.Percentage]: 'PARTNER.COMMISSION_TYPE_PERCENTAGE',
        [CommissionType.Fixed]: 'PARTNER.COMMISSION_TYPE_FIXED',
        [CommissionType.Tiered]: 'PARTNER.COMMISSION_TYPE_TIERED'
    };
    return labels[type] || type.toString();
}

export function getProductCategoryLabel(category: ProductCategory): string {
    const labels: Record<ProductCategory, string> = {
        [ProductCategory.Electronics]: 'PARTNER.PRODUCT_CATEGORY_ELECTRONICS',
        [ProductCategory.Fashion]: 'PARTNER.PRODUCT_CATEGORY_FASHION',
        [ProductCategory.Food]: 'PARTNER.PRODUCT_CATEGORY_FOOD',
        [ProductCategory.Beauty]: 'PARTNER.PRODUCT_CATEGORY_BEAUTY',
        [ProductCategory.Home]: 'PARTNER.PRODUCT_CATEGORY_HOME',
        [ProductCategory.Other]: 'PARTNER.PRODUCT_CATEGORY_OTHER'
    };
    return labels[category] || category.toString();
}

// Get status badge variant
export function getPartnerStatusVariant(status: PartnerStatus): string {
    const variants: Record<PartnerStatus, string> = {
        [PartnerStatus.Pending]: 'warning',
        [PartnerStatus.Approved]: 'success',
        [PartnerStatus.Rejected]: 'danger',
        [PartnerStatus.Active]: 'success'
    };
    return variants[status] || 'secondary';
}