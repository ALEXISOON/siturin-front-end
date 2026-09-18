import { Component, inject, OnInit } from '@angular/core';
import { UserHttpService } from '@/pages/admin/user-http.service';
import { BreadcrumbService } from '@layout/service';
import { CustomMessageService } from '@utils/services';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { LabelDirective } from '@utils/directives/label.directive';
import { InputText } from 'primeng/inputtext';
import { ErrorMessageDirective } from '@utils/directives/error-message.directive';
import { Button } from 'primeng/button';
import { invalidEmailValidator, userUpdatedValidator } from '@utils/form-validators/custom-validator';
import { RoleInterface } from '@/pages/auth/interfaces';
import { Divider } from 'primeng/divider';
import { AuthHttpService } from '@/pages/auth/auth-http.service';
import { Tag } from 'primeng/tag';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { CatalogueInterface } from '@utils/interfaces';
import { CatalogueTypeEnum } from '@utils/enums';
import { CatalogueService } from '@utils/services/catalogue.service';
import { AuthService } from '@/pages/auth/auth.service';
import { dateOnlyToLocalDate } from '@utils/helpers/formats.helper';
import { Avatar } from 'primeng/avatar';
import { Tooltip } from 'primeng/tooltip';
import { environment } from '@env/environment';
import { uploadFileValidator } from '@utils/helpers/file.helper';
import { DateLongPipe } from '@utils/pipes/date-long.pipe';
import { FontAwesome } from '@modules/public/icons/font-awesome';
import PasswordChangeComponent from '@/pages/admin/components/user/password-change/password-change.component';
import { MY_ROUTES } from '@routes';
import { GuideHttpService } from '@/pages/core/roles/external/services';

// Validador para mayores de 18 años
function minAgeValidator(minAge: number = 18): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) return null;
        const birthDate = new Date(control.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= minAge ? null : { minAge: true };
    };
}

function invalidNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = (control.value || '').trim().toUpperCase();
        if (!value) return null;
        
        // Lista de textos genéricos que no deben permitirse como nombre personal
        const forbiddenWords = ['NOMBRES PERSONA', 'NOMBRES PERSONA JURIDICA', 'PERSONA JURIDICA', 'SIN NOMBRE'];
        const isForbidden = forbiddenWords.some(word => value.includes(word));

        return isForbidden ? { invalidName: true } : null;
    };
}


@Component({
    selector: 'app-user-profile',
    imports: [Button, Divider, ErrorMessageDirective, FormsModule, InputText, LabelDirective, ReactiveFormsModule, Tag, DatePicker, Select, Avatar, Tooltip, DateLongPipe, PasswordChangeComponent],
    templateUrl: './user-profile.component.html'
})
export default class UserProfileComponent implements OnInit {
    protected readonly FontAwesome = FontAwesome;
    protected readonly catalogueService = inject(CatalogueService);
    protected readonly customMessageService = inject(CustomMessageService);
    protected readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    protected form!: FormGroup;
    protected roles: RoleInterface[] = [];
    protected identificationTypes: CatalogueInterface[] = [];
    protected sexes: CatalogueInterface[] = [];
    protected nationalities: CatalogueInterface[] = [];
    protected avatarUrl!: string;
    protected readonly authService = inject(AuthService);
    private readonly authHttpService = inject(AuthHttpService);
    private readonly userHttpService = inject(UserHttpService);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly formBuilder = inject(FormBuilder);
    private from: null | string = null;

    constructor() {
        this.breadcrumbService.setItems([{ label: 'Mi Perfil' }]);

        this.buildForm();
    }

    get identificationField(): AbstractControl {
        return this.form.controls['identification'];
    }

    get nameField(): AbstractControl {
        return this.form.controls['name'];
    }

    get lastnameField(): AbstractControl {
        return this.form.controls['lastname'];
    }

    get emailField(): AbstractControl {
        return this.form.controls['email'];
    }

    get usernameField(): AbstractControl {
        return this.form.controls['username'];
    }

    get cellPhoneField(): AbstractControl {
        return this.form.controls['cellPhone'];
    }

    get phoneField(): AbstractControl {
        return this.form.controls['phone'];
    }

    get birthdateField(): AbstractControl {
        return this.form.controls['birthdate'];
    }

    get sexField(): AbstractControl {
        return this.form.controls['sex'];
    }

    get nationalityField(): AbstractControl {
        return this.form.controls['nationality'];
    }

    get personalEmailField(): AbstractControl {
        return this.form.controls['personalEmail'];
    }

    get identificationTypeField(): AbstractControl {
        return this.form.controls['identificationType'];
    }

    get avatarField(): AbstractControl {
        return this.form.controls['avatar'];
    }

