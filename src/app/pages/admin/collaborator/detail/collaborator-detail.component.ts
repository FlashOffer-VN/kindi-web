import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AppService } from '@core/services/app.service';
import { Collaborator, CollaboratorStatus, UpdateCollaboratorRequest } from '@core/models/collaborator.model';
import { BusinessInfo, toBusinessInfo } from '@core/models/business-info.model';
import { ApiResponse } from '@core/models/paged-response.model';

// Shared Components
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { BusinessInfoComponent } from '@shared/components/business-info/business-info.component';
import { CollaboratorEditFormComponent } from '../edit/collaborator-edit-form.component';

@Component({
    selector: 'app-admin-collaborator-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule,
        ButtonComponent,
        LoadingComponent,
        BadgeComponent,
        ModalComponent,
        BusinessInfoComponent,
        CollaboratorEditFormComponent
    ],
    templateUrl: './collaborator-detail.component.html',
    styleUrls: ['./collaborator-detail.component.css']
})
export class AdminCollaboratorDetailComponent implements OnInit {
    collaborator: Collaborator | null = null;
    isLoading = true;
    isActionLoading = false;

    // Modal
    showApproveModal = false;
    showRejectModal = false;
    showEditModal = false;

    /** Bản sao của collaborator truyền vào form sửa — đổi reference mỗi lần mở. */
    editCollaborator: Collaborator | null = null;

    constructor(
        private _appService: AppService,
        private _route: ActivatedRoute,
        private _router: Router
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    /**
     * Chi tiết lấy từ CollaboratorService (`GET /Collaborators/{id}`) — trả đủ field
     * để form sửa có dữ liệu (position, skills, interests, goals...). Các thao tác
     * khác (danh sách, duyệt/từ chối, xóa/khôi phục) vẫn đi qua CollaboratorService.
     */
    loadData(): void {
        const id = this._route.snapshot.paramMap.get('id');
        if (!id) {
            this._appService.showError(this._appService.trans('COMMON.ERROR.INVALID_ID'));
            this._router.navigate(['/admin/collaborator']);
            return;
        }

        this.isLoading = true;
        this._appService.collaboratorService.getById(id).subscribe({
            next: (response: ApiResponse<Collaborator>) => {
                if (!response?.data) {
                    this._appService.showError(this._appService.trans('COMMON.ERROR.NOT_FOUND'));
                    this._router.navigate(['/admin/collaborator']);
                    return;
                }
                this.collaborator = response.data;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this._appService.showError(this._appService.trans('COMMON.ERROR.LOAD_FAILED'));
                this._router.navigate(['/admin/collaborator']);
            }
        });
    }

    getStatusVariant(status: CollaboratorStatus): BadgeVariant {
        const variants: Record<CollaboratorStatus, BadgeVariant> = {
            [CollaboratorStatus.Pending]: 'warning',
            [CollaboratorStatus.Approved]: 'success',
            [CollaboratorStatus.Rejected]: 'danger',
            [CollaboratorStatus.Suspended]: 'secondary',
            [CollaboratorStatus.Active]: 'success'
        };
        return variants[status] || 'secondary';
    }

    getStatusKey(status: CollaboratorStatus): string {
        const keys: Record<CollaboratorStatus, string> = {
            [CollaboratorStatus.Pending]: 'pending',
            [CollaboratorStatus.Approved]: 'approved',
            [CollaboratorStatus.Rejected]: 'rejected',
            [CollaboratorStatus.Suspended]: 'suspended',
            [CollaboratorStatus.Active]: 'active'
        };
        return keys[status] || 'pending';
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

    /**
     * Dữ liệu doanh nghiệp — `toBusinessInfo()` tự ưu tiên object lồng
     * (`businessInfo` / `companyInfo`) rồi mới fallback sang field phẳng ở root.
     */
    getBusinessInfo(): BusinessInfo | null {
        if (!this.collaborator) return null;
        return toBusinessInfo(this.collaborator);
    }

    canApprove(): boolean {
        return this.collaborator?.status === CollaboratorStatus.Pending;
    }

    canReject(): boolean {
        return this.collaborator?.status === CollaboratorStatus.Pending;
    }

    onApprove(): void {
        this.showApproveModal = true;
    }

    confirmApprove(): void {
        if (!this.collaborator) return;
        this.isActionLoading = true;
        this._appService.collaboratorService.approve(this.collaborator.id).subscribe({
            next: () => {
                this.isActionLoading = false;
                this.showApproveModal = false;
                this._appService.showSuccess(this._appService.trans('ADMIN.CTV.APPROVED_SUCCESS'));
                // Load lại từ CollaboratorService để có đủ field cho form sửa
                this.loadData();
            },
            error: () => {
                this.isActionLoading = false;
                this.showApproveModal = false;
                this._appService.showError(this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
            }
        });
    }

    onReject(): void {
        this.showRejectModal = true;
    }

    confirmReject(): void {
        if (!this.collaborator) return;
        this.isActionLoading = true;
        this._appService.collaboratorService.reject(this.collaborator.id).subscribe({
            next: () => {
                this.isActionLoading = false;
                this.showRejectModal = false;
                this._appService.showSuccess(this._appService.trans('ADMIN.CTV.REJECTED_SUCCESS'));
                this.loadData();
            },
            error: () => {
                this.isActionLoading = false;
                this.showRejectModal = false;
                this._appService.showError(this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
            }
        });
    }

    goBack(): void {
        this._router.navigate(['/admin/collaborator']);
    }

    // ==============================
    // EDIT
    // ==============================

    openEdit(): void {
        if (!this.collaborator) return;
        // Copy sang object mới để form luôn dựng lại từ dữ liệu hiện tại
        this.editCollaborator = { ...this.collaborator };
        this.showEditModal = true;
    }

    onEditSubmit(payload: UpdateCollaboratorRequest): void {
        if (!this.collaborator) return;

        if (Object.keys(payload).length === 0) {
            this.showEditModal = false;
            this._appService.showInfo(this._appService.trans('COMMON.NO_CHANGES'));
            return;
        }

        this.isActionLoading = true;
        this._appService.collaboratorService.update(this.collaborator.id, payload).subscribe({
            next: () => {
                this.isActionLoading = false;
                this.showEditModal = false;
                this._appService.showSuccess(this._appService.trans('ADMIN.CTV.UPDATED_SUCCESS'));
                this.loadData();
            },
            error: (err) => {
                this.isActionLoading = false;
                this._appService.showError(err?.message || this._appService.trans('COMMON.ERROR.UPDATE_FAILED'));
            }
        });
    }
}