// src/app/pages/admin/group-buying/detail/group-buying-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { AppService } from '@core/services/app.service';
import {
    GroupBuyingDetail,
    GroupBuyingStatus,
    GroupBuyingParticipant,
    UpdateGroupBuyingPayload
} from '@core/models/group-buying-request.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

import { GroupPostType } from '@core/models/business-group.model';
import { ShareToGroupComponent } from '@shared/components/share-to-group/share-to-group.component';

@Component({
    selector: 'app-admin-group-buying-detail',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, TranslateModule,
        ButtonComponent, LoadingComponent, BadgeComponent, ModalComponent,
        ShareToGroupComponent,],
    templateUrl: './group-buying-detail.component.html',
    styleUrls: ['./group-buying-detail.component.css']
})
export class AdminGroupBuyingDetailComponent implements OnInit {
    /** Loại bài khi gửi thông tin vào nhóm ngành */
    readonly groupPostType = GroupPostType;

    detail: GroupBuyingDetail | null = null;
    isLoading = true;
    isActionLoading = false;

    // Modal trạng thái (duyệt / hoàn thành / hủy)
    showApproveModal = false;
    showCompleteModal = false;
    showCancelModal = false;
    cancelReason = '';

    // Modal xóa người khỏi nhóm
    showRemoveParticipantModal = false;
    removingParticipant: GroupBuyingParticipant | null = null;

    // Modal sửa thông tin
    showEditModal = false;
    editData: UpdateGroupBuyingPayload = {};

