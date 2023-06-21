import { 
  Component, Inject, Input, Output, OnInit,
  TemplateRef, ViewEncapsulation  } from '@angular/core';
import { WeekViewHourSegment } from 'calendar-utils';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CalendarEvent } from 'calendar-utils';
import { FormControl, UntypedFormBuilder, FormGroup } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Console } from 'console';
import { HttpEventService } from './http-service.service';
import { strictEqual } from 'assert';
import { DateAdapter } from '../../date-adapters/date-adapter';
import { TokenStorageService } from 'projects/demos/app/_services/token-storage.service';
import { AuthService } from 'projects/demos/app/_services/auth.service';


export interface DialogData {
  date: Date;
}

export interface PythEvent {
  id? : number;
  uid : string;
  user_id? : number;
  title?: string;
  paymntref : string;
  bookname : string;
  roomname? : string;
  ou? : string;
  startmills : number;
  endmills : number;
  color : string;
}

export function getColors( event_userId: number, loggedIn_user_id:number) {
  let activated_color: string = event_userId === loggedIn_user_id ? "blue": "red";
  switch(activated_color) {
    case "red": {
      //console.log("getColors() : red")
      return {primary: '#ad2121',secondary: '#FAE3E3' };
      break;
    }
    case "blue" : {
      //console.log("getColors() : blue")
      return {primary: '#1e90ff',secondary: '#D1E8FF'};
      break;
    }
    case "yellow": {
      //console.log("getColors() : yellow")
      return {primary: '#e3bc08',secondary: '#FDF1BA'};
      break;
    }
  }
};

@Component({
  selector: 'mwl-calendar-week-view-hour-segment',
  template: `
    <ng-template
      #defaultTemplate
      let-loggedInUserId="loggedInUserId"
      let-segment="segment"
      let-locale="locale"
      let-isOdd="isOdd"
      let-segmentHeight="segmentHeight"
      let-segmentWidth="segmentWidth"
      let-isTimeLabel="isTimeLabel"
      let-daysInWeek="daysInWeek"
    > 
        <div
          [attr.aria-hidden]="
            {}
              | calendarA11y
                : (daysInWeek === 1
                    ? 'hideDayHourSegment'
                    : 'hideWeekHourSegment')
          "
          class="cal-hour-segment"
          [class.cal-hour-segment-odd]="isOdd"
          [style.height.px]="segmentHeight"
          [style.width.px]="segmentWidth"
          [class.cal-hour-start]="segment.isStart"
          [class.cal-after-hour-start]="!segment.isStart"
          [ngClass]="segment.cssClass"
          (click) = "!isTimeLabel ? openDialog() : null"
        >
          <div class="cal-time" *ngIf="isTimeLabel"
          >
            {{
              segment.displayDate
              | calendarDate
                : (daysInWeek === 1 ? 'dayViewHour' : 'weekViewHour')
                : locale
            }}
          </div>
        </div>
    </ng-template>    
    <ng-template
      [ngTemplateOutlet]="customTemplate || defaultTemplate"
      [ngTemplateOutletContext]="{
        loggedInUserId : loggedInUserId,
        segment: segment,
        locale: locale,
        segmentHeight: segmentHeight,
        isTimeLabel: isTimeLabel,
        daysInWeek: daysInWeek
      }"
    >
    </ng-template>
  `,
})

export class CalendarWeekViewHourSegmentComponent {
  constructor(
    public dialog: MatDialog, 
    private httpService: HttpEventService,
    private authService : AuthService,
    private tokenStorage: TokenStorageService) {}

  @Input() events: CalendarEvent[] = [];
  @Input() externalEvents: CalendarEvent[] = [];  

  @Input() loggedInUserId : number;

  @Input() segment: WeekViewHourSegment;

  @Input() isOdd: boolean;

  @Input() segmentHeight: number;

  @Input() locale: string;

  @Input() isTimeLabel: boolean;

  @Input() books : string[];

  @Input() rooms : string[];

  @Input() segmentWidth: number;

  @Input() daysInWeek: number;

  @Input() customTemplate: TemplateRef<any>;

  pythEvt : PythEvent;
  user_ou : string = 'init ou';


  getDateArray( date ) {
      // Helper to get each elements of Date object as an array
      let _dt = date instanceof Date ? date : new Date( date )

          return [ _dt.getFullYear(), _dt.getMonth(), _dt.getDate(), _dt.getHours(), _dt.getMinutes(), _dt.getSeconds(), _dt.getMilliseconds() ]
  }

  getDateString( date ) {
      // Helper to get Date object as a string of "Y-m-d H:i:s" format
      let _dt = this.getDateArray( date )

      //return _dt[0] +'-'+ (_dt[1] + 1) +'-'+ _dt[2] +' '+ _dt[3] +':'+ _dt[4] +':'+ _dt[5]
      return `${_dt[0]}-${_dt[1] + 1}-${_dt[2]} ${_dt[3]}:${_dt[4]}:${_dt[5]}`
  }

