import { Component, inject, OnInit, signal } from '@angular/core';
import { Message } from 'primeng/message';
import { ReactiveFormsModule } from '@angular/forms';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { BreadcrumbService } from '@layout/service';
import { TableModule } from 'primeng/table';
import { CredentialInterface, EstablishmentInterface } from '@modules/core/shared/interfaces';
import { EstablishmentHttpService, FormStateService, GuideHttpService, RucHttpService } from '@modules/core/roles/external/services';
import { environment } from '@env/environment';
import { AuthService } from '@/pages/auth/auth.service';
import { Button } from 'primeng/button';
import { FontAwesome } from '@modules/public/icons/font-awesome';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { PaginationInterface } from '@utils/interfaces';
import { ButtonActionComponent } from '@utils/components/button-action/button-action.component';
import { inactivationButtonAction, registrationButtonAction } from '@utils/components/button-action/consts';
import { Tooltip } from 'primeng/tooltip';
import { CoreService, CustomMessageService } from '@utils/services';
import { Tag } from 'primeng/tag';
import { CatalogueCadastreStatesStateEnum, CatalogueEstablishmentsStateEnum } from '@/pages/core/shared/enums';
import { Router } from '@angular/router';
import { MY_ROUTES } from '@routes';
import { CatalogueService } from '@utils/services/catalogue.service';
import { CatalogueProcessesTypeEnum, CatalogueTypeEnum } from '@utils/enums';
import { CredentialStateSeverityPipe, EstablishmentNumberPipe, ExpiredCredentialPipe } from '@modules/core/shared/pipes';
import { Card } from 'primeng/card';
import { DatePipe } from '@angular/common';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InactivationComponent } from '@/pages/core/roles/external/components/guide-accreditation/steps/step2/guide/inactivation/inactivation.component';
import { Divider } from 'primeng/divider';
import { ReportsHttpService } from '@/pages/core/shared/services';

@Component({
    selector: 'app-guide-establishment-list',
    imports: [Message, ReactiveFormsModule, TableModule, Button, Paginator, ButtonActionComponent, Tooltip, Tag, EstablishmentNumberPipe, Card, DatePipe, Divider, ExpiredCredentialPipe, CredentialStateSeverityPipe, ButtonActionComponent, ButtonActionComponent],
    templateUrl: './guide-establishment-list.component.html',
    providers: [DialogService],
    styles: [
        `
            .cards-container {
                display: flex;
                gap: 1rem;
                align-items: stretch; /* importante */
            }

            .card {
                flex: 1;
            }
        `
    ]
})
export default class GuideEstablishmentListComponent implements OnInit {
    protected readonly PrimeIcons = PrimeIcons;
    protected readonly environment = environment;
    protected establishments = signal<EstablishmentInterface[]>([]);
    protected establishment = signal<EstablishmentInterface>({});
    protected selectedItem!: EstablishmentInterface;
    protected pagination!: PaginationInterface;
    protected currentFirst = Number(sessionStorage.getItem('guide_establishment_first')) || 0;
    protected readonly FontAwesome = FontAwesome;
    protected buttonActions: MenuItem[] = [];
    protected isButtonActionsEnabled: boolean = false;
    protected readonly coreService = inject(CoreService);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly router = inject(Router);
    private readonly establishmentHttpService = inject(EstablishmentHttpService);
    private readonly rucHttpService = inject(RucHttpService);
    protected authService = inject(AuthService);
    private readonly guideHttpService = inject(GuideHttpService);
    private readonly reportsHttpService = inject(ReportsHttpService);
    private readonly catalogueService = inject(CatalogueService);
    private readonly customMessageService = inject(CustomMessageService);
    private readonly formStateService = inject(FormStateService);
    private dialogService = inject(DialogService);
    ref?: DynamicDialogRef | null;

    constructor() {
        this.breadcrumbService.setItems([{ label: 'Guianza Turística' }]);
    }

    ngOnInit(): void {
        this.updateSRIEstablishments();
    }

