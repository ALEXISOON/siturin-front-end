import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { MY_ROUTES } from '@routes';
import { AuthService } from '@modules/auth/auth.service';
import { RoleEnum } from '@utils/enums';
import { AuthHttpService } from '@/pages/auth/auth-http.service';
import { FontAwesome } from '@modules/public/icons/font-awesome';
import { environment } from '@env/environment';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule, Button, Fluid],
    styles: [
        `
            /* Contenedor real del sidebar */
            .layout-sidebar,
            .p-sidebar,
            .p-drawer {
                height: 100vh !important;
                display: flex;
                flex-direction: column;
            }

            /* Contenido interno */
            .sidebar-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0; /* MUY IMPORTANTE */
            }

            .sidebar-footer {
                padding-bottom: 2rem;
            }

            .sidebar-footer .p-button {
                width: 100%;
                justify-content: center;
            }
        `
    ],
    template: `
        <div class="flex flex-column h-full sidebar-content">
            <!-- MENÚ -->
            <ul class="layout-menu flex-1 overflow-y-auto">
                @for (item of model; track item.label) {
                    @if (!item.separator) {
                        <li app-menuitem [item]="item" [root]="true"></li>
                    } @else {
                        <li class="menu-separator"></li>
                    }
                }
            </ul>

            <!-- FOOTER -->
            <div class="sidebar-footer mt-auto">
                <hr class="mx-4 my-3 border-surface" />

                <p-fluid>
                    <div>
                        <p-button text size="small" severity="secondary" [icon]="FontAwesome.CODE_BRANCH_SOLID"
                                  [label]="environment.APP_VERSION" />
                    </div>

                    <div>
                        <p-button [outlined]="true" [raised]="true" size="small" severity="danger"
                                  [icon]="FontAwesome.POWER_OFF_SOLID" label="Cerrar Sesión" (onClick)="signOut()" />
                    </div>
                </p-fluid>
            </div>
        </div>
    `
})
export class AppMenu implements OnInit {
    protected readonly authService = inject(AuthService);
    protected readonly authHttpService = inject(AuthHttpService);

    protected model: MenuItem[] = [];
    protected readonly FontAwesome = FontAwesome;
    protected readonly environment = environment;
    private readonly confirmationService = inject(ConfirmationService);

    get loadMenu(): MenuItem[] {
        switch (this.authService.role.code) {
            case RoleEnum.ADMIN:
                return this.adminMenu;
            case RoleEnum.EXTERNAL:
                return this.externalMenu;
            case RoleEnum.TECHNICIAN:
                return this.technicianMenu;
            case RoleEnum.GUIDE_TECHNICIAN:
                return this.guideTechnicianMenu;
            case RoleEnum.DIRECTOR:
                return this.directorMenu;
            case RoleEnum.SPECIALIST:
                return this.specialistMenu;
            case RoleEnum.DAC:
                return this.dacMenu;
            case RoleEnum.GAD:
                return this.gadMenu;
            default:
                return [];
        }
    }

    get adminMenu(): MenuItem[] {
        return [
            {
                label: 'Usuarios',
                icon: FontAwesome.USERS_SOLID,
                routerLink: [MY_ROUTES.adminPages.user.absolute]
            }
        ];
    }

