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

export const ROUTES: Routes = [  
        { path: 'login', component: LoginComponent },
        { path: 'register', component: RegisterComponent },
        { path: 'change_pass', component: ChangePassComponent },
        { path: 'landing', component: LandingPageComponent },
        { path: 'confirm', component: ConfirmComponent },
        { path: 'calendar' , canActivate: [LoggedInGuardService], component : DemoAppComponent},
        { path: 'profile' , canActivate: [LoggedInGuardService], component : ProfileComponent},
        { path: 'logout' , canActivate: [LoggedInGuardService], component: LoginComponent},

        { path: '', redirectTo: 'landing' , pathMatch : 'full' },
        { path: '**', component: LandingPageComponent }
    ];