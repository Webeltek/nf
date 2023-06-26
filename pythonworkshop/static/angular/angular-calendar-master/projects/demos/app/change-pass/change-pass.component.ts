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
  combEmailExistsChangeOrg$ : BehaviorSubject<boolean>= new BehaviorSubject(false);

  changeOrgFG = new UntypedFormGroup({
    email: new UntypedFormControl('',[Validators.required, Validators.email,Validators.minLength(5)]),
    oldpass: new UntypedFormControl('',[Validators.required,Validators.minLength(6)]),
    neworg : new UntypedFormControl('',[Validators.required,Validators.minLength(6)])
  });

  constructor(private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private actRoute: ActivatedRoute, ) { }

  ngOnInit(): void {
    this.actRoute.queryParams.subscribe(params=>{
      if (params['emailcheck']==="True" && params['change_org']==="True"){

         this.combEmailExistsChangeOrg$.next(params['change_org']==="True" && params['emailCheck']==="True");
      }
    });
    
    console.log("CP query param combEmailExistsChangeOrg$",this.combEmailExistsChangeOrg$);
  }

  isSendingChangePass : BehaviorSubject<boolean> = new BehaviorSubject(false);

  inputChangePass(email: string,oldpass: string,newpass: string): void {
    //console .log("ChPC inputchangePass email, oldpass, newpass: ",email,oldpass,newpass)
    this.isSendingChangePass.next(true);
    this.authService.inputChangePass( email, oldpass,newpass).subscribe({
      next : (response) => {
        this.isSendingChangePass.next(false);
        this.isSuccessful = true;
        this.isInputChangePassFailed = false;
      },
      error : (err) => {
        this.isSendingChangePass.next(false);
        this.errorMessage = err.error.message;
        this.isInputChangePassFailed = true;
      }
    });
  }

  inputChangeOrg(email: string,oldpass: string,neworg: string): void {
    //console .log("ChPC inputchangePass email, oldpass, newpass: ",email,oldpass,newpass)
    this.isSendingChangePass.next(true);
    this.authService.inputChangeOrg( email, oldpass,neworg).subscribe({
      next : (response) => {
        this.isSendingChangePass.next(false);
        this.isSuccessful = true;
        this.isInputChangePassFailed = false;
      },
      error : (err) => {
        this.isSendingChangePass.next(false);
        this.errorMessage = err.error.message;
        this.isInputChangePassFailed = true;
      }
    });
  }
}
