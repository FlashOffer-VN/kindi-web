import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { BusinessFieldOption, BusinessFieldService } from '@core/services/business-field.service';
import {
    PublicPartner,
    getBusinessTypeLabel,
    getCompanySizeLabel
} from '@core/models/partner.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { NgSelectWrapperComponent } from '@shared/components/select/ng-select-wrapper.component';

/**
 * Trang Nguồn cung: danh sách đối tác doanh nghiệp ĐÃ ĐĂNG KÝ với Kindi và đã được duyệt
 * (GET /api/v1/Partners/public) — thay cho dữ liệu mẫu trước đây.
 */
@Component({
    selector: 'app-suppliers',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, TranslateModule, LoadingComponent, PaginationComponent,
        NgSelectWrapperComponent],
    templateUrl: './suppliers.component.html',
    styleUrls: ['./suppliers.component.css']
})
export class SuppliersComponent implements OnInit, OnDestroy {
    suppliers: PublicPartner[] = [];
    isLoading = false;

    searchTerm = '';
    selectedBusinessFieldId: string | null = null;
    businessFieldOptions: BusinessFieldOption[] = [];

    page = 1;
    pageSize = 12;
    totalCount = 0;
    totalPages = 1;

    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly _businessFieldService = inject(BusinessFieldService);

    constructor(private readonly _appService: AppService) { }

    ngOnInit(): void {
        this._businessFieldService.getActive().subscribe({
            next: (options) => (this.businessFieldOptions = options),
            error: () => (this.businessFieldOptions = [])
        });

        this.load();
    }

    ngOnDestroy(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
    }

    load(page = this.page): void {
        this.page = page;
        this.isLoading = true;

        this._appService.partnerService.getPublicSuppliers({
            page: this.page,
            pageSize: this.pageSize,
            search: this.searchTerm,
            businessFieldId: this.selectedBusinessFieldId
        }).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.suppliers = response?.data ?? [];
                this.totalCount = response?.totalCount ?? 0;
                this.totalPages = response?.totalPages ?? 1;
            },
            error: (error: unknown) => {
                this.isLoading = false;
                this.suppliers = [];
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    /** Gõ tới đâu tìm tới đó nhưng gọi API có debounce (tránh 1 request cho mỗi ký tự) */
    onSearchInput(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.load(1), 400);
    }

    onFilterChange(): void {
        this.load(1);
    }

    onPageChange(page: number): void {
        this.load(page);
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedBusinessFieldId = null;
        this.load(1);
    }

    businessTypeText(partner: PublicPartner): string {
        return getBusinessTypeLabel(partner.businessType);
    }

    companySizeText(partner: PublicPartner): string {
        return getCompanySizeLabel(partner.companySize);
    }
}
