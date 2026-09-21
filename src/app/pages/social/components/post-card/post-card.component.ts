import { Component, EventEmitter, Input, Output, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SocialPost } from '@core/models/social.model';
import { isBrowser } from '@core/utils/platform';
import { PostType, PrivacyType } from '@core/models/social.model';
import { AvatarPipe } from '@shared/pipes/avatar.pipe';
import { SanitizeHtmlPipe } from '@shared/pipes/sanitize-html.pipe';
import { FormatHtmlPipe } from '@shared/pipes/format-html.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

import { MediaUrlPipe } from '@shared/pipes/media-url.pipe';

@Component({
    selector: 'app-post-card',
    standalone: true,
    imports: [CommonModule, TranslateModule, AvatarPipe, SanitizeHtmlPipe, TimeAgoPipe,
        MediaUrlPipe,],
    templateUrl: './post-card.component.html',
    styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
    @Input() post!: SocialPost;
    @Input() timeAgo = '';
    @Input() canEdit = false;
    @Input() canDelete = false;
    @Input() canPin = false;
    @Output() like = new EventEmitter<SocialPost>();
    @Output() share = new EventEmitter<SocialPost>();
    @Output() save = new EventEmitter<SocialPost>();
    @Output() toggleReadMore = new EventEmitter<SocialPost>();
    @Output() edit = new EventEmitter<SocialPost>();
    @Output() delete = new EventEmitter<SocialPost>();
    @Output() pin = new EventEmitter<SocialPost>();

    @ViewChild('actionsToggle') actionsToggle!: ElementRef;

    showActions = false;
    isFocused = false;

    // ===== 👇 THÊM METHOD NÀY =====
    /**
     * Kiểm tra xem có nên hiển thị nút "Xem thêm" không
     * Dựa trên độ dài text content (bỏ qua HTML tags)
     */
    get shouldShowReadMore(): boolean {
        if (!this.post?.content) return false;

        const trimmedText = this.extractTextContent(this.post.content).trim();

        // Ngưỡng 200 ký tự - có thể điều chỉnh
        return trimmedText.length > 200;
    }

    /**
     * Lấy text content từ HTML. Trên server (prerender) không có `document` —
     * fallback sang regex strip tags để không crash build-time render.
     */
    private extractTextContent(html: string): string {
        if (isBrowser()) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            return temp.textContent || '';
        }
        return html.replace(/<[^>]*>/g, ' ');
    }
    // ===== 👆 END THÊM METHOD =====

    /**
     * Dòng nhỏ mờ dưới tên: "UserCode - username" (fallback username/fullName).
     */
    getAuthorCode(author: any): string {
        if (!author) return '';
        if (author.userCode) {
            // return `${author.userCode} - ${author.username || author.fullName || ''}`;
            return `${author.userCode}`;
        }
        return author.username || author.fullName || '';
    }

    // Type methods
    getTypeIcon(type: PostType): string {
        const icons = {
            [PostType.Post]: 'fa-file-alt',
            [PostType.Question]: 'fa-question-circle',
            [PostType.Event]: 'fa-calendar',
            [PostType.Announcement]: 'fa-bullhorn'
        };
        return 'fas ' + (icons[type] || 'fa-file-alt');
    }

    getTypeLabel(type: PostType): string {
        const labels = {
            [PostType.Post]: 'SOCIAL.TYPE_POST',
            [PostType.Question]: 'SOCIAL.TYPE_QUESTION',
            [PostType.Event]: 'SOCIAL.TYPE_EVENT',
            [PostType.Announcement]: 'SOCIAL.TYPE_ANNOUNCEMENT'
        };
        return labels[type] || 'SOCIAL.TYPE_POST';
    }

    // Privacy methods
    getPrivacyIcon(privacy: PrivacyType): string {
        const icons = {
            [PrivacyType.Public]: 'fa-globe',
            [PrivacyType.Friends]: 'fa-user-friends',
            [PrivacyType.Private]: 'fa-lock'
        };
        return 'fas ' + (icons[privacy] || 'fa-globe');
    }

    getPrivacyLabel(privacy: PrivacyType): string {
        const labels = {
            [PrivacyType.Public]: 'SOCIAL.PRIVACY_PUBLIC',
            [PrivacyType.Friends]: 'SOCIAL.PRIVACY_FRIENDS',
            [PrivacyType.Private]: 'SOCIAL.PRIVACY_PRIVATE'
        };
        return labels[privacy] || 'SOCIAL.PRIVACY_PUBLIC';
    }

    toggleActions(event: Event): void {
        event.stopPropagation();
        this.showActions = !this.showActions;
        if (this.showActions) {
            const card = (event.currentTarget as HTMLElement).closest('.post-card') as HTMLElement;
            if (card) card.focus();
        }
    }

    closeActions(): void {
        this.showActions = false;
    }

    onEdit(): void {
        this.edit.emit(this.post);
        this.closeActions();
    }

    onDelete(): void {
        this.delete.emit(this.post);
        this.closeActions();
    }

    onPin(): void {
        this.pin.emit(this.post);
        this.closeActions();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.post-actions')) {
            this.closeActions();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapePress(): void {
        if (this.showActions) {
            this.closeActions();
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (!this.isFocused && !this.showActions) return;

        const isCtrl = event.ctrlKey || event.metaKey;

        if (isCtrl && event.key === 'e' && this.canEdit) {
            event.preventDefault();
            this.onEdit();
        }

        if (isCtrl && event.key === 'd' && this.canDelete) {
            event.preventDefault();
            this.onDelete();
        }

        if (isCtrl && event.key === 'p' && this.canPin) {
            event.preventDefault();
            this.onPin();
        }
    }
}