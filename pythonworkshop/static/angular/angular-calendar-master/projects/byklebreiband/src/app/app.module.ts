import { registerLocaleData } from '@angular/common';
import localeNo from '@angular/common/locales/nb';
import { NgModule , LOCALE_ID, ModuleWithProviders} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FormsModule } from '@angular/forms';
import { HttpClient,HttpClientModule } from '@angular/common/http';
import { authInterceptorProviders } from './_helpers/auth-interceptor.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
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
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

import { RouterModule } from '@angular/router';
import { BB_ROUTES } from './app.routes';

import { AppComponent } from './app.component';
import { HjemComponent } from './hjem/hjem.component';
import { EditEventsDialog, EditBookNamesDialog, HomeBBComponent } from './home/home.component';
import { FastbuandeComponent } from './fastbuande/fastbuande.component';
import { ContactFormComponent } from './contact-form/contact-form.component';

@NgModule({
  declarations: [
    AppComponent,
    HjemComponent,
    HomeBBComponent,
    EditEventsDialog,
    EditBookNamesDialog,
    FastbuandeComponent,
    ContactFormComponent
  ],
  imports: [
    RouterModule.forRoot(BB_ROUTES),
    BrowserModule,
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
    MatMenuModule
  ],
  providers: [],
  bootstrap: [HomeBBComponent]
})
export class BBModule { 
  constructor(){
    registerLocaleData(localeNo);
  }
}

// AOT compilation support
export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({})
export class BBSharedModule{
  static forRoot(): ModuleWithProviders<BBModule> {
    return {
      ngModule: BBModule,
      providers: []
    }
  }
}

