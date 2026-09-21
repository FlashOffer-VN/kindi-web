import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import {
    BusinessGroupComment,
    BusinessGroupDetail,
    BusinessGroupMember,
    BusinessGroupPost,
    GroupApprovalStatus,
    GroupMemberStatus,
    GroupPostType,
    JoinBusinessGroupResult
} from '@core/models/business-group.model';
import { AccountCreatedNoticeComponent } from '@shared/components/account-created-notice/account-created-notice.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

/** Chi tiết nhóm: thông tin nhóm, xin vào nhóm và trao đổi trong nhóm */
@Component({
    selector: 'app-group-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, AccountCreatedNoticeComponent,
        ButtonComponent, InputComponent, LoadingComponent, ModalComponent],
    templateUrl: './group-detail.component.html',
})
export class GroupDetailComponent implements OnInit {
    groupId = '';
    group: BusinessGroupDetail | null = null;
    isLoading = false;
    loadError = '';

    isAuthenticated = false;
    joinForm: FormGroup;
    joining = false;
    joinResult: JoinBusinessGroupResult | null = null;
    leaveModalVisible = false;

    postForm: FormGroup;
    posting = false;
    posts: BusinessGroupPost[] = [];
    postsLoading = false;
    postingAsPrivate = false;

    expandedPostId: string | null = null;
    comments: Record<string, BusinessGroupComment[]> = {};
    commentDrafts: Record<string, string> = {};
    commentsLoading = false;
    commentSubmitting = false;

    /** Chủ hội: danh sách yêu cầu vào hội đang chờ duyệt */
    pendingMembers: BusinessGroupMember[] = [];
    pendingLoading = false;
    rejectMemberVisible = false;
    rejectingMember: BusinessGroupMember | null = null;
    rejectForm: FormGroup;

