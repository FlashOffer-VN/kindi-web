import { Component, EventEmitter, Output, Input, inject, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { QUILL_MODULES } from '@core/configs/quill.config';
import { apiOrigin } from '@shared/pipes/media-url.pipe';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { firstValueFrom } from 'rxjs';
import { isBrowser } from '../../../../core/utils/platform';
import { AppService } from '../../../../core/services/app.service';
import { PostType, PrivacyType, CreatePostRequest, SocialPost } from '../../../../core/models/social.model';

@Component({
    selector: 'app-create-post',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, QuillModule],
    templateUrl: './create-post.component.html',
    styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements AfterViewInit {
    @Output() postCreated = new EventEmitter<SocialPost>();
    @Input() isLoading = false;

    private _appService = inject(AppService);
    private _cdr = inject(ChangeDetectorRef);

    @ViewChild('quillEditor') quillEditor!: QuillEditorComponent;

    title = '';
    content = '';
    selectedType: PostType = PostType.Post;
    selectedPrivacy: PrivacyType = PrivacyType.Public;
    tags: string[] = [];
    tagInput = '';
    images: any[] = [];
    imagePreviews: string[] = [];
    showOptions = false;
    isSubmitting = false;
    showEditor = true; // Thêm flag để force re-render

    readonly editorConfig = QUILL_MODULES;

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

    get canSubmit(): boolean {
        const text = this.content.replace(/<[^>]*>/g, '').trim();
        return text.length > 0 && !this.isLoading && !this.isSubmitting;
    }

    ngAfterViewInit() {
        this.fixQuillEditor();
    }

    private fixQuillEditor(): void {
        if (this.quillEditor && this.quillEditor.quillEditor) {
            const editor = this.quillEditor.quillEditor;
            const container = editor.root;
            if (container) {
                container.style.overflowX = 'hidden';
                container.style.wordWrap = 'break-word';
                container.style.wordBreak = 'break-word';
                container.style.whiteSpace = 'pre-wrap';
                container.style.width = '100%';
                container.style.maxWidth = '100%';
            }
        }
    }


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

    toggleOptions(): void {
        this.showOptions = !this.showOptions;
    }

    selectType(type: PostType): void {
        this.selectedType = type;
    }

    selectPrivacy(privacy: PrivacyType): void {
        this.selectedPrivacy = privacy;
    }

    getTypeLabel(type: PostType): string {
        const found = this.postTypes.find(t => t.value === type);
        return found ? found.label : 'SOCIAL.TYPE_POST';
    }

    getPrivacyLabel(privacy: PrivacyType): string {
        const found = this.privacyOptions.find(p => p.value === privacy);
        return found ? found.label : 'SOCIAL.PRIVACY_PUBLIC';
    }

    getPrivacyIcon(privacy: PrivacyType): string {
        const found = this.privacyOptions.find(p => p.value === privacy);
        return found ? found.icon : 'fa-globe';
    }

    addTag(): void {
        const tag = this.tagInput.trim().replace(/^#/, '').toLowerCase();
        if (!tag) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_EMPTY'));
            return;
        }
        if (tag.length > 20) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_TOO_LONG'));
            return;
        }
        if (this.tags.length >= 5) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_MAX'));
            return;
        }
        if (this.tags.includes(tag)) {
            this._appService.showWarning(this._appService.trans('SOCIAL.TAG_EXISTS'));
            return;
        }
        this.tags.push(tag);
        this.tagInput = '';
    }

    removeTag(index: number): void {
        this.tags.splice(index, 1);
    }

    triggerFileInput(): void {
        if (!isBrowser()) return;
        const input = document.getElementById('fileInput') as HTMLInputElement;
        if (input) input.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.processFiles(input.files);
            input.value = '';
        }
    }

    // ===== Drag & Drop =====
    isDragging = false;

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFiles(files);
        }
    }

    private processFiles(files: FileList | File[]): void {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            if (file.size > 5 * 1024 * 1024) {
                this._appService.showWarning(this._appService.trans('SOCIAL.IMAGE_TOO_LARGE'));
                continue;
            }
            if (this.imagePreviews.length >= 9) {
                this._appService.showWarning(this._appService.trans('SOCIAL.IMAGE_MAX'));
                break;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    this.imagePreviews.push(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(index: number): void {
        this.imagePreviews.splice(index, 1);
    }

    onSubmit(): void {
        if (!this.canSubmit) return;

        this.isSubmitting = true;

        if (this.imagePreviews.length > 0) {
            this.uploadImagesThenSubmit();
            return;
        }

        this.submitPost([]);
    }

    private uploadImagesThenSubmit(): void {
        const uploads = this.imagePreviews.map((dataUrl, index) =>
            this.dataUrlToBlob(dataUrl).then(blob =>
                firstValueFrom(this._appService.socialService.uploadImage(blob, `post-image-${index}.jpg`))
            )
        );

        Promise.all(uploads).then(urls => {
            // Server trả { url } relative
            const imageUrls = urls.map(u => u?.url).filter(Boolean) as string[];
            this.submitPost(imageUrls);
        }).catch(() => {
            this.isSubmitting = false;
            this._appService.showError(this._appService.trans('SOCIAL.IMAGE_UPLOAD_FAILED'));
        });
    }

    private dataUrlToBlob(dataUrl: string): Promise<Blob> {
        if (isBrowser() && typeof fetch === 'function') {
            return fetch(dataUrl).then(r => r.blob());
        }
        // Fallback không có fetch (prerender hiếm gặp)
        const parts = dataUrl.split(',');
        const mime = (parts[0]?.match(/data:(.*?);/)?.[1]) || 'image/jpeg';
        const b64 = parts[1] || '';
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return Promise.resolve(new Blob([bytes], { type: mime }));
    }

    private submitPost(images: string[]): void {
        const request: CreatePostRequest = {
            title: this.title.trim() || undefined,
            content: this.content,
            type: this.selectedType,
            privacy: this.selectedPrivacy,
            tags: this.tags,
            images
        };

        if (this.selectedType === PostType.Event) {
            // TODO: Add event fields
        }

        if (this.selectedType === PostType.Announcement) {
            // TODO: Add announcement fields
        }

        this._appService.socialService.createPost(request).subscribe({
            next: (post) => {
                this.postCreated.emit(post);
                this._appService.showSuccess(this._appService.trans('SOCIAL.CREATE_POST_SUCCESS'));
                this.resetForm();
                this.isSubmitting = false;
            },
            error: () => {
                this.isSubmitting = false;
            }
        });
    }

    resetForm(): void {
        // Force re-render quill bằng cách hide/show
        this.showEditor = false;

        this.title = '';
        this.content = '';
        this.selectedType = PostType.Post;
        this.selectedPrivacy = PrivacyType.Public;
        this.tags = [];
        this.tagInput = '';
        this.images = [];
        this.imagePreviews = [];
        this.showOptions = false;
        this.isSubmitting = false;

        // Force detect changes
        this._cdr.detectChanges();

        // Show lại quill editor
        this.showEditor = true;

        // Force detect changes lần nữa
        this._cdr.detectChanges();

        // Reset quill editor sau khi show lại
        setTimeout(() => {
            if (this.quillEditor && this.quillEditor.quillEditor) {
                const editor = this.quillEditor.quillEditor;

                editor.setText('');
                const length = editor.getLength();
                if (length > 0) {
                    editor.deleteText(0, length);
                }

                if (editor.history) {
                    editor.history.clear();
                }

                const container = editor.root;
                if (container) {
                    container.style.cssText = `
                        overflow-x: hidden !important;
                        word-wrap: break-word !important;
                        word-break: break-word !important;
                        white-space: pre-wrap !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: 44px;
                        max-height: 300px;
                        height: auto;
                        padding: 4px 0;
                        box-sizing: border-box !important;
                    `;
                }

                editor.update();
            }
        }, 0);
    }
}