import { Component, Input,
  OnInit, Output, EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef, KeyValueDiffers,IterableDiffers, 
  DoCheck,
  ViewChild,
  TemplateRef, ElementRef } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { 
  CalendarDateFormatter, CalendarEventTimesChangedEvent,
  CalendarView, CalendarEvent, DAYS_OF_WEEK } from 'angular-calendar';
import { Subject, Subscription, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CustomDateFormatter } from './custom-date-formatter.provider';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpResponse } from '@angular/common/http';
import { Router, ActivatedRoute, ParamMap, NavigationEnd  } from '@angular/router';
import { TokenStorageService } from './_services/token-storage.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemePalette } from '@angular/material/core';
import { AuthService } from './_services/auth.service';
import { MatTabChangeEvent } from '@angular/material/tabs';

export interface ChipItem {
  bookname : string
  amount: string;
  reference : string;
  color: ThemePalette;
  start : Date;
  dragable : boolean;
}

export interface PythUser {
  id : number; 
  user_email : string;
  user_pass_hash : string;
  user_is_logged_in : string;
  user_confirmed : string;
  access_token : string;
  last_seen : string;
  is_admin : string;
  ou : string
}

@Component({
  selector: 'app-root',
  templateUrl: './demo-app.html',
  styleUrls: ['./demo-app.css'],
  changeDetection : ChangeDetectionStrategy.Default,
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter,
    },
  ],
})
export class DemoAppComponent implements OnInit, OnDestroy{
  @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;

  isMobLayout = false;
  viewDate: Date = new Date();
  view: CalendarView = CalendarView.Week;
  CalendarView = CalendarView;
  daysInWeek = 7;
  locale : string = "nb";
  weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  weekendDays: number[] = [DAYS_OF_WEEK.FRIDAY, DAYS_OF_WEEK.SATURDAY];
  modalData: {
    action: string;
    event: CalendarEvent;
  };

  loginStateSubscription: Subscription = new Subscription();

  setView(view: CalendarView) {
    this.view = view;
  }

  private _events : CalendarEvent[] = [];
  public get events(){
    return this._events;
  }
  public set events(events : CalendarEvent[]){
    this._events = events;
  }
   
  users : PythUser[] = [];
  loggedInUserId : number;
  toBeDeletedEvt : CalendarEvent;
  /*availableChips: ChipItem[] = [
    {name: 'none', color: undefined},
    {name: 'Primary', color: 'primary'},
    {name: 'Accent', color: 'accent'},
    {name: 'Warn', color: 'warn'}, 
  ]; */
  externalEvents : CalendarEvent[] = [];
  externalFelEvents : CalendarEvent[] = this.externalEvents.filter(evt => {evt.bookname==="Drop-in"});
  externalKontEvents : CalendarEvent[] = this.externalEvents.filter(evt => {evt.bookname==="Kontor"});
  

  @Input() rooms : string[] = [];
  books : string[] = [];
  roomsArrDiffer : any;

  private destroy$ = new Subject<void>();

  constructor(
    public httpService: HttpEventService,
    public tokenStorage: TokenStorageService,
    private authService : AuthService,
    public dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private cd: ChangeDetectorRef,
    public translate: TranslateService,
    private router: Router,
    private actRoute : ActivatedRoute,
    private kvDiffers: KeyValueDiffers,
    private itDiffers: IterableDiffers,
    private modal: NgbModal) {
      translate.addLangs(['gb', 'no']);
      translate.setDefaultLang('no');
    }

    getLocaleFromTranslate(translateLang:string){
      if (translateLang==='gb') {
        return 'en-US'
      } else if (translateLang ==='no') return 'nb-NO';
    }

  ngOnChanges(){}

  ngOnInit(): void {
    this.router.navigate(['felles'],{relativeTo: this.actRoute});  
  }

  tabChange(tabChangeEvt: MatTabChangeEvent){
    if (tabChangeEvt.index==0) {
      this.router.navigate(['felles'],{relativeTo: this.actRoute});
    } else if (tabChangeEvt.index==1){
      this.router.navigate(['kontor'],{relativeTo: this.actRoute});
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}