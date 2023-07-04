import { Component, OnInit } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { TokenStorageService } from '../_services/token-storage.service';

export interface PaymentRow{
  user_email: string;
  ou : string;
  bookname: string;
  amount: string;
  is_consumed: string;
}

const ELEMENT_DATA : PaymentRow[] = [];

class ExampleDataSource extends DataSource<PaymentRow> {
  private _dataStream = new ReplaySubject<PaymentRow[]>();

  constructor(initialData: PaymentRow[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<PaymentRow[]> {
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
    public tokenStorage: TokenStorageService) { }

  displayedColumns: string[] = ['user_email','ou','bookname','amount','is_consumed'];
  dataToDisplay = [...ELEMENT_DATA];
  dataSourceEx = new ExampleDataSource(this.dataToDisplay);  

  ngOnInit(): void {
  }

  getDbUsers(){
    this.httpService.getUsers().subscribe({
        next : (response) => {
          if(response.hasOwnProperty('payments')) {
            let storageUsrObj = this.tokenStorage.getUser();
            //console.log("getDBUsers()  storageUsrObj.user_email", storageUsrObj.user_email);
          
            let respObj  = response as any ;
            for (let usrObj of respObj.payments){
                let paymentRow = {
                  user_email: usrObj.user_email,
                  ou : usrObj.ou,
                  bookname: usrObj.bookname,
                  amount: usrObj.amount,
                  is_consumed: usrObj.is_consumed
                }  
                this.dataToDisplay.push(paymentRow);
                //console.log("board-admin getDbUsers user_is_logged_in: ",usrObj.user_is_logged_in===true ? "Has logged in" : "Hasn't logged in");
            }
            this.dataToDisplay = [...this.dataToDisplay];
            this.dataSourceEx.setData(this.dataToDisplay);
            //console.log("getDBUsers() this.users",this.users)
          } else {
            console.log("getDbUsers() string response msg:",response);
          }
          
        },
        complete : () => {
        }
    })
  }

}
