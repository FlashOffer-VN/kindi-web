// pages/admin/collaborator/edit/collaborator-edit-form.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CoreSharedModule } from '@shared';
import { AppService } from '@core/services/app.service';
import { BusinessFieldOption, BusinessFieldService } from '@core/services/business-field.service';
import { BUSINESS_SIZES, Collaborator, UpdateCollaboratorRequest } from '@core/models/collaborator.model';
import { toBusinessInfo } from '@core/models/business-info.model';
import { getSalesChannelLabel, SalesChannel } from '@core/models/collaborator.model';

/** 5 kênh bán hàng (SalesChannel) — label lấy từ i18n. */
const SALES_CHANNELS = [
    SalesChannel.Retail,
    SalesChannel.Wholesale,
    SalesChannel.Online,
    SalesChannel.Offline,
    SalesChannel.Other
];

/**
 * Form sửa cộng tác viên (PUT /Collaborators/{id}) — partial update.
 *
 * Dữ liệu đọc từ `CollaboratorService.getById()` (`GET /Collaborators/{id}`) nên
 * có đủ field để điền sẵn form: position, skills, interests, goals, zalo...
 *
 * CHỈ gửi field thực sự THAY ĐỔI so với dữ liệu gốc. Lý do an toàn: nếu backend
 * không trả field nào đó (vd. thiếu `businessInfo`) thì form hiển thị rỗng, và
 * gửi `''` lên sẽ XOÁ trắng giá trị cũ trên server. Diff giúp field không đọc
 * được sẽ được giữ nguyên thay vì bị ghi đè.
 *
 * Dữ liệu doanh nghiệp đọc từ object lồng `businessInfo`, fallback sang field
 * phẳng (businessName, address, website, businessSize); khi gửi lên thì dùng
 * field PHẲNG đúng như UpdateCollaboratorDto.
 *
 * Không sửa được: collaboratorCode, status, userId, level, parentCollaboratorId.
 */
@Component({
    selector: 'app-collaborator-edit-form',
    standalone: true,
    imports: [CoreSharedModule],
    templateUrl: './collaborator-edit-form.component.html',
    styleUrls: ['../../../../shared/styles/edit-form.css']
})
export class CollaboratorEditFormComponent {

    @Input() isSaving = false;
    @Output() save = new EventEmitter<UpdateCollaboratorRequest>();
    @Output() cancel = new EventEmitter<void>();

    form!: FormGroup;

    businessFields: BusinessFieldOption[] = [];
    salesChannels: { value: number; label: string }[] = [];
    businessSizes: { value: number; label: string }[] = [];

    private original: Collaborator | null = null;
    /** Giá trị gốc của nhóm thông tin doanh nghiệp (đã tách từ businessInfo). */
    private originalBusiness: {
        businessName: string;
        address: string;
        website: string;
        businessSize: number | null;
    } = { businessName: '', address: '', website: '', businessSize: null };

    constructor(
        private fb: FormBuilder,
        private _appService: AppService,
        private _businessFieldService: BusinessFieldService
    ) {
        this.salesChannels = SALES_CHANNELS.map(channel => ({
            value: channel,
            label: this._appService.trans(getSalesChannelLabel(channel))
        }));
        this.businessSizes = BUSINESS_SIZES.map(size => ({
            value: size.value,
            label: this._appService.trans(size.label)
        }));

        this.buildForm();
        this._businessFieldService.getActive().subscribe(fields => this.businessFields = fields);
    }

    /** Truyền bản sao mới mỗi lần mở modal để form luôn dựng lại từ dữ liệu hiện tại. */
    @Input()
    set collaborator(value: Collaborator | null) {
        this.original = value ?? null;
        this.resetForm();
    }

    /** Có thay đổi nào so với dữ liệu gốc không (dùng để disable nút Lưu). */
    get hasChanges(): boolean {
        return Object.keys(this.buildPayload()).length > 0;
    }

    isFieldInvalid(fieldName: string): boolean {
        const control = this.form.get(fieldName);
        return !!(control?.invalid && (control?.touched || control?.dirty));
    }

    getErrorMessage(fieldName: string): string {
        const errors = this.form.get(fieldName)?.errors;
        if (!errors) return '';
        if (errors['email']) return this._appService.trans('VALIDATION.EMAIL');
        if (errors['pattern']) return this._appService.trans('VALIDATION.PATTERN');
        if (errors['maxlength']) {
            return this._appService.trans('VALIDATION.MAX_LENGTH', { length: errors['maxlength'].requiredLength });
        }
        return this._appService.trans('VALIDATION.INVALID');
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        // Nút Lưu đã bị disable khi không có thay đổi; chặn thêm ở đây để phím
        // Enter trong ô nhập cũng không gửi request vô nghĩa.
        if (!this.hasChanges) return;

        this.save.emit(this.buildPayload());
    }

