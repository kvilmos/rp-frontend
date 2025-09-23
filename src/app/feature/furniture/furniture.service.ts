import { Injectable } from '@angular/core';
import { NewFurniture } from './new_furniture';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, lastValueFrom } from 'rxjs';
import { SignedUrl } from '../../common/interface/signed_url';
import { ObjectData } from './object_data';

@Injectable({
  providedIn: 'root',
})
export class FurnitureService {
  private readonly file$ = new BehaviorSubject<File | null>(null);
  private readonly objectData$ = new BehaviorSubject<ObjectData | null>(null);
  private readonly thumbnails$ = new BehaviorSubject<string[]>([]);

  constructor(private http: HttpClient) {}

  public getFile(): Observable<File | null> {
    return this.file$.asObservable();
  }

  public getObjectData(): Observable<ObjectData | null> {
    return this.objectData$.asObservable();
  }

  public getThumbnails(): Observable<string[]> {
    return this.thumbnails$.asObservable();
  }

  public setFile(file: File): void {
    this.file$.next(file);
  }

  public resetFile(): void {
    this.file$.next(null);
  }

  public setObjectData(meta: ObjectData | null): void {
    this.objectData$.next(meta);
  }

  public pushThumbnail(imageUrl: string): void {
    const images = this.thumbnails$.getValue();
    if (images) {
      this.thumbnails$.next([...images, imageUrl]);
    }
  }

  public unsetThumbnail(imageUrl: string): void {
    const currentImages = this.thumbnails$.getValue();
    const newImages = currentImages.filter((url) => url !== imageUrl);
    this.thumbnails$.next(newImages);
  }

  public resetThumbnails(): void {
    this.thumbnails$.next([]);
  }

  public async createFurniture(furniture: NewFurniture): Promise<void> {
    const file = this.file$.getValue();
    if (!file) {
      //TODO STORY-201 ERROR HANDLER
      console.error('Nincs kiválasztva fájl a feltöltéshez.');
      return;
    }

    try {
      const uploadUrl = await lastValueFrom(this.requestCreateFurniture(furniture));
      console.log('Presigned URL sikeresen lekérve:', uploadUrl);

      this.uploadFile(uploadUrl.url, file).subscribe({
        next: (progress) => {
          //TODO STORY-201 ERROR HANDLER
          console.log(`Feltöltési folyamat: ${progress}%`);
        },
        error: (error) => {
          //TODO STORY-201 ERROR HANDLER
          console.error('Hiba történt a fájl feltöltése során.', error);
        },
        complete: () => {
          //TODO STORY-201 ERROR HANDLER
          console.log('A fájl feltöltése sikeresen befejeződött.');
        },
      });
    } catch (error) {
      //TODO STORY-201 ERROR HANDLER
      console.error('Hiba történt a presigned URL lekérése során.', error);
    }
  }

  private requestCreateFurniture(furniture: NewFurniture): Observable<SignedUrl> {
    return this.http.post<SignedUrl>('/api/furniture', furniture);
  }

  private uploadFile(url: string, file: File): Observable<number> {
    return new Observable<number>((observer) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        console.log('progress', event);
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          observer.next(percentComplete);
        }
      });

      xhr.addEventListener('load', (event) => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('load', event);
          observer.next(100);
          observer.complete();
        } else {
          //TODO STORY-201 ERROR HANDLER
          observer.error(new Error(`Szerverhiba: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        //TODO STORY-201 ERROR HANDLER
        observer.error(new Error('Hálózati hiba történt a feltöltés során.'));
      });

      xhr.open('PUT', url, true);
      xhr.send(file);

      return () => xhr.abort();
    });
  }
}
