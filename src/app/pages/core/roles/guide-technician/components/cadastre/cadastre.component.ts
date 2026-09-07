import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { BreadcrumbService } from '@layout/service';
import {
    InternalInspectionService
} from '@/pages/core/roles/guide-technician/components/cadastre/services/internal-inspection.service';
import { es } from 'date-fns/locale';
import { EstablishmentNumberPipe, ProcessStateSeverityPipe } from '@/pages/core/shared/pipes';
import { Tag } from 'primeng/tag';
import { CatalogueProcessesTypeEnum, CatalogueTypeEnum } from '@utils/enums';
import { FontAwesome } from '@/pages/public/icons/font-awesome';
import { Tooltip } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { FormStateService } from '@/pages/core/roles/external/services';
import { ButtonActionComponent } from '@utils/components/button-action/button-action.component';
import { downloadButtonAction, inactivationButtonAction } from '@utils/components/button-action/consts';
import {
    InactivationComponent
} from '@/pages/core/roles/guide-technician/components/cadastre/inactivation/inactivation.component';
import { CatalogueService } from '@utils/services/catalogue.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
    CadastreInterface
} from '@/pages/core/roles/guide-technician/components/cadastre/interfaces/cadastre.interface';
import { ReportsHttpService } from '@/pages/core/shared/services';
import { CatalogueCadastreStatesStateEnum } from '@/pages/core/shared/enums';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { debounceTime } from 'rxjs';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputGroup } from 'primeng/inputgroup';

@Component({
    selector: 'app-cadastre',
    standalone: true,
    imports: [TableModule, ButtonModule, DividerModule, PanelModule, EstablishmentNumberPipe, Tag, ProcessStateSeverityPipe, Tooltip, ButtonActionComponent, InputText, ReactiveFormsModule, InputGroupAddon, InputGroup],
    templateUrl: './cadastre.component.html',
    providers: [DialogService]
})
export default class CadastreComponent implements OnInit {
    private readonly catalogueService = inject(CatalogueService);
    protected readonly formStateService = inject(FormStateService);
    protected readonly PrimeIcons = PrimeIcons;
    protected CatalogueProcessesTypeEnum = CatalogueProcessesTypeEnum;
    private readonly router = inject(Router);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly internalInspectionService = inject(InternalInspectionService);
    private readonly reportsHttpService = inject(ReportsHttpService);
    protected items = signal([]);
    protected buttonActions: MenuItem[] = [];
    protected isButtonActionsEnabled: boolean = false;
    protected currentDate = new Date();
    protected searchControl = new FormControl('');
    private dialogService = inject(DialogService);
    ref?: DynamicDialogRef | null;

    constructor() {
        this.breadcrumbService.setItems([{ label: 'Listado de Catastros' }]);
    }

    ngOnInit() {
        this.findCadastres();
        this.searchControl.valueChanges.pipe(
            debounceTime(500)
        ).
        subscribe(() => this.findCadastres());
    }

    findCadastres() {
        this.internalInspectionService.findCadastres('1', true, this.searchControl.value!).subscribe({
            next: (response) => {
                this.items.set(response);
            }
        });
    }

    buildButtonActions(item: CadastreInterface) {
        this.buttonActions = [];

        if (item.state?.code == CatalogueCadastreStatesStateEnum.inactive) {
            this.buttonActions.push({
                ...downloadButtonAction,
                label: 'Certificado de Inactivación',
                command: () => this.downloadInactivationCertificate(item)
            });
        }

        if (item.state?.code == CatalogueCadastreStatesStateEnum.ratified) {
            this.buttonActions.push({
                ...inactivationButtonAction,
                command: () => this.openInactivationModal(item)
            });

            this.buttonActions.push({
                ...downloadButtonAction,
                label: 'Certificado de Registro',
                command: () => this.downloadRegistrationCertificate(item)
            });
        }
    }

    onSelect({ item, index }: { item: any; index: number }) {
        this.buildButtonActions(item);
        this.isButtonActionsEnabled = true;
    }

    async openInactivationModal(cadastre: CadastreInterface) {
        const processType = await this.catalogueService.findByCode(CatalogueProcessesTypeEnum.inactivation, CatalogueTypeEnum.processes_type);

        this.ref = this.dialogService.open(InactivationComponent, {
            header: 'Inactivación',
            width: '50%',
            closable: true,
            data: {
                establishmentId: cadastre.process?.establishment?.id,
                cadastreId: cadastre?.id,
                processType
            }
        });

        if (this.ref) {
            this.ref.onClose.subscribe((result) => {
                this.findCadastres();
            });
        }
    }

    protected downloadInactivationCertificate(cadastre: CadastreInterface) {
        this.reportsHttpService.downloadInactivationCertificate(cadastre);
    }

    protected downloadRegistrationCertificate(cadastre: CadastreInterface) {
        this.reportsHttpService.downloadRegistrationCertificate(cadastre);
    }

    protected readonly es = es;
    protected readonly FontAwesome = FontAwesome;
}
