import { Component, EventEmitter, inject, OnInit, Output, QueryList, signal, ViewChildren } from '@angular/core';
import { PrimeIcons } from 'primeng/api';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CoreSessionStorageService, CustomMessageService } from '@utils/services';
import { JuridicalPersonComponent } from '@modules/core/roles/external/components/accreditation/steps/step1/juridical-person/juridical-person.component';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { MY_ROUTES } from '@routes';
import { SriComponent } from '@modules/core/shared/components/sri/sri.component';
import { CoreEnum } from '@utils/enums';
import { collectFormErrors } from '@utils/helpers/collect-form-errors.helper';
import { ProcessHttpService } from '@/pages/core/shared/services';
import { ContactPersonComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step1/contact-person/contact-person.component';
import { AddressComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step1/address/address.component';

@Component({
    selector: 'app-step1',
    imports: [JuridicalPersonComponent, Button, SriComponent],
    templateUrl: './step1.component.html'
})
export class Step1Component implements OnInit {
    @ViewChildren(ContactPersonComponent) private contactPersonComponent!: QueryList<ContactPersonComponent>;
    @ViewChildren(AddressComponent) private addressComponent!: QueryList<AddressComponent>;

    @Output() step: EventEmitter<number> = new EventEmitter<number>();
    protected readonly PrimeIcons = PrimeIcons;
    protected readonly router = inject(Router);
    protected mainForm!: FormGroup;
    protected step1Data = signal<any>(null);
    protected readonly processHttpService = inject(ProcessHttpService);
    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly coreSessionStorageService = inject(CoreSessionStorageService);
    @ViewChildren(JuridicalPersonComponent) private juridicalPersonComponent!: QueryList<JuridicalPersonComponent>;
    private formBuilder = inject(FormBuilder);

    constructor() {
        this.mainForm = this.formBuilder.group({});
    }

    async ngOnInit() {
        await this.loadData();
    }

    async loadData() {
        this.step1Data.set(await this.coreSessionStorageService.getEncryptedValue(CoreEnum.step1));
    }

    saveForm(childForm: FormGroup) {
        Object.keys(childForm.controls).forEach((controlName) => {
            if (!this.mainForm.contains(controlName)) {
                this.mainForm.addControl(controlName, this.formBuilder.control(childForm.get(controlName)?.value));
            } else {
                this.mainForm.get(controlName)?.patchValue(childForm.get(controlName)?.value);
            }
        });
    }

    onSubmit() {
        const errors = this.checkFormErrors();

        if (errors.length > 0) {
            // 👈 Esto abre exactamente el mismo cuadro de diálogo modal con la lista de errores
            this.customMessageService.showFormErrors(errors);
            return;
        }

        // Si no hay errores, avanza al paso 2
        this.step.emit(2);
    }

    checkFormErrors(): string[] {
        const errors: string[] = [];

        // Recolecta errores del componente de persona de contacto
        this.contactPersonComponent.forEach(child => {
            if (child.getFormErrors) {
                errors.push(...child.getFormErrors());
            }
        });

        // Recolecta errores del componente de dirección
        this.addressComponent.forEach(child => {
            if (child.getFormErrors) {
                errors.push(...child.getFormErrors());
            }
        });

        return errors;
    }

    async saveProcess() {
        await this.coreSessionStorageService.setEncryptedValue(CoreEnum.step1, { ...this.mainForm.value });
        const { type, processId } = this.coreSessionStorageService.process()!;

        console.log(this.coreSessionStorageService.process());

        const payload = { ...this.mainForm.value, processId, type };

        this.processHttpService.createStep1(payload).subscribe({
            next: (response: any) => {
                this.step.emit(2);
                this.coreSessionStorageService.setProcess({
                    processId: response.id
                });
            }
        });
    }

    back() {
        this.router.navigateByUrl(MY_ROUTES.corePages.external.establishment.absolute);
    }
}
