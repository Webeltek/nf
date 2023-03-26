import { Component, OnInit } from '@angular/core';
import { UntypedFormControl,Validators ,FormControl, FormGroupDirective, NgForm, UntypedFormGroup} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { AuthService } from 'projects/demos/app/_services/auth.service';

export class ContactFormErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent implements OnInit {
  matcher = new ContactFormErrorStateMatcher();

  msgFG = new UntypedFormGroup({
    msg_email: new UntypedFormControl('',[Validators.email,Validators.required,Validators.minLength(5)]),
    msg_text: new UntypedFormControl('',[Validators.required,Validators.minLength(12)])
  })

  constructor(public authService : AuthService) { }

  ngOnInit(): void {
  }

  sendMelding(){
    const msg_email = this.msgFG.controls.msg_email.value;
    const msg_text = this.msgFG.controls.msg_text.value;
    this.authService.sendMsg(msg_email,msg_text).subscribe(
      {
          next: (response) => {
            const resp = response as any;
            if(response.hasOwnProperty('guest_email_reference')) {
              
              //console.log("getDBUsers()  storageUsrObj.user_email", resp.guest_email_reference);
            }
            
          },
          error: err => {
            console.log("CF error", err.error.message);
          }
      })
  }

}
