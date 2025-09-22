import { Injectable } from '@angular/core';
import { NewFurniture } from './new_furniture';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  switchMap,
  of,
  catchError,
  shareReplay,
  lastValueFrom,
} from 'rxjs';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { SignedUrl } from '../../common/interface/signed_url';

export interface ModelMeta {
  file: File;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
}

@Injectable({
  providedIn: 'root',
})
export class FurnitureService {
  public readonly fileData$: Observable<ModelMeta | null>;
  private readonly file$ = new BehaviorSubject<File | undefined>(undefined);

  constructor(private http: HttpClient) {
    this.fileData$ = this.file$.asObservable().pipe(
      switchMap((file) => {
        if (!file) {
          return of(null);
        }
        return this.parseFile$(file);
      }),
      catchError((error): Observable<null> => {
        // TODO STORY-201 ERROR handler
        console.error('Hiba a fájl feldolgozása közben a szervizben:', error);
        return of(null);
      }),
      shareReplay(1)
    );
  }

  private parseFile$(file: File): Observable<ModelMeta> {
    return new Observable((observer) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const contents = event.target?.result as ArrayBuffer;
        if (!contents) {
          // TODO STORY-201 ERROR handler
          observer.error(new Error('A fájl olvasása sikertelen.'));
          return;
        }

        new GLTFLoader().parse(
          contents,
          '',
          (gltf) => {
            const box = new Box3().setFromObject(gltf.scene);
            const size = new Vector3();
            box.getSize(size);

            observer.next({
              file: file,
              sizeX: size.x,
              sizeY: size.y,
              sizeZ: size.z,
            });
            observer.complete();
          },
          (error) => observer.error(error)
        );
      };
      reader.onerror = (error) => observer.error(error);
      reader.readAsArrayBuffer(file);
    });
  }

  public setSelectedFile(file?: File): void {
    if (file) {
      this.file$.next(file);
    }
  }

  public unsetSelectedFile(): void {
    this.file$.next(undefined);
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
