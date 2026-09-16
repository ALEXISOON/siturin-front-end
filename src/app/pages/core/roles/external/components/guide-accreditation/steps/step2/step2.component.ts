import { Component, inject, OnInit, output, OutputEmitterRef } from '@angular/core';
import { Select } from 'primeng/select';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabelDirective } from '@utils/directives/label.directive';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { PrimeIcons } from 'primeng/api';
import { CatalogueInterface } from '@utils/interfaces';
import { CatalogueService } from '@utils/services/catalogue.service';
import {
    CatalogueActivitiesCodeEnum,
    CatalogueActivitiesGeographicAreaEnum,
    CatalogueProcessesTypeEnum,
    CatalogueTypeEnum
} from '@utils/enums';
import {
    ActivityInterface,
    CategoryInterface,
    ClassificationInterface,
    EstablishmentInterface
} from '@modules/core/shared/interfaces';
import { ActivityService } from '@modules/core/shared/services';
import { ProcessI } from '@utils/services/core-session-storage.service';
import { EstablishmentHttpService, FormStateService, GuideHttpService } from '@/pages/core/roles/external/services';
import {
    GuideComponent
} from '@/pages/core/roles/external/components/guide-accreditation/steps/step2/guide/guide.component';
import { AuthService } from '@/pages/auth/auth.service';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

@Component({
    selector: 'app-step2',
    standalone: true,
    imports: [Select, FormsModule, ReactiveFormsModule, LabelDirective, ErrorMessageDirective, GuideComponent, Button, Tooltip],
    templateUrl: './step2.component.html'
})
export class Step2Component implements OnInit {
    dataOut = output<FormGroup>();
    public step: OutputEmitterRef<number> = output<number>();

    protected readonly PrimeIcons = PrimeIcons;
    private readonly formBuilder = inject(FormBuilder);
    protected form!: FormGroup;
    protected process!: ProcessI | null;
    protected establishment!: EstablishmentInterface | null;
    protected establishmentTemp!: EstablishmentInterface | null;
    protected dataIn!: any;
    protected isEdit: boolean = true;

    private readonly activityService = inject(ActivityService);
    private readonly catalogueService = inject(CatalogueService);
    protected readonly establishmentHttpService = inject(EstablishmentHttpService);
    protected readonly formStateService = inject(FormStateService);
    protected readonly authService = inject(AuthService);
    protected readonly guideHttpService = inject(GuideHttpService);

    protected readonly CatalogueActivitiesCodeEnum = CatalogueActivitiesCodeEnum;

    protected geographicAreas: CatalogueInterface[] = [];
    protected activities: ActivityInterface[] = [];
    protected classifications: ClassificationInterface[] = [];
    protected categories: CategoryInterface[] = [];
    protected relatedDegrees: CategoryInterface[] = [];
    protected degrees: any[] = [];
    protected degreeType!: string | null;

    constructor() {
        this.buildForm();
    }

    async ngOnInit() {
        this.degrees = Object.values(this.formStateService.degrees());
        this.establishment = this.formStateService.establishment();
        this.establishmentTemp = this.formStateService.establishmentTemp();
        this.process = this.formStateService.process();

        await this.loadCatalogues();
        await this.loadData();
        await this.validateDegree();
        await this.watchFormChanges();
    }

    buildForm() {
        this.form = this.formBuilder.group({
            geographicArea: [null, [Validators.required]],
            activity: [null, [Validators.required]],
            classification: [null, [Validators.required]],
            category: [null, [Validators.required]]
        });
    }

