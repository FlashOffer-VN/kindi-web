// src/app/pages/partner/partner.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { GroupBuyingFeedItem, GroupBuyingStatus } from '@core/models/group-buying-request.model';

@Component({
    selector: 'app-partner',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    templateUrl: './partner.component.html',
    styleUrls: ['./partner.component.css']
})
export class PartnerComponent implements OnInit {
    /** Cơ hội mua chung đang mở (dữ liệu thật từ API công khai) */
    opportunities: GroupBuyingFeedItem[] = [];
    isLoading = true;

    /** Số đối tác doanh nghiệp đã được duyệt (khối thống kê — dữ liệu thật) */
    partnerCount = 0;

    constructor(private _appService: AppService) { }

    ngOnInit(): void {
        this.loadOpportunities();
        this.loadPartnerCount();
    }

    private loadPartnerCount(): void {
        this._appService.partnerService.getPublicSuppliers({ page: 1, pageSize: 1 }).subscribe({
            next: (response) => this.partnerCount = response?.totalCount ?? 0,
            error: () => this.partnerCount = 0
        });
    }

    loadOpportunities(): void {
        this.isLoading = true;

        this._appService.groupBuyingRequest.getPublic({ page: 1, pageSize: 6 }).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.opportunities = response?.data ?? [];
            },
            error: () => {
                this.isLoading = false;
                this.opportunities = [];
            }
        });
    }

    /** Tỷ lệ đã gom được người */
    opportunityPercent(item: GroupBuyingFeedItem): number {
        if (!item.targetPeopleCount) return 0;

        return Math.min(100, Math.round((item.currentPeopleCount / item.targetPeopleCount) * 100));
    }

    statusKey(status: GroupBuyingStatus): string {
        switch (status) {
            case GroupBuyingStatus.PENDING: return 'GROUP_BUYING.STATUS.PENDING';
            case GroupBuyingStatus.ACTIVE: return 'GROUP_BUYING.STATUS.ACTIVE';
            case GroupBuyingStatus.COMPLETED: return 'GROUP_BUYING.STATUS.COMPLETED';
            default: return 'GROUP_BUYING.STATUS.CANCELLED';
        }
    }

    statusClass(status: GroupBuyingStatus): string {
        switch (status) {
            case GroupBuyingStatus.ACTIVE: return 'is-active';
            case GroupBuyingStatus.PENDING: return 'is-pending';
            case GroupBuyingStatus.COMPLETED: return 'is-completed';
            default: return 'is-cancelled';
        }
    }
}