    // ==============================
    // FORM
    // ==============================

    private buildForm(): void {
        this.form = this.fb.group({
            // Cá nhân — chỉ validate định dạng khi có nhập (partial update)
            fullName: ['', [Validators.maxLength(200)]],
            phone: ['', [Validators.pattern(/^(0|\+84)[0-9]{9,10}$/)]],
            email: ['', [Validators.email, Validators.maxLength(200)]],
            zalo: ['', [Validators.maxLength(50)]],
            position: ['', [Validators.maxLength(200)]],
            salesChannel: [null],
            experience: ['', [Validators.maxLength(2000)]],
            skills: ['', [Validators.maxLength(2000)]],
            interests: ['', [Validators.maxLength(2000)]],
            goals: ['', [Validators.maxLength(2000)]],

            // Doanh nghiệp (field phẳng theo UpdateCollaboratorDto)
            businessName: ['', [Validators.maxLength(200)]],
            address: ['', [Validators.maxLength(500)]],
            website: ['', [Validators.maxLength(500)]],
            businessSize: [null],
            businessFieldId: [null]
        });
    }

    private resetForm(): void {
        const c = this.original;
        // Dữ liệu doanh nghiệp: toBusinessInfo tự ưu tiên object lồng
        // (`businessInfo` / `companyInfo`), fallback field phẳng
        const info = toBusinessInfo(c);

        this.originalBusiness = {
            businessName: (info?.companyName ?? '').toString(),
            address: (info?.companyAddress ?? '').toString(),
            website: (info?.companyWebsite ?? '').toString(),
            businessSize: (info?.companySize ?? null) as number | null
        };

        this.form.reset({
            fullName: c?.fullName ?? '',
            phone: c?.phone ?? '',
            email: c?.email ?? '',
            zalo: c?.zalo ?? '',
            position: c?.position ?? '',
            salesChannel: c?.salesChannel ?? null,
            experience: c?.experience ?? '',
            skills: c?.skills ?? '',
            interests: c?.interests ?? '',
            goals: c?.goals ?? '',

            businessName: this.originalBusiness.businessName,
            address: this.originalBusiness.address,
            website: this.originalBusiness.website,
            businessSize: this.originalBusiness.businessSize,
            businessFieldId: c?.businessFieldId ?? null
        });
    }

    // ==============================
    // PAYLOAD (chỉ field thay đổi)
    // ==============================

    private buildPayload(): UpdateCollaboratorRequest {
        const c = this.original;
        if (!c) return {};

        const v = this.form.value;
        const payload: UpdateCollaboratorRequest = {};

        this.assignText(payload, 'fullName', v.fullName, c.fullName);
        this.assignText(payload, 'phone', v.phone, c.phone);
        this.assignText(payload, 'email', v.email, c.email);
        this.assignText(payload, 'zalo', v.zalo, c.zalo);
        this.assignText(payload, 'position', v.position, c.position);
        this.assignText(payload, 'experience', v.experience, c.experience);
        this.assignText(payload, 'skills', v.skills, c.skills);
        this.assignText(payload, 'interests', v.interests, c.interests);
        this.assignText(payload, 'goals', v.goals, c.goals);

        this.assignText(payload, 'businessName', v.businessName, this.originalBusiness.businessName);
        this.assignText(payload, 'address', v.address, this.originalBusiness.address);
        this.assignText(payload, 'website', v.website, this.originalBusiness.website);

        // Select/enum: chỉ gửi khi có giá trị mới VÀ khác bản gốc
        if (v.salesChannel !== null && v.salesChannel !== undefined
            && Number(v.salesChannel) !== Number(c.salesChannel)) {
            payload.salesChannel = Number(v.salesChannel);
        }
        if (v.businessSize !== null && v.businessSize !== undefined
            && Number(v.businessSize) !== this.toNumberOrNull(this.originalBusiness.businessSize)) {
            payload.businessSize = Number(v.businessSize);
        }
        if (v.businessFieldId && v.businessFieldId !== (c.businessFieldId ?? null)) {
            payload.businessFieldId = v.businessFieldId;
        }

        return payload;
    }

    private assignText(
        payload: UpdateCollaboratorRequest,
        key: 'fullName' | 'phone' | 'email' | 'zalo' | 'position' | 'experience'
            | 'skills' | 'interests' | 'goals'
            | 'businessName' | 'address' | 'website',
        value: any,
        originalValue: any
    ): void {
        const next = (value ?? '').toString().trim();
        const current = (originalValue ?? '').toString().trim();
        if (next !== current) {
            payload[key] = next;
        }
    }

    private toNumberOrNull(value: any): number | null {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
}