    async watchFormChanges() {
        this.form.valueChanges.subscribe(async () => {
            this.formStateService.updateSection('process', this.form.getRawValue());
        });

        this.geographicAreaField.valueChanges.subscribe(async (value) => {
            if (value) {
                await this.loadActivities();
                await this.validateDegree();
            }

            if (this.geographicAreaField.enabled) {
                this.classificationField.reset();
                this.categoryField.reset();
            }
        });

        this.activityField.valueChanges.subscribe(async (activity) => {
            if (activity) {
                if (this.process?.type?.code === CatalogueProcessesTypeEnum.registration
                    || this.process?.type?.code === CatalogueProcessesTypeEnum.readmission
                    || this.process?.type?.code === CatalogueProcessesTypeEnum.new_classification) {
                    if (this.geographicAreaField.enabled) {
                        this.classificationField.reset();
                        this.categoryField.reset();
                    }
                }

                await this.loadClassifications();
            }
        });

        this.classificationField.valueChanges.subscribe(async (classification) => {
            if (classification) {
                if (
                    this.process?.type?.code === CatalogueProcessesTypeEnum.registration ||
                    this.process?.type?.code === CatalogueProcessesTypeEnum.readmission ||
                    this.process?.type?.code === CatalogueProcessesTypeEnum.new_classification ||
                    this.process?.type?.code === CatalogueProcessesTypeEnum.reclassification
                ) {
                    if (this.geographicAreaField.enabled) {
                        this.categoryField.reset();
                    }
                }

                this.categories = await this.activityService.findCategoriesByClassification(classification.id);

                this.categoryField.patchValue(this.categories[0]);
            }
        });

        this.categoryField.valueChanges.subscribe(async (category) => {
            if (category) {
                // TODO
            }
        });
    }

    saveForm(mainForm: FormGroup) {
        Object.keys(mainForm.controls).forEach((controlName) => {
            const control = mainForm.get(controlName);
            if (control && !this.form.contains(controlName)) {
                this.form.addControl(controlName, control);
            } else {
                this.form.get(controlName)?.patchValue(control?.value);
            }
        });
    }

    getFormErrors(): string[] {
        const errors: string[] = [];

        if (this.geographicAreaField.invalid) errors.push('Zona Geográfica es obligatoria.');
        if (this.activityField.invalid) errors.push('Actividad es obligatoria.');
        if (this.classificationField.invalid) errors.push('Clasificación es obligatoria.');
        if (this.categoryField.invalid) errors.push('Categoría es obligatoria.');

        if (errors.length > 0) {
            this.form.markAllAsTouched();
        }

        return errors;
    }

    async validateDegree() {
        // Aseguramos que los grados existan desde el state si la variable local está vacía
        if (!this.degrees || this.degrees.length === 0) {
            this.degrees = Object.values(this.formStateService.degrees() || {});
        }

        let degree = null;
        let type = null;

        if (this.degrees.length > 0) {
            try {
                const validationResult = await this.guideHttpService.validateDegreeType(this.degrees, this.geographicAreaField?.value?.code || 'continent');
                degree = validationResult.degree;
                type = validationResult.type;
            } catch (e) {
                // Si falla la validación estricta, tomamos por defecto el primer título real disponible del back
                degree = this.degrees.find((d: any) => d.nivel !== 'Bachiller') || this.degrees[0];
                type = 'tercer_nivel';
            }
        }

        this.degreeType = type;
        
        // Actualizamos los datos reales en el estado para que el payload los envíe correctamente al backend
        this.formStateService.updateSection('degree', { ...degree, type: this.degreeType });
        this.formStateService.updateSection('process', { 
            ...this.formStateService.process(), 
            professionalTitle: degree 
        });

        await this.loadClassifications();
    }

    async loadCatalogues() {
        this.geographicAreas = await this.catalogueService.findByType(CatalogueTypeEnum.activities_geographic_area);
        this.relatedDegrees = await this.catalogueService.findByType(CatalogueTypeEnum.related_degrees);

        if (this.establishment?.province?.code !== CatalogueActivitiesGeographicAreaEnum.galapagos_code) {
            this.geographicAreas = this.geographicAreas.filter((item) => item.code === CatalogueActivitiesGeographicAreaEnum.continent);
        }

        this.geographicAreaField.patchValue(
            this.geographicAreas.find((x) => {
                if (this.establishment?.province?.code === CatalogueActivitiesGeographicAreaEnum.galapagos_code) {
                    return x.code === CatalogueActivitiesGeographicAreaEnum.galapagos;
                } else {
                    return x.code === CatalogueActivitiesGeographicAreaEnum.continent;
                }
            })
        );
    }

