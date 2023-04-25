import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { TokenStorageService } from '../_services/token-storage.service';
import { ActivatedRoute} from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from '../profile/profile.component';
import { ThemePalette } from '@angular/material/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'mwl-change-pass',
  templateUrl: './change-pass.component.html',
  styleUrls: ['./change-pass.component.scss']
})
export class ChangePassComponent implements OnInit {
  changePassFG = new UntypedFormGroup({
    email: new UntypedFormControl('',[Validators.required, Validators.email,Validators.minLength(5)]),
    oldpass: new UntypedFormControl('',[Validators.required,Validators.minLength(6)]),
    newpass : new UntypedFormControl('',[Validators.required,Validators.minLength(6)])
  });
  isSuccessful = false;
  isInputChangePassFailed = false;
  errorMessage = '';
  matcher = new MyErrorStateMatcher();
  color : ThemePalette = 'accent'

  constructor(private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private actRoute: ActivatedRoute, ) { }

  ngOnInit(): void {
    let userEmailexists = this.actRoute.snapshot.queryParamMap.get('emailcheck');
  }

  isSendingChangePass : BehaviorSubject<boolean> = new BehaviorSubject(false);

  inputChangePass(email: string,oldpass: string,newpass: string): void {
    //console .log("ChPC inputchangePass email, oldpass, newpass: ",email,oldpass,newpass)
    this.isSendingChangePass.next(true);
    this.authService.inputChangePass( email, oldpass,newpass).subscribe({
      next : (response) => {
        this.isSendingChangePass.next(false);
        let responseObj = response.body as any;
        let user_id : number = responseObj.temp_user_id;
          let sentToken = response.sent_token;
          this.tokenStorage.saveConfirmToken(sentToken)
          this.isSuccessful = true;
          this.isInputChangePassFailed = false;
      },
      error : (err) => {
        this.isSendingChangePass.next(false);
        this.errorMessage = err.error.message;
        this.isInputChangePassFailed = true;
      }
    }
    );
    
  }
}
