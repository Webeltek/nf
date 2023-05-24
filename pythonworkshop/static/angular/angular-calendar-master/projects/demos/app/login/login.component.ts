import { Component, OnInit , Renderer2} from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpEventService } from 'projects/angular-calendar/src/modules/week/http-service.service';
import { UntypedFormControl,Validators ,FormControl, FormGroupDirective, NgForm, UntypedFormGroup} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { delay } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { ThemePalette } from '@angular/material/core';

let apiLoaded = false;

export class LoginErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export interface UserIdentity{
  provider: string;
  username : string;
  password? : string;
  vipps_sub?: string;
  google_sub?: string;
}

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  matcher = new LoginErrorStateMatcher();

  color : ThemePalette = 'accent';

  loginFG = new UntypedFormGroup({
    username: new UntypedFormControl('',[Validators.required,Validators.minLength(5)]),
    pass: new UntypedFormControl('',[Validators.required,Validators.minLength(6)])
  })

  form: any = {
    username: null,
    password: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  ldapMsg = '';
  role: string = '';

  videos = [
    {
      id: '1',
      videoId: 'aF2CAFEyttU'
    },
    {
      id: '2',
      videoId: 'GnWhniuvMrM'
    }
  ]
  playerVars = {
    autoplay: 1,
    autohide: 1,
    modestbranding: 0,
    frameborder: 0,
    loop:1,
    rel: 0,
    showinfo: 0,
    fs: 0,
    playsinline : 1,
    mute: 1,
    controls: 0,
    disablekb :1,
    iv_load_policy: 3,
  }

  isDesktop = false;

  constructor(
    public httpService: HttpEventService,
    private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private actRoute: ActivatedRoute,
    private router: Router,
    private BPobserver: BreakpointObserver,
    private renderer: Renderer2
    ) {}  
    
  ngOnInit(): void {
     //script for youtube-player
     /* if(!apiLoaded){
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      apiLoaded = true;
     } */

    /* this.router.events.subscribe({
      next : (routerEvent)=>{
        if (routerEvent instanceof NavigationEnd){
          
        }
      },
      error: (err) => {
        console.log("LC ngOnInit actRoute.title.subscribe error",err.error.message)
      }
    }) */

    const script = this.renderer.createElement('script');
    this.renderer.setAttribute(script, 'src', 'https://accounts.google.com/gsi/client');
    this.renderer.setAttribute(script,'async','true');
    this.renderer.setAttribute(script,'defer','true');
    this.renderer.appendChild(document.head, script);

    this.actRoute.queryParams.subscribe(params=>{
      let code = params['code'];
      console.log("LC ngOnInit  params[code]", params['code']);
      if(code){
          let obj = {
            code : params['code'],
            scope: params['scope'],
            state : params['state']
          }
          //this.httpService.vippsSendCb(obj)
      }
      if (params['username'] && params['vipps_sub']){
        const username = params['username'];
        const vipps_sub = params['vipps_sub']
        this.authService.login({provider:"vipps",username: username, vipps_sub: vipps_sub}).subscribe({
          next: (data) => {
            let dataObj = data as any;
            //console.log("loginComp dataObj.user:",dataObj.user)
            if (dataObj.user!== 'nonexistent'){
              let accessToken : string= dataObj.user.access_token ;
              this.tokenStorage.saveToken(accessToken);
              this.tokenStorage.saveUser(dataObj.user);
              this.isLoginFailed = false;
              this.isLoggedIn = true;
              this.router.navigate(['calendar'])
            } else if(dataObj.user === 'nonexistent'){
              this.errorMessage = "LCwrongUserPass";
              this.isLoginFailed = true;
            }
    
          },
          error: err => {
            this.errorMessage = err.error.message;
            this.isLoginFailed = true;
          }
        }
        );
      }

      if (params['username'] && params['google_sub']){
        const username = params['username'];
        const google_sub = params['google_sub']
        this.authService.login({provider:"google",username: username,google_sub: google_sub}).subscribe({
          next: (data) => {
            let dataObj = data as any;
            //console.log("loginComp dataObj.user:",dataObj.user)
            if (dataObj.user!== 'nonexistent'){
              let accessToken : string= dataObj.user.access_token ;
              this.tokenStorage.saveToken(accessToken);
              this.tokenStorage.saveUser(dataObj.user);
              this.isLoginFailed = false;
              this.isLoggedIn = true;
              this.router.navigate(['calendar'])
            } else if(dataObj.user === 'nonexistent'){
              this.errorMessage = "LCwrongUserPass";
              this.isLoginFailed = true;
            }
    
          },
          error: err => {
            this.errorMessage = err.error.message;
            this.isLoginFailed = true;
          }
        }
        );
      }
    }) 
     

    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      this.role = this.tokenStorage.getUser().is_admin? 'admin':'user';
    }
    const confirmedUserEmail = this.actRoute.snapshot.paramMap.get('userEmail');
    this.loginFG.value.username = confirmedUserEmail;
    if (this.isLoggedIn){
      this.router.navigate(['calendar'])
    }

   const sessionParam = this.actRoute.snapshot.paramMap.get("session");
    if (sessionParam==="expired"){
      this.errorMessage = "LCsessExpired"
      console.log("login expired errorMessage",this.errorMessage)
    } else if (sessionParam==="signout"){
      this.errorMessage ="LCsignedOut";
      console.log("login signout errorMessage",this.errorMessage)
    }
  }

  ngAfterViewInit(){
    this.BPobserver
          .observe(['(min-width: 992px)'])
          .pipe(delay(1), untilDestroyed(this))
          .subscribe((res) => {
              this.isDesktop=true;
              if (!res.matches){
                this.isDesktop = false;
              }
          });
  }

  vippsLogin() {
    this.authService.vippsAuthorize();
  }


  onTestSubmit(){
    this.authService.testLogin().subscribe({
      next: (data) =>{
        let dataObj = data as any;
        if (dataObj){
          console.log("LC onTestSubmit return object: ", dataObj);
        }
      },
      error : (err) =>{
        console.log(" LC onTestSubmit error: ", err)
      }
      
    })
  }

  isSendingLogin : BehaviorSubject<boolean> = new BehaviorSubject(false);

  onSubmit(): void {
    const  usern : string = this.loginFG.controls.username.value; 
    const  passw :string = this.loginFG.controls.pass.value;
    this.isSendingLogin.next(true);

    this.authService.login({provider:"local",username: usern, password: passw}).subscribe({
      next: (data) => {
        this.isSendingLogin.next(false);
        let dataObj = data as any;
        //console.log("loginComp dataObj.user:",dataObj.user)
        if (dataObj.user!== 'nonexistent'){
          let accessToken : string= dataObj.user.access_token ;
          this.tokenStorage.saveToken(accessToken);
          this.tokenStorage.saveUser(dataObj.user);
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          this.router.navigate(['calendar'])
        } else if(dataObj.user === 'nonexistent'){
          this.errorMessage = "LCwrongUserPass";
          this.isLoginFailed = true;
        }

      },
      error: err => {
        this.isSendingLogin.next(false);
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    }
    );
  }

  onLDAPSubmit(): void {
    const  ldap_user = '' + this.loginFG.controls.username.value; 
    const  ldap_pass  = '' + this.loginFG.controls.pass.value;

    this.authService.loginLDAP(ldap_user, ldap_pass).subscribe({
      next: (data) => {
        let dataObj = data as any;
        //console.log("loginComp dataObj.user:",dataObj.user)
        if (dataObj.user.access_token && dataObj.msg){
          let accessToken : string= dataObj.user.access_token ;
          this.tokenStorage.saveToken(accessToken);
          this.tokenStorage.saveUser(dataObj.user);
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          this.router.navigate(['calendar'])
        } else {
          this.errorMessage = "LCwrongUserPass";
          this.isLoginFailed = true;
        }

      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    }
    );
  }

}

