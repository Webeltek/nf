import { Routes } from '@angular/router';
import { HjemComponent } from './hjem/hjem.component';
import { FastbuandeComponent } from './fastbuande/fastbuande.component';
import { ContactFormComponent } from './contact-form/contact-form.component';

export const BB_ROUTES: Routes = [
    { path: 'bb/hjem', component: HjemComponent },
    { path: 'bb/fastbuande', component: FastbuandeComponent },
    { path: 'bb/contact', component: ContactFormComponent },
    { path: 'bb', redirectTo: 'bb/hjem'} 
];