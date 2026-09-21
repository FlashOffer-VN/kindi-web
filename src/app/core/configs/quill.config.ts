/** Cấu hình Quill dùng chung cho MỌI nơi soạn bài viết trong app:
 *  bài viết trang Cộng đồng, bài viết trong Nhóm ngành / Hội nhóm (kể cả trang admin). */

/** Định dạng văn bản cơ bản dùng cho mọi loại bài viết */
const TEXT_FORMATS: any[] = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }]
];

/** Bài viết Cộng đồng: có chèn ảnh (API cho phép 5000 ký tự) */
export const QUILL_MODULES = {
    toolbar: [...TEXT_FORMATS, ['link', 'image'], ['clean']]
};

/** Bài viết trong nhóm/hội: KHÔNG chèn ảnh (API giới hạn 4000 ký tự và bảng bài nhóm không có trường ảnh) */
export const QUILL_MODULES_GROUP_POST = {
    toolbar: [...TEXT_FORMATS, ['link'], ['clean']]
};

/** Lấy phần chữ thật của nội dung Quill (bỏ thẻ HTML) để kiểm tra rỗng trước khi gửi */
export const quillPlainText = (html: string | null | undefined): string =>
    String(html ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
