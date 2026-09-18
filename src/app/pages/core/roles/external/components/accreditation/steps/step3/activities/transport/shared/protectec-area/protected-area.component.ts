import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Message } from 'primeng/message';
import { Fluid } from 'primeng/fluid';
import { LabelDirective } from '@utils/directives/label.directive';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { CommonModule } from '@angular/common';
import { ToggleSwitchComponent } from '@utils/components/toggle-switch/toggle-switch.component';

@Component({
    selector: 'app-protected-area',
    standalone: true,
    imports: [Fluid, ReactiveFormsModule, Message, LabelDirective, ErrorMessageDirective, CommonModule, ToggleSwitchComponent],
    templateUrl: './protected-area.component.html',
    styleUrl: './protected-area.component.scss'
})
export class ProtectedAreaComponent implements OnInit {
    protected readonly formBuilder = inject(FormBuilder);
    protected form!: FormGroup;

    @Output() dataOut = new EventEmitter<FormGroup>();

    constructor() {
        this.buildForm();
    }

    ngOnInit(): void {
        this.watchFormChanges();
    }

    buildForm(): void {
    this.form = this.formBuilder.group({
        isProtectedArea: [null, Validators.required], // <-- Cambia 'false' por 'null'
        hasProtectedAreaContract: [false, Validators.required]
    });
}

    get isProtectedAreaField(): AbstractControl {
        return this.form.controls['isProtectedArea'];
    }

    get hasProtectedAreaContractField(): AbstractControl {
        return this.form.controls['hasProtectedAreaContract'];
    }

    watchFormChanges(): void {
        this.form.valueChanges.subscribe(() => {
            if (this.form.valid) {
                this.dataOut.emit(this.form);
            }
        });

        this.isProtectedAreaField.valueChanges.subscribe((value: boolean) => {
            if (value) {
                this.hasProtectedAreaContractField.setValidators([Validators.required]);
            } else {
                this.hasProtectedAreaContractField.clearValidators();
                this.hasProtectedAreaContractField.setValue(false);
            }

            this.hasProtectedAreaContractField.updateValueAndValidity();
        });
    }

    getFormErrors(): string[] {
        const errors: string[] = [];

        if (this.isProtectedAreaField.invalid) {
            errors.push('Debe indicar si está dentro del Subsistema Estatal del Sistema Nacional de Áreas Protegidas.');
        }

        if (this.hasProtectedAreaContractField.invalid) {
            errors.push('Debe presentar contrato, convenio o permiso correspondiente de la Autoridad Ambiental.');
        }

        if (errors.length > 0) {
            this.form.markAllAsTouched();
        }

        return errors;
    }
}
