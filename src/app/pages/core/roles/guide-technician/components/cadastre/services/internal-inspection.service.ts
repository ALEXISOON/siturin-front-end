import { InternalInspectionInterface } from '../interfaces/internal-inspection.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { HttpResponseInterface } from '@/pages/auth/interfaces';
import { CustomMessageService } from '@utils/services';
import { map, Observable } from 'rxjs';
import { AuthService } from '@/pages/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class InternalInspectionService {
    private readonly httpClient = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = `${environment.API_URL}/core/guide-technician`;
    private readonly customMessageService = inject(CustomMessageService);

    findCadastres(page: string, isCurrent: boolean, registerNumber:string) {
        const url = `${this.apiUrl}/process-guides/cadastres`;

        const params = new HttpParams()
            .append('page', page)
            .append('isCurrent', isCurrent)
            .append('rolCode', this.authService.role.code)
            .append('registerNumber', registerNumber)
        ;

        return this.httpClient.get<HttpResponseInterface>(url, { params }).pipe(
            map((response) => {
                return response.data;
            })
        );
    }
    createInactivation(payload: any): Observable<any> {
        const url = `${this.apiUrl}/process-guides/processes/inactivated`;

        return this.httpClient.post<HttpResponseInterface>(url, payload).pipe(
            map((response) => {
                return response.data;
            })
        );
    }
}
