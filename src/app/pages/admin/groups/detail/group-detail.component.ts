import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import {
    BusinessGroupDetail,
    BusinessGroupMember,
    BusinessGroupPost,
    GroupMemberStatus,
    GroupPostType
} from '@core/models/business-group.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { StatusTabItem, StatusTabsComponent } from '@shared/components/status-tabs/status-tabs.component';

/** Chi tiết nhóm (admin): thành viên, bài trong nhóm, yêu cầu kín */
@Component({
    selector: 'app-admin-group-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule, ButtonComponent,
        InputComponent, LoadingComponent, ModalComponent, StatusTabsComponent],
    templateUrl: './group-detail.component.html',
})
export class AdminGroupDetailComponent implements OnInit {
    groupId = '';
    group: BusinessGroupDetail | null = null;
    isLoading = false;

    activeTab = 'members';
    tabs: StatusTabItem[] = [];

    memberStatusTabs: StatusTabItem[] = [];
    memberStatusFilter = 'all';
    members: BusinessGroupMember[] = [];
    membersLoading = false;

    posts: BusinessGroupPost[] = [];
    postsLoading = false;
    privatePosts: BusinessGroupPost[] = [];
    privateLoading = false;

    postForm: FormGroup;
    posting = false;
    postTypes: { value: GroupPostType; labelKey: string }[] = [];

    rejectVisible = false;
    rejectingMember: BusinessGroupMember | null = null;
    rejectReason = '';

