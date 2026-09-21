import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Gốc của API (bỏ phần `/api/v1`) — nơi API lưu file tĩnh trong `wwwroot/uploads`. */
export function apiOrigin(): string {
    return environment.apiUrl.replace(/\/api(\/v\d+)?\/?$/i, '');
}

/**
 * Chuẩn hoá URL do API trả về thành URL tuyệt đối.
 * API trả đường dẫn tương đối (`/uploads/2026/09/21/anh.png`) nên nếu để nguyên,
 * ảnh sẽ bị tìm trên domain của web (404) thay vì domain API.
 */
@Pipe({
    name: 'mediaUrl',
    standalone: true
})
export class MediaUrlPipe implements PipeTransform {
    transform(url: string | null | undefined): string {
        if (!url) return '';

        // Đã là URL tuyệt đối / data URL / tài sản trong web thì giữ nguyên
        if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('assets/')) {
            return url;
        }

        return url.startsWith('/') ? `${apiOrigin()}${url}` : url;
    }
}
