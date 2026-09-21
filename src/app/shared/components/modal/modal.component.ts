// shared/components/modal/modal.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      (click)="onBackdropClick($event)">
      <div
        class="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        [class]="getSizeClass()"
        [style.max-width]="customWidth || 'auto'"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div *ngIf="showHeader" class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-secondary">{{ title }}</h3>
          <button
            *ngIf="showCloseButton"
            (click)="close()"
            class="text-gray-400 hover:text-secondary transition">
            <i class="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <p *ngIf="message" class="text-gray-700 text-base">{{ message }}</p>
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            *ngIf="showCancel"
            class="px-4 py-2 rounded-lg text-sm font-medium text-secondary bg-gray-100 hover:bg-gray-200 transition"
            (click)="onCancel()">
            {{ cancelText }}
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            [class]="getConfirmClass()"
            [disabled]="loading"
            (click)="onConfirm()">
            <span *ngIf="loading" class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    /* KHÔNG dùng transform ở animation mở modal: trong lúc animation chạy, vùng click
       nằm lệch theo transform -> click xuyên qua modal rơi xuống nội dung phía sau
       (bấm nút/ô trong popup "không ăn", bị nhảy trang). Chỉ dùng opacity. */
    @keyframes slideUp {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
    .animate-slideUp {
      animation: slideUp 0.25s ease-out;
    }
  `]
})
export class ModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = 'Xác nhận';
  @Input() cancelText = 'Hủy bỏ';
  @Input() confirmVariant: 'primary' | 'danger' | 'success' | 'warning' = 'primary';
  @Input() showFooter = true;
  @Input() showCancel = true;
  @Input() loading = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() customWidth: string = '';
  @Input() showHeader: boolean = true;
  @Input() showCloseButton: boolean = true;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  private confirmClasses = {
    primary: 'bg-primary hover:bg-primary-dark',
    danger: 'bg-danger hover:bg-danger-dark',
    success: 'bg-success hover:bg-success-dark',
    warning: 'bg-warning hover:bg-warning-dark'
  };

  getSizeClass(): string {
    return this.sizeClasses[this.size];
  }

  getConfirmClass(): string {
    return this.confirmClasses[this.confirmVariant];
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.closed.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
    this.close();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.visible) {
      this.close();
    }
  }
}