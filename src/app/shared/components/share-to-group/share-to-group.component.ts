import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AppService } from '@core/services/app.service';
import { BusinessGroup, ForwardedGroup, GroupPostType } from '@core/models/business-group.model';
import { ButtonComponent, ButtonSize } from '@shared/components/button/button.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

/**
 * Nút "Chuyển tiếp vào nhóm ngành": gửi 1 yêu cầu của hệ thống (mua chung / tìm nhà cung cấp)
 * vào một nhóm ngành mà người dùng đang tham gia, dưới dạng bài viết kèm mã bản ghi gốc.
 * Dùng chung cho trang quản trị và trang cộng đồng.
 */
@Component({
    selector: 'app-share-to-group',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule, ButtonComponent, LoadingComponent, ModalComponent],
    templateUrl: './share-to-group.component.html',
    host: {
        // Component thường nằm trong row/card có (click) điều hướng (bảng admin, card bảng tin).
        // Chặn bubble ở mức host để cả nút VÀ popup (kể cả lúc đóng) không làm nhảy trang.
        '(click)': '$event.stopPropagation()'
    }
})
export class ShareToGroupComponent implements OnDestroy {
    /** Id bản ghi gốc được chuyển tiếp */
    @Input({ required: true }) refId!: string;
    /** Mã bản ghi gốc (hiển thị trong bài viết để thành viên đối chiếu) */
    @Input() refCode: string | null | undefined = null;
    /** Loại bài sẽ tạo trong nhóm (mua chung / tìm nhà cung cấp) */
    @Input({ required: true }) postType: GroupPostType = GroupPostType.Discussion;
    /** Tiêu đề đối tượng chuyển tiếp, ví dụ tên sản phẩm */
    @Input() targetTitle = '';
    /** Nhãn mô tả nguồn chuyển tiếp (i18n key) */
    @Input() refLabelKey = 'SHARE_TO_GROUP.FROM_REQUEST';
    @Input() variant: 'primary' | 'secondary' = 'secondary';
    /** Chỉ hiện icon (kèm tooltip) — dùng ở nơi chật như card/list */
    @Input() iconOnly = false;
    /** Key nhãn nút (đổi thành chữ ngắn ở trang chi tiết) */
    @Input() labelKey = 'SHARE_TO_GROUP.BUTTON';
    /** Cỡ nút, canh cho bằng các nút bên cạnh */
    @Input() size: ButtonSize = 'sm';
    /** Gửi cùng lúc vào NHIỀU nhóm ngành (admin) — mặc định gửi 1 nhóm */
    @Input() multi = false;
    /** Admin: được chọn trong TẤT CẢ nhóm ngành, không chỉ nhóm mình tham gia */
    @Input() allGroups = false;

    visible = false;
    loadingGroups = false;
    submitting = false;
    groups: BusinessGroup[] = [];
    form: FormGroup;

    /** Nhóm đã chọn khi gửi nhiều nhóm */
    selectedGroupIds: string[] = [];
    searchText = '';

    /** Nhóm ngành đã có bản ghi này — hiển thị cảnh báo và không gửi lại */
    sentGroups: ForwardedGroup[] = [];
    loadingSentGroups = false;

    /** Popup được tách ra document.body (xem escapeFromAncestors) */
    private modalEl?: HTMLElement;
    private modalAnchor?: Comment;

    constructor(
        private readonly fb: FormBuilder,
        private readonly _appService: AppService,
        private readonly _el: ElementRef<HTMLElement>
    ) {
        this.form = this.fb.group({
            groupId: ['', [Validators.required]],
            note: ['', [Validators.maxLength(500)]]
        });
    }

    get filteredGroups(): BusinessGroup[] {
        const keyword = this.searchText.trim().toLowerCase();
        if (!keyword) return this.groups;

        return this.groups.filter(g =>
            g.name.toLowerCase().includes(keyword) ||
            (g.businessFieldName ?? '').toLowerCase().includes(keyword));
    }

    /** Id các nhóm đã có bản ghi này */
    get sentGroupIds(): string[] {
        return this.sentGroups.map(g => g.groupId);
    }

    /** Số nhóm CHƯA có — đây là những nhóm có thể gửi */
    get unsentGroups(): BusinessGroup[] {
        return this.groups.filter(g => !this.sentGroupIds.includes(g.id));
    }