    readonly memberStatus = GroupMemberStatus;
    readonly postType = GroupPostType;
    readonly approvalStatus = GroupApprovalStatus;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly fb: FormBuilder,
        private readonly _appService: AppService
    ) {
        this.joinForm = this.fb.group({
            fullName: ['', [Validators.maxLength(100)]],
            phone: ['', [Validators.maxLength(15)]],
            zalo: ['', [Validators.maxLength(15)]],
            email: ['', [Validators.email, Validators.maxLength(100)]],
            note: ['', [Validators.maxLength(1000)]]
        });

        this.postForm = this.fb.group({
            title: ['', [Validators.maxLength(200)]],
            content: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(4000)]]
        });

        this.rejectForm = this.fb.group({
            reason: ['', [Validators.required, Validators.maxLength(500)]]
        });
    }

    ngOnInit(): void {
        this.groupId = this.route.snapshot.paramMap.get('id') ?? '';
        this.isAuthenticated = this._appService.isAuthenticated();
        this.load();
    }

    get isMember(): boolean {
        return this.group?.isMember === true;
    }

    get isPending(): boolean {
        return this.group?.myMemberStatus === this.memberStatus.Pending;
    }

    get isOwner(): boolean {
        return this.group?.isOwner === true;
    }

    /** Chủ hội (hoặc admin) duyệt thành viên mới vào hội */
    loadPendingMembers(): void {
        this.pendingLoading = true;
        this._appService.businessGroupService.getMembers(this.groupId, {
            page: 1,
            pageSize: 30,
            status: GroupMemberStatus.Pending
        }).subscribe({
            next: (response) => {
                this.pendingLoading = false;
                this.pendingMembers = response?.data ?? [];
            },
            error: (error: unknown) => {
                this.pendingLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    approveMember(member: BusinessGroupMember): void {
        this._appService.businessGroupService
            .updateMemberStatus(this.groupId, member.id, { status: GroupMemberStatus.Active })
            .subscribe({
                next: () => {
                    this._appService.showSuccess(this._appService.trans('CLUBS.APPROVED_MEMBER'));
                    this.loadPendingMembers();
                    this.load();
                },
                error: (error: unknown) => this._appService.showError(this._appService.extractErrorMessage(error))
            });
    }

    openRejectMember(member: BusinessGroupMember): void {
        this.rejectingMember = member;
        this.rejectForm.reset({ reason: '' });
        this.rejectMemberVisible = true;
    }

    onRejectMember(): void {
        if (!this.rejectingMember || this.rejectForm.invalid) {
            this.rejectForm.markAllAsTouched();
            return;
        }

        this._appService.businessGroupService
            .updateMemberStatus(this.groupId, this.rejectingMember.id, {
                status: GroupMemberStatus.Rejected,
                rejectionReason: this.rejectForm.value.reason
            })
            .subscribe({
                next: () => {
                    this.rejectMemberVisible = false;
                    this._appService.showSuccess(this._appService.trans('CLUBS.REJECTED_MEMBER'));
                    this.loadPendingMembers();
                },
                error: (error: unknown) => {
                    this.rejectMemberVisible = false;
                    this._appService.showError(this._appService.extractErrorMessage(error));
                }
            });
    }

    get canJoin(): boolean {
        return !!this.group && this.group.isActive && !this.isMember && !this.isPending;
    }

    load(): void {
        this.isLoading = true;
        this._appService.businessGroupService.getPublicDetail(this.groupId).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.group = response?.data ?? null;
                if (this.group?.canViewPosts) {
                    this.loadPosts();
                }
                if (this.group?.isOwner) {
                    this.loadPendingMembers();
                }
            },
            error: (error: unknown) => {
                this.isLoading = false;
                this.loadError = this._appService.extractErrorMessage(error);
            }
        });
    }

    // ===== Xin vào nhóm =====
    onJoin(): void {
        if (!this.group) return;

        if (!this.isAuthenticated && (this.joinForm.invalid || !this.joinForm.value.phone || !this.joinForm.value.fullName)) {
            this.joinForm.markAllAsTouched();
            this._appService.showError(this._appService.trans('GROUPS.ERROR_CONTACT_REQUIRED'));
            return;
        }

        this.joining = true;
        this._appService.businessGroupService.join(this.group.id, this.joinForm.value).subscribe({
            next: (response) => {
                this.joining = false;
                this.joinResult = response?.data ?? null;
                this._appService.showSuccess(response?.message || this._appService.trans('GROUPS.JOIN_SUCCESS'));
                this.joinForm.reset();
                this.load();
            },
            error: (error: unknown) => {
                this.joining = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }

    confirmLeave(): void {
        this.leaveModalVisible = true;
    }

    onLeave(): void {
        if (!this.group) return;

        this._appService.businessGroupService.leave(this.group.id).subscribe({
            next: () => {
                this.leaveModalVisible = false;
                this.joinResult = null;
                this.posts = [];
                this._appService.showSuccess(this._appService.trans('GROUPS.LEAVE_SUCCESS'));
                this.load();
            },
            error: (error: unknown) => {
                this.leaveModalVisible = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    // ===== Bài đăng trong nhóm =====
    loadPosts(): void {
        this.postsLoading = true;
        this._appService.businessGroupService.getPosts(this.groupId, { page: 1, pageSize: 20 }).subscribe({
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

    onCreatePost(): void {
        if (this.postForm.invalid) {
            this.postForm.markAllAsTouched();
            return;
        }

        this.posting = true;
        this._appService.businessGroupService.createPost(this.groupId, {
            title: this.postForm.value.title,
            content: this.postForm.value.content,
            isPrivateToAdmin: this.postingAsPrivate
        }).subscribe({
            next: () => {
                this.posting = false;
                this.postForm.reset();
                this.postingAsPrivate = false;
                this._appService.showSuccess(this._appService.trans('GROUPS.POST_SUCCESS'));
                this.loadPosts();
            },
            error: (error: unknown) => {
                this.posting = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    toggleComments(post: BusinessGroupPost): void {
        if (this.expandedPostId === post.id) {
            this.expandedPostId = null;
            return;
        }

        this.expandedPostId = post.id;
        this.loadComments(post.id);
    }

    loadComments(postId: string): void {
        this.commentsLoading = true;
        this._appService.businessGroupService.getComments(postId).subscribe({
            next: (response) => {
                this.commentsLoading = false;
                this.comments[postId] = response?.data ?? [];
            },
            error: (error: unknown) => {
                this.commentsLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    onComment(post: BusinessGroupPost): void {
        const content = (this.commentDrafts[post.id] || '').trim();
        if (!content) return;

        this.commentSubmitting = true;
        this._appService.businessGroupService.createComment(post.id, content).subscribe({
            next: () => {
                this.commentSubmitting = false;
                this.commentDrafts[post.id] = '';
                this.loadComments(post.id);
                this.loadPosts();
            },
            error: (error: unknown) => {
                this.commentSubmitting = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    deletePost(post: BusinessGroupPost): void {
        this._appService.confirmDelete(this._appService.trans('GROUPS.DELETE_CONFIRM')).then((confirmed) => {
            if (!confirmed || !this.group) return;

            this._appService.businessGroupService.deletePost(this.group.id, post.id).subscribe({
                next: () => {
                    this._appService.showSuccess(this._appService.trans('GROUPS.DELETE_SUCCESS'));
                    this.loadPosts();
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

    isOwnPost(post: BusinessGroupPost): boolean {
        return this._appService.getCurrentUser()?.id === post.authorId;
    }

    isAdmin(): boolean {
        return this._appService.isAdmin();
    }
}
