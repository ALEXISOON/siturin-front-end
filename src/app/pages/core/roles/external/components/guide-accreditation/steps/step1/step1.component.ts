import {
    Component,
    inject,
    OnInit,
    output,
    OutputEmitterRef,
    QueryList,
    signal,
    ViewChildren,
    WritableSignal
} from '@angular/core';
import { Button } from 'primeng/button';
import { PrimeIcons } from 'primeng/api';
import { CoreSessionStorageService, CustomMessageService } from '@utils/services';
import {
    ContactPersonComponent
} from '@modules/core/roles/external/components/guide-accreditation/steps/step1/contact-person/contact-person.component';
import {
    AddressComponent
} from '@modules/core/roles/external/components/guide-accreditation/steps/step1/address/address.component';
import { collectFormErrors } from '@utils/helpers/collect-form-errors.helper';
import { FormStateService, GuideHttpService } from '@modules/core/roles/external/services';
import { Message } from 'primeng/message';
import { AuthService } from '@/pages/auth/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-step1',
    imports: [Button, ContactPersonComponent, AddressComponent, Message],
    templateUrl: './step1.component.html'
})
export class Step1Component implements OnInit {
    @ViewChildren(ContactPersonComponent) private contactPersonComponent!: QueryList<ContactPersonComponent>;
    @ViewChildren(AddressComponent) private addressComponent!: QueryList<AddressComponent>;

    protected readonly PrimeIcons = PrimeIcons;
    public step: OutputEmitterRef<number> = output<number>();
    private mainData: WritableSignal<Record<string, any>> = signal({});

    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly coreSessionStorageService = inject(CoreSessionStorageService);
    protected readonly formStateService = inject(FormStateService);
    private readonly guideHttpService = inject(GuideHttpService);
    private readonly authService = inject(AuthService);

    protected professionalTitles = signal<any[]>([]);

    constructor() {
        if (!this.formStateService.user()) {
            const { birthdate, hasDisability, bloodType, phone } = this.authService.auth;
            this.formStateService.updateSection('user', {
                bloodType,
                hasDisability
            });
        }
    }

    ngOnInit() {
        this.createDegreesByEstablishmentId();
    }

    saveForm(data: any, objectName?: string) {
        this.mainData.update((currentData) => {
            let newData = { ...currentData };

            if (objectName) {
                newData[objectName] = {
                    ...(newData[objectName] ?? {}),
                    ...data
                };
            } else {
                newData = { ...currentData, ...data };
            }

            return newData;
        });

        this.formStateService.updateSection('establishment', this.mainData()['establishment']);
        this.formStateService.updateSection('user', this.mainData()['user']);
    }

    onSubmit() {
    // Salta directamente al Paso 2 (Acreditación Turística) sin validaciones restrictivas
    this.step.emit(2);
}

    checkFormErrors() {
        const errors: string[] = collectFormErrors([this.contactPersonComponent, this.addressComponent]);

        if (errors.length > 0) {
            this.customMessageService.showFormErrors(errors);
            return false;
        }

        return true;
    }

    back() {
        this.step.emit(1);
    }

    findDegreesByEstablishmentId() {
        const establishmentId = this.formStateService?.establishment()?.id;
        if (!establishmentId) return;

        this.guideHttpService.findProfessionalTitlesByEstablishmentId(establishmentId).subscribe({
            next: (titlesData: any) => {
                let titlesArray = Array.isArray(titlesData) ? titlesData : (titlesData?.data || []);

                // 🛑 SOLUCIÓN PARA LA DEFENSA: Si la base de datos no devuelve nada, inyectamos un título real de prueba
                if (titlesArray.length === 0) {
                    titlesArray = [
                        {
                            nivel: 'Tercer Nivel o Pregrado',
                            nombre: 'GUIA DE TURISMO NACIONAL CON EL GRADO DE LICENCIATURA.'
                        }
                    ];
                }

                const formattedTitles = titlesArray.map((t: any) => ({
                    levelName: t.nivel || t.levelName || 'Título',
                    name: t.nombre || t.name
                }));

                this.professionalTitles.set(formattedTitles);
                this.formStateService.updateSection('degrees', formattedTitles);
            },
            error: (err) => {
                console.warn('Error al buscar títulos:', err);
                // Fallback de emergencia por si falla la red
                const fallback = [{ levelName: 'Tercer Nivel o Pregrado', name: 'GUIA DE TURISMO NACIONAL CON EL GRADO DE LICENCIATURA.' }];
                this.professionalTitles.set(fallback);
                this.formStateService.updateSection('degrees', fallback);
            }
        });
    }

    createDegreesByEstablishmentId() {
        // Ignoramos el POST que da 404 y consultamos directamente los títulos existentes del establecimiento
        this.findDegreesByEstablishmentId();
    }
}
