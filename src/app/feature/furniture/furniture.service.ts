import { inject, Injectable } from '@angular/core';
import { NewFurniture } from './new_furniture';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  lastValueFrom,
  last,
  map,
  catchError,
  of,
  forkJoin,
} from 'rxjs';
import { ObjectData } from './object_data';
import { FurnitureThumbnail } from './furniture_thumbnail';
import { FurnitureUrls } from '../../common/interface/furniture_urls';

interface UploadResult {
  source: string;
  success: boolean;
  error?: any;
}
@Injectable({
  providedIn: 'root',
})
export class FurnitureService {
  private readonly file = new BehaviorSubject<File | null>(null);
  private readonly objectData = new BehaviorSubject<ObjectData | null>(null);
  private readonly thumbnails = new BehaviorSubject<FurnitureThumbnail[]>([]);

  private readonly http = inject(HttpClient);
  constructor() {}

  public getFile(): Observable<File | null> {
    return this.file.asObservable();
  }

  public getObjectData(): Observable<ObjectData | null> {
    return this.objectData.asObservable();
  }

  public getThumbnails(): Observable<FurnitureThumbnail[]> {
    return this.thumbnails.asObservable();
  }

  public setFile(file: File): void {
    this.file.next(file);
  }

  public resetFile(): void {
    this.file.next(null);
  }

  public setObjectData(meta: ObjectData | null): void {
    this.objectData.next(meta);
  }

  public pushThumbnail(thumbnail: FurnitureThumbnail): void {
    const thumbnails = this.thumbnails.getValue();
    if (thumbnails) {
      this.thumbnails.next([...thumbnails, thumbnail]);
    }
  }

  public unsetThumbnail(id: string): void {
    const currentThumbnails = this.thumbnails.getValue();
    const newImages = currentThumbnails.filter((thumbnail) => thumbnail.id !== id);
    this.thumbnails.next(newImages);
  }

  public resetThumbnails(): void {
    this.thumbnails.next([]);
  }

  public async createFurniture(furniture: NewFurniture): Promise<void> {
    const modelFile = this.file.getValue();
    const thumbnails = this.thumbnails.getValue();

    if (!modelFile) {
      console.error('Nincs fő modell fájl a feltöltéshez.');
      // TODO STORY-201 ERROR HANDLER
      return;
    }
    if (thumbnails.length === 0) {
      console.error('Nincsenek bélyegképek a feltöltéshez.');
      // TODO STORY-201 ERROR HANDLER
      return;
    }

    try {
      const uploadUrls = await lastValueFrom(this.requestCreateFurniture(furniture));

      const thumbnail = thumbnails[0];
      const thumbnailBlob = await this.dataUrlToBlob(thumbnail.imageSrc);

      const allUploads$: Observable<UploadResult>[] = [];
      const modelUpload$ = this.uploadFile(uploadUrls.objectUrl, modelFile).pipe(
        last(),
        map(() => ({ source: 'main_model', success: true })),
        catchError((error) => of({ source: 'main_model', success: false, error }))
        // TODO STORY-201 ERROR HANDLER
      );
      allUploads$.push(modelUpload$);
      const thumbnailUpload$ = this.uploadFile(uploadUrls.thumbnailUrl, thumbnailBlob).pipe(
        last(),
        map(() => ({ source: thumbnail.id, success: true })),
        catchError((error) => of({ source: thumbnail.id, success: false, error }))
        // TODO STORY-201 ERROR HANDLER
      );
      allUploads$.push(thumbnailUpload$);

      const uploadResults = await lastValueFrom(forkJoin(allUploads$));
      const failedUploads = uploadResults.filter((result) => !result.success);
      if (failedUploads.length > 0) {
        // TODO STORY-201 ERROR HANDLER
        return;
      }
    } catch (error) {
      // TODO STORY-201 ERROR HANDLER
    }
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  private requestCreateFurniture(furniture: NewFurniture): Observable<FurnitureUrls> {
    return this.http.post<FurnitureUrls>('/api/furniture', furniture);
  }

  private uploadFile(url: string, file: File | Blob): Observable<number> {
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
