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
  paymentAmount = "";
  paymentState = "";
  customerEmail = "";


  constructor(private actRoute: ActivatedRoute,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private authService: AuthService) { }

  ngOnInit(): void {
    this.actRoute.queryParams.subscribe(params=>{
      let usr_phone = '';
      if (params['usr_phone']){
        usr_phone = params['usr_phone'];
        console.log("VCH usr_phone", usr_phone);

        this.authService.sendGetMerchAccTkn().subscribe((response)=>{
          if (response && response['access_token']){
            let resp = response as any;
            let merch_access_tkn = resp.access_token;

            const amount = "4000" // valuta NOK with 00 suffix for øre
            this.authService.sendVippsPayment(merch_access_tkn,usr_phone,amount).subscribe({
              next: (response) => {
                if(response){
                  const resp = response as any;
                  const redirectUrl = resp.redirectUrl
                  if (redirectUrl){
                    window.location.href = redirectUrl;
                  }
                  console.log("VCheck response: ", resp)
                  
                };
              },
              error: (err) => {
                console.log("Vcheck sendVippsPayment error: ",err)
              }
            });
          }
        })
        
      } else if(params['redirectUrl']) {
        const redirectUrl = params['redirectUrl']
        this.authService.sendVippsRedirect(redirectUrl);
      } else if(params['reference']){
        this.authService.queryVippsPayment(params['reference']).subscribe({
          next : (queryResponse) =>{
            const queryResp = queryResponse as any;
            console.log("VCheck queryResp: ",queryResponse);
            if (queryResp.state === "AUTHORIZED"){
                this.paymentState = "AUTHORIZED";
                this.paymentAmount = queryResp.amount.value;
                this.customerEmail = queryResp.sub.email;
                this.msg = this.paymentAmount + " is " + this.paymentState + this.customerEmail;
            }
          },
          error: (err) => {
            console.log("Vcheck sendVippsPayment error: ",err)
          }  
        });
      }
      

      });
  }

}
