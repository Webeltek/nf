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
      if (params['access_token'] || params['phone_number'] || params['reference']){
        const access_token = params['access_token'];
        const usr_phone = params['phone_number'];
        console.log("VCH access_token", access_token, usr_phone);
        this.tokenStorage.saveVippsToken(access_token);
        const amount = 1 // valuta NOK
        this.authService.sendVippsPayment(access_token,usr_phone,amount).subscribe({
          next: (response) => {
            if(response){
              const resp = response as any;
              console.log("VCheck response: ", resp)
            }
          },
          error: (err) => {
            console.log("Vcheck sendVippsPayment error: ",err)
          }
        });
        
      } else if (params['reference']){

      }
      

    });
  }

}
