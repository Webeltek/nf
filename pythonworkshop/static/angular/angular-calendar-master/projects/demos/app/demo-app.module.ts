import { registerLocaleData } from '@angular/common';
import localeNo from '@angular/common/locales/nb';
import { NgModule , Injectable, LOCALE_ID} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

import { DemoAppComponent } from './demo-app.component';

import { CalendarModule, DateAdapter } from 'angular-calendar';
import { BBSharedModule } from 'projects/byklebreiband/src/app/app.module';
import { HomeBBComponent } from 'projects/byklebreiband/src/app/home/home.component';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ROUTES } from './demo-app.routes';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { EditEventsDialog, EditRoomsDialog, HomeComponent } from './home/home.component';
import { BoardAdminComponent } from './board-admin/board-admin.component';

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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { VippsCheckoutComponent } from './vipps-checkout/vipps-checkout.component';
import { SalgsbetingelserComponent } from './salgsbetingelser/salgsbetingelser.component';
//import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

/* const config: SocketIoConfig = {
	url: "http://localhost/wsapp/", // socket server url;
	options: {
		//transports: ['websocket']
	}
}
*/

@NgModule({
  declarations: [
    DemoAppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    EditEventsDialog,
    EditRoomsDialog,
    BoardAdminComponent,
    ConfirmComponent,
    ProfileComponent,
    LandingPageComponent,
    ChangePassComponent,
    VippsCheckoutComponent,
    SalgsbetingelserComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(ROUTES),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    BBSharedModule.forRoot(),
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
    MatProgressSpinnerModule,
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
    MatMenuModule
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
