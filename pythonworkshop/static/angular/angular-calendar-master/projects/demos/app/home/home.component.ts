import { Component, ViewChild, OnInit , Inject, OnDestroy} from '@angular/core';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { PythUser } from '../demo-app.component';
import { TokenStorageService } from '../_services/token-storage.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { delay, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, UntypedFormArray, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { PythEvent } from 'projects/angular-calendar/src/modules/week/calendar-week-view-hour-segment.component';
import { MatTableDataSource} from '@angular/material/table';
import { CalendarEvent } from 'calendar-utils';
import { DataSource } from '@angular/cdk/collections';
import { Observable, ReplaySubject, BehaviorSubject} from 'rxjs';
import { DatePipe} from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslateService } from '@ngx-translate/core';

export interface Room {
  row: string,
  title: string
}

@UntilDestroy()
@Component({
  selector: 'app-root',
  styleUrls: ['./home.component.scss'],
  templateUrl : './home.component.html'
  
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;

  constructor( 
    private observer: BreakpointObserver,
    public tokenStorage: TokenStorageService,
    private router: Router,
    private actRoute: ActivatedRoute,
    public dialog: MatDialog,
    private httpService: HttpEventService,
    public translate: TranslateService) {
      translate.addLangs(['gb', 'no']);
      translate.setDefaultLang('gb');
    }

  switchLang(lang: string) {
    this.translate.use(lang);
  } 

  isCalendarActive$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  loginStateSubscription: Subscription = new Subscription();
  breakPointObsSubscr : Subscription = new Subscription();
  roomNamesArr : string[] = [];
  toDelPythEvts : PythEvent[] = [];


  ngOnInit(): void {
    this.router.events.subscribe({
      next : (routerEvent)=>{
        if (routerEvent instanceof NavigationEnd){
          const titleVal = routerEvent.url;
          titleVal === "/calendar" ? this.isCalendarActive$.next(true)  : this.isCalendarActive$.next(false);
          console.log("HC ngOnInit actRoute.title value: ",routerEvent.url)
        }
      },
      error: (err) => {
        console.log("HC ngOnInit actRoute.title.subscribe error",err.error.message)
      }
    })

    this.httpService.roomNamesArr$.subscribe((roomNamesArr)=>{
      this.roomNamesArr= roomNamesArr;
      //console.log("HomeComp ngOnInit() roomNamesArr",this.roomNamesArr);
    })
  }

  getUserRole(){
    return this.tokenStorage.getUser().is_admin ? "admin" : "user";
  }

  ngAfterViewInit() {
    this.loginStateSubscription = this.tokenStorage.authenticated$.subscribe( (loginState : boolean)=>{
          this.breakPointObsSubscr = this.observer
          .observe(['(max-width: 800px)'])
          .pipe(delay(1), untilDestroyed(this))
          .subscribe((res) => {
              if (!loginState) {
                this.sidenav.mode = 'over';
                this.sidenav.close();
              } else if(!res.matches && loginState) {
                this.sidenav.mode = 'side';
                this.sidenav.open();
              } else if(res.matches && loginState) {
                this.sidenav.mode = 'over';
                this.sidenav.close();
              }
          });
  
          this.router.events
          .pipe(
            untilDestroyed(this),
            filter((e) => e instanceof NavigationEnd)
          )
          .subscribe(() => {
            if (this.sidenav.mode === 'over') {
              this.sidenav.close();
            }
          });

      });
  } 

  logout(): void {
    this.tokenStorage.signOut();
  }

  delEvents(eventIds : number[]){
    this.httpService.deleteEvent(eventIds);
  }

  editEvents(){
    if (this.isCalendarActive$.value){
    console.log("HomeC editEvents() this.roomNamesArr: ",this.roomNamesArr)
    if (this.isCalendarActive$){
      const dialogRef = this.dialog.open(EditEventsDialog, {
        data: {
          rooms: this.roomNamesArr
        },
      });
  
      dialogRef.afterClosed().subscribe({
        next: (obj) => {
          if (typeof obj!=='undefined' && typeof obj.selectedRowsIds !== 'undefined') {
            this.delEvents(obj.selectedRowsIds);
            //console.log("HomeComp to delete ids",obj.selectedRowsIds)
          }
        },
        error: (error) => {
          console.log("editEvents() afterClosed() error : " + error);
        }
      }
      );
    }
  }
    
  }

  editRooms(){
    if (this.isCalendarActive$.value){
      const dialogRef = this.dialog.open(EditRoomsDialog, {
        data: {
          rooms: this.roomNamesArr
        },
      });
  
      dialogRef.afterClosed().subscribe(
        (obj) => {
          if (typeof obj !== 'undefined' && typeof obj.toEditRooms !== 'undefined') {
            console.log("HomeComp dial afterClosed() obj.toEditRooms",obj.toEditRooms);
            let roomTitles: string[] = obj.toEditRooms;
            this.httpService.updateRooms(roomTitles);
          } else if(typeof obj == 'undefined'){
            console.log("HomeC dial afterClosed obj is undefined")
          }
        },
        (error) => {
          console.log("HomeComp editRooms() afterClosed() error : " + error);
        }
      );
  
      dialogRef.backdropClick().subscribe((mouseEvent)=>{
        let roomTitles: string[] = this.httpService.roomNamesArr$.getValue()
        console.log("HomeC editRooms() backdropClick() roomTitles:",roomTitles)
      })
    }
    
  }

  ngOnDestroy(){
    this.breakPointObsSubscr.unsubscribe();
    this.loginStateSubscription.unsubscribe();
  }
}

export interface TableRow {
  id : number;
  user_email: string;
  rom: string;
  start: Date;
  end : Date;
  title: string;
}
const ELEMENT_DATA: TableRow[] = [];

@Component({
  selector: 'edit-events-dialog',
  templateUrl: 'edit.events.html',
  styleUrls: ['./home.component.scss']
})

export class EditEventsDialog {
  constructor( public dialogRef: MatDialogRef<EditEventsDialog>,
      @Inject(MAT_DIALOG_DATA) public data: {
        rooms : string[]},
        private httpService: HttpEventService,
        private tokenStorage: TokenStorageService,) {
        }


  rooms : string[]= this.data.rooms;
  users : PythUser[] = [];
  events : CalendarEvent[] = [];
  pythEvents : PythEvent[] = [];
  tableRows : TableRow[] = [];
  datepipe : DatePipe = new DatePipe('en-US');
  currentDate = new Date();


  range = new UntypedFormGroup({
    start: new UntypedFormControl(null),
    end: new UntypedFormControl(null),
  });

  selectedRooms = new UntypedFormControl('alle rom');

  displayedColumns: string[] = ['select','user_email','start','title'];
  dataToDisplay = [...ELEMENT_DATA];
  dataSourceEx = new ExampleDataSource(this.dataToDisplay);
  selection = new SelectionModel<TableRow>(true, []);

  ngOnInit(){
    this.getDbUsers();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.tableRows.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.tableRows);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: TableRow): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
  }
  

  /* removeData() {
    this.dataToDisplay = this.dataToDisplay.slice(0, -1);
    this.dataSourceEx.setData(this.dataToDisplay);
  } */

  getDbUsers(){
    this.httpService.getUsers().subscribe({
        next : (response) => {
          if(response.hasOwnProperty('users')) {
            let storageUsrObj = this.tokenStorage.getUser();
            //console.log("getDBUsers()  storageUsrObj.user_email", storageUsrObj.user_email);
          
            let respObj  = response as any ;
            for (let pythUser of respObj.users){
              this.users.push(pythUser);
            }
            this.users = [...this.users];
            //console.log("getDBUsers() this.users",this.users)
          } else {
            console.log("getDbUsers() string response msg:",response);
          }
          
        },
        complete : () => {
          this.getDbEvents();
        }
    })
  }

  getDbEvents(){
    this.httpService.getEvents().subscribe({
      next: (response)=>{
      if(response.hasOwnProperty('events')) {
        this.events = [];
        let respObj  =  response as any;
        for (let objEvt of  respObj.events){
          let tableRow : TableRow=  {
              id : objEvt.id,
              user_email : this.users.filter((user)=>objEvt.userId==user.id)[0].user_email,
              rom : objEvt.rowname,
              start : new Date(parseInt(objEvt.start,10)),
              end : new Date(parseInt(objEvt.end,10)),
              title : String(objEvt.title).substring(0,3),
            }
          this.tableRows.push(tableRow);
          //console.log("HomeComp tableRow.user_email ",this.users.filter((user)=>objEvt.userId==user.id)[0].user_email);
          let calEvent : CalendarEvent=  {
            title : objEvt.title,
            userId : objEvt.userId,
            start : new Date(parseInt(objEvt.start,10)),
            end : new Date(parseInt(objEvt.end,10)),
          }
          this.events.push(calEvent);
        }
        this.tableRows = [...this.tableRows];
        this.dataSourceEx.setData(this.tableRows);
        console.log("getDbEvents() tableRows : ",this.tableRows);  
        //console.log(this.events);
        } else {
          console.log("getDbEvents() string response msg:",response);
          
        }
      },
      complete: () => {
        this.subscribeToRangeChange();
        this.subscribeToSelectChange();
      }
    })   
  }

  rangeFilteredRows : TableRow[] = [];

  subscribeToRangeChange(){
    this.range.valueChanges.subscribe({
      next: (range)=>{
        if(range.start!==null && range.end!==null){
        range.end=new Date(range.end.setHours(23,59,59,999));
        //console.log("HomeComp rangeValue",res);
        this.rangeFilteredRows= [];
        for (let row of this.tableRows){
          if(typeof row.start!=='undefined' 
          && range.start<=row.start && row.start<=range.end){
            this.rangeFilteredRows.push(row);
            //console.log("HomeComp rangeValue in loop",range);
          }
        }
        
        this.dataSourceEx.setData(this.rangeFilteredRows);
        }
      },
      complete : () =>{
        
      }
    })
  }

  selectFilteredRows : TableRow[] = [];

  subscribeToSelectChange(){
    this.selectedRooms.valueChanges.subscribe((value)=>{
      this.selectFilteredRows= [];
      console.log("HomeC subscribeToSelectChange() selected value: ",value);
      for (let row of this.tableRows){
        if ( row.rom===value){
          this.selectFilteredRows.push(row);
          console.log("HomeComp filterValue in loop",value);
        }
      }
      
      const newArr = this.rangeFilteredRows.filter(rangeFilteredRow=>{
        return rangeFilteredRow.rom === value;
      })
      console.log("HomeC subscribeToSelectChange() newArr: ",newArr);
      this.dataSourceEx.setData(newArr);
    })
  }

  closeDialog(){
  }
  

  onSubmit(){
    //console.log(" Close dial selection.selected",this.selection.selected);
    //console.log("Close dial selection.selected.map",this.selection.selected.map(row=>row.id));
    this.dialogRef.close({
      selectedRowsIds: this.selection.selected.map(row=>row.id),
      } )
  }

}

