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
import { EventDialog, PythEvent, getColors } from 'projects/angular-calendar/src/modules/week/calendar-week-view-hour-segment.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpResponse } from '@angular/common/http';
import { Router, ActivatedRoute, ParamMap, NavigationEnd  } from '@angular/router';
import { TokenStorageService } from './_services/token-storage.service';
import { stringify } from 'querystring';
import { isSameDay,isSameMonth} from 'date-fns';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemePalette } from '@angular/material/core';
import { AuthService } from './_services/auth.service';
import { MatChipSelectionChange } from '@angular/material/chips';

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

  events : CalendarEvent[] = [];
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

  eventDropped({      //unused
    event,
    newStart,
    newEnd,
    allDay,
  }: CalendarEventTimesChangedEvent): void {
    const externalIndex = this.externalEvents.indexOf(event);
    if (typeof allDay !== 'undefined') {
      event.allDay = allDay;
    }
    if (externalIndex > -1) {
      this.externalEvents.splice(externalIndex, 1);
      this.events.push(event);
    }
    event.start = newStart;
    if (newEnd) {
      event.end = newEnd;
    }
    if (this.view === 'month') {
      this.viewDate = newStart;
      this.activeDayIsOpen = true;
    }

    const genNewEndDateMills = event.start.setHours(event.start.getHours()+1)
    this.httpService.generatePythEvent({
        user_id :this.tokenStorage.getUser().id,
        bookname : "Drop-in",
        roomname : "initroom",
        startmills : event.start.getTime(),
        endmills: genNewEndDateMills,
        ou : this.tokenStorage.getUser().ou,
        color: "blue"
    });
  } 

  externalDrop(event: CalendarEvent) {
    if (this.externalEvents.indexOf(event) === -1) {
      //this.events = this.events.filter((iEvent) => iEvent !== event);
      const extDropEventUid : string =  event.id as string;
      console.log("DA extDrop extDropEventUid",extDropEventUid)
      this.deleteEvent([extDropEventUid])
      if (event.paymntref){
        this.authService.dbUpdateVippsPayment(
          this.tokenStorage.getUser().id,
          event.paymntref,
          false
        ).subscribe((resp)=>{
          this.updateChips(resp);
        })
      }
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    const externalIndex = this.externalEvents.indexOf(event);
    console.log("DAC eventTimesChanged params externalindex,event,newStart,newEnd",
    externalIndex,event,newStart,newEnd)
    if (externalIndex > -1 && event.paymntref) {
      this.authService.dbUpdateVippsPayment(
        this.tokenStorage.getUser().id,
        this.externalEvents[externalIndex].paymntref,
        true)
      .subscribe((resp)=>{
        this.updateChips(resp);
      })
      //this.externalEvents.splice(externalIndex, 1);
      
      this.events.push(event);
    } else if (event.paymntref){
      this.authService.dbUpdateVippsPayment(
        this.tokenStorage.getUser().id,
        event.paymntref,
        false
      ).subscribe((resp)=>{
        this.updateChips(resp);
      })
    }
    event.start = newStart;
    if (newEnd) {
      event.end = newEnd;
    } else {
      const newDateStartObj = new Date(event.start);
      event.end = new Date(newDateStartObj.setHours(event.start.getHours()+1))
    }
    if (this.view === 'month') {
      this.viewDate = newStart;
      this.activeDayIsOpen = true;
    }
    //console.log("DAC event changed",event);

    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        this.httpService.generatePythEvent({
        user_id :this.tokenStorage.getUser().id,
        bookname : "Drop-in",
        roomname : "",
        startmills : event.start.getTime(),
        endmills: event.end.getTime(),
        ou : this.tokenStorage.getUser().ou,
        color: "blue"
        });
        return {
          ...event,
          start: newStart,
          end: newEnd ? newEnd : event.end,
        };
      }
      return iEvent;
    });
    this.events = [...this.events];
  }

  updateChips(resp: any){
    if (resp && resp!=="access token expired"){
      this.externalEvents = [];
      const respObj = resp as any;
      const paymnts = respObj.vipps_sub_paymnts;
      //console.log("DA updateChips paymnts",paymnts)
      for (let paymnt of paymnts ){
        if(!paymnt.is_consumed){
            console.log("HC paymnt amount slice : ",paymnt.amount.slice(0,-2));
          //console.log("DA updateChipps paymnt.reference",paymnt.reference);
          let extEvent : CalendarEvent = {
            title : paymnt.amount.slice(0,-2) + "kr " + paymnt.bookname,
            paymntref : paymnt.reference,
            color : {primary: '#ad2121',secondary: '#FAE3E3' },
            start : new Date(),
            draggable : true
          }
          this.externalEvents.push(extEvent);
        }
        
      }
      this.externalEvents = [...this.externalEvents];
      //console.log("DA updateChips extEvents",this.externalEvents);
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
            console.log(" DA getVippsPaymnts",resp);
            this.updateChips(resp);
          });
        }
      });

    this.httpService.getBooks().subscribe(result=>{
      if( typeof result !=='undefined'){
        let booksArr = result as any;
        let booksArrVals = typeof booksArr.books !== 'undefined'? Object.values(booksArr.books):[];
        let books = booksArrVals.map( (tablerow : {'row':string,'title':string}) => {
        return tablerow.title
      })
      //console.log("DemoApp  getRooms().subscribe typeof roomNames:", roomNames);
      this.httpService.booksArr$.next(books);
      } 
      
    })
    this.httpService.booksArr$.subscribe((booksArr)=>{
      //console.log("DemoApp  roomNamesArr$.subscribe typeof roomNamesArr:", roomNamesArr);
      this.books = booksArr;
    });

    this.httpService.getRooms().subscribe(result=>{
      if( typeof result !=='undefined'){
        let roomsArr = result as any;
        let roomsArrVals = typeof roomsArr.rooms !== 'undefined'? Object.values(roomsArr.rooms):[];
        let roomNames = roomsArrVals.map( (tablerow : {'row':string,'title':string}) => {
        return tablerow.title
      })
      //console.log("DemoApp  getRooms().subscribe typeof roomNames:", roomNames);
      this.httpService.roomsArr$.next(roomNames);
      } 
      
    })
    this.httpService.roomsArr$.subscribe((roomNamesArr)=>{
      //console.log("DemoApp  roomNamesArr$.subscribe typeof roomNamesArr:", roomNamesArr);
      this.rooms = roomNamesArr;
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

  getDbUsers(){
    this.httpService.getUsers().subscribe(
      {
          next: (response) => {
            if(response.hasOwnProperty('users')) {
              let storageUsrObj = this.tokenStorage.getUser();
              this.loggedInUserId = storageUsrObj.id;
              //console.log("getDBUsers()  storageUsrObj.user_email", storageUsrObj.user_email);
            
              let respObj  = response as any ;
              for (let pythUser of respObj.users){
                this.users.push(pythUser);
              }
              this.users = [...this.users];
              //console.log("getDBUsers() this.users",this.users)
            } else if (response === "access token expired") {
              //console.log("getDbUsers() string response msg:",response);
              this.tokenStorage.signOut("access token expired");
            }
            
          },
          complete: () => this.getDbEvents()
      })
  }

  getEventTitle(pythEv : PythEvent){
      let eventUser =  this.users.filter((user)=> {
        //console.log("DA getEventTitle() pythEv.bookname , user.id ,pythEv.user_id",pythEv.bookname,user.id , pythEv.user_id);
        return user.id == pythEv.user_id
      });
      
      let ouname = pythEv.ou==="init ou" ? "" : pythEv.ou;
      let userEmail = typeof eventUser[0]=='undefined' ? '' : eventUser[0].user_email;
      //console.log("DA userEmail",userEmail);
      if ( this.tokenStorage.getUser().is_admin || this.tokenStorage.getUser().id==pythEv.user_id){
        return `${pythEv.bookname}<br>${userEmail}`;
      } else {
        return `${pythEv.bookname}<br>${ouname}`;
      }
    
  }

  getDbEvents(){
    this.httpService.getEvents().subscribe((response ) => {
      //console.log("getDbEvents() Response: ",response);
      //console.log("getDbEvents() Response type: "+ typeof response);
      if(response.hasOwnProperty('events')) {
        this.events = [];
        let item = response['events'];
        let respObj  =  response as any;
        for (let pythEvt of  respObj.events){
          let calEvent : CalendarEvent=  {
              id : pythEvt.uid,
              userId : pythEvt.userId,
              paymntref : pythEvt.paymntref,
              bookname : pythEvt.bookname,
              roomname : pythEvt.roomname,
              start : new Date(pythEvt.startmills),
              end : new Date(pythEvt.endmills),
              title : this.getEventTitle(pythEvt),
              ou: pythEvt.ou,
              color : getColors(pythEvt.userId,this.tokenStorage.getUser().id),
              draggable : true,
              resizable: {
                beforeStart: true, // this allows you to configure the sides the event is resizable from
                afterEnd: true,
              }
            }
          this.events.push(calEvent);
          
        }
        this.events = [...this.events];
        //console.log("getDbEvents() Follows events : ", this.events);  
        //console.log(this.events);
      } else {
        //console.log("getDbEvents() string response msg:",response);
        this.tokenStorage.signOut();
      }
  })
  }

  subscribeToInsertDelEvt() {
    this.httpService.addedEvent.subscribe((emitedValue: any) => { 
        this.getDbEvents();
    })
    this.httpService.deletedEvent.subscribe((emitedValue: any) => { 
      this.getDbEvents();
  })
  }

  deleteEvent(ids : string[]){
    this.httpService.deleteEvent(ids);
  }

  openDialog(clickedWeekViewEvent : {
    event: CalendarEvent;
    sourceEvent: MouseEvent | KeyboardEvent;}) {
    console.log("demo-app openDialog userId id",clickedWeekViewEvent.event.userId,this.tokenStorage.getUser().id );
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
              toBeDeleted : true,
              toBeDeletedPythEvt : this.toBeDeletedEvt
            },
          });
          dialogRef.afterClosed().subscribe({
            next: (result) => {
              if (typeof result !== 'undefined') {
                //console.log("result object",result)
                this.deleteEvent([result.toBeDeletedEvt.id]);  // event.id is pythEvt.uid
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