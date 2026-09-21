import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Khối thông báo thông tin đăng nhập sau khi đăng ký công khai:
 * - Tài khoản vừa được tạo → hiện username + mật khẩu khởi tạo (là SĐT vừa nhập)
 * - SĐT đã có tài khoản từ trước → nhắc đăng nhập bằng tài khoản cũ
 * Dùng chung cho form mua chung, đăng ký CTV, đăng ký đối tác...
 */
@Component({
    selector: 'app-account-created-notice',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
        <!-- Tài khoản vừa được tạo -->
        <div class="account-notice" *ngIf="isNewAccount">
            <h4><i class="fas fa-circle-check"></i> {{ 'ACCOUNT_NOTICE.CREATED_TITLE' | translate }}</h4>
            <p>{{ 'ACCOUNT_NOTICE.CREATED_DESC' | translate }}</p>

            <div class="credential">
                <span class="label">{{ 'ACCOUNT_NOTICE.USERNAME' | translate }}</span>
                <code>{{ username }}</code>
            </div>
            <div class="credential">
                <span class="label">{{ 'ACCOUNT_NOTICE.PASSWORD' | translate }}</span>
                <code *ngIf="passwordIsPhone; else customPassword">{{ 'ACCOUNT_NOTICE.PASSWORD_IS_PHONE' | translate }}</code>
                <ng-template #customPassword><code>{{ password }}</code></ng-template>
            </div>

            <div class="account-note">
                <i class="fas fa-circle-info"></i> {{ 'ACCOUNT_NOTICE.FIRST_LOGIN_HINT' | translate }}
            </div>

            <button type="button" class="btn-login" (click)="loginClick.emit()">
                <i class="fas fa-right-to-bracket"></i> {{ 'ACCOUNT_NOTICE.LOGIN_NOW' | translate }}
            </button>
        </div>

        <!-- SĐT đã có tài khoản từ trước -->
        <div class="account-notice exists" *ngIf="!isNewAccount && accountAlreadyExisted">
            <h4><i class="fas fa-circle-info"></i> {{ 'ACCOUNT_NOTICE.EXISTS_TITLE' | translate }}</h4>
            <p>{{ 'ACCOUNT_NOTICE.EXISTS_DESC' | translate }}</p>

            <button type="button" class="btn-login" (click)="loginClick.emit()">
                <i class="fas fa-right-to-bracket"></i> {{ 'ACCOUNT_NOTICE.LOGIN_NOW' | translate }}
            </button>
        </div>
    `,
    styles: [`
        .account-notice {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 16px;
            border: 1px solid #a7f3d0;
            border-radius: 12px;
            background: #ecfdf5;
        }

        .account-notice h4 { margin: 0; font-size: 15px; color: #047857; }
        .account-notice p { margin: 0; font-size: 13px; color: #065f46; }

        .credential {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 12px;
            border: 1px solid #d1fae5;
            border-radius: 8px;
            background: #ffffff;
        }

        .credential .label { font-size: 12px; color: #6b7280; }
        .credential code { font-size: 14px; font-weight: 700; color: #111827; }

        .account-note {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #b45309;
        }

        .btn-login {
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border: 0;
            border-radius: 10px;
            background: #0d9488;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .btn-login:hover { background: #0f766e; }

        .account-notice.exists { background: #fffbeb; border-color: #fde68a; }
        .account-notice.exists h4, .account-notice.exists p { color: #92400e; }
    `],
})
export class AccountCreatedNoticeComponent {
    /** Tài khoản vừa được tạo trong lượt đăng ký này */
    @Input() isNewAccount = false;
    /** SĐT/email đã có tài khoản từ trước */
    @Input() accountAlreadyExisted = false;
    @Input() username?: string | null;
    /** true = mật khẩu khởi tạo chính là số điện thoại vừa nhập */
    @Input() passwordIsPhone = true;
    /** Mật khẩu cụ thể — chỉ dùng khi passwordIsPhone = false */
    @Input() password?: string | null;
    /** Bấm "Đăng nhập ngay": nơi dùng tự điều hướng */
    @Output() loginClick = new EventEmitter<void>();
}