class ExampleDataSource extends DataSource<TableRow> {
  private _dataStream = new ReplaySubject<TableRow[]>();

  constructor(initialData: TableRow[]) {
    super();
    this.setData(initialData);
  }


  connect(): Observable<TableRow[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: TableRow[]) {
    this._dataStream.next(data);
  }
}

export interface MarkedRoomToDel{
  idx: number,
  markedToDel : boolean
} 

@Component({
  selector: 'edit-rooms-dialog',
  templateUrl: 'edit.rooms.html',
  styleUrls: ['./home.component.scss']
})

export class EditRoomsDialog implements OnInit{
  constructor( public dialogRef: MatDialogRef<EditRoomsDialog>,
      @Inject(MAT_DIALOG_DATA) public data: {
        rooms : string[] },
        private httpService: HttpEventService,
        private tokenStorage: TokenStorageService,
        public fb: UntypedFormBuilder) {
        }

  rooms : string[] = this.data.rooms;
  users : PythUser[] = [];
  events : CalendarEvent[] = [];
  pythEvents : PythEvent[] = [];
  markedRoomsToDel : MarkedRoomToDel[]=[];
  objErrValStr = '';

  roomsFormGroup = this.fb.group({
    roomsArr : this.fb.array([])
  });

  isRoomDuplicate ( atIdxAbsCtrl: AbstractControl, contrIdx: number ): ValidatorFn {
    return ( atIdxAbsCtrl ): Record<string, any> | null => {
      let names: string[] = this.roomsArr.value;
  
      //console.log("HomeC isRoomDuplicate() names: ",names);
      const isDuplicate= names?.filter((el,index)=> {
        //console.log("HomeC isRoomDuplicate() contrIdx , names.indexOf(el) , el, atIdxAbsCtrl.value : ",
        //contrIdx, index , el , atIdxAbsCtrl.value);
        return contrIdx!= index && el === atIdxAbsCtrl.value;
      })?.length>=1;

        
        const isUnique = isDuplicate ? "must be unique" : "";  
        const minLength = atIdxAbsCtrl.value.length < 3 ? "must be at least 3 characters" : "";
        const errorObj =  { error : isUnique+minLength };
        console.log("HomeC isRoomDuplicate() isRoomDuplicate().error:",errorObj.error)
        
      return errorObj.error.length>0 ? errorObj: null;
    }
  }

