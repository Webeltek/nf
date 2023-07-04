import { Component, OnInit } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { PythUser } from '../demo-app.component';

export interface LDAPprofRow{
  user_email: string;
  address: string;
  ou : string;
  user_is_logged_in: string;
  last_seen: string;
}

const ELEMENT_DATA : LDAPprofRow[] = [];

class ExampleDataSource extends DataSource<LDAPprofRow> {
  private _dataStream = new ReplaySubject<LDAPprofRow[]>();

  constructor(initialData: LDAPprofRow[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<LDAPprofRow[]> {
    return this._dataStream;
  }

  disconnect() {}

  setData(data: LDAPprofRow[]) {
    this._dataStream.next(data);
  }
}

@Component({
  selector: 'mwl-board-admin',
  templateUrl: './board-admin.component.html',
  styleUrls: ['./board-admin.component.scss']
})
export class BoardAdminComponent implements OnInit {

  constructor(
    private httpService: HttpEventService,
    public tokenStorage: TokenStorageService) { }

  displayedColumns: string[] = ['user_email','ou','is_logged_in','last_seen'];
  dataToDisplay = [...ELEMENT_DATA];
  dataSourceEx = new ExampleDataSource(this.dataToDisplay);

  ngOnInit(): void {
    this.getDbUsers();
  }

  getDbUsers(){
    this.httpService.getUsers().subscribe({
        next : (response) => {
          if(response.hasOwnProperty('users')) {
            let storageUsrObj = this.tokenStorage.getUser();
            //console.log("getDBUsers()  storageUsrObj.user_email", storageUsrObj.user_email);
          
            let respObj  = response as any ;
            for (let usrObj of respObj.users){
                let LDAPprofRow = {
                  user_email: usrObj.user_email,
                  address: usrObj.address,
                  ou : usrObj.ou,
                  user_is_logged_in: usrObj.user_is_logged_in===true ? "True" : "False",
                  last_seen: usrObj.last_seen
                }  
                this.dataToDisplay.push(LDAPprofRow);
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
