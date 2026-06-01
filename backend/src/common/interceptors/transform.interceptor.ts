import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transform(data))
    );
  }

  private transform(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Check for Date objects or objects without enumerable properties (like Date instances)
    if (
      Object.prototype.toString.call(data) === '[object Date]' || 
      (data && typeof data.getTime === 'function') ||
      (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0 && Object.getPrototypeOf(data) !== Object.prototype)
    ) {
      return data;
    }

    // Handle Array
    if (Array.isArray(data)) {
      return data.map(item => this.transform(item));
    }

    // Handle Object
    if (typeof data === 'object') {
      // Check if it's a Prisma Decimal object (keys: s, e, d)
      if (
        data.hasOwnProperty('s') && 
        data.hasOwnProperty('e') && 
        data.hasOwnProperty('d') && 
        Array.isArray(data.d)
      ) {
        // Convert to Number
        return Number(data.toString ? data.toString() : data);
      }

      // Recursively transform object properties
      const result: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          result[key] = this.transform(data[key]);
        }
      }
      return result;
    }

    return data;
  }
}
