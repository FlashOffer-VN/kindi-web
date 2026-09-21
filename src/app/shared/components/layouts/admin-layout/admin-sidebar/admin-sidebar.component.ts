// shared/components/layouts/admin-layout/admin-sidebar/admin-sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '../../../../../core/services/app.service';

@Component({
    selector: 'app-admin-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
    templateUrl: './admin-sidebar.component.html',
    styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent {
    @Input() isOpen = true;
    @Output() toggle = new EventEmitter<void>();

    menuItems: MenuItem[] = [
        { path: '/admin/dashboard', icon: 'fa-solid fa-house', label: 'Dashboard' },
        { path: '/admin/admin-crm', icon: 'fa-solid fa-chart-pie', label: 'ADMIN.SIDEBAR.CRM' },
        { path: '/admin/offers', icon: 'fa-solid fa-tags', label: 'ADMIN.SIDEBAR.OFFERS' },
        { path: '/admin/purchase-requests', icon: 'fa-solid fa-cart-shopping', label: 'ADMIN.SIDEBAR.PURCHASE_REQUESTS' },
        { path: '/admin/group-buying', icon: 'fa-solid fa-people-group', label: 'ADMIN.SIDEBAR.GROUP_BUYING' },
        { path: '/admin/groups', icon: 'fa-solid fa-people-roof', label: 'ADMIN.SIDEBAR.GROUPS' },
        { path: '/admin/collaborator', icon: 'fa-solid fa-users', label: 'ADMIN.SIDEBAR.COLLABORATOR' },
        { path: '/admin/social-posts', icon: 'fa-solid fa-clipboard-check', label: 'ADMIN.SIDEBAR.SOCIAL_POSTS' },
        { path: '/admin/partner', icon: 'fa-solid fa-building', label: 'ADMIN.SIDEBAR.PARTNER' },
        { path: '/admin/settings', icon: 'fa-solid fa-cog', label: 'ADMIN.SIDEBAR.SETTINGS' },
        { path: '/', icon: 'fa-solid fa-arrow-right-from-bracket', label: 'ADMIN.SIDEBAR.BACK_TO_SITE' },
    ];

    constructor(private _appService: AppService) { }

    toggleSidebar(): void {
        this.toggle.emit();
    }

    /** Đăng xuất khỏi trang quản trị — có dialog xác nhận (bỏ confirm() mặc định của trình duyệt) */
    logout(): void {
        this._appService.modal.confirm({
            title: this._appService.trans('ADMIN.LOGOUT_TITLE'),
            message: this._appService.trans('ADMIN.LOGOUT_MESSAGE'),
            confirmText: this._appService.trans('ADMIN.SIDEBAR.LOGOUT'),
            cancelText: this._appService.trans('COMMON.BUTTON.CANCEL'),
            confirmVariant: 'danger'
        }).then(confirmed => {
            if (confirmed) {
                this._appService.auth.logoutToAdmin();
            }
        });
    }
}

interface MenuItem {
    path: string;
    icon: string;
    label: string;
}