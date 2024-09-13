import { Injectable } from '@angular/core';
import { HttpClient, HttpParams,  } from '@angular/common/http';
import { Observable} from 'rxjs';
import { TenorResponse } from 'src/app/types/gif';

@Injectable({
  providedIn: 'root'
})
export class GifService {

    constructor(
        private http: HttpClient
    ) { }

    async getTopGifs(search: string, apiKey: string): Promise<Observable<TenorResponse>> {
        const url = "https://g.tenor.com/v1/search"
        const params = new HttpParams().append('key', apiKey).append('q', search);
        return this.http.get<TenorResponse>(url, {params: params});
    }
}
