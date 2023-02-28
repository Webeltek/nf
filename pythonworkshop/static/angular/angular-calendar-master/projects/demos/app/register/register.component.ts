import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form: any = {
    email: null,
    password: null
  };
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    public oidcSecurityService: OidcSecurityService) { }

  ngOnInit(): void {
    
  }

  onSubmit(): void {
    const { email, password } = this.form;

    this.authService.register( email, password).subscribe({
      next : (response) => {
        let responseObj = response.body as any;
        let is_duplicate : boolean = responseObj.is_duplicate;
        let temp_user_id : number = responseObj.temp_user_id;
        console.log("RegComp is_duplicate value: ",responseObj.is_duplicate)
        if (!is_duplicate){
          //console.log("RegComp not duplicate response",response)
          let sentToken = response.sent_token;
          this.tokenStorage.saveConfirmToken(sentToken)
          this.isSuccessful = true;
          this.isSignUpFailed = false;
        } else {
          //console.log("RegComp is duplicate response",response)
          this.isSuccessful = false;
          this.isSignUpFailed = true;
          this.errorMessage = "is duplicate";
        }

        if(typeof temp_user_id!=='undefined'){
          this.authService.sendAdminRegConfirm( email, temp_user_id).subscribe({
            next : (response) => {
              let responseObj = response.body as any;
              let sent_success : boolean = responseObj.is_sent;
              console.log("sendAdminRegConfirm value: ",responseObj)
              if (sent_success){
                
              } else {
                
              }
              
            },
            error : (err) => {
              console.log("RegComp error",err.error.message);
              this.errorMessage = err.error.message;
              this.isSignUpFailed = true;
            }
          }
          );
        }
        
      },
      error : (err) => {
        console.log("RegComp error",err);
        this.errorMessage = err.error.message;
        this.isSignUpFailed = true;
      }
    }
    );
    
  }
}