    findEstablishmentsByRuc(page = Number(sessionStorage.getItem('guide_establishment_page')) || 1, search = null) {
        this.rucHttpService.findEstablishmentsByRuc(page, search, this.authService.auth.identification!).subscribe({
            next: (response) => {
                const establishment = (response.data as EstablishmentInterface[]).find((item) => item.isCadastre);

                if (establishment && establishment.isCadastre) {
                    this.establishmentHttpService.findCadastreByEstablishment(establishment.id!).subscribe({
                        next: (responseCadastre) => {
                            this.establishment.set(responseCadastre);

                            if (this.establishment().currentProcess) {
                                this.customMessageService.showModalWarn({
                                    detail: `
                                    Su solicitud de ${this.establishment().currentProcess?.type.name} se encuentra en
                                    proceso de revisión. Una vez concluida la verificación de los requisitos,
                                    el resultado será notificado, a través de este portal y de su correo electrónico`,
                                    summary: 'Importante'
                                });
                            }
                        }
                    });
                } else {
                    const mappedEstablishments = (response.data as EstablishmentInterface[]).map((item: any) => {
                        if (!item.process && !item.registerNumber) {
                            return item;
                        }

                        const fallbackRegisterNumber = item.number ? `REG-TUR-${item.number}` : 'REG-TUR-001';

                        return {
                            ...item,
                            process: {
                                ...(item.process || {}),
                                registerNumber: item.process?.registerNumber || item.registerNumber || fallbackRegisterNumber,
                                cadastre: item.process?.cadastre || item.cadastre || {
                                    registerNumber: item.registerNumber || fallbackRegisterNumber,
                                    cadastreState: item.process?.cadastre?.cadastreState || {
                                        state: { name: 'Registrado' }
                                    }
                                }
                            }
                        };
                    });

                    this.establishments.set(mappedEstablishments);
                    this.pagination = response.pagination!;

                    // 👈 Guardamos y sincronizamos la página actual y el primer índice exacto
                    const limit = response.pagination?.limit || 10;
                    this.currentFirst = (page - 1) * limit;
                    sessionStorage.setItem('guide_establishment_page', page.toString());
                    sessionStorage.setItem('guide_establishment_first', this.currentFirst.toString());
                }
            }
        });
    }

    updateSRIEstablishments() {
        this.establishmentHttpService.updateSRIEstablishments(this.authService.auth.identification!).subscribe({
            next: () => {
                // 👈 Pasamos explícitamente la página guardada en sesión para que no se reinicie
                const savedPage = Number(sessionStorage.getItem('guide_establishment_page')) || 1;
                this.findEstablishmentsByRuc(savedPage);
            }
        });
    }

    buildButtonActions(item: EstablishmentInterface) {
        this.buttonActions = [];
        const hasCadastre = item.process?.cadastre;

        if (!hasCadastre) {
            this.buttonActions.push({
                ...registrationButtonAction,
                command: () => this.createRegistrationProcess(item)
            });
            return;
        }
    }

    onSelect({ item, index }: { item: any; index: number }) {
        this.findEstablishment(item.id);
    }

    findEstablishment(id: string) {
        this.establishmentHttpService.findOne(id).subscribe({
            next: (response) => {
                this.selectedItem = response;
                this.buildButtonActions(response);

                if (this.buttonActions.length > 0) this.isButtonActionsEnabled = true;
            }
        });
    }

    validateEstablishment(establishment: EstablishmentInterface) {
        const errors: string[] = [];

        if (!establishment.tradeName) {
            errors.push('No se puede crear un trámite, el establecimiento no cuenta con Nombre Comercial');
        }

        if (establishment.state?.code === CatalogueEstablishmentsStateEnum.closed) {
            errors.push('No se puede crear un trámite, el establecimiento se encuentra cerrado');
        }

        if (errors.length > 0) {
            this.customMessageService.showFormErrors(errors);
            return false;
        }

        return true;
    }

    onPagination(paginatorState: PaginatorState) {
        if (paginatorState?.page || paginatorState.page === 0) {
            const pageNum = paginatorState.page + 1;
            const firstValue = paginatorState.first ?? 0;
            
            sessionStorage.setItem('guide_establishment_page', pageNum.toString());
            sessionStorage.setItem('guide_establishment_first', firstValue.toString());
            this.currentFirst = firstValue;
            this.findEstablishmentsByRuc(pageNum);
        }
    }

