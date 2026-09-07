import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { CustomMessageService } from '@utils/services/custom-message.service';
import { HttpResponseInterface } from '@modules/auth/interfaces';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CadastreInterface } from '@/pages/core/interfaces';

@Injectable({
    providedIn: 'root'
})
export class ReportsHttpService {
    private readonly _httpClient = inject(HttpClient);
    private readonly apiUrlExternalPDF = `${environment.API_URL}/reports/pdf/internals`;
    private readonly apiUrlExternalXLSX = `${environment.API_URL}/reports/excel/internals`;
    private readonly _customMessageService = inject(CustomMessageService);

    downloadInactivationCertificate(cadastre: CadastreInterface) {
        const url = `${this.apiUrlExternalPDF}/inactivation`;

        const params = new HttpParams().append('cadastreId', cadastre.id!);

        this._httpClient.get<BlobPart>(url, { params, responseType: 'blob' as 'json' }).subscribe((response) => {
            const filePath = URL.createObjectURL(new Blob([response]));

            const downloadLink = document.createElement('a');

            downloadLink.href = filePath;

            downloadLink.setAttribute('download', `certificado-inactivacion-${cadastre.registerNumber}.pdf`);

            document.body.appendChild(downloadLink);

            downloadLink.click();
        });
    }

    downloadRegistrationCertificate(cadastre: CadastreInterface) {
        const url = `${this.apiUrlExternalPDF}/registration-certificate-guide`;

        const params = new HttpParams().append('cadastreId', cadastre.id!);

        this._httpClient.get<BlobPart>(url, { params, responseType: 'blob' as 'json' }).subscribe((response) => {
            const filePath = URL.createObjectURL(new Blob([response]));

            const downloadLink = document.createElement('a');

            downloadLink.href = filePath;

            downloadLink.setAttribute('download', `certificado-registro-${cadastre.registerNumber}.pdf`);

            document.body.appendChild(downloadLink);

            downloadLink.click();
        });
    }

    downloadProcessesByTechnician(roleCode: string, isCurrent: boolean) {
        const url = `${this.apiUrlExternalXLSX}/technician-guide/processes`;

        const params = new HttpParams()
            .append('rolCode', roleCode)
            .append('isCurrent', isCurrent);

        this._httpClient.get<BlobPart>(url, { params, responseType: 'blob' as 'json' }).subscribe((response) => {
            const filePath = URL.createObjectURL(new Blob([response]));

            const downloadLink = document.createElement('a');

            downloadLink.href = filePath;

            downloadLink.setAttribute('download', `bandeja_tecnico_zonal.xlsx`);

            document.body.appendChild(downloadLink);

            downloadLink.click();
        });
    }

    downloadProcessesByDirector(roleCode: string, isCurrent: boolean) {
        const url = `${this.apiUrlExternalXLSX}/technician-guide/processes`;

        const params = new HttpParams()
            .append('rolCode', roleCode)
            .append('isCurrent', isCurrent);

        this._httpClient.get<BlobPart>(url, { params, responseType: 'blob' as 'json' }).subscribe((response) => {
            const filePath = URL.createObjectURL(new Blob([response]));

            const downloadLink = document.createElement('a');

            downloadLink.href = filePath;

            downloadLink.setAttribute('download', `bandeja_director.xlsx`);

            document.body.appendChild(downloadLink);

            downloadLink.click();
        });
    }
}
