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

import { CustomDateFormatter } from '../custom-date-formatter.provider';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { EventDialog, PythEvent, getColors } from 'projects/angular-calendar/src/modules/week/calendar-week-view-hour-segment.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpResponse } from '@angular/common/http';
import { Router, ActivatedRoute, ParamMap, NavigationEnd  } from '@angular/router';
import { TokenStorageService } from '../_services/token-storage.service';
import { stringify } from 'querystring';
import { isSameDay,isSameMonth} from 'date-fns';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemePalette } from '@angular/material/core';
import { AuthService } from '../_services/auth.service';
import { MatChipSelectionChange } from '@angular/material/chips';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { PythUser } from '../demo-app.component';
import { ChipItem } from '../demo-app.component';

@Component({
  selector: 'mwl-kontor',
  templateUrl: './kontor.component.html',
  styleUrls: ['./kontor.component.scss'],
  changeDetection : ChangeDetectionStrategy.Default,
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter,
    },
  ],
})
export class KontorComponent implements OnInit, OnDestroy{
  @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;

  isMobLayout = false;
  viewDate: Date = new Date();
  view: CalendarView = CalendarView.Week;
  CalendarView = CalendarView;
  daysInWeek = 7;
  dayStartHour=8;
  dayEndHour=18;
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

  private _kontEvents : CalendarEvent[] = []; 
  private _events : CalendarEvent[] = [];
  public get events(){
    return this._events;
  }
  public set events(events : CalendarEvent[]){
    this._events = events;
    this.kontEvents = events;
  }
  
  public get kontEvents(){
    return this._kontEvents;
  }

