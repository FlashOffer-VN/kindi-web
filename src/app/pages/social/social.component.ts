// social.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { QUILL_MODULES } from '@core/configs/quill.config';
import { apiOrigin } from '@shared/pipes/media-url.pipe';
import { QuillModule } from 'ngx-quill';
import { AppService } from '@core/services/app.service';
import { SocialPost, SocialMember, SocialGroup } from '@core/models/social.model';
import { BusinessGroup, BusinessGroupType, GroupApprovalStatus } from '@core/models/business-group.model';
import { GroupBuyingFeedItem } from '@core/models/group-buying-request.model';
import { PostType, PrivacyType } from '@core/models/social.model';
import { UserRole } from '@core/models/auth.model';
import { User } from '@core/models/auth.model';
import { isBrowser } from '@core/utils/platform';

import { SocialHeaderComponent } from './components/social-header/social-header.component';
import { CreatePostComponent } from './components/create-post/create-post.component';
import { PostCardComponent } from './components/post-card/post-card.component';
import { TrendingTopicsComponent } from './components/trending-topics/trending-topics.component';
import { SocialSidebarComponent } from './components/social-sidebar/social-sidebar.component';
import { GroupCardComponent } from './components/group-card/group-card.component';
import { GroupBuyingCardComponent } from './components/group-buying-card/group-buying-card.component';
import { GroupBuyingDetailModalComponent } from './components/group-buying-detail-modal/group-buying-detail-modal.component';
import { MemberCardComponent } from './components/member-card/member-card.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostDetailModalComponent } from './components/post-detail-modal/post-detail-modal.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { InputComponent } from '@shared/components/input/input.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-social',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TranslateModule, QuillModule, SocialHeaderComponent, CreatePostComponent, PostCardComponent, TrendingTopicsComponent, SocialSidebarComponent, GroupCardComponent, GroupBuyingCardComponent, GroupBuyingDetailModalComponent, MemberCardComponent,
        ReactiveFormsModule,
        InputComponent,
        ButtonComponent,
        LoadingComponent,
        RouterLink,
        ModalComponent,
    ],
    templateUrl: './social.component.html',
    styleUrls: ['./social.component.css']
})
export class SocialComponent implements OnInit, AfterViewInit {
    constructor(
        private readonly fb: FormBuilder,
        private _appService: AppService,
        private _route: ActivatedRoute
    ) { }

    posts: SocialPost[] = [];
    members: SocialMember[] = [];

    /** Sidebar: nhóm theo lĩnh vực người dùng đã tham gia + nhóm nổi bật (dữ liệu thật) */
    myGroups: BusinessGroup[] = [];
    featuredGroups: BusinessGroup[] = [];

    /** Tab "Hội nhóm": hội do người dùng tự tạo theo chủ đề */
    clubs: BusinessGroup[] = [];
    clubsLoading = false;
    clubsMineOnly = false;
    clubFormVisible = false;
    creatingClub = false;
    clubForm!: FormGroup;

    readonly groupType = BusinessGroupType;
    readonly approvalStatus = GroupApprovalStatus;

    groupBuyings: GroupBuyingFeedItem[] = [];
    groups: SocialGroup[] = [];
    trendingTopics: string[] = [];
    isLoadingPosts = false;
    isLoadingMembers = false;
    isLoadingGroupBuyings = false;
    isLoadingGroups = false;
    selectedTab: 'feed' | 'members' | 'group-buying' | 'groups' = 'feed';

    // ===== Tab "Mua chung" =====
    groupBuyingPageSize = 12;
    groupBuyingMineOnly = false;
    selectedGroupBuyingId: string | null = null;
    showGroupBuyingModal = false;
    currentUser: User | null = null;

    // Post Detail Modal
    private _pendingPostId: string | null = null;
    private _isInitialized = false;

    // Edit Modal
    showEditModal = false;
    isSaving = false;
    editingPostId: string | null = null;
    editTagInput = '';
    editorKey = 0;
    showQuillEditor = true;

