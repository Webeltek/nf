import { registerLocaleData } from '@angular/common';
import localeNo from '@angular/common/locales/nb';
import { NgModule , LOCALE_ID} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

import { DemoAppComponent } from './demo-app.component';

import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ROUTES } from './demo-app.routes';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { EditEventsDialog, EditRoomsDialog, HomeComponent } from './home/home.component';
import { BoardAdminComponent } from './board-admin/board-admin.component';
import { BoardUserComponent } from './board-user/board-user.component';

import { FormsModule } from '@angular/forms';
import { HttpClient,HttpClientModule } from '@angular/common/http';
import { ConfirmComponent } from './confirm/confirm.component';
import { authInterceptorProviders } from './_helpers/auth-interceptor.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ProfileComponent } from './profile/profile.component';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule} from '@angular/material/table'; 
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatSelectModule} from '@angular/material/select';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularCountriesFlagsModule } from 'angular-countries-flags';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { ChangePassComponent } from './change-pass/change-pass.component';
import { MatListModule } from '@angular/material/list';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';   
//import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

/* const config: SocketIoConfig = {
	url: "http://localhost/wsapp/", // socket server url;
	options: {
		//transports: ['websocket']
	}
} */

@NgModule({
  declarations: [
    DemoAppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    EditEventsDialog,
    EditRoomsDialog,
    BoardAdminComponent,
    BoardUserComponent,
    ConfirmComponent,
    ProfileComponent,
    LandingPageComponent,
    ChangePassComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(ROUTES),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),

    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    //SocketIoModule.forRoot(config)
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient]
      }
    }),
    AngularCountriesFlagsModule,
    NgbCarouselModule,
    MatExpansionModule,
    MatCardModule,
    MatListModule,
    AuthModule.forRoot({
      config: {
        authority: 'https://apitest.vipps.no/access-management-1.0/access/.well-known/openid-configuration',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'ec1d0cfe-3fae-4246-87bb-05deee9605a3',
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: LogLevel.Debug,
      },
    }),
  ],
  providers : [
    { provide: LOCALE_ID, useValue: 'nb' },
    authInterceptorProviders,
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true}}
  ],
    bootstrap: [HomeComponent]
})
export class DemoAppModule { 
  constructor(){
    registerLocaleData(localeNo);
  }
}

// AOT compilation support
export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
