// src/app/pages/register-ctv/register-ctv.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { CreateCollaboratorRequest, SalesChannelOption } from '@core/models/collaborator.model';
import { NgSelectWrapperComponent } from '@shared/components/select/ng-select-wrapper.component';
import { AccountCreatedNoticeComponent } from '@shared/components/account-created-notice/account-created-notice.component';
import { AccountCredentials } from '@core/models/account.model';

@Component({
    selector: 'app-register-ctv',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, TranslateModule, NgSelectWrapperComponent, RouterLink,
        AccountCreatedNoticeComponent
    ],
    templateUrl: './register-ctv.component.html',
    styleUrls: ['./register-ctv.component.css']
})
export class RegisterCtvComponent implements OnInit {
    ctvForm!: FormGroup;
    isSubmitting = false;
    salesChannels: SalesChannelOption[] = [];
    touched = false;
    submitted = false;
    /** Tài khoản vừa tạo/dùng lại khi đăng ký công khai (hiện khối thông tin đăng nhập) */
    registeredAccount: AccountCredentials | null = null;

    constructor(
        private fb: FormBuilder,
        private _appService: AppService,
        private router: Router
    ) { }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }

    ngOnInit(): void {
        this.salesChannels = this._appService.collaboratorService.getSalesChannels();
        this.ctvForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.required, Validators.pattern(/^0[0-9]{9,10}$/)]],
            zalo: [''],
            email: ['', [Validators.required, Validators.email]],
            salesChannel: [null, Validators.required],
            experience: [''],
            agreeTerms: [false, [Validators.requiredTrue]]
        });
    }

    get f() {
        return this.ctvForm.controls;
    }

    isFieldInvalid(fieldName: string): boolean {
        const control = this.ctvForm.get(fieldName);
        if (!control) return false;
        // ✅ Chỉ hiển thị lỗi khi đã submit HOẶC touched/dirty
        return !!(control.invalid && (this.submitted || control.dirty || control.touched));
    }

    getErrorMessage(fieldName: string): string {
        const control = this.ctvForm.get(fieldName);
        if (!control || !control.errors) return '';

        if (control.errors['required']) {
            const fieldMap: Record<string, string> = {
                fullName: this._appService.trans('CTV_FORM.ERROR_FULLNAME_REQUIRED'),
                phone: this._appService.trans('CTV_FORM.ERROR_PHONE_REQUIRED'),
                email: this._appService.trans('CTV_FORM.ERROR_EMAIL_REQUIRED'),
                salesChannel: this._appService.trans('CTV_FORM.ERROR_SALES_CHANNEL_REQUIRED'),
                agreeTerms: this._appService.trans('CTV_FORM.ERROR_AGREE_TERMS_REQUIRED')
            };
            return fieldMap[fieldName] || this._appService.trans('CTV_FORM.ERROR_REQUIRED');
        }

        if (control.errors['requiredTrue']) {
            return this._appService.trans('CTV_FORM.ERROR_AGREE_TERMS_REQUIRED');
        }

        if (control.errors['minlength']) {
            if (fieldName === 'fullName') {
                return this._appService.trans('CTV_FORM.ERROR_FULLNAME_MINLENGTH');
            }
            return this._appService.trans('CTV_FORM.ERROR_MINLENGTH');
        }

        if (control.errors['pattern']) {
            if (fieldName === 'phone') {
                return this._appService.trans('CTV_FORM.ERROR_PHONE_INVALID');
            }
            return this._appService.trans('CTV_FORM.ERROR_INVALID');
        }

        if (control.errors['email']) {
            return this._appService.trans('CTV_FORM.ERROR_EMAIL_INVALID');
        }

        return '';
    }

    get formProgress(): number {
        const controls = this.ctvForm.controls;
        const requiredFields = ['fullName', 'phone', 'email', 'salesChannel', 'agreeTerms'];
        let total = requiredFields.length;
        let filled = 0;

        requiredFields.forEach(key => {
            const control = controls[key];
            if (control) {
                const value = control.value;
                if (key === 'agreeTerms') {
                    if (value === true) filled++;
                } else if (value && value !== '' && value !== null) {
                    filled++;
                }
            }
        });

        return Math.round((filled / total) * 100);
    }

    // register-ctv/register-ctv.component.ts
    onSubmit(): void {
        this.submitted = true;  // Đánh dấu đã submit
        this.ctvForm.markAllAsTouched();

        if (this.ctvForm.invalid) {
            this._appService.showError(this._appService.trans('CTV_FORM.ERROR_FORM_INVALID'));
            return;
        }

        this.isSubmitting = true;
        const value = this.ctvForm.value;
        const request: CreateCollaboratorRequest = {
            fullName: value.fullName,
            phone: value.phone,
            zalo: value.zalo || undefined,
            email: value.email || undefined,
            salesChannel: value.salesChannel ?? undefined,
            experience: value.experience || undefined,
            agreeTerms: value.agreeTerms === true
        };


        this._appService.collaboratorService.register(request).subscribe({
            next: (response: any) => {
                this.isSubmitting = false;
                this._appService.showSuccess(this._appService.trans('CTV_FORM.SUCCESS_REGISTER'));

                // Form công khai: API trả tài khoản vừa tạo (username user<sđt>, mật khẩu = SĐT)
                this.registeredAccount = response?.data?.account ?? null;

                // ✅ Reset form
                // ✅ Reset từng control
                this.ctvForm.get('fullName')?.reset('');
                this.ctvForm.get('phone')?.reset('');
                this.ctvForm.get('zalo')?.reset('');
                this.ctvForm.get('email')?.reset('');
                this.ctvForm.get('salesChannel')?.reset(null, { emitEvent: false });
                this.ctvForm.get('experience')?.reset('');
                this.ctvForm.get('agreeTerms')?.reset(false);

                // ✅ Reset states
                this.touched = false;
                this.submitted = false;
                this.ctvForm.markAsPristine();
                this.ctvForm.markAsUntouched();
                this.ctvForm.updateValueAndValidity();

                // Có tài khoản vừa tạo → ở lại trang để người đăng ký thấy thông tin đăng nhập
                if (!this.registeredAccount) {
                    this.router.navigate(['/']);
                }
            },
            error: (error: any) => {
                this.isSubmitting = false;
                const errorMsg = error?.error?.message || this._appService.trans('CTV_FORM.ERROR_REGISTER_FAILED');
                this._appService.showError(errorMsg);
            }
        });
    }
}