// pages/partner-register/partner-register.component.ts
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { PartnerHeroComponent } from './components/partner-hero/partner-hero.component';
import { PartnerStepsComponent } from './components/partner-steps/partner-steps.component';
import { AppService } from '../../core/services/app.service';
import { isBrowser } from '../../core/utils/platform';
import { PartnerRegisterService } from '../../core/services/partner-register.service';
import { PartnerFormComponent } from './components/partner-form/partner-form.component';
import { AccountCreatedNoticeComponent } from '@shared/components/account-created-notice/account-created-notice.component';
import { AccountCredentials } from '@core/models/account.model';

@Component({
  selector: 'app-partner-register',
  standalone: true,
  imports: [
    CommonModule, PartnerHeroComponent, PartnerStepsComponent, PartnerFormComponent,
    AccountCreatedNoticeComponent,
  ],
  templateUrl: './partner-register.component.html',
  styleUrls: ['./partner-register.component.css']
})
export class PartnerRegisterComponent {
  /** Tài khoản vừa tạo/dùng lại khi đăng ký công khai (hiện khối thông tin đăng nhập) */
  registeredAccount: AccountCredentials | null = null;

  @ViewChild(PartnerFormComponent) formComponent!: PartnerFormComponent;

  currentStep = 1;
  totalSteps = 3;
  isLoading = false;

  constructor(
    private _appService: AppService,
    private partnerService: PartnerRegisterService,
    private router: Router
  ) { }

  onStepChange(step: number): void {
    this.currentStep = step;
  }

  // partner-register/partner-register.component.ts
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.isLoading) {
      // console.log('⏳ Already loading, skip');
      return;
    }

    // ✅ Kiểm tra form component tồn tại
    if (!this.formComponent) {
      // console.log('❌ No form component');
      return;
    }

    // ✅ KIỂM TRA FORM VALID TRƯỚC KHI GỌI API
    if (this.formComponent.registerForm.invalid) {
      // console.log('❌ Form invalid - blocking API call');

      // Đánh dấu tất cả fields là touched để hiển thị lỗi
      Object.keys(this.formComponent.registerForm.controls).forEach(key => {
        this.formComponent.registerForm.get(key)?.markAsTouched();
      });

      // Scroll đến field invalid đầu tiên
      const firstInvalid = Object.keys(this.formComponent.registerForm.controls).find(key => {
        const control = this.formComponent.registerForm.get(key);
        return control?.invalid;
      });

      if (!isBrowser()) return;
      if (firstInvalid === 'agreeTerms') {
        const termsElement = document.querySelector('.terms-group');
        if (termsElement) {
          termsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          termsElement.classList.add('highlight-error');
          setTimeout(() => termsElement.classList.remove('highlight-error'), 2000);
        }
      } else if (firstInvalid) {
        const element = document.querySelector(`[formcontrolname="${firstInvalid}"]`);
        if (element) {
          (element as HTMLElement).focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // ✅ Form valid - proceed with API call
    this.isLoading = true;
    const formData = this.formComponent.registerForm.value;

    const requestData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      companyName: formData.companyName,
      companyAddress: formData.companyAddress,
      businessFieldId: formData.businessFieldId,
      companySize: Number(formData.companySize),
      referralCode: formData.referralCode || '',
      products: formData.products.map((p: any) => ({
        name: p.name,
        description: p.description || ''
      })),
      agreeTerms: formData.agreeTerms
    };

    // console.log('📝 Sending request:', requestData);

    this.partnerService.register(requestData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this._appService.showSuccess(
            response.message || this._appService.trans('PARTNER.REGISTER_SUCCESS')
          );

          // Form công khai: API trả tài khoản vừa tạo (username user<sđt>, mật khẩu = SĐT)
          this.registeredAccount = response?.data?.account ?? null;

          // Có tài khoản vừa tạo → ở lại trang để người đăng ký thấy thông tin đăng nhập
          if (!this.registeredAccount) {
            this.router.navigate(['/home']);
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        const msg = err.error?.errors?.[0] ||
          err.error?.message ||
          this._appService.trans('PARTNER.REGISTER_ERROR');
        this._appService.showError(msg);
        // console.error('❌ Register partner error:', err);
      }
    });
  }
}