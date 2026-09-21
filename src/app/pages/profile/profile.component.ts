import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { ChangeCredentialsFormComponent } from '@shared/components/change-credentials-form/change-credentials-form.component';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule, ChangeCredentialsFormComponent],
    template: `
        <main class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-4 py-8">
            <div class="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
                <section class="w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
                    <div class="bg-gradient-to-r from-secondary to-primary px-6 py-10 text-center text-white sm:px-12">
                        <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
                            {{ user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?' | uppercase }}
                        </div>
                        <p class="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-cyan-100">
                            {{ 'USER.WELCOME_LABEL' | translate }}
                        </p>
                        <h1 class="text-3xl font-bold">{{ 'USER.WELCOME_TITLE' | translate }}</h1>
                        <p class="mt-2 text-cyan-50">{{ 'USER.WELCOME_DESCRIPTION' | translate }}</p>
                    </div>

                    <div class="space-y-6 p-6 sm:p-10">
                        <div class="grid gap-4 sm:grid-cols-2">
                            <div class="rounded-2xl bg-slate-50 p-4">
                                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ 'USER.USERNAME' | translate }}</p>
                                <p class="mt-1 font-semibold text-slate-800">{{ user?.username || '--' }}</p>
                            </div>
                            <div class="rounded-2xl bg-slate-50 p-4">
                                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ 'USER.EMAIL' | translate }}</p>
                                <p class="mt-1 break-words font-semibold text-slate-800">{{ user?.email || '--' }}</p>
                            </div>
                        </div>

                        <!-- Đổi tên đăng nhập + mật khẩu -->
                        <div class="rounded-2xl border border-slate-200 p-5 sm:p-6">
                            <div class="mb-5">
                                <h2 class="text-lg font-semibold text-slate-800">
                                    {{ 'CHANGE_CREDENTIALS.SECTION_TITLE' | translate }}
                                </h2>
                                <p class="mt-1 text-sm text-slate-500">
                                    {{ 'CHANGE_CREDENTIALS.SECTION_DESCRIPTION' | translate }}
                                </p>
                            </div>

                            <app-change-credentials-form (changed)="onCredentialsChanged()"></app-change-credentials-form>
                        </div>

                        <div class="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 p-5 text-center text-cyan-900">
                            <i class="fas fa-rocket mb-3 text-2xl text-primary"></i>
                            <p class="font-medium">{{ 'USER.COMING_SOON' | translate }}</p>
                        </div>

                        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <a routerLink="/" class="rounded-xl border border-slate-200 px-5 py-3 text-center font-semibold text-slate-600 transition hover:bg-slate-50">
                                <i class="fas fa-home mr-2"></i>{{ 'USER.BACK_HOME' | translate }}
                            </a>
                            <button type="button" (click)="logout()" class="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600">
                                <i class="fas fa-right-from-bracket mr-2"></i>{{ 'USER.LOGOUT' | translate }}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    `,
})
export class ProfileComponent {
    user: ReturnType<AppService['getCurrentUser']>;

    constructor(private readonly appService: AppService) {
        this.user = this.appService.getCurrentUser();
    }

    onCredentialsChanged(): void {
        // Tên đăng nhập hiển thị lại lấy từ user đã cập nhật sau khi đổi
        this.user = this.appService.getCurrentUser();
    }

    logout(): void {
        this.appService.auth.logout();
    }
}