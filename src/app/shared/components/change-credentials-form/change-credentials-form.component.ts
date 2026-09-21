import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { InputComponent } from '../input/input.component';
import { ButtonComponent } from '../button/button.component';

/**
 * Form đổi tên đăng nhập + mật khẩu.
 * Dùng ở trang bắt buộc đổi (lần đăng nhập đầu) và ở trang người dùng.
 */
@Component({
    selector: 'app-change-credentials-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, InputComponent, ButtonComponent],
    template: `
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <app-input
                formControlName="currentPassword"
                type="password"
                icon="fas fa-lock"
                [label]="'CHANGE_CREDENTIALS.CURRENT_PASSWORD' | translate"
                [placeholder]="'CHANGE_CREDENTIALS.CURRENT_PASSWORD_PLACEHOLDER' | translate"
                [required]="true"
                [isInvalid]="isInvalid('currentPassword')"
                [errorMessage]="getErrorMessage('currentPassword')">
            </app-input>

            <app-input
                formControlName="newUsername"
                type="text"
                icon="fas fa-user"
                [label]="'CHANGE_CREDENTIALS.NEW_USERNAME' | translate"
                [placeholder]="'CHANGE_CREDENTIALS.NEW_USERNAME_PLACEHOLDER' | translate"
                [hint]="'CHANGE_CREDENTIALS.NEW_USERNAME_HINT' | translate"
                [required]="true"
                [isInvalid]="isInvalid('newUsername')"
                [errorMessage]="getErrorMessage('newUsername')">
            </app-input>

            <div class="grid gap-5 sm:grid-cols-2">
                <app-input
                    formControlName="newPassword"
                    type="password"
                    icon="fas fa-key"
                    [label]="'CHANGE_CREDENTIALS.NEW_PASSWORD' | translate"
                    [placeholder]="'CHANGE_CREDENTIALS.NEW_PASSWORD_PLACEHOLDER' | translate"
                    [required]="true"
                    [isInvalid]="isInvalid('newPassword')"
                    [errorMessage]="getErrorMessage('newPassword')">
                </app-input>

                <app-input
                    formControlName="confirmNewPassword"
                    type="password"
                    icon="fas fa-key"
                    [label]="'CHANGE_CREDENTIALS.CONFIRM_PASSWORD' | translate"
                    [placeholder]="'CHANGE_CREDENTIALS.CONFIRM_PASSWORD_PLACEHOLDER' | translate"
                    [required]="true"
                    [isInvalid]="isInvalid('confirmNewPassword')"
                    [errorMessage]="getErrorMessage('confirmNewPassword')">
                </app-input>
            </div>

            <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {{ errorMessage }}
            </p>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <app-button type="submit" variant="primary" [loading]="submitting" [disabled]="submitting">
                    <i class="fas fa-key mr-2"></i>{{ 'CHANGE_CREDENTIALS.SUBMIT' | translate }}
                </app-button>
            </div>
        </form>
    `,
})
export class ChangeCredentialsFormComponent {
    /** True khi form được hiện ở luồng bắt buộc đổi (lần đăng nhập đầu) */
    @Input() firstLogin = false;
    @Output() changed = new EventEmitter<void>();

    form: FormGroup;
    submitting = false;
    submitted = false;
    errorMessage = '';

    constructor(
        private readonly fb: FormBuilder,
        private readonly _appService: AppService
    ) {
        this.form = this.fb.group(
            {
                currentPassword: ['', [Validators.required]],
                newUsername: ['', [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(50),
                    Validators.pattern(/^[a-zA-Z0-9._-]+$/)
                ]],
                newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
                confirmNewPassword: ['', [Validators.required]]
            },
            { validators: [ChangeCredentialsFormComponent.passwordsMatch] }
        );
    }

    private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
        const password = group.get('newPassword')?.value;
        const confirm = group.get('confirmNewPassword')?.value;
        return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
    }

    isInvalid(field: string): boolean {
        const control = this.form.get(field);
        if (!control) return false;

        if (field === 'confirmNewPassword' && this.form.hasError('passwordMismatch')) {
            return control.touched || this.submitted;
        }

        return control.invalid && (control.touched || this.submitted);
    }

    getErrorMessage(field: string): string {
        if (!this.isInvalid(field)) return '';

        const control = this.form.get(field);
        const errors = control?.errors || {};

        switch (field) {
            case 'currentPassword':
                return this._appService.trans('CHANGE_CREDENTIALS.ERROR_CURRENT_PASSWORD_REQUIRED');
            case 'newUsername':
                if (errors['required']) return this._appService.trans('CHANGE_CREDENTIALS.ERROR_USERNAME_REQUIRED');
                if (errors['pattern']) return this._appService.trans('CHANGE_CREDENTIALS.ERROR_USERNAME_PATTERN');
                return this._appService.trans('CHANGE_CREDENTIALS.ERROR_USERNAME_LENGTH');
            case 'newPassword':
                if (errors['required']) return this._appService.trans('CHANGE_CREDENTIALS.ERROR_PASSWORD_REQUIRED');
                return this._appService.trans('CHANGE_CREDENTIALS.ERROR_PASSWORD_MIN_LENGTH');
            case 'confirmNewPassword':
                return this._appService.trans('CHANGE_CREDENTIALS.ERROR_PASSWORD_MISMATCH');
            default:
                return '';
        }
    }

    onSubmit(): void {
        this.submitted = true;
        this.errorMessage = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { currentPassword, newUsername, newPassword, confirmNewPassword } = this.form.value;
        this.submitting = true;

        this._appService.changeCredentials({ currentPassword, newUsername, newPassword, confirmNewPassword }).subscribe({
            next: () => {
                this.submitting = false;
                this.submitted = false;
                this.form.reset();
                this._appService.showSuccess(this._appService.trans('CHANGE_CREDENTIALS.SUCCESS'));
                this.changed.emit();
            },
            error: (error: unknown) => {
                this.submitting = false;
                this.errorMessage = this._appService.extractErrorMessage(error);
            }
        });
    }
}
