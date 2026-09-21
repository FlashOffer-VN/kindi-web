// src/app/core/models/auth.model.ts

export interface User {
    id: any;
    username: string;
    email: string;
    role: UserRole | string;
    fullName?: string;
    /** Tài khoản tạo tự động từ form công khai → bắt buộc đổi tên đăng nhập + mật khẩu ở lần đăng nhập đầu */
    mustChangeCredentials?: boolean;
    status?: UserStatus;
    createdAt?: string;
    updatedAt?: string;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    GUEST = 'GUEST'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BANNED = 'BANNED'
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

/** Đổi tên đăng nhập + mật khẩu (lần đăng nhập đầu hoặc ở trang người dùng) */
export interface ChangeCredentialsRequest {
    currentPassword: string;
    newUsername: string;
    newPassword: string;
    confirmNewPassword: string;
}

// ✅ AuthResponse có thể chứa data
export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        id?: number;
        token: string;
        refreshToken?: string;
        expiresAt: string;
        username: string;
        fullName: string;
        role: string;
        email?: string;
        mustChangeCredentials?: boolean;
    };
    errors: string[] | null;
    timestamp: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors: string[] | null;
    timestamp: string;
}