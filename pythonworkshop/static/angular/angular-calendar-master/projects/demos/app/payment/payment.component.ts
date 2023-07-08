import { Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import {DataSource} from '@angular/cdk/collections';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { MatSort, Sort } from '@angular/material/sort';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { AuthService } from '../_services/auth.service';

export interface PaymentRow{
  user_email: string;
  ou : string;
  bookname: string;
  amount: string;
  is_consumed: string;
}

const ELEMENT_DATA : PaymentRow[] = [];

class ExampleDataSource extends MatTableDataSource<PaymentRow> {
  private _dataStream = new BehaviorSubject<PaymentRow[]>([]);

  constructor(initialData: PaymentRow[]) {
    super();
    this.setData(initialData);
  }

  connect(): BehaviorSubject<PaymentRow[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: PaymentRow[]) {
    this._dataStream.next(data);
  }
}

@Component({
  selector: 'mwl-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {

  constructor(private httpService: HttpEventService,
    public tokenStorage: TokenStorageService,
    private _liveAnnouncer: LiveAnnouncer,
    private authService : AuthService) { }

  displayedColumns: string[] = ['user_email','ou','bookname','amount','is_consumed'];
  dataToDisplay = [...ELEMENT_DATA];
  dataSourceEx = new ExampleDataSource(this.dataToDisplay);  

  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    
    this.authService.dbGetVippsPayments(this.tokenStorage.getUser().id).subscribe({
      next : (response) => {
        if(response.hasOwnProperty('payments')) {
          let storageUsrObj = this.tokenStorage.getUser();
        
          let respObj  = response as any ;
          console.log("dbGetVippsPayments  ", respObj.payments);
          for (let usrObj of respObj.payments){
              let paymentRow = {
                user_email: storageUsrObj.user_email,
                ou : storageUsrObj.ou,
                bookname: usrObj.bookname,
                amount: usrObj.amount,
                is_consumed: usrObj.is_consumed
              }  
              this.dataToDisplay.push(paymentRow);
              //console.log("board-admin getDbUsers user_is_logged_in: ",usrObj.user_is_logged_in===true ? "Has logged in" : "Hasn't logged in");
          }
          this.dataToDisplay = [...this.dataToDisplay];
          this.dataSourceEx.setData(this.dataToDisplay);
          console.log("dataToDisplay",this.dataToDisplay)
        } else {
          console.log("getDbUsers() string response msg:",response);
        }
        
      },
      complete : () => {
      }
  })
  }

  ngAfterViewInit() {
    this.dataSourceEx.sort = this.sort;
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  getTotalCost() {
    return this.dataToDisplay.map(p => parseInt(p.amount)).reduce((acc, value) => acc + value, 0);
  }

}
