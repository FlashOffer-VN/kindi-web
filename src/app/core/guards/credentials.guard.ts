import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AppService } from '../services/app.service';

/**
 * Chặn người dùng có tài khoản tạo tự động (mật khẩu = SĐT) ở lần đăng nhập đầu:
 * bắt buộc đổi tên đăng nhập + mật khẩu trước khi vào các trang khác.
 */
@Injectable({
    providedIn: 'root'
})
export class CredentialsGuard implements CanActivate {
    constructor(
        private _appService: AppService,
        private router: Router
    ) { }

    canActivate(): boolean {
        // Chưa đăng nhập thì để AuthGuard xử lý
        if (!this._appService.auth.isAuthenticated()) {
            return true;
        }

        if (this._appService.auth.mustChangeCredentials()) {
            this.router.navigate(['/user/change-credentials']);
            return false;
        }

        return true;
    }
}
