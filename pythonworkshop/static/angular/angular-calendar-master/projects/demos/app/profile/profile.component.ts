import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../_services/token-storage.service';
import { AuthService } from '../_services/auth.service';
import { PythUser } from '../demo-app.component';
import { UntypedFormControl,Validators ,FormControl, FormGroupDirective, NgForm, UntypedFormGroup} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { BehaviorSubject } from 'rxjs';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'mwl-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  isPassReset = false;
  isPassResetFailed = false;
  errorMessage = '';
  serviceMsg$: BehaviorSubject<string> = new BehaviorSubject('');

  matcher = new MyErrorStateMatcher();

  resPassEmailFormControl = new UntypedFormControl('',[Validators.required,Validators.email,Validators.minLength(5)]);

  constructor(private tokenStorage: TokenStorageService,
     private authService: AuthService) { }

  user : PythUser = {
    id : 0, 
  user_email : '',
  user_pass_hash : '',
  user_is_logged_in : '',
  user_confirmed : '',
  access_token: '',
  last_seen : '',
  is_admin : ''
  };

  changeEmailFG = new UntypedFormGroup({
    email: new UntypedFormControl('',[Validators.required, Validators.email,Validators.minLength(5)]),
    pass: new UntypedFormControl('',[Validators.required,Validators.minLength(6)])
  })

  changePassFG = new UntypedFormGroup({
    email: new UntypedFormControl('',[Validators.required, Validators.email,Validators.minLength(5)]),
  })

  ngOnInit(): void {
    this.user=this.tokenStorage.getUser();
  }

  changeEmail(newEmail: string, oldPass: string){
    this.authService.changeEmail(this.user.id,newEmail,oldPass).subscribe({
      next: (respObj)=>{
        let respAny  = respObj.body as any;
        console.log("PC changeEmail respAny.changed_email: ",respAny.changed_email);
        this.serviceMsg$.next(`A confirmation has been sent to the new email: ${respAny.changed_email}`);
      }
    })
  }

  changePass(resPassEmail: string ): void {
    this.authService.changePass(resPassEmail).subscribe({
      next: (data) => {
        let respAny = data.body as any;
        //console.log("loginComp dataObj.user:",dataObj.user)
        if (respAny.hasOwnProperty('user_email')){
          this.serviceMsg$.next(`A confirmation has been sent to: ${respAny.user_email}`);
        } else {
          this.errorMessage = "Wrong username or password!";
        }

      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isPassResetFailed = true;
      }
    }
    );
  }

}
