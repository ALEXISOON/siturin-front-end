import { Component, computed, inject, input, OnInit, output, OutputEmitterRef, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Fluid } from 'primeng/fluid';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PrimeIcons } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { LabelDirective } from '@utils/directives/label.directive';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { DialogModule } from 'primeng/dialog';
import { CatalogueInterface, DpaInterface } from '@utils/interfaces';
import { CatalogueHttpService, CustomMessageService, DpaService } from '@utils/services';
import { CatalogueTypeEnum } from '@utils/enums';
import { CatalogueService } from '@utils/services/catalogue.service';
import { ClassificationInterface } from '@/pages/core/shared/interfaces';
import { FormStateService } from '@/pages/core/roles/external/services';
import { Chip } from 'primeng/chip';

export interface AdventureTourismModalityInterface {
    id?: string;
    area?: CatalogueInterface | null;
    province?: DpaInterface;
    canton?: DpaInterface;
}

@Component({
    selector: 'app-protected-area',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, Fluid, LabelDirective, Select, ButtonModule, TooltipModule, ErrorMessageDirective, ToastModule, ConfirmDialogModule, DialogModule, Chip],
    templateUrl: './protected-area.component.html'
})
export class ProtectedAreaComponent implements OnInit {
    public dataOut: OutputEmitterRef<Record<string, any>> = output<Record<string, any>>();
    public classification = input.required<ClassificationInterface>();

    protected readonly PrimeIcons = PrimeIcons;

    private readonly formBuilder = inject(FormBuilder);
    protected readonly formStateService = inject(FormStateService);
    private readonly catalogueService = inject(CatalogueService);
    private readonly catalogueHttpService = inject(CatalogueHttpService);
    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly dpaService = inject(DpaService);

    protected form!: FormGroup;
    protected protectedAreaForm!: FormGroup;

    protected items: AdventureTourismModalityInterface[] = [];

    protected provinces = signal<DpaInterface[]>([]);
    protected cantons: DpaInterface[] = [];
    protected availableProtectedAreas: CatalogueInterface[] = [];
    protected options: any[] = [
        { code: true, name: 'SI' },
        { code: false, name: 'NO' }
    ];
    protected paneNo!: CatalogueInterface | undefined;
    protected requirements: CatalogueInterface[] = [];
    province = computed(() => this.formStateService.establishment()?.province);
    canton = computed(() => this.formStateService.establishment()?.canton);

    constructor() {}

    async ngOnInit() {
        this.buildForm();
        await this.loadDpa();
        await this.loadCatalogues();
    }

    buildForm() {
        this.form = this.formBuilder.group({
            requirement: [null, Validators.required],
            hasProtectedArea: [null, Validators.required],
            province: [null, Validators.required],
            canton: [null, Validators.required],
            protectedAreas: []
        });

        this.watchFormChanges();
    }

    watchFormChanges() {
        this.hasProtectedAreaField.valueChanges.subscribe((value) => {
            this.provinceField.reset();
            this.cantonField.reset();

            if (value) {
                this.form.patchValue({
                    province: this.province(),
                    canton: this.canton()
                });

                this.createItems();
            } else {
            }

            this.updateFormAndEmit();
        });

        this.provinceField.valueChanges.subscribe(async (value) => {
            if (value) {
                this.cantonField.reset();
                this.cantons = await this.dpaService.findDpaByParentId(value.id);
            }
        });

        this.cantonField.valueChanges.subscribe((value) => {
            if (value) {
                this.createItems();
            }
        });
    }

    async loadCatalogues() {
        this.availableProtectedAreas = await this.catalogueService.findByModel(this.province()?.id!);

        this.requirements = await this.catalogueService.findByType(CatalogueTypeEnum.requirement_item);

        this.paneNo = this.requirements.find((x) => x.code === 'pane_no');
        this.requirementField.patchValue(this.requirements.find((x) => x.code === 'pane'));
    }

    async loadDpa() {
        this.provinces.set(await this.dpaService.findProvinces());
    }

    getFormErrors(): string[] {
    const errors: string[] = [];

    // Pregunta principal del PANE
    if (this.hasProtectedAreaField && this.hasProtectedAreaField.enabled && this.hasProtectedAreaField.invalid) {
        errors.push('¿Usted va a desarrollar la actividad dentro del PANE?');
    }

    // Selección de Área Protegida / Cantón
    if (this.hasProtectedAreaField && this.hasProtectedAreaField.enabled && this.hasProtectedAreaField.invalid) {
        errors.push('Datos personales o Datos de residencia');
    }

    if (errors.length > 0) {
        this.form.markAllAsTouched();
    }

    return errors;
}

    createItems() {
        this.items = [];

        if (this.hasProtectedAreaField.value) {
            console.log(this.availableProtectedAreas);

            for (const item of this.availableProtectedAreas) {
                this.items.push({
                    province: this.province(),
                    canton: this.canton(),
                    area: item
                });
            }
        } else {
            console.log('No');
            this.items = [
                {
                    province: this.provinceField.value,
                    canton: this.cantonField.value,
                    area: null
                }
            ];
        }

        this.updateFormAndEmit();
    }

    private updateFormAndEmit() {
        this.protectedAreasField.setValue(this.items);
        this.dataOut.emit(this.form.getRawValue());
    }

    // Getters Form
    get requirementField(): AbstractControl {
        return this.form.controls['requirement'];
    }

    get hasProtectedAreaField(): AbstractControl {
        return this.form.controls['hasProtectedArea'];
    }

    get protectedAreasField(): AbstractControl {
        return this.form.controls['protectedAreas'];
    }

    get provinceField(): AbstractControl {
        return this.form.controls['province'];
    }

    get cantonField(): AbstractControl {
        return this.form.controls['canton'];
    }
}
