import { Component, OnInit } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { PythUser } from '../demo-app.component';

export interface LDAPprofRow{
  username: string;
  address: string;
  ou : string;
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

  displayedColumns: string[] = ['username','address','ou'];
  dataToDisplay = [...ELEMENT_DATA];
  dataSourceEx = new ExampleDataSource(this.dataToDisplay);
  userToDisplay : PythUser= <PythUser>{};

  ngOnInit(): void {
  }

  getDbUsers(){
    this.httpService.getUsers().subscribe({
        next : (response) => {
          if(response.hasOwnProperty('users')) {
            let storageUsrObj = this.tokenStorage.getUser();
            //console.log("getDBUsers()  storageUsrObj.user_email", storageUsrObj.user_email);
          
            let respObj  = response as any ;
            for (let pythUser of respObj.users){
              if (pythUser.id == storageUsrObj.id){
                this.userToDisplay = pythUser;
              }
            }
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
