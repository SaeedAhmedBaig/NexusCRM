const {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} = require('@nestjs/common');
const { Observable } = require('rxjs');
const { tap } = require('rxjs/operators');

/**
 * Attaches tenantId to the request for downstream services.
 * Future CRM modules should read req.tenantId for query scoping.
 */
@Injectable()
class TenantScopeInterceptor {
  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (tenantId) {
      request.tenantScope = { tenantId };
    }

    return next.handle().pipe(
      tap(() => {
        /* hook for audit logging per tenant */
      }),
    );
  }
}

module.exports = { TenantScopeInterceptor };
