import { CatalogueInterface } from '@utils/interfaces';
import { ProcessInterface } from './process.interface';

export interface EstablishmentInterface {
    id?: string;
    ruc?: string;
    state?: CatalogueInterface;
    number?: string;
    tradeName?: string;
    webPage?: string;
    process?: ProcessInterface;
    registerNumber?: string;
}
