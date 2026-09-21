// shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'offer'
  | 'premium'
  | 'ghost'
  | 'outline'
  | 'community';

export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
      [attr.title]="title || null"
      [attr.aria-label]="title || null"
      [class]="getButtonClasses()"
    >
      @if (loading) {
        <span class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    button {
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 600;
      border: none;
      outline: none;
      font-family: inherit;
      white-space: nowrap;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    .btn-sm { padding: 0.375rem 0.875rem; font-size: 0.75rem; border-radius: 0.5rem; }
    .btn-md { padding: 0.625rem 1.25rem; font-size: 0.875rem; border-radius: 0.75rem; }
    .btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: 0.75rem; }

    .btn-primary { background: #7C3AED; color: white; }
    .btn-primary:hover:not(:disabled) { background: #5B21B6; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }

    .btn-secondary { background: #E5E7EB; color: #1F2937; }
    .btn-secondary:hover:not(:disabled) { background: #D1D5DB; transform: translateY(-1px); }

    .btn-success { background: #10B981; color: white; }
    .btn-success:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }

    .btn-danger { background: #EF4444; color: white; }
    .btn-danger:hover:not(:disabled) { background: #DC2626; transform: translateY(-1px); }

    .btn-warning { background: #F59E0B; color: #1F2937; }
    .btn-warning:hover:not(:disabled) { background: #D97706; transform: translateY(-1px); }

    .btn-offer { background: #F97316; color: white; }
    .btn-offer:hover:not(:disabled) { background: #EA580C; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }

    .btn-premium { background: #FBBF24; color: #1F2937; }
    .btn-premium:hover:not(:disabled) { background: #F59E0B; transform: translateY(-1px); }

    .btn-community { background: #8B5CF6; color: white; }
    .btn-community:hover:not(:disabled) { background: #7C3AED; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }

    .btn-ghost { background: transparent; color: #6B7280; }
    .btn-ghost:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); color: #1F2937; }

    .btn-outline { background: transparent; color: #7C3AED; border: 2px solid #7C3AED; }
    .btn-outline:hover:not(:disabled) { background: #7C3AED; color: white; transform: translateY(-1px); }

    .w-full { width: 100%; }
    .justify-center { justify-content: center; }
    .items-center { align-items: center; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  /** Tooltip hiển thị khi rê chuột (dùng cho nút chỉ có icon). */
  @Input() title = '';
  @Output() onClick = new EventEmitter<MouseEvent>();

  getButtonClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200';
    const size = `btn-${this.size}`;
    const variant = `btn-${this.variant}`;
    const width = this.fullWidth ? 'w-full' : '';
    const loadingClass = this.loading ? 'opacity-75' : '';
    return `${base} ${size} ${variant} ${width} ${loadingClass}`.trim();
  }
}