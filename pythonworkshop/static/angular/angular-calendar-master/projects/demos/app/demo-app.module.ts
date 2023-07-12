import { registerLocaleData } from '@angular/common';
import { NgModule , Injectable} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

import { DemoAppComponent } from './demo-app.component';

import { CalendarModule , DateAdapter} from 'angular-calendar';
import { BBSharedModule } from 'projects/byklebreiband/src/app/app.module';
import { HomeBBComponent } from 'projects/byklebreiband/src/app/home/home.component';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ROUTES } from './demo-app.routes';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { EditBooksDialog, EditEventsDialog, EditRoomsDialog, HomeComponent } from './home/home.component';
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
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule} from '@angular/material/table'; 
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatSelectModule} from '@angular/material/select';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularCountriesFlagsModule } from 'angular-countries-flags';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { NgbCarouselModule,NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { ChangePassComponent } from './change-pass/change-pass.component';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatChipsModule } from '@angular/material/chips';
import { VippsCheckoutComponent } from './vipps-checkout/vipps-checkout.component';
import { SalgsbetingelserComponent } from './salgsbetingelser/salgsbetingelser.component';
import { PaymentComponent } from './payment/payment.component';
import { DragAndDropModule } from 'angular-draggable-droppable';
import {MatSort, Sort,MatSortModule} from '@angular/material/sort';
import {CurrencyPipe} from '@angular/common';
import {MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { LOCALE_ID } from '@angular/core';
import { CustomAdapter, CustomDateParserFormatter } from './_services/custom-adapter.service';
import { NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import {MatTabsModule} from '@angular/material/tabs';

//import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

/* const config: SocketIoConfig = {
	url: "http://localhost/wsapp/", // socket server url;
	options: {
		//transports: ['websocket']
	}
}
*/

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};

@NgModule({
  declarations: [
    DemoAppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    EditEventsDialog,
    EditRoomsDialog,
    EditBooksDialog,
    BoardAdminComponent,
    ConfirmComponent,
    ProfileComponent,
    LandingPageComponent,
    ChangePassComponent,
    VippsCheckoutComponent,
    SalgsbetingelserComponent,
    PaymentComponent,
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
    NgbDatepickerModule,
    MatExpansionModule,
    MatCardModule,
    MatListModule,
    MatMenuModule,
    MatChipsModule,
    MatSortModule,
    MatTabsModule
  ],
  providers : [
     authInterceptorProviders,
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true}},
    // { provide: MAT_DATE_LOCALE, useValue: 'nb'},
    //{ provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    { provide: LOCALE_ID, useValue: 'nb' },
    { provide: NgbDateAdapter, useClass: CustomAdapter },
		{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
    bootstrap: [HomeComponent]
})
export class DemoAppModule { 
  constructor(){
  }
}

// AOT compilation support
export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
