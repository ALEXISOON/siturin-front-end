import { Component, inject, OnInit } from '@angular/core';
import { Step, StepList, StepPanel, StepPanels, Stepper } from 'primeng/stepper';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '@layout/service';
import { Step1Component } from '@modules/core/roles/external/components/guide-accreditation/steps/step1/step1.component';
import { Step2Component } from '@modules/core/roles/external/components/guide-accreditation/steps/step2/step2.component';
import { FormStateService, GuideHttpService, EstablishmentHttpService } from '@modules/core/roles/external/services';
import { Message } from 'primeng/message';
import { EstablishmentNumberPipe } from '@/pages/core/shared/pipes';
import { FontAwesome } from '@/pages/public/icons/font-awesome';
import { AuthService } from '@/pages/auth/auth.service';
import { format, isAfter } from 'date-fns';

@Component({
    selector: 'app-accreditation',
    imports: [Stepper, StepList, Step, StepPanels, StepPanel, FormsModule, Step1Component, Step2Component, Message, EstablishmentNumberPipe],
    templateUrl: './guide-accreditation.component.html'
})
export default class GuideAccreditationComponent implements OnInit {
    private readonly breadcrumbService = inject(BreadcrumbService);
    protected readonly authService = inject(AuthService);
    protected readonly formStateService = inject(FormStateService);
    protected readonly guideHttpService = inject(GuideHttpService);
    private readonly establishmentHttpService = inject(EstablishmentHttpService);
    protected readonly FontAwesome = FontAwesome;
    protected activeStep: number = 1;

    constructor() {
        this.breadcrumbService.setItems([{ label: 'PROCESO DE ACREDITACIÓN DE GUIANZA TURÍSTICA' }]);
    }

    ngOnInit(): void {
        this.loadFullEstablishment();
        this.findGuidesSiete();
    }

    private loadFullEstablishment() {
        const currentTemp = this.formStateService.establishmentTemp();
        if (currentTemp?.id) {
            this.establishmentHttpService.findOne(currentTemp.id).subscribe({
                next: (response: any) => {
                    const fullEstablishment = response.data || response;
                    
                    // Fusión estricta: si el backend no trae process o cadastre, conservamos el de la tabla anterior
                    if (currentTemp.process) {
                        if (!fullEstablishment.process) {
                            fullEstablishment.process = currentTemp.process;
                        } else {
                            if (!fullEstablishment.process.cadastre && currentTemp.process.cadastre) {
                                fullEstablishment.process.cadastre = currentTemp.process.cadastre;
                            }
                        }
                    }

                    this.formStateService.updateSection('establishmentTemp', fullEstablishment);
                },
                error: (err) => {
                    console.warn('Error al cargar establecimiento completo:', err);
                }
            });
        }
    }

    protected getRegisterNumber(): string {
        const est: any = this.formStateService.establishmentTemp();
        
        // Lee directamente el número de registro preservando todas las rutas posibles
        return est?.process?.cadastre?.registerNumber 
            || est?.cadastre?.registerNumber 
            || est?.registerNumber 
            || 'No cuenta con Registro de Turismo';
    }


    
    findGuidesSiete() {
        this.guideHttpService.findGuidesSiete(this.authService.auth.identification!).subscribe({
            next: (response: any[]) => {
                let type = 'new';

                if (response.length > 0) {
                    type = response.some((item) => isAfter(new Date(item.fecha_caducidad_licencia), new Date())) ? 'current' : 'expired';
                }

                const credentials = response.map((item: any) => {
                    return {
                        classificationCode: item.code_classification,
                        startedAt: item.fecha_emision_licencia,
                        endedAt: item.fecha_caducidad_licencia,
                        protectedAreas: item.acceso_area_protegida,
                        modalities: item.modalidad,
                        origin: item.origin,
                        code: item.numero_credencial,
                        type: item.tipo_guia,
                        geographicArea: item.ambito_aplicacion,
                        establecimiento: item.establecimiento
                    };
                });

                this.formStateService.updateSection('catastroSiete', { credentials, type });

                if (response.length > 0) {
                    this.formStateService.updateSection('guideOrigin', { province: response[0].provincia, canton: response[0].canton, languages: response[0].idiomas });
                }
            }
        });
    }

    protected getProcessTypeName(): string {
        const est: any = this.formStateService.establishmentTemp();

        if (est?.process?.type?.name) {
            return est.process.type.name;
        }

        const catastro = this.formStateService.catastroSiete() as any;
        if (catastro?.type === 'current') {
            return 'Renovación / Credencial Vigente';
        }
        if (catastro?.type === 'expired') {
            return 'Credencial Caducada';
        }

        return 'Registro';
    }
}