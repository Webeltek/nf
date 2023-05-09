import { Component, OnInit ,ViewChild } from '@angular/core';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
import { BreakpointObserver } from '@angular/cdk/layout';
import { delay } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '../_services/auth.service';


@UntilDestroy()
@Component({
  selector: 'mwl-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {
  constructor( private BPobserver: BreakpointObserver,
    public authService: AuthService){}

  isDesktop = false;

  @ViewChild('ngcarousel', { static: true }) ngCarousel!: NgbCarousel;
  ngOnInit() {
    
  }

  ngAfterViewInit(){
    this.BPobserver
          .observe(['(min-width: 992px)'])
          .pipe(delay(1), untilDestroyed(this))
          .subscribe((res) => {
              this.isDesktop=true;
              if (!res.matches){
                this.isDesktop = false;
              }
          });
  }

  vippsCheckout(){
    this.authService.vippsCheckout()
  }

  // Move to specific slide
  navigateToSlide(item: any) {
    this.ngCarousel.select(item);
    console.log(item);
  }
  // Move to previous slide
  getToPrev() {
    this.ngCarousel.prev();
  }
  // Move to next slide
  goToNext() {
    this.ngCarousel.next();
  }
  // Pause slide
  stopCarousel() {
    this.ngCarousel.pause();
  }
  // Restart carousel
  restartCarousel() {
    this.ngCarousel.cycle();
  }

}
