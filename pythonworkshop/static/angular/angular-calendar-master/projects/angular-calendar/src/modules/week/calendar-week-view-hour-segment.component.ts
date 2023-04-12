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


export interface DialogData {
  date: Date;
}

export interface PythEvent {
  id? : number;
  uid : string;
  userId_id? : number;
  rowname : string;
  title : string;
  ou? : string;
  start : string;
  end : string;
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
      <ng-container *ngIf="isTimeLabel; then hourTemplate else eventTemplate">
      </ng-container>  
    </ng-template>
    <ng-template #hourTemplate>
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
                currentRoom
            }}
          </div>
        </div>
    </ng-template>
    <ng-template #eventTemplate>
        <div #divEventTempl
          [attr.aria-hidden]="
            {}
              | calendarA11y
                : (daysInWeek === 1
                    ? 'hideDayHourSegment'
                    : 'hideWeekHourSegment')
          "
          class="cal-hour-segment"
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
                currentRoom
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
    private tokenStorage: TokenStorageService) {}

  @Input() roomInd : number;

  @Input() loggedInUserId : number;

  @Input() segment: WeekViewHourSegment;

  @Input() isOdd: boolean;

  @Input() segmentHeight: number;

  @Input() locale: string;

  @Input() isTimeLabel: boolean;

  @Input() segmentWidth: number;

  @Input() daysInWeek: number;

  @Input() customTemplate: TemplateRef<any>;

  segmRoomNames : string[]=[''];

  currentRoom : string;
  currentRoomNum : number;

  @Input() set currentRoomIndex ( roomNum : number) {
    //console.log("HourSegmComp segmRoomNames",this.segmRoomNames);
    this.currentRoomNum = roomNum;
    this.currentRoom = this.segmRoomNames[roomNum]
  }


  pythEvt : PythEvent;
  user_ou : string = 'init ou';

  generateUniqueID( digit = 1000 ) {
    return new Date().getTime().toString(16) + Math.floor( digit * Math.random() ).toString(16)
  }

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

  generatePythStartEndDate(dayPeriod : string, roomInd : number){
    let clickDate = new Date(this.segment.date);
    let startDate: number , endDate : number ;
    switch (dayPeriod) {
        case "Formiddag" : {
          startDate = clickDate.setHours(roomInd,0);
          endDate = clickDate.setHours(roomInd,30);
          break;
        }
        case "Ettermiddag" : {
          startDate = clickDate.setHours(roomInd,30);
          console.log("Etterm start hour " + new Date(startDate) );
          endDate = clickDate.setMinutes(new Date(startDate).getMinutes()+30);
          console.log("Etterm end hour " + new Date(endDate));
          break; 
        }
        case "Heldag" : {
          startDate = clickDate.setHours(roomInd,0);
          console.log("Heldag sum roomInd +1 = "+ (roomInd+1).toString())
          endDate = clickDate.setHours(roomInd+1,0);
          break;   
        }
    }
    return { start : startDate.toString(), end : endDate.toString() };
  }

  addEvent(pythEvt : PythEvent) : void {
    this.httpService.insertEvent(pythEvt);
  }

  ngOnInit(){
    this.httpService.clickedEvent.subscribe((clickedEvt) =>{
      this.openDialog();
    });

    this.httpService.roomNamesArr$.subscribe((roomNamesArr)=>{
      this.segmRoomNames = roomNamesArr;
      this.currentRoomIndex = this.currentRoomNum;
      //console.log("HourSegmComp  roomNamesArr$.subscribe:",this.segmRoomNames);
    });

    this.user_ou = this.tokenStorage.getUser().ou;
    console.log("HourSegm user_ou: ",this.user_ou)
  }

  private events : CalendarEvent[] = [];

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
    this.httpService.getEvents().subscribe((response) => {
      if (response.hasOwnProperty('events')){
        this.events = [];
      let responseObj = response as any;
      try {
        for (let pythEvt of responseObj.events) {
          let calEvent: CalendarEvent = {
            id: pythEvt.uid,
            start: new Date(parseInt(pythEvt.start, 10)),
            end: new Date(parseInt(pythEvt.end, 10)),
            title: pythEvt.title,
            color: getColors(pythEvt.userId,this.loggedInUserId)
          }
          this.events.push(calEvent);
        }
      } catch (e){
        // responseObj has no events and is not iterable
      }
      }
    

      if (!this.isClickedOverEvent()) {
        //console.log("calWVhourSegm isClick",this.isClickedOverEvent());
        for (var dbEvt of this.events) {
          let segmStartHour = this.segment.date.getHours();
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
            rooms: this.segmRoomNames,
            romIndex: this.roomInd,
            hourContainedEvTitle: hourContainedEvTitle
          },
        });

        dialogRef.afterClosed().subscribe({
          next: (result) => {
            if (typeof result !== 'undefined') {
              let uniqueId = this.generateUniqueID();
              let startEndDate = this.generatePythStartEndDate(result.dayPeriodVal, this.roomInd);
              //console.log("hourSegment loggedInUserId : " + this.loggedInUserId);
              this.pythEvt =
              {
                uid: uniqueId,
                userId_id: this.loggedInUserId,
                rowname: this.segmRoomNames[this.roomInd],
                title: result.dayPeriodVal,
                ou : this.user_ou,
                start: startEndDate.start,
                end: startEndDate.end,
                color: "blue"
              };
              //console.log("afterClosed() result:", this.pythEvt);
              this.addEvent(this.pythEvt);
            }
          },
          error : (error) => {
            console.log("afterClosed() error : " + error);
          }
        }
          
        );
      }
    });
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
      toBeDeletedPythEvt : PythEvent,
      date:Date,
      romIndex:number,
      hourContainedEvTitle: string,
      rooms: string[] },
     public fb: UntypedFormBuilder) {}

    containedEvTitle = this.data.hourContainedEvTitle;
    toBeDeleted = this.data.toBeDeleted;

    valgtPerCtrl = this.fb.control("");
    userForm  = this.fb.group({
        valgtPer : this.valgtPerCtrl
      });
      
  

  closeDialog(){
    this.dialogRef.close({
      clickedDbEvt: this.data.clickedDbEvt, 
      dayPeriodVal : this.valgtPerCtrl.value, 
      toBeDeleted : this.data.toBeDeleted, 
      toBeDeletedPythEvt : this.data.toBeDeletedPythEvt
      } )
  }
  
  ngOnInit(){} 

  get remPerioder() {
    let perioder = ['Formiddag','Ettermiddag','Heldag'];
    //console.log("containedEvtTitl", this.data.hourContainedEvTitle);
    if (this.containedEvTitle!="") {
      perioder = perioder.filter( (perVal) =>{
        let containedEvtTitle = this.containedEvTitle;
        //console.log("remPerCondition :",perVal != containedEvtTitle && perVal !='Heldag');
           return perVal != containedEvtTitle && perVal !='Heldag';
         })
       return perioder;
    } else {
      return perioder;
    }
    
  }
  

  onSubmit(){
    //console.log("onSibmit dialod form value: " + JSON.stringify(this.valgtPerCtrl.value) )
  }

}


/* segment.displayDate
              | calendarDate
                : (daysInWeek === 1 ? 'dayViewHour' : 'weekViewHour')
                : locale */
