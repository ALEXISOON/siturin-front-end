import { Component, inject, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { DownloadDocumentsComponent } from './activities/download-documents/download-documents.component';
import { PrimeIcons } from 'primeng/api';
import { BreadcrumbService } from '@layout/service';
import {
    InternalInspectionService
} from '@/pages/core/roles/director/components/process/services/internal-inspection.service';
import { DatePipe } from '@angular/common';
import { differenceInDays, format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstablishmentNumberPipe, ProcessStateSeverityPipe } from '@/pages/core/shared/pipes';
import { Tag } from 'primeng/tag';
import { CatalogueProcessesTypeEnum } from '@utils/enums';
import { FontAwesome } from '@/pages/public/icons/font-awesome';
import { Tooltip } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { MY_ROUTES } from '@routes';
import { FormStateService } from '@/pages/core/roles/external/services';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { LabelDirective } from '@utils/directives/label.directive';
import { ReportsHttpService } from '@/pages/core/shared/services';
import { AuthService } from '@/pages/auth/auth.service';

@Component({
    selector: 'app-process',
    standalone: true,
    imports: [TableModule, ButtonModule, DividerModule, PanelModule, DatePipe, EstablishmentNumberPipe, Tag, ProcessStateSeverityPipe, Tooltip, Tabs, TabList, Tab, TabPanels, TabPanel, DatePicker, Dialog, FormsModule, InputText, LabelDirective, ReactiveFormsModule],
    templateUrl: './process.component.html'
})
export default class ProcessComponent implements OnInit {
    @ViewChildren(DownloadDocumentsComponent) private downloadDocumentsComponent!: QueryList<DownloadDocumentsComponent>;
    protected readonly formStateService = inject(FormStateService);
    protected readonly PrimeIcons = PrimeIcons;
    protected CatalogueProcessesTypeEnum = CatalogueProcessesTypeEnum;
    private readonly router = inject(Router);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly internalInspectionService = inject(InternalInspectionService);
    protected items = signal([]);
    protected completedProcesses = signal([]);
    protected currentDate = new Date();
    protected readonly formBuilder = inject(FormBuilder);
    protected readonly filterForm = this.buildFilter();
    protected filterModal = signal<boolean>(false);
    protected isFiltering = signal<boolean>(false);
    protected activeFilters: any[] = [];
    private readonly reportsHttpService = inject(ReportsHttpService);
    private readonly authService = inject(AuthService);


    constructor() {
        this.breadcrumbService.setItems([{ label: 'Listado de Trámites' }]);
    }

    ngOnInit() {
        this.findProcesses();
        this.findCompletedProcesses();
    }

    buildFilter() {
        return this.formBuilder.group({
            registerNumber: [null],
            establishmentNumber: [null],
            legalName: [null],
            classification: [null],
            processType: [null],
            province: [null],
            canton: [null],
            parish: [null],
            cadastreState: [null],
            startedAt: [''],
            endedAt: ['']
        });
    }

    validateStartedAt() {
        const valid = isAfter(new Date(this.filterForm.controls['startedAt'].value!), new Date(this.filterForm.controls['endedAt'].value!));
    }

    applyActiveFilters() {
        this.activeFilters = Object.entries(this.filterForm.getRawValue())
            .filter(([_, value]) =>
                value !== null &&
                value !== undefined &&
                value !== ''
            )
            .map(([key, value]) => ({
                key,
                value
            }));
    }

    findProcesses(isFilter = false) {
        if (!isFilter) {
            this.filterForm.reset();
            this.activeFilters = [];
        }

        this.isFiltering.set(isFilter);

        if (isFilter) {
            this.applyActiveFilters();

            if (this.filterForm.controls['startedAt'].value && this.filterForm.controls['endedAt'].value) {
                const startedAtFormat = format(new Date(this.filterForm.controls['startedAt'].value!), 'yyyy-MM-dd');
                const endedAtFormat = format(new Date(this.filterForm.controls['endedAt'].value!), 'yyyy-MM-dd');
                this.filterForm.controls['startedAt'].patchValue(startedAtFormat);
                this.filterForm.controls['endedAt'].patchValue(endedAtFormat);
            }
        }

        const filters = this.filterForm.getRawValue();

        this.internalInspectionService.findProcesses('1', true, filters).subscribe({
            next: (response) => {
                this.items.set(response);
                this.filterModal.set(false);
            }
        });
    }

    findCompletedProcesses(isFilter = false) {
        if (!isFilter) {
            this.filterForm.reset();
            this.activeFilters = [];
        }
        this.isFiltering.set(isFilter);

        if (isFilter) {
            this.applyActiveFilters();
            if (this.filterForm.controls['startedAt'].value && this.filterForm.controls['endedAt'].value) {
                const startedAtFormat = format(new Date(this.filterForm.controls['startedAt'].value!), 'yyyy-MM-dd');
                const endedAtFormat = format(new Date(this.filterForm.controls['endedAt'].value!), 'yyyy-MM-dd');
                this.filterForm.controls['startedAt'].patchValue(startedAtFormat);
                this.filterForm.controls['endedAt'].patchValue(endedAtFormat);
            }
        }

        const filters = this.filterForm.getRawValue();

        this.internalInspectionService.findProcesses('1', false, filters).subscribe({
            next: (response) => {
                this.completedProcesses.set(response);
            }
        });
    }

    goToProcess(processId: string, assignmentId: string, isCurrent: boolean) {
        this.formStateService.updateSection('process', { id: processId });
        this.formStateService.updateSection('assignment', { id: assignmentId });
        this.router.navigate([MY_ROUTES.corePages.director.checklist.absolute, processId, isCurrent]);
    }

    protected downloadProcessesByDirector() {
        this.reportsHttpService.downloadProcessesByTechnician(this.authService.role.code, true);
    }

    protected readonly es = es;
    protected readonly differenceInDays = differenceInDays;
    protected readonly FontAwesome = FontAwesome;
}
