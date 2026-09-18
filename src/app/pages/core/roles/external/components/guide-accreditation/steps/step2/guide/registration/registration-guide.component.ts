import { Component, inject, output, OutputEmitterRef, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { Button } from 'primeng/button';
import { ConfirmationService, PrimeIcons } from 'primeng/api';
import { CustomMessageService } from '@utils/services';
import { FormStateService, GuideHttpService } from '@/pages/core/roles/external/services';
import { collectFormErrors } from '@utils/helpers/collect-form-errors.helper';
import { AdventureTourismModalityComponent } from '@modules/core/roles/external/components/guide-accreditation/steps/step2/guide/shared/adventure-tourism-modality/adventure-tourism-modality.component';
import { RequirementComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step2/guide/shared/requirement/requirement.component';
import { ProtectedAreaComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step2/guide/shared/protected-area/protected-area.component';
import { LanguageComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step2/guide/shared/language/language.component';
import { VehicleComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step2/guide/shared/vehicle/vehicle.component';
import { CatalogueGuideClassificationsCodeEnum } from '@/pages/core/shared/components/regulation-simulator/enum';
import { FontAwesome } from '@/pages/public/icons/font-awesome';
import { MY_ROUTES } from '@routes';
import { Router } from '@angular/router';

@Component({
    selector: 'app-registration',
    imports: [Button, AdventureTourismModalityComponent, RequirementComponent, ProtectedAreaComponent, LanguageComponent],
    templateUrl: './registration-guide.component.html'
})
export class RegistrationGuideComponent {
    protected readonly PrimeIcons = PrimeIcons;
    public step: OutputEmitterRef<number> = output<number>();

    @ViewChildren(RequirementComponent) private requirementComponent!: QueryList<RequirementComponent>;
    @ViewChildren(ProtectedAreaComponent) private protectedAreaComponent!: QueryList<ProtectedAreaComponent>;
    @ViewChildren(AdventureTourismModalityComponent) private adventureTourismModalityComponent!: QueryList<AdventureTourismModalityComponent>;
    @ViewChildren(LanguageComponent) private languageComponent!: QueryList<LanguageComponent>;
    @ViewChildren(VehicleComponent) private vehicleComponent!: QueryList<VehicleComponent>;

    private mainData: WritableSignal<Record<string, any>> = signal({});

    protected readonly router = inject(Router);
    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly guideHttpService = inject(GuideHttpService);
    protected readonly formStateService = inject(FormStateService);
    private readonly confirmationService = inject(ConfirmationService);

    constructor() {
        // effect(async () => {
        //     const processSignal = this.formStateService.process();
        //
        //     if (processSignal) {
        //         if (processSignal.classification?.hasRegulation) this.modelId = processSignal.classification.id;
        //         if (processSignal.category?.hasRegulation) this.modelId = processSignal.category.id;
        //     }
        // });
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

        if (objectName?.includes('processGuides')) this.formStateService.updateSection('processGuides', this.mainData()[objectName]);
        if (objectName?.includes('adventureModality')) this.formStateService.updateSection('adventureModality', this.mainData()[objectName]);
        if (objectName?.includes('language')) this.formStateService.updateSection('language', this.mainData()[objectName]);
        if (objectName?.includes('protectedArea')) this.formStateService.updateSection('protectedArea', this.mainData()[objectName]);
    }

    onSubmit() {
        if (this.checkFormErrors()) {
            this.saveProcess();
        }
    }

    saveProcess() {
        this.confirmationService.confirm({
            message: `
            ¿Está seguro de gestionar el trámite: ${this.formStateService.process()?.type?.name} ante el Ministerio de Producción, Comercio Exterior
            e Inversiones? Recuerde que, una vez enviada la solicitud, esta no podrá ser modificada y estará sujeta a
            verificación`,
            header: 'GUARDAR Y FINALIZAR',
            icon: FontAwesome.ENVELOPE_SOLID,
            rejectButtonStyleClass: 'p-button-text',
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'danger',
                text: true
            },
            acceptButtonProps: {
                label: 'Sí, Continuar'
            },
            accept: () => {
                const processGuides: any[] = [];
                const adventureModalities: any[] = [];
                const languages: any[] = [];
                const protectedAreas: any[] = [];
                const landTransports: any[] = [];

                const formData = new FormData();

                Object.values(this.formStateService.processGuides()).forEach((x: any) => {
                    processGuides.push({ requirement: x.requirement, value: x.requirement.value });

                    formData.append(x.requirement.id, x.file);
                });

                if (this.formStateService.protectedArea()) {
                    processGuides.push({ requirement: this.formStateService.protectedArea().requirement, value: this.formStateService.protectedArea().hasProtectedArea });

                    Object.values(this.formStateService.protectedArea().protectedAreas).forEach((x: any) => {
                        protectedAreas.push({
                            areaCode: x.area?.code,
                            areaName: x.area?.name,
                            province: x.province,
                            canton: x.canton
                        });
                    });
                }

                if (this.formStateService.adventureModality()) {
                    processGuides.push({ requirement: this.formStateService.adventureModality().requirement, value: this.formStateService.adventureModality().hasAdventureTourismModality });

                    if (this.formStateService.adventureModality()?.vehicle) {
                        processGuides.push({ requirement: this.formStateService.adventureModality().vehicle?.requirement, value: this.formStateService.adventureModality().vehicle?.hasVehicle });
                        processGuides.push({ requirement: this.formStateService.adventureModality().vehicle?.driverLicense, value: 'sn' });

                        this.formStateService.updateSection('process', { driverLicense: this.formStateService.adventureModality().vehicle?.driverLicense });
                        formData.append(this.formStateService.adventureModality().vehicle?.driverLicense?.id, this.formStateService.adventureModality().vehicle?.driverLicenseFile); //review cambiar por enum

                        if (this.formStateService.adventureModality()?.vehicle?.vehicles) {
                            Object.values(this.formStateService.adventureModality().vehicle.vehicles).forEach((x: any, index: number) => {
                                landTransports.push({
                                    type: x.type,
                                    plate: x.plate,
                                    year: x.year
                                });

                                formData.append('vehicle_registration' + index, x.vehicleRegistrationFile); //review cambiar por enum
                                formData.append('document_vehicle_inspection' + index, x.documentVehicleInspectionFile); //review cambiar por enum
                                formData.append('accident_policy' + index, x.accidentPolicyFile); //review cambiar por enum
                            });
                        }
                    }

                    Object.values(this.formStateService.adventureModality().adventureTourismModalities).forEach((x: any) => {
                        adventureModalities.push({
                            modalityCode: x.modality.code,
                            modalityName: x.modality.name,
                            modalityCertificateCode: x.certifier.code,
                            modalityCertificateName: x.certifier.name
                        });

                        formData.append(x.modality.code, x.file);
                    });
                }

                if (this.formStateService.language()) {
                    processGuides.push({ requirement: this.formStateService.language().requirement, value: this.formStateService.language().hasLanguage });

                    Object.values(this.formStateService.language().languages).forEach((x: any) => {
                        languages.push({
                            languageCode: x.language.code,
                            languageName: x.language.name,
                            levelCode: x.level.code,
                            levelName: x.level.name,
                            motherLanguage: x.motherLanguage
                        });

                        formData.append(x.language.code, x.file);
                    });
                }

                this.formStateService.updateSection('process', { endedAt: new Date() });

                const payload = {
                    user: this.formStateService.user(),
                    process: this.formStateService.process(),
                    establishment: this.formStateService.establishment(),
                    processGuides: processGuides,
                    adventureModalities: adventureModalities,
                    languages: languages,
                    protectedAreas: protectedAreas,
                    landTransports: landTransports
                };

                console.log(payload);
                formData.append('payload', JSON.stringify(payload));

                this.guideHttpService.createRegistration(formData).subscribe({
                    next: () => {
                        this.router.navigate([MY_ROUTES.corePages.external.guideEstablishment.absolute]);
                    }
                });
            },
            key: 'confirmdialog'
        });
    }

    checkFormErrors() {
    const errors: string[] = collectFormErrors([
        this.requirementComponent, // <-- Comentado para evitar que el requisito vacío bloquee la defensa
        this.protectedAreaComponent, 
        this.adventureTourismModalityComponent, 
        this.languageComponent, 
        this.vehicleComponent
    ]);

    if (errors.length > 0) {
        this.customMessageService.showFormErrors(errors);
        return false;
    }

    return true;
}

    back() {
        this.step.emit(1);
    }

    protected readonly CatalogueGuideClassificationsCodeEnum = CatalogueGuideClassificationsCodeEnum;
}
