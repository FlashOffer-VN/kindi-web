import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { BusinessGroup, CreateBusinessGroupRequest } from '@core/models/business-group.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { StatusTabItem, StatusTabsComponent } from '@shared/components/status-tabs/status-tabs.component';

/** Quản lý nhóm theo lĩnh vực kinh doanh (admin) */
@Component({
    selector: 'app-admin-group-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule, ButtonComponent,
        InputComponent, LoadingComponent, ModalComponent, PaginationComponent, StatusTabsComponent],
    templateUrl: './group-list.component.html',
})
export class AdminGroupListComponent implements OnInit {
    groups: BusinessGroup[] = [];
    isLoading = false;

    searchText = '';
    activeTab = 'all';
    onlyPending = false;
    onlyPrivate = false;
    statusTabs: StatusTabItem[] = [];

    page = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;

    formVisible = false;
    isSaving = false;
    editingId: string | null = null;
    form: FormGroup;

    constructor(
        private readonly fb: FormBuilder,
        private readonly _appService: AppService,
        private readonly router: Router
    ) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            description: ['', [Validators.maxLength(1000)]],
            businessFieldName: ['', [Validators.maxLength(200)]],
            coverImageUrl: ['', [Validators.maxLength(500)]],
            requiresApproval: [true],
            isActive: [true]
        });
    }

    ngOnInit(): void {
        this.statusTabs = [
            { key: 'all', label: this._appService.trans('ADMIN.GROUPS.TAB_ALL') },
            { key: 'active', label: this._appService.trans('ADMIN.GROUPS.TAB_ACTIVE') },
            { key: 'inactive', label: this._appService.trans('ADMIN.GROUPS.TAB_INACTIVE') }
        ];
        this.load();
    }

    load(page = this.page): void {
        this.page = page;
        this.isLoading = true;

        this._appService.businessGroupService.getAdminList({
            page: this.page,
            pageSize: this.pageSize,
            search: this.searchText,
            isActive: this.activeTab === 'all' ? null : this.activeTab === 'active',
            hasPendingMembers: this.onlyPending,
            hasPrivateRequests: this.onlyPrivate
        }).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.groups = response?.data ?? [];
                this.totalCount = response?.totalCount ?? 0;
                this.totalPages = response?.totalPages ?? 1;
            },
            error: (error: unknown) => {
                this.isLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    onSearch(): void {
        this.load(1);
    }

    onTabChange(tab: string): void {
        this.activeTab = tab;
        this.load(1);
    }

    togglePending(): void {
        this.onlyPending = !this.onlyPending;
        this.load(1);
    }

    togglePrivate(): void {
        this.onlyPrivate = !this.onlyPrivate;
        this.load(1);
    }

    onPageChange(page: number): void {
        this.load(page);
    }

    openCreate(): void {
        this.editingId = null;
        this.form.reset({ requiresApproval: true, isActive: true });
        this.formVisible = true;
    }

    openEdit(group: BusinessGroup): void {
        this.editingId = group.id;
        this.form.reset({
            name: group.name,
            description: group.description ?? '',
            businessFieldName: group.businessFieldName ?? '',
            coverImageUrl: group.coverImageUrl ?? '',
            requiresApproval: group.requiresApproval,
            isActive: group.isActive
        });
        this.formVisible = true;
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload: CreateBusinessGroupRequest = {
            name: this.form.value.name,
            description: this.form.value.description || undefined,
            businessFieldName: this.form.value.businessFieldName || undefined,
            coverImageUrl: this.form.value.coverImageUrl || undefined,
            requiresApproval: this.form.value.requiresApproval === true,
            isActive: this.form.value.isActive === true
        };

        this.isSaving = true;
        const request = this.editingId
            ? this._appService.businessGroupService.update(this.editingId, payload)
            : this._appService.businessGroupService.create(payload);

        request.subscribe({
            next: (response) => {
                this.isSaving = false;
                this.formVisible = false;
                this._appService.showSuccess(response?.message || this._appService.trans('ADMIN.GROUPS.SAVE_SUCCESS'));
                this.load(this.editingId ? this.page : 1);
            },
            error: (error: unknown) => {
                this.isSaving = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    remove(group: BusinessGroup): void {
        this._appService.confirmDelete(this._appService.trans('ADMIN.GROUPS.CONFIRM_DELETE_MESSAGE')).then((confirmed) => {
            if (!confirmed) return;

            this._appService.businessGroupService.remove(group.id).subscribe({
                next: () => {
                    this._appService.showSuccess(this._appService.trans('ADMIN.GROUPS.DELETE_SUCCESS'));
                    this.load();
                },
                error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
            });
        });
    }

    viewDetail(group: BusinessGroup): void {
        this.router.navigate(['/admin/groups', group.id]);
    }
}