    editPostData: Partial<SocialPost> & {
        type?: PostType;
        privacy?: PrivacyType;
    } = {};

    readonly editorConfig = QUILL_MODULES;

    // Options for edit modal
    readonly postTypes = [
        { value: PostType.Post, label: 'SOCIAL.TYPE_POST', icon: 'fa-file-alt' },
        { value: PostType.Question, label: 'SOCIAL.TYPE_QUESTION', icon: 'fa-question-circle' },
        { value: PostType.Event, label: 'SOCIAL.TYPE_EVENT', icon: 'fa-calendar' },
        { value: PostType.Announcement, label: 'SOCIAL.TYPE_ANNOUNCEMENT', icon: 'fa-bullhorn' }
    ];

    readonly privacyOptions = [
        { value: PrivacyType.Public, label: 'SOCIAL.PRIVACY_PUBLIC', icon: 'fa-globe' },
        { value: PrivacyType.Friends, label: 'SOCIAL.PRIVACY_FRIENDS', icon: 'fa-user-friends' },
        { value: PrivacyType.Private, label: 'SOCIAL.PRIVACY_PRIVATE', icon: 'fa-lock' }
    ];

    ngAfterViewInit(): void {
        this._isInitialized = true;
        if (this._pendingPostId) {
            this.openPostDetail(this._pendingPostId);
            this._pendingPostId = null;
        }
    }

