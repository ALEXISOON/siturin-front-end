import { Component, effect, inject, input, OnInit, output, OutputEmitterRef, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { InputText } from 'primeng/inputtext';
import { CustomMessageService } from '@utils/services/custom-message.service';
import { LabelDirective } from '@utils/directives/label.directive';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { PrimeIcons } from 'primeng/api';
import { Select } from 'primeng/select';
import { DpaInterface } from '@utils/interfaces';
import { Textarea } from 'primeng/textarea';
import { DpaService } from '@utils/services';
import { MapComponent } from '@utils/components/map/map.component';
import { FormStateService } from '@/pages/core/roles/external/services';

@Component({
    selector: 'app-address',
    imports: [ReactiveFormsModule, LabelDirective, InputText, ErrorMessageDirective, Select, Textarea, MapComponent],
    templateUrl: './address.component.html'
})
export class AddressComponent implements OnInit {
    dataIn = input<any>(null);
    dataOut: OutputEmitterRef<any> = output<any>();

    protected readonly PrimeIcons = PrimeIcons;

    private readonly formBuilder = inject(FormBuilder);
    protected readonly dpaService = inject(DpaService);
    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly formStateService = inject(FormStateService);

    protected form!: FormGroup;
    protected formInitialized = false;

    // protected provinces: DpaInterface[] = [];
    protected provinces = signal<DpaInterface[]>([]);
    protected cantons: DpaInterface[] = [];
    protected parishes: DpaInterface[] = [];

    constructor() {
        effect(() => {
            if (this.dataIn() && !this.formInitialized) {
                console.log(this.dataIn());
                this.loadData();
                this.formInitialized = true;
            }
        });

        this.buildForm();
    }

    async ngOnInit() {
        await this.loadDpa();
    }

    buildForm() {
        this.form = this.formBuilder.group({
            province: [null, [Validators.required]],
            canton: [null, [Validators.required]],
            parish: [null, [Validators.required]],
            mainStreet: [null, [Validators.required]],
            numberStreet: [null, [Validators.required]],
            secondaryStreet: [null, [Validators.required]],
            referenceStreet: [null, [Validators.required]],
            latitude: [null, [Validators.required]],
            longitude: [null, [Validators.required]]
        });

        this.watchFormChanges();
    }

    watchFormChanges() {
        this.form.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((_) => {
            this.dataOut.emit(this.form.value);
        });

        this.provinceField.valueChanges.subscribe(async (value) => {
            if (value) {
                this.cantonField.reset();
                this.parishField.reset();
                this.latitudeField.reset();
                this.longitudeField.reset();
                this.cantons = await this.dpaService.findDpaByParentId(value.id);
            }
        });

        this.cantonField.valueChanges.subscribe(async (value) => {
            if (value) {
                if (value.code === '1701') {
                    this.customMessageService.showModalWarn({
                        summary: 'Importante',
                        detail: `
                        Estimado usuario, si su actividad de guianza turística la realiza dentro del
                        cantón Quito, por favor acérquese a las oficinas de Quito Turismo para solicitar su
                        Certificado de Registro de Turismo. Correo electrónico: info@quito-turismo.gob.ec`
                    });
                } else {
                    this.parishField.reset();
                    this.latitudeField.reset();
                    this.longitudeField.reset();
                    this.parishes = await this.dpaService.findDpaByParentId(value.id);
                }
            }
        });

        this.parishField.valueChanges.subscribe((value) => {
            if (value) {
                this.latitudeField.patchValue(value.latitude);
                this.longitudeField.patchValue(value.longitude);
            }
        });
    }

    setLatLng(event: any) {
        this.latitudeField.patchValue(event.lat);
        this.longitudeField.patchValue(event.lng);
    }

    getFormErrors(): string[] {
        const errors: string[] = [];

        if (this.form.get('province')?.invalid) errors.push('Provincia');
        if (this.form.get('canton')?.invalid) errors.push('Cantón');
        if (this.form.get('parish')?.invalid) errors.push('Parroquia');
        if (this.form.get('streetPrimary')?.invalid) errors.push('Calle Principal');
        if (this.form.get('number')?.invalid) errors.push('Numeración');

        if (errors.length > 0) {
            this.form.markAllAsTouched();
        }

        return errors;
    }

    loadData() {
        if (this.dataIn()) {
            this.form.patchValue(this.dataIn());
        }
    }

    async loadDpa() {
        this.provinces.set(await this.dpaService.findProvinces());
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

    get numberStreetField(): AbstractControl {
        return this.form.controls['numberStreet'];
    }

    get secondaryStreetField(): AbstractControl {
        return this.form.controls['secondaryStreet'];
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
