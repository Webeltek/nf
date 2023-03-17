import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../_services/token-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public tokenStorage: TokenStorageService,) { }

  ngOnInit(): void {
  }

  editOuEvents(){

  }

  editEvents(){

  }

  editRooms(){

  }

  logout(){

  }

}
