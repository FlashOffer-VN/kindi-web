import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AppService } from '@core/services/app.service';
import { OfferRequest, OfferStatus } from '@core/models/offer-request.model';

// Shared Components
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

import { GroupPostType } from '@core/models/business-group.model';
import { ShareToGroupComponent } from '@shared/components/share-to-group/share-to-group.component';

@Component({
    selector: 'app-admin-offer-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule,
        ButtonComponent,
        LoadingComponent,
        BadgeComponent,
        ModalComponent,
        ShareToGroupComponent,],
    templateUrl: './offer-detail.component.html',
    styleUrls: ['./offer-detail.component.css']
})
export class AdminOfferDetailComponent implements OnInit {
    /** Loại bài khi gửi thông tin vào nhóm ngành */
    readonly groupPostType = GroupPostType;

    offer: OfferRequest | null = null;
    isLoading = true;
    isActionLoading = false;

    // Modal
    showApproveModal = false;
    showRejectModal = false;
    showExpireModal = false;

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
            this._router.navigate(['/admin/offers']);
            return;
        }

        this.isLoading = true;
        this._appService.offerRequest.getById(id).subscribe({
            next: (response) => {
                if (!response.data) {
                    this._appService.showError(this._appService.trans('COMMON.ERROR.NOT_FOUND'));
                    this._router.navigate(['/admin/offers']);
                    return;
                }
                this.offer = response.data;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this._appService.showError(this._appService.trans('COMMON.ERROR.LOAD_FAILED'));
                this._router.navigate(['/admin/offers']);
            }
        });
    }

    getStatusVariant(status: OfferStatus): BadgeVariant {
        const variants: Record<OfferStatus, BadgeVariant> = {
            [OfferStatus.PENDING]: 'warning',
            [OfferStatus.APPROVED]: 'success',
            [OfferStatus.REJECTED]: 'danger',
            [OfferStatus.EXPIRED]: 'secondary'
        };
        return variants[status] || 'secondary';
    }

    getStatusKey(status: OfferStatus): string {
        const keys: Record<OfferStatus, string> = {
            [OfferStatus.PENDING]: 'pending',
            [OfferStatus.APPROVED]: 'approved',
            [OfferStatus.REJECTED]: 'rejected',
            [OfferStatus.EXPIRED]: 'expired'
        };
        return keys[status] || 'pending';
    }

    formatId(id: string): string {
        return id.substring(0, 8).toUpperCase();
    }

    formatDate(dateString?: string): string {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatPrice(value?: number | null): string {
        if (value === undefined || value === null) return '--';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    }

    canApprove(): boolean {
        return this.offer?.status === OfferStatus.PENDING;
    }

    canReject(): boolean {
        return this.offer?.status === OfferStatus.PENDING;
    }

    canExpire(): boolean {
        return this.offer?.status === OfferStatus.PENDING || this.offer?.status === OfferStatus.APPROVED;
    }

    onApprove(): void {
        this.showApproveModal = true;
    }

    onReject(): void {
        this.showRejectModal = true;
    }

    onExpire(): void {
        this.showExpireModal = true;
    }

    confirmApprove(): void {
        this.updateStatus(OfferStatus.APPROVED, 'ADMIN.OFFERS.APPROVED_SUCCESS', () => this.showApproveModal = false);
    }

    confirmReject(): void {
        this.updateStatus(OfferStatus.REJECTED, 'ADMIN.OFFERS.REJECTED_SUCCESS', () => this.showRejectModal = false);
    }

    confirmExpire(): void {
        this.updateStatus(OfferStatus.EXPIRED, 'ADMIN.OFFERS.EXPIRED_SUCCESS', () => this.showExpireModal = false);
    }

    private updateStatus(status: OfferStatus, successKey: string, closeModal: () => void): void {
        if (!this.offer) return;

        this.isActionLoading = true;
        this._appService.offerRequest.updateStatus(this.offer.id, status).subscribe({
            next: () => {
                this.isActionLoading = false;
                closeModal();
                this._appService.showSuccess(this._appService.trans(successKey));
                this.loadData();
            },
            error: () => {
                this.isActionLoading = false;
                closeModal();
                this._appService.showError(this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
            }
        });
    }

    goBack(): void {
        this._router.navigate(['/admin/offers']);
    }
}