  ngOnInit(){
    this.httpService.clickedEvent.subscribe((clickedEvt) =>{
      this.openDialog();
    });


    this.user_ou = this.tokenStorage.getUser().ou;
    //console.log("HourSegm user_ou: ",this.user_ou)
  }

  isClickedOverEvent(){
    let clickedSegmDate = this.segment.date;
    return this.events.length > 0 && this.events.some( (dbEvent : CalendarEvent) => {
      let clickedSegmEndDate = new Date(this.segment.date);
      //console.log("clickedSEGMDATE",this.segment.date);
      clickedSegmEndDate.setMinutes(clickedSegmDate.getMinutes() + 30);
      //console.log("clickedSegmEndDate",clickedSegmEndDate);
      let isClickedOverEvent = dbEvent.start >= this.segment.date &&
      dbEvent.end <= clickedSegmEndDate;  
      return isClickedOverEvent ; 
      })
  }

  openDialog() {
    var hourContainedEvTitle = "";
    //console.log("segment Date in openDialog(): ",this.segment.date ) ;

      if (!this.isClickedOverEvent()) {
        console.log("calWVhourSegm isClick",this.isClickedOverEvent());
        for (var dbEvt of this.events) {
          let segmStartHour = this.segment.date.getHours();
          console.log ("HS segmStartHour", segmStartHour);
          let modifiedSegmentDate = new Date(this.segment.date);
          let segmStartHourDate = new Date(modifiedSegmentDate.setHours(segmStartHour, 0));
          let segmEndHourDate = new Date(modifiedSegmentDate.setHours(segmStartHour + 1, 0));
          var isDbEventContainedHour =
            dbEvt.start >= segmStartHourDate &&
            dbEvt.end <= segmEndHourDate;
          if (isDbEventContainedHour) {
            hourContainedEvTitle = dbEvt.title;
            //console.log("hourContainedEvtTtl", hourContainedEvTitle);
          }
        }
        const dialogRef = this.dialog.open(EventDialog, {
          data: {
            date: this.segment.date,
            hourContainedBookTitle: hourContainedEvTitle,
            books : this.books
          },
        });

        dialogRef.afterClosed().subscribe({
          next: (result) => {
            if (result) {
              const startmills = this.segment.date.setHours(result.startTime.hour);
              const endmills = this.segment.date.setHours(result.endTime.hour);
              const paymntref = this.externalEvents.at(-1).paymntref;
              const loggedInUser = this.tokenStorage.getUser();
              console.log("WHS result,startmills,endmills",result,startmills,endmills);
              this.httpService.generatePythEvent({
                  user_id :this.loggedInUserId,
                  title : this.tokenStorage.getEventTitle(result.bookname,this.loggedInUserId,[loggedInUser]),
                  paymntref : paymntref,
                  bookname :result.bookname,
                  roomname : result.roomname,
                  ou : this.user_ou,
                  startmills : startmills,
                  endmills: endmills,
                  color: "blue"
                }).subscribe((resp)=>{
                  this.authService.dbUpdateVippsPayment(
                    this.tokenStorage.getUser().id,
                    paymntref,
                    false
                  ).subscribe((resp)=>{
                    this.httpService.addedEvent.emit(null);
                  });
                });
            }
          },
          error : (error) => {
            console.log("afterClosed() error : " + error);
          }
        }
          
        );
      }
  }

}

@Component({
  selector: 'event-dialog',
  templateUrl: 'event-dialog.html',
  styleUrls: ['event-dialog.scss']
})
export class EventDialog {
  constructor( public dialogRef: MatDialogRef<EventDialog>,
     @Inject(MAT_DIALOG_DATA) public data: {
      clickedDbEvt : CalendarEvent, 
      toBeDeleted : boolean,
      toBeDeletedEvt : CalendarEvent,
      date:Date,
      romIndex:number,
      hourContainedBookTitle: string,
      books : string[],
      rooms: string[] },
     public fb: UntypedFormBuilder) {}

    roomname = ""; 
    startTime = { hour: 8, minute: 30};
    endTime = { hour: 10, minute: 30};  
    containedBookTitle = this.data.hourContainedBookTitle;
    books = this.data.books;
    toBeDeleted = this.data.toBeDeleted;

    valgtBookCtrl = this.fb.control("");
    userForm  = this.fb.group({
        valgtBook : this.valgtBookCtrl
      });
      
  

  closeDialog(){
    this.dialogRef.close({
      clickedDbEvt: this.data.clickedDbEvt,
      startTime: this.startTime,
      endTime: this.endTime, 
      bookname : this.valgtBookCtrl.value,
      roomname : this.roomname,
      toBeDeleted : this.data.toBeDeleted, 
      toBeDeletedEvt : this.data.toBeDeletedEvt
      } )
  }
  
  ngOnInit(){} 
  

  onSubmit(){
    //console.log("onSibmit dialod form value: " + JSON.stringify(this.valgtPerCtrl.value) )
  }

}


/* segment.displayDate
              | calendarDate
                : (daysInWeek === 1 ? 'dayViewHour' : 'weekViewHour')
                : locale */
