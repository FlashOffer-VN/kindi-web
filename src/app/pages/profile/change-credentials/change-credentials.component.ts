import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { ChangeCredentialsFormComponent } from '@shared/components/change-credentials-form/change-credentials-form.component';

/**
 * Trang bắt buộc đổi tên đăng nhập + mật khẩu ở lần đăng nhập đầu tiên
 * (tài khoản tạo tự động từ form công khai: username user<sđt>, mật khẩu = SĐT).
 */
@Component({
    selector: 'app-change-credentials-page',
    standalone: true,
    imports: [CommonModule, TranslateModule, ChangeCredentialsFormComponent],
    template: `
        <main class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-4 py-8">
            <div class="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
                <section class="w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
                    <div class="bg-gradient-to-r from-secondary to-primary px-6 py-8 text-white sm:px-10">
                        <p class="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-cyan-100">
                            {{ 'CHANGE_CREDENTIALS.FIRST_LOGIN_LABEL' | translate }}
                        </p>
                        <h1 class="text-2xl font-bold sm:text-3xl">{{ 'CHANGE_CREDENTIALS.FIRST_LOGIN_TITLE' | translate }}</h1>
                        <p class="mt-2 text-cyan-50">{{ 'CHANGE_CREDENTIALS.FIRST_LOGIN_DESCRIPTION' | translate }}</p>
                    </div>

                    <div class="space-y-6 p-6 sm:p-10">
                        <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                            <i class="fas fa-circle-exclamation mr-2"></i>{{ 'CHANGE_CREDENTIALS.FIRST_LOGIN_NOTE' | translate }}
                        </div>

                        <app-change-credentials-form [firstLogin]="true" (changed)="onChanged()"></app-change-credentials-form>
                    </div>
                </section>
            </div>
        </main>
    `,
})
export class ChangeCredentialsPageComponent {
    constructor(
        private readonly _appService: AppService,
        private readonly router: Router
    ) { }

    onChanged(): void {
        this.router.navigate([this._appService.isAdmin() ? '/admin/dashboard' : '/social']);
    }
}