    constructor(
        private _appService: AppService,
        private _route: ActivatedRoute,
        private _router: Router
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        const id = this._route.snapshot.paramMap.get('id');
        if (!id) {
            this._appService.showError(this._appService.trans('COMMON.ERROR.INVALID_ID'));
            this._router.navigate(['/admin/group-buying']);
            return;
        }

        this.isLoading = true;
        this._appService.groupBuyingRequest.getById(id)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response) => {
                    this.detail = response?.data ?? null;
                    if (!this.detail) {
                        this._appService.showError(this._appService.trans('COMMON.ERROR.NOT_FOUND'));
                        this._router.navigate(['/admin/group-buying']);
                    }
                },
                error: (error) => {
                    this._appService.showError(error?.message || this._appService.trans('COMMON.ERROR.LOAD_FAILED'));
                    this._router.navigate(['/admin/group-buying']);
                }
            });
    }

    // ===== Điều kiện hiển thị action =====
    canApprove(): boolean {
        return this.detail?.status === GroupBuyingStatus.PENDING;
    }

    canComplete(): boolean {
        return this.detail?.status === GroupBuyingStatus.ACTIVE;
    }

    canCancel(): boolean {
        return this.detail?.status === GroupBuyingStatus.PENDING
            || this.detail?.status === GroupBuyingStatus.ACTIVE;
    }

    canReopen(): boolean {
        return this.detail?.status === GroupBuyingStatus.CANCELLED;
    }

    // ===== Đổi trạng thái =====
    confirmApprove(): void {
        this.updateStatus(GroupBuyingStatus.ACTIVE, 'ADMIN.GROUP_BUYING.APPROVE_SUCCESS', () => this.showApproveModal = false);
    }

    confirmComplete(): void {
        this.updateStatus(GroupBuyingStatus.COMPLETED, 'ADMIN.GROUP_BUYING.COMPLETE_SUCCESS', () => this.showCompleteModal = false);
    }

    confirmCancel(): void {
        if (!this.cancelReason.trim()) {
            this._appService.toast.error(this._appService.trans('ADMIN.GROUP_BUYING.CANCEL_REASON_REQUIRED'));
            return;
        }
        this.updateStatus(GroupBuyingStatus.CANCELLED, 'ADMIN.GROUP_BUYING.CANCEL_SUCCESS', () => {
            this.showCancelModal = false;
            this.cancelReason = '';
        });
    }

    confirmReopen(): void {
        this.updateStatus(GroupBuyingStatus.ACTIVE, 'ADMIN.GROUP_BUYING.APPROVE_SUCCESS', () => { });
    }

    private updateStatus(status: GroupBuyingStatus, successKey: string, onDone: () => void, reason?: string): void {
        if (!this.detail) return;

        this.isActionLoading = true;
        this._appService.groupBuyingRequest.updateStatus(this.detail.id, { status, reason })
            .pipe(finalize(() => this.isActionLoading = false))
            .subscribe({
                next: () => {
                    onDone();
                    this._appService.showSuccess(this._appService.trans(successKey));
                    this.loadData();
                },
                error: (error) => {
                    onDone();
                    this._appService.showError(error?.errors?.[0] || error?.message
                        || this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
                }
            });
    }

    // ===== Xóa người khỏi nhóm =====
    openRemoveParticipant(participant: GroupBuyingParticipant): void {
        this.removingParticipant = participant;
        this.showRemoveParticipantModal = true;
    }

    confirmRemoveParticipant(): void {
        if (!this.detail || !this.removingParticipant) return;

        this.isActionLoading = true;
        this._appService.groupBuyingRequest.removeParticipant(this.detail.id, this.removingParticipant.id)
            .pipe(finalize(() => this.isActionLoading = false))
            .subscribe({
                next: () => {
                    this.showRemoveParticipantModal = false;
                    this.removingParticipant = null;
                    this._appService.showSuccess(this._appService.trans('ADMIN.GROUP_BUYING.REMOVE_SUCCESS'));
                    this.loadData();
                },
                error: (error) => {
                    this.showRemoveParticipantModal = false;
                    this._appService.showError(error?.errors?.[0] || error?.message
                        || this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
                }
            });
    }

    // ===== Sửa thông tin =====
    openEdit(): void {
        if (!this.detail) return;
        this.editData = {
            productName: this.detail.productName,
            productLink: this.detail.productLink ?? undefined,
            targetPrice: this.detail.targetPrice ?? undefined,
            targetPeopleCount: this.detail.targetPeopleCount,
            note: this.detail.note ?? undefined
        };
        this.showEditModal = true;
    }

    confirmEdit(): void {
        if (!this.detail) return;

        this.isActionLoading = true;
        this._appService.groupBuyingRequest.update(this.detail.id, this.editData)
            .pipe(finalize(() => this.isActionLoading = false))
            .subscribe({
                next: () => {
                    this.showEditModal = false;
                    this._appService.showSuccess(this._appService.trans('ADMIN.GROUP_BUYING.UPDATE_SUCCESS'));
                    this.loadData();
                },
                error: (error) => {
                    this._appService.showError(error?.errors?.[0] || error?.message
                        || this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
                }
            });
    }

    // ===== Helper hiển thị =====
    getStatusVariant(status: GroupBuyingStatus | undefined): BadgeVariant {
        const variants: Record<number, BadgeVariant> = {
            [GroupBuyingStatus.PENDING]: 'warning',
            [GroupBuyingStatus.ACTIVE]: 'info',
            [GroupBuyingStatus.COMPLETED]: 'success',
            [GroupBuyingStatus.CANCELLED]: 'danger'
        };
        return status ? (variants[status] || 'secondary') : 'secondary';
    }

    getStatusKey(status: GroupBuyingStatus | undefined): string {
        const keys: Record<number, string> = {
            [GroupBuyingStatus.PENDING]: 'GROUP_BUYING.STATUS.PENDING',
            [GroupBuyingStatus.ACTIVE]: 'GROUP_BUYING.STATUS.ACTIVE',
            [GroupBuyingStatus.COMPLETED]: 'GROUP_BUYING.STATUS.COMPLETED',
            [GroupBuyingStatus.CANCELLED]: 'GROUP_BUYING.STATUS.CANCELLED'
        };
        return status ? (keys[status] || '') : '';
    }

    formatDate(dateString?: string | null): string {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    formatPrice(value?: number | null): string {
        if (value === undefined || value === null) return '--';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
    }

    percent(): number {
        if (!this.detail?.targetPeopleCount) return 0;
        const value = (this.detail.currentPeopleCount / this.detail.targetPeopleCount) * 100;
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    goBack(): void {
        this._router.navigate(['/admin/group-buying']);
    }
}
