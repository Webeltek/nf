import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
//import { Socket } from 'ngx-socket-io'; 

const AUTH_API = '/api/auth/';
const MAIN_API = '/api/services/';
const baseurl = 'https://138.109-247-35.customer.lyse.net';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient,
    private router: Router,
    //private socket: Socket
    ) { }

  httpHeaders = new HttpHeaders({
    'Content-Type' : 'application/json; charset=UTF-8'
  });

  login(email: string, password: string) {
    return this.http.post(baseurl+AUTH_API + 'login', {
      email,
      password
    }, { headers : this.httpHeaders, observe : 'body'});
  }

  testLogin() {
    return this.http.post(baseurl+ '/api/test', {
      test_usr : "testing usr"
    }, { headers : this.httpHeaders, observe : 'body'});
  }

  loginLDAP(ldap_user: string, ldap_pass: string) {
    return this.http.post(baseurl+AUTH_API + 'ldap', {
      ldap_user : ldap_user,
      ldap_pass : ldap_pass
    }, { headers : this.httpHeaders, observe : 'body'});
  }

  register( email: string, password: string, ou: string): Observable<any> {
    return this.http.post(baseurl+AUTH_API + 'register', {
      email : email,
      password : password,
      ou : ou
    }, { headers : this.httpHeaders, observe : 'response', responseType : 'json'} );
  }

  sendAdminRegConfirm( email: string,temp_user_id: number): Observable<any> {
    return this.http.post(baseurl+AUTH_API + 'reg_admin_confirm', {
      email : email, temp_user_id
    }, { headers : this.httpHeaders, observe : 'response', responseType : 'json'} );
  }

  changeEmail(userId:number,newEmail: string, oldpassword: string): Observable<any> {
      return this.http.post(baseurl+MAIN_API + 'change_email', {
        userId: userId,
        newEmail : newEmail,
        oldpassword : oldpassword
      }, { headers : this.httpHeaders, observe : 'response', responseType : 'json'} );
    }
  

  changePass(resPassEmail: string): Observable<any> {
    return this.http.post(baseurl+MAIN_API + 'change_pass', {
      resPassEmail : resPassEmail,
    }, { headers : this.httpHeaders, observe : 'response', responseType : 'json'} );
  }

  inputChangePass( email: string, oldpass: string,newpass: string): Observable<any> {
    return this.http.post(baseurl + AUTH_API + 'input_change_pass', {
      email : email,
      oldpass : oldpass,
      newpass: newpass
    }, { headers : this.httpHeaders, observe : 'response', responseType : 'json'} );
  }

  sendMsg(msg_email: string, msg_text: string){
    console.log("authService sendMsg msg_email, msg_text",msg_email,msg_text);
    return this.http.post(baseurl+AUTH_API + 'send_msg', {
      msg_email : msg_email,
      msg_text : msg_text
    }, { headers : this.httpHeaders, observe : 'body', responseType : 'json'} );
  }

  sendGetMerchAccTkn(){
    return this.http.post( '/api/vipps/get_merch_tkn','',
      { headers: this.httpHeaders, observe : 'body', responseType : 'json'}
    )
  }

  generateUniqueID( digit = 1000 ) {
    return new Date().getTime().toString(16) + Math.floor( digit * Math.random() ).toString(16)
  }

  sendVippsPayment( access_tkn: string, usr_phone : string, amount: string){
    console.log("AuthService sendVippsPayment usr_phone, amount",usr_phone,amount)
    return this.http.post('/api/vipps/send_payment',''
        ,  { headers : this.httpHeaders, 
              observe : 'body', 
              params: {
                'access_tkn' : access_tkn,
                'usr_phone': usr_phone,
                'amount': amount,
                'idemp_key': this.generateUniqueID()
              },
              responseType : 'json'})
  }

  /* getMessage() {
    return this.socket.fromEvent('user_confirmed').pipe(map((data: any) => {
      console.log("AuthServ event user_confirmed received");
    }))
  } */
}
