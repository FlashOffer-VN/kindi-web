import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AppService } from '@core/services/app.service';
import { PurchaseRequest, PurchaseRequestStatus } from '@core/models/purchase-request.model';
import { PagedResponse } from '@core/models/paged-response.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { StatusTabsComponent } from '@shared/components/status-tabs/status-tabs.component';
import { NgxFilterDaterangeComponent } from '@shared/components/filter-daterange/ngx-filter-daterange.component';

import { GroupPostType } from '@core/models/business-group.model';
import { ShareToGroupComponent } from '@shared/components/share-to-group/share-to-group.component';

@Component({
    selector: 'app-admin-purchase-request-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TranslateModule,
        ButtonComponent,
        InputComponent,
        LoadingComponent,
        PaginationComponent,
        BadgeComponent,
        StatusTabsComponent,
        NgxFilterDaterangeComponent,
        ShareToGroupComponent,],
    templateUrl: './purchase-request-list.component.html',
    styleUrls: ['./purchase-request-list.component.css']
})
export class AdminPurchaseRequestListComponent implements OnInit {
    /** Loại bài khi chuyển tiếp vào nhóm ngành */
    readonly groupPostType = GroupPostType;

    // Data
    requests: PurchaseRequest[] = [];
    isLoading = true;

    // Search
    searchText = '';
    fromDate: string | null = null;
    toDate: string | null = null;

    // Tab lọc status
    activeTab = 'all';
    tabs: { key: string; label: string }[] = [];

    // Pagination
    pageNumber = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;
    hasPreviousPage = false;
    hasNextPage = false;

    constructor(private _appService: AppService, private _router: Router) { }

    ngOnInit(): void {
        this.buildTabs();
        this.loadData();
    }

    private buildTabs(): void {
        this.tabs = [
            { key: 'all', label: this._appService.trans('COMMON.ALL') },
            { key: 'pending', label: this._appService.trans('COMMON.STATUS.PENDING') },
            { key: 'contacted', label: this._appService.trans('COMMON.STATUS.CONTACTED') },
            { key: 'completed', label: this._appService.trans('COMMON.STATUS.COMPLETED') }
        ];
    }

    onTabChange(tab: string): void {
        this.activeTab = tab;
        this.pageNumber = 1;
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;

        let status: PurchaseRequestStatus | undefined;
        if (this.activeTab !== 'all') {
            switch (this.activeTab) {
                case 'pending': status = PurchaseRequestStatus.PENDING; break;
                case 'contacted': status = PurchaseRequestStatus.CONTACTED; break;
                case 'completed': status = PurchaseRequestStatus.COMPLETED; break;
            }
        }

        this._appService.purchaseRequest
            .getData(
                this.pageNumber,
                this.pageSize,
                this.searchText,
                status,
                this.fromDate ?? undefined,
                this.toDate ?? undefined
            )
            .subscribe({
                next: (response: PagedResponse<PurchaseRequest>) => {
                    this.requests = response.data;
                    this.pageNumber = response.pageNumber;
                    this.pageSize = response.pageSize;
                    this.totalCount = response.totalCount;
                    this.totalPages = response.totalPages;
                    this.hasPreviousPage = response.hasPreviousPage;
                    this.hasNextPage = response.hasNextPage;
                    this.isLoading = false;
                },
                error: () => {
                    this.isLoading = false;
                    this._appService.showError(this._appService.trans('COMMON.ERROR.LOAD_FAILED'));
                }
            });
    }

    onSearch(): void {
        this.pageNumber = 1;
        this.loadData();
    }

    onRangeChange(range: { from: string | null; to: string | null }): void {
        this.fromDate = range.from;
        this.toDate = range.to;
        this.pageNumber = 1;
        this.loadData();
    }

    onPageChange(page: number): void {
        this.pageNumber = page;
        this.loadData();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.pageNumber = 1;
        this.loadData();
    }

    getStatusVariant(status: PurchaseRequestStatus): BadgeVariant {
        const variants: Record<PurchaseRequestStatus, BadgeVariant> = {
            [PurchaseRequestStatus.PENDING]: 'warning',
            [PurchaseRequestStatus.CONTACTED]: 'info',
            [PurchaseRequestStatus.COMPLETED]: 'success'
        };
        return variants[status] || 'secondary';
    }

    getStatusKey(status: PurchaseRequestStatus): string {
        const keys: Record<PurchaseRequestStatus, string> = {
            [PurchaseRequestStatus.PENDING]: 'pending',
            [PurchaseRequestStatus.CONTACTED]: 'contacted',
            [PurchaseRequestStatus.COMPLETED]: 'completed'
        };
        return keys[status] || 'pending';
    }

    formatId(id: string): string {
        return id.substring(0, 8).toUpperCase();
    }

    formatDate(dateString: string): string {
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

    navigateToDetail(id: string): void {
        this._router.navigate(['/admin/purchase-requests', id]);
    }
}