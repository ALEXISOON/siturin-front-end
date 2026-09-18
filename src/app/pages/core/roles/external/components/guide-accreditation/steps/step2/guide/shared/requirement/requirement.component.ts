import { Component, inject, input, OnInit, output, OutputEmitterRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PrimeIcons } from 'primeng/api';
import { Message } from 'primeng/message';
import { CustomMessageService } from '@utils/services/custom-message.service';
import { LabelDirective } from '@utils/directives/label.directive';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { CatalogueInterface } from '@utils/interfaces';
import { CatalogueProcessesTypeEnum, CatalogueTypeEnum } from '@utils/enums';
import { CatalogueService } from '@utils/services/catalogue.service';
import { FileUpload } from 'primeng/fileupload';
import { JsonPipe } from '@angular/common';
import { ToggleSwitchComponent } from '@utils/components/toggle-switch/toggle-switch.component';
import { Divider } from 'primeng/divider';
import { FormStateService } from '@/pages/core/roles/external/services';
import { CatalogueGuideClassificationsCodeEnum, CatalogueGuideDegreesCodeEnum, CatalogueGuideRequirementsCodeEnum } from '@/pages/core/shared/components/regulation-simulator/enum';
import { CoreMessage } from '@/pages/core/shared/enums/core-message.enum';
import { FileUploadComponent } from '@/pages/core/shared/components/file-upload-ui/file-upload.component';

@Component({
    selector: 'app-requirement',
    imports: [ReactiveFormsModule, LabelDirective, Message, ErrorMessageDirective, FileUpload, JsonPipe, ToggleSwitchComponent, Divider, FileUploadComponent],
    templateUrl: './requirement.component.html'
})
export class RequirementComponent implements OnInit {
    public data = input<string>();
    public dataOut: OutputEmitterRef<Record<string, any>> = output<Record<string, any>>();

    protected readonly Validators = Validators;
    protected readonly PrimeIcons = PrimeIcons;
    private readonly formBuilder = inject(FormBuilder);
    protected readonly customMessageService = inject(CustomMessageService);

    private readonly catalogueService = inject(CatalogueService);
    protected readonly formStateService = inject(FormStateService);

    protected form!: FormGroup;

    protected requirements: CatalogueInterface[] = [];
    protected requirementItems: Map<any, any> = new Map();
    protected responses: Map<string, any> = new Map<string, any>();
    protected payload: FormData = new FormData();
    protected degree = this.formStateService.degree();
    protected process = this.formStateService.process;
    protected degreeName: string | null = null;
    protected certificationAux: string | null = null;
    protected certificationGuide: string | null = null;
    protected certificationJobSkill: string | null = null;

    constructor() {}

    async ngOnInit() {
        this.buildForm();
        this.loadData();

        this.checkRequiredForm();
        await this.loadCatalogues();
    }

    buildForm() {
        this.form = this.formBuilder.group({
            ruc: [null, [Validators.required]],
            degree: [this.degree, Validators.required],
            photo: [null, [Validators.required]],
            certificationGuide: [null, Validators.required],
            certificationJobSkill: [null, Validators.required],
            certificationAux: [null, Validators.required],
            domicileDeclaration: [{ value: null, disabled: true }, Validators.requiredTrue]
        });

        this.watchFormChanges();
    }

    checkRequiredForm() {
        switch (this.process()?.classification?.code) {
            case CatalogueGuideClassificationsCodeEnum.guide_local:
                if (this.degree.type === CatalogueGuideDegreesCodeEnum.bachiller || this.degree.type === CatalogueGuideDegreesCodeEnum.related || this.degree.type === CatalogueGuideDegreesCodeEnum.guide) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.bachiller;
                    this.certificationGuide = CatalogueGuideRequirementsCodeEnum.certification_guide_local;
                    this.certificationJobSkill = null;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_wild_24;

                    this.domicileDeclarationField.enable();
                }

                break;
            case CatalogueGuideClassificationsCodeEnum.guide_national:
                if (this.degree.type === CatalogueGuideDegreesCodeEnum.guide) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.guide;
                    this.certificationGuide = null;
                    this.certificationJobSkill = null;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_24;
                }

