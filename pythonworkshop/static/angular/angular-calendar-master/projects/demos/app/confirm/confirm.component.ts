import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenStorageService } from '../_services/token-storage.service';

@Component({
  selector: 'mwl-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {

  constructor(
    private authService: AuthService, 
    private actRoute: ActivatedRoute, 
    private router: Router,
    private tokenStorage: TokenStorageService) { }

  msg : string;  

  ngOnInit(): void {

    let userConfirmed = this.actRoute.snapshot.queryParamMap.get('userconfirmed');
    let userConfByAdm = this.actRoute.snapshot.queryParamMap.get('user_conf_by_adm');
    let userChangedEmail = this.actRoute.snapshot.queryParamMap.get('emailchanged');
    console.log("ConfComp userConfirmed",userConfirmed);
      if (userConfirmed==='True'){
        this.msg = "CCemailConfirmed"
      } else if (userConfirmed!=='True'){
        this.msg = "CCemailNotConfirmed"
      }
      /* if (userConfByAdm==='True'){
        this.msg= "User is confirmed by admin!"
      } else if(userConfByAdm!=='True') {
        this.msg = "Awaiting confirmation by admin!";
        console.log("ConfComp user not confirmed by admin")
      } */
      if (userChangedEmail){
        this.msg = "Successfully changed email!"
      }
    ;
  }

}
