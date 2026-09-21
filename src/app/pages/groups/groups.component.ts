import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { BusinessGroup, GroupMemberStatus } from '@core/models/business-group.model';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

/** Danh sách nhóm theo lĩnh vực kinh doanh (công khai) */
@Component({
    selector: 'app-groups',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, TranslateModule, InputComponent, ButtonComponent, LoadingComponent, PaginationComponent],
    templateUrl: './groups.component.html',
})
export class GroupsComponent implements OnInit {
    groups: BusinessGroup[] = [];
    isLoading = false;
    searchText = '';
    mineOnly = false;

    page = 1;
    pageSize = 12;
    totalCount = 0;
    totalPages = 1;

    readonly memberStatus = GroupMemberStatus;

    constructor(private readonly _appService: AppService) { }

    ngOnInit(): void {
        this.load();
    }

    load(page = this.page): void {
        this.page = page;
        this.isLoading = true;

        this._appService.businessGroupService.getPublic({
            page: this.page,
            pageSize: this.pageSize,
            search: this.searchText,
            mineOnly: this.mineOnly
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

    setFilter(mineOnly: boolean): void {
        if (this.mineOnly === mineOnly) return;
        this.mineOnly = mineOnly;
        this.load(1);
    }

    onPageChange(page: number): void {
        this.load(page);
    }

    isMember(group: BusinessGroup): boolean {
        return group.isMember || group.myMemberStatus === this.memberStatus.Active;
    }

    isPending(group: BusinessGroup): boolean {
        return group.myMemberStatus === this.memberStatus.Pending;
    }
}
