// src/app/pages/admin/group-buying/group-buying-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AppService } from '@core/services/app.service';
import { GroupBuyingRequest, GroupBuyingStatus } from '@core/models/group-buying-request.model';
import { PagedResponse } from '@core/models/paged-response.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { StatusTabsComponent } from '@shared/components/status-tabs/status-tabs.component';

@Component({
    selector: 'app-admin-group-buying-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule, TranslateModule,
        ButtonComponent, InputComponent, LoadingComponent, PaginationComponent,
        BadgeComponent, StatusTabsComponent
    ],
    templateUrl: './group-buying-list.component.html',
    styleUrls: ['./group-buying-list.component.css']
})
export class AdminGroupBuyingListComponent implements OnInit {
    requests: GroupBuyingRequest[] = [];
    isLoading = true;

    searchText = '';

    activeTab = 'all';
    tabs: { key: string; label: string }[] = [];

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
            { key: 'pending', label: this._appService.trans('GROUP_BUYING.STATUS.PENDING') },
            { key: 'active', label: this._appService.trans('GROUP_BUYING.STATUS.ACTIVE') },
            { key: 'completed', label: this._appService.trans('GROUP_BUYING.STATUS.COMPLETED') },
            { key: 'cancelled', label: this._appService.trans('GROUP_BUYING.STATUS.CANCELLED') }
        ];
    }

    onTabChange(tab: string): void {
        this.activeTab = tab;
        this.pageNumber = 1;
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;
        this._appService.groupBuyingRequest.getData({
            page: this.pageNumber,
            pageSize: this.pageSize,
            search: this.searchText,
            status: this.activeTab === 'all' ? undefined : this.activeTab
        }).subscribe({
            next: (response: PagedResponse<GroupBuyingRequest>) => {
                this.requests = response?.data ?? [];
                this.pageNumber = response?.pageNumber ?? this.pageNumber;
                this.pageSize = response?.pageSize ?? this.pageSize;
                this.totalCount = response?.totalCount ?? 0;
                this.totalPages = response?.totalPages ?? 0;
                this.hasPreviousPage = response?.hasPreviousPage ?? false;
                this.hasNextPage = response?.hasNextPage ?? false;
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this._appService.showError(error?.message || this._appService.trans('COMMON.ERROR.LOAD_FAILED'));
            }
        });
    }

    onSearch(): void {
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

    getStatusVariant(status: GroupBuyingStatus): BadgeVariant {
        const variants: Record<number, BadgeVariant> = {
            [GroupBuyingStatus.PENDING]: 'warning',
            [GroupBuyingStatus.ACTIVE]: 'info',
            [GroupBuyingStatus.COMPLETED]: 'success',
            [GroupBuyingStatus.CANCELLED]: 'danger'
        };
        return variants[status] || 'secondary';
    }

    getStatusKey(status: GroupBuyingStatus): string {
        const keys: Record<number, string> = {
            [GroupBuyingStatus.PENDING]: 'GROUP_BUYING.STATUS.PENDING',
            [GroupBuyingStatus.ACTIVE]: 'GROUP_BUYING.STATUS.ACTIVE',
            [GroupBuyingStatus.COMPLETED]: 'GROUP_BUYING.STATUS.COMPLETED',
            [GroupBuyingStatus.CANCELLED]: 'GROUP_BUYING.STATUS.CANCELLED'
        };
        return keys[status] || 'GROUP_BUYING.STATUS.PENDING';
    }

    formatId(id: string): string {
        return id.substring(0, 8).toUpperCase();
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    formatPrice(value?: number | null): string {
        if (value === undefined || value === null) return '--';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
    }

    navigateToDetail(id: string): void {
        this._router.navigate(['/admin/group-buying', id]);
    }
}
