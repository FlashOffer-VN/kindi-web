// components/group-buying-card/group-buying-card.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { GroupBuyingFeedItem, GroupBuyingStatus } from '@core/models/group-buying-request.model';
import { GroupPostType } from '@core/models/business-group.model';
import { ShareToGroupComponent } from '@shared/components/share-to-group/share-to-group.component';

@Component({
    selector: 'app-group-buying-card',
    standalone: true,
    imports: [CommonModule, TranslateModule, ShareToGroupComponent],
    template: `
        <div class="gb-card" (click)="open.emit(item)">
            <div class="gb-head">
                <span class="gb-badge" [class]="statusClass(item.status)">
                    {{ statusKey(item.status) | translate }}
                </span>
                @if (item.businessFieldName) {
                <span class="gb-field"><i class="fas fa-tag"></i> {{ item.businessFieldName }}</span>
                }
            </div>

            <h3 class="gb-title">{{ item.productName }}</h3>

            @if (item.targetPrice) {
            <div class="gb-price">
                <span class="label">{{ 'GROUP_BUYING.TARGET_PRICE' | translate }}</span>
                <span class="value">{{ item.targetPrice | number:'1.0-0' }}đ</span>
            </div>
            }

            <div class="gb-progress">
                <div class="bar">
                    <div class="fill" [style.width.%]="percent(item)"></div>
                </div>
                <div class="meta">
                    <span class="joined">
                        <i class="fas fa-user-group"></i>
                        {{ item.currentPeopleCount }}/{{ item.targetPeopleCount }} {{ 'GROUP_BUYING.PEOPLE_UNIT' | translate }}
                    </span>
                    @if (item.neededPeopleCount > 0) {
                    <span class="need">{{ 'GROUP_BUYING.NEED_MORE' | translate:{ count: item.neededPeopleCount } }}</span>
                    } @else {
                    <span class="enough">{{ 'GROUP_BUYING.ENOUGH' | translate }}</span>
                    }
                </div>
            </div>

            @if (item.participants.length) {
            <div class="gb-people">
                @for (name of item.participants; track name) {
                <span class="person">{{ name }}</span>
                }
            </div>
            }

            <div class="gb-foot">
                <span class="creator">
                    <i class="fas fa-user"></i> {{ item.creatorName }}
                </span>
                @if (item.isMine) {
                <span class="mine"><i class="fas fa-crown"></i> {{ 'GROUP_BUYING.MINE' | translate }}</span>
                } @else if (item.isJoinedByMe) {
                <span class="joined-flag"><i class="fas fa-check"></i> {{ 'GROUP_BUYING.JOINED' | translate }}</span>
                } @else {
                <button class="join-btn" [class.disabled]="!item.canJoin" (click)="onJoinClick($event)">
                    {{ 'GROUP_BUYING.JOIN' | translate }}
                </button>
                }
                <span class="share-wrap" (click)="$event.stopPropagation()">
                    <app-share-to-group [refId]="item.id" [refCode]="item.groupBuyingRequestCode"
                        [postType]="groupPostType.GroupBuyingRequest" [targetTitle]="item.productName"
                        [refLabelKey]="'SHARE_TO_GROUP.FROM_GROUP_BUYING'"></app-share-to-group>
                </span>
            </div>
        </div>
    `,
    styles: [`
        .share-wrap {
            display: inline-flex;
            margin-left: auto;
        }

        .gb-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            height: 100%;
        }

        .gb-card:hover {
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }

        .gb-head {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .gb-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 999px;
            text-transform: uppercase;
        }

        .gb-badge.active { background: #dbeafe; color: #1d4ed8; }
        .gb-badge.pending { background: #fef3c7; color: #b45309; }
        .gb-badge.completed { background: #d1fae5; color: #047857; }
        .gb-badge.cancelled { background: #fee2e2; color: #b91c1c; }

        .gb-field {
            font-size: 12px;
            color: #6b7280;
        }

        .gb-title {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin: 0;
            line-height: 1.35;
        }

        .gb-price {
            display: flex;
            align-items: baseline;
            gap: 6px;
            font-size: 13px;
            color: #6b7280;
        }

        .gb-price .value {
            font-size: 16px;
            font-weight: 700;
            color: #7c3aed;
        }

        .bar {
            height: 8px;
            background: #f3f4f6;
            border-radius: 999px;
            overflow: hidden;
        }

        .bar .fill {
            height: 100%;
            background: linear-gradient(90deg, #7c3aed, #a855f7);
            border-radius: 999px;
            transition: width 0.3s ease;
        }

        .gb-progress .meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
            font-size: 12px;
        }

        .gb-progress .joined { color: #374151; font-weight: 600; }
        .gb-progress .need { color: #d97706; font-weight: 600; }
        .gb-progress .enough { color: #059669; font-weight: 600; }

        .gb-people {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .gb-people .person {
            font-size: 11px;
            background: #f3f4f6;
            color: #4b5563;
            padding: 2px 8px;
            border-radius: 999px;
        }

        .gb-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: auto;
            padding-top: 8px;
            border-top: 1px solid #f1f5f9;
        }

        .gb-foot .creator {
            font-size: 12px;
            color: #6b7280;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .gb-foot .mine,
        .gb-foot .joined-flag {
            font-size: 12px;
            font-weight: 600;
            color: #059669;
            white-space: nowrap;
        }

        .join-btn {
            border: none;
            background: #7c3aed;
            color: white;
            font-size: 13px;
            font-weight: 600;
            padding: 7px 16px;
            border-radius: 999px;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .join-btn:hover { background: #6d28d9; }
        .join-btn.disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }

        @media (max-width: 480px) {
            .gb-title { font-size: 15px; }
        }
    `]
})
export class GroupBuyingCardComponent {
    /** Loại bài khi chuyển tiếp vào nhóm ngành */
    readonly groupPostType = GroupPostType;

    @Input() item!: GroupBuyingFeedItem;

    @Output() open = new EventEmitter<GroupBuyingFeedItem>();
    @Output() join = new EventEmitter<GroupBuyingFeedItem>();

    onJoinClick(event: MouseEvent): void {
        event.stopPropagation();
        if (!this.item?.canJoin) return;
        this.join.emit(this.item);
    }

    percent(item: GroupBuyingFeedItem): number {
        if (!item?.targetPeopleCount) return 0;
        const value = (item.currentPeopleCount / item.targetPeopleCount) * 100;
        return Math.max(0, Math.min(100, Math.round(value)));
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
            case GroupBuyingStatus.PENDING: return 'pending';
            case GroupBuyingStatus.ACTIVE: return 'active';
            case GroupBuyingStatus.COMPLETED: return 'completed';
            default: return 'cancelled';
        }
    }
}
