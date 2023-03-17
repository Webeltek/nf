import { Injectable ,  Output, EventEmitter} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router'


const CONFIRM_KEY = 'confirm-token'
const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor(private router: Router) { }

  authenticated$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  currenLoginState = this.authenticated$.asObservable();

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
    //console.log("tokenStorage saveToken() token:",token)
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    if (window.sessionStorage.getItem(TOKEN_KEY)!==null){
      this.authenticated$.next(true);
      return window.sessionStorage.getItem(TOKEN_KEY);
    } else if(window.sessionStorage.getItem(TOKEN_KEY)==null){
      this.authenticated$.next(false);
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

