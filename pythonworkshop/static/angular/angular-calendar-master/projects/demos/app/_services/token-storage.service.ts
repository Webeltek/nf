import { Injectable ,  Output, EventEmitter} from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router'
import { CalendarEventTimesChangedEvent, CalendarEventTimesChangedEventType } from 'angular-calendar';
import { PythUser } from '../demo-app.component';


const CONFIRM_KEY = 'confirm-token'
const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

const VIPPS_USR_TOKEN_KEY = 'vipps-usr-token';
const VIPPS_MERCH_TOKEN_KEY = 'vipps-merch-token';
const VIPPS_PAYMNT_KEY = 'vipps-paymnt-key';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor(private router: Router) {}

  combAuthProtected$ : BehaviorSubject<boolean> = new BehaviorSubject(false);
  isCalendarActive$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  authenticated$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  //currenLoginState = this.authenticated$.asObservable();

  signOut(msg?: string): void {
    window.sessionStorage.clear();
    this.authenticated$.next(false);
    this.router.navigate(['login',{session: 'signout' }]);
  }

  public saveConfirmToken(token: string): void {
    window.sessionStorage.removeItem(CONFIRM_KEY);
    window.sessionStorage.setItem(CONFIRM_KEY, token);
  }

  public getConfirmToken(): string | null {
    return window.sessionStorage.getItem(CONFIRM_KEY);
  }
  
  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    if (window.sessionStorage.getItem(TOKEN_KEY)!==null){
      this.authenticated$.next(true);
    this.router.events.subscribe((routerEvent)=>{
      if (routerEvent instanceof NavigationEnd){
        const isProtectedRoute = 
        /\/calendar(.*)$|\/profile(.*)$|\/logout(.*)$|\/board_admin(.*)$|\/payment(.*)$/.test(routerEvent.url) ? true : false;
        //console.log("TS isProtectedRoute, authenticated", isProtectedRoute,this.authenticated$.getValue())
        this.combAuthProtected$.next(this.authenticated$.getValue() && isProtectedRoute);

        const isCalendarRoute = 
            /\/calendar(.*)$/.test(routerEvent.url) ? true : false;
            this.isCalendarActive$.next(isCalendarRoute);
      }
    });
      return window.sessionStorage.getItem(TOKEN_KEY);
    } else if(window.sessionStorage.getItem(TOKEN_KEY)==null){
      this.authenticated$.next(false);
      return null;
    }
  }

  public saveVippsUsrToken(token: string): void {
    //console.log("tokenStorage saveToken() token:",token)
    window.sessionStorage.removeItem(VIPPS_USR_TOKEN_KEY);
    window.sessionStorage.setItem(VIPPS_USR_TOKEN_KEY, token);
  }

  public getVippsUsrToken(): string | null {
    if (window.sessionStorage.getItem(VIPPS_USR_TOKEN_KEY)!==null){
      this.authenticated$.next(true);
      return window.sessionStorage.getItem(VIPPS_USR_TOKEN_KEY);
    } else if(window.sessionStorage.getItem(VIPPS_USR_TOKEN_KEY)==null){
      this.authenticated$.next(false);
      return null;
    }
  }

  public saveVippsMerchToken(token: string): void {
    window.sessionStorage.removeItem(VIPPS_MERCH_TOKEN_KEY);
    window.sessionStorage.setItem(VIPPS_MERCH_TOKEN_KEY, token);
  }

  public getVippsMerchToken(): string | null {
    if (window.sessionStorage.getItem(VIPPS_MERCH_TOKEN_KEY)!==null){
      return window.sessionStorage.getItem(VIPPS_MERCH_TOKEN_KEY);
    } else if(window.sessionStorage.getItem(VIPPS_MERCH_TOKEN_KEY)==null){
      return null;
    }
  }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      //console.log("tokenStorage getUser():",JSON.parse(user))
      return JSON.parse(user);
    } 
    return {};
  }

  public getEventTitle(bookname: string,evt_user_id: number, users : PythUser[]){
    const eventUser =  users.filter((user)=> {
      //console.log("DA getEventTitle() pythEv.bookname , user.id ,pythEv.user_id",pythEv.bookname,user.id , pythEv.user_id);
      return user.id == evt_user_id
    });
    
    let ouname = eventUser[0].ou==="init ou" ? "" : eventUser[0].ou;
    const alphaIndx = eventUser[0].user_email.indexOf('@');
    let userEmailPrefix = typeof eventUser[0]=='undefined' ? '' : eventUser[0].user_email.slice(0,alphaIndx);

    //console.log("TS getEventTitle",eventUser[0].user_email,userEmailPrefix,ouname);
    if ( this.getUser().is_admin || this.getUser().id==evt_user_id){
      return `${bookname}<br>${eventUser[0].user_email}<br>${ouname}`;
    } else {
      return `${bookname}<br>${userEmailPrefix}<br>${ouname}`;
    }
}
}

