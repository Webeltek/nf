import { HttpClient, HttpParams } from  '@angular/common/http';
import { HttpHeaders } from '@angular/common/http'; 

import { Injectable , Output, EventEmitter} from  '@angular/core';
import { PythEvent } from './calendar-week-view-hour-segment.component';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PythUser } from 'projects/demos/app/demo-app.component';
import { Room } from 'projects/demos/app/home/home.component';

@Injectable({
providedIn:  'root'
})
export class HttpEventService{
    private servicesUrl = "/api/services/events";
    private usersUrl = "/api/services/users"
    private insertUrl = "/api/services/insert";
    private deleteUrl = "/api/services/delete";
    private roomsUrl = "/api/services/rooms";
    private insertRoomUrl = "/api/services/insertroom";
    private deleteRoomUrl = "/api/services/deleteroom";
    private updateRoomsUrl = "/api/services/updaterooms";

    private baseurl = 'https://api.webeltek.org';

    @Output() addedEvent: EventEmitter<any> = new EventEmitter();

    @Output() deletedEvent: EventEmitter<any> = new EventEmitter();

    @Output() clickedEvent: EventEmitter<any> = new EventEmitter();

    roomNamesArr$ : BehaviorSubject<string[]> = new BehaviorSubject([])

    constructor(private http: HttpClient) { }

    httpHeaders = new HttpHeaders({
        'Content-Type' : 'application/json; charset=UTF-8',
        'Cache-Control': 'no-cache'
    });

    roptions = { headers : this.httpHeaders, observe: 'body', responseType : 'json'}

    getRooms(){
        return this.http.get(this.baseurl+this.roomsUrl,
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'})
    }

    insertRoom(room: Room ){
        this.http.post(this.baseurl+this.insertRoomUrl, room, 
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next: (response) =>{
                let roomNames : string[]=[];
                let mod_rooms=(response as any).mod_rooms;
                for (let room of mod_rooms){
                    roomNames.push(room.title);
                }
                this.roomNamesArr$.next(roomNames);
                this.addedEvent.emit(null);
                console.log("HttpServ insertRoom() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("HttpServ insertRoom() error : " + JSON.stringify(error)) ; }
                }
            )
    }

    deleteRoom(room : Room ){
        this.http.post(this.baseurl+this.deleteRoomUrl, room,
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next: (response) =>{
                    let roomNames : string[]=[];
                    let mod_rooms=(response as any).mod_rooms;
                    for (let room of mod_rooms){
                        roomNames.push(room.title);
                    }
                    this.roomNamesArr$.next(roomNames);
                    this.addedEvent.emit(null);
                    console.log("deleteEvent() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("deleteRoom() error : " + JSON.stringify(error)) ; }
            }
            )
    }

    updateRooms(roomTitles: string[] ){
        this.http.post(this.baseurl+this.updateRoomsUrl, roomTitles, 
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next: (response) =>{
                    let roomNames : string[]=[];
                    let mod_rooms=(response as any).mod_rooms;
                    for (let room of mod_rooms){
                        roomNames.push(room.title);
                    }
                    this.roomNamesArr$.next(roomNames);
                    console.log("HttpServ updateRooms() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("HttpServ updateRooms() error : " + JSON.stringify(error)) ; }
            }
            )
    }



    getEvents(){
        return this.http.get(this.baseurl+this.servicesUrl,
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'})
    }

    getUsers(){
        return this.http.get(this.baseurl+this.usersUrl,
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'})
    }

    insertEvent(pythEvent : PythEvent ){
    this.http.post(this.baseurl+this.insertUrl, pythEvent, 
        { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
        .subscribe({
            next: (response) =>{
                this.addedEvent.emit(pythEvent);
                console.log("addEvent() response: " + JSON.stringify(response));
            },
            error: (error) => { 
                console.log("addEvent() error : " + JSON.stringify(error)) ; }
            }
        )
    }

    deleteEvent(ids : number[] ){
        this.http.post(this.baseurl+this.deleteUrl, {numList: ids},
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next:(response) =>{
                    this.deletedEvent.emit(null);
                    console.log("deleteEvent() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("deleteEvent() error : " + JSON.stringify(error)) ; }
            })
    }

    private vippsAuthUrl = "/api/vipps/rp";
    private vippsAuthCbUrl = "/api/vipps/authz_cbvipps"
    //unused vippsRPHeaders
    vippsRPHeaders = new HttpHeaders({
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site' : 'same-origin',
        'Sec-Fetch-User' : '?1',
        'Upgrade-Insecure-Requests': '1'
    })

    vippsAuthorize(){
        console.log("HttpS vippsAthorize call")
        window.location.href = `https://api.webeltek.org/api/vipps/rp?is_checkout=False`
        /* return this.http.get(this.baseurl+this.vippsAuthUrl,
            { headers : this.vippsHeaders, observe: 'body', responseType : 'json'})
            .subscribe({
                next: (response)=>{
                    console.log("HttpS vippsAuthorize response",response);
                },
                error: (error) => { 
                    console.log("vippsAuthorize() error : " + JSON.stringify(error)) ; 
                }
            }) */
    }

    vippsCheckout(){
        console.log("HttpS vippsCheckout call");
        window.location.href = `https://api.webeltek.org/api/vipps/rp?is_checkout=True`
    }

}