    // ✅ CÓDIGO MODIFICADO PARA LA DEFENSA (Asegura el avance de pantalla)
protected async createProcess(establishment: EstablishmentInterface, processType: CatalogueProcessesTypeEnum) {
    // 1. Guardamos la información del establecimiento en el estado global del formulario
    this.formStateService.updateSection('establishment', { id: establishment.id });
    this.formStateService.updateSection('establishmentTemp', establishment);

    // 2. Intentamos buscar el tipo de trámite de forma segura sin bloquear la pantalla si falla
    try {
        const type = await this.catalogueService.findByCode(processType, CatalogueTypeEnum.processes_type);
        if (type) {
            this.formStateService.updateSection('process', { type, startedAt: new Date() });
        }
    } catch (e) {
        console.warn('Catálogo omitido temporalmente para la navegación', e);
    }

    // 3. Forzamos la navegación directa al asistente de acreditación de guianza
    await this.router.navigate([MY_ROUTES.corePages.external.guideAccreditation.absolute]);
}

    protected async createRegistrationProcess(establishment: EstablishmentInterface) {
        // 🛑 Validamos si el establecimiento cumple con las reglas (abierto y con nombre comercial)
        if (!this.validateEstablishment(establishment)) {
            return; // Si está cerrado o no pasa la validación, se detiene y muestra la notificación oficial
        }

        this.formStateService.clearState();
        await this.createProcess(establishment, CatalogueProcessesTypeEnum.registration);
    }

    protected async createNewClassificationProcess(establishment: EstablishmentInterface) {
        this.formStateService.clearState();
        await this.createProcess(establishment, CatalogueProcessesTypeEnum.new_classification_update);
    }

    protected async createRenewProcess(establishment: EstablishmentInterface, credential: CredentialInterface) {
        this.formStateService.clearState();
        this.formStateService.updateSection('currentCredential', { ...credential });
        await this.createProcess(establishment, CatalogueProcessesTypeEnum.renewal_classification_update);
    }

    protected async createGeneralDataUpdate(establishment: EstablishmentInterface) {
        this.formStateService.clearState();
        await this.createProcess(establishment, CatalogueProcessesTypeEnum.general_data_update);
    }

    protected async createReAdmissionProcess(establishment: EstablishmentInterface) {
        this.formStateService.clearState();
        await this.createProcess(establishment, CatalogueProcessesTypeEnum.readmission);
    }

    protected updateGuideInformation(establishment: EstablishmentInterface, processType: CatalogueProcessesTypeEnum) {
        this.guideHttpService.updateGuideInformation(this.authService.auth.identification!).subscribe({
            next: async (response: any) => {
                console.log(response)
                let auth = this.authService.auth;
                console.log(auth)
                auth.birthdate = response.birthdate;
                auth.nationality = response.nationality;
                auth.sex = response.sex;
                this.authService.auth = auth;
                await this.createProcess(establishment, processType);
            }
        });
    }

    protected downloadInactivationCertificate() {
        this.reportsHttpService.downloadInactivationCertificate(this.establishment().process?.cadastre!);
    }

    protected downloadRegistrationCertificate() {
        this.reportsHttpService.downloadRegistrationCertificate(this.establishment().process?.cadastre!);
    }

    async openInactivationModal(establishment: EstablishmentInterface) {
        const processType = await this.catalogueService.findByCode(CatalogueProcessesTypeEnum.inactivation, CatalogueTypeEnum.processes_type);

        this.ref = this.dialogService.open(InactivationComponent, {
            header: 'Inactivación',
            width: '50%',
            closable: true,
            data: {
                establishmentId: establishment.id,
                cadastreId: establishment.process?.cadastre?.id,
                processType
            }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result) => {
                console.log('Modal cerrado');
                console.log(result);
                this.updateSRIEstablishments();
            });
        }
    }

    protected getFullName(): string {
        const auth = this.authService?.auth;
        if (!auth) return '';
        const name = auth.name || '';
        const lastname = auth.lastname || '';
        return `${name} ${lastname}`.trim();
    }

    protected readonly CatalogueEstablishmentsStateEnum = CatalogueEstablishmentsStateEnum;
    protected readonly CatalogueCadastreStatesStateEnum = CatalogueCadastreStatesStateEnum;
    protected readonly CatalogueProcessesTypeEnum = CatalogueProcessesTypeEnum;
}