                if (this.degree.type === CatalogueGuideDegreesCodeEnum.related) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.related;
                    this.certificationGuide = null;
                    this.certificationJobSkill = CatalogueGuideRequirementsCodeEnum.certification_job_skill;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_24;
                }

                break;
            case CatalogueGuideClassificationsCodeEnum.guide_national_heritage:
                if (this.degree.type === CatalogueGuideDegreesCodeEnum.guide) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.guide;
                    this.certificationGuide = CatalogueGuideRequirementsCodeEnum.certification_guide_heritage;
                    this.certificationJobSkill = null;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_50;
                }

                if (this.degree.type === CatalogueGuideDegreesCodeEnum.related) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.related;
                    this.certificationGuide = CatalogueGuideRequirementsCodeEnum.certification_guide_heritage;
                    this.certificationJobSkill = CatalogueGuideRequirementsCodeEnum.certification_job_skill;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_50;
                }

                break;
            case CatalogueGuideClassificationsCodeEnum.guide_national_adventure:
                if (this.degree.type === CatalogueGuideDegreesCodeEnum.guide) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.guide;
                    this.certificationGuide = null;
                    this.certificationJobSkill = null;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_50;
                }

                if (this.degree.type === CatalogueGuideDegreesCodeEnum.related) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.related;
                    this.certificationGuide = null;
                    this.certificationJobSkill = CatalogueGuideRequirementsCodeEnum.certification_job_skill;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_50;
                }
                break;
            case CatalogueGuideClassificationsCodeEnum.guide_adventure:
                if (this.degree.type === CatalogueGuideDegreesCodeEnum.bachiller || this.degree.type === CatalogueGuideDegreesCodeEnum.related || this.degree.type === CatalogueGuideDegreesCodeEnum.guide) {
                    this.degreeName = CatalogueGuideRequirementsCodeEnum.bachiller;
                    this.certificationGuide = null;
                    this.certificationJobSkill = CatalogueGuideRequirementsCodeEnum.certification_job_skill;
                    this.certificationAux = CatalogueGuideRequirementsCodeEnum.certification_aux_50;
                }
                break;
            case CatalogueGuideClassificationsCodeEnum.guide_galapagos_adventure:
                this.degreeName = 'title_bachiller';
                this.certificationAux = 'certification_guide_local';
                break;
            case CatalogueGuideClassificationsCodeEnum.guide_galapagos_heritage:
                this.degreeName = 'title_bachiller';
                this.certificationAux = 'certification_guide_local';
                break;
        }

        if (!this.certificationGuide) this.certificationGuideField.disable();
        if (!this.certificationJobSkill) this.certificationJobSkillField.disable();
        this.form.updateValueAndValidity();
    }

    watchFormChanges() {
        this.form.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((_) => {
            this.dataOut.emit(Array.from(this.responses.values()));
        });

        this.domicileDeclarationField.valueChanges.subscribe((value) => {
            if (value) {
                let data = {
                    requirement: {
                        ...this.requirementItems.get('domicile_declaration'),
                        value
                    }
                };

                this.responses.set(value.id!, data);
            }
        });
    }

    getFormErrors(): string[] {
    const errors: string[] = [];

    if (!this.form || this.form.valid) {
        return errors;
    }

    const reqList = Array.isArray(this.requirements) 
        ? this.requirements 
        : (this.requirements ? [this.requirements] : []);

    // Recorre solo los controles que están habilitados e inválidos
    Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);

        if (control && control.enabled && control.invalid) {
            // Busca el objeto de requisito correspondiente al control
            const req: any = reqList.find((r: any) => 
                String(r?.id) === key || 
                String(r?.code) === key || 
                String(r?.requirement?.id) === key ||
                String(r?.requirement?.code) === key
            ) || reqList[0];

            if (req) {
                const title = this.formatRequirementTitle(req);
                if (title && !errors.includes(title)) {
                    errors.push(title);
                }
            }
        }
    });

    if (errors.length > 0) {
        this.form.markAllAsTouched();
    }

    return errors;
}

