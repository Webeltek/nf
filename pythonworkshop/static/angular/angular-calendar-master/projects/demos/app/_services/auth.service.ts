import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { UserIdentity } from '../login/login.component';
//import { Socket } from 'ngx-socket-io'; 

const AUTH_API = '/api/auth/';
const MAIN_API = '/api/services/';
const baseurl = 'https://api.webeltek.org';

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
  

  login({provider,username, password, vipps_sub, google_sub}: UserIdentity) {
    let content_body = {}
    switch (provider ) {
     case 'local' : { 
      content_body = {
        provider : 'local',
        email : username,
        password : password
      }
      break;
    }
     case 'vipps' : {
      content_body = {
        provider : 'vipps',
        email: username,
        vipps_sub : vipps_sub
      }
      break;
    } 
    case 'google' : {
      content_body = {
        provider: 'google',
        email : username,
        google_sub : google_sub
      }
      break;
    }
  }
    return this.http.post(baseurl+AUTH_API + 'login', 
    content_body, { headers : this.httpHeaders, observe : 'body'});
  }

  logout(email: string) {
    return this.http.post(baseurl+AUTH_API + 'logout', {
      email
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

  private vippsAuthUrl = "/api/vipps/rp";
    private vippsAuthCbUrl = "/api/vipps/authz_cbvipps"
    //unused vippsRPHeaders
    vippsRPHeaders = new HttpHeaders({
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site' : 'same-origin',
        'Sec-Fetch-User' : '?1',
        'Upgrade-Insecure-Requests': '1'
    })

  vippsAuthorize(){
      console.log("HttpS vippsAthorize call")
      window.location.href = `https://api.webeltek.org/api/vipps/rp?is_checkout=False`
      /* return this.http.get(this.baseurl+this.vippsAuthUrl,
          { headers : this.vippsHeaders, observe: 'body', responseType : 'json'})
          .subscribe({
              next: (response)=>{
                  console.log("HttpS vippsAuthorize response",response);
              },
              error: (error) => { 
                  console.log("vippsAuthorize() error : " + JSON.stringify(error)) ; 
              }
          }) */
  }

  vippsCheckout(){
      console.log("HttpS vippsCheckout call");
      window.location.href = `https://api.webeltek.org/api/vipps/rp?is_checkout=True`
  }

  sendGetMerchAccTkn(){
    return this.http.post(baseurl+ '/api/vipps/get_merch_tkn','',
      { headers: this.httpHeaders, observe : 'body', responseType : 'json'}
    )
  }

  generateUniqueID( digit = 1000 ) {
    return new Date().getTime().toString(16) + Math.floor( digit * Math.random() ).toString(16)
  }

  sendVippsPayment( access_tkn: string, usr_phone : string, amount: string){
    console.log("AuthService sendVippsPayment usr_phone, amount",usr_phone,amount)
    return this.http.post(baseurl+'/api/vipps/send_payment',''
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

  sendVippsRedirect(redirectUrl: string){
    window.location.href = redirectUrl;
  }

  queryVippsPayment(reference: string){
    console.log("AuthService queryVippsPayment reference :",reference)
    return this.http.get(baseurl+'/api/vipps/query_payment',{ 
      headers : this.httpHeaders, 
      params: { 'reference': reference }
      }
    )
  }

  dbSaveVippsPayment( reference : string,vipps_sub : string,
      amount : string): Observable<any> {
    return this.http.post(baseurl+MAIN_API + 'db_save_payment', {
      reference : reference,
      vipps_sub : vipps_sub,
      amount : amount
    }, { headers : this.httpHeaders, observe : 'body', responseType : 'json'} );
  }

  dbGetVippsPayment( vipps_sub : string): Observable<any> {
    return this.http.get(baseurl+MAIN_API + 'db_get_payment', { 
        headers : this.httpHeaders,
        observe : 'body', 
        responseType : 'json', 
        params : {'vipps_sub' : vipps_sub }
      });
  }

  getVippsUserinfo(sub: string, merch_access_tkn: string){
    return this.http.post(baseurl+ '/api/vipps/userinfo',{
      sub : sub,
      merch_access_tkn : merch_access_tkn
    },
      { headers: this.httpHeaders, observe : 'body', responseType : 'json'}
    )
  }

  /* getMessage() {
    return this.socket.fromEvent('user_confirmed').pipe(map((data: any) => {
      console.log("AuthServ event user_confirmed received");
    }))
  } */
}