  updateValidators(){
    for (let roomInd =0; roomInd < this.roomsArr.length; roomInd++){
      this.roomsArr.at(roomInd).setValidators([this.isRoomDuplicate(this.roomsArr.at(roomInd),roomInd)])
    }
  }

  ngOnInit(): void {
    for (let roomInd =0; roomInd < this.rooms.length; roomInd++){
      this.roomsArr.push(this.fb.control(this.rooms[roomInd]));
    }
    this.updateValidators();
    for (let roomInd =0; roomInd < this.roomsArr.length; roomInd++){
        this.markedRoomsToDel.push({idx:roomInd,markedToDel:false});
    }
  }

  get roomsArr(){
    return this.roomsFormGroup.get('roomsArr') as UntypedFormArray;
  }

  updateInput(roomName:string,idx:number){
    this.roomsArr.at(idx).setValue(roomName);
    this.roomsArr.at(idx).updateValueAndValidity();
    this.objErrValStr = this.roomsArr.at(idx).errors? this.roomsArr.at(idx).errors.error : "";
    // console.log("HomeC updateInput() this.roomsArr.value ", this.roomsArr.value);
    // console.log("HomeComp roomsDialog updateInput() errors",this.roomsArr.at(idx).errors)
    // console.log("HomeComp roomsDialog updateInput() is invalid",this.roomsArr.at(idx).invalid); 
    // console.log("HomeComp roomsDialog updateInput() status",this.roomsArr.at(idx).status); 
  }

