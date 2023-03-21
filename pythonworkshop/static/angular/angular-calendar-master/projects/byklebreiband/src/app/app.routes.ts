import { Routes } from '@angular/router';
import { HjemComponent } from './hjem/hjem.component';

export const BB_ROUTES: Routes = [
    { path: 'bb/hjem', component: HjemComponent },
    { path: 'bb', redirectTo: 'bb/hjem'} 
];