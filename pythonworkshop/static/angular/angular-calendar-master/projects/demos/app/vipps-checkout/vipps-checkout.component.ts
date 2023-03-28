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
  msg = 'awaiting payment start';

  constructor(private actRoute: ActivatedRoute,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private authService: AuthService) { }

  ngOnInit(): void {
    this.actRoute.queryParams.subscribe(params=>{
      let usr_phone = '';
      if (params['access_token'] && params['usr_phone']){
        const access_token = params['access_token'];
        usr_phone = params['usr_phone'];
        console.log("VCH access_token", access_token, usr_phone);
        this.tokenStorage.saveVippsUsrToken(access_token);

        this.authService.sendGetMerchAccTkn().subscribe((response)=>{
          if (response && response['access_token']){
            let resp = response as any;
            let merch_access_tkn = resp.access_token;

            const amount = 2 // valuta NOK
            this.authService.sendVippsPayment(merch_access_tkn,usr_phone,amount).subscribe({
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
          }
        })
        
      } else if (params['reference']==='abcc123'){
        this.msg = 'payment success!';
      }
      

      });
  }

}
