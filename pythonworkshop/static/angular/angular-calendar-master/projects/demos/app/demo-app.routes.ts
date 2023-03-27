import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { DemoAppComponent } from './demo-app.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { ProfileComponent } from './profile/profile.component';
import { LoggedInGuardService } from './_helpers/logged-in-guard.service';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ChangePassComponent } from './change-pass/change-pass.component';
import { BoardAdminComponent } from './board-admin/board-admin.component';
import { HjemComponent } from 'projects/byklebreiband/src/app/hjem/hjem.component';
import { VippsCheckoutComponent } from './vipps-checkout/vipps-checkout.component';

export const ROUTES: Routes = [  
        { path: 'login', component: LoginComponent },
        { path: 'register', component: RegisterComponent },
        { path: 'change_pass', component: ChangePassComponent },
        { path: 'landing', component: LandingPageComponent },
        { path: 'vipps_checkout', component: VippsCheckoutComponent},
        { path: 'confirm', component: ConfirmComponent },
        { path: 'calendar' , canActivate: [LoggedInGuardService], component : DemoAppComponent},
        { path: 'profile' , canActivate: [LoggedInGuardService], component : ProfileComponent},
        { path: 'profile' , canActivate: [LoggedInGuardService], component : ProfileComponent},
        { path: 'logout' , canActivate: [LoggedInGuardService], component: LoginComponent},
        { path: 'board_admin', canActivate : [LoggedInGuardService], component: BoardAdminComponent},
        { path: 'bb', loadChildren: ()=> import('../../byklebreiband/src/app/app.module').then(m=>m.BBSharedModule)},
        { path: '', redirectTo: 'landing' , pathMatch : 'full' },
        { path: '**', component: LandingPageComponent },
    ];