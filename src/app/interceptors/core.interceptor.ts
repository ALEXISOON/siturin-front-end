import { inject } from '@angular/core';
import { HttpEvent, HttpHeaders, HttpInterceptorFn, HttpParams, HttpResponse } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import { CoreService } from '@utils/services/core.service';
import { CustomMessageService } from '@utils/services';

export const coreInterceptor: HttpInterceptorFn = (req, next) => {
    let flag: boolean | undefined = false;
    const coreService = inject(CoreService);
    const customMessageService = inject(CustomMessageService);
    let headers = req.headers ? req.headers : new HttpHeaders();
    let params = req.params ? req.params : new HttpParams();

    if (params.get('page')) {
        if (!params.get('limit')) {
            params = params.append('limit', 10);
        }
    }

    // headers = headers.append('Accept', 'application/json');
    //
    // flag = req.headers.getAll('Content-Type')?.some((header) => header === 'multipart/form-data');
    //
    // if (!flag) {
    //     headers = headers.append('Content-Type', 'application/json');
    // }

    coreService.showLoading();
    coreService.showProcessing();

    return next(req.clone({ headers, params })).pipe(
        tap({
            next: (event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    // const status = event.status;
                    // const resHeaders = event.headers; // <-- headers de respuesta

                    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Evita que salgan alertas masivas automáticas en la sección de guianza o establecimientos si no lo deseas
    if (!event.url?.includes('refresh-token') && !event.url?.includes('guide') && !event.url?.includes('establishment')) {
        customMessageService.showHttpSuccess(event.body);
    }
}

                    if (['GET'].includes(req.method)) {
                        if (event.url?.includes('transactional-codes')) {
                            customMessageService.showHttpSuccess(event.body);
                        }
                    }
                }
            }
        }),
        finalize(() => {
            coreService.hideLoading();
            coreService.hideProcessing();
        })
    );
};
