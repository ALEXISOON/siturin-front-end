import { Component, QueryList, ViewChildren } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { DownloadDocumentsComponent } from "./activities/download-documents/download-documents.component";
import { ScheduleComponent } from "./activities/schedule/schedule.component";
import { ResultsComponent } from "./activities/results/results.component";
import { PrimeIcons } from 'primeng/api';
import { Message } from 'primeng/message';
import { Fluid } from 'primeng/fluid';

@Component({
    selector: 'app-process',
    imports: [TableModule, ButtonModule, DividerModule, PanelModule, DownloadDocumentsComponent, ScheduleComponent, ResultsComponent, Message, Fluid],
    templateUrl: './process.component.html'
})
export default class ProcessComponent {
    @ViewChildren(DownloadDocumentsComponent) private downloadDocumentsComponent!: QueryList<DownloadDocumentsComponent>;

    products = [
        { code: 'P1001', name: 'Juan Lopez', description: 'En espera de inspeccion' },
        { code: 'P1002', name: 'Raul Cando', description: 'En espera de inspeccion' },
        { code: 'P1003', name: 'Gloria Gonzaless', description: 'En espera de inspeccion' },
        { code: 'P1004', name: 'Maria Benitez', description: 'En espera de inspeccion'},
        { code: 'P1005', name: 'Bryan Castro', description: 'En espera de inspeccion'}
    ];

    protected readonly PrimeIcons = PrimeIcons;
}
