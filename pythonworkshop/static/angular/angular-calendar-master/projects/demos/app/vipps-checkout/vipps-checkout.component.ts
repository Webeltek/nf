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
  merch_access_tkn = "";
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';


  constructor(private actRoute: ActivatedRoute,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private authService: AuthService) { }

  ngOnInit(): void {

    this.actRoute.queryParams.subscribe(params=>{
      if (params['username'] && params['bookname'] && params['vipps_sub'] && params['usr_phone']){
        const customerPhone = params['usr_phone'];
        this.authService.login({
          provider:"vipps",
          username: params['username'], 
          vipps_sub: params['vipps_sub']
        }).subscribe({
                next: (data) => {
                  let dataObj = data as any;
                  console.log("VCH dataObj.user:",dataObj.user)
                  if (dataObj.user!== 'nonexistent'){
                    let accessToken : string= dataObj.user.access_token ;
                    this.tokenStorage.saveToken(accessToken);
                    this.tokenStorage.saveUser(dataObj.user);
                    this.isLoginFailed = false;
                    this.isLoggedIn = true;
                    
                  } else if(dataObj.user === 'nonexistent'){
                    this.errorMessage = "LCwrongUserPass";
                    this.isLoginFailed = true;
                  }
                  
                  this.authService.sendGetMerchAccTkn().subscribe((response)=>{
                    if (response && response['access_token']){
                      let resp = response as any;
                      this.tokenStorage.saveVippsMerchToken( resp.access_token);
          
                      let amount="0";
                      
                      if(params['bookname']==="Drop-in"){
                        amount="4000"// valuta NOK with 00 suffix for øre
                      } else if(params['bookname']==="Kontor") amount="40000";

                      this.authService.sendVippsPayment(resp.access_token,customerPhone,amount,params['bookname']).subscribe({
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
                  });
                },
                error: err => {
                  this.errorMessage = err.error.message;
                  this.isLoginFailed = true;
                }
        });

        
      } else if(params['reference'] && params['bookname']){
        this.authService.queryVippsPayment(params['reference']).subscribe({
          next : (queryResponse) =>{
            const queryResp = queryResponse as any;
            console.log("VCheck queryResp: ",queryResponse);
            if (queryResp.state === "AUTHORIZED"){
                this.paymentState = "AUTHORIZED";
                this.paymentAmount = queryResp.amount.value;
                const vipps_sub  = queryResp.profile.sub;
                if (vipps_sub){
                  const paymnt = {
                    reference : params['reference'],
                    vipps_sub : vipps_sub,
                    paymentState : this.paymentState,
                    paymentAmount : this.paymentAmount,
                    bookname : params['bookname']
                  }
                  const user_id = this.tokenStorage.getUser().id;
                  this.authService.dbSaveVippsPayment(
                    paymnt.reference,user_id,paymnt.vipps_sub,
                    paymnt.paymentAmount,
                    paymnt.bookname).subscribe((respObj)=>{
                      if (respObj){
                        const resp = respObj as any;
                        console.log("VC save paymnt resp: ",resp);
                        this.router.navigate(['calendar']);
                      }
                    })
                }
                this.msg = this.paymentAmount + " is " + this.paymentState;
            }
          },
          error: (err) => {
            console.log("Vcheck sendVippsPayment error: ",err)
          }  
        });
      }
      

      });
  }

  loginVippsAuthzdUser(vipps_sub : string, merch_access_tkn: string){
      this.authService.getVippsUserinfo(vipps_sub,merch_access_tkn).subscribe({
        next : (data) => {
          if (data){
            const dataObj = data as any;
            const username = dataObj.email;
            const vipps_sub = dataObj.sub;
            this.router.navigate(['calendar']);
          }
        },
        error : err => {
          this.errorMessage = err.error.message;
        }
      });
      
  }

}
