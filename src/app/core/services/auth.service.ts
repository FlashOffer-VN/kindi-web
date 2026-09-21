import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
    User,
    UserRole,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ApiResponse,
    ChangeCredentialsRequest
} from '../models/auth.model';
import { isBrowser } from '../utils/platform';
import { storageGet, storageRemove, storageSet } from '../utils/storage';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private refreshTokenTimeout: any;

    constructor(
        private api: ApiService,
        private router: Router,
        private translate: TranslateService
    ) {
        this.loadStoredUser();
    }

    /**
     * Đăng nhập
     * @param data - LoginRequest có thể chứa isAdmin flag
     */
    login(data: LoginRequest & { isAdmin?: boolean }): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('auth/login', data).pipe(
            tap(response => this.handleAuthResponse(response, data.isAdmin))
        );
    }

    /**
     * Đăng ký
     */
    register(data: RegisterRequest): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('auth/register', data).pipe(
            tap(response => this.handleAuthResponse(response, false))
        );
    }

    /**
     * Đăng xuất user thường -> redirect về /login
     */
    logout(): void {
        this.clearSession();
        this.router.navigate(['/login']);
    }

    /**
     * Đăng xuất admin -> redirect về /admin-login
     */
    logoutToAdmin(): void {
        this.clearSession();
        this.router.navigate(['/admin-login']);
    }

    /**
     * Lấy token từ localStorage
     */
    getToken(): string | null {
        return storageGet('token');
    }

    /**
     * Lấy refresh token từ localStorage
     */
    getRefreshToken(): string | null {
        return storageGet('refreshToken');
    }

    /**
     * Kiểm tra đã đăng nhập chưa
     */
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Lấy user hiện tại
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Gọi API lấy thông tin user
     */
    getMe(): Observable<ApiResponse<User>> {
        return this.api.get<ApiResponse<User>>('auth/me').pipe(
            tap(response => {
                if (response.success && response.data) {
                    const user = response.data;
                    storageSet('user', JSON.stringify(user));
                    this.currentUserSubject.next(user);
                    this.setBodyRoleClass(user.role);
                }
            })
        );
    }

    /**
     * Refresh token
     */
    refreshToken(): Observable<any> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token'));
        }
        return this.api.post('auth/refresh', { refreshToken }).pipe(
            tap((response: any) => {
                const newToken = response?.data?.token || response?.token;
                if (newToken) {
                    storageSet('token', newToken);
                    this.startRefreshTokenTimer();
                }
            })
        );
    }

    /**
     * Trích xuất message lỗi từ response
     */
    extractErrorMessage(error: any): string {
        if (error?.error?.errors && Array.isArray(error.error.errors)) {
            return error.error.errors[0];
        }
        if (error?.error?.message) {
            return error.error.message;
        }
        if (error?.message) {
            return error.message;
        }
        return this.translate.instant('ERROR.GENERAL');
    }

    /**
     * Xóa session và reset state
     */
    private clearSession(): void {
        storageRemove('token');
        storageRemove('refreshToken');
        storageRemove('user');
        this.currentUserSubject.next(null);
        this.clearBodyRoleClass();
        this.stopRefreshTokenTimer();
    }

    /**
     * Bắt đầu timer refresh token
     */
    private startRefreshTokenTimer(): void {
        const token = this.getToken();
        if (!token) return;

        const expiresIn = 55 * 60 * 1000;
        this.stopRefreshTokenTimer();
        this.refreshTokenTimeout = setTimeout(() => {
            this.refreshToken().subscribe({
                next: () => console.log('✅ Token refreshed successfully'),
                error: (error) => {
                    console.error('❌ Token refresh failed:', error);
                    this.logout();
                }
            });
        }, expiresIn);
    }

    /**
     * Dừng timer refresh token
     */
    private stopRefreshTokenTimer(): void {
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = null;
        }
    }

    /**
     * Xử lý response auth, lưu token và redirect theo role
     * @param response - AuthResponse từ API
     * @param isAdmin - Flag xác định login từ trang admin
     */
    private handleAuthResponse(response: AuthResponse, isAdmin: boolean = false): void {
        const data = response?.data;

        if (!data) {
            console.error('❌ No data in auth response');
            return;
        }

        const roleValue = data.role || 'GUEST';

        const user: User = {
            id: data.id || 0,
            username: data.username || '',
            email: data.email || data.username || '',
            role: roleValue as UserRole,
            fullName: data.fullName || '',
            mustChangeCredentials: data.mustChangeCredentials === true
        };

        if (data.token) {
            storageSet('token', data.token);
        }

        if (data.refreshToken) {
            storageSet('refreshToken', data.refreshToken);
        }

        storageSet('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.setBodyRoleClass(user.role);
        this.startRefreshTokenTimer();

        this.redirectAfterLogin(user, isAdmin);
    }

    /**
     * Redirect sau login dựa trên role và flag isAdmin
     */
    private redirectAfterLogin(user: User, isAdmin: boolean): void {
        // Tài khoản tạo tự động (mật khẩu = SĐT) phải đổi tên đăng nhập + mật khẩu trước khi dùng tiếp
        if (user.mustChangeCredentials) {
            this.router.navigate(['/user/change-credentials']);
            return;
        }

        if (isAdmin || user.role === UserRole.ADMIN) {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/social']);
        }
    }

    /**
     * True khi tài khoản đang đăng nhập buộc phải đổi tên đăng nhập + mật khẩu (lần đầu).
     */
    mustChangeCredentials(): boolean {
        return this.getCurrentUser()?.mustChangeCredentials === true;
    }

    /**
     * Đổi tên đăng nhập + mật khẩu. API trả token mới (username là claim trong token)
     * nên cập nhật lại token + user đang lưu, KHÔNG redirect (trang gọi tự quyết định).
     */
    changeCredentials(payload: ChangeCredentialsRequest): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('auth/change-credentials', payload).pipe(
            tap(response => this.applyChangedCredentials(response))
        );
    }

    /**
     * Cập nhật token + user sau khi đổi thông tin đăng nhập thành công.
     */
    private applyChangedCredentials(response: AuthResponse): void {
        const data = response?.data;
        if (!data) return;

        if (data.token) {
            storageSet('token', data.token);
        }

        const current = this.getCurrentUser();
        const user: User = {
            ...(current || ({} as User)),
            id: current?.id ?? data.id ?? 0,
            username: data.username || current?.username || '',
            email: data.email || current?.email || data.username || '',
            role: (data.role || current?.role || 'USER') as UserRole,
            fullName: data.fullName || current?.fullName || '',
            mustChangeCredentials: data.mustChangeCredentials === true
        };

        storageSet('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.setBodyRoleClass(user.role);
    }

    /**
     * Load user từ localStorage khi app khởi động
     */
    private loadStoredUser(): void {
        // SSR-safe: on the server (prerender) there is no localStorage — skip.
        if (!isBrowser()) return;
        const userStr = storageGet('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr) as User;
                this.currentUserSubject.next(user);
                this.setBodyRoleClass(user.role);
                if (this.getToken()) {
                    this.startRefreshTokenTimer();
                }
            } catch (error) {
                console.error('Failed to parse user from localStorage', error);
            }
        }
    }

    /**
     * Chuẩn hóa role về string
     */
    private normalizeRole(role: string | UserRole): string {
        if (typeof role === 'string') {
            return role;
        }
        if (role === UserRole.ADMIN) return 'ADMIN';
        if (role === UserRole.USER) return 'USER';
        if (role === UserRole.GUEST) return 'GUEST';
        return String(role);
    }

    /**
     * Set class cho body dựa trên role
     */
    private setBodyRoleClass(role: string | UserRole): void {
        if (!isBrowser()) return;
        this.clearBodyRoleClass();
        const roleStr = this.normalizeRole(role);

        if (roleStr === UserRole.ADMIN || roleStr === 'Admin' || roleStr === 'admin') {
            document.body.classList.add('admin-role');
        } else if (roleStr === UserRole.USER || roleStr === 'User' || roleStr === 'user') {
            document.body.classList.add('user-role');
        }
    }

    /**
     * Xóa class role trên body
     */
    private clearBodyRoleClass(): void {
        if (!isBrowser()) return;
        document.body.classList.remove('admin-role', 'user-role');
    }
}