  addRoom(newRoomName: string){
    this.httpService.insertRoom({row:'',title:newRoomName})
    this.roomsArr.push(this.fb.control(newRoomName));
    this.updateValidators();
  }

  removeRoom(idx: number){
    console.log("HomeC roomsArr room to delete: ",this.roomsArr.value[idx])
    this.httpService.deleteRoom({row:idx.toString(),title:this.roomsArr.value[idx]});
    this.roomsArr.removeAt(idx);
    this.markedRoomsToDel = [];
    for (let roomInd =0; roomInd < this.roomsArr.value.length; roomInd++){
      this.markedRoomsToDel.push({idx:roomInd,markedToDel:false});
    }
    this.updateValidators();
    console.log("HomeC markedRoomsToDel:",this.markedRoomsToDel)
  }

  onSubmit(){
    let roomNames : string[]= [];
    let controls = this.roomsArr.controls;
    for (let control of controls){
      control.updateValueAndValidity();
      console.log("HomeComp roomsDialog onSubmit() control.errors: ",control.errors); 
      console.log("HomeComp roomsDialog onSubmit() valid",this.roomsArr.valid); 
    }
    if(this.roomsArr.valid) {
      this.dialogRef.close({
        toEditRooms: this.roomsArr.value,
        })
  
    }
  }


}