import { Component, OnInit } from '@angular/core';
import { UntypedFormControl,Validators ,FormControl, FormGroupDirective, NgForm, UntypedFormGroup} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

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

  constructor() { }

  ngOnInit(): void {
  }

  sendMelding(){

  }

}
