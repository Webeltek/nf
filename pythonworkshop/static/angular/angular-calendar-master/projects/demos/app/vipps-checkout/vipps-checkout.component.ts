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
  customerPhone = "";
  access_tkn = "";


  constructor(private actRoute: ActivatedRoute,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private authService: AuthService) { }

  ngOnInit(): void {
    this.actRoute.queryParams.subscribe(params=>{
      if (params['usr_phone']){
        const customerPhone = params['usr_phone'];

        this.authService.sendGetMerchAccTkn().subscribe((response)=>{
          if (response && response['access_token']){
            let resp = response as any;
            this.access_tkn = resp.access_token;

            const amount = "4000" // valuta NOK with 00 suffix for øre
            this.authService.sendVippsPayment(this.access_tkn,customerPhone,amount).subscribe({
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
      } else if(params['reference']){
        this.authService.queryVippsPayment(params['reference']).subscribe({
          next : (queryResponse) =>{
            const queryResp = queryResponse as any;
            console.log("VCheck queryResp: ",queryResponse);
            if (queryResp.state === "AUTHORIZED"){
                this.paymentState = "AUTHORIZED";
                this.paymentAmount = queryResp.amount.value;
                const sub  = queryResp.profile.sub;
                this.msg = this.paymentAmount + " is " + this.paymentState + "to user with phoneNum:";
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