    /** Tên các nhóm đã có bản ghi (hiển thị trong cảnh báo) */
    get sentGroupNames(): string {
        return this.sentGroups.map(g => g.name).join(', ');
    }

    isAlreadySent(groupId: string): boolean {
        return this.sentGroupIds.includes(groupId);
    }

    isSelected(groupId: string): boolean {
        return this.selectedGroupIds.includes(groupId);
    }

    /** Nhóm đang được chọn khi gửi 1 nhóm */
    isChosen(groupId: string): boolean {
        return this.form.get('groupId')?.value === groupId;
    }

    /** Chọn 1 nhóm (chế độ gửi 1 nhóm) */
    selectGroup(groupId: string): void {
        if (this.isAlreadySent(groupId)) return;

        this.form.patchValue({ groupId });
        this.form.get('groupId')?.markAsTouched();
    }

    toggleGroup(groupId: string): void {
        if (this.isAlreadySent(groupId)) return;

        this.selectedGroupIds = this.isSelected(groupId)
            ? this.selectedGroupIds.filter(id => id !== groupId)
            : [...this.selectedGroupIds, groupId];
    }

    /** Chọn tất cả chỉ áp dụng cho nhóm CHƯA có bản ghi */
    selectAllGroups(): void {
        this.selectedGroupIds = this.filteredGroups
            .filter(g => !this.isAlreadySent(g.id))
            .map(g => g.id);
    }

    clearSelectedGroups(): void {
        this.selectedGroupIds = [];
    }

    ngOnDestroy(): void {
        // Trả popup về chỗ cũ để Angular xoá component không bị lỗi "node is not a child"
        if (this.modalEl && this.modalAnchor?.parentNode) {
            this.modalAnchor.parentNode.insertBefore(this.modalEl, this.modalAnchor);
            this.modalAnchor.remove();
        }
    }

    /**
     * Chuyển popup ra thẳng document.body.
     * Popup là overlay `position: fixed`, nhưng nếu nằm trong phần tử có `transform`/`filter`
     * (ví dụ card có hover transform) thì overlay bị neo theo phần tử đó -> rời chuột là popup
     * nhảy vị trí và nhấp nháy liên tục. Ra body thì luôn neo theo viewport.
     */
    private escapeFromAncestors(): void {
        if (!this.modalEl) {
            this.modalEl = this._el.nativeElement.querySelector('app-modal') as HTMLElement | undefined;
        }
        if (!this.modalEl || this.modalEl.parentElement === document.body) return;

        // Chỉ cần thoát khi có ancestor tạo containing block mới cho position: fixed.
        // Không có (trường hợp bình thường) thì giữ nguyên vị trí trong DOM.
        if (!this.hasTransformAncestor(this.modalEl)) return;

        if (!this.modalAnchor) {
            this.modalAnchor = document.createComment('app-share-to-group');
            this.modalEl.parentElement?.insertBefore(this.modalAnchor, this.modalEl);
        }

        document.body.appendChild(this.modalEl);
    }

    /** Ancestor có transform/filter/perspective/contain:paint → overlay `position: fixed` bị neo theo nó */
    private hasTransformAncestor(element: HTMLElement): boolean {
        let parent = element.parentElement;

        while (parent && parent !== document.body) {
            const style = getComputedStyle(parent);

            if (
                (style.transform && style.transform !== 'none') ||
                (style.filter && style.filter !== 'none') ||
                (style.perspective && style.perspective !== 'none') ||
                (style.backdropFilter && style.backdropFilter !== 'none') ||
                (style.contain ?? '').includes('paint')
            ) {
                return true;
            }

            parent = parent.parentElement;
        }

        return false;
    }

    open(): void {
        if (!this._appService.isAuthenticated()) {
            this._appService.showError(this._appService.trans('SHARE_TO_GROUP.LOGIN_REQUIRED'));
            return;
        }

        this.escapeFromAncestors();
        this.visible = true;
        this.form.reset({ groupId: '', note: '' });
        this.selectedGroupIds = [];
        this.searchText = '';
        this.sentGroups = [];
        this.loadGroups();
        this.loadSentGroups();
    }

    close(): void {
        this.visible = false;
    }

    /** Thành viên chỉ gửi được vào nhóm mình tham gia; admin có thể gửi vào mọi nhóm ngành */
    private loadGroups(): void {
        this.loadingGroups = true;

        this._appService.businessGroupService.getPublic({
            mineOnly: this.allGroups ? undefined : true,
            page: 1,
            pageSize: 100
        }).subscribe({
            next: (response) => {
                this.loadingGroups = false;
                this.groups = response?.data ?? [];

                if (!this.multi && this.groups.length === 1) {
                    this.form.patchValue({ groupId: this.groups[0].id });
                }
            },
            error: (error: unknown) => {
                this.loadingGroups = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    /** Nhóm nào đã có bản ghi này thì bỏ qua, không chuyển tiếp lại */
    private loadSentGroups(): void {
        if (!this.refId) return;

        this.loadingSentGroups = true;
        this._appService.businessGroupService.getForwardedGroups(this.refId).subscribe({
            next: (response) => {
                this.loadingSentGroups = false;
                this.sentGroups = response?.data ?? [];
            },
            error: () => {
                this.loadingSentGroups = false;
                this.sentGroups = [];
            }
        });
    }

    submit(): void {
        if (this.multi) {
            // Bỏ các nhóm đã có bản ghi (đã gửi trước đó)
            const targets = this.selectedGroupIds.filter(id => !this.isAlreadySent(id));

            if (targets.length === 0) {
                this._appService.showError(this._appService.trans(
                    this.selectedGroupIds.length > 0 ? 'SHARE_TO_GROUP.ALREADY_ALL_SENT' : 'SHARE_TO_GROUP.REQUIRED_GROUP'));
                return;
            }

            this.submitToMany(targets);
            return;
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;

        this._appService.businessGroupService.createPost(this.form.value.groupId, this.buildPayload()).subscribe({
            next: () => {
                this.submitting = false;
                this.visible = false;
                this._appService.showSuccess(this._appService.trans('SHARE_TO_GROUP.SUCCESS'));
            },
            error: (error: unknown) => {
                this.submitting = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    /** Admin gửi cùng lúc vào nhiều nhóm: nhóm nào lỗi thì bỏ qua, báo lại số nhóm gửi được */
    private submitToMany(targetIds: string[]): void {
        this.submitting = true;
        const groups = [...targetIds];
        const payload = this.buildPayload();

        const requests = groups.map(groupId =>
            this._appService.businessGroupService.createPost(groupId, payload).pipe(
                map(() => true),
                catchError(() => of(false))
            )
        );

        forkJoin(requests).subscribe({
            next: (results: boolean[]) => {
                this.submitting = false;
                this.visible = false;

                const sent = results.filter(Boolean).length;
                if (sent === groups.length) {
                    this._appService.showSuccess(this._appService.trans('SHARE_TO_GROUP.SUCCESS_MULTI', { count: sent }));
                } else if (sent > 0) {
                    this._appService.showSuccess(this._appService.trans('SHARE_TO_GROUP.PARTIAL_SUCCESS', { ok: sent, total: groups.length }));
                } else {
                    this._appService.showError(this._appService.trans('SHARE_TO_GROUP.FAILED'));
                }
            },
            error: () => {
                this.submitting = false;
                this._appService.showError(this._appService.trans('SHARE_TO_GROUP.FAILED'));
            }
        });
    }

    private buildPayload() {
        return {
            title: this.buildTitle(),
            content: this.buildContent(),
            type: this.postType,
            refId: this.refId,
            refCode: this.refCode ?? undefined
        };
    }

    private buildTitle(): string {
        const label = this._appService.trans(this.refLabelKey);
        const title = this.targetTitle ? `${label}: ${this.targetTitle}` : label;
        return title.slice(0, 200);
    }

    /** Nội dung bài trong nhóm: lời nhắn của người gửi + dòng nhắc bản ghi gốc */
    private buildContent(): string {
        const note = String(this.form.value.note ?? '').trim();
        const label = this._appService.trans(this.refLabelKey);
        const origin = this.refCode ? `${label}: ${this.refCode}` : label;

        const parts: string[] = [];
        if (note) {
            parts.push(`<p>${this.escape(note)}</p>`);
        }
        parts.push(`<p><em>${this.escape(origin)}</em></p>`);

        return parts.join('');
    }

    private escape(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }
}