  public set kontEvents(events: CalendarEvent[]){
    this._kontEvents= events.filter(evt => {
      return evt.bookname==="Kontor"
    })
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
  externalKontEvents : CalendarEvent[] = [];
  previousDayEvents : { 
    start : Date,
    end : Date
  }[] = []

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

  /* ngDoCheck(){
    if (this.roomsArrDiffer){
        const changes = this.roomsArrDiffer.diff(this.rooms);
        if (changes) {
          changes.forEachChangedItem((r) => {
            this.cd.markForCheck();
            console.log("DemoApp changed r item",r);
          });
      }
    }
  } */

  refresh = new Subject<void>(); //used with kitchensink when event input changes

  onSelectionChange(selChangeEvt : MatChipSelectionChange){
    //todo implement chip selection
  }

  deleteEvent(ids : string[],user_id:number){
    this.httpService.deleteEvent(ids,user_id).subscribe((resp)=>{
      if ( resp && resp.hasOwnProperty("events")){
        this.events = [...this.convertDbEvents((resp as any).events)];
      }
    });
  }

  externalDrop(events: CalendarEvent[]) {
    if (events.length>0){
      for (let event of events){
        if (this.externalKontEvents.indexOf(event) === -1) {
          //this.events = this.events.filter((iEvent) => iEvent !== event);
          const extDropEventUid : string =  event.id as string;
          console.log("DA extDrop extDropEventUid",extDropEventUid)
          this.deleteEvent([extDropEventUid],this.tokenStorage.getUser().id);
          if (event.paymntref){
            this.authService.dbUpdateVippsPayment(
              this.tokenStorage.getUser().id,
              event.paymntref,
              false
            ).subscribe((resp)=>{
              const respObj = resp as any;
              this.updateChips(respObj.payments);
            });
          }
        }
      }
    }
  }

  getOverLappingWeekViewEvents(events, top, bottom) {
    return events.filter( (previousEvent) =>{
        var previousEventTop = previousEvent.top;
        var previousEventBottom = previousEvent.top + previousEvent.height;
        if (top < previousEventBottom && bottom > previousEventBottom) {
            return true;
        }
        else if (top < previousEventTop && bottom > previousEventTop) {
            return true;
        }
        else if ( top >= previousEventTop && bottom <= previousEventBottom) {
            console.log("top >= previousEventTop && bottom <= previousEventBottom",true)
            return true;
        }
        return false;
    });
}

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    const externalIndex = this.externalKontEvents.indexOf(event);
    console.log("DAC eventTimesChanged params event, newStart,newEnd",event,newStart,newEnd);
    let dayEvents = this.events.filter((event)=>{
      return event.start.getDay() == newStart.getDay();
    });
    if (externalIndex ==-1){
      for (let evt of dayEvents){
        if(event.id!==evt.id){
          const eventLength = event.end.getTime() - event.start.getTime();
          if (newStart.getTime() >= evt.start.getTime() 
              && newStart.getTime() < evt.end.getTime() ){
              console.log("set new time");
              newStart.setTime(evt.end.getTime());
              newEnd = new Date(newStart.getTime()+eventLength);
          } else if ((newStart.getTime()+eventLength) < evt.end.getTime()
            && (newStart.getTime()+eventLength) > evt.start.getTime()){
              newStart.setTime(evt.start.getTime()-eventLength);
              newStart.getHours()<this.dayStartHour ? newStart.setHours(this.dayStartHour) : null;
              newEnd=new Date(evt.start.getTime()); 
          } else if(newStart.getTime()<evt.start.getTime()
            && (newStart.getTime()+eventLength)>evt.end.getTime()){
              newStart.setTime(evt.start.getTime()-eventLength);
              newStart.getHours()<this.dayStartHour ? newStart.setHours(this.dayStartHour) : null;
              newEnd=new Date(evt.start.getTime()); 
          } else if (newStart.getTime()>evt.start.getTime() 
            && (newStart.getTime()+eventLength)<evt.end.getTime()){
              newStart.setTime(evt.start.getTime()-eventLength);
              newStart.getHours()<this.dayStartHour ? newStart.setHours(this.dayStartHour) : null;
              newEnd=new Date(evt.start.getTime());
            } 
        }
      };
    } else if (externalIndex > -1) { // if event is dropped from chips to calendar
      event.start = newStart;
      const newDateStartObj = new Date(event.start);
      event.end = new Date(newDateStartObj.setHours(event.start.getHours()+1));
    
      for (let evt of dayEvents){
        if(event.id!==evt.id){
          const eventLength = event.end.getTime() - event.start.getTime();
          if (newStart.getTime() >= evt.start.getTime() 
              && newStart.getTime() < evt.end.getTime() ){
              console.log("set new time");
              newStart.setTime(evt.end.getTime());
              newEnd = new Date(newStart.getTime()+eventLength);
          } else if ((newStart.getTime()+eventLength) < evt.end.getTime()
            && (newStart.getTime()+eventLength) > evt.start.getTime()){
              newStart.setTime(evt.start.getTime()-eventLength);
              newStart.getHours()<this.dayStartHour ? newStart.setHours(this.dayStartHour) : null;
              newEnd=new Date(evt.start.getTime()); 
          } else if(newStart.getTime()<evt.start.getTime()
            && (newStart.getTime()+eventLength)>evt.end.getTime()){
              newStart.setTime(evt.start.getTime()-eventLength);
              newStart.getHours()<this.dayStartHour ? newStart.setHours(this.dayStartHour) : null;
              newEnd=new Date(evt.start.getTime()); 
          } else if (newStart.getTime()>evt.start.getTime() 
          && (newStart.getTime()+eventLength)<evt.end.getTime()){
            newStart.getHours()<this.dayStartHour ? newStart.setHours(this.dayStartHour) : null;
            newStart.setTime(evt.start.getTime()-eventLength);
            newEnd=new Date(evt.start.getTime());
          } 
        }
      };
      
      this.authService.dbUpdateVippsPayment(
        this.tokenStorage.getUser().id,
        this.externalKontEvents[externalIndex].paymntref,
        true)
      .subscribe((resp)=>{
        console.log("DA bookname",this.externalKontEvents[externalIndex].bookname);
        this.httpService.generatePythEvent({
          user_id :this.tokenStorage.getUser().id,
          title: this.tokenStorage.getEventTitle(
            this.externalKontEvents[externalIndex].bookname,event.userId,this.users),
          paymntref : event.paymntref,
          bookname : this.externalKontEvents[externalIndex].bookname,
          roomname : "",
          startmills : event.start.getTime(),
          endmills: event.end.getTime(),
          ou : this.tokenStorage.getUser().ou,
          color: "blue",
          }).subscribe((resp)=>{
            if(resp){
              this.events=[...this.convertDbEvents((resp as any).events)];
              this.updateChips((resp as any).payments);
            }
          });
      });
    }
    
    if (newEnd && externalIndex ==-1) {   // if event is res/dragged
      //console.log("DA event modified")
      event.end = newEnd;
      if(newStart){
        event.start=newStart;
      }
      //console.log("DA event modified endmills",event.end.getTime());
      this.events = [...this.events.map((iEvent) => {
        if (iEvent === event) {
          return {
            ...event,
            start: newStart,
            end: newEnd,
          };
        }
        return iEvent;
      })]; 
      this.httpService.updatePythEvent(event.id as string,this.tokenStorage.getUser().id,event.start.getTime(),
        event.end.getTime(),event.roomname).subscribe((resp)=>{
          if(resp){
            //this.events=this.convertDbEvents((resp as any).events);
          }
        });

       
    }

    if (this.view === 'month') {
      this.viewDate = newStart;
      this.activeDayIsOpen = true;
    }

    //console.log("DAC event changed",event);
    //this.events=[...this.events]
  }

