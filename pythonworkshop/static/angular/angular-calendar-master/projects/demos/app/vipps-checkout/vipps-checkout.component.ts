import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { TokenStorageService } from '../_services/token-storage.service';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'mwl-vipps-checkout',
  templateUrl: './vipps-checkout.component.html',
  styleUrls: ['./vipps-checkout.component.scss']
})
export class VippsCheckoutComponent implements OnInit {

  constructor(private actRoute: ActivatedRoute,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private authService: AuthService) { }

  ngOnInit(): void {
    this.actRoute.queryParams.subscribe(params=>{
      if (params['access_token'] && params['usr_phone']){
        let access_token = params['access_token'];
        const usr_phone = params['usr_phone'];
        console.log("VCH access_token", access_token);
        this.tokenStorage.saveVippsToken(access_token);
        const amount = 1 // valuta NOK
        this.authService.sendVippsPayment(usr_phone,amount).subscribe((response) => {
          if(response){
            const resp = response as any;
            console.log("VCheck response: ", resp)
          }
        },

        )
      } 
      

    });
  }

}
