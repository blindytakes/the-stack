import { recordApiDuration, recordApiError } from '@/lib/metrics';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('the-stack');

function toSeverity(level: 'info' | 'warn' | 'error') {
  if (level === 'error') {
    return { severityText: 'ERROR', severityNumber: SeverityNumber.ERROR };
  }
  if (level === 'warn') {
    return { severityText: 'WARN', severityNumber: SeverityNumber.WARN };
  }
  return { severityText: 'INFO', severityNumber: SeverityNumber.INFO };
}

export async function instrumentedApi<T>(
  route: string,
  method: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await handler();
    const statusCode =
      typeof result === 'object' && result !== null && 'status' in result
        ? Number((result as { status?: number }).status ?? 200)
        : 200;

    if (statusCode >= 500) {
      recordApiError(route, 'Http5xxResponse');
    }
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const { severityText, severityNumber } = toSeverity(logLevel);
    logger.emit({
      body: JSON.stringify({
        type: 'api_request',
        route,
        method,
        status: statusCode,
        duration_ms: Math.round(performance.now() - start)
      }),
      severityText,
      severityNumber
    });
    recordApiDuration(route, method, statusCode, performance.now() - start);
    return result;
  } catch (error) {
    recordApiError(route, error instanceof Error ? error.name : 'UnknownError');
    recordApiDuration(route, method, 500, performance.now() - start);
    logger.emit({
      body: JSON.stringify({
        type: 'api_exception',
        route,
        method,
        error_name: error instanceof Error ? error.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : String(error)
      }),
      severityText: 'ERROR',
      severityNumber: SeverityNumber.ERROR
    });
    throw error;
  }
}