    ngOnInit(): void {
        this.clubForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            topic: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            description: ['', [Validators.maxLength(1000)]]
        });

        this._route.params.subscribe(params => {
            const postId = params['postId'];
            if (postId) {
                if (this._isInitialized) {
                    this.openPostDetail(postId);
                } else {
                    this._pendingPostId = postId;
                }
            }
        });
        this.getCurrentUser();
        this.loadPosts();
        this.loadMembers();
        this.loadClubs();
        this.loadGroupBuyings();
        this.loadGroups();
        this.loadSidebarGroups();
        this.loadTrendingTopics();
    }

    getCurrentUser(): void {
        this.currentUser = this._appService.getCurrentUser();
    }

    canEditPost(post: SocialPost): boolean {
        if (!this.currentUser) return false;
        return this._appService.isAdmin() || post.author.id === this.currentUser.id;
    }

    canDeletePost(post: SocialPost): boolean {
        if (!this.currentUser) return false;
        return this._appService.isAdmin() || post.author.id === this.currentUser.id;
    }

    canPinPost(post: SocialPost): boolean {
        if (!this.currentUser) return false;
        return this._appService.isAdmin();
    }

    loadPosts(): void {
        this.isLoadingPosts = true;
        this._appService.socialService.getPosts().subscribe({
            next: (response) => {
                this.posts = response.data;
                this.isLoadingPosts = false;
            },
            error: () => {
                this.isLoadingPosts = false;
                this._appService.showError(this._appService.trans('SOCIAL.LOAD_ERROR'));
            }
        });
    }

    /**
     * Sidebar "Nhóm ngành của bạn" + "Nhóm phổ biến": lấy từ API nhóm theo lĩnh vực
     * (thay cho danh sách online/mock trước đây). Lỗi ở đây không chặn trang social.
     */
    loadSidebarGroups(): void {
        this._appService.businessGroupService.getPublic({ page: 1, pageSize: 20 }).subscribe({
            next: (response) => {
                const groups = response?.data ?? [];
                this.featuredGroups = [...groups].sort((a, b) => b.membersCount - a.membersCount).slice(0, 3);

                if (!this._appService.isAuthenticated()) {
                    this.myGroups = [];
                    return;
                }

                const mine = groups.filter(group => group.isMember);
                if (mine.length) {
                    this.myGroups = mine.slice(0, 3);
                } else {
                    // Có thể đang chờ duyệt → hỏi riêng danh sách nhóm của mình
                    this._appService.businessGroupService.getPublic({ page: 1, pageSize: 3, mineOnly: true }).subscribe({
                        next: (res) => { this.myGroups = res?.data ?? []; },
                        error: () => { this.myGroups = []; }
                    });
                }
            },
            error: () => { /* sidebar im lặng khi API lỗi */ }
        });
    }

    /**
     * Tab "Hội nhóm": hội đã được admin duyệt + hội của chính mình (kèm trạng thái chờ duyệt / bị từ chối).
     */

    /**
     * Nút "chèn ảnh" trong Quill của bảng tin: upload ảnh lên API rồi chèn URL tuyệt đối vào bài viết
     * (không nhồi base64 vào nội dung — tránh vượt giới hạn ký tự của API).
     */
    onEditorCreated(quill: any): void {
        quill?.getModule('toolbar')?.addHandler('image', () => this.pickAndUploadImage(quill));
    }

    private pickAndUploadImage(quill: any): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            this._appService.socialService.uploadImage(file, file.name).subscribe({
                next: (result: { url: string }) => {
                    if (!result?.url) {
                        this._appService.showError(this._appService.trans('SOCIAL.IMAGE_UPLOAD_FAILED'));
                        return;
                    }

                    const range = quill.getSelection(true);
                    const index = range?.index ?? 0;
                    quill.insertEmbed(index, 'image', `${apiOrigin()}${result.url}`, 'user');
                    quill.setSelection(index + 1);
                },
                error: () => this._appService.showError(this._appService.trans('SOCIAL.IMAGE_UPLOAD_FAILED'))
            });
        };

        input.click();
    }

    loadClubs(): void {
        this.clubsLoading = true;
        this._appService.businessGroupService.getCommunity({
            page: 1,
            pageSize: 24,
            mineOnly: this.clubsMineOnly
        }).subscribe({
            next: (response) => {
                this.clubsLoading = false;
                this.clubs = response?.data ?? [];
            },
            error: (error: unknown) => {
                this.clubsLoading = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    setClubsFilter(mineOnly: boolean): void {
        if (this.clubsMineOnly === mineOnly) return;
        this.clubsMineOnly = mineOnly;
        this.loadClubs();
    }

    openCreateClub(): void {
        if (!this._appService.isAuthenticated()) {
            this._appService.showError(this._appService.trans('CLUBS.LOGIN_REQUIRED'));
            return;
        }

        this.clubForm.reset({ name: '', topic: '', description: '' });
        this.clubFormVisible = true;
    }

    onCreateClub(): void {
        if (this.clubForm.invalid) {
            this.clubForm.markAllAsTouched();
            return;
        }

        this.creatingClub = true;
        this._appService.businessGroupService.createCommunity({
            name: this.clubForm.value.name,
            topic: this.clubForm.value.topic,
            description: this.clubForm.value.description || undefined
        }).subscribe({
            next: (response) => {
                this.creatingClub = false;
                this.clubFormVisible = false;
                this._appService.showSuccess(response?.message || this._appService.trans('CLUBS.CREATED'));
                this.loadClubs();
                this.loadSidebarGroups();
            },
            error: (error: unknown) => {
                this.creatingClub = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    clubStatusKey(club: BusinessGroup): string {
        if (club.approvalStatus === this.approvalStatus.Pending) return 'CLUBS.PENDING_BADGE';
        if (club.approvalStatus === this.approvalStatus.Rejected) return 'CLUBS.REJECTED_BADGE';
        return 'CLUBS.APPROVED_BADGE';
    }

    loadMembers(): void {
        this.isLoadingMembers = true;
        this._appService.socialService.getMembers().subscribe({
            next: (members) => {
                this.members = members;
                this.isLoadingMembers = false;
            },
            error: () => {
                this.isLoadingMembers = false;
            }
        });
    }

    /** Tab "Mua chung": lấy danh sách nhóm đã duyệt + nhóm của chính mình (kể cả chờ duyệt) */
    loadGroupBuyings(): void {
        this.isLoadingGroupBuyings = true;
        this._appService.groupBuyingRequest.getPublic({
            page: 1,
            pageSize: this.groupBuyingPageSize,
            mineOnly: this.groupBuyingMineOnly
        }).subscribe({
            next: (response) => {
                this.groupBuyings = response?.data ?? [];
                this.isLoadingGroupBuyings = false;
            },
            error: (error) => {
                this.isLoadingGroupBuyings = false;
                this._appService.showError(error?.message || this._appService.trans('COMMON.ERROR.LOAD_FAILED'));
            }
        });
    }

    /** Lọc "Tất cả" / "Nhóm của tôi" trong tab Mua chung */
    setGroupBuyingFilter(mineOnly: boolean): void {
        if (this.groupBuyingMineOnly === mineOnly) return;
        this.groupBuyingMineOnly = mineOnly;
        this.loadGroupBuyings();
    }

    /** Tải thêm nhóm mua chung (tăng size rồi load lại) */
    loadMoreGroupBuyings(): void {
        this.groupBuyingPageSize += 12;
        this.loadGroupBuyings();
    }

    openGroupBuying(item: GroupBuyingFeedItem): void {
        this.selectedGroupBuyingId = item.id;
        this.showGroupBuyingModal = true;
    }

    /** Bấm "Tham gia" trên card → mở modal chi tiết để đăng ký */
    joinGroupBuying(item: GroupBuyingFeedItem): void {
        this.openGroupBuying(item);
    }

    onGroupBuyingModalClosed(): void {
        this.showGroupBuyingModal = false;
        this.selectedGroupBuyingId = null;
    }

    onGroupBuyingJoined(): void {
        this.loadGroupBuyings();
    }

    loadGroups(): void {
        this.isLoadingGroups = true;
        this._appService.socialService.getGroups().subscribe({
            next: (groups) => {
                this.groups = groups;
                this.isLoadingGroups = false;
            },
            error: () => {
                this.isLoadingGroups = false;
            }
        });
    }

    loadTrendingTopics(): void {
        this.trendingTopics = [
            '📊 Xu hướng kinh tế 2026',
            '💡 Khởi nghiệp với AI',
            '🌱 Phát triển bền vững',
            '📈 Chiến lược tăng trưởng'
        ];
    }

    public likeStatus = {};
    toggleLike(post: SocialPost): void {
        this._appService.socialService.likePost(post.id).subscribe({
            next: (response) => {
                post.isLiked = !post.isLiked;
                post.likesCount += post.isLiked ? 1 : -1;
                post.likesCount = Math.max(0, post.likesCount);
            },
            error: () => {
                this._appService.showError(this._appService.trans('SOCIAL.LIKE_ERROR'));
            }
        });
    }

    toggleSave(post: SocialPost): void {
        this._appService.socialService.savePost(post.id).subscribe({
            next: () => {
                post.isSaved = !post.isSaved;
                this._appService.showSuccess(
                    post.isSaved ? this._appService.trans('SOCIAL.SAVE_SUCCESS') : this._appService.trans('SOCIAL.UNSAVE_SUCCESS')
                );
            },
            error: () => {
                this._appService.showError(this._appService.trans('SOCIAL.SAVE_ERROR'));
            }
        });
    }

    sharePost(post: SocialPost): void {
        if (!isBrowser()) return; // clipboard + DOM tạm only exist in browser

        // Copy link vào clipboard
        const shareUrl = `${window.location.origin}/social/${post.id}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            this._appService.showSuccess('Đã sao chép link bài viết!');
        }).catch(() => {
            // Fallback: tạo input tạm để copy
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            this._appService.showSuccess('Đã sao chép link bài viết!');
        });

        // Gọi API share (không cần quan tâm response)
        this._appService.socialService.sharePost(post.id).subscribe({
            next: () => {
                post.sharesCount = (post.sharesCount || 0) + 1;
            },
            error: () => { }
        });
    }

    toggleReadMore(post: SocialPost): void {
        post.isExpanded = !post.isExpanded;
    }

    // ===== EDIT MODAL =====
    openEditModal(post: SocialPost): void {
        if (!this.canEditPost(post)) {
            this._appService.showWarning(this._appService.trans('SOCIAL.NO_PERMISSION'));
            return;
        }
        this.editingPostId = post.id;
        this.editPostData = {
            title: post.title || '',
            content: post.content,
            tags: [...post.tags],
            type: post.type,
            privacy: post.privacy
        };
        this.editTagInput = '';
        this.showEditModal = true;
        // Force re-render quill
        this.showQuillEditor = false;
        setTimeout(() => {
            this.showQuillEditor = true;
        }, 0);
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editPostData = {};
        this.editTagInput = '';
        this.editingPostId = null;
        this.isSaving = false;
        // Reset quill
        this.showQuillEditor = true;
    }

    selectEditType(type: PostType): void {
        this.editPostData.type = type;
    }

    selectEditPrivacy(privacy: PrivacyType): void {
        this.editPostData.privacy = privacy;
    }

    getEditTypeLabel(type: PostType): string {
        const found = this.postTypes.find(t => t.value === type);
        return found ? found.label : 'SOCIAL.TYPE_POST';
    }

    getEditPrivacyLabel(privacy: PrivacyType): string {
        const found = this.privacyOptions.find(p => p.value === privacy);
        return found ? found.label : 'SOCIAL.PRIVACY_PUBLIC';
    }

    getEditPrivacyIcon(privacy: PrivacyType): string {
        const found = this.privacyOptions.find(p => p.value === privacy);
        return found ? found.icon : 'fa-globe';
    }

    addEditTag(): void {
        const tag = this.editTagInput.trim().replace(/^#/, '').toLowerCase();
        if (!tag) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_EMPTY'));
            return;
        }
        if (tag.length > 20) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_TOO_LONG'));
            return;
        }
        if (this.editPostData.tags && this.editPostData.tags.length >= 5) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_MAX'));
            return;
        }
        if (this.editPostData.tags?.includes(tag)) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_EXISTS'));
            return;
        }
        if (!this.editPostData.tags) {
            this.editPostData.tags = [];
        }
        this.editPostData.tags.push(tag);
        this.editTagInput = '';
    }

    removeEditTag(index: number): void {
        if (this.editPostData.tags) {
            this.editPostData.tags.splice(index, 1);
        }
    }

    saveEditPost(): void {
        if (!this.editingPostId) return;

        const content = this.editPostData.content || '';
        if (!content.replace(/<[^>]*>/g, '').trim()) {
            this._appService.showWarning(this._appService.trans('SOCIAL.CONTENT_REQUIRED'));
            return;
        }

        this.isSaving = true;
        const updateData = {
            title: this.editPostData.title?.trim() || undefined,
            content: this.editPostData.content,
            tags: this.editPostData.tags || [],
            type: this.editPostData.type || PostType.Post,
            privacy: this.editPostData.privacy || PrivacyType.Public
        };

        this._appService.socialService.updatePost(this.editingPostId, updateData).subscribe({
            next: (updatedPost) => {
                const index = this.posts.findIndex(p => p.id === this.editingPostId);
                if (index !== -1) {
                    this.posts[index] = { ...this.posts[index], ...updatedPost };
                }
                this._appService.showSuccess(this._appService.trans('SOCIAL.UPDATE_POST_SUCCESS'));
                this.closeEditModal();
                this.isSaving = false;
                this.loadPosts();
            },
            error: () => {
                this._appService.showError(this._appService.trans('SOCIAL.UPDATE_POST_ERROR'));
                this.isSaving = false;
            }
        });
    }

    async deletePost(post: SocialPost): Promise<void> {
        if (!this.canDeletePost(post)) {
            this._appService.showWarning('SOCIAL.NO_PERMISSION');
            return;
        }

        const postTitle = post.title || post.content.slice(0, 50) + '...';
        const message = this._appService.trans('SOCIAL.CONFIRM_DELETE_MESSAGE', { title: postTitle });

        const confirmed = await this._appService.confirmDelete(message);

        if (confirmed) {
            this._appService.socialService.deletePost(post.id).subscribe({
                next: () => {
                    this.posts = this.posts.filter(p => p.id !== post.id);
                    this._appService.showSuccess(this._appService.trans('SOCIAL.DELETE_POST_SUCCESS'));
                },
                error: () => {
                    this._appService.showError(this._appService.trans('SOCIAL.DELETE_POST_ERROR'));
                }
            });
        }
    }

    onPostCreated(post: SocialPost): void {
        this.loadPosts();
    }

    togglePin(post: SocialPost): void {
        if (!this.canPinPost(post)) {
            this._appService.showWarning(this._appService.trans('SOCIAL.NO_PERMISSION'));
            return;
        }

        const willPin = !post.isPinned;
        const action = willPin
            ? this._appService.socialService.pinPost(post.id)
            : this._appService.socialService.unpinPost(post.id);

        action.subscribe({
            next: (updatedPost) => {
                const index = this.posts.findIndex(p => p.id === post.id);
                if (index !== -1) {
                    this.posts[index] = { ...this.posts[index], ...updatedPost };
                }
                this.sortPostsByPin();
                this._appService.showSuccess(
                    this._appService.trans(willPin ? 'SOCIAL.PIN_SUCCESS' : 'SOCIAL.UNPIN_SUCCESS')
                );
            },
            error: () => {
                this._appService.showError(this._appService.trans('SOCIAL.PIN_ERROR'));
            }
        });
    }

    private sortPostsByPin(): void {
        this.posts.sort((a, b) =>
            Number(b.isPinned) - Number(a.isPinned) ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    followMember(member: SocialMember): void {
        member.isFollowing = !member.isFollowing;
        member.followers += member.isFollowing ? 1 : -1;
        this._appService.showSuccess(
            member.isFollowing ? this._appService.trans('SOCIAL.FOLLOW_SUCCESS') : this._appService.trans('SOCIAL.UNFOLLOW_SUCCESS')
        );
    }

    joinGroup(group: SocialGroup): void {
        group.isJoined = !group.isJoined;
        group.members += group.isJoined ? 1 : -1;
        this._appService.showSuccess(
            group.isJoined ? this._appService.trans('SOCIAL.JOIN_GROUP_SUCCESS') : this._appService.trans('SOCIAL.LEAVE_GROUP_SUCCESS')
        );
    }

    getTimeAgo(date: string): string {
        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return Math.floor(diff / 60) + ' phút';
        if (diff < 86400) return Math.floor(diff / 3600) + ' giờ';
        return Math.floor(diff / 86400) + ' ngày';
    }

    openPostDetail(postId: string): void {
        this._appService.socialService.getPostById(postId).subscribe({
            next: (response) => {
                const modalRef = this._appService.modal.create(ModalComponent, {
                    contentComponent: PostDetailModalComponent,
                    contentData: { post: response.data },
                    size: 'lg',
                    customWidth: '800px',
                    showCancel: false,
                    title: '',
                    showHeader: false,
                    showFooter: false,
                    showCloseButton: false,
                });

                // Lấy instance của content component từ modalRef
                const contentInstance = modalRef.contentComponentRef?.instance as PostDetailModalComponent;

                // Subscribe vào sự kiện close của content component
                if (contentInstance) {
                    contentInstance.close.subscribe(() => {
                        console.log('Modal đã đóng từ content');
                        this.loadPosts();
                    });
                    // Subscribe to like and share events to refresh posts when they occur
                    contentInstance.liked?.subscribe(() => {
                        console.log('Post liked in modal, reloading posts');
                        this.loadPosts();
                    });
                    contentInstance.shared?.subscribe(() => {
                        console.log('Post shared in modal, reloading posts');
                        this.loadPosts();
                    });
                }
            },
            error: (err) => {
                this._appService.showError(this._appService.trans('SOCIAL.LOAD_POST_ERROR'));
            }
        });
    }
}