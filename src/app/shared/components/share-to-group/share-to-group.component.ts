import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from '@core/services/app.service';
import { BusinessGroup, GroupPostType } from '@core/models/business-group.model';
import { ButtonComponent } from '@shared/components/button/button.component';
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
    imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, ButtonComponent, LoadingComponent, ModalComponent],
    templateUrl: './share-to-group.component.html'
})
export class ShareToGroupComponent {
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

    visible = false;
    loadingGroups = false;
    submitting = false;
    groups: BusinessGroup[] = [];
    form: FormGroup;

    constructor(
        private readonly fb: FormBuilder,
        private readonly _appService: AppService
    ) {
        this.form = this.fb.group({
            groupId: ['', [Validators.required]],
            note: ['', [Validators.maxLength(500)]]
        });
    }

    open(): void {
        if (!this._appService.isAuthenticated()) {
            this._appService.showError(this._appService.trans('SHARE_TO_GROUP.LOGIN_REQUIRED'));
            return;
        }

        this.visible = true;
        this.form.reset({ groupId: '', note: '' });
        this.loadMyGroups();
    }

    close(): void {
        this.visible = false;
    }

    /** Chỉ gửi được vào nhóm ngành mà mình đang là thành viên */
    private loadMyGroups(): void {
        this.loadingGroups = true;

        this._appService.businessGroupService.getPublic({ mineOnly: true, page: 1, pageSize: 50 }).subscribe({
            next: (response) => {
                this.loadingGroups = false;
                this.groups = response?.data ?? [];

                if (this.groups.length === 1) {
                    this.form.patchValue({ groupId: this.groups[0].id });
                }
            },
            error: (error: unknown) => {
                this.loadingGroups = false;
                this._appService.showError(this._appService.extractErrorMessage(error));
            }
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;

        this._appService.businessGroupService.createPost(this.form.value.groupId, {
            title: this.buildTitle(),
            content: this.buildContent(),
            type: this.postType,
            refId: this.refId,
            refCode: this.refCode ?? undefined
        }).subscribe({
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
