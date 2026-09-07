import { InternalInspectionInterface } from '../interfaces/internal-inspection.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { HttpResponseInterface } from '@/pages/auth/interfaces';
import { CustomMessageService } from '@utils/services';
import { map } from 'rxjs';
import { AuthService } from '@/pages/auth/auth.service';
import {
    ProcessFilters
} from '@/pages/core/roles/guide-technician/components/process/services/internal-inspection.service';

@Injectable({
    providedIn: 'root'
})
export class InternalInspectionService {
    private readonly httpClient = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = `${environment.API_URL}/core/guide-technician`;
    private readonly customMessageService = inject(CustomMessageService);

    create(payload: InternalInspectionInterface) {
        const url = `${this.apiUrl}`;

        return this.httpClient.post<HttpResponseInterface>(url, payload).pipe(
            map((response) => {
                this.customMessageService.showSuccess({ summary: response.title, detail: response.message });

                return response.data;
            })
        );
    }

    findProcesses(page: string, isCurrent: boolean, filters: ProcessFilters) {
        const url = `${this.apiUrl}/process-guides/processes`;

        let params = new HttpParams()
            .append('page', page)
            .append('rolCode', this.authService.role.code)
            .append('isCurrent', isCurrent);

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        });

        return this.httpClient.get<HttpResponseInterface>(url, { params }).pipe(
            map((response) => {
                return response.data;
            })
        );
    }

    findProcess(processId: string, isCurrent: boolean) {
        const url = `${this.apiUrl}/process-guides/processes/${processId}`;

        const params = new HttpParams()
            .append('rolCode', this.authService.role.code)
            .append('isCurrent', isCurrent);

        return this.httpClient.get<HttpResponseInterface>(url, { params }).pipe(
            map((response) => {
                return response.data;
            })
        );
    }

    complete(payload: any) {
        const url = `${this.apiUrl}/process-guides/processes/complete`;

        return this.httpClient.post<HttpResponseInterface>(url, payload).pipe(
            map((response) => {
                return response.data;
            })
        );
    }
}