  updateChips(resp: any){
    if (resp && resp!=="access token expired"){
      this.externalKontEvents = [];
      const paymnts = resp;
      //console.log("DA updateChips paymnts",paymnts)
      for (let paymnt of paymnts ){
        if(paymnt.is_consumed===false && paymnt.bookname==="Kontor"){
            const start = new Date(new Date().setHours(8));
            //console.log("HC paymnt amount slice : ",paymnt.amount.slice(0,-2));
            //console.log("DA updateChipps paymnt.reference",paymnt.reference);
          let extEvent : CalendarEvent = {
            userId: this.tokenStorage.getUser().id,
            title : paymnt.amount.slice(0,-2) + "kr " + paymnt.bookname,
            paymntref : paymnt.reference,
            bookname : paymnt.bookname,
            color : {primary: '#ad2121',secondary: '#FAE3E3' },
            start : start,
            draggable : true
          }
          this.externalKontEvents.push(extEvent);
        }
        
      }
      this.externalKontEvents = [...this.externalKontEvents];
      //console.log("DA updateChips extEvents",this.externalKontEvents);
    }
  }

  ngOnInit() {
    this.loginStateSubscription = this.tokenStorage.combAuthProtected$
      .pipe(distinctUntilChanged())
      .subscribe( (authProtState : boolean)=>{
        if(authProtState){
          const currentUsr = this.tokenStorage.getUser();
          const vipps_sub = currentUsr.vipps_sub;
          this.authService.dbGetVippsPayments(currentUsr.id).subscribe((resp)=>{
            //console.log(" DA getVippsPaymnts",resp);
            if(resp){
              this.updateChips((resp as any).payments);
            }
          });
        }
      });

    this.getDbUsers();
    this.subscribeToInsertDelEvt();
    
    const CALENDAR_RESPONSIVE = {
      small: {
        breakpoint: '(max-width: 576px)',
        daysInWeek: 2,
        isMobile : false
      },
      medium: {
        breakpoint: '(max-width: 768px)',
        daysInWeek: 3,
        isMobile : false
      },
      large: {
        breakpoint: '(max-width: 960px)',
        daysInWeek: 5,
        isMobile : false
      },
    };

    this.breakpointObserver
      .observe(
        Object.values(CALENDAR_RESPONSIVE).map(({ breakpoint }) => breakpoint)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: BreakpointState) => {
        const foundBreakpoint = Object.values(CALENDAR_RESPONSIVE).find(
          ({ breakpoint }) => !!state.breakpoints[breakpoint]
        );
        //this.isMobLayout = false;
        if (foundBreakpoint) {
          this.daysInWeek = foundBreakpoint.daysInWeek;
          //this.isMobLayout = foundBreakpoint.isMobile;
          //console.log("is Mob Layout",foundBreakpoint.isMobile);
        } else {
          this.daysInWeek = 7;
          //console.log("between Mob Layout state",foundBreakpoint.isMobile)
        }
        this.cd.markForCheck();
      }); 
  }

  tabChange(tabChangeEvt: MatTabChangeEvent){
    if (tabChangeEvt.index==0){
      this.unSubscribeToInsertDelEvt();
    }
  }

  getDbUsers(){
    this.httpService.getUsers().subscribe(
      {
          next: (response) => {
            if(response.hasOwnProperty('users') && response.hasOwnProperty('events') 
              && response.hasOwnProperty('books') && response.hasOwnProperty('rooms')) {
              let storageUsrObj = this.tokenStorage.getUser();
              this.loggedInUserId = storageUsrObj.id;
              //console.log("getDBUsers()  storageUsrObj.user_email", storageUsrObj.user_email);
            
              let respObj  = response as any ;
              for (let pythUser of respObj.users){
                this.users.push(pythUser);
              }
              this.users = [...this.users];
              const pythEvts = respObj.events;
              this.events = [...this.convertDbEvents(pythEvts)];
              const bookRows = typeof respObj.books !== 'undefined'? Object.values(respObj.books):[];
              const bookTitles = bookRows.map( (tablerow : {'row':string,'title':string}) => {
                  return tablerow.title;
              });
              const kontTitle = bookTitles.filter((title)=> title==='Kontor');
              //console.log("DemoApp  roomNamesArr$.subscribe typeof roomNamesArr:", roomNamesArr);
              this.books = [...kontTitle];
              this.httpService.booksArr$.next(bookTitles);
              let roomRows = typeof respObj.rooms !== 'undefined'? Object.values(respObj.rooms):[];
              let roomTitles = roomRows.map( (tablerow : {'row':string,'title':string}) => {
                return tablerow.title
              }) 
              this.rooms = [...roomTitles];
              this.httpService.roomsArr$.next(roomTitles);
              //console.log("getDBUsers() this.users",this.users)
            } else if (response === "access token expired") {
              //console.log("getDbUsers() string response msg:",response);
              this.tokenStorage.signOut("access token expired");
            }
            
          },
          //complete: () => this.getDbEvents()
      })
  }

  convertDbEvents(pythEvts: PythEvent[]){
    let calEvts : CalendarEvent[]=[];
    if (pythEvts){
      for (let pythEvt of  pythEvts){
        let calEvent : CalendarEvent=  {
            id : pythEvt.uid,
            userId : pythEvt.user_id,
            paymntref : pythEvt.paymntref,
            bookname : pythEvt.bookname,
            roomname : pythEvt.roomname,
            start : new Date(pythEvt.startmills),
            end : new Date(pythEvt.endmills),
            title : this.tokenStorage.getEventTitle(pythEvt.bookname,pythEvt.user_id,this.users),
            ou: pythEvt.ou,
            color : getColors(pythEvt.user_id,this.tokenStorage.getUser().id),
            draggable : true,
            resizable: {
              beforeStart: true, // this allows you to configure the sides the event is resizable from
              afterEnd: true,
            }
          }
        calEvts.push(calEvent);  
      }
    } 
    
    return calEvts;
  }

  subscribeToInsertDelEvt() {
    this.httpService.modifiedEvent.subscribe((resp: any) => { 
      if (resp.hasOwnProperty("uids")){
        const uids : string[]= resp.uids;
        console.log("events",this.events);
        console.log("Uids ",uids.map(uid=>this.events[uid]) )
        let toBeDelCalEvents : CalendarEvent[]= [];
        for (let uid of uids){
          for (let event of this.events){
            if(event.id === uid){
              toBeDelCalEvents.push(event);
            }
          }
        }
        this.externalDrop(toBeDelCalEvents);
      }
    });
    this.httpService.modifiedPaymnt.subscribe((resp)=>{
      if ( resp.hasOwnProperty("payments") && resp.hasOwnProperty("events")){
        this.events = [...this.convertDbEvents(resp.events)];
        this.updateChips(resp.payments);
      }
    })
  }

  unSubscribeToInsertDelEvt(){
    this.httpService.modifiedEvent.unsubscribe();
    this.httpService.modifiedEvent.unsubscribe();
  }

  openDialog(clickedWeekViewEvent : {
    event: CalendarEvent;
    sourceEvent: MouseEvent | KeyboardEvent;}) {
    console.log("kontor openDialog event user.id",clickedWeekViewEvent.event,this.tokenStorage.getUser().id );
    if (clickedWeekViewEvent.event.userId===this.tokenStorage.getUser().id 
          || (this.tokenStorage.getUser().ou!=="init ou" && this.tokenStorage.getUser().ou===clickedWeekViewEvent.event.ou)
          || this.tokenStorage.getUser().is_admin) {
          var hourContainedEvTitle = "";
          let clickedPythEvtStart = clickedWeekViewEvent.event.start.getTime();
          //console.log("clickedWeekViewEvent.event.start",clickedWeekViewEvent.event.start)
          for (let evt of this.events) {
            if ( evt.start.getTime() == clickedPythEvtStart ){
              this.toBeDeletedEvt = evt;
              //console.log("this.toBeDeletedPythEvt",this.toBeDeletedPythEvt)
            }
            
          }

          const dialogRef = this.dialog.open(EventDialog, {
            data: {
              startDate : this.toBeDeletedEvt.start,
              endDate : this.toBeDeletedEvt.end,
              toBeDeleted : true,
              toBeDeletedEvt : this.toBeDeletedEvt,
              books: this.books
            },
          });
          dialogRef.afterClosed().subscribe({
            next: (result) => {
              if (typeof result !== 'undefined') {
                this.externalDrop([this.toBeDeletedEvt]);
                //console.log("result object",result)
                //this.deleteEvent([result.toBeDeletedEvt.id],this.tokenStorage.getUser().id)  // event.id is pythEvt.uid
              }
            },
            error: (error) => {
              console.log("afterClosed() error : " + error);
            }
          }
          );
        }
  }

  activeDayIsOpen: boolean = false;

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
      console.log("DemoAppC activeDayIsOpen",this.activeDayIsOpen)
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
