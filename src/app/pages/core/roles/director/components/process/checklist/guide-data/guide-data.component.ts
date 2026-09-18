import { Component, effect, inject, input, OnInit, output, OutputEmitterRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { InputText } from 'primeng/inputtext';
import { CustomMessageService } from '@utils/services/custom-message.service';
import { LabelDirective } from '@utils/directives/label.directive';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { invalidEmailDomainValidator, invalidEmailValidator } from '@utils/form-validators/custom-validator';
import { PrimeIcons } from 'primeng/api';
import { Select } from 'primeng/select';
import { CatalogueInterface } from '@utils/interfaces';
import { CatalogueTypeEnum } from '@utils/enums';
import { CatalogueService } from '@utils/services/catalogue.service';
import { AuthService } from '@/pages/auth/auth.service';
import { InputMask } from 'primeng/inputmask';
import { AgePipe } from '@/pages/core/shared/pipes';
import { EstablishmentInterface } from '@/pages/core/shared/interfaces';
import { FormStateService } from '@/pages/core/roles/external/services';

@Component({
    selector: 'app-guide-data',
    imports: [ReactiveFormsModule, LabelDirective, InputText, ErrorMessageDirective, Select, InputMask, AgePipe],
    templateUrl: './guide-data.component.html'
})
export class GuideDataComponent implements OnInit {
    dataIn = input.required<EstablishmentInterface>();
    dataOut: OutputEmitterRef<any> = output<any>();

    protected readonly PrimeIcons = PrimeIcons;

    private readonly formBuilder = inject(FormBuilder);
    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly catalogueService = inject(CatalogueService);
    protected readonly authService = inject(AuthService);
    protected readonly formStateService = inject(FormStateService);

    protected form!: FormGroup;
    protected formInitialized = false;
    protected bloodTypes: CatalogueInterface[] = [];

    protected options: any[] = [
        { code: true, name: 'SI' },
        { code: false, name: 'NO' }
    ];

    constructor() {
        effect(() => {
            if (this.dataIn() && !this.formInitialized) {
                this.formInitialized = true;
                this.loadData();
            }
        });

        this.buildForm();
    }

    async ngOnInit() {
        await this.loadCatalogues();

        this.loadData();
    }

    buildForm() {
        this.form = this.formBuilder.group({
            hasDisability: [{ value: null, disabled: true }],
            bloodType: [{ value: null, disabled: true }],
            phone: [{ value: null, disabled: true }],
            secondaryPhone: [{ value: null, disabled: true }],
            email: [{ value: null, disabled: true }],
            
            // CÁMBIALOS A FALSE AQUÍ:
            legalName: [{ value: null, disabled: false }],
            nationality: [{ value: null, disabled: false }],
            sex: [{ value: null, disabled: false }],
            birthdate: [{ value: null, disabled: false }],
            
            province: [{ value: null, disabled: true }],
            canton: [{ value: null, disabled: true }],
            parish: [{ value: null, disabled: true }],
            mainStreet: [{ value: null, disabled: true }],
            secondaryStreet: [{ value: null, disabled: true }],
            numberStreet: [{ value: null, disabled: true }],
            referenceStreet: [{ value: null, disabled: true }],
            latitude: [{ value: null, disabled: true }],
            longitude: [{ value: null, disabled: true }]
        });

        this.watchFormChanges();
    }

    watchFormChanges() {
        this.form.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((_) => {
            this.dataOut.emit(this.form.value);
        });
    }

    async loadCatalogues() {
        this.bloodTypes = await this.catalogueService.findByType(CatalogueTypeEnum.users_blood_type);
    }

    getFormErrors(): string[] {
        const errors: string[] = [];

        if (this.hasDisabilityField.invalid) errors.push('Discapacidad');

        if (this.bloodTypeField.invalid) errors.push('Tipo de Sangre');

        if (this.phoneField.invalid) errors.push('Número de Teléfono Principal');

        if (this.emailField.invalid) errors.push('Correo Electrónico');

        if (errors.length > 0) {
            this.form.markAllAsTouched();
            return errors;
        }

        return [];
    }

    loadData() {
        if (this.dataIn()) {
            this.form.patchValue(this.dataIn());
        }
    }

    get legalNameField(): AbstractControl {
        return this.form.controls['legalName'];
    }

    get nationalityField(): AbstractControl {
        return this.form.controls['nationality'];
    }

    get sexField(): AbstractControl {
        return this.form.controls['sex'];
    }

    get birthdateField(): AbstractControl {
        return this.form.controls['birthdate'];
    }

    get hasDisabilityField(): AbstractControl {
        return this.form.controls['hasDisability'];
    }

    get bloodTypeField(): AbstractControl {
        return this.form.controls['bloodType'];
    }

    get phoneField(): AbstractControl {
        return this.form.controls['phone'];
    }

    get secondaryPhoneField(): AbstractControl {
        return this.form.controls['secondaryPhone'];
    }

    get emailField(): AbstractControl {
        return this.form.controls['email'];
    }

    get provinceField(): AbstractControl {
        return this.form.controls['province'];
    }
    get cantonField(): AbstractControl {
        return this.form.controls['canton'];
    }
    get parishField(): AbstractControl {
        return this.form.controls['parish'];
    }
    get mainStreetField(): AbstractControl {
        return this.form.controls['mainStreet'];
    }
    get secondaryStreetField(): AbstractControl {
        return this.form.controls['secondaryStreet'];
    }
    get numberStreetField(): AbstractControl {
        return this.form.controls['numberStreet'];
    }
    get referenceStreetField(): AbstractControl {
        return this.form.controls['referenceStreet'];
    }
    get latitudeField(): AbstractControl {
        return this.form.controls['latitude'];
    }
    get longitudeField(): AbstractControl {
        return this.form.controls['longitude'];
    }
}