    async loadActivities() {
        if (this.establishment?.province?.code === CatalogueActivitiesGeographicAreaEnum.galapagos_code) {
            this.activities = [];
                for (const geographicArea of this.geographicAreas) {
                    this.activities.push(...(await this.activityService.findActivitiesByZone(geographicArea.id!)));
                }
            // if (this.formStateService.catastroSiete()?.type === 'new') {
            //     for (const geographicArea of this.geographicAreas) {
            //         this.activities.push(...(await this.activityService.findActivitiesByZone(geographicArea.id!)));
            //     }
            // } else {
            //     this.activities = await this.activityService.findActivitiesByZone(this.geographicAreaField.value.id);
            // }
        } else {
            // this.geographicAreaField.patchValue(this.geographicAreas[0]);
            this.activities = await this.activityService.findActivitiesByZone(this.geographicAreaField.value.id);
        }

        this.activities = this.activities.filter((x) => x.code?.includes('guide'));
        if (this.activities.length == 1) this.activityField.patchValue(this.activities[0]);

        // if (this.formStateService.catastroSiete()?.type !== 'new') {
        this.formStateService.updateSection('process', { activity: this.activityField.value });
        // }
    }

    async loadClassifications() {
        if (this.activityField.value) {
            this.classifications = await this.activityService.findClassificationsByActivity(this.activityField.value.id);
            if (this.degreeType === 'bachiller') {
                this.classifications = this.classifications.filter((item) => ['guide_local', 'guide_adventure'].some((code) => item.code?.includes(code)));
            }

            if (this.establishment?.province?.code === CatalogueActivitiesGeographicAreaEnum.galapagos_code) {
                this.classifications = this.classifications.filter((item) => item.code != 'guide_local');
            }

            switch (this.formStateService.process()?.type?.code) {
                case CatalogueProcessesTypeEnum.registration: {
                    break;
                }
                case CatalogueProcessesTypeEnum.new_classification_update: {
                    this.classifications = this.classifications.filter((c) => !this.formStateService.establishmentTemp()?.credentials!.some((mc) => mc.classification?.id === c.id));
                    console.log(this.classifications)
                    break;
                }
                case CatalogueProcessesTypeEnum.renewal_classification_update: {
                    this.classifications = this.classifications.filter((c) => c.id === this.formStateService.currentCredential()?.classification?.id);
                    break;
                }
            }
        }
    }

    async loadData() {
        switch (this.process?.type?.code!) {
            case CatalogueProcessesTypeEnum.renewal_classification_update:
                this.form.patchValue(this.process!);
                await this.loadActivities();
                this.activityField.disable();
                this.classificationField.disable();
                this.categoryField.disable();
                break;

            case CatalogueProcessesTypeEnum.new_classification_update:
                this.form.patchValue(this.process!);
                await this.loadActivities();
                this.activityField.disable();
                this.classificationField.reset();
                this.categoryField.reset();
                break;

            case CatalogueProcessesTypeEnum.recategorization:
                this.form.patchValue(this.process!);
                await this.loadActivities();
                this.activityField.disable();
                this.classificationField.disable();
                this.categoryField.reset();
                break;

            case CatalogueProcessesTypeEnum.registration:
                this.form.patchValue(this.process!);
                await this.loadActivities();
                break;

            case CatalogueProcessesTypeEnum.readmission:
                this.form.patchValue(this.process!);
                await this.loadActivities();
                break;

            case CatalogueProcessesTypeEnum.general_data_update:
                this.form.patchValue(this.process!);
                await this.loadActivities();
                break;
        }
    }

    continueRequirements() {
        console.log(this.form);

        if (this.form.valid) {
            this.isEdit = false;
            this.geographicAreaField.disable();
            this.activityField.disable();
            this.classificationField.disable();
        } else this.form.markAllAsTouched();
    }

    continueCurrentRequirements() {
        this.isEdit = false;
        this.geographicAreaField.disable();
        this.activityField.disable();
        this.classificationField.disable();
    }

    continueExpiredRequirements() {
        this.isEdit = false;
        this.geographicAreaField.disable();
        this.activityField.disable();
        this.classificationField.disable();
    }

    editRequirements() {
        this.isEdit = true;
        this.geographicAreaField.enable();
        this.activityField.enable();
        this.classificationField.enable();
    }

    get geographicAreaField(): AbstractControl {
        return this.form.controls['geographicArea'];
    }

    get activityField(): AbstractControl {
        return this.form.controls['activity'];
    }

    get classificationField(): AbstractControl {
        return this.form.controls['classification'];
    }

    get categoryField(): AbstractControl {
        return this.form.controls['category'];
    }

    protected readonly CatalogueProcessesTypeEnum = CatalogueProcessesTypeEnum;

    back() {
        this.step.emit(1);
    }
}
