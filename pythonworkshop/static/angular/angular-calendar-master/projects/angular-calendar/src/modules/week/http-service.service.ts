import { HttpClient, HttpParams } from  '@angular/common/http';
import { HttpHeaders } from '@angular/common/http'; 

import { Injectable , Output, EventEmitter} from  '@angular/core';
import { PythEvent } from './calendar-week-view-hour-segment.component';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PythUser } from 'projects/demos/app/demo-app.component';
import { Book, Room } from 'projects/demos/app/home/home.component';

@Injectable({
providedIn:  'root'
})
export class HttpEventService{
    private servicesUrl = "/api/services/events";
    private usersUrl = "/api/services/users"
    private insertUrl = "/api/services/insert";
    private updateUrl = "/api/services/update";
    private deleteUrl = "/api/services/delete";
    private roomsUrl = "/api/services/rooms";
    private insertRoomUrl = "/api/services/insertroom";
    private deleteRoomUrl = "/api/services/deleteroom";
    private updateRoomsUrl = "/api/services/updaterooms";

    private booksUrl = "/api/services/books";
    private insertBookUrl = "/api/services/insertbook";
    private deleteBookUrl = "/api/services/deletebook";
    private updateBooksUrl = "/api/services/updatebooks";

    private baseurl = 'https://192.168.3.225';

    @Output() modifiedEvent: EventEmitter<any> = new EventEmitter();

    @Output() clickedEvent: EventEmitter<any> = new EventEmitter();

    @Output() modifiedPaymnt : EventEmitter<any> = new EventEmitter();

    booksArr$ : BehaviorSubject<string[]> = new BehaviorSubject([]);

    roomsArr$ : BehaviorSubject<string[]> = new BehaviorSubject([])

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
                let rooms : string[]=[];
                let mod_rooms=(response as any).mod_rooms;
                for (let room of mod_rooms){
                    rooms.push(room.title);
                }
                this.roomsArr$.next(rooms);
                this.modifiedEvent.emit(rooms);
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
                    let rooms : string[]=[];
                    let mod_rooms=(response as any).mod_rooms;
                    for (let room of mod_rooms){
                        rooms.push(room.title);
                    }
                    this.roomsArr$.next(rooms);
                    this.modifiedEvent.emit(rooms);
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
                    if(response.hasOwnProperty("mod_rooms")){
                        let rooms : string[]=[];
                        let mod_rooms=(response as any).mod_rooms;
                        for (let room of mod_rooms){
                            rooms.push(room.title);
                        }
                    this.roomsArr$.next(rooms);
                    console.log("HttpServ updateRooms() response: " + JSON.stringify(response));
                    }
                },
                error: (error) => { 
                    console.log("HttpServ updateRooms() error : " + JSON.stringify(error)) ; }
            }
            )
    }

    getBooks(){
        return this.http.get(this.baseurl+this.booksUrl,
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'})
    }

    insertBook(book: Book ){
        this.http.post(this.baseurl+this.insertBookUrl, book, 
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next: (response) =>{
                let books : string[]=[];
                let mod_books=(response as any).mod_books;
                for (let book of mod_books){
                    books.push(book.title);
                }
                this.booksArr$.next(books);
                this.modifiedEvent.emit(books);
                //console.log("HttpServ insertBook() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("HttpServ insertBook() error : " + JSON.stringify(error)) ; }
                }
            )
    }

    deleteBook(book : Book ){
        this.http.post(this.baseurl+this.deleteBookUrl, book,
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next: (response) =>{
                    let books : string[]=[];
                    let mod_books=(response as any).mod_books;
                    for (let book of mod_books){
                        books.push(book.title);
                    }
                    this.booksArr$.next(books);
                    this.modifiedEvent.emit(books);
                    //console.log("deleteBook() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("deleteBook() error : " + JSON.stringify(error)) ; }
            }
            )
    }

    updateBooks(bookTitles: string[] ){
        this.http.post(this.baseurl+this.updateBooksUrl, bookTitles, 
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            .subscribe({
                next: (response) =>{
                    let books : string[]=[];
                    let mod_books=(response as any).mod_books;
                    for (let book of mod_books){
                        books.push(book.title);
                    }
                    this.booksArr$.next(books);
                    console.log("HttpServ updateBooks() response: " + JSON.stringify(response));
                },
                error: (error) => { 
                    console.log("HttpServ updateBooks() error : " + JSON.stringify(error)) ; }
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
        return this.http.post(this.baseurl+this.insertUrl, pythEvent, 
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} )
    }

    updateEvent(uid: string,
        user_id : string,
        startmills : number,
        endmills : number,
        roomname : string ){
        return this.http.get(this.baseurl+this.updateUrl, { 
            headers : this.httpHeaders,
            observe : 'body', 
            responseType : 'json', 
            params : {
                'uid' : uid ,
                'user_id': user_id,
                'startmills' : startmills , 
                'endmills' : endmills,
                'roomname': roomname
            }
          });
        }

    deleteEvent(uids : string[],user_id:number){
        console.log("HS deleteEvent uids",uids)
        return this.http.post(this.baseurl+this.deleteUrl, {uidList: uids,user_id:user_id},
            { headers : this.httpHeaders, observe: 'body', responseType : 'json'} ) 
            
    }

    generateUniqueID( digit = 1000 ) {
        return new Date().getTime().toString(16) + Math.floor( digit * Math.random() ).toString(16)
    }

    generatePythEvent( genPythEvtParams : 
        {   user_id: number,
            title: string,
            paymntref : string,
            bookname: string,
            roomname: string,
            startmills : number, // object type converted to any
            endmills: number,    // object type converted to any
            ou : string,
            color: "blue"  }){       
        const uniqueId = this.generateUniqueID();
        //console.log("hourSegment loggedInUserId : " + this.loggedInUserId);
        const pythEvt : PythEvent={
            uid: uniqueId,
            user_id: genPythEvtParams.user_id,
            title: genPythEvtParams.title,
            paymntref: genPythEvtParams.paymntref,
            bookname: genPythEvtParams.bookname,
            roomname: genPythEvtParams.roomname,
            ou : genPythEvtParams.ou,
            startmills: genPythEvtParams.startmills,
            endmills: genPythEvtParams.endmills,
            color: genPythEvtParams.color
        };
        return this.insertEvent(pythEvt);
    }
    
    updatePythEvent(uid: string,user_id:string,startmills : number,
        endmills : number,roomname : string){
        return this.updateEvent(uid,user_id,startmills,endmills,roomname)
    }
}
