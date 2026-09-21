// components/social-sidebar/social-sidebar.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { SocialGroup } from '@core/models/social.model';
import { GroupBuyingFeedItem } from '@core/models/group-buying-request.model';
import { BusinessGroup } from '@core/models/business-group.model';

@Component({
    selector: 'app-social-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslateModule],
    template: `
        <!-- Nhóm ngành của bạn (dữ liệu thật từ API nhóm) -->
        <div class="sidebar-card mb-2">
            <h3><i class="fas fa-people-roof"></i> {{ 'SOCIAL.MY_GROUPS' | translate }}</h3>

            <div *ngIf="!myGroups.length" class="groups-empty">
                {{ 'SOCIAL.MY_GROUPS_EMPTY' | translate }}
            </div>

            <a *ngFor="let group of myGroups | slice:0:3" [routerLink]="['/groups', group.id]" class="group-link">
                <i class="fas fa-people-group"></i>
                <div class="group-link__info">
                    <span class="name">{{ group.name }}</span>
                    <span class="meta">
                        {{ group.membersCount }} {{ 'GROUPS.MEMBERS' | translate }} ·
                        {{ group.postsCount }} {{ 'GROUPS.POSTS' | translate }}
                    </span>
                </div>
                <i class="fas fa-chevron-right group-link__chevron"></i>
            </a>

            <a routerLink="/groups" class="groups-cta">
                {{ 'SOCIAL.VIEW_ALL_GROUPS' | translate }} <i class="fas fa-arrow-right"></i>
            </a>
        </div>

        <!-- Mua chung đang mở -->
        <div class="sidebar-card mb-2">
            <h3><i class="fas fa-people-group"></i> {{ 'SOCIAL.GROUP_BUYING_OPEN' | translate }}</h3>
            <div *ngIf="!groupBuying.length" class="gb-empty">{{ 'SOCIAL.GROUP_BUYING_EMPTY' | translate }}</div>
            <div *ngFor="let item of groupBuying | slice:0:3" class="gb-item" (click)="openGroupBuying.emit(item)">
                <div class="gb-badge-count">
                    <span class="current">{{ item.currentPeopleCount }}</span>
                    <span class="target">/{{ item.targetPeopleCount }}</span>
                </div>
                <div class="gb-info">
                    <span class="title">{{ item.productName }}</span>
                    <span class="need">
                        <i class="fas fa-user-group"></i>
                        @if (item.neededPeopleCount > 0) {
                        {{ 'GROUP_BUYING.NEED_MORE' | translate:{ count: item.neededPeopleCount } }}
                        } @else {
                        {{ 'GROUP_BUYING.ENOUGH' | translate }}
                        }
                    </span>
                </div>
            </div>
        </div>

        <!-- Nhóm ngành nổi bật (dữ liệu thật) -->
        <div class="sidebar-card mb-2">
            <h3><i class="fas fa-layer-group"></i> {{ 'SOCIAL.POPULAR_GROUPS' | translate }}</h3>

            <div *ngIf="!featuredGroups.length" class="groups-empty">
                {{ 'SOCIAL.GROUPS_EMPTY' | translate }}
            </div>

            <a *ngFor="let group of featuredGroups | slice:0:3" [routerLink]="['/groups', group.id]" class="group-link">
                <i class="fas fa-people-group"></i>
                <div class="group-link__info">
                    <span class="name">{{ group.name }}</span>
                    <span class="meta">
                        {{ group.businessFieldName || ('GROUPS.LABEL' | translate) }} ·
                        {{ group.membersCount }} {{ 'GROUPS.MEMBERS' | translate }}
                    </span>
                </div>
                <span *ngIf="group.isMember" class="group-link__badge">{{ 'GROUPS.JOINED' | translate }}</span>
                <i *ngIf="!group.isMember" class="fas fa-chevron-right group-link__chevron"></i>
            </a>
        </div>
    `,
    styles: [`
        /* Container - có khoảng cách giữa các card */
        .social-sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* Card */
        .sidebar-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            transition: box-shadow 0.2s ease;
        }

        .sidebar-card:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .sidebar-card h3 {
            font-size: 15px;
            font-weight: 700;
            color: #1F2937;
            margin: 0 0 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }









        .gb-item {
            display: flex;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            cursor: pointer;
            transition: background 0.2s ease;
            border-radius: 6px;
            padding-left: 4px;
        }

        .gb-item:hover {
            background: #f8fafc;
        }

        .gb-item:last-child {
            border-bottom: none;
        }

        .gb-empty {
            font-size: 13px;
            color: #9CA3AF;
        }

        .gb-badge-count {
            display: flex;
            align-items: baseline;
            justify-content: center;
            min-width: 52px;
            background: #f5f3ff;
            border-radius: 8px;
            padding: 6px 8px;
            flex-shrink: 0;
        }

        .gb-badge-count .current {
            font-size: 18px;
            font-weight: 700;
            color: #7C3AED;
            line-height: 1.1;
        }

        .gb-badge-count .target {
            font-size: 12px;
            color: #9CA3AF;
            font-weight: 600;
        }

        .gb-info {
            flex: 1;
            min-width: 0;
        }

        .gb-info .title {
            font-size: 14px;
            font-weight: 500;
            color: #1F2937;
            display: block;
            line-height: 1.3;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .gb-info .need {
            font-size: 12px;
            color: #D97706;
            display: block;
            font-weight: 600;
        }










        @media (max-width: 992px) {
            .social-sidebar {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 16px;
            }

            .sidebar-card {
                padding: 16px;
            }
        }

        @media (max-width: 768px) {
            .social-sidebar {
                grid-template-columns: 1fr 1fr;
                gap: 14px;
            }

            .sidebar-card {
                padding: 14px 16px;
            }


            .event-info .title {
                font-size: 13px;
            }


        }

        @media (max-width: 480px) {
            .social-sidebar {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .sidebar-card {
                padding: 12px 14px;
            }


            .event-date {
                min-width: 40px;
                padding: 2px 6px;
            }

            .event-date .day {
                font-size: 16px;
            }

            .event-date .month {
                font-size: 10px;
            }

        }

        /* Nhóm ngành (dữ liệu thật từ API nhóm) */
        .groups-empty {
            font-size: 13px;
            color: #9CA3AF;
            padding: 4px 0 8px;
        }

        .group-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 8px;
            border-radius: 10px;
            text-decoration: none;
            transition: background 0.2s ease;
        }

        .group-link:hover {
            background: #F3F4F6;
        }

        .group-link > i {
            font-size: 18px;
            color: #0d9488;
        }

        .group-link__info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            flex: 1;
        }

        .group-link__info .name {
            font-size: 13px;
            font-weight: 600;
            color: #1F2937;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .group-link__info .meta {
            font-size: 11px;
            color: #6B7280;
        }

        .group-link__chevron {
            font-size: 12px;
            color: #9CA3AF;
        }

        .group-link__badge {
            font-size: 10px;
            font-weight: 700;
            color: #047857;
            background: #ECFDF5;
            border-radius: 999px;
            padding: 3px 8px;
        }

        .groups-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #0d9488;
            text-decoration: none;
        }

    `]
})
export class SocialSidebarComponent {
    @Input() groupBuying: GroupBuyingFeedItem[] = [];
    /** Nhóm theo lĩnh vực mà người đang xem đã tham gia */
    @Input() myGroups: BusinessGroup[] = [];
    /** Nhóm theo lĩnh vực nổi bật (nhiều thành viên nhất) */
    @Input() featuredGroups: BusinessGroup[] = [];

    @Output() openGroupBuying = new EventEmitter<GroupBuyingFeedItem>();

    /** Giữ lại cho tab "Nhóm" của trang social (dữ liệu từ socialService) */
    @Input() groups: SocialGroup[] = [];
    @Output() joinGroup = new EventEmitter<SocialGroup>();
}