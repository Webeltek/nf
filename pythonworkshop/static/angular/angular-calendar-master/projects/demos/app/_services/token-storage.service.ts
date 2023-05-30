import { Injectable ,  Output, EventEmitter} from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router'


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
  constructor(private router: Router) { }

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
        /\/calendar(.*)$|\/profile(.*)$|\/logout(.*)$|\/board_admin(.*)$/.test(routerEvent.url) ? true : false;
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
}