    readonly memberStatus = GroupMemberStatus;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly _appService: AppService
    ) {
        this.postForm = this.fb.group({
            type: [GroupPostType.Discussion, [Validators.required]],
            title: ['', [Validators.maxLength(200)]],
            content: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(4000)]],
            refCode: ['', [Validators.maxLength(30)]],
            isPinned: [false]
        });
    }

    ngOnInit(): void {
        this.groupId = this.route.snapshot.paramMap.get('id') ?? '';

        this.tabs = [
            { key: 'members', label: this._appService.trans('ADMIN.GROUPS.TAB_MEMBERS'), icon: 'fas fa-users' },
            { key: 'posts', label: this._appService.trans('ADMIN.GROUPS.TAB_POSTS'), icon: 'fas fa-comments' },
            { key: 'private', label: this._appService.trans('ADMIN.GROUPS.TAB_PRIVATE'), icon: 'fas fa-user-shield' }
        ];
        this.memberStatusTabs = [
            { key: 'all', label: this._appService.trans('ADMIN.GROUPS.MEMBER_ALL') },
            { key: String(GroupMemberStatus.Pending), label: this._appService.trans('ADMIN.GROUPS.MEMBER_PENDING') },
            { key: String(GroupMemberStatus.Active), label: this._appService.trans('ADMIN.GROUPS.MEMBER_ACTIVE') },
            { key: String(GroupMemberStatus.Rejected), label: this._appService.trans('ADMIN.GROUPS.MEMBER_REJECTED') }
        ];
        this.postTypes = [
            { value: GroupPostType.Discussion, labelKey: 'GROUPS.TYPE_DISCUSSION' },
            { value: GroupPostType.Offer, labelKey: 'GROUPS.TYPE_OFFER' },
            { value: GroupPostType.GroupBuyingRequest, labelKey: 'GROUPS.TYPE_GROUP_BUYING' },
            { value: GroupPostType.SupplierRequest, labelKey: 'GROUPS.TYPE_SUPPLIER' },
            { value: GroupPostType.Announcement, labelKey: 'GROUPS.TYPE_ANNOUNCEMENT' }
        ];

        this.load();
        this.loadMembers();
        this.loadPosts();
        this.loadPrivateRequests();
    }

    load(): void {
        this.isLoading = true;
        this._appService.businessGroupService.getAdminDetail(this.groupId).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.group = response?.data ?? null;
            },
            error: (error: unknown) => {
                this.isLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    onTabChange(tab: string): void {
        this.activeTab = tab;
    }

    // ===== Thành viên =====
    loadMembers(): void {
        this.membersLoading = true;
        this._appService.businessGroupService.getMembers(this.groupId, {
            page: 1,
            pageSize: 50,
            status: this.memberStatusFilter === 'all' ? null : Number(this.memberStatusFilter) as GroupMemberStatus
        }).subscribe({
            next: (response) => {
                this.membersLoading = false;
                this.members = response?.data ?? [];
            },
            error: (error: unknown) => {
                this.membersLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    onMemberTabChange(tab: string): void {
        this.memberStatusFilter = tab;
        this.loadMembers();
    }

    approve(member: BusinessGroupMember): void {
        this._appService.businessGroupService
            .updateMemberStatus(this.groupId, member.id, { status: GroupMemberStatus.Active })
            .subscribe({
                next: (response) => {
                    this._appService.showSuccess(response?.message || this._appService.trans('ADMIN.GROUPS.MEMBER_STATUS_SUCCESS'));
                    this.loadMembers();
                    this.load();
                },
                error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
            });
    }

    openReject(member: BusinessGroupMember): void {
        this.rejectingMember = member;
        this.rejectReason = '';
        this.rejectVisible = true;
    }

    onReject(): void {
        if (!this.rejectingMember || !this.rejectReason.trim()) {
            this._appService.showError(this._appService.trans('ADMIN.GROUPS.REJECT_REASON_REQUIRED'));
            return;
        }

        this._appService.businessGroupService
            .updateMemberStatus(this.groupId, this.rejectingMember.id, {
                status: GroupMemberStatus.Rejected,
                rejectionReason: this.rejectReason.trim()
            })
            .subscribe({
                next: (response) => {
                    this.rejectVisible = false;
                    this._appService.showSuccess(response?.message || this._appService.trans('ADMIN.GROUPS.MEMBER_STATUS_SUCCESS'));
                    this.loadMembers();
                },
                error: (error: unknown) => {
                    this.rejectVisible = false;
                    this._appService.showError(this._appService.extractErrorMessage(error));
                }
            });
    }

    removeMember(member: BusinessGroupMember): void {
        this._appService.confirmDelete(this._appService.trans('ADMIN.GROUPS.REMOVE_CONFIRM')).then((confirmed) => {
            if (!confirmed) return;

            this._appService.businessGroupService.removeMember(this.groupId, member.id).subscribe({
                next: () => {
                    this._appService.showSuccess(this._appService.trans('ADMIN.GROUPS.MEMBER_REMOVED'));
                    this.loadMembers();
                    this.load();
                },
                error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
            });
        });
    }

    // ===== Bài trong nhóm =====
    loadPosts(): void {
        this.postsLoading = true;
        this._appService.businessGroupService.getPosts(this.groupId, { page: 1, pageSize: 50 }).subscribe({
            next: (response) => {
                this.postsLoading = false;
                this.posts = response?.data ?? [];
            },
            error: (error: unknown) => {
                this.postsLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    loadPrivateRequests(): void {
        this.privateLoading = true;
        this._appService.businessGroupService.getPrivateRequests(this.groupId, { page: 1, pageSize: 50 }).subscribe({
            next: (response) => {
                this.privateLoading = false;
                this.privatePosts = response?.data ?? [];
            },
            error: (error: unknown) => {
                this.privateLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    onCreatePost(): void {
        if (this.postForm.invalid) {
            this.postForm.markAllAsTouched();
            return;
        }

        this.posting = true;
        this._appService.businessGroupService.createPost(this.groupId, {
            type: Number(this.postForm.value.type) as GroupPostType,
            title: this.postForm.value.title,
            content: this.postForm.value.content,
            refCode: this.postForm.value.refCode
        }).subscribe({
            next: () => {
                this.posting = false;
                this.postForm.reset({ type: GroupPostType.Discussion, isPinned: false });
                this._appService.showSuccess(this._appService.trans('ADMIN.GROUPS.POST_SUCCESS'));
                this.loadPosts();
                this.load();
            },
            error: (error: unknown) => {
                this.posting = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    togglePin(post: BusinessGroupPost): void {
        this._appService.businessGroupService.updatePost(this.groupId, post.id, {
            title: post.title ?? undefined,
            content: post.content,
            isPinned: !post.isPinned,
            isHidden: post.isHidden
        }).subscribe({
            next: () => {
                this._appService.showSuccess(this._appService.trans('ADMIN.GROUPS.POST_UPDATED'));
                this.loadPosts();
            },
            error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
        });
    }

    toggleHide(post: BusinessGroupPost): void {
        this._appService.businessGroupService.updatePost(this.groupId, post.id, {
            title: post.title ?? undefined,
            content: post.content,
            isPinned: post.isPinned,
            isHidden: !post.isHidden
        }).subscribe({
            next: () => {
                this._appService.showSuccess(this._appService.trans('ADMIN.GROUPS.POST_UPDATED'));
                this.loadPosts();
            },
            error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
        });
    }

    deletePost(post: BusinessGroupPost, reloadPrivate = false): void {
        this._appService.confirmDelete(this._appService.trans('GROUPS.DELETE_CONFIRM')).then((confirmed) => {
            if (!confirmed) return;

            this._appService.businessGroupService.deletePost(this.groupId, post.id).subscribe({
                next: () => {
                    this._appService.showSuccess(this._appService.trans('GROUPS.DELETE_SUCCESS'));
                    if (reloadPrivate) this.loadPrivateRequests();
                    this.loadPosts();
                    this.load();
                },
                error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
            });
        });
    }

    typeLabelKey(type: GroupPostType): string {
        switch (type) {
            case GroupPostType.Offer: return 'GROUPS.TYPE_OFFER';
            case GroupPostType.GroupBuyingRequest: return 'GROUPS.TYPE_GROUP_BUYING';
            case GroupPostType.SupplierRequest: return 'GROUPS.TYPE_SUPPLIER';
            case GroupPostType.Announcement: return 'GROUPS.TYPE_ANNOUNCEMENT';
            default: return 'GROUPS.TYPE_DISCUSSION';
        }
    }

    statusLabelKey(status: GroupMemberStatus): string {
        switch (status) {
            case GroupMemberStatus.Active: return 'ADMIN.GROUPS.MEMBER_ACTIVE';
            case GroupMemberStatus.Rejected: return 'ADMIN.GROUPS.MEMBER_REJECTED';
            case GroupMemberStatus.Left: return 'ADMIN.GROUPS.MEMBER_LEFT';
            default: return 'ADMIN.GROUPS.MEMBER_PENDING';
        }
    }
}
