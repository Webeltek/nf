import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
//import { Socket } from 'ngx-socket-io'; 

const AUTH_API = '/api/auth/';
const MAIN_API = '/api/services/';
const baseurl = '';
const VIPPS_PAY_ENDPOINT = 'https://apitest.vipps.no/epayment/v1/payments'


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient,
    private router: Router,
    //private socket: Socket
    ) { }

  httpHeaders = new HttpHeaders({
    'Content-Type' : 'application/json; charset=UTF-8',
    'Cache-Control': 'no-cache'
  });

  httpVippsHeaders = new HttpHeaders({
    "Authorization": "Bearer <TOKEN>" ,
    "Ocp-Apim-Subscription-Key": "9dd5c1f9caa248899b507f80935daecc" ,
    "Content-Type": "application/json" ,
    "Idempotency-Key": this.generateUniqueID() ,
    "Merchant-Serial-Number": "297957" 
  });

  generateUniqueID( digit = 1000 ) {
    return new Date().getTime().toString(16) + Math.floor( digit * Math.random() ).toString(16)
  }

  login(email: string, password: string) {
    return this.http.post(baseurl+AUTH_API + 'login', {
      email,
      password
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

  sendVippsPayment( usr_phone : string, amount: number){
    console.log("AuthService sendVippsPayment usr_phone, amount",usr_phone,amount)
    return this.http.post(VIPPS_PAY_ENDPOINT,{
        "amount": {
          "currency": "NOK",
          "value": amount
        },
        "paymentMethod": {
          "type": "WALLET"
        },
        "customer": {
          "phoneNumber": usr_phone  // (NB! MSISDN format)
        },
        "reference": "abcc123",
        "returnUrl": "https://138.109-247-35.customer.lyse.net/vipps_checkout"+"?reference=abcc123"+"&phone_number="+usr_phone,
        "userFlow": "WEB_REDIRECT",
        "paymentDescription": "A simple payment"
    },  { headers : this.httpVippsHeaders, observe : 'body', responseType : 'json'})
  }

  /* getMessage() {
    return this.socket.fromEvent('user_confirmed').pipe(map((data: any) => {
      console.log("AuthServ event user_confirmed received");
    }))
  } */
}
