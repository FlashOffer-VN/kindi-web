// components/group-buying-detail-modal/group-buying-detail-modal.component.ts
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AppService } from '@core/services/app.service';
import { GroupBuyingDetail, GroupBuyingStatus, JoinGroupBuyingResult } from '@core/models/group-buying-request.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
    selector: 'app-group-buying-detail-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, LoadingComponent],
    templateUrl: './group-buying-detail-modal.component.html',
    styleUrls: ['./group-buying-detail-modal.component.css']
})
export class GroupBuyingDetailModalComponent implements OnChanges {
    /** Mở/đóng modal */
    @Input() visible = false;
    /** Id yêu cầu mua chung cần xem chi tiết */
    @Input() requestId: string | null = null;

    /** Đóng modal */
    @Output() closed = new EventEmitter<void>();
    /** Đã tham gia thành công → trang gọi reload lại danh sách */
    @Output() joined = new EventEmitter<void>();

    detail: GroupBuyingDetail | null = null;
    isLoading = false;
    isSubmitting = false;
    loadError = '';

    /** Kết quả sau khi đăng ký thành công (chứa tài khoản vừa tạo cho khách) */
    joinResult: JoinGroupBuyingResult | null = null;

    joinForm: FormGroup;

    constructor(
        private _fb: FormBuilder,
        private _appService: AppService,
        private _router: Router
    ) {
        this.joinForm = this._fb.group({
            fullName: [''],
            phone: [''],
            zalo: [''],
            email: [''],
            note: ['']
        });
    }

    get isAuthenticated(): boolean {
        return this._appService.isAuthenticated();
    }

    get f() {
        return this.joinForm.controls;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']) {
            if (this.visible) {
                this.resetState();
                this.applyGuestValidators();
                this.loadDetail();
            } else {
                this.resetState();
            }
        }
    }

    loadDetail(): void {
        if (!this.requestId) return;

        this.isLoading = true;
        this.loadError = '';
        this._appService.groupBuyingRequest.getPublicDetail(this.requestId)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response) => {
                    this.detail = response?.data ?? null;
                    if (!this.detail) this.loadError = this._appService.trans('COMMON.ERROR.NOT_FOUND');
                },
                error: (error) => {
                    this.loadError = error?.message || this._appService.trans('COMMON.ERROR.LOAD_FAILED');
                }
            });
    }

    /** Khách chưa đăng nhập bắt buộc nhập họ tên + SĐT (để tạo tài khoản và liên hệ) */
    private applyGuestValidators(): void {
        const guest = !this.isAuthenticated;
        const fullName = this.joinForm.get('fullName');
        const phone = this.joinForm.get('phone');
        const email = this.joinForm.get('email');

        fullName?.setValidators(guest ? [Validators.required, Validators.minLength(2)] : []);
        phone?.setValidators(guest ? [Validators.required, Validators.pattern(/^0[0-9]{9,10}$/)] : []);
        email?.setValidators(guest ? [Validators.email] : [Validators.email]);

        fullName?.updateValueAndValidity();
        phone?.updateValueAndValidity();
        email?.updateValueAndValidity();
    }

    private resetState(): void {
        this.detail = null;
        this.joinResult = null;
        this.loadError = '';
        this.isSubmitting = false;
        this.joinForm.reset();
    }

    onJoin(): void {
        if (!this.detail) return;

        if (this.joinForm.invalid) {
            this.joinForm.markAllAsTouched();
            this._appService.toast.error(this._appService.trans('GROUP_BUYING.ERROR.FORM_INVALID'));
            return;
        }

        const value = this.joinForm.value;
        const payload = this.isAuthenticated
            ? { note: value.note?.trim() || undefined }
            : {
                fullName: value.fullName?.trim(),
                phone: value.phone?.trim(),
                zalo: value.zalo?.trim() || undefined,
                email: value.email?.trim() || undefined,
                note: value.note?.trim() || undefined
            };

        this.isSubmitting = true;
        this._appService.groupBuyingRequest.join(this.detail.id, payload)
            .pipe(finalize(() => this.isSubmitting = false))
            .subscribe({
                next: (response) => {
                    this.joinResult = response?.data ?? null;

                    if (!response?.success || !this.joinResult) {
                        this._appService.showError(response?.errors?.[0]
                            || response?.message
                            || this._appService.trans('GROUP_BUYING.ERROR.SUBMIT_FAILED'));
                        return;
                    }

                    this._appService.showSuccess(this.joinResult.message
                        || this._appService.trans('GROUP_BUYING.SUCCESS.JOINED'));

                    this.joinForm.reset();
                    this.joined.emit();
                    this.loadDetail();
                },
                error: (error) => {
                    this._appService.showError(error?.errors?.[0]
                        || error?.message
                        || this._appService.trans('GROUP_BUYING.ERROR.SUBMIT_FAILED'));
                }
            });
    }

    goToLogin(): void {
        this.close();
        this._router.navigate(['/login']);
    }

    close(): void {
        this.closed.emit();
    }

    stopPropagation(event: MouseEvent): void {
        event.stopPropagation();
    }

    percent(): number {
        if (!this.detail?.targetPeopleCount) return 0;
        const value = (this.detail.currentPeopleCount / this.detail.targetPeopleCount) * 100;
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    statusKey(status: GroupBuyingStatus | undefined): string {
        switch (status) {
            case GroupBuyingStatus.PENDING: return 'GROUP_BUYING.STATUS.PENDING';
            case GroupBuyingStatus.ACTIVE: return 'GROUP_BUYING.STATUS.ACTIVE';
            case GroupBuyingStatus.COMPLETED: return 'GROUP_BUYING.STATUS.COMPLETED';
            case GroupBuyingStatus.CANCELLED: return 'GROUP_BUYING.STATUS.CANCELLED';
            default: return '';
        }
    }

    statusClass(status: GroupBuyingStatus | undefined): string {
        switch (status) {
            case GroupBuyingStatus.PENDING: return 'pending';
            case GroupBuyingStatus.ACTIVE: return 'active';
            case GroupBuyingStatus.COMPLETED: return 'completed';
            default: return 'cancelled';
        }
    }
}