    get externalMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.external.simulator.absolute]
            },
            {
                label: 'Proceso de Acreditación de Actividades Turísticas',
                icon: FontAwesome.SHOP_SOLID,
                routerLink: [MY_ROUTES.corePages.external.establishment.absolute]
            },
            {
                label: 'Proceso de Acreditación de Guianza Turística',
                icon: FontAwesome.PERSON_HIKING_SOLID,
                routerLink: [MY_ROUTES.corePages.external.guideEstablishment.absolute]
            },
            {
                label: 'Manual de Usuario',
                icon: FontAwesome.DOWNLOAD_SOLID,
                command() {
                    window.open(`${environment.APP_PATH_ASSETS}/auth/files/manual.pdf`, '_blank');
                }
            }
        ];
    }

    get technicianMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.technician.simulator.absolute]
            },
            {
                label: 'Catrasto Turístico',
                icon: FontAwesome.DATABASE_SOLID,
                routerLink: [MY_ROUTES.corePages.technician.process.absolute]
            },
            {
                label: 'Trámites',
                icon: FontAwesome.CLIPBOARD_LIST_SOLID,
                routerLink: [MY_ROUTES.corePages.technician.process.absolute]
            },
            {
                label: 'Bitácora',
                icon: FontAwesome.CLOCK_ROTATE_LEFT_SOLID,
                routerLink: [MY_ROUTES.corePages.technician.process.absolute]
            }
        ];
    }

    get guideTechnicianMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.guideTechnician.simulator.absolute]
            },
            {
                label: 'Revisión Guianza Turística',
                icon: FontAwesome.LIST_CHECK_SOLID,
                routerLink: [MY_ROUTES.corePages.guideTechnician.process.absolute]
            },
            {
                label: 'Gestión Guianza Turística',
                icon: FontAwesome.SITEMAP_SOLID,
                routerLink: [MY_ROUTES.corePages.guideTechnician.cadastre.absolute]
            },
            {
                label: 'Manual de Usuario',
                icon: FontAwesome.DOWNLOAD_SOLID,
                command() {
                    window.open(`${environment.APP_PATH_ASSETS}/auth/files/manual.pdf`, '_blank');
                }
            }
        ];
    }

    get directorMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.director.simulator.absolute]
            },
            {
                label: 'Aprobación Guianza Turística',
                icon: FontAwesome.LIST_CHECK_SOLID,
                routerLink: [MY_ROUTES.corePages.director.process.absolute]
            },
            {
                label: 'Manual de Usuario',
                icon: FontAwesome.DOWNLOAD_SOLID,
                command() {
                    window.open(`${environment.APP_PATH_ASSETS}/auth/files/manual.pdf`, '_blank');
                }
            }
        ];
    }

    get specialistMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.specialist.simulator.absolute]
            },
            {
                label: 'Catrasto Turístico',
                icon: FontAwesome.DATABASE_SOLID,
                routerLink: [MY_ROUTES.corePages.specialist.process.absolute]
            },
            {
                label: 'Trámites',
                icon: FontAwesome.CLIPBOARD_LIST_SOLID,
                routerLink: [MY_ROUTES.corePages.specialist.process.absolute]
            },
            {
                label: 'Bitácora',
                icon: FontAwesome.CLOCK_ROTATE_LEFT_SOLID,
                routerLink: [MY_ROUTES.corePages.specialist.process.absolute]
            }
        ];
    }

    get dacMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.dac.simulator.absolute]
            },
            {
                label: 'Catrasto Turístico',
                icon: FontAwesome.DATABASE_SOLID,
                routerLink: [MY_ROUTES.corePages.dac.cadastre.absolute]
            },
            {
                label: 'Bitácora',
                icon: FontAwesome.CLOCK_ROTATE_LEFT_SOLID,
                routerLink: [MY_ROUTES.corePages.dac.processLog.absolute]
            },
            {
                label: 'Gantt',
                icon: FontAwesome.CHART_BAR_REGULAR,
                routerLink: ['/main/core/dac/gantt']
            }
        ];
    }

    get gadMenu(): MenuItem[] {
        return [
            {
                label: 'Simulador Normativa',
                icon: FontAwesome.DESKTOP_SOLID,
                routerLink: [MY_ROUTES.corePages.gad.simulator.absolute]
            },
            {
                label: 'Catrasto Turístico',
                icon: FontAwesome.DATABASE_SOLID,
                routerLink: [MY_ROUTES.corePages.gad.cadastre.absolute]
            },
            {
                label: 'Bitácora',
                icon: FontAwesome.CLOCK_ROTATE_LEFT_SOLID,
                routerLink: [MY_ROUTES.corePages.gad.processLog.absolute]
            }
        ];
    }

    ngOnInit() {
        this.model = [
            {
                label: 'Inicio',
                items: [
                    // { label: 'Dashboard', icon: FontAwesome.HOUSE_REGULAR, routerLink: ['/'] },
                    {
                        label: 'Mi Perfil',
                        icon: FontAwesome.USER_REGULAR,
                        routerLink: [MY_ROUTES.adminPages.user.profile.absolute]
                    }
                ]
            },
            {
                separator: true
            },
            {
                label: 'Gestión',
                items: [...this.loadMenu]
            }
        ];
    }

    signOut() {
        this.confirmationService.confirm({
            message: '¿Está seguro de salir del sistema?',
            header: 'Salir del Sistema',
            icon: FontAwesome.POWER_OFF_SOLID,
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'secondary',
                text: true
            },
            acceptButtonProps: {
                label: 'Sí, Salir',
                severity: 'danger',
                outlined: true,
                raised: true
            },
            accept: () => {
                this.authHttpService.signOut().subscribe();
            },
            key: 'confirmdialog'
        });
    }
}
