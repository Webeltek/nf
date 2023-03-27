import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'mwl-vipps-checkout',
  templateUrl: './vipps-checkout.component.html',
  styleUrls: ['./vipps-checkout.component.scss']
})
export class VippsCheckoutComponent implements OnInit {

  constructor(private actRoute: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.actRoute.queryParams.subscribe(params=>{
      let access_token = params['access_token'];
      console.log("VCH access_token", access_token);
    });
  }

}
