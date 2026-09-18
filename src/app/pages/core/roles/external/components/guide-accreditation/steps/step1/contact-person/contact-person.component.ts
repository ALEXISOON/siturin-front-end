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
    selector: 'app-contact-person',
    imports: [ReactiveFormsModule, LabelDirective, InputText, ErrorMessageDirective, Select, InputMask, AgePipe],
    templateUrl: './contact-person.component.html'
})
export class ContactPersonComponent implements OnInit {
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
        // Extraemos tus datos directamente del authService (igual que la nacionalidad y sexo)
        const auth = (this.authService as any).auth || {};
        const nombres = auth.nombres || auth.names || auth.firstName || '';
        const apellidos = auth.apellidos || auth.lastNames || auth.lastName || '';
        const nombreCompleto = `${nombres} ${apellidos}`.trim();

        this.form = this.formBuilder.group({
            hasDisability: [null, [Validators.required]],
            bloodType: [null, [Validators.required]],
            phone: [null, [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^09\d{8}$/)]],
            secondaryPhone: [null, [Validators.minLength(10), Validators.maxLength(10)]],
            email: [null, [invalidEmailValidator(), invalidEmailDomainValidator()]],
            legalName: [{ value: nombreCompleto, disabled: true }],        
            nationality: [{ value: this.authService.auth?.nationality?.name, disabled: true }],
            sex: [{ value: this.authService.auth?.sex?.name, disabled: true }],
            birthdate: [{ value: this.authService.auth?.birthdate, disabled: true }]
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

        // Valida los campos de este componente hijo
        if (this.form.get('hasDisability')?.invalid) errors.push('Discapacidad');
        if (this.form.get('bloodType')?.invalid) errors.push('Tipo de sangre');
        if (this.form.get('phone')?.invalid) errors.push('Número de teléfono principal');
        if (this.form.get('email')?.invalid) errors.push('Correo electrónico secundario');

        // Marca todo como tocado para que aparezcan los mensajes en rojo en pantalla
        if (errors.length > 0) {
            this.form.markAllAsTouched();
        }

        return errors;
    }
    loadData() {
        if (this.dataIn()) {
            const incomingData: any = this.dataIn();
            const contactPerson: any = incomingData?.establishmentContactPerson;
            const tempContact: any = this.formStateService.establishmentTemp()?.establishmentContactPerson;
            
            // 1. Buscamos si el trámite ya tiene un nombre histórico guardado de forma segura
            const historicalName = incomingData?.legalName || 
                                   contactPerson?.legalName || 
                                   incomingData?.name || 
                                   tempContact?.legalName;

            // Verificamos que sea un nombre válido y no el texto genérico por defecto
            const hasValidHistoricalName = historicalName && 
                                           typeof historicalName === 'string' &&
                                           historicalName.trim() !== '' && 
                                           historicalName !== 'NOMBRES PERSONA JURIDICA';

            let finalLegalName = '';

            if (hasValidHistoricalName) {
                // CASO A: El trámite ya tiene su propio nombre histórico. LO RESPETAMOS.
                finalLegalName = historicalName;
            } else {
                // CASO B: Es un trámite nuevo sin nombre, usamos el perfil actual del usuario.
                const userState = (this.formStateService.user ? (typeof this.formStateService.user === 'function' ? this.formStateService.user() : this.formStateService.user) : {}) || {};
                const auth = (this.authService as any).auth || {};
                
                const source = userState.nombres ? userState : auth;
                const persona = source.persona || source.person || source.user || source;

                const nombres = persona.nombres || source.nombres || source.name || '';
                const apellidos = persona.apellidos || source.apellidos || source.lastname || '';
                
                finalLegalName = `${nombres} ${apellidos}`.trim() || auth.name || '';
            }

            // 2. Parcheamos el resto de los datos del formulario evitando pisar el legalName
            const dataToPatch: any = { ...incomingData };
            delete dataToPatch.legalName;

            this.form.patchValue(dataToPatch);
            
            if (tempContact?.phone) {
                this.phoneField.patchValue(tempContact.phone);
            }
            if (tempContact?.secondaryPhone) {
                this.secondaryPhoneField.patchValue(tempContact.secondaryPhone);
            }
            if (tempContact?.email) {
                this.emailField.patchValue(tempContact.email);
            }

            // 3. Asignamos el nombre final
            if (finalLegalName) {
                this.form.get('legalName')?.setValue(finalLegalName);
            }
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
}