private formatRequirementTitle(req: any): string {
    const rawText = req?.requirement?.name || req?.name || req?.label || req?.description || '';
    
    // 1. Remueve etiquetas HTML (<p>, </p>, <span>, etc.)
    let cleanText = String(rawText).replace(/<[^>]*>?/gm, '').trim();

    // 2. Extrae solo el título o encabezado principal (antes del primer dos puntos)
    if (cleanText.includes(':')) {
        cleanText = cleanText.split(':')[0].trim();
    }

    // 3. Recorta la longitud máxima a 60 caracteres si no hay dos puntos
    if (cleanText.length > 60) {
        cleanText = cleanText.substring(0, 60) + '...';
    }

    return cleanText || 'Requisito pendiente';
}

    changeDomicileDeclaration(event: any) {
        this.domicileDeclarationField.patchValue({
            ...this.domicileDeclarationField.value,
            value: event.target.checked
        });
    }

    loadData() {}

    onFileSelect(requirement: CatalogueInterface, event: any) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(event.files[0]);

        img.onload = () => {
            const width = img.width;
            const height = img.height;

            // Dimensiones esperadas (aprox)
            const expectedWidth = 354;
            const expectedHeight = 531;

            // Tolerancia (opcional)
            const tolerance = 10;

            if (Math.abs(width - expectedWidth) <= tolerance && Math.abs(height - expectedHeight) <= tolerance) {
                console.log('Imagen válida ✅');
            } else {
                console.error('Imagen NO válida ❌');
                // alert('La imagen debe ser tipo carné (30mm x 45mm)');
            }

            URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;

        let data = {
            file: event.files[0],
            requirement: { ...requirement, value: 'file' },
            img: URL.createObjectURL(event.files[0])
        };

        switch (requirement.code) {
            case 'ruc':
                this.rucField.patchValue(data);
                break;
            case 'title_bachiller':
                this.degreeField.patchValue(data);
                break;
            case 'photo':
                this.photoField.patchValue(data);
                break;
            case CatalogueGuideRequirementsCodeEnum.certification_guide_local:
                this.certificationGuideField.patchValue(data);
                break;
            case CatalogueGuideRequirementsCodeEnum.certification_guide_heritage:
                this.certificationGuideField.patchValue(data);
                break;
            case CatalogueGuideRequirementsCodeEnum.certification_job_skill:
                this.certificationJobSkillField.patchValue(data);
                break;
            case CatalogueGuideRequirementsCodeEnum.certification_aux_wild:
            case CatalogueGuideRequirementsCodeEnum.certification_aux_wild_24:
            case CatalogueGuideRequirementsCodeEnum.certification_aux_24:
            case CatalogueGuideRequirementsCodeEnum.certification_aux_50:
                this.certificationAuxField.patchValue(data);
                break;
        }

        this.responses.set(requirement.id!, data);
    }

    async loadCatalogues() {
        this.requirements = await this.catalogueService.findByType(CatalogueTypeEnum.requirement_item);
        this.requirementItems = new Map(this.requirements.map((item) => [item.code, item]));
    }

    get rucField(): AbstractControl {
        return this.form.controls['ruc'];
    }

    get degreeField(): AbstractControl {
        return this.form.controls['degree'];
    }

    get photoField(): AbstractControl {
        return this.form.controls['photo'];
    }

    get certificationGuideField(): AbstractControl {
        return this.form.controls['certificationGuide'];
    }

    get certificationAuxField(): AbstractControl {
        return this.form.controls['certificationAux'];
    }

    get certificationJobSkillField(): AbstractControl {
        return this.form.controls['certificationJobSkill'];
    }

    get domicileDeclarationField(): AbstractControl {
        return this.form.controls['domicileDeclaration'];
    }

    protected readonly CatalogueProcessesTypeEnum = CatalogueProcessesTypeEnum;
    protected readonly CoreMessage = CoreMessage;
}
