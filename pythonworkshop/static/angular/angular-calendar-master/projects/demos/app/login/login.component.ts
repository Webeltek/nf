import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { ActivatedRoute, Router} from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

let apiLoaded = false;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form: any = {
    username: null,
    password: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
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

  constructor(private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private actRoute: ActivatedRoute,
    private router: Router,
    public oidcSecurityService: OidcSecurityService
    ) {}  
    
  ngOnInit(): void {
     //script for youtube-player
     /* if(!apiLoaded){
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      apiLoaded = true;
     } */

     this.oidcSecurityService.checkAuth().subscribe((resp) => {
      const { isAuthenticated, accessToken, idToken} = resp;
      console.log("LC ngOnInit oidc checkAuth() accessToken, idToken: ",accessToken, idToken)
      /*...*/
    }); 
    
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      this.role = this.tokenStorage.getUser().is_admin? 'admin':'user';
    }
    const confirmedUserEmail = this.actRoute.snapshot.paramMap.get('userEmail');
    this.form.user_email = confirmedUserEmail;
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

  vippsLogin() {
    this.oidcSecurityService.authorize();
  }
  vippsLogout(){
    this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
  }

  onSubmit(): void {
    const { username, password } = this.form;

    this.authService.login(username, password).subscribe({
      next: (data) => {
        let dataObj = data as any;
        //console.log("loginComp dataObj.user:",dataObj.user)
        if (dataObj.user!== 'nonexistent'){
          let accessToken : string= dataObj.user.access_token ;
          this.tokenStorage.saveToken(accessToken);
          this.tokenStorage.saveUser(dataObj.user);
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          this.tokenStorage.authenticated$.next(true);
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

}