    get emailVerifiedAtField(): AbstractControl {
        return this.form.controls['emailVerifiedAt'];
    }

    async ngOnInit() {
        await this.loadCatalogues();

        if (this.authService.auth.id) {
            this.find(this.authService.auth.id);
            this.identificationField.setAsyncValidators(userUpdatedValidator(this.authHttpService, this.authService.auth.id));
        }

        this.from = this.route.snapshot.queryParamMap.get('from');
    }

    async loadCatalogues() {
        this.identificationTypes = await this.catalogueService.findByType(CatalogueTypeEnum.users_identification_type);
        this.sexes = await this.catalogueService.findByType(CatalogueTypeEnum.users_sex);
        this.nationalities = await this.catalogueService.findByType(CatalogueTypeEnum.users_nationality);
    }

    buildForm() {
    this.form = this.formBuilder.group({
        identification: [null, [Validators.required]], // <-- Cambiado a habilitado
        username: [null, [Validators.required]],
        name: [null, [Validators.required, invalidNameValidator()]],
        lastname: [null],
        email: [null, [Validators.required, invalidEmailValidator()]],
        cellPhone: [null],
        phone: [null],
        birthdate: [null, [Validators.required, minAgeValidator(18)]],
        sex: [null, [Validators.required]],           // <-- Cambiado a habilitado
        nationality: [null, [Validators.required]],   // <-- Cambiado a habilitado
        personalEmail: [null],
        identificationType: [null, [Validators.required]], // <-- Cambiado a habilitado
        avatar: [null],
        emailVerifiedAt: [null]
    });

    this.watchFormChanges();
}

    watchFormChanges() {
        this.identificationField.valueChanges.subscribe((value) => {
            this.usernameField.setValue(value);
        });
    }

    find(id: string) {
        this.userHttpService.findProfile(id).subscribe({
            next: (response: any) => {
                this.form.patchValue({
                    ...response,
                    birthdate: dateOnlyToLocalDate(response.birthdate)
                });

                if (response.avatar) this.avatarUrl = `${environment.API_ASSETS}/${response.avatar}`;

                this.roles = response.roles;
            }
        });
    }

    onSubmit() {
        if (this.validateForm()) {
            this.update();
        }
    }

    update() {
        this.userHttpService.updateProfile(this.authService.auth.id, this.form.getRawValue()).subscribe({
            next: (_) => {
                let auth = this.authService.auth;
                auth.birthdate = this.birthdateField.value;
                auth.nationality = this.nationalityField.value;
                auth.sex = this.sexField.value;
                
                // ¡AQUÍ ESTABA EL ERROR! Faltaba actualizar el nombre y apellido en la sesión:
                auth.name = this.nameField.value;
                auth.lastname = this.lastnameField.value;

                this.authService.auth = auth;

                if (this.from) {
                    this.router.navigate([MY_ROUTES.corePages.external.guideEstablishment.absolute]);
                    return;
                }

                this.find(this.authService.auth.id);
            }
        });
    }

    uploadAvatar(event: Event) {
        const file = uploadFileValidator(event);

        if (file)
            this.userHttpService.updateAvatar(this.authService.auth.id, file).subscribe({
                next: (response: any) => {
                    this.avatarUrl = `${environment.API_ASSETS}/${response.avatar}`;
                }
            });
    }

    validateForm() {
        const errors: string[] = [];

        if (this.identificationField.invalid) errors.push('Identificación');
        if (this.nameField.invalid) {
            if (this.nameField.hasError('invalidName')) {
                errors.push('El nombre no puede ser un texto genérico');
            } else {
                errors.push('Nombres');
            }
        }
        if (this.lastnameField.invalid) errors.push('Apellidos');
        if (this.emailField.invalid) errors.push('Correo electrónico');
        if (this.cellPhoneField.invalid) errors.push('Teléfono celular');
        if (this.phoneField.invalid) errors.push('Teléfono');
        if (this.birthdateField.invalid) {
            if (this.birthdateField.hasError('minAge')) {
                errors.push('Debe ser mayor de 18 años');
            } else {
                errors.push('Fecha de nacimiento');
            }
        }
        if (this.personalEmailField.invalid) errors.push('Correo personal');
        if (this.identificationTypeField.invalid) errors.push('Tipo de identificacion');
        if (this.sexField.invalid) errors.push('Sexo');
        if (this.nationalityField.invalid) errors.push('Nacionalidad');

        if (errors.length > 0) {
            this.form.markAllAsTouched();
            this.customMessageService.showFormErrors(errors);
            return false;
        }

        return true;
    }

    goToSecurityQuestions() {
        this.router.navigate([MY_ROUTES.publicPages.securityQuestions.absolute]);
    }




    
}
