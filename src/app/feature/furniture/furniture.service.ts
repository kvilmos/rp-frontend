import { inject, Injectable } from '@angular/core';
import { NewFurniture } from './new_furniture';
import { Observable, BehaviorSubject, lastValueFrom, last, forkJoin, combineLatest } from 'rxjs';
import { ObjectData } from './object_data';
import { FurnitureThumbnail } from './furniture_thumbnail';
import { FurnitureApiService } from '../../api/furniture-api.service';

interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

@Injectable({ providedIn: 'root' })
export class FurnitureService {
  private readonly file = new BehaviorSubject<File | null>(null);
  public readonly file$ = this.file.asObservable();
  private readonly objectData = new BehaviorSubject<ObjectData | null>(null);
  public readonly objectData$ = this.objectData.asObservable();
  private readonly selectedThumbnail = new BehaviorSubject<FurnitureThumbnail | null>(null);
  public readonly selectedThumbnail$ = this.selectedThumbnail.asObservable();

  private readonly _isUploading = new BehaviorSubject<boolean>(false);
  public readonly isUploading$ = this._isUploading.asObservable();
  private readonly _uploadProgress = new BehaviorSubject<number>(0);
  public readonly uploadProgress$ = this._uploadProgress.asObservable();

  private readonly furnitureApi = inject(FurnitureApiService);
  constructor() {}

  public setFile(file: File | null): void {
    this.file.next(file);
  }

  public setObjectData(meta: ObjectData | null): void {
    this.objectData.next(meta);
  }

  public setThumbnail(thumbnail: FurnitureThumbnail | null): void {
    this.selectedThumbnail.next(thumbnail);
  }

  public async createFurniture(furniture: NewFurniture): Promise<void> {
    const modelFile = this.file.getValue();
    const thumbnail = this.selectedThumbnail.getValue();

    if (!modelFile) {
      throw new Error('fileNotFound');
    }
    if (!thumbnail) {
      throw new Error('thumbnailNotFound');
    }

    this._isUploading.next(true);
    this._uploadProgress.next(0);

    try {
      const uploadUrls = await lastValueFrom(this.furnitureApi.requestCreateFurniture(furniture));
      const thumbnailBlob = await this.dataUrlToBlob(thumbnail.imageSrc);

      const modelSize = modelFile.size;
      const thumbnailSize = thumbnailBlob.size;
      const totalUploadSize = modelSize + thumbnailSize;

      const modelProgress$ = this.uploadFile(uploadUrls.objectUrl, modelFile);
      const thumbnailProgress$ = this.uploadFile(uploadUrls.thumbnailUrl, thumbnailBlob);

      const progressSubscription = combineLatest([modelProgress$, thumbnailProgress$]).subscribe(
        ([modelProg, thumbProg]) => {
          const totalBytesLoaded = modelProg.loaded + thumbProg.loaded;

          const weightedPercent = Math.round((totalBytesLoaded / totalUploadSize) * 100);

          this._uploadProgress.next(weightedPercent);
        }
      );

      const modelCompletion$ = modelProgress$.pipe(last());
      const thumbnailCompletion$ = thumbnailProgress$.pipe(last());

      await lastValueFrom(forkJoin([modelCompletion$, thumbnailCompletion$]));

      progressSubscription.unsubscribe();
    } catch (error) {
      throw new Error('uploadingFailed');
    } finally {
      this._isUploading.next(false);
      this._uploadProgress.next(100);
    }
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  private uploadFile(url: string, file: File | Blob): Observable<UploadProgress> {
    return new Observable<UploadProgress>((observer) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          observer.next({
            loaded: event.loaded,
            total: event.total,
            percent: percentComplete,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          observer.next({
            loaded: file.size,
            total: file.size,
            percent: 100,
          });
          observer.complete();
        } else {
          const error = new Error(`ServerError: ${xhr.status}`);
          observer.error(error);
        }
      });

      xhr.addEventListener('error', (event) => {
        const error = new Error(`ServerError: ${event}`);
        observer.error(error);
      });

      xhr.open('PUT', url, true);
      xhr.send(file);

      return () => xhr.abort();
    });
  }

  public reset(): void {
    this.setFile(null);
    this.setThumbnail(null);
    this.setObjectData(null);
  }
